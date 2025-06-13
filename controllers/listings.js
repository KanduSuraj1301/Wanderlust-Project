const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });


module.exports.index = async (req, res) => {
    const { category, q } = req.query;
    let allListing;
    let queryObj = {};

    // Apply category filter if it's not default
    if (category && category !== "Trending" && category !== "Rooms") {
        queryObj.category = category;
    }

    // Apply search filter using regex or number
    if (q) {
        const regex = new RegExp(q, 'i'); // case-insensitive
        const priceQuery = Number(q);

        queryObj.$or = [
            { title: regex },
            { description: regex },
            { location: regex },
            { country: regex },
            ...(isNaN(priceQuery) ? [] : [{ price: priceQuery }]) // only include if q is a number
        ];
    }

    allListing = await Listing.find(queryObj);

    res.render("listing/index.ejs", {
        allListing,
        selectedCategory: category || "",
        searchText: q || ""
    });
};


module.exports.renderNewForm = (req, res) => {
    res.render("listing/new.ejs");
}

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate({ path: "reviews", populate: { path: "auther" } }).populate("owner");
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    // console.log(listing);
    res.render("listing/show.ejs", { listing });
}

module.exports.createListing = async (req, res, next) => {
    // console.log(req.body.listing);}
    let responce = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1
    })
        .send()

    let url = req.file.path;
    let filename = req.file.filename;
    let newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    newListing.geometry = responce.body.features[0].geometry;
    let savedListing = await newListing.save();
    console.log(savedListing);
    req.flash("success", "New Listing Created!!");
    res.redirect("/listings");
}

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    let originalImageUrl = listing.image.url;
    // console.log(originalImageUrl);
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/c_pad,h_250,w_300");
    // console.log(originalImageUrl);
    res.render("listing/edit.ejs", { listing, originalImageUrl });
}

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    // console.log(req.body.listing);
    let listing = await Listing.findByIdAndUpdate(id, req.body.listing);

    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
    }
    let responce = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1
    })
        .send()
    listing.geometry = responce.body.features[0].geometry;
    await listing.save();
    req.flash("success", "Listing Updated.");
    res.redirect(`/listings/${id}`);
}

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    const deletedListing = await Listing.findByIdAndDelete(id);
    // console.log(deletedListing);
    req.flash("success", "Listing Deleted.");
    res.redirect("/listings");
}