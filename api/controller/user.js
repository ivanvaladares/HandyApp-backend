const Jwt = require("jsonwebtoken");
const crypto = require("../crypto.js");
const helpers = require("../helpers.js");

const User = require('../models/user-model');
const Service = require('../models/service-model');
const TaskController = require('../controller/task');
const log4js = require('log4js');

const logger = log4js.getLogger(process.env.LOGGER_NAME);

const picurePath = "./public/images/users/";
const publicPicurePath = "/images/users/";

//todo: remover este metodo
exports.get = () => {

    return new Promise((resolve, reject) => {
        User.get(null).then(users => {
            resolve(users);
        }).catch(err => {
            logger.error({ source: 'user.get', err });

            reject({ code: 500, "message": "Please try again!" });
        });
    });
};

exports.login = (data) => {

    return new Promise((resolve, reject) => {

        let errorMessage = "Invalid username or password";

        if (data.email === undefined || data.password === undefined) {
            return reject({ code: 401, "message": errorMessage });
        }

        User.get({ email: data.email, password: crypto.encrypt(data.password) }).then(retrievedUser => {

            if (retrievedUser === null || retrievedUser.length <= 0) {
                logger.info({ source: 'user.login', message: 'Invalid login attempt', email: data.email });

                return reject({ code: 401, "message": errorMessage });
            }

            retrievedUser = retrievedUser[0];

            let tokenData = {
                id: retrievedUser._id,
                email: retrievedUser.email,
                type: retrievedUser.type
            };//we can have more information inside this token

            //criar um objeto resposta
            let response = {
                token: Jwt.sign(tokenData, crypto.privateKey, { expiresIn: (60 * 60) * 24 }),
                profile: retrievedUser
            };


            if (retrievedUser.type === "professional") {

                //remove non professional stuff
                //delete retrievedUser._doc.address;

            } else {

                //remove profession stuff from this client response
                delete retrievedUser._doc.reviews;
                delete retrievedUser._doc.services;
                delete retrievedUser._doc.location;
                delete retrievedUser._doc.rate_hour;
                delete retrievedUser._doc.reviews;
                delete retrievedUser._doc.total_tasks;
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
            let taskQuery = {};
            taskQuery.type = retrievedUser.type;

            arrPromises.push(
                new Promise((resolve, reject) => {
                    TaskController.getTasks(taskQuery, tokenData).then(result => {
                        resolve({ tasks: result.results });
                    }).catch(err => {
                        reject(err);
                    });
                })
            );

            Promise.all(arrPromises).then((promiseResults) => {

                //unir o json de servicos e task a resposta
                promiseResults.map(pResult => {
                    let key = Object.keys(pResult)[0];
                    response[key] = pResult[key];
                });

                resolve(response);

            }).catch(err => {
                logger.error({ source: 'user.login', err, email: data.email });

                reject({ code: 500, "message": "Please try again!" });
            });


        }).catch(err => {
            logger.error({ source: 'user.login', err, email: data.email });

            reject({ code: 500, "message": "Please try again!" });
        });
    });

};

exports.saveProfile = (data, token) => {

    return new Promise((resolve, reject) => {

        let profile = getProfileFromJson(data.profile);

        if (profile === false) {
            return reject({ code: 400, "message": "Please, fill all required fields!" });
        }

        let user;

        if (token === undefined) { //new user

            User.get({ email: profile.email }).then(retrievedUser => {

                if (retrievedUser !== null && retrievedUser.length > 0) {
                    return reject({ code: 403, "message": "This email is already in use." });
                }

                user = new User(profile);

                helpers.savePicture(picurePath, profile.picture).then(filename => {
                    if (filename !== "") {
                        user.picture = publicPicurePath + filename;
                    }
                    return user;
                }).then(user => {
                    user.save().then(() => {
                        resolve({ "message": "Success!" });
                    }).catch(err => {
                        logger.error({ source: 'user.saveProfile', err, data });

                        reject({ code: 500, "message": err.message });
                    });
                }).catch(err => {
                    logger.error({ source: 'user.saveProfile', err, data });
                });

            }).catch(err => {
                logger.error({ source: 'user.saveProfile', err, data });

                reject({ code: 500, "message": err.message });
            });

        } else { //update user

            User.get({ _id: token.id }).then(retrievedUser => {

                if (retrievedUser === null || retrievedUser.length <= 0) {
                    return reject({ code: 401, "message": "Please, sign in again." });
                }

                user = retrievedUser[0];

                User.get({ email: profile.email }).then(userEmail => {

                    if (userEmail === null || userEmail.length > 0) {
                        if (userEmail[0]._id.toString() !== token.id) {
                            return reject({ code: 403, "message": "This email is already in use." });
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

                    }).then(user => {
                        user.save().then(() => {
                            resolve({ "message": "Success!" });
                        }).catch(err => {
                            logger.error({ source: 'user.saveProfile', err, data });

                            reject({ code: 500, "message": err.message });
                        });
                    }).catch(err => {
                        logger.error({ source: 'user.saveProfile', err, data });
                    });

                }).catch(err => {
                    logger.error({ source: 'user.saveProfile', err, data });

                    reject({ code: 500, "message": err.message });
                });

            }).catch(err => {
                logger.error({ source: 'user.saveProfile', err, data });

                reject({ code: 500, "message": err.message });
            });
        }

    });

};

exports.searchProfessionals = (data) => {

    return new Promise((resolve, reject) => {

        let user_lat, user_lon;

        try {

            user_lat = data.location[0];
            user_lon = data.location[1];

        } catch (err) {
            return reject({ code: 400, "message": "Please, review your json data!" });
        }

        if (data.service === undefined) {
            return reject({ code: 400, "message": "Please, review your json data!" });
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

                professional._doc.distance = helpers.distance(professional_lat, professional_lon, user_lat, user_lon);

                for (let i = 0; i < professional._doc.services.length; i++) {
                    if (professional._doc.services[i].service && professional._doc.services[i].service._id.toString() == data.service) {
                        professional._doc.rate_hour = professional.services[i].rate_hour;
                        listProfessional = true;
                        break;
                    }
                }

                if (listProfessional) {

                    delete professional._doc.type;
                    delete professional._doc.services;
                    delete professional._doc.address;

                    response.push(professional);
                }
            });

            resolve({ results: response });

        }).catch(err => {
            logger.error({ source: 'user.searchProfessionals', err, data });

            reject({ code: 500, "message": "Please try again!" });
        });
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