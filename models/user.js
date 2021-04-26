"use strict";
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

//create userSchema blueprint
const userSchema = mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    image: { type: String, required: true, default: "https://i.ibb.co/2dtXpf2/blank-avatar.webp" },
    places: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Place' }] //this doesn't make sense to me...Why setup a schema to hold this much information?
});

userSchema.plugin(uniqueValidator);



//setup your virtuals
userSchema.virtual("creatorFullName").get(function () {
    return `${this.firstName} ${this.lastName}`.trim();
});


//Setup your instance methods
userSchema.methods.easyRead = function () {

    return {
        id: this._id,
        firstName: this.firstName,
        lastName: this.lastName,
        fullName: this.creatorFullName, //using virtual to represent the creator property
        email: this.email,
        image: this.image,
        places: this.places || []
    }
};

const User = mongoose.model("User", userSchema, "users");
module.exports = { User };