const Jwt = require("jsonwebtoken");

const crypto = require("../crypto.js");

const User = require('../models/user-model');
const Task = require('../models/task-model');
const Service = require('../models/service-model');


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

            if (retrievedTask[0]._doc.client._id.toString() !== token.id){
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