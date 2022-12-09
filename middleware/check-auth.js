const jwt = require('jsonwebtoken');
const HttpError = require('../models/http-error');
require('dotenv').config();


module.exports = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        return next();
    }

    try {
        const token = req.headers.authorization.split(' ')[1];
        if (!token) {
            throw new Error(
                'Authentication failed');
        }
        const decodeToken = jwt.verify(token, process.env.JWT_KEY);
        req.userData = { userId: decodeToken.userId };
        next();
    } catch (err) {
        const error = new HttpError(
            'Authentication failed', 403
        );
        return next(error);
    }
};