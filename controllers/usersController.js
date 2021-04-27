"use strict";
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;// i don't think we're using this here....

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');
const { User } = require('../models/user');
const { Place } = require('../models/place');
const { JWT_KEY_SECRET } = require('../config');




const getUsers = (req, res, next) => {
    //setup filterable options that return filtered users. If no filters indicated in req queryparams, then return all users.
    if (Object.keys(req.query).length < 1) {
        console.log("no query specified. Getting ALL users.");
        User.find()
            .then(users => {
                res.status(200)
                return res.json(users.map(usr => usr.easyRead())).end();
            });
        return
    };

    const filters = {};
    const queryableFields = ["firstName", "lastName", "email", "_id"];

    queryableFields.forEach(field => {
        if (req.query[field]) {
            filters[field] = req.query[field]
        }
    });

    User.find(filters)
        .then(users => {
            return res.status(200).json(users.map(user => user.easyRead()));
        })
        .catch(err => {
            const error = new HttpError(`Failed to fetch any users. ${err.reason}`, 500);
            return next(error);
        });

};



const getUserById = (req, res, next) => {

    console.log('Getting user by id');

    User.findById(req.params.id)
        .then(user => {
            if (!user) {
                const error = new HttpError('Could not find any user for the provided user id.', 404);
                return next(error);
            };
            return res.status(200).json(user.easyRead());
        })
        .catch(err => {
            const error = new HttpError(`Could not fetch place: ${err.reason}`, 500);
            return next(error);
        });

};



//-------------------------POST new user-----------------------------------------------
const signupNewUser = (req, res, next) => {
    console.log("POSTING new user");
    const requiredFields = ["firstName", "lastName", "email", "password"];
    for (let i = 0; i < requiredFields.length; i++) {
        if (!(req.body[requiredFields[i]])) {
            const errMsg = `Missing "${requiredFields[i]}" field in body`;
            console.error(errMsg);
            return res.status(400).send(errMsg);
        };
    };


    //normalize email...
    req.body.email = req.body.email.toLowerCase();

    User.findOne({ email: req.body.email })
        .then(user => {
            //check if user already exists by querying for email
            if (user) {
                const error = new HttpError('Looks like that email is already in use. Please login instead.', 422);
                return next(error);
            }

            const { firstName, lastName, email, password } = req.body;

            //pass the password and the salting strength or number of salt rounds to 
            //succifiently encrypt the password so that it can't be reverse engineered 
            //but also doesn't take hours to create. 
            //This returns a promise.
            bcrypt.hash(password, 12)
                .then(pw => {
                    //store hashed password in newUser object
                    const newUser = {
                        firstName,
                        lastName,
                        email,
                        password: pw
                    };

                    if (req.file) {
                        newUser.image = req.file.path.replace("\\", "/");
                    }

                    //now store it in database...
                    User.create(newUser)
                        .then(usr => {

                            //after successfully storing in database, generate JWT for client...
                            //pass data payload, server secret/private key, and token options like expiration time.
                            const token = jwt.sign(
                                { userId: usr.id, email: usr.email },
                                JWT_KEY_SECRET,
                                { expiresIn: '1hr' }
                            );

                            //token generation worked. pass it to client so they can store it.
                            const response = {
                                user: usr.easyRead(),
                                token
                            };

                            return res.status(201).json(response).end();

                        })
                        .catch(err => {
                            console.error(err);
                            const errMsg = new HttpError(`failed creating password. ${err.reason}`, 500);
                            return next(errMsg);
                        });

                });//----end of User.create


        })
        .catch(err => {
            const error = new HttpError(`Signup failed, please try again. ${err.reason}`, 500);
            return next(error);
        });

};





//Login existing user
const loginUser = (req, res, next) => {
    //normalize email...
    req.body.email = req.body.email.toLowerCase();
    //check if user already exists by querying for email
    User.findOne({ email: req.body.email })
        .then(user => {
            if (!user) {
                const error = new HttpError('Could not find a user with that email. Please try a different email or sign up instead.', 422);
                return next(error);
            }

            //Now that user exists check if the req.body.password matches the user.password that we fetched...
            bcrypt.compare(req.body.password, user.password)
                .then((isValidPassword) => {

                    //if the compare returns false, send a 401 back to client..
                    if (!isValidPassword) {
                        const error = new HttpError(`Invalid password. Try again.`, 403);
                        return next(error);
                    }

                    //since isValidPassword is true after comparing, we can now generate a JWT
                    //pass data payload, server secret/private key, and token options like expiration time.
                    const token = jwt.sign(
                        { userId: user.id, email: user.email },
                        JWT_KEY_SECRET,
                        { expiresIn: '1hr' }
                    );

                    //token generation worked. pass it to client so they can store it.
                    const response = {
                        message: 'Login Successful!',
                        user: user.easyRead(),
                        token
                    };

                    return res.status(200).json(response).end();
                })
                .catch(err => {
                    const error = new HttpError(`Password compare operation failed. ${err.reason}`, 400);
                    return next(error);
                });
        })
        .catch(err => {
            const error = new HttpError(`Login failed, please try again. ${err.reason}`, 500);
            return next(error);
        });

};



const updateUserById = (req, res, next) => {
    //check if that user id exists
    User.findById(req.params.id)
        .then(user => {
            if (!user) {
                const error = new HttpError('Could not find any user for the provided user id.', 404);
                return next(error);
            };
            //else if user exists, check fields and create a user
            const updateableFields = ["firstName", "lastName", "password"];
            const newUser = {};
            updateableFields.forEach(field => {
                if (field in req.body) {
                    newUser[field] = req.body[field];
                }
            });

            //Now update the user
            User.findByIdAndUpdate(req.params.id, newUser)
                .then(usr => {
                    return res.status(200).json(usr.easyRead()).end();
                })
        })
        .catch(err => {
            const error = new HttpError(`Update failed, please try again. ${err.reason}`, 500);
            return next(error);
        });
};



//DELETE a user using id
const deleteUserById = (req, res, next) => {
    console.log('Deleting user...');
    //Check if user exists first
    User.findById(req.params.id)
        .then(user => {
            if (!user) {
                const error = new HttpError('Could not find any user for the provided user id.', 404);
                return next(error);
            }
            //Since the creator does exist, we will now delete all his places first.
            Place.remove({ creator: req.params.id })
                .then(() => {
                    //Now Delete the user
                    User.findByIdAndDelete(req.params.id)
                        .then(() => {
                            return res.status(200).send(`Successfully deleted user with id of ${req.params.id}`).end();
                        })
                        .catch(err => {
                            const error = new HttpError(`Deleting user failed, please try again. ${err.reason}`, 500);
                            return next(error);
                        });
                })
                .catch(err => {
                    const error = new HttpError(`Deleting places failed, please try again. ${err.reason}`, 500);
                    return next(error);
                });


            //---------
        })
        .catch(err => {
            const error = new HttpError(`Internal Server error, please try again. ${err.reason}`, 500);
            return next(error);
        });

};



module.exports = {
    getUserById,
    getUsers,
    signupNewUser,
    loginUser,
    updateUserById,
    deleteUserById
};