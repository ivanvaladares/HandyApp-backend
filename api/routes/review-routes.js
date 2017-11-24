var express = require('express');
var router  = express.Router();

const Jwt = require("jsonwebtoken");
const crypto = require("../crypto.js");

var ReviewController = require('../controller/review');

const getReviews = (req, res) => {
    
    let data;

    try {
        data = JSON.parse(req.body.data);
        Jwt.verify(data.token, crypto.privateKey);

        if (data.tasker === undefined){
            throw new Error("Please, review your json data!");
        }
    } catch (err) {
        return res.status(400).send({ "error": "Please, review your json data!" });
    }
    
    ReviewController.get(data).then(results => {
        res.json(results);
    }).catch(err => {
        res.status(err.code).send(err.message);
    });

};

const saveReview = (req, res) => {

    let json, token;

    try {
        json = JSON.parse(req.body.data);
        token = Jwt.verify(json.token, crypto.privateKey);
    } catch (err) {
        return res.status(400).send({ "error": "Please, review your json data!" });
    }

    ReviewController.save(json, token).then(() => {
        res.json({ "message": "Success!" });
    }).catch(err => {
        res.status(err.code).send(err.message);
    });

};

router.post('/getReviews', getReviews);
router.post('/saveReview', saveReview);

module.exports = router;