const express = require("express");

const User = require("../models/User");
const Business = require("../models/Business");
const Review = require("../models/Review");

const { requireAdmin } = require("../middleware/auth");

const router = express.Router();


// =====================================================
// ADMIN DASHBOARD
// =====================================================

router.get("/admin", requireAdmin, async (req, res) => {
    try {

        // =============================================
        // USER COUNTS
        // =============================================

        const userCount = await User.countDocuments();

        const ownerCount = await User.countDocuments({
            role: "owner"
        });

        const customerCount = await User.countDocuments({
            role: "customer"
        });


        // =============================================
        // BUSINESS COUNT
        // =============================================

        const businessCount = await Business.countDocuments();


        // =============================================
        // REVIEW COUNT
        // =============================================

        const reviewCount = await Review.countDocuments();


        // =============================================
        // BUSINESSES
        //
        // dashboard.ejs also expects:
        // businesses
        // nearbySearch
        // radius
        // =============================================

        const businesses = await Business.find()
            .populate("owner", "name email")
            .sort({ createdAt: -1 });


        // =============================================
        // DEFAULT LOCATION SEARCH VALUES
        // =============================================

        const nearbySearch = false;

        const radius = 25;


        // =============================================
        // RENDER ADMIN DASHBOARD
        // =============================================

        res.render("admin/dashboard", {

            // Statistics
            userCount,
            ownerCount,
            customerCount,
            businessCount,
            reviewCount,

            // Business data
            businesses,

            // Location/search data
            nearbySearch,
            radius
        });


    } catch (error) {

        console.error(
            "Admin dashboard error:",
            error
        );

        res.status(500).send(
            "Failed to load admin dashboard."
        );
    }
});



// =====================================================
// MANAGE USERS
// =====================================================

router.get(
    "/admin/users",
    requireAdmin,
    async (req, res) => {

        try {

            // =========================================
            // READ ROLE FROM URL
            //
            // /admin/users
            // /admin/users?role=owner
            // /admin/users?role=customer
            // =========================================

            const role = req.query.role || "all";

            const filter = {};


            // =========================================
            // FILTER USERS BY ROLE
            // =========================================

            if (
                role === "owner" ||
                role === "customer"
            ) {

                filter.role = role;

            }


            // =========================================
            // GET USERS
            // =========================================

            const users = await User.find(filter)
                .select("-password")
                .sort({ createdAt: -1 });


            // =========================================
            // RENDER USERS PAGE
            // =========================================

            res.render("admin/users", {

                users: users,

                selectedRole: role,

                userId: req.session.userId

            });


        } catch (error) {

            console.error(
                "Manage users error:",
                error
            );

            res.status(500).send(
                "Failed to load users."
            );
        }
    }
);



// =====================================================
// DELETE USER
// =====================================================

router.post(
    "/admin/users/delete/:id",
    requireAdmin,
    async (req, res) => {

        try {

            // =========================================
            // PREVENT ADMIN FROM DELETING THEMSELVES
            // =========================================

            if (
                req.session.userId &&
                req.params.id ===
                req.session.userId.toString()
            ) {

                return res.status(400).send(
                    "You cannot delete your own admin account."
                );

            }


            // =========================================
            // DELETE USER
            // =========================================

            const user =
                await User.findByIdAndDelete(
                    req.params.id
                );


            // =========================================
            // USER NOT FOUND
            // =========================================

            if (!user) {

                return res.status(404).send(
                    "User not found."
                );

            }


            // =========================================
            // LOG DELETE
            // =========================================

            console.log(
                "================================"
            );

            console.log(
                "USER DELETED SUCCESSFULLY"
            );

            console.log(
                "Name:",
                user.name
            );

            console.log(
                "Email:",
                user.email
            );

            console.log(
                "Role:",
                user.role
            );

            console.log(
                "================================"
            );


            // =========================================
            // RETURN TO USERS PAGE
            // -----------------------------------------
            // Preserve the filter selected by the admin.
            //
            // /admin/users
            // /admin/users?role=owner
            // /admin/users?role=customer
            // =========================================

            const role =
                ["all", "owner", "customer"].includes(
                    String(req.query.role || "").toLowerCase()
                )
                    ? String(req.query.role).toLowerCase()
                    : "all";


            if (role === "owner") {

                return res.redirect(
                    "/admin/users?role=owner"
                );

            }


            if (role === "customer") {

                return res.redirect(
                    "/admin/users?role=customer"
                );

            }


            return res.redirect(
                "/admin/users"
            );


        } catch (error) {

            console.error(
                "Delete user error:",
                error
            );

            res.status(500).send(
                "Failed to delete user."
            );
        }
    }
);



