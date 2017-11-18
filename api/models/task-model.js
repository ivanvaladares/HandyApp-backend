var mongoose = require('mongoose');

var taskSchema = mongoose.Schema({
    tasker: String,
    client: String,
    service: String,
    date: Date,
    hour: String,
    address: [],
    location: { 'type': {type: String, enum: "Point", default: "Point"}, coordinates: { type: [Number], default: [0, 0]} }
});          

taskSchema.statics.get = where => {
    return new Promise((resolve, reject) => {
        var query = Task.find(where).select();

        query.exec((err, results) => {
            if (err) return reject(err);
            resolve(results);
        });

    });
};

const Task = mongoose.model('task', taskSchema);

module.exports = Task;