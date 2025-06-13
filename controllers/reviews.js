const Listing = require("../models/listing");
const Review = require("../models/review");



module.exports.createReview = async (req, res) => {
    // console.log("Review POST route hit");
    let { id } = req.params;
    const listing = await Listing.findById(req.params.id);
    const newReview = new Review(req.body.review);
    newReview.auther = req.user._id;

    // console.log(newReview);

    listing.reviews.push(newReview);

    await listing.save();
    await newReview.save();

    req.flash("success", "Review Added Successfully.");
    // console.log("Review is saved!!");
    res.redirect(`/listings/${id}`);
}

module.exports.destroyReview = async (req, res) => {
    let { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review Deleted.");
    res.redirect(`/listings/${id}`);
}