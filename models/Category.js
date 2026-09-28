const express = require("express");
const Business = require("../models/Business");
const Category = require("../models/Category");

const router = express.Router();

const ALLOWED_RADII = [1, 5, 10, 25, 50];

/* =====================================================
   HELPERS
===================================================== */

function getRole(req) {
    if (req.session && req.session.role) {
        return String(req.session.role).toLowerCase();
    }

    return null;
}

function clean(value) {
    return String(value || "").trim();
}

function redirectWrongRole(req, res) {
    const role = getRole(req);

    if (role === "owner") {
        return res.redirect("/owner");
    }

    if (role === "admin") {
        return res.redirect("/admin");
    }

    return null;
}

function escapeRegex(value) {
    return String(value || "").replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
}

function buildBusinessFilter(category, search) {
    const filter = {};

    /* ---------------------------------------------
       CATEGORY FILTER
    --------------------------------------------- */

    if (category && category !== "all") {
        const safeCategory = escapeRegex(category);

        filter.category = {
            $regex: `^${safeCategory}$`,
            $options: "i"
        };
    }

    /* ---------------------------------------------
       SEARCH FILTER
    --------------------------------------------- */

    if (search) {
        const safeSearch = escapeRegex(search);

        filter.$or = [
            {
                name: {
                    $regex: safeSearch,
                    $options: "i"
                }
            },
            {
                description: {
                    $regex: safeSearch,
                    $options: "i"
                }
            },
            {
                category: {
                    $regex: safeSearch,
                    $options: "i"
                }
            },
            {
                city: {
                    $regex: safeSearch,
                    $options: "i"
                }
            }
        ];
    }

    return filter;
}

/* =====================================================
   GET ALL CATEGORIES

   Categories are taken from the Category collection.

   This means:
   → Every category added by Admin appears
   → Category does NOT need to have a business yet
   → Categories are sorted alphabetically
===================================================== */

async function getCategories() {

    const categories = await Category.find(
        {},
        {
            name: 1,
            _id: 0
        }
    )
        .sort({
            name: 1
        })
        .lean();

    return categories
        .map(category =>
            String(category.name || "").trim()
        )
        .filter(Boolean);
}

/* =====================================================
   CUSTOMER / VISITOR MAIN PAGE

   MODES:

   /customer?mode=discover
   → Explore Local Businesses

   /customer?mode=nearby
   → Discover Near You

   /customer?mode=reviews
   → Real Customer Reviews
===================================================== */

router.get("/customer", async (req, res) => {

    try {

        /* ---------------------------------------------
           OWNER / ADMIN MUST NOT ENTER CUSTOMER AREA
        --------------------------------------------- */

        const wrongRoleRedirect =
            redirectWrongRole(req, res);

        if (wrongRoleRedirect) {
            return wrongRoleRedirect;
        }

        /* ---------------------------------------------
           GET QUERY PARAMETERS
        --------------------------------------------- */

        const mode =
            clean(req.query.mode).toLowerCase() ||
            "discover";

        const category =
            clean(req.query.category).toLowerCase();

        const search =
            clean(req.query.q);

        /* ---------------------------------------------
           GET ALL CATEGORIES
        --------------------------------------------- */

        const categories =
            await getCategories();

        /* =================================================
           MODE 1: DISCOVER NEAR YOU

           Visitor:
           → Can see the page
           → Cannot use location

           Customer:
           → Can use location
           → Can search nearby businesses
        ================================================= */

        if (mode === "nearby") {

            const isCustomer =
                getRole(req) === "customer" &&
                Boolean(req.session.userId);

            return res.render(
                "customer/dashboard",
                {
                    businesses: [],

                    categories,

                    selectedCategory:
                        category,

                    search,

                    pageMode:
                        "nearby",

                    pageTitle:
                        "Discover Near You",

                    pageDescription:
                        "Find local businesses around your current location.",

                    nearbySearch:
                        false,

                    radius:
                        10,

                    isCustomer,

                    loginRequired:
                        !isCustomer
                }
            );
        }

        /* =================================================
           MODE 2: REAL CUSTOMER REVIEWS

           Only businesses having reviews are shown.

           No location section.
        ================================================= */

        if (
            mode === "reviews" ||
            mode === "top-rated"
        ) {

            const filter =
                buildBusinessFilter(
                    category,
                    search
                );

            const businesses =
                await Business.find({
                    ...filter,

                    reviewCount: {
                        $gt: 0
                    }

                }).sort({
                    averageRating: -1,
                    reviewCount: -1,
                    createdAt: -1
                });

            return res.render(
                "customer/dashboard",
                {
                    businesses,

                    categories,

                    selectedCategory:
                        category,

                    search,

                    pageMode:
                        "reviews",

                    pageTitle:
                        "Real Customer Reviews",

                    pageDescription:
                        "See ratings and real customer feedback for local businesses.",

                    nearbySearch:
                        false,

                    radius:
                        10,

                    isCustomer:
                        getRole(req) === "customer",

                    loginRequired:
                        false
                }
            );
        }

        /* =================================================
           MODE 3: EXPLORE LOCAL BUSINESSES

           This is the normal public search.

           NO location.
           NO Near Me.

           Anyone can:
           → Search business
           → Select category
           → Open business
        ================================================= */

        const filter =
            buildBusinessFilter(
                category,
                search
            );

        const businesses =
            await Business.find(filter)
                .sort({
                    createdAt: -1
                });

        return res.render(
            "customer/dashboard",
            {
                businesses,

                categories,

                selectedCategory:
                    category,

                search,

                pageMode:
                    "discover",

                pageTitle:
                    "Explore Local Businesses",

                pageDescription:
                    "Search local businesses by name or choose the type of business you want.",

                nearbySearch:
                    false,

                radius:
                    10,

                isCustomer:
                    getRole(req) === "customer",

                loginRequired:
                    false
            }
        );

    } catch (error) {

        console.error(
            "CUSTOMER PAGE ERROR:",
            error
        );

        return res.status(500).send(
            "Failed to load the customer discovery page."
        );
    }
});


