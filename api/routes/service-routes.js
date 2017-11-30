var express = require('express');
var ServiceController = require('../controller/service');

var router  = express.Router();

const get = (req, res) => {
    ServiceController.getServices(null).then(services => {

        res.json(services);

    }).catch(err => {
        return res.status(err.code).json({ "message": err.message });
    });
};

router.get('/', get); 

module.exports = router;