if (process.env.NODE_ENV != "production") {
    require('dotenv').config();
}


const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const engine = require('ejs-mate');
const listingRoute = require("./routes/listing.js")
const reviewRoute = require("./routes/review.js");
const userRoute = require("./routes/user.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const dbUrl = process.env.ATLASDB_URL;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(methodOverride("_method"));

app.engine('ejs', engine);
app.use(express.static(path.join(__dirname, "public")));


const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});

store.on("error", (err) => {
    console.log("ERROR in MONGO SESSION STORE", err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    }
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

main().then(() => {
    console.log("Connected to DB");
}).catch((err) => {
    console.log(err);
});


async function main() {
    await mongoose.connect(dbUrl);
}

app.listen(1328, () => {
    console.log("Server is listening at port 1328.");
});

// app.get("/", (req, res) => {
//     res.send("This is root Route!!");
// });

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// app.get("/demouser", async (req, res) => {
//     const fakeUser = new User({
//         email: "demouser@gmail.com",
//         username: "demo-user",
//     });

//     let registeredUser = await User.register(fakeUser, "demouser@123");
//     res.send(registeredUser);
// })


// Routes used after this line of code 

// this is call for user Route!!!
app.use("/", userRoute);

app.get("/", (req, res, next) => {
    res.redirect("/listings");
});

// This is call for Listing Route!!!
app.use("/listings", listingRoute);

// This is call for Review Route!!!
app.use("/listings/:id/reviews", reviewRoute);




// app.all("*", (req, res, next) => {
//     next(new ExpressError(404, "Page Not Found!!"));
// });


app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something is Error" } = err;
    res.status(statusCode).render("listing/error.ejs", { message });
});