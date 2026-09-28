const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },

    description: {
        type: String,
        trim: true,
        default: ""
    },

    price: {
        type: String,
        trim: true,
        default: ""
    }

}, { _id: false });


const offerSchema = new mongoose.Schema({

    title: {
        type: String,
        trim: true,
        required: true
    },

    description: {
        type: String,
        trim: true,
        default: ""
    },

    validUntil: {
        type: String,
        trim: true,
        default: ""
    }

}, { _id: false });


const hoursSchema = new mongoose.Schema({

    open: {
        type: String,
        default: ""
    },

    close: {
        type: String,
        default: ""
    },

    closed: {
        type: Boolean,
        default: false
    }

}, { _id: false });


const businessSchema = new mongoose.Schema(

    {

        // =====================================================
        // BASIC INFORMATION
        // =====================================================

        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            required: true,
            trim: true
        },


        // =====================================================
        // ADDRESS
        // =====================================================

        address: {
            type: String,
            required: true,
            trim: true
        },

        city: {
            type: String,
            required: true,
            trim: true
        },

        pincode: {
            type: String,
            trim: true,
            default: ""
        },


        // =====================================================
        // CONTACT
        // =====================================================

        phone: {
            type: String,
            trim: true,
            default: ""
        },

        email: {
            type: String,
            trim: true,
            default: ""
        },

        website: {
            type: String,
            trim: true,
            default: ""
        },


        // =====================================================
        // BUSINESS INFORMATION
        // =====================================================

        priceRange: {
            type: String,
            trim: true,
            default: ""
        },

        establishedYear: {
            type: String,
            trim: true,
            default: ""
        },

        specialties: {
            type: [String],
            default: []
        },

        suitableFor: {
            type: [String],
            default: []
        },

        services: {
            type: [String],
            default: []
        },


        // =====================================================
        // AMENITIES
        // =====================================================

        amenities: {
            type: [String],
            default: []
        },


        // =====================================================
        // PAYMENT METHODS
        // =====================================================

        paymentMethods: {
            type: [String],
            default: []
        },


        // =====================================================
        // PRODUCTS / SERVICES / MENU
        // =====================================================

        items: {
            type: [itemSchema],
            default: []
        },


        // =====================================================
        // OFFERS
        // =====================================================

        offers: {
            type: [offerSchema],
            default: []
        },


        // =====================================================
        // OPENING HOURS
        // =====================================================

        hours: {

            monday: {
                type: hoursSchema,
                default: () => ({})
            },

            tuesday: {
                type: hoursSchema,
                default: () => ({})
            },

            wednesday: {
                type: hoursSchema,
                default: () => ({})
            },

            thursday: {
                type: hoursSchema,
                default: () => ({})
            },

            friday: {
                type: hoursSchema,
                default: () => ({})
            },

            saturday: {
                type: hoursSchema,
                default: () => ({})
            },

            sunday: {
                type: hoursSchema,
                default: () => ({})
            }

        },


        // =====================================================
        // SOCIAL MEDIA
        // =====================================================

        socialLinks: {

            instagram: {
                type: String,
                trim: true,
                default: ""
            },

            facebook: {
                type: String,
                trim: true,
                default: ""
            },

            youtube: {
                type: String,
                trim: true,
                default: ""
            }

        },


        // =====================================================
        // BUSINESS PHOTOS
        // =====================================================

        image: {
            type: String,
            default: ""
        },

        images: {
            type: [String],
            default: []
        },


        // =====================================================
        // BUSINESS LOCATION
        // =====================================================

        location: {

            type: {
                type: String,
                enum: ["Point"],
                default: "Point"
            },

            coordinates: {
                type: [Number],
                default: undefined
            }

        },


        // =====================================================
        // OWNER
        // =====================================================

        owner: {

            type: mongoose.Schema.Types.ObjectId,

            ref: "User",

            required: true

        },


        // =====================================================
        // RATINGS
        // =====================================================

        averageRating: {
            type: Number,
            default: 0
        },

        reviewCount: {
            type: Number,
            default: 0
        }

    },

    {
        timestamps: true
    }

);


// =====================================================
// GEO LOCATION INDEX
// =====================================================

businessSchema.index({
    location: "2dsphere"
});


// =====================================================
// EXPORT
// =====================================================

module.exports = mongoose.model(
    "Business",
    businessSchema
);