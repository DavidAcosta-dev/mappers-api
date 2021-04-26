'use strict';
const express = require('express');
const router = express.Router();

const { check } = require('express-validator');

const usersControllers = require('../controllers/usersController.js');
const fileUpload = require('../middleware/file-upload.js');



//GET user by id
router.get('/:id', usersControllers.getUserById);

//GET users
router.get('/', usersControllers.getUsers);

//POST new user
router.post('/signup', fileUpload.single('image'), usersControllers.signupNewUser);


//Login existing user
router.post('/login', usersControllers.loginUser);

//Update user using id
router.patch('/:id', usersControllers.updateUserById);

//Delete user using id
router.delete('/:id', usersControllers.deleteUserById);



module.exports = router;