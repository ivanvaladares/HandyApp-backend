var express = require('express');
var router  = express.Router();

var ReviewController = require('../controller/review');

router.post('/getReviews', ReviewController.getReviews);

router.post('/saveReview', ReviewController.saveReview);

module.exports = router;