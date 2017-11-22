const Jwt = require("jsonwebtoken");

const crypto = require("../crypto.js");
const helpers = require("../helpers.js");

const User = require('../models/user-model');
const Task = require('../models/task-model');
const Service = require('../models/service-model');

const picurePath = "./public/images/users/";
const publicPicurePath = "/images/users/";

exports.get = (req, res) => {
    User.get(null).then(users => {
        res.send("<pre>" + JSON.stringify(users, null, 4) + "</pre>"); //formatting to easy reading
    });
};

exports.login = (req, res) => {

    let json;

    try {
        json = JSON.parse(req.body.data);
    } catch (err) {
        return res.status(400).send({ "error": "Please, review your json data!" });
    }

    let errorJson = { "error": "Invalid username or password" };

    if (json.email === undefined || json.password === undefined) {
        return res.status(400).send(errorJson);
    }

    User.get({ email: json.email }).then(retrievedUser => {

        if (retrievedUser === null || retrievedUser.length <= 0) {
            return res.status(401).send(errorJson);
        }

        retrievedUser = retrievedUser[0];

        if (!retrievedUser || json.password !== crypto.decrypt(retrievedUser.password)) {
            return res.status(401).send(errorJson);
        }

        let tokenData = {
            id: retrievedUser._id,
            email: retrievedUser.email,
            type: retrievedUser.type
        };//we can have more information inside this token

        let taskQuery = {};

        if (retrievedUser.type === "professional") {
            taskQuery.tasker = retrievedUser._doc._id.toString();

            //remove non professional stuff
            //delete retrievedUser._doc.address;

        } else {
            taskQuery.client = retrievedUser._doc._id.toString();

            //remove profession stuff from this client response
            delete retrievedUser._doc.reviews;
            delete retrievedUser._doc.services;
            delete retrievedUser._doc.location;
            delete retrievedUser._doc.rate_hour;
            delete retrievedUser._doc.reviews;
            delete retrievedUser._doc.total_tasks;
        }

        //remove password and id from response
        //delete retrievedUser._doc._id;
        delete retrievedUser._doc.password;
        
        if (retrievedUser.picture !== undefined){   
            retrievedUser.picture = publicPicurePath + retrievedUser.picture;
        }

        if (retrievedUser.reviews !== undefined) {
            retrievedUser.reviews.map(review => {
                review.picture = publicPicurePath + review.picture;
            });
        }

        let arrPromises = [];

        //pegar os servicos
        arrPromises.push(
            new Promise((resolve, reject) => {
                Service.get(null).then(result => {
                    resolve({ services: result });
                }).catch(err => {
                    reject(err);
                });
            })
        );

        //pegar as tasks
        arrPromises.push(
            new Promise((resolve, reject) => {
                Task.get(taskQuery).then(result => {
                    resolve({ tasks: result });
                }).catch(err => {
                    reject(err);
                });
            })
        );

        //criar um objeto resposta
        let response = {
            token: Jwt.sign(tokenData, crypto.privateKey),
            profile: retrievedUser
        };

        Promise.all(arrPromises).then((promiseResults) => {

            //unir o json de servicos e task a resposta
            promiseResults.map(pResult => {
                let key = Object.keys(pResult)[0];
                response[key] = pResult[key];
            });

            res.json(response);

        }).catch(err => {
            res.status(500).send(err.message);
        });


    }).catch(() => {
        res.status(500).send(errorJson);
    });

};

exports.saveProfile = (req, res) => {

    let data, token;

    try {
        data = JSON.parse(req.body.data);
        if (data.profile === undefined) {
            throw new Error();
        }
        if (data.token !== undefined) {
            token = Jwt.verify(data.token, crypto.privateKey);
        }
    } catch (err) {
        return res.status(400).send({ "error": "Please, review your json data!" });
    }

    let profile = getProfileFromJson(data.profile);

    if (profile === false) {
        return res.status(400).send({ "error": "Please, fill all required fields!" });
    }

    let user;

    if (token === undefined) { //new user

        User.get({ email: profile.email }).then(retrievedUser => {

            if (retrievedUser !== null && retrievedUser.length > 0) {
                return res.status(403).send({ "error": "This email is already in use." });
            }

            user = new User(profile);

            helpers.savePicture(picurePath, profile.picture).then(filename => {
                if (filename !== "") {
                    user.picture = filename;
                }
                return user;
            })
                .then(user => {
                    user.save(err => {
                        if (err) {
                            return res.status(500).send(err.message);
                        }
                        res.json({ "message": "Success!" });
                    });
                });

        }).catch(err => {
            res.status(500).send(err.message);
        });

    } else { //update user

        User.get({ _id: token.id }).then(retrievedUser => {

            if (retrievedUser === null || retrievedUser.length <= 0) {
                return res.status(401).send({ "error": "Please, sign in again." });
            }

            user = retrievedUser[0];

            User.get({ email: profile.email }).then(userEmail => {

                if (userEmail === null || userEmail.length > 0) {
                    if (userEmail[0]._id.toString() !== token.id) {
                        return res.status(403).send({ "error": "This email is already in use." });
                    }
                }

                //atualizar os campos do usuario encontrado
                Object.keys(profile).map(field => {
                    user[field] = profile[field];
                });

                helpers.savePicture(picurePath, profile.picture).then(filename => {
                    if (filename !== "") {
                        user.picture = filename;
                    } else {
                        if (profile.picture === "") {
                            user.picture = "";
                        }
                    }
                    return user;
                })
                    .then(user => {
                        user.save(err => {
                            if (err) {
                                return res.status(500).send(err.message);
                            }
                            res.json({ "message": "Success!" });
                        });
                    });

            }).catch(err => {
                res.status(500).send(err.message);
            });

        }).catch(err => {
            res.status(500).send(err.message);
        });
    }

};

