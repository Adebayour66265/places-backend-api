const express = require('express');

const { check } = require('express-validator');

const placesContoller = require('../controllers/places-controller');
const fileUpload = require('../middleware/file-upload');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

router.get('/:pid', placesContoller.getPlaceById);

router.get('/user/:uid', placesContoller.getPlacesByUsersId);

router.use(checkAuth);

router.post(
    '/',
    fileUpload.single('image'),
    [
        check('title')
            .not()
            .isEmpty(),
        check('description')
            .isLength({ min: 5 }),
        check('address')
            .not()
            .isEmpty()
    ],
    placesContoller.createPlace);

router.patch('/:pid',
    [
        check('title')
            .not()
            .isEmpty(),
        check('description')
            .isLength({ min: 5 }),
        check('address')
            .not()
            .isEmpty()
    ], placesContoller.updatePlace);

router.delete('/:pid', placesContoller.deletePlace);


module.exports = router;