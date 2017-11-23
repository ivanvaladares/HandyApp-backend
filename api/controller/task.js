const Jwt = require("jsonwebtoken");

const crypto = require("../crypto.js");

const User = require('../models/user-model');
const Task = require('../models/task-model');
const Service = require('../models/service-model');
const Review = require('../models/review-model');


exports.getTasks = (req, res) => {

    let data, token;

    try {
        data = JSON.parse(req.body.data);
        token = Jwt.verify(data.token, crypto.privateKey);
    } catch (err) {
        return res.status(400).send({ "error": "Please, review your json data!" });
    }

    let taskQuery = {};
    
    if (data.type === "professional" && token.type === "professional") { //security measure
        taskQuery.tasker = token.id;
    }else{
        taskQuery.client = token.id;
    }
    
    Task.get(taskQuery).then(retrievedTasks => {

        res.json({results: retrievedTasks});

    }).catch(() => {
        res.status(500).send({ "error": "Please try again!" });
    });

};

exports.saveTask = (req, res) => {

    let data, token;

    try {
        data = JSON.parse(req.body.data);
        token = Jwt.verify(data.token, crypto.privateKey);
    } catch (err) {
        return res.status(400).send({ "error": "Please, review your json data!" });
    }

    let taskJson = getTaskFromJson(data);
    
    if (taskJson === false) {
        return res.status(400).send({ "error": "Please, fill all required fields!" });
    }

    let task;

    if (taskJson._id === undefined) { //new user

            task = new Task(taskJson);

            task.client = token.id;
            task.completed = false;
            task.accepted = false;
            task.rejected = false;

            User.get({ _id: task.tasker }).then(tasker => { //ensure it's a professional
                if (tasker === null || tasker.length <= 0 || tasker[0].type !== "professional") {
                    return res.status(400).send({ "error": "Please, fill all required fields!" });
                }
                
                return task;

            }).then(task => {

                Service.get({ _id: task.service }).then(services => { //ensure it's a service
                    if (services === null || services.length <= 0) {
                        return res.status(400).send({ "error": "Please, fill all required fields!" });
                    }
                    
                    return task;

                }).then(task => {                

                    task.save(err => {
                        if (err) {
                            return res.status(500).send(err.message);
                        }

                        res.json({ "message": "Success!" });
                    });

                }).catch(err => {
                    res.status(500).send(err.message);
                });

            });

    } else { //update task

        Task.get({ _id: taskJson._id }).then(retrievedTask => {

            if (retrievedTask === null || retrievedTask.length <= 0) {
                return res.status(400).send({ "error": "Please, fill all required fields!" });
            }

            if (retrievedTask[0]._doc.client._id.toString() !== token.id || 
                retrievedTask[0]._doc.accepted || 
                retrievedTask[0]._doc.completed){

                return res.status(401).send({ "error": "You can't change this task!" });
            }

            task = retrievedTask[0];

            task.date = taskJson.date;
            task.hour = taskJson.hour;
            task.address = taskJson.address;
            task.location = task.location;

            task.save(err => {
                if (err) {
                    return res.status(500).send(err.message);
                }
                res.json({ "message": "Success!" });
            });

        }).catch(err => {
            res.status(500).send(err.message);
        });
    }

};

exports.removeTask = (req, res) => {

    let data, token;

    try {
        data = JSON.parse(req.body.data);
        token = Jwt.verify(data.token, crypto.privateKey);

        if (data._id === undefined) {
            throw new Error("Please, review your json data!");
        }
    
    } catch (err) {
        return res.status(400).send({ "error": "Please, review your json data!" });
    }
    
    let task;

    Task.get({ _id: data._id }).then(retrievedTask => {

        if (retrievedTask === null || retrievedTask.length <= 0) {
            return res.status(500).send({ "error": "Sorry! This task is not available." });
        }

        if (retrievedTask[0]._doc.client._id.toString() !== token.id || 
            retrievedTask[0]._doc.accepted || 
            retrievedTask[0]._doc.completed){
                
            return res.status(401).send({ "error": "You can't remove this task!" });
        }

        task = retrievedTask[0];

        task.remove(err => {
            if (err) {
                return res.status(500).send(err.message);
            }
            res.json({ "message": "Success!" });
        });

    }).catch(err => {
        res.status(500).send(err.message);
    });

};

