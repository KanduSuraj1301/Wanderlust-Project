const mongoose = require("mongoose");
const initData = require("./data");
const Listing = require("../models/listing.js");



main().then(() => {
    console.log("Connected to DB");
}).catch((err) => {
    console.log(err);
})

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
}

const initDB = async function () {
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) => ({ ...obj, owner: '681bc3e98907598f12abc106'}));
    await Listing.insertMany(initData.data);
    console.log("Data was added!!!");
}

initDB();