var mongoose = require('mongoose');

var taskSchema = mongoose.Schema({
    tasker: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'service' },
    date: Date,
    hour: String,
    address: [],
    accepted: Boolean,
    completed: Boolean,
    rejected: Boolean,
    location: { 'type': {type: String, enum: "Point", default: "Point"}, coordinates: { type: [Number], default: [0, 0]} }
});          

taskSchema.statics.get = where => {
    return new Promise((resolve, reject) => {
        var query = Task.find(where).populate(
            { path: 'tasker', select: 'picture name email tel' }
        ).populate(
            { path: 'client', select: 'picture name email tel' }
        ).populate(
            { path: 'service' }
        );

        query.exec((err, results) => {
            if (err) return reject(err);
            resolve(results);
        });

    });
};

const Task = mongoose.model('task', taskSchema);

module.exports = Task;