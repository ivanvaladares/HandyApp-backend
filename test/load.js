
var crypto = require("../api/crypto.js");
var User = require('../api/models/user-model');
var Task = require('../api/models/task-model');
var Review = require('../api/models/review-model');
var Service = require('../api/models/service-model');

var mongoose = require('mongoose');

exports.loadDatabase = () => {

    return new Promise((resolve, reject) => {

        const arrPromisesCleanDatabase = ['users', 'reviews', 'tasks', 'services'];
        const pClean = arrPromisesCleanDatabase.map(collection => {
            return new Promise((resolve) => {
                mongoose.connection.db.dropCollection(collection, () => {
                    resolve();
                });
            });
        });
        
        let service1 = new Service({
            "name": "Home cleaning", 
            "picture": "/images/services/1.jpg",
            "order": 1
        });

        let service2 = new Service({
            "name": "Office cleaning", 
            "picture": "/images/services/2.jpg",
            "order": 2
        });

        let service3 = new Service({
            "name": "Furniture assembly", 
            "picture": "/images/services/3.jpg",
            "order": 3
        });

        let service4 = new Service({
            "name": "Knobs and locks", 
            "picture": "/images/services/4.jpg",
            "order": 4
        });

        let service5 = new Service({
            "name": "Electrical", 
            "picture": "/images/services/5.jpg",
            "order": 5
        });

        let service6 = new Service({
            "name": "Plumbing", 
            "picture": "/images/services/6.jpg",
            "order": 6
        });

        let service7 = new Service({
            "name": "Painting", 
            "picture": "/images/services/7.jpg",
            "order": 7
        });

        let defaultUser2 = new User({
            "type": "client",
            "picture": "/images/users/3.jpg",
            "name": "Joana Valadao",
            "email": "jvaladao@hotmail.com",
            "password": crypto.encrypt("123"),
            "tel": "647 608 3027",
            "address": [{
                "street": "2015 sheppard ave e", 
                "unit": "603",
                "city": "North york",
                "state": "Ontario",
                "country": "Canada",
                "zip": "m2j 0b3"
                },
                {
                "street": "xxxxx", 
                "unit": "603",
                "city": "North york",
                "state": "Ontario",
                "country": "Canada",
                "zip": "xxxxxx"
            }]
        });    

        let defaultUser3 = new User({
            "type": "client",
            "picture": "/images/users/1.jpg",
            "name": "Gustavo Calland",
            "email": "gustavo@hotmail.com",
            "password": crypto.encrypt("123"),
            "tel": "647 608 3027",
            "address": [{
                "street": "yyyy", 
                "unit": "603",
                "city": "North york",
                "state": "Ontario",
                "country": "Canada",
                "zip": "yyyyy"
            }]
        });    
        

        let review1 = new Review({
            date: new Date("2017-01-01"),
            "client": defaultUser3, 
            "text": "BLAL LLAKDLKA", 
            stars: 4.5
        });

        let review2 = new Review({
            date: new Date("2017-01-02"),
            "client": defaultUser2, 
            "text": "XXXXX", 
            stars: 5
        });

        let defaultUser1 = new User({
            "type": "professional",
            "picture": "/images/users/2.jpg",
            "name": "Ivan Valadares",
            "email": "ivanvaladares@hotmail.com",
            "password": crypto.encrypt("123"),
            "tel": "647 608 3027",
            "services": [
                {"service": service1, "rate_hour": 100}, 
                {"service": service2, "rate_hour": 80}
            ],
            "total_tasks": 88,
            "location": {
                "type": "Point",
                "coordinates": [ 
                    43.7785159, 
                    -79.346555
                ]
            },
            "reviews": [review1, review2]//,
            //"tasks": [task1, task2]
        });    


        let task1 = new Task({
            date: new Date("2017-01-01"),
            "tasker": defaultUser1,
            "client": defaultUser2,
            "service": service1,
            "hour": "12:00",
            "completed": false,
            "accepted": false,
            "rejected": false,
            "address": {
                "street": "2015 sheppard ave e", 
                "unit": "603",
                "city": "North york",
                "state": "Ontario",
                "country": "Canada",
                "zip": "m2j 0b3"
            },
            "location": {
                "type": "Point",
                "coordinates": [ 
                    43.7785500, 
                    -79.346900
                ]
            }
        });

        let task2 = new Task({
            date: new Date("2017-01-01"),
            "tasker": defaultUser1,
            "client": defaultUser3,
            "service": service2,
            "hour": "12:00",
            "completed": false,
            "accepted": false,
            "rejected": false,
            "address": {
                "street": "2015 sheppard ave e", 
                "unit": "603",
                "city": "North york",
                "state": "Ontario",
                "country": "Canada",
                "zip": "m2j 0b3"
            },
            "location": {
                "type": "Point",
                "coordinates": [ 
                    43.7785500, 
                    -79.346900
                ]
            }
        });    


        let arr = [defaultUser1, defaultUser2, defaultUser3, service1, service2, service3, service4, service5, service6, service7, task1, task2, review1, review2];

        const pPopulate = arr.map(o => {
            return new Promise((resolve, reject) => {
                o.save((error, result) => {
                    if (error) {
                        reject(error);
                    }
                    resolve(result);
                });
            });
        });
        
        Promise.all(pClean).then(() => { 
            Promise.all(pPopulate).then(results => {
                resolve(results);
            }, (err) => {
                reject(err);
            });
        });
        
    });

};