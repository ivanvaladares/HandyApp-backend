var express = require('express');
const helpers = require("../helpers.js");
var ReviewController = require('../controller/review');

var router  = express.Router();


const getReviews = (req, res) => {
    
    ReviewController.getReviews(req.data).then(results => {

        res.json(results);

    }).catch(err => {
        return res.status(err.code).json({ "message": err.message });
    });    
    
};

const saveReview = (req, res) => {

    ReviewController.saveReview(req.data, req.token, false).then(reviews => {
        
        res.json(reviews);

    }).catch(err => {
        return res.status(err.code).json({ "message": err.message });
    });    

};

router.post('/getReviews', helpers.isAuthenticated, getReviews);
router.post('/saveReview', helpers.isAuthenticated, saveReview);

module.exports = router;