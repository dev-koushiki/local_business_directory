const User = require("../models/User");


// =====================================================
// REQUIRE LOGIN
// =====================================================

function requireLogin(req, res, next) {

    if (!req.session.userId) {
        return res.redirect("/login");
    }

    next();
}


// =====================================================
// REQUIRE OWNER
// =====================================================

async function requireOwner(req, res, next) {

    try {

        // Check login
        if (!req.session.userId) {
            return res.redirect("/login");
        }

        // Get logged-in user from MongoDB
        const user = await User.findById(req.session.userId);

        // User does not exist
        if (!user) {
            return res.status(403).send(
                "User account not found."
            );
        }

        // Check role from database
        if (user.role !== "owner") {
            return res.status(403).send(
                "Access denied. Owner account required."
            );
        }

        next();

    } catch (error) {

        console.error("Owner authentication error:", error);

        res.status(500).send(
            "Authentication error."
        );
    }
}


// =====================================================
// REQUIRE CUSTOMER
// =====================================================

async function requireCustomer(req, res, next) {

    try {

        // Check login
        if (!req.session.userId) {
            return res.redirect("/login");
        }

        // Get logged-in user from MongoDB
        const user = await User.findById(req.session.userId);

        // User does not exist
        if (!user) {
            return res.status(403).send(
                "User account not found."
            );
        }

        // Check role from database
        if (user.role !== "customer") {
            return res.status(403).send(
                "Access denied. Customer account required."
            );
        }

        next();

    } catch (error) {

        console.error("Customer authentication error:", error);

        res.status(500).send(
            "Authentication error."
        );
    }
}


// =====================================================
// REQUIRE ADMIN
// =====================================================

async function requireAdmin(req, res, next) {

    try {

        // Check login
        if (!req.session.userId) {
            return res.redirect("/login");
        }

        // Get logged-in user from MongoDB
        const user = await User.findById(req.session.userId);

        // User does not exist
        if (!user) {
            return res.status(403).send(
                "User account not found."
            );
        }

        // Check role from database
        if (user.role !== "admin") {
            return res.status(403).send(
                "Access denied. Admin account required."
            );
        }

        next();

    } catch (error) {

        console.error("Admin authentication error:", error);

        res.status(500).send(
            "Authentication error."
        );
    }
}


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    requireLogin,
    requireOwner,
    requireCustomer,
    requireAdmin
};