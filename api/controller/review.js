const helpers = require("../helpers.js");

const User = require('../models/user-model');
const Review = require('../models/review-model');

exports.get = (json) => {

    return new Promise((resolve, reject) => {
        User.get({ _id: json.tasker }).then(retrievedUser => {
            
            resolve({results: retrievedUser[0].reviews});

        }).catch(() => {
            return reject({ code: 500, message: "Please try again!" });
        });
    });

};

exports.save = (json, token) => {

    return new Promise((resolve, reject) => {
        let review;

        let reviewJson = this.getReviewFromJson(json);
        
        if (reviewJson === false) {
            return reject({ code: 400, message: "Please, fill all required fields!" });
        }        

        if (reviewJson._id === undefined) { //new review
            
            review = new Review(reviewJson);
            review.client = token.id;
            review.date = new Date();

            User.get({ _id: reviewJson.tasker }).then(tasker => { //ensure it's a professional

                if (tasker === null || tasker.length <= 0 || tasker[0].type !== "professional") {
                    return reject({ code: 400, message: "Please, fill all required fields!" });

                }else{

                    tasker[0].total_tasks = tasker[0].total_tasks++; 
                    tasker[0].reviews.push(review);
    
                    const promiseArrays = helpers.createPromiseArraToSave([tasker[0], review]);
    
                    Promise.all(promiseArrays).then(() => {

                        resolve();
                        
                    }).catch(err => {

                        return reject({ code: 500, message: err.message });
                    });
                }

            }).catch(err => {
                return reject({ code: 500, message: err.message });
            });

        } else { //update review

            Review.get({ _id: reviewJson._id }).then(retrievedReview => {

                if (retrievedReview === null || retrievedReview.length <= 0) {
                    return reject({ code: 400, message: "Please, fill all required fields!" });
                }

                if (retrievedReview[0]._doc.client._id.toString() !== token.id){
                    return reject({ code: 401, message: "You can't change this review!" });
                }

                review = retrievedReview[0];
                review.text = reviewJson.text;
                review.stars = reviewJson.stars;
                
                review.save(err => {
                    if (err) {
                        return reject({ code: 500, message: err.message });
                    }
                    resolve();
                });

            }).catch(err => {
                return reject({ code: 500, message: err.message });
            });
        }

    });
       
};

exports.getReviewFromJson = jsonObject => {
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