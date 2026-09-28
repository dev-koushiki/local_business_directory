const express = require("express");
const multer = require("multer");
const path = require("path");

const Review = require("../models/Review");
const Business = require("../models/Business");
const { requireCustomer } = require("../middleware/auth");

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
// ADD REVIEW
// =====================================================

router.post(
    "/business/:id/review",
    requireCustomer,
    upload.array("reviewImages", 5),
    async (req, res) => {

        try {

            if (!req.session.userId) {

                return res.redirect("/login");

            }


            const {
                rating,
                comment
            } = req.body;


            // =================================================
            // VALIDATION
            // =================================================

            if (!rating || !comment) {

                return res.status(400).send(
                    "Please provide a rating and comment."
                );

            }


            if (
                Number(rating) < 1 ||
                Number(rating) > 5
            ) {

                return res.status(400).send(
                    "Rating must be between 1 and 5."
                );

            }


            // =================================================
            // CHECK BUSINESS
            // =================================================

            const business =
                await Business.findById(req.params.id);


            if (!business) {

                return res.status(404).send(
                    "Business not found."
                );

            }


            // =================================================
            // REVIEW IMAGES
            // =================================================

            const reviewImages = [];

            if (req.files && req.files.length > 0) {

                req.files.forEach(file => {

                    reviewImages.push(
                        "/uploads/" + file.filename
                    );

                });

            }


            // =================================================
            // CREATE REVIEW
            // =================================================

            const review = new Review({

                business: req.params.id,

                user: req.session.userId,

                rating: Number(rating),

                comment: comment,

                images: reviewImages

            });


            await review.save();


            // =================================================
            // UPDATE BUSINESS RATING
            // =================================================

            const reviews =
                await Review.find({
                    business: req.params.id
                });


            const totalRating =
                reviews.reduce(
                    (sum, review) =>
                        sum + review.rating,
                    0
                );


            business.averageRating =
                reviews.length > 0
                    ? totalRating / reviews.length
                    : 0;


            business.reviewCount =
                reviews.length;


            await business.save();


            // =================================================
            // SUCCESS
            // =================================================

            console.log(
                "================================"
            );

            console.log(
                "REVIEW CREATED SUCCESSFULLY"
            );

            console.log(
                "Business:",
                business.name
            );

            console.log(
                "Customer:",
                req.session.userId
            );

            console.log(
                "Rating:",
                review.rating
            );

            console.log(
                "Photos:",
                review.images
            );

            console.log(
                "================================"
            );


            res.redirect(
                "/business/" + req.params.id
            );


        } catch (error) {

            console.error(
                "Add review error:",
                error
            );


            if (
                error.code === "LIMIT_FILE_SIZE"
            ) {

                return res.status(400).send(
                    "Image is too large. Maximum size is 5MB per image."
                );

            }


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


            res.status(500).send(
                "Failed to add review."
            );

        }

    }
);


// =====================================================
// DELETE REVIEW
// =====================================================

router.post(
    "/review/delete/:id",
    requireCustomer,
    async (req, res) => {

        try {

            const review =
                await Review.findOneAndDelete({

                    _id: req.params.id,

                    user: req.session.userId

                });


            if (!review) {

                return res.status(404).send(
                    "Review not found or you do not have permission to delete it."
                );

            }


            // =================================================
            // RECALCULATE BUSINESS RATING
            // =================================================

            const business =
                await Business.findById(
                    review.business
                );


            if (business) {

                const reviews =
                    await Review.find({
                        business: business._id
                    });


                const totalRating =
                    reviews.reduce(
                        (sum, item) =>
                            sum + item.rating,
                        0
                    );


                business.averageRating =
                    reviews.length > 0
                        ? totalRating / reviews.length
                        : 0;


                business.reviewCount =
                    reviews.length;


                await business.save();

            }


            console.log(
                "Review deleted successfully:",
                review._id
            );


            res.redirect(
                "/business/" + review.business
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


module.exports = router;