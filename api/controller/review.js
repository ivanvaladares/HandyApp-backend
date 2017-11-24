const helpers = require("../helpers.js");
const Jwt = require("jsonwebtoken");
const crypto = require("../crypto.js");

const User = require('../models/user-model');
const Review = require('../models/review-model');


exports.getReviews = (req, res) => {
    
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

    User.get({ _id: data.tasker }).then(retrievedUser => {
        
        res.json({results: retrievedUser[0].reviews});

    }).catch(() => {
        return res.status(500).send({ "error": "Please try again!" });
    });    
    
};

exports.saveReview = (req, res) => {

    let data, token;

    try {
        data = JSON.parse(req.body.data);
        token = Jwt.verify(data.token, crypto.privateKey);
    } catch (err) {
        return res.status(400).send({ "error": "Please, review your json data!" });
    }

    let reviewJson = getReviewFromJson(data);
    
    if (reviewJson === false) {
        return res.status(400).send({ "error": "Please, fill all required fields!" });
    }        

    if (reviewJson._id === undefined) { //new review
        
        let review = new Review(reviewJson);
        review.client = token.id;
        review.date = new Date();

        User.get({ _id: reviewJson.tasker }).then(retrievedTaskers => { //ensure it's a professional

            if (retrievedTaskers === null || retrievedTaskers.length <= 0 || retrievedTaskers[0].type !== "professional") {
                return res.status(400).send({ "error": "Please, fill all required fields!" });

            }else{

                let tasker = retrievedTaskers[0];

                tasker.total_tasks++; 
                tasker.reviews.push(review);

                helpers.saveAll([tasker, review]).then(() => {

                    res.json({ "message": "Success!" });
                    
                }).catch(err => {
                    res.status(500).send(err.message);
                });
            }

        }).catch(err => {
            return res.status(500).send(err.message);
        });

    } else { //update review

        Review.get({ _id: reviewJson._id }).then(retrievedReview => {

            if (retrievedReview === null || retrievedReview.length <= 0) {
                return res.status(400).send({ "error": "Please, fill all required fields!" });
            }

            if (retrievedReview[0]._doc.client._id.toString() !== token.id){
                return res.status(401).send({ "error": "You can't change this review!" });
            }

            let review = retrievedReview[0];
            review.text = reviewJson.text;
            review.stars = reviewJson.stars;
            
            review.save(err => {
                if (err) {
                    return res.status(500).send(err.message);
                }
                res.json({ "message": "Success!" });
            });

        }).catch(err => {
            return res.status(500).send(err.message);
        });
    }
};


const getReviewFromJson = jsonObject => {
    let review = {};

    let basicFields = ["tasker", "text", "stars"];

    if (jsonObject._id !== undefined){
        review._id = jsonObject._id;
    }

    //fields validation
    for (let i = 0; i < basicFields.length; i++) {
        let field = basicFields[i];
        if (jsonObject[field] !== undefined) {
            review[field] = jsonObject[field];
        } else {
            return false;
        }
    }

    return review;
};