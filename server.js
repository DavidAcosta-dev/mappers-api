"use strict";
//imports
const express = require('express');
const mongoose = require('mongoose');
mongoose.Promise = require('morgan');
const morgan = require('morgan');

const fs = require('fs');
const path = require('path');

//import environment variables
const { DATABASE_URL, PORT } = require('./config');

//import Routers
const placesRouter = require('./Routers/placesRouter');
const usersRouter = require('./Routers/usersRouter');

const app = express();

//apply middleware
// app.use(morgan('common'));//log http layer
app.use(express.json());//parse incoming json from PUT or POST

//serve static resources
app.use("/uploads/images", express.static(__dirname + "/uploads/images"));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Origin, X-Requested-With, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE, OPTIONS');
    next();
});


//apply router middleware
app.use('/api/places', placesRouter);
app.use('/api/users', usersRouter);

// catch-all endpoint if client makes request to non-existent endpoint
app.use("*", function (req, res) {
    res.status(404).json({ message: "🌴Page Not Found👻" });
});
//alternative to above.....
//import the HttpError class 
/*
app.use((req, res, next) => {
    const error = new HttpError("🌴Page Not Found👻", 404);
    throw error;
});
*/

//error handling middleware
app.use((error, req, res, next) => {
    //this if statement deletes the image that was uploaded if there was an error.
    if (req.file) {
        fs.unlink(req.file.path, (err) => {
            console.log(err);
        });
    };

    if (res.headerSent) {
        return next(erorr);
    }
    res.status(error.code || 500).json({ message: error.message || 'Whooops, an unknown error has occured on the server side.' })

});


//create server variable to assign later.
let server;

//Defing a function that we'll execute later.
//wrapping the mongoose.connect in a promise. mongoose.connect connects to a database
//then if successfull, express will create a server with app.listen just as before.
const runServer = (databaseUrl, port = PORT) => {

    return new Promise((resolve, reject) => {
        const connectOptions = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        };
        mongoose.connect(databaseUrl, connectOptions, err => {
            if (err) {
                return reject(err);
            }

            server = app
                .listen(port, () => {
                    console.log(`Your app is listening on port ${port}`);
                    resolve(server);
                })//end of express's app.listen which created and ran a server.
                .on("error", err => {
                    reject(err);
                });//end of .on() which is a more dynamic way of writing .catch()
        });//end of mongoose.connect

    });//end of Promise

};//end of runServer


const closeServer = () => {

    return mongoose.disconnect()
        .then(() => {
            return new Promise((resolve, reject) => {
                console.log("CLOSING SERVER");
                server.close(err => {
                    if (err) {
                        console.error(err);
                        console.log("Couldnt close");
                        reject(err);
                        return; //return so we don't call resolve as well
                    };//end of if err

                    //otherwise resolve since it closed fine without errors
                    resolve();
                });//end of server.close
            });//----end of Promise
        });//end of mongoose.disconnect.then()

};//end of closeServer



if (require.main === module) {
    runServer(DATABASE_URL)
        .catch(err => console.error(err));
}


module.exports = { app, runServer, closeServer };