exports.acceptTask = (req, res) => {

    let data, token;

    try {
        data = JSON.parse(req.body.data);
        token = Jwt.verify(data.token, crypto.privateKey);

        if (data._id === undefined) {
            throw new Error("Please, review your json data!");
        }
    
    } catch (err) {
        return res.status(400).send({ "error": "Please, review your json data!" });
    }
    
    let task;

    Task.get({ _id: data._id }).then(retrievedTask => {

        if (retrievedTask === null || retrievedTask.length <= 0) {
            return res.status(500).send({ "error": "Sorry! This task is not available." });
        }

        if (retrievedTask[0]._doc.tasker._id.toString() !== token.id){
            return res.status(401).send({ "error": "You can't change this task!" });
        }

        task = retrievedTask[0];

        task.accepted = true;
        task.rejected = false;

        task.save(err => {
            if (err) {
                return res.status(500).send(err.message);
            }

            //todo: enviar email de aceitacao
            
            res.json({ "message": "Success!" });
        });

    }).catch(err => {
        res.status(500).send(err.message);
    });

};

exports.rejectTask = (req, res) => {
    
    let data, token;

    try {
        data = JSON.parse(req.body.data);
        token = Jwt.verify(data.token, crypto.privateKey);

        if (data._id === undefined) {
            throw new Error("Please, review your json data!");
        }
    
    } catch (err) {
        return res.status(400).send({ "error": "Please, review your json data!" });
    }
    
    let task;

    Task.get({ _id: data._id }).then(retrievedTask => {

        if (retrievedTask === null || retrievedTask.length <= 0) {
            return res.status(500).send({ "error": "Sorry! This task is not available." });
        }

        if (retrievedTask[0]._doc.tasker._id.toString() !== token.id ||
            retrievedTask[0]._doc.completed){
            return res.status(401).send({ "error": "You can't change this task!" });
        }

        task = retrievedTask[0];

        task.rejected = true;
        task.accepted = false;
        
        task.save(err => {
            if (err) {
                return res.status(500).send(err.message);
            }

            //todo: enviar email de rejeicao

            res.json({ "message": "Success!" });
        });

    }).catch(err => {
        res.status(500).send(err.message);
    });

};
    
exports.completeTask = (req, res) => {

    let data, token;

    try {
        data = JSON.parse(req.body.data);
        token = Jwt.verify(data.token, crypto.privateKey);

        if (data._id === undefined) {
            throw new Error("Please, review your json data!");
        }
    
    } catch (err) {
        return res.status(400).send({ "error": "Please, review your json data!" });
    }
    
    let task;

    Task.get({ _id: data._id }).then(retrievedTask => {

        if (retrievedTask === null || retrievedTask.length <= 0) {
            return res.status(500).send({ "error": "Sorry! This task is not available." });
        }

        if (retrievedTask[0]._doc.client._id.toString() !== token.id ||
            !retrievedTask[0]._doc.accepted){
            return res.status(401).send({ "error": "You can't change this task!" });
        }

        task = retrievedTask[0];
        let arrToSave = [];
        let review;
        
        task.completed = true;
        arrToSave.push(task);
        
        if (data.review !== undefined &&
            data.review.text !== undefined &&
            data.review.stars !== undefined){

                review = new Review({
                    client: token.id,
                    text: data.review.text,
                    stars: data.review.stars,
                    date: new Date()
                });

                arrToSave.push(review);
        }

        const pToSave = arrToSave.map(obj => {
            return new Promise((resolve, reject) => {
                obj.save((error, result) => {
                    if (error) {
                        reject(error);
                    }
                    resolve(result);
                });
            });
        });
        
        Promise.all(pToSave).then(() => {

            let dataToMongo = { $inc: { 'total_tasks': 1 }};

            if (review !== undefined) {
                dataToMongo.$push = { 'reviews': review };
            }

            User.findOneAndUpdate({ _id: task.tasker._id}, dataToMongo).exec().then(() => {
                res.json({ "message": "Success!" });
            }).catch(err => {
                res.status(500).send(JSON.stringify(err));
            });
            
        }).catch(err => {
            res.status(500).send(JSON.stringify(err));
        });

    }).catch(err => {
        res.status(500).send(err.message);
    });

};


//funcoes privadas 
const getTaskFromJson = jsonObject => {
    let task = {};

    let basicFields = ["tasker", "service", "date", "hour", "location", "address"];
    let addressFields = ["zip", "country", "state", "city", "street"];
    let locationFields = ["type", "coordinates"];

    if (jsonObject._id !== undefined){
        task._id = jsonObject._id;
    }

    //fields validation
    for (let i = 0; i < basicFields.length; i++) {
        let field = basicFields[i];
        if (jsonObject[field] !== undefined) {
            task[field] = jsonObject[field];
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
    
    for (let i = 0; i < locationFields.length; i++) {
        let field = locationFields[i];
        if (jsonObject.location[field] === undefined) {
            return false;
        }
    } 

    return task;
};