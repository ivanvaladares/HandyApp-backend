var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    type: String,
    picture: String,
    name: String,
    email: String,
    password: String,
    tel: String,
    address: [],
    total_tasks: Number,
    location: { type: { type: String, enum: "Point", default: "Point" }, coordinates: { type: [Number], default: [0, 0] } },
    services: [{service: { type: mongoose.Schema.Types.ObjectId, ref: 'service' }, rate_hour: Number }],
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'review' }]//,
    //tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'task' }]
});

userSchema.index({ location: '2dsphere' });

userSchema.statics.get = where => {
    
    User.ensureIndexes();

    return new Promise((resolve, reject) => {

        //var query = User.find(where).select();
        //var query = User.find({ location: { $nearSphere: { $geometry: { type: "Point", coordinates: [33.2926487, 44.4159651] }, $maxDistance: 100000 } } })
        var query = User.find(where)
        .populate(
            { path: 'reviews', populate: { path: 'client', select: 'name picture' }, options: { limit: 5, sort: { 'date': -1 } } }
        )
        .populate(
            { path: 'services.service' }
            //{ path: 'services', match: { name: { $in: ['painting'] }} }  
        );
        //.select({services: {$gt: []}});//.where("services").gt(1);
    
        query.exec((err, results) => {
            if (err) return reject(err);
            resolve(results);
        });

    });
   
};

const User = mongoose.model('user', userSchema);

module.exports = User;