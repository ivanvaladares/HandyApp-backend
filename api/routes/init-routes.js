var express = require('express');
var router = express.Router();

var crypto = require("../crypto.js");

var User = require('../models/user-model');
var Task = require('../models/task-model');
var Review = require('../models/review-model');
var Service = require('../models/service-model');


var mongoose = require('mongoose');

router.get('/', (req, res) => {

    mongoose.connection.db.dropCollection('users');
    mongoose.connection.db.dropCollection('reviews');
    mongoose.connection.db.dropCollection('tasks');
    mongoose.connection.db.dropCollection('services');
    
    let service1 = new Service({
        "name": "painting", 
        "picture": "/images/sevices/00001.jpg"
    });

    let service2 = new Service({
        "name": "cleaning", 
        "picture": "/images/sevices/00002.jpg"
    });

    let review1 = new Review({
        date: new Date("2017-01-01"),
        "client": "Joana Valadao", 
        "picture": "3121351.jpg", 
        "text": "BLAL LLAKDLKA", 
        stars: 4.5
    });

    let review2 = new Review({
        date: new Date("2017-01-02"),
        "client": "XXXX", 
        "picture": "3121351.jpg", 
        "text": "XXXXX", 
        stars: 5
    });


    let task1 = new Task({
        date: new Date("2017-01-01"),
        "tasker": "ivanvaladares@hotmail.com",
        "client": "jvaladao@hotmail.com",
        "service": "cleaning",
        "hour": "12:00",
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
                33.2926487, 
                44.4159651
            ]
        }
    });

    let task2 = new Task({
        date: new Date("2017-01-01"),
        "tasker": "ivanvaladares@hotmail.com",
        "client": "gustavo@hotmail.com",
        "service": "cleaning",
        "hour": "12:00",
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
                33.2926487, 
                44.4159651
            ]
        }
    });    

    let defaultUser1 = new User({
        "type": "professional",
        "picture": "3121351.jpg",
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


    let defaultUser2 = new User({
        "type": "client",
        "picture": "3121351.jpg",
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
        "picture": "3121351.jpg",
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

    let arr = [service1, service2, task1, task2, review1, review2, defaultUser1, defaultUser2, defaultUser3];

    const p = arr.map(o => {
        return new Promise((resolve, reject) => {
            o.save((error, result) => {
            if (error) {
                reject(error);
            }
            resolve(result);
            });
        });
    });
    
    Promise.all(p).then((results) => {
        res.send(JSON.stringify(results));
    }, (error) => {
        res.send(JSON.stringify(error));
    });

});

module.exports = router;