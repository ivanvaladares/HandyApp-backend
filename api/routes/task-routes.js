var express = require('express');
const helpers = require("../helpers.js");
var TaskController = require('../controller/task');

var router  = express.Router();


const getTasks = (req, res) => {
    
    TaskController.getTasks(req.data, req.token).then(results => {

        res.json(results);

    }).catch(err => {
        return res.status(err.code).json({ "message": err.message });
    });

};

const saveTask = (req, res) => {

    TaskController.saveTask(req.data, req.token).then(results => {
        
        res.json(results);

    }).catch(err => {
        return res.status(err.code).json({ "message": err.message });
    });

};

const removeTask = (req, res) => {

    TaskController.removeTask(req.data, req.token).then(results => {
        
        res.json(results);

    }).catch(err => {
        return res.status(err.code).json({ "message": err.message });
    });

};
    
const acceptTask = (req, res) => {

    TaskController.acceptTask(req.data, req.token).then(results => {
        
        res.json(results);

    }).catch(err => {
        return res.status(err.code).json({ "message": err.message });
    });

};

const rejectTask = (req, res) => {
    
    TaskController.rejectTask(req.data, req.token).then(results => {
        
        res.json(results);

    }).catch(err => {
        return res.status(err.code).json({ "message": err.message });
    });

};

const completeTask = (req, res) => {

    TaskController.completeTask(req.data, req.token).then(results => {
        
        res.json(results);

    }).catch(err => {
        return res.status(err.code).json({ "message": err.message });
    });

};


router.post('/getTasks', helpers.isAuthenticated, getTasks);
router.post('/saveTask', helpers.isAuthenticated, saveTask);
router.post('/removeTask', helpers.isAuthenticated, removeTask);
router.post('/acceptTask', helpers.isAuthenticated, acceptTask);
router.post('/rejectTask', helpers.isAuthenticated, rejectTask);
router.post('/completeTask', helpers.isAuthenticated, completeTask);

module.exports = router;