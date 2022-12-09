const fs = require('fs');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');


const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');
const User = require('../models/user');

const getPlaceById = async (req, res, next) => {
    const placeId = req.params.pid;

    let place;
    try {
        place = await Place.findById(placeId);
    } catch (err) {
        const error = new HttpError(
            'Something went wrong Could not find the place',
            500
        );
        return next(error);
    }

    if (!place) {
        const error = new HttpError(
            'Could not find the place for provided Id.', 404
        );
        return next(error);
    }

    res.json({ place: place.toObject({ getters: true }) });
}


const getPlacesByUsersId = async (req, res, next) => {
    const userId = req.params.uid;

    // let places;
    let userWithPlaces;
    try {
        // places = await Place.find({ creator: userId });
        userWithPlaces = await User.findById(userId).populate('places');
    } catch (err) {
        const error = new HttpError(
            'Fetching places failed, please try again later',
            500
        );
        return next(error);
    }
    if (!userWithPlaces || userWithPlaces.places.length === 0) {
        return next(
            new HttpError('Could not find the places for the provided user Id.',
                404)
        );
        // return res.status(404).json({ message: 'Could not find the place for the provided User Id.'});
    }


    res.json({ places: userWithPlaces.places.map(place => place.toObject({ getters: true })) });
}






const updatePlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError(
            'Invalid input passed, check your data', 422));

    }

    const { title, description, address } = req.body;
    const placeId = req.params.pid;

    let place;
    try {
        place = await Place.findById(placeId);
    } catch (err) {
        const error = new HttpError(
            'Something went wrong, could not update', 500
        );
        return next(error);
    }

    if (place.creator.toString() !== req.userData.userId) {
        const error = new HttpError(
            'You are not allow to edit this place',
            401
        );
        return next(error);
    }

    place.title = title;
    place.description = description;
    place.address = address;

    try {
        await place.save();
    } catch (err) {
        const error = new HttpError(
            'Something went wrong, could not update', 500
        );
        return next(error);
    }
    res.status(200).json({ place: place.toObject({ getters: true }) });
}



const createPlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(
            new HttpError('Invalid input passed, check your data', 422
            ));
    }
    const { title, description, address } = req.body;

    let coordinates;
    try {
        coordinates = await getCoordsForAddress(address);
    } catch (error) {
        return next(error);
    }


    const createdPlace = new Place({
        title,
        description,
        address,
        location: coordinates,
        image: req.file.path,
        creator: req.userData.userId
    });


    let user;
    try {
        user = await User.findById(req.userData.userId);
    } catch (err) {
        const error = new HttpError(
            'Creating place Failed!, please try again',
            500
        );
        return next(error)
    }

    if (!user) {
        const error = new HttpError(
            'Could not find user for provided id',
            404
        );
        return next(error);
    }

    console.log(user);

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdPlace.save({ session: sess });
        user.places.push(createdPlace);
        await user.save({ session: sess });
        await sess.commitTransaction();
    } catch (err) {
        const error = new HttpError(
            'Creating place failed!, please try again later',
            500
        );
        return next(error);
    }

    console.log(createdPlace);

    res.status(201).json({ place: createdPlace });
}



const deletePlace = async (req, res, next) => {
    const placeId = req.params.pid;
    let place;

    try {
        place = await Place.findById(placeId).populate('creator');
    } catch (err) {
        const error = new HttpError(
            'Something went wrong Could not delete the place',
            500
        );
        return next(error);
    }

    if (!place) {
        const error = new HttpError(
            'Could not find the place for that Id',
            404
        );
        return next(error);
    }

    if (place.creator.id !== req.userData.userId) {
        const error = new HttpError(
            'You are not allow to delete',
            401
        );
        return next(error);
    }

    const imagePath = place.image;

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await place.remove({ session: sess });
        place.creator.places.pull(place);
        await place.creator.save({ session: sess });
        await sess.commitTransaction();
    } catch (err) {
        const error = new HttpError(
            'Something went wrong Could not delete the place',
            500
        );
        return next(error);
    }

    fs.unlink(imagePath, err => {
        console.log(err);
    });

    res.status(200).json({ message: 'Place Deleted' })
}



exports.getPlaceById = getPlaceById;
exports.getPlacesByUsersId = getPlacesByUsersId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;