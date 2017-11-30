const nodeCrypto = require('crypto');
const fs = require('fs');
const jimp = require("jimp");

const Jwt = require("jsonwebtoken");
const crypto = require('./crypto.js');

const sendgridMail = require('@sendgrid/mail');

const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

module.exports = {

    uuidv4: function () {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b => (b ^ nodeCrypto.rng(1)[0] % 16 >> b / 4).toString(16));
    },

    createFilename: function (path, extension) {
        return new Promise(resolve => {
            let filename = path + this.uuidv4() + "." + extension;
    
            fs.stat(filename, (err, stat) => { 
                if (stat != undefined && stat.isFile()) {
                    return this.createFilename().then(filename => {
                        resolve(filename);
                    });
                }else{
                    return resolve(filename);
                }
            }); 
        });
    },

    savePicture: function (picurePath, base64Data) {
        return new Promise((resolve, reject) => {

            if (base64Data === undefined || base64Data === ""){
                return resolve("");
            }

            let imageType = base64Data.match(/data:image\/([a-zA-Z0-9-.+]+).*,.*/);

            if (!Array.isArray(imageType)){
                return resolve("");
            }

            base64Data = base64Data.replace(/^data:image\/\w+;base64,/, '');

            this.createFilename(picurePath, imageType[1]).then(filename => {

                jimp.read(Buffer.from(base64Data, 'base64'), (err, image) => {
                    if (err) {
                        return reject(err);
                    }
                    
                    image
                        .cover(400, 400, jimp.HORIZONTAL_ALIGN_CENTER | jimp.VERTICAL_ALIGN_MIDDLE)
                        .write(filename, (err) => {
                            if (err) {
                                return reject(err);
                            }

                            resolve(filename.substring(filename.lastIndexOf("/") + 1));
                        });
                });

            });

        });
        
    },

    distance: function (lat1, lon1, lat2, lon2) {
        var p = 0.017453292519943295;
        var c = Math.cos;
        var a = 0.5 - c((lat2 - lat1) * p) / 2 + 
            c(lat1 * p) * c(lat2 * p) * 
            (1 - c((lon2 - lon1) * p)) / 2;

        return 12742 * Math.asin(Math.sqrt(a));
    },

    saveAll: function (arrToSave) {
        return new Promise((resolve, reject) => {

            let arr = arrToSave.map(obj => {
                return new Promise((resolve, reject) => {
                    obj.save().then((result) => {
                        resolve(result);
                    }).catch(err => {
                        reject(err);
                    });
                });
            });

            Promise.all(arr).then(() => {
                resolve();
            }).catch(err => {
                reject(err);
            });
        });
    },

    isAuthenticated: function (req, res, next) {

        try {
            let data = JSON.parse(req.body.data);
            let token = Jwt.verify(data.token, crypto.privateKey);

            req.data = data;
            req.token = token;
        
        } catch (err) {
            if (err.message === "jwt expired") {
                return res.status(401).send({ "message": "Please, sign in again." });
            }else{
                return res.status(400).send({ "message": "Please, review your json data!" });
            }
        }        

        return next();

    },

    getPostDataAndToken: function (req, res, next) {

        try {
            req.data = JSON.parse(req.body.data);

            if (req.data.token !== undefined){
                req.token = Jwt.verify(req.data.token, crypto.privateKey);
            }
        
        } catch (err) {
            if (err.message === "jwt expired") {
                return res.status(401).send({ "message": "Please, sign in again." });
            }else{
                return res.status(400).send({ "message": "Please, review your json data!" });
            }
        }        

        return next();

    },

    sendEmail: function (to, subject, message) {
        return new Promise((resolve, reject) => {

            sendgridMail.setApiKey(process.env.SENDGRID_API_KEY);
            const msg = {
              to: to,
              from: process.env.EMAIL_FROM,
              subject: subject,
              text: message
            };

            sendgridMail.send(msg, err => {
                if(err) { 
                    return reject(err);
                }
                resolve();
            });

        });
    },

    sendEmailTaskRequested: function (task) {
        return new Promise((resolve, reject) => {

            let subject = '[HandyApp] - Someone needs you!';
            let message = `A ${task.service.name} task, schedule for: ${task.date.toLocaleDateString("en-US", dateOptions)} at ${task.hour} was requested.`;
            message += '\n\nPlease, go to our app for more details';

            this.sendEmail(task._doc.tasker.email, subject, message).then(() => {
                resolve();
            }).catch(err => {
                reject(err);
            });

        });
    },
    
    sendEmailTaskAccpepted: function (task) {
        return new Promise((resolve, reject) => {

            let subject = '[HandyApp] - Your task was accepted';
            let message = `Your ${task.service.name} task, schedule for: ${task.date.toLocaleDateString("en-US", dateOptions)} at ${task.hour} was accepted.`;
            message += '\n\nThe professional will contact you soon!';

            this.sendEmail(task._doc.client.email, subject, message).then(() => {
                resolve();
            }).catch(err => {
                reject(err);
            });

        });
    },

    sendEmailTaskRejected: function (task) {
        return new Promise((resolve, reject) => {

            let subject = '[HandyApp] - Your task was rejected';
            let message = `Your ${task.service.name} task, schedule for: ${task.date.toLocaleDateString("en-US", dateOptions)} at ${task.hour} was rejected.`;
            message += '\n\nPlease, go to our app for more details';

            this.sendEmail(task._doc.client.email, subject, message).then(() => {
                resolve();
            }).catch(err => {
                reject(err);
            });

        });
    }

};