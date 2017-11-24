var express = require('express');
var router  = express.Router();

var UserController = require('../controller/user');

//todo: remover este metodo
router.get('/', UserController.get); 

router.post('/login', UserController.login);

router.post('/saveProfile', UserController.saveProfile);

router.post('/searchProfessionals', UserController.searchProfessionals);

module.exports = router;