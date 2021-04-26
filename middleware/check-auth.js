const jwt = require('jsonwebtoken');
const { JWT_KEY_SECRET } = require('../config');

const HttpError = require("../models/http-error");

module.exports = (req, res, next) => {

    //Browser behavior is to send an 'OPTIONS' http method to the server first to see if
    //it would accept the post, patch, put, delete. It does this if you send anyting that isnt a GET request.
    if (req.method === 'OPTIONS') {
        return next();
    }


    try {

        const token = req.headers.authorization.split(' ')[1]; // Authorization: 'Bearer TOKEN'

        if (!token) {
            throw new Error('Auth failed.');
        }

        //verify the existing token. pass the server secret that was originally used to create it.
        //it returns the payload that we put into the token originally.
        const decodedToken = jwt.verify(token, JWT_KEY_SECRET);

        //since it passed verification, add a userId property and execute next() so it can reach the other endpoints like post, patch, delete
        req.userData = { userId: decodedToken.userId };
        next();
    } catch (err) {
        const error = new HttpError(`auth token failure. Please ensure a valid bearer token is set in the authorization header. ${err.reason}`, 403);
        return next(error);
    }
};