const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");

const Business = require("../models/Business");
const Review = require("../models/Review");

const router = express.Router();


// =====================================================
// IMAGE UPLOAD SETUP
// =====================================================

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },

    filename: function (req, file, cb) {
        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }
});


// =====================================================
// MULTER
// =====================================================

const upload = multer({
    storage: storage,

    fileFilter: function (req, file, cb) {

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    "Only JPG, PNG, and WebP images are allowed."
                )
            );
        }
    },

    limits: {
        fileSize: 5 * 1024 * 1024
    }
});


// =====================================================
// BUSINESS DETAILS PAGE
// =====================================================

router.get("/business/:id", async (req, res) => {

    try {

        const { id } = req.params;

        // Validate MongoDB ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send("Invalid business ID");
        }

        // IMPORTANT:
        // Find ONLY the business that was clicked
        const business = await Business.findById(id)
            .populate("owner", "name email")
            .lean();

        if (!business) {
            return res.status(404).send("Business not found");
        }

        // Find reviews ONLY for this business
        const reviews = await Review.find({
            business: business._id
        })
            .populate("user", "name")
            .sort({ createdAt: -1 })
            .lean();

        // Calculate average rating
        const averageRating = reviews.length
            ? reviews.reduce(
                (sum, review) =>
                    sum + Number(review.rating || 0),
                0
            ) / reviews.length
            : 0;

        // Prevent browser from showing an old business page
        res.set("Cache-Control", "no-store");

        // Debug information
        console.log("================================");
        console.log("BUSINESS DETAILS");
        console.log("Business:", business.name);
        console.log("Business ID:", business._id.toString());
        console.log("Reviews:", reviews.length);
        console.log("Average Rating:", averageRating);
        console.log("================================");

        // Render the selected business
        res.render("business-details", {
            business: business,
            reviews: reviews,
            averageRating: averageRating.toFixed(1),
            currentUser: req.session.userId || null
        });

    } catch (error) {

        console.error("Business details error:", error);

        res.status(500).send(
            "Failed to load business details."
        );
    }
});


// =====================================================
// ADD REVIEW
// =====================================================

router.post(
    "/business/:id/review",
    upload.array("reviewImages", 5),

    async (req, res) => {

        try {

            // =================================================
            // CUSTOMER LOGIN CHECK
            // =================================================

            if (!req.session.userId) {
                return res.redirect("/login");
            }


            // =================================================
            // GET FORM DATA
            // =================================================

            const {
                rating,
                comment
            } = req.body;


            // =================================================
            // VALIDATE RATING
            // =================================================

            const numericRating = Number(rating);

            if (
                !Number.isInteger(numericRating) ||
                numericRating < 1 ||
                numericRating > 5
            ) {

                return res.status(400).send(
                    "Rating must be between 1 and 5."
                );
            }


            // =================================================
            // VALIDATE COMMENT
            // =================================================

            if (
                !comment ||
                comment.trim() === ""
            ) {

                return res.status(400).send(
                    "Please write a review."
                );
            }


            // =================================================
            // VALIDATE BUSINESS ID
            // =================================================

            if (
                !mongoose.Types.ObjectId.isValid(
                    req.params.id
                )
            ) {

                return res.status(400).send(
                    "Invalid business ID."
                );
            }


            // =================================================
            // FIND BUSINESS
            // =================================================

            const business =
                await Business.findById(
                    req.params.id
                );

            if (!business) {

                return res.status(404).send(
                    "Business not found."
                );
            }


            // =================================================
            // SAVE REVIEW PHOTOS
            // =================================================

            const reviewImages = [];

            if (
                req.files &&
                req.files.length > 0
            ) {

                req.files.forEach(file => {

                    reviewImages.push(
                        "/uploads/" +
                        file.filename
                    );

                });
            }


            // =================================================
            // CREATE REVIEW
            // =================================================

            const review =
                new Review({

                    business: business._id,

                    user: req.session.userId,

                    rating: numericRating,

                    comment: comment.trim(),

                    images: reviewImages

                });


            await review.save();


            // =================================================
            // GET ALL REVIEWS FOR THIS BUSINESS
            // =================================================

            const reviews =
                await Review.find({
                    business: business._id
                });


            // =================================================
            // CALCULATE NEW RATING
            // =================================================

            const totalRating =
                reviews.reduce(
                    (sum, review) =>
                        sum +
                        Number(review.rating || 0),
                    0
                );

            const averageRating =
                reviews.length > 0
                    ? totalRating / reviews.length
                    : 0;


            // =================================================
            // UPDATE BUSINESS RATING
            // =================================================

            business.averageRating =
                averageRating;

            business.reviewCount =
                reviews.length;

            await business.save();


            // =================================================
            // SUCCESS LOG
            // =================================================

            console.log("================================");
            console.log("REVIEW CREATED SUCCESSFULLY");
            console.log("Business:", business.name);
            console.log("Business ID:", business._id);
            console.log("Customer:", req.session.userId);
            console.log("Rating:", numericRating);
            console.log("Review Count:", reviews.length);
            console.log("Average Rating:", averageRating);
            console.log("Review Photos:", reviewImages);
            console.log("================================");


            // =================================================
            // RETURN TO SAME BUSINESS PAGE
            // =================================================

            res.redirect(
                `/business/${business._id}`
            );

        } catch (error) {

            console.error(
                "Add review error:",
                error
            );


            // =================================================
            // FILE TOO LARGE
            // =================================================

            if (
                error.code ===
                "LIMIT_FILE_SIZE"
            ) {

                return res.status(400).send(
                    "Image is too large. Maximum size is 5MB per image."
                );
            }


            // =================================================
            // TOO MANY FILES
            // =================================================

            if (
                error.code ===
                "LIMIT_UNEXPECTED_FILE"
            ) {

                return res.status(400).send(
                    "You can upload a maximum of 5 photos."
                );
            }


            // =================================================
            // INVALID IMAGE TYPE
            // =================================================

            if (
                error.message &&
                error.message.includes(
                    "Only JPG, PNG, and WebP"
                )
            ) {

                return res.status(400).send(
                    error.message
                );
            }


            // =================================================
            // GENERAL ERROR
            // =================================================

            res.status(500).send(
                "Failed to add review."
            );
        }
    }
);


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;