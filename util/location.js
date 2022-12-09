const axios = require('axios');
require('dotenv').config();

const HttpError = require('../models/http-error');

const API_KEY = process.env.GOOGLE_API_KEY;

async function getCoordsForAddress(address) {
    // return {
    //     lat: 40.5547662,
    //     lng: -58.2482668
    // }

    const respond = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
    )}&key=${API_KEY}`);

    const data = respond.data;

    if (!data || data.status === 'ZERO_RESULTS') {
        const error = new HttpError('Could not find location for the Specified address',
            422
        );
        throw error;
    }


    const coordinates = data.results[0].geometry.location;

    return coordinates;
}


module.exports = getCoordsForAddress;