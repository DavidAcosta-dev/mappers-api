const { default: axios } = require("axios");
const HttpError = require("../models/http-error");

const API_KEY = 'AIzaSyC2yN857FqpR3G_--MqfMHA4ZdP1jncwZI';

const getCoordsForAddress = async (address) => {

    const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`
    );

    const data = response.data;

    if (!data || data.status === 'ZERO_RESULTS') {
        const error = new HttpError('Could not find location for the specified address', 422);
        throw new error;
    }

    const coordinates = data.results[0].geometry.location;
    return coordinates;
};

module.exports = getCoordsForAddress;