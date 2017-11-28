if (process.env.NODE_ENV === 'production') {
    require('newrelic');
}

const express = require('express');
const bodyParser = require('body-parser');
const mongoose   = require('mongoose');

const log4js = require('log4js');
process.env.LOGGER_NAME = 'handyapp-logger';

const app = express();

/*---  Initializing the connection to the database ----*/
const mongo_uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/handyapp";

mongoose.Promise = global.Promise; /*--- ==> Using this because the default promisse of mongoose is depracated and gives annoying warnings */
mongoose.connect(mongo_uri, { useMongoClient: true }, err => {
    if(err){ throw err; }
});

log4js.configure({
    appenders: [
        {
            type: 'log4js-node-mongodb',
            connectionString: mongo_uri,
            category: process.env.LOGGER_NAME
        }
    ]
});

app.use(bodyParser.json({limit: '10mb'}));
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}));

/*--- Initializing the routes ---*/
require(`./api/routes/index`).init(app);

app.use(express.static('public'));

/*--- not found, go to routes test page ---*/
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