// =====================================================
// MANAGE BUSINESSES
// =====================================================

router.get(
    "/admin/businesses",
    requireAdmin,
    async (req, res) => {

        try {

            // =========================================
            // GET ALL BUSINESSES
            // =========================================

            const businesses =
                await Business.find()
                    .populate(
                        "owner",
                        "name email"
                    )
                    .sort({
                        createdAt: -1
                    });


            // =========================================
            // RENDER BUSINESSES PAGE
            // =========================================

            res.render(
                "admin/businesses",
                {
                    businesses: businesses
                }
            );


        } catch (error) {

            console.error(
                "Manage businesses error:",
                error
            );

            res.status(500).send(
                "Failed to load businesses."
            );
        }
    }
);



// =====================================================
// DELETE BUSINESS
// =====================================================

router.post(
    "/admin/businesses/delete/:id",
    requireAdmin,
    async (req, res) => {

        try {

            // =========================================
            // DELETE BUSINESS
            // =========================================

            const business =
                await Business.findByIdAndDelete(
                    req.params.id
                );


            // =========================================
            // BUSINESS NOT FOUND
            // =========================================

            if (!business) {

                return res.status(404).send(
                    "Business not found."
                );

            }


            // =========================================
            // LOG DELETE
            // =========================================

            console.log(
                "================================"
            );

            console.log(
                "BUSINESS DELETED SUCCESSFULLY"
            );

            console.log(
                "Business:",
                business.name
            );

            console.log(
                "================================"
            );


            // =========================================
            // RETURN TO BUSINESSES PAGE
            // =========================================

            res.redirect(
                "/admin/businesses"
            );


        } catch (error) {

            console.error(
                "Delete business error:",
                error
            );

            res.status(500).send(
                "Failed to delete business."
            );
        }
    }
);



// =====================================================
// MANAGE REVIEWS
// =====================================================

router.get(
    "/admin/reviews",
    requireAdmin,
    async (req, res) => {

        try {

            // =========================================
            // GET REVIEWS
            //
            // Review schema contains:
            //
            // user
            // business
            // rating
            // comment
            //
            // Therefore populate "user", not "customer".
            // =========================================

            const reviews =
                await Review.find()
                    .populate(
                        "user",
                        "name email"
                    )
                    .populate(
                        "business",
                        "name"
                    )
                    .sort({
                        createdAt: -1
                    });


            // =========================================
            // RENDER REVIEWS PAGE
            // =========================================

            res.render(
                "admin/reviews",
                {
                    reviews: reviews
                }
            );


        } catch (error) {

            console.error(
                "Manage reviews error:",
                error
            );

            res.status(500).send(
                "Failed to load reviews."
            );
        }
    }
);



// =====================================================
// DELETE REVIEW
// =====================================================

router.post(
    "/admin/reviews/delete/:id",
    requireAdmin,
    async (req, res) => {

        try {

            // =========================================
            // DELETE REVIEW
            // =========================================

            const review =
                await Review.findByIdAndDelete(
                    req.params.id
                );


            // =========================================
            // REVIEW NOT FOUND
            // =========================================

            if (!review) {

                return res.status(404).send(
                    "Review not found."
                );

            }


            // =========================================
            // LOG DELETE
            // =========================================

            console.log(
                "================================"
            );

            console.log(
                "REVIEW DELETED SUCCESSFULLY"
            );

            console.log(
                "Review ID:",
                review._id
            );

            console.log(
                "================================"
            );


            // =========================================
            // RETURN TO REVIEWS PAGE
            // =========================================

            res.redirect(
                "/admin/reviews"
            );


        } catch (error) {

            console.error(
                "Delete review error:",
                error
            );

            res.status(500).send(
                "Failed to delete review."
            );
        }
    }
);



// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;