/* =====================================================
   NEARBY BUSINESS SEARCH

   IMPORTANT:

   Only logged-in CUSTOMERS can use this route.

   Visitor:
   → /login?feature=nearby

   Owner:
   → /owner

   Admin:
   → /admin
===================================================== */

router.get(
    "/customer/nearby",
    async (req, res) => {

        try {

            const role =
                getRole(req);

            /* ---------------------------------------------
               CUSTOMER ONLY
            --------------------------------------------- */

            if (
                !req.session.userId ||
                role !== "customer"
            ) {

                if (role === "owner") {
                    return res.redirect(
                        "/owner"
                    );
                }

                if (role === "admin") {
                    return res.redirect(
                        "/admin"
                    );
                }

                return res.redirect(
                    "/login?feature=nearby"
                );
            }

            /* ---------------------------------------------
               LOCATION
            --------------------------------------------- */

            const latitude =
                Number(req.query.latitude);

            const longitude =
                Number(req.query.longitude);

            /* ---------------------------------------------
               RADIUS
            --------------------------------------------- */

            const requestedRadius =
                Number(req.query.radius) || 10;

            const selectedRadius =
                ALLOWED_RADII.includes(
                    requestedRadius
                )
                    ? requestedRadius
                    : 10;

            /* ---------------------------------------------
               SEARCH / CATEGORY
            --------------------------------------------- */

            const category =
                clean(req.query.category)
                    .toLowerCase();

            const search =
                clean(req.query.q);

            /* ---------------------------------------------
               VALIDATE LOCATION
            --------------------------------------------- */

            if (
                !Number.isFinite(latitude) ||
                !Number.isFinite(longitude)
            ) {

                return res.status(400).send(
                    "Invalid location coordinates."
                );
            }

            /* ---------------------------------------------
               GET ALL CATEGORIES
            --------------------------------------------- */

            const categories =
                await getCategories();

            /* ---------------------------------------------
               BUILD SEARCH FILTER
            --------------------------------------------- */

            const filter =
                buildBusinessFilter(
                    category,
                    search
                );

            /* ---------------------------------------------
               GEOLOCATION SEARCH

               Business location must be stored as:

               {
                   type: "Point",
                   coordinates: [
                       longitude,
                       latitude
                   ]
               }
            --------------------------------------------- */

            filter.location = {

                $near: {

                    $geometry: {

                        type: "Point",

                        coordinates: [
                            longitude,
                            latitude
                        ]
                    },

                    $maxDistance:
                        selectedRadius * 1000
                }
            };

            /* ---------------------------------------------
               FIND NEARBY BUSINESSES
            --------------------------------------------- */

            const businesses =
                await Business.find(
                    filter
                );

            /* ---------------------------------------------
               RENDER RESULTS
            --------------------------------------------- */

            return res.render(
                "customer/dashboard",
                {

                    businesses,

                    categories,

                    selectedCategory:
                        category,

                    search,

                    pageMode:
                        "nearby",

                    pageTitle:
                        "Businesses Near You",

                    pageDescription:
                        "Businesses found around your current location.",

                    nearbySearch:
                        true,

                    radius:
                        selectedRadius,

                    isCustomer:
                        true,

                    loginRequired:
                        false
                }
            );

        } catch (error) {

            console.error(
                "NEARBY BUSINESS SEARCH ERROR:",
                error
            );

            return res.status(500).send(
                "Failed to find nearby businesses."
            );
        }
    }
);


/* =====================================================
   EXPORT ROUTER
===================================================== */

module.exports = router;