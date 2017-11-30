var express = require('express');
const helpers = require("../helpers.js");
var UserController = require('../controller/user');

var router  = express.Router();


//todo: remove this method
const getUsers = (req, res) => {
    UserController.getUsers(null).then(users => {
        res.send("<pre>" + JSON.stringify(users, null, 4) + "</pre>"); //formatting to easy reading
    });
};

const login = (req, res) => {

    UserController.login(req.data).then(result => {
        
        res.json(result);

    }).catch(err => {
        return res.status(err.code).json({ "message": err.message });
    });

};

const saveProfile = (req, res) => {

    UserController.saveProfile(req.data, req.token).then(result => {
        
        res.json(result);

    }).catch(err => {
        return res.status(err.code).json({ "message": err.message });
    });

};

const searchProfessionals = (req, res) => {

    UserController.searchProfessionals(req.data).then(results => {
        
        res.json(results);

    }).catch(err => {
        return res.status(err.code).json({ "message": err.message });
    });    

};

router.get('/', getUsers); //todo: remove this route
router.post('/login', helpers.getPostDataAndToken, login);
router.post('/saveProfile', helpers.getPostDataAndToken, saveProfile);
router.post('/searchProfessionals', helpers.isAuthenticated, searchProfessionals);

module.exports = router;