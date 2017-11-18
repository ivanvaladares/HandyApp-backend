if (process.env.NODE_ENV === 'production') {
    require('newrelic');
}    

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const mongoose   = require('mongoose');

// parse application/x-www-form-urlencoded
app.use(bodyParser.json({limit: '10mb'}));
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}));

//--- Initializing the connection to the database ---\\
const mongo_uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/handyapp"; //'mongodb://handyapp:!Q2w#E4r@ds259255.mlab.com:59255/heroku_mf9zfbnb'

mongoose.Promise = global.Promise; // ==> Using this because the default promisse of mongoose is depracated and gives annoying warnings
mongoose.Promise = global.Promise; // ==> Using this because the default promisse of mongoose is depracated and gives annoying warnings
mongoose.connect(mongo_uri, { useMongoClient: true });


//--- Initializing the routes ---\\
const initRoutes = require('./api/routes/init-routes');
const userRoutes = require('./api/routes/user-routes');

app.use('/init', initRoutes); 
app.use('/user', userRoutes); 

        
app.use(express.static('public'));

//not found, go to routes test page
app.get('*', (req, res) => {
    res.redirect('/routes.html');
});

const port = process.env.PORT || '3000';

app.listen(port, err => {
    if(err){ throw err; }
    console.log('test listening on port 3000!');
});