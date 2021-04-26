const mongoose = require('mongoose');//import mongoose (Do we use mongoose in here?)
mongoose.Promise = global.Promise;// i don't think we're using this here....

const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');

const fs = require('fs');

const { Place } = require('../models/place');


//----------------------------------Pure logic for handling requests...--------------------------

//-------------------------------Get place by id-------------------------------------------
const getPlaceById = (req, res, next) => {
    console.log('GET request in Places');
    const placeId = req.params.id;

    Place.findById(placeId)
        .then(plc => {
            if (!plc) {
                const error = new HttpError('Could not find any place for the provided place id.', 404);
                return next(error);
            };
            return res.status(200).json(plc.easyRead());
        })
        .catch(err => {
            const error = new HttpError(`Could not fetch place: ${err.reason}`, 500);
            return next(error);
        });

};
//--------------------------------END of GET /places/:id-----------------------------------//



//Get place by place's creator id
const getPlacesByCreatorId = (req, res, next) => {
    console.log('Getting places by place creator id');
    const filter = { creator: req.params.id };
    Place.find(filter)
        .then(places => {
            if (places.length < 1) {
                return next(new HttpError('Could not find any place for the provided creator id.', 404));
            }

            return res.status(200).json(places.map(plc => plc.easyRead())).end();
        })
        .catch(err => {
            const error = new HttpError(`Could not fetch any places, internal server error, whoops, sorry! :S ${err.reason}`, 500);
            return next(error);
        });

};
//--------------------------------END of GET /places/user/:id-----------------------------------//



//---------------POST new place-------------------------------------------------------
const createNewPlace = async (req, res, next) => {
    console.log('POSTing new place');
    /*
    Note: alternative to checking requiredFields...
        const validationErrors = validationResult(req);
        if(!validationErrors.isEmpty()) {
            throw new HttpError('Invalid inputs, please check and submit again.', 422)
        }; 
    */

    //Make sure all required fields exist in req.body
    const requiredFields = ["title", "description", "address", "creator"];
    const missingFields = [];
    requiredFields.forEach(field => {
        if (!req.body[field]) {
            missingFields.push(field);
        };
    });
    //if there are any missing fields, throw error.
    if (missingFields.length > 0) {
        return next(new HttpError(`Missing following fields: '${missingFields}'`, 422));
    }

    const { title, description, address, creator } = req.body;
    //call the google geocoding api to convert the address to a set of coordinates.
    let coordinates;
    try {
        coordinates = await getCoordsForAddress(address)
    } catch (error) {
        return next(error);
    };

    const newPlace = { title, description, address, location: coordinates, creator: req.userData.userId };

    if (req.file) {
        newPlace.image = req.file.path.replace("\\", "/");
    }

    Place.create(newPlace)
        .then(plc => {
            Place.findById(plc.id)
                .then(place => {
                    return res.status(201).json(place.easyRead()).end();
                });
        })
        .catch(err => {
            const error = new HttpError(`Failed Creating place: ${err}`, 500);
            return next(error)
        });
};
//--------------------------------END of POST /places/-----------------------------------//




//-----------------PATCH an existing place using id-----------------------------------------
const patchPlaceById = (req, res, next) => {
    console.log('Updating place...');

    //make new object out of all valid fields in updateableFields
    const updateableFields = ["title", "description", "image"];
    const newBody = {};
    updateableFields.forEach(field => {
        if (field in req.body) {
            newBody[field] = req.body[field];
        };
    });

    console.log(newBody);

    Place.findById(req.params.id)
        .then(place => {

            //if place was found, validate that the user logged in is authorized to update it.
            if (place.creator.id !== req.userData.userId) {
                const error = new HttpError(`You are not authorized to edit this place.`, 401);
                return next(error);
            };

            //if authorized, update as intended.
            Place.findByIdAndUpdate(req.params.id, { $set: newBody }, { new: true })
                .then(place => {
                    Place.findById(place.id)
                        .then(plc => {
                            return res.status(200).json(plc.easyRead()).end();
                        });
                })
                .catch(err => {
                    const error = new HttpError(`Failed to update place, ${err.reason}.`, 500);
                    return next(error);
                });

        })
        .catch(err => {
            const error = new HttpError(`Could not find place. ${err.reason}.`, 500);
            return next(error);
        });




};
//--------------------------------END of PATCH /places/:id-----------------------------------//



//DELETE place by id
const deletePlaceById = (req, res, next) => {
    let imagePath;

    Place.findById(req.params.id)
        .then(place => {

            if (place.creator.id !== req.userData.userId) {
                const error = new HttpError(`You are not authorized to delete this place.`, 401);
                return next(error);
            };

            imagePath = place.image;// we will delete this later...

            Place.findByIdAndDelete(req.params.id)
                .then(() => {
                    //now that the place has been deleted, just delete the image.
                    fs.unlink(imagePath, err => {
                        console.log(err);
                    });
                    return res.status(200).json(`Successfully deleted place with it of ${req.params.id}.`).end();
                })
                .catch(err => {
                    const error = new HttpError(`Failed to delete place, ${err.reason}.`, 500);
                    return next(error);
                });
        });


};



module.exports = {
    getPlaceById,
    getPlacesByCreatorId,
    createNewPlace,
    patchPlaceById,
    deletePlaceById
};
// exports.getPlaceById = getPlaceById;
// exports.getPlacesByCreatorId = getPlacesByCreatorId;


/*NOTE: for validation, we can also use 'express-validator' package.
  exmaple: within the function, you would write...

    const validationErrors = validationResult(req);  pass the req object to validationResults() and you get a scanned/checked version of the req object that's been checked against the rules that you set up in the placeRouter.js.
    if(!validationErrors.isEmpty()) {
        throw new HttpError('Invalid inputs, please check and submit again.', 422)
    };

*/