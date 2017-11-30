const ServiceModel = require('../models/service-model');

const log4js = require('log4js');

const logger = log4js.getLogger(process.env.LOGGER_NAME);

exports.getServices = (where) => {
    return new Promise((resolve, reject) => {
        ServiceModel.get(where).then(services => {
            resolve(services);
        }).catch(err => {
            logger.error({ source: 'service.get', err });

            reject({ code: 500, "message": "Please try again!" });
        });
    });
};