const express = require("express");
const multer = require("multer");
const path = require("path");

const Business = require("../models/Business");
const { requireOwner } = require("../middleware/auth");

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
// MULTER UPLOAD
// =====================================================

const upload = multer({

    storage: storage,

    fileFilter: function (req, file, cb) {

        const allowedTypes = [

            "image/jpeg",
            "image/png",
            "image/webp"

        ];


        if (
            allowedTypes.includes(
                file.mimetype
            )
        ) {

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

        // Maximum size of EACH image = 5MB
        fileSize:
            5 * 1024 * 1024,

        // Maximum uploaded files
        files: 10

    }

});


// =====================================================
// MULTIPLE PHOTO UPLOAD
// =====================================================

const multipleImageUpload =
    upload.fields([

        {
            name: "imageFiles",
            maxCount: 10
        },

        {
            name: "imageFile",
            maxCount: 10
        },

        {
            name: "photos",
            maxCount: 10
        }

    ]);


// =====================================================
// GET ALL UPLOADED IMAGES
// =====================================================

function getUploadedImages(req) {

    const images = [];


    if (!req.files) {

        return images;

    }


    // -------------------------------------------------
    // imageFiles
    // -------------------------------------------------

    if (req.files.imageFiles) {

        req.files.imageFiles.forEach(
            file => {

                images.push(
                    "/uploads/" +
                    file.filename
                );

            }
        );

    }


    // -------------------------------------------------
    // imageFile
    // -------------------------------------------------

    if (req.files.imageFile) {

        req.files.imageFile.forEach(
            file => {

                images.push(
                    "/uploads/" +
                    file.filename
                );

            }
        );

    }


    // -------------------------------------------------
    // photos
    // -------------------------------------------------

    if (req.files.photos) {

        req.files.photos.forEach(
            file => {

                images.push(
                    "/uploads/" +
                    file.filename
                );

            }
        );

    }


    return images;

}


// =====================================================
// SAFE JSON PARSER
// =====================================================

function parseJSON(
    value,
    fallback
) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        return fallback;

    }


    try {

        return JSON.parse(value);

    } catch (error) {

        console.error(
            "JSON parse error:",
            error
        );

        return fallback;

    }

}


// =====================================================
// CONVERT VALUE TO ARRAY
// =====================================================

function toArray(value) {

    if (Array.isArray(value)) {

        return value;

    }


    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        return [];

    }


    return [value];

}


// =====================================================
// OWNER DASHBOARD
// =====================================================

router.get(
    "/owner",
    requireOwner,

    async (req, res) => {

        try {

            if (!req.session.userId) {

                return res.redirect(
                    "/login"
                );

            }


            const businesses =
                await Business.find({

                    owner:
                        req.session.userId

                }).sort({

                    createdAt:
                        -1

                });


            res.render(
                "owner/dashboard",
                {
                    businesses:
                        businesses
                }
            );


        } catch (error) {

            console.error(
                "Owner dashboard error:",
                error
            );


            res.status(500).send(
                "Failed to load owner dashboard."
            );

        }

    }
);


// =====================================================
// ADD BUSINESS PAGE
// =====================================================

router.get(
    "/owner/business/add",
    requireOwner,

    (req, res) => {

        if (!req.session.userId) {

            return res.redirect(
                "/login"
            );

        }


        res.render(
            "owner/add-business"
        );

    }
);


// =====================================================
// ADD BUSINESS
// =====================================================

