var express = require('express');
var router  = express.Router();

var TaskController = require('../controller/task');

router.post('/getTasks', TaskController.getTasks);

router.post('/saveTask', TaskController.saveTask);

router.post('/removeTask', TaskController.removeTask);

router.post('/acceptTask', TaskController.acceptTask);

router.post('/rejectTask', TaskController.rejectTask);

router.post('/completeTask', TaskController.completeTask);

module.exports = router;