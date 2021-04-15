"use strict";
//import mongoose. Going to ise it's libraray to create schemas
const mongoose = require('mongoose');

//create placeSchema blueprint
const placeSchema = mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },//we don't store images on a database. Use CDN instead.
    address: { type: String, required: true },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    creator: { type: String, required: true }, //replace this later with an ObjectId type
});





const Place = mongoose.model("Place", placeSchema, "places");

module.exports = { Place };