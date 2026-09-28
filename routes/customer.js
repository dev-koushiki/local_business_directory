const express = require("express");
const Business = require("../models/Business");

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

function escapeRegex(value) {
    return String(value || "").replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
}

/* =====================================================
   REDIRECT OWNER / ADMIN AWAY FROM CUSTOMER AREA
===================================================== */

function redirectWrongRole(req, res) {
    const role = getRole(req);

    if (role === "owner") {
        res.redirect("/owner");
        return true;
    }

    if (role === "admin") {
        res.redirect("/admin");
        return true;
    }

    return false;
}

/* =====================================================
   BUSINESS FILTER

   Supports:

   /customer
   /customer?category=cafe
   /customer?category=restaurant
   /customer?category=salon
   /customer?q=food
===================================================== */

function buildBusinessFilter(category, search) {
    const filter = {};

    /* CATEGORY FILTER */
    if (category && category !== "all") {
        const safeCategory = escapeRegex(category);

        filter.category = {
            $regex: `^${safeCategory}$`,
            $options: "i"
        };
    }

    /* SEARCH FILTER */
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
   GET BUSINESS CATEGORIES
===================================================== */

async function getCategories() {
    const categories = await Business.distinct("category");

    return categories
        .filter(Boolean)
        .map(value => String(value).trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
}

/* =====================================================
   CUSTOMER MAIN PAGE

   /customer
   /customer?mode=discover
   /customer?mode=nearby
   /customer?mode=reviews

   CATEGORY:

   /customer?category=cafe
   /customer?category=restaurant
   /customer?category=salon
===================================================== */

router.get("/customer", async (req, res, next) => {
    try {
        /* ---------------------------------------------
           OWNER / ADMIN
        --------------------------------------------- */

        if (redirectWrongRole(req, res)) {
            return;
        }

        /* ---------------------------------------------
           QUERY PARAMETERS
        --------------------------------------------- */

        const mode =
            clean(req.query.mode).toLowerCase() || "discover";

        const category =
            clean(req.query.category).toLowerCase();

        const search =
            clean(req.query.q);

        /* ---------------------------------------------
           CATEGORIES
        --------------------------------------------- */

        const categories = await getCategories();

        /* =================================================
           MODE 1: NEARBY PAGE
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

                    selectedCategory: category,

                    search,

                    pageMode: "nearby",

                    pageTitle: "Discover Near You",

                    pageDescription:
                        "Find local businesses around your current location.",

                    nearbySearch: false,

                    radius: 10,

                    isCustomer,

                    loginRequired: !isCustomer
                },
                function (error, html) {
                    if (error) {
                        console.error(
                            "CUSTOMER DASHBOARD EJS ERROR:",
                            error
                        );

                        if (res.headersSent) {
                            return;
                        }

                        return next(error);
                    }

                    if (res.headersSent) {
                        return;
                    }

                    return res.send(html);
                }
            );
        }

        /* =================================================
           MODE 2: REVIEWS
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

                    pageMode: "reviews",

                    pageTitle:
                        "Real Customer Reviews",

                    pageDescription:
                        "See ratings and real customer feedback for local businesses.",

                    nearbySearch: false,

                    radius: 10,

                    isCustomer:
                        getRole(req) === "customer",

                    loginRequired: false
                },
                function (error, html) {
                    if (error) {
                        console.error(
                            "CUSTOMER REVIEWS EJS ERROR:",
                            error
                        );

                        if (res.headersSent) {
                            return;
                        }

                        return next(error);
                    }

                    if (res.headersSent) {
                        return;
                    }

                    return res.send(html);
                }
            );
        }

        /* =================================================
           MODE 3: EXPLORE BUSINESSES

           THIS IS WHERE CATEGORY FILTERING HAPPENS.
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

        console.log(
            "Customer category:",
            category || "ALL"
        );

        console.log(
            "Businesses found:",
            businesses.length
        );

        return res.render(
            "customer/dashboard",
            {
                businesses,

                categories,

                selectedCategory:
                    category,

                search,

                pageMode: "discover",

                pageTitle:
                    "Explore Local Businesses",

                pageDescription:
                    "Search local businesses by name or choose the type of business you want.",

                nearbySearch: false,

                radius: 10,

                isCustomer:
                    getRole(req) === "customer",

                loginRequired: false
            },
            function (error, html) {
                if (error) {
                    console.error(
                        "CUSTOMER DASHBOARD EJS ERROR:",
                        error
                    );

                    if (res.headersSent) {
                        return;
                    }

                    return next(error);
                }

                if (res.headersSent) {
                    return;
                }

                return res.send(html);
            }
        );

    } catch (error) {
        console.error(
            "CUSTOMER PAGE ERROR:",
            error
        );

        /*
         * VERY IMPORTANT:
         * Never try to send another response
         * if Express already sent one.
         */

        if (res.headersSent) {
            return;
        }

        return next(error);
    }
});

/* =====================================================
   NEARBY BUSINESS SEARCH

   /customer/nearby

   Only logged-in customers can use this.
===================================================== */

router.get(
    "/customer/nearby",
    async (req, res, next) => {
        try {
            const role = getRole(req);

            /* ---------------------------------------------
               CUSTOMER ONLY
            --------------------------------------------- */

            if (
                !req.session.userId ||
                role !== "customer"
            ) {
                if (role === "owner") {
                    return res.redirect("/owner");
                }

                if (role === "admin") {
                    return res.redirect("/admin");
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
               CATEGORY / SEARCH
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
                return res
                    .status(400)
                    .send(
                        "Invalid location coordinates."
                    );
            }

            /* ---------------------------------------------
               CATEGORIES
            --------------------------------------------- */

            const categories =
                await getCategories();

            /* ---------------------------------------------
               BUILD FILTER
            --------------------------------------------- */

            const filter =
                buildBusinessFilter(
                    category,
                    search
                );

            /* ---------------------------------------------
               GEO LOCATION
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
               FIND BUSINESSES
            --------------------------------------------- */

            const businesses =
                await Business.find(filter);

            console.log(
                "Nearby businesses found:",
                businesses.length
            );

            /* ---------------------------------------------
               RENDER
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

                    nearbySearch: true,

                    radius:
                        selectedRadius,

                    isCustomer: true,

                    loginRequired: false
                },
                function (error, html) {
                    if (error) {
                        console.error(
                            "NEARBY DASHBOARD EJS ERROR:",
                            error
                        );

                        if (res.headersSent) {
                            return;
                        }

                        return next(error);
                    }

                    if (res.headersSent) {
                        return;
                    }

                    return res.send(html);
                }
            );

        } catch (error) {
            console.error(
                "NEARBY BUSINESS SEARCH ERROR:",
                error
            );

            if (res.headersSent) {
                return;
            }

            return next(error);
        }
    }
);

/* =====================================================
   EXPORT
===================================================== */

module.exports = router;