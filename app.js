const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoosh = require('mongoose');
require('dotenv').config();

const placesRoutes = require('./routes/place.routes');

const usersRoutes = require('./routes/user.routes');



const HttpError = require('./models/http-error');
const app = express();


app.use(bodyParser.json());
app.use('/uploads/images', express.static(path.join('uploads', 'images')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Autorization'
    );
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
})


app.use('/api/places', placesRoutes);

app.use('/api/users', usersRoutes);

app.use((req, res, next) => {
    const error = new HttpError('Could not find the route', 404);
    throw error;
});

app.use((error, req, res, next) => {
    if (req.file) {
        fs.unlink(req.file.path, err => {
            console.log(err);
        })
    }
    if (res.headerSent) {
        return next(error);
    }
    res.status(error.code || 500);
    res.json({ message: error.message || 'Unfortunately Something went wrong' })
});



let port = 5000;




mongoosh.connect(process.env.mongodbUrl).then(() => {
    app.listen(process.env.PORT || port, () => {
        console.log(`Server connected ${port}`);
    })
}).catch(error => {
    console.log(error);
})
