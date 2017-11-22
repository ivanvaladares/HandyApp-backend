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
const mongo_uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/handyapp";

mongoose.Promise = global.Promise; // ==> Using this because the default promisse of mongoose is depracated and gives annoying warnings
mongoose.Promise = global.Promise; // ==> Using this because the default promisse of mongoose is depracated and gives annoying warnings
mongoose.connect(mongo_uri, { useMongoClient: true }, err => {
    if(err){ throw err; }
});


//--- Initializing the routes ---\\
const initRoutes = require('./api/routes/init-routes');
const userRoutes = require('./api/routes/user-routes');
const taskRoutes = require('./api/routes/task-routes');

app.use('/init', initRoutes); 
app.use('/user', userRoutes); 
app.use('/task', taskRoutes); 


app.use(express.static('public'));

//not found, go to routes test page
app.get('*', (req, res) => {
    res.redirect('/routes.html');
});

const port = process.env.PORT || '3000';

let server = app.listen(port, err => {
    if(err){ throw err; }
    console.log('test listening on port 3000!');
    app.emit('testEvent');
});


if (process.env.NODE_ENV === 'test'){
    app.on('finishTest', () => {
        server.close();
    });

    module.exports = app;
}