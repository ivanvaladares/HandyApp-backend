var mongoose = require('mongoose');

var reviewSchema = mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    text: String,
    stars: Number,
    date: Date
});

reviewSchema.statics.get = where => {
    return new Promise((resolve, reject) => {
        var query = Review.find(where).populate(
            { path: 'client', select: 'picture name' }
        ).sort({ 'date': -1 });

        query.exec((err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};

const Review = mongoose.model('review', reviewSchema);

module.exports = Review;