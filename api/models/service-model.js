var mongoose = require('mongoose');

var serviceSchema = mongoose.Schema({
    name: String,
    picture: String,
    order: Number
});          

serviceSchema.statics.get = where => {

    return new Promise((resolve, reject) => {
        var query = Service.find(where).sort({ 'order': 1 });

        query.exec((err, results) => {
            if (err) return reject(err);
            resolve(results);
        });

    });
};

const Service = mongoose.model('service', serviceSchema);

module.exports = Service;