exports.searchProfessionals = (req, res) => {

    let data;            
    let user_lat, user_lon;
    
    try {
        data = JSON.parse(req.body.data);

        if (data.token !== undefined) {
            Jwt.verify(data.token, crypto.privateKey);
        }

        user_lat = data.location[0];
        user_lon = data.location[1];

    } catch (err) {
        return res.status(400).send({ "error": "Please, review your json data!" });
    }

    if (data.service === undefined) {
        return res.status(400).send({ "error": "Please, review your json data!" });
    }

    let query = {
        "services.service": data.service,
        type: "professional",
        location: {
            $nearSphere: {
                $geometry: {
                    type: "Point",
                    coordinates: [data.location[0], data.location[1]]
                },
                $maxDistance: 100000
            }
        }
    };

    User.get(query).then(retrievedProfessionals => {

        let response = [];

        retrievedProfessionals.map(professional => {

            let listProfessional = false;

            let professional_lat = professional.location.coordinates[0];
            let professional_lon = professional.location.coordinates[1];

            if (professional._doc.picture !== undefined){   
                professional._doc.picture = publicPicurePath + professional._doc.picture;
            }
                    
            professional._doc.distance = helpers.distance(professional_lat, professional_lon, user_lat, user_lon);

            for (let i = 0; i < professional._doc.services.length; i++) {
                if (professional._doc.services[i].service && professional._doc.services[i].service._id.toString() == data.service) {
                    professional._doc.rate_hour = professional.services[i].rate_hour;
                    listProfessional = true;
                    break;
                }
            }

            if (listProfessional){

                if (professional._doc.reviews !== undefined){
                    for (let i = 0; i < professional._doc.reviews.length; i++) {
                        delete professional._doc.reviews[i]._doc._id;
                        delete professional._doc.reviews[i]._doc.__v;
                    }
                }

                delete professional._doc.__v;
                delete professional._doc.password;
                delete professional._doc.type;
                delete professional._doc.services;
                delete professional._doc.address;

                response.push(professional);
            }
        });

        res.json({results: response});

    }).catch(() => {
        res.status(500).send({ "error": "Please try again!" });
    });

};


//funcoes privadas 

const getProfileFromJson = jsonObject => {

    let profile = {};

    let basicFields = ["name", "email", "password", "tel", "type"];
    let clientFields = ["address"];
    let professionalFields = ["services", "location"];
    let addressFields = ["zip", "country", "state", "city", "street"];
    let servicesFields = ["service", "rate_hour"];
    let locationFields = ["type", "coordinates"];

    //fields validation
    for (let i = 0; i < basicFields.length; i++) {
        let field = basicFields[i];
        if (jsonObject[field] !== undefined) {
            profile[field] = jsonObject[field];
        } else {
            return false;
        }
    }

    profile.password = crypto.encrypt(profile.password);
    profile.total_tasks = 0;

    if (jsonObject.picture !== undefined) {
        //verificar se é base64
        let imgData = jsonObject.picture;
        let base64Rejex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

        let isBase64Valid = base64Rejex.test(imgData.replace(/^data:image\/\w+;base64,/, '')); // base64Data is the base64 string

        if (isBase64Valid) {
            profile.picture = imgData;
        } else {
            if (jsonObject.picture === "") {
                profile.picture = ""; //se veio vazio, vamos remover a foto do perfil
            }
        }
    }

    if (jsonObject.type === "professional") {
        for (let i = 0; i < professionalFields.length; i++) {
            let field = professionalFields[i];
            if (jsonObject[field] !== undefined) {
                profile[field] = jsonObject[field];
            } else {
                return false;
            }
        }

        for (let i = 0; i < servicesFields.length; i++) {
            let field = servicesFields[i];
            for (let x = 0; x < jsonObject.services.length; x++) {
                if (jsonObject.services[x][field] === undefined) {
                    return false;
                }
            }
        }

        for (let i = 0; i < locationFields.length; i++) {
            let field = locationFields[i];
            if (jsonObject.location[field] === undefined) {
                return false;
            }
        }

    } else {

        for (let i = 0; i < clientFields.length; i++) {
            let field = clientFields[i];
            if (jsonObject[field] !== undefined) {
                profile[field] = jsonObject[field];
            } else {
                return false;
            }
        }

        for (let i = 0; i < addressFields.length; i++) {
            let field = addressFields[i];
            for (let x = 0; x < jsonObject.address.length; x++) {
                if (jsonObject.address[x][field] === undefined) {
                    return false;
                }
            }
        }

    }

    return profile;
};