router.post(
    "/owner/business/add",
    requireOwner,
    multipleImageUpload,

    async (req, res) => {

        try {

            if (!req.session.userId) {

                return res.redirect(
                    "/login"
                );

            }


            // =================================================
            // BASIC INFORMATION
            // =================================================

            const {

                name,
                description,
                category,

                address,
                city,
                pincode,

                phone,
                email,
                website,

                priceRange,
                establishedYear,

                specialties,
                suitableFor,
                services,

                amenities,
                paymentMethods,

                items,
                offers,

                hours,
                socialLinks,

                image,

                latitude,
                longitude

            } = req.body;


            // =================================================
            // REQUIRED FIELDS
            // =================================================

            if (

                !name ||
                !description ||
                !category ||
                !address ||
                !city

            ) {

                return res.status(400).send(
                    "Please fill in all required fields."
                );

            }


            // =================================================
            // UPLOADED IMAGES
            // =================================================

            const uploadedImages =
                getUploadedImages(req);


            // =================================================
            // MAIN IMAGE
            // =================================================

            let imagePath =
                image || "";


            if (
                uploadedImages.length > 0
            ) {

                imagePath =
                    uploadedImages[0];

            }


            // =================================================
            // PARSE NEW BUSINESS INFORMATION
            // =================================================

            const parsedSpecialties =
                parseJSON(
                    specialties,
                    []
                );


            const parsedSuitableFor =
                parseJSON(
                    suitableFor,
                    []
                );


            const parsedServices =
                parseJSON(
                    services,
                    []
                );


            const parsedAmenities =
                parseJSON(
                    amenities,
                    []
                );


            const parsedPaymentMethods =
                parseJSON(
                    paymentMethods,
                    []
                );


            const parsedItems =
                parseJSON(
                    items,
                    []
                );


            const parsedOffers =
                parseJSON(
                    offers,
                    []
                );


            const parsedHours =
                parseJSON(
                    hours,
                    {}
                );


            const parsedSocialLinks =
                parseJSON(
                    socialLinks,
                    {}
                );


            // =================================================
            // CREATE BUSINESS DATA
            // =================================================

            const businessData = {

                // ---------------------------------------------
                // BASIC
                // ---------------------------------------------

                name:
                    name.trim(),

                description:
                    description.trim(),

                category:
                    category.trim(),


                // ---------------------------------------------
                // ADDRESS
                // ---------------------------------------------

                address:
                    address.trim(),

                city:
                    city.trim(),

                pincode:
                    pincode || "",


                // ---------------------------------------------
                // CONTACT
                // ---------------------------------------------

                phone:
                    phone || "",

                email:
                    email || "",

                website:
                    website || "",


                // ---------------------------------------------
                // BUSINESS INFORMATION
                // ---------------------------------------------

                priceRange:
                    priceRange || "",

                establishedYear:
                    establishedYear || "",


                specialties:
                    parsedSpecialties,

                suitableFor:
                    parsedSuitableFor,

                services:
                    parsedServices,


                // ---------------------------------------------
                // AMENITIES
                // ---------------------------------------------

                amenities:
                    parsedAmenities,


                // ---------------------------------------------
                // PAYMENT
                // ---------------------------------------------

                paymentMethods:
                    parsedPaymentMethods,


                // ---------------------------------------------
                // PRODUCTS / SERVICES / MENU
                // ---------------------------------------------

                items:
                    parsedItems,


                // ---------------------------------------------
                // OFFERS
                // ---------------------------------------------

                offers:
                    parsedOffers,


                // ---------------------------------------------
                // OPENING HOURS
                // ---------------------------------------------

                hours:
                    parsedHours,


                // ---------------------------------------------
                // SOCIAL MEDIA
                // ---------------------------------------------

                socialLinks:
                    parsedSocialLinks,


                // ---------------------------------------------
                // IMAGE
                // ---------------------------------------------

                image:
                    imagePath,


                // ---------------------------------------------
                // OWNER
                // ---------------------------------------------

                owner:
                    req.session.userId

            };


            // =================================================
            // SAVE MULTIPLE IMAGES
            // =================================================

            if (
                uploadedImages.length > 0
            ) {

                businessData.images =
                    uploadedImages;

            }


            // =================================================
            // BUSINESS LOCATION
            // =================================================

            if (

                latitude &&
                longitude &&

                !isNaN(
                    Number(latitude)
                ) &&

                !isNaN(
                    Number(longitude)
                )

            ) {

                businessData.location = {

                    type:
                        "Point",

                    coordinates: [

                        Number(longitude),

                        Number(latitude)

                    ]

                };

            }


            // =================================================
            // CREATE BUSINESS
            // =================================================

            const business =
                new Business(
                    businessData
                );


            await business.save();


            // =================================================
            // SUCCESS LOG
            // =================================================

            console.log(
                "================================"
            );

            console.log(
                "BUSINESS CREATED SUCCESSFULLY"
            );

            console.log(
                "Business:",
                business.name
            );

            console.log(
                "Business ID:",
                business._id
            );

            console.log(
                "Owner:",
                req.session.userId
            );

            console.log(
                "Category:",
                business.category
            );

            console.log(
                "Images:",
                business.images
            );

            console.log(
                "Services:",
                business.services
            );

            console.log(
                "Items:",
                business.items
            );

            console.log(
                "Offers:",
                business.offers
            );

            console.log(
                "Location:",
                business.location
            );

            console.log(
                "================================"
            );


            // =================================================
            // REDIRECT
            // =================================================

            res.redirect(
                "/owner"
            );


        } catch (error) {

            console.error(
                "Add business error:",
                error
            );


            // -------------------------------------------------
            // IMAGE TOO LARGE
            // -------------------------------------------------

            if (
                error.code ===
                "LIMIT_FILE_SIZE"
            ) {

                return res.status(400).send(
                    "Image is too large. Maximum size is 5MB."
                );

            }


            // -------------------------------------------------
            // TOO MANY IMAGES
            // -------------------------------------------------

            if (
                error.code ===
                "LIMIT_FILE_COUNT"
            ) {

                return res.status(400).send(
                    "You can upload a maximum of 10 images."
                );

            }


            // -------------------------------------------------
            // INVALID IMAGE
            // -------------------------------------------------

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


            // -------------------------------------------------
            // GENERAL ERROR
            // -------------------------------------------------

            res.status(500).send(
                "Failed to add business."
            );

        }

    }
);


