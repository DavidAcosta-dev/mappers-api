"use strict";
//import mongoose. Going to ise it's libraray to create schemas
const mongoose = require('mongoose');


//create placeSchema blueprint
const placeSchema = mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true, default: "https://i.ibb.co/cDvQyJ8/default-Place-Icon.jpg" },//we don't store images on a database. Use CDN instead.
    address: { type: String, required: true },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, //replace this later with an ObjectId type
});

//Setup your pre-hooks to populate the place with the creator's info...
placeSchema.pre('findOne', function (next) {
    this.populate('creator');
    next();
});

placeSchema.pre('find', function (next) {
    this.populate('creator');
    next();
});

//setup your virtuals
placeSchema.virtual("creatorFullName").get(function () {
    return `${this.creator.firstName} ${this.creator.lastName}`.trim();
});


//Setup your instance methods
placeSchema.methods.easyRead = function () {

    return {
        id: this._id,
        title: this.title,
        creator: this.creatorFullName, //using virtual to represent the creator property
        creatorId: this.creator,
        description: this.description,
        image: this.image,
        address: this.address,
        location: this.location
    }
};





const Place = mongoose.model("Place", placeSchema, "places");

module.exports = { Place };