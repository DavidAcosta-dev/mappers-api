const mongoose = require('mongoose');//import mongoose (Do we use mongoose in here?)
mongoose.Promise = global.Promise;// i don't think we're using this here....

const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');

const { v4: uuidv4 } = require('uuid');
const { Place } = require('../models/place');


//Temporary dummy data
const DUMMY_DATA = [
    {
        id: 'p1',
        title: 'Empire State Building',
        description: 'One of the most famous sky scrapers in the world!',
        location: {
            lat: 40.7484474,
            lng: -73.9871516
        },
        address: '100 new york drive, 898808, NYC, NY',
        creator: 'u1'
    },
    {
        id: 'p2',
        title: 'El Dorado.',
        description: 'Its a fabled city of Gold lost to time in the middle of the central american jungles.',
        location: {
            lat: 200,
            lng: -360
        },
        address: 'Middle of the Jungle???',
        creator: 'u2'
    },
    {
        id: 'p3',
        title: 'CAve of Wonders',
        description: 'A forbidden cave holding the lamp. Only the diamond in the rough may enter.',
        location: {
            lat: 33.542345345234,
            lng: -52.9872345324
        },
        address: 'Arabia',
        creator: 'u2'
    }
];


//----------------------------------Pure logic for handling requests...--------------------------

//Get place by id
const getPlaceById = (req, res, next) => {
    console.log('GET request in Places');
    const placeId = req.params.id;

    Place.findById(placeId)
        .then(plc => {
            if (!plc) {
                const error = new HttpError('Could not find any place for the provided place id.', 404);
                return next(error);
            };
            return res.status(200).json(plc);
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
            return res.status(200).json(places).end();
        })
        .catch(err => {
            const error = new HttpError(`Could not fetch any places, internal server error, whoops, sorry! :S ${err.reason}`, 500);
            return next(error);
        });

};
//--------------------------------END of GET /places/user/:id-----------------------------------//



//POST new place
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

    Place.create({ title, description, image: "https://i.ibb.co/cDvQyJ8/default-Place-Icon.jpg", address, location: coordinates, creator })
        .then(plc => {
            res.status(201).json(plc).end();
        })
        .catch(err => {
            const error = new HttpError(`Failed Creating place: ${err}`, 500);
            return next(error)
        });
};
//--------------------------------END of POST /places/-----------------------------------//




//PATCH an existing place using id
const patchPlaceById = (req, res, next) => {
    console.log('Updating place...');
    //ensure body id and url id match
    if (req.params.id !== req.body.id) {
        const errMsg = "Please ensure the req.body.id and url params id match. Must include both.";
        console.error(errMsg);
        res.status(400).send(errMsg).end();
    };

    //make new object out of all valid fields in updateableFields
    const updateableFields = ["title", "description"];
    const newBody = {};
    updateableFields.forEach(field => {
        if (field in req.body) {
            newBody[field] = req.body[field];
        };
    });

    console.log(newBody);

    DUMMY_DATA.find(place => {
        if (place.id === req.body.id) {
            DUMMY_DATA[place] = Object.assign(place, newBody);
        }
    });
    const updatedPlace = DUMMY_DATA.find(place => place.id === req.params.id);
    res.status(200).json(updatedPlace);
};



//DELETE place by id
const deletePlaceById = (req, res, next) => {
    // const DUMMY_DATA.find(place=> place.id === req.params.id);
    const itemIndexToDelete = DUMMY_DATA.findIndex(place => place.id === req.params.id);
    console.log(itemIndexToDelete);
    if (itemIndexToDelete < 0) { //this means it doesn't exist.
        throw new HttpError('Could not find place by that id.', 401);
    };
    DUMMY_DATA.splice(itemIndexToDelete, 1);
    //DUMMY_DATA = DUMMY_DATA.filter(place => place.id !== req.params.id);  <--- this works too but only if you make the dummydata a let instead of a const at top.
    return res.status(200).end();
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