// =====================================================
// EDIT BUSINESS PAGE
// =====================================================

router.get(
    "/owner/business/edit/:id",
    requireOwner,

    async (req, res) => {

        try {

            if (!req.session.userId) {

                return res.redirect(
                    "/login"
                );

            }


            const business =
                await Business.findOne({

                    _id:
                        req.params.id,

                    owner:
                        req.session.userId

                });


            if (!business) {

                return res.status(404).send(
                    "Business not found."
                );

            }


            res.render(
                "owner/edit-business",
                {
                    business:
                        business
                }
            );


        } catch (error) {

            console.error(
                "Edit page error:",
                error
            );


            res.status(500).send(
                "Failed to load edit page."
            );

        }

    }
);


// =====================================================
// UPDATE BUSINESS
// =====================================================

router.post(
    "/owner/business/edit/:id",
    requireOwner,
    multipleImageUpload,

    async (req, res) => {

        try {

            if (!req.session.userId) {

                return res.redirect(
                    "/login"
                );

            }


            // =================================================
            // GET FORM DATA
            // =================================================

            const {

                name,
                description,
                category,

                address,
                city,
                pincode,

                phone,
                email,
                website,

                priceRange,
                establishedYear,

                specialties,
                suitableFor,
                services,

                amenities,
                paymentMethods,

                items,
                offers,

                hours,
                socialLinks,

                image,

                latitude,
                longitude

            } = req.body;


            // =================================================
            // REQUIRED FIELDS
            // =================================================

            if (

                !name ||
                !description ||
                !category ||
                !address ||
                !city

            ) {

                return res.status(400).send(
                    "Please fill in all required fields."
                );

            }


            // =================================================
            // FIND BUSINESS
            // =================================================

            const existingBusiness =
                await Business.findOne({

                    _id:
                        req.params.id,

                    owner:
                        req.session.userId

                });


            if (!existingBusiness) {

                return res.status(404).send(
                    "Business not found or you do not have permission to edit it."
                );

            }


            // =================================================
            // GET UPLOADED IMAGES
            // =================================================

            const uploadedImages =
                getUploadedImages(req);


            // =================================================
            // BASIC INFORMATION
            // =================================================

            existingBusiness.name =
                name.trim();


            existingBusiness.description =
                description.trim();


            existingBusiness.category =
                category.trim();


            // =================================================
            // ADDRESS
            // =================================================

            existingBusiness.address =
                address.trim();


            existingBusiness.city =
                city.trim();


            existingBusiness.pincode =
                pincode || "";


            // =================================================
            // CONTACT
            // =================================================

            existingBusiness.phone =
                phone || "";


            existingBusiness.email =
                email || "";


            existingBusiness.website =
                website || "";


            // =================================================
            // BUSINESS INFORMATION
            // =================================================

            existingBusiness.priceRange =
                priceRange || "";


            existingBusiness.establishedYear =
                establishedYear || "";


            existingBusiness.specialties =
                parseJSON(
                    specialties,
                    []
                );


            existingBusiness.suitableFor =
                parseJSON(
                    suitableFor,
                    []
                );


            existingBusiness.services =
                parseJSON(
                    services,
                    []
                );


            // =================================================
            // AMENITIES
            // =================================================

            existingBusiness.amenities =
                parseJSON(
                    amenities,
                    []
                );


            // =================================================
            // PAYMENT METHODS
            // =================================================

            existingBusiness.paymentMethods =
                parseJSON(
                    paymentMethods,
                    []
                );


            // =================================================
            // PRODUCTS / SERVICES / MENU
            // =================================================

            existingBusiness.items =
                parseJSON(
                    items,
                    []
                );


            // =================================================
            // OFFERS
            // =================================================

            existingBusiness.offers =
                parseJSON(
                    offers,
                    []
                );


            // =================================================
            // OPENING HOURS
            // =================================================

            existingBusiness.hours =
                parseJSON(
                    hours,
                    {}
                );


            // =================================================
            // SOCIAL MEDIA
            // =================================================

            existingBusiness.socialLinks =
                parseJSON(
                    socialLinks,
                    {}
                );


            // =================================================
            // IMAGE HANDLING
            // =================================================

            if (
                uploadedImages.length > 0
            ) {

                // First uploaded image
                // becomes main image.

                existingBusiness.image =
                    uploadedImages[0];


                // Save complete new gallery.

                existingBusiness.images =
                    uploadedImages;

            }

            else if (
                image !== undefined
            ) {

                // Keep existing image
                // if no new upload.

                existingBusiness.image =
                    image;

            }


            // =================================================
            // LOCATION
            // =================================================

            if (

                latitude &&
                longitude &&

                !isNaN(
                    Number(latitude)
                ) &&

                !isNaN(
                    Number(longitude)
                )

            ) {

                existingBusiness.location = {

                    type:
                        "Point",

                    coordinates: [

                        Number(longitude),

                        Number(latitude)

                    ]

                };

            }


            // =================================================
            // SAVE CHANGES
            // =================================================

            await existingBusiness.save();


            // =================================================
            // SUCCESS LOG
            // =================================================

            console.log(
                "================================"
            );

            console.log(
                "BUSINESS UPDATED SUCCESSFULLY"
            );

            console.log(
                "Business:",
                existingBusiness.name
            );

            console.log(
                "Business ID:",
                existingBusiness._id
            );

            console.log(
                "Owner:",
                req.session.userId
            );

            console.log(
                "Category:",
                existingBusiness.category
            );

            console.log(
                "Images:",
                existingBusiness.images
            );

            console.log(
                "Services:",
                existingBusiness.services
            );

            console.log(
                "Items:",
                existingBusiness.items
            );

            console.log(
                "Offers:",
                existingBusiness.offers
            );

            console.log(
                "Location:",
                existingBusiness.location
            );

            console.log(
                "================================"
            );


            // =================================================
            // REDIRECT
            // =================================================

            res.redirect(
                "/owner"
            );


        } catch (error) {

            console.error(
                "Update business error:",
                error
            );


            // -------------------------------------------------
            // IMAGE TOO LARGE
            // -------------------------------------------------

            if (
                error.code ===
                "LIMIT_FILE_SIZE"
            ) {

                return res.status(400).send(
                    "Image is too large. Maximum size is 5MB."
                );

            }


            // -------------------------------------------------
            // TOO MANY IMAGES
            // -------------------------------------------------

            if (
                error.code ===
                "LIMIT_FILE_COUNT"
            ) {

                return res.status(400).send(
                    "You can upload a maximum of 10 images."
                );

            }


            // -------------------------------------------------
            // INVALID IMAGE
            // -------------------------------------------------

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


            // -------------------------------------------------
            // GENERAL ERROR
            // -------------------------------------------------

            res.status(500).send(
                "Failed to update business."
            );

        }

    }
);


// =====================================================
// DELETE BUSINESS
// =====================================================

router.post(
    "/owner/business/delete/:id",
    requireOwner,

    async (req, res) => {

        try {

            if (!req.session.userId) {

                return res.redirect(
                    "/login"
                );

            }


            const business =
                await Business.findOneAndDelete({

                    _id:
                        req.params.id,

                    owner:
                        req.session.userId

                });


            if (!business) {

                return res.status(404).send(
                    "Business not found or you do not have permission to delete it."
                );

            }


            // =================================================
            // SUCCESS LOG
            // =================================================

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
                "Business ID:",
                business._id
            );

            console.log(
                "Owner:",
                req.session.userId
            );

            console.log(
                "================================"
            );


            res.redirect(
                "/owner"
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
// EXPORT ROUTER
// =====================================================

module.exports = router;