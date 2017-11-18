var mongoose = require('mongoose');

var reviewSchema = mongoose.Schema({
    picture: String,
    client: String,
    text: String,
    stars: Number,
    date: Date
});          

reviewSchema.statics.get = where => {
    return new Promise((resolve, reject) => {
        var query = Review.find(where).select();

        query.exec((err, results) => {
            if (err) return reject(err);
            resolve(results);
        });

    });
};

const Review = mongoose.model('review', reviewSchema);

module.exports = Review;