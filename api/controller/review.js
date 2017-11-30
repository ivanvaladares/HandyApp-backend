const ReviewModel = require('../models/review-model');
const UserController = require('../controller/user');

const helpers = require("../helpers.js");
const log4js = require('log4js');

const logger = log4js.getLogger(process.env.LOGGER_NAME);

exports.getReviews = (data) => {

    return new Promise((resolve, reject) => {

        UserController.getUsers({ _id: data.tasker }).then(retrievedUser => {

            let reviews = [];

            if (retrievedUser !== null && retrievedUser.length === 1) {
                reviews = retrievedUser[0].reviews;
            }

            resolve({results: reviews});
    
        }).catch(err => {
            logger.error({source: 'review.getReviews', err, data});

            reject({ code: 500, "message": "Please try again!" });

        });    
    
    });

};

exports.saveReview = (data, token, taskCompleted) => {
    
    return new Promise((resolve, reject) => {

        let reviewJson = getReviewFromJson(data);
        
        if (reviewJson === false) {
            return reject({ code: 400, "message": "Please, fill all required fields!" });
        }        

        if (reviewJson._id === undefined) { //new review
            
            let review = new ReviewModel(reviewJson);
            review.client = token.id;
            review.date = new Date();

            UserController.getUsers({ _id: reviewJson.tasker }).then(retrievedTaskers => { //ensure it's a professional

                if (retrievedTaskers === null || retrievedTaskers.length <= 0 || retrievedTaskers[0].type !== "professional") {
                    return reject({ code: 400, "message": "Please, fill all required fields!" });

                }else{

                    let tasker = retrievedTaskers[0];
                    if (taskCompleted){
                        tasker.total_tasks++; 
                    }
                    tasker.reviews.push(review);

                    helpers.saveAll([tasker, review]).then(() => {

                        resolve({ "message": "Success!" });
                        
                    }).catch(err => {
                        logger.error({source: 'review.saveReview', err, data});
                        
                        reject({ code: 500, "message": err.message });
                    });
                }

            }).catch(err => {
                logger.error({source: 'review.saveReview', err, data});
                
                return reject({ code: 500, "message": err.message });
            });

        } else { //update review

            ReviewModel.get({ _id: reviewJson._id }).then(retrievedReview => {

                if (retrievedReview === null || retrievedReview.length <= 0) {
                    return reject({ code: 400, "message": "Please, fill all required fields!" });
                }

                if (retrievedReview[0]._doc.client._id.toString() !== token.id){
                    return reject({ code: 401, "message": "You can't change this review!" });
                }

                let review = retrievedReview[0];
                review.text = reviewJson.text;
                review.stars = reviewJson.stars;
                
                review.save().then(() => {
                    resolve({ "message": "Success!" });
                }).catch(err => {
                    logger.error({source: 'review.saveReview', err, data});
                    
                    return reject({ code: 500, "message": err.message });
                });

            }).catch(err => {
                logger.error({source: 'review.saveReview', err, data});
                
                return reject({ code: 500, "message": err.message });
            });
        }
    });

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