var express = require('express');
var router  = express.Router();
var TaskController = require('../controller/task');

router.post('/getTasks', TaskController.getTasks);

router.post('/saveTask', TaskController.saveTask);

module.exports = router;