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

        var query = User.find(where)
                        .populate(
                            //{ path: 'reviews', populate: { path: 'client', select: 'name picture' }, options: { limit: 5, sort: { 'date': -1 } } }
                            { path: 'reviews', populate: { path: 'client', select: 'name picture' }, options: { sort: { 'date': -1 } } }
                        )
                        .populate(
                            { path: 'services.service' }
                        );
    
        query.exec((err, results) => {
            if (err) return reject(err);

            results.map(profile => {
                if (profile.reviews.length > 0) {

                    let rating = 0;

                    profile.reviews.map(review => {
                        rating += review._doc.stars;

                        review._doc.picture = review._doc.client.picture;
                        review._doc.client = review.client.name;
                    });

                    profile._doc.rating = (rating / profile.reviews.length).toFixed(2);
                }

                delete profile._doc.password;
            });

            resolve(results);
        });

    });
   
};

const User = mongoose.model('user', userSchema);

module.exports = User;