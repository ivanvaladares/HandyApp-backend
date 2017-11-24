const Task = require('../models/task-model');
const User = require('../models/user-model');
const Service = require('../models/service-model');
const ReviewController = require('../controller/review');

exports.getTasks = (data, token) => {
    
    return new Promise((resolve, reject) => {

        let taskQuery = {};
        
        if (data.type === "professional" && token.type === "professional") { //security measure
            taskQuery.tasker = token.id;
        }else{
            taskQuery.client = token.id;
        }
        
        Task.get(taskQuery).then(retrievedTasks => {

            resolve({results: retrievedTasks});

        }).catch(() => {
            reject({ code: 500, "message": "Please try again!" });
        });

    });

};

exports.saveTask = (data, token) => {
    
    return new Promise((resolve, reject) => {

        let taskJson = getTaskFromJson(data);
        
        if (taskJson === false) {
            return reject({ code: 400, "message": "Please, fill all required fields!" });
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
                        return reject({ code: 400, "message": "Please, fill all required fields!" });
                    }

                    Service.get({ _id: task.service }).then(services => { //ensure it's a service
                        if (services === null || services.length <= 0) {
                            return reject({ code: 400, "message": "Please, fill all required fields!" });
                        }

                        task.save(err => {
                            if (err) {
                                return reject({ code: 500, "message": err.message });
                            }

                            resolve({ "message": "Success!" });
                        });

                    }).catch(err => {
                        return reject({ code: 500, "message": err.message });
                    });                
                });

        } else { //update task

            Task.get({ _id: taskJson._id }).then(retrievedTask => {

                if (retrievedTask === null || retrievedTask.length <= 0) {
                    return reject({ code: 400, "message": "Please, fill all required fields!" });
                }
                
                task = retrievedTask[0];

                if (task._doc.client._id.toString() !== token.id || 
                    task._doc.accepted || 
                    task._doc.completed){

                    return reject({ code: 401, "message": "You can't change this task!" });
                }

                task.date = taskJson.date;
                task.hour = taskJson.hour;
                task.address = taskJson.address;
                task.location = task.location;

                task.save(err => {
                    if (err) {
                        return reject({ code: 500, "message": err.message });
                    }
                    resolve({ "message": "Success!" });
                });

            }).catch(err => {
                return reject({ code: 500, "message": err.message });
            });
        }
        
    });
};

exports.removeTask = (data, token) => {
    
    return new Promise((resolve, reject) => {

        Task.get({ _id: data._id }).then(retrievedTask => {

            if (retrievedTask === null || retrievedTask.length <= 0) {
                return reject({ code: 500, "message": "Sorry! This task is not available." });
            }
            
            let task = retrievedTask[0];

            if (task._doc.client._id.toString() !== token.id || 
                task._doc.accepted || 
                task._doc.completed){
                    
                return reject({ code: 401, "message": "You can't remove this task!" });
            }


            task.remove(err => {
                if (err) {
                    return reject({ code: 500, "message": err.message });
                }
                resolve({ "message": "Success!" });
            });

        }).catch(err => {
            reject({ code: 500, "message": err.message });
        });

    });

};

exports.acceptTask = (data, token) => {
    
    return new Promise((resolve, reject) => {

        Task.get({ _id: data._id }).then(retrievedTask => {

            if (retrievedTask === null || retrievedTask.length <= 0) {
                return reject({ code: 500, "message": "Sorry! This task is not available." });
            }
            
            let task = retrievedTask[0];

            if (task._doc.tasker._id.toString() !== token.id){
                return reject({ code: 401, "message": "You can't change this task!" });
            }

            task.accepted = true;
            task.rejected = false;

            task.save(err => {
                if (err) {
                    reject({ code: 500, "message": err.message });
                }

                //todo: enviar email de aceitacao
                
                resolve({ "message": "Success!" });
            });

        }).catch(err => {
            reject({ code: 500, "message": err.message });
        });
    });

};

exports.rejectTask = (data, token) => {
    
    return new Promise((resolve, reject) => {

        Task.get({ _id: data._id }).then(retrievedTask => {

            if (retrievedTask === null || retrievedTask.length <= 0) {
                return reject({ code: 500, "message": "Sorry! This task is not available." });
            }
            
            let task = retrievedTask[0];

            if (task._doc.tasker._id.toString() !== token.id ||
                task._doc.completed){
                return reject({ code: 401, "message": "You can't change this task!" });
            }

            task.rejected = true;
            task.accepted = false;
            
            task.save(err => {
                if (err) {
                    return reject({ code: 500, "message": err.message });
                }

                //todo: enviar email de rejeicao

                resolve({ "message": "Success!" });
            });

        }).catch(err => {
            reject({ code: 500, "message": err.message });
        });

    });

};

exports.completeTask = (data, token) => {
    
    return new Promise((resolve, reject) => {

        Task.get({ _id: data._id }).then(retrievedTask => {

            if (retrievedTask === null || retrievedTask.length <= 0) {
                return reject({ code: 500, "message": "Sorry! This task is not available." });
            }

            let task = retrievedTask[0];

            if (task._doc.client._id.toString() !== token.id ||
                !task._doc.accepted){
                return reject({ code: 401, "message": "You can't change this task!" });
            }
            task.completed = true;

            task.save(err => {
                if (err) {
                    return reject({ code: 500, "message": err.message });
                }

                if (data.review !== undefined) {

                    data.review.tasker = task.tasker._id.toString();

                    ReviewController.saveReview(data.review, token, true).then(() => {
                        resolve({ "message": "Success!" });
                
                    }).catch(err => {
                        reject(err);
                    });    
                    
                }else{

                    resolve({ "message": "Success!" });
                }

            });

        }).catch(err => {
            reject({ code: 500, "message": err.message });
        });
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