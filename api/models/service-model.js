var mongoose = require('mongoose');

var serviceSchema = mongoose.Schema({
    name: String,
    picture: String
});          

serviceSchema.statics.get = where => {

    return new Promise((resolve, reject) => {
        var query = Service.find(where);

        query.exec((err, results) => {
            if (err) return reject(err);
            resolve(results);
        });

    });
};

const Service = mongoose.model('service', serviceSchema);

module.exports = Service;