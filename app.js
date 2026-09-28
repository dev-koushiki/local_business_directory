const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;

dotenv.config();

// ===============================
// ROUTES
// ===============================

const authRoutes = require("./routes/auth");
const customerRoutes = require("./routes/customer");
const ownerRoutes = require("./routes/owner");
const businessRoutes = require("./routes/business");
const adminRoutes = require("./routes/admin");

// ===============================
// APP
// ===============================

const app = express();

// ===============================
// MIDDLEWARE
// ===============================

app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));
app.use(express.json());

app.use(express.static("public"));

app.set("view engine", "ejs");

// ===============================
// SESSION
// ===============================

app.use(
    session({
        secret:
            process.env.SESSION_SECRET ||
            "local-business-secret",

        resave: false,

        saveUninitialized: false,

        store: MongoStore.create({
            mongoUrl: process.env.MONGODB_URI
        }),

        cookie: {
            maxAge: 1000 * 60 * 60 * 24
        }
    })
);

// ===============================
// ROUTES
// ===============================

app.use("/", authRoutes);

app.use("/", customerRoutes);

app.use("/", ownerRoutes);

app.use("/", businessRoutes);

app.use("/", adminRoutes);

// ===============================
// HOME
// ===============================

app.get("/", (req, res) => {
    res.render("home");
});

// ===============================
// MONGODB CONNECTION
// ===============================

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {

        console.log("================================");
        console.log("MongoDB connected successfully!");
        console.log("================================");

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {

            console.log(
                `Server running on port ${PORT}`
            );

        });

    })
    .catch((error) => {

        console.error("================================");
        console.error("MongoDB connection error:");
        console.error(error);
        console.error("================================");

    });