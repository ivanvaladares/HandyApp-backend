const Service = require('../models/service-model');
const log4js = require('log4js');

const logger = log4js.getLogger(process.env.LOGGER_NAME);

exports.get = () => {

    return new Promise((resolve, reject) => {
        Service.get(null).then(services => {
            resolve(services);
        }).catch(err => {
            logger.error({ source: 'service.get', err });

            reject({ code: 500, "message": "Please try again!" });
        });
    });
};