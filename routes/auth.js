const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const User = require("../models/User");

const router = express.Router();

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function isAjaxRequest(req) {
    return req.get("X-Requested-With") === "XMLHttpRequest";
}

function sendJsonOrText(req, res, status, payload, text) {
    if (isAjaxRequest(req)) {
        return res.status(status).json(payload);
    }

    return res.status(status).send(text || payload.message);
}

// =====================================================
// EMAIL CONFIGURATION
// =====================================================

// Read Gmail credentials from .env
// The replace(/\s/g, "") automatically removes spaces
// from the Gmail App Password.

const emailUser = process.env.EMAIL_USER?.trim();

const emailPass = process.env.EMAIL_PASS?.replace(/\s/g, "");

// Create ONE Gmail transporter only.

const transporter =
    emailUser && emailPass
        ? nodemailer.createTransport({
              service: "gmail",
              auth: {
                  user: emailUser,
                  pass: emailPass
              }
          })
        : null;

// =====================================================
// REGISTER PAGE
// =====================================================

router.get("/register", (req, res) => {
    res.render("register");
});

// =====================================================
// REGISTER USER
// =====================================================

router.post("/register", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return sendJsonOrText(
                req,
                res,
                400,
                {
                    success: false,
                    message: "Please fill in all required fields."
                }
            );
        }

        const cleanName = String(name).trim();
        const cleanEmail = String(email).trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return sendJsonOrText(
                req,
                res,
                400,
                {
                    success: false,
                    message: "Please enter a valid email address."
                }
            );
        }

        if (String(password).length < 6) {
            return sendJsonOrText(
                req,
                res,
                400,
                {
                    success: false,
                    message: "Password must be at least 6 characters."
                }
            );
        }

        const existingUser = await User.findOne({
            email: cleanEmail
        });

        if (existingUser) {
            return sendJsonOrText(
                req,
                res,
                409,
                {
                    success: false,
                    message: "User with this email already exists."
                }
            );
        }

        // Only customer and owner can register normally.
        // Admin accounts should be created separately.

        const allowedRoles = ["customer", "owner"];

        const selectedRole = allowedRoles.includes(role)
            ? role
            : "customer";

        const hashedPassword = await bcrypt.hash(
            String(password),
            10
        );

        const user = new User({
            name: cleanName,
            email: cleanEmail,
            password: hashedPassword,
            role: selectedRole
        });

        await user.save();

        console.log("================================");
        console.log("USER REGISTERED SUCCESSFULLY");
        console.log("Name:", user.name);
        console.log("Email:", user.email);
        console.log("Role:", user.role);
        console.log("================================");

        if (isAjaxRequest(req)) {
            return res.status(201).json({
                success: true,
                message: "Account created successfully!"
            });
        }

        return res.redirect("/login");

    } catch (error) {
        console.error("Registration error:", error);

        return sendJsonOrText(
            req,
            res,
            500,
            {
                success: false,
                message: "Registration failed. Please try again."
            }
        );
    }
});

// =====================================================
// LOGIN PAGE
// =====================================================

router.get("/login", (req, res) => {
    res.render("login");
});

// =====================================================
// LOGIN USER
// =====================================================

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendJsonOrText(
                req,
                res,
                400,
                {
                    success: false,
                    message: "Please enter email and password."
                }
            );
        }

        const cleanEmail = String(email)
            .trim()
            .toLowerCase();

        const user = await User.findOne({
            email: cleanEmail
        });

        if (!user) {
            return sendJsonOrText(
                req,
                res,
                401,
                {
                    success: false,
                    message: "Invalid email or password."
                }
            );
        }

        const passwordMatch = await bcrypt.compare(
            String(password),
            user.password
        );

        if (!passwordMatch) {
            return sendJsonOrText(
                req,
                res,
                401,
                {
                    success: false,
                    message: "Invalid email or password."
                }
            );
        }

        // Save login session

        req.session.userId = user._id;
        req.session.role = user.role;
        req.session.userName = user.name;
        req.session.userEmail = user.email;

        let redirectUrl = "/customer";

        if (user.role === "admin") {
            redirectUrl = "/admin";
        } else if (user.role === "owner") {
            redirectUrl = "/owner";
        }

        console.log("================================");
        console.log("LOGIN SUCCESSFUL");
        console.log("Name:", user.name);
        console.log("Email:", user.email);
        console.log("Role:", user.role);
        console.log("================================");

        if (isAjaxRequest(req)) {
            return res.status(200).json({
                success: true,
                message: "Login successful!",
                redirect: redirectUrl
            });
        }

        return res.redirect(redirectUrl);

    } catch (error) {
        console.error("Login error:", error);

        return sendJsonOrText(
            req,
            res,
            500,
            {
                success: false,
                message: "Login failed. Please try again."
            }
        );
    }
});

// =====================================================
// FORGOT PASSWORD
// STEP 1: SEND 6-DIGIT OTP
// =====================================================

router.post("/forgot-password/request", async (req, res) => {
    try {
        // Get customer/owner/admin email
        const email = String(req.body.email || "")
            .trim()
            .toLowerCase();

        // -------------------------------------------------
        // Validate email
        // -------------------------------------------------

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Please enter your email address."
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        // -------------------------------------------------
        // Check email configuration
        // -------------------------------------------------

        if (!transporter) {
            console.error(
                "EMAIL_USER or EMAIL_PASS is missing in .env"
            );

            return res.status(500).json({
                success: false,
                message:
                    "Email service is not configured. Add EMAIL_USER and EMAIL_PASS to .env."
            });
        }

        // -------------------------------------------------
        // Find user
        // -------------------------------------------------

        const user = await User.findOne({
            email: email
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message:
                    "No account was found with this email address."
            });
        }

        // -------------------------------------------------
        // Generate random 6-digit OTP
        // -------------------------------------------------

        const otp = crypto
            .randomInt(100000, 1000000)
            .toString();

        // -------------------------------------------------
        // Hash OTP before storing it
        // -------------------------------------------------

        const otpHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        // -------------------------------------------------
        // OTP expires after 10 minutes
        // -------------------------------------------------

        user.resetOtpHash = otpHash;

        user.resetOtpExpiresAt = new Date(
            Date.now() + 10 * 60 * 1000
        );

        await user.save();

        // -------------------------------------------------
        // Send OTP email
        // -------------------------------------------------

        await transporter.sendMail({
            from: `Local Business <${emailUser}>`,
            to: user.email,

            subject:
                "Local Business - Password Reset Verification Code",

            text:
                `Your Local Business password reset verification code is ${otp}.\n\n` +
                `This code will expire in 10 minutes.\n\n` +
                `If you did not request a password reset, you can ignore this email.`,

            html: `
                <div
                    style="
                        font-family: Arial, sans-serif;
                        max-width: 560px;
                        margin: auto;
                        padding: 30px;
                        border: 1px solid #eeeeee;
                        border-radius: 14px;
                        background: #ffffff;
                    "
                >

                    <h2
                        style="
                            color: #963b3b;
                            margin-top: 0;
                        "
                    >
                        Local Business
                    </h2>

                    <p>
                        We received a request to reset your password.
                    </p>

                    <p>
                        Your 6-digit verification code is:
                    </p>

                    <div
                        style="
                            font-size: 32px;
                            font-weight: 700;
                            letter-spacing: 8px;
                            background: #f8f1f1;
                            padding: 18px;
                            text-align: center;
                            border-radius: 10px;
                            color: #963b3b;
                        "
                    >
                        ${otp}
                    </div>

                    <p style="margin-top: 20px;">
                        This code will expire in
                        <strong>10 minutes</strong>.
                    </p>

                    <p>
                        If you did not request a password reset,
                        you can safely ignore this email.
                    </p>

                </div>
            `
        });

        console.log(
            "Password reset OTP sent to:",
            user.email
        );

        return res.status(200).json({
            success: true,
            message:
                "A 6-digit verification code has been sent to your email."
        });

    } catch (error) {
        console.error(
            "Forgot password error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Could not send the verification code. Please try again."
        });
    }
});

// =====================================================
// FORGOT PASSWORD
// STEP 2: VERIFY OTP
// =====================================================

router.post("/forgot-password/verify", async (req, res) => {
    try {
        const email = String(req.body.email || "")
            .trim()
            .toLowerCase();

        const code = String(req.body.code || "")
            .trim();

        // -------------------------------------------------
        // Validate input
        // -------------------------------------------------

        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter the verification code."
            });
        }

        if (!/^\d{6}$/.test(code)) {
            return res.status(400).json({
                success: false,
                message:
                    "Verification code must be 6 digits."
            });
        }

        // -------------------------------------------------
        // Find user
        // -------------------------------------------------

        const user = await User.findOne({
            email: email
        });

        if (
            !user ||
            !user.resetOtpHash ||
            !user.resetOtpExpiresAt
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid or expired verification code."
            });
        }

        // -------------------------------------------------
        // Check expiry
        // -------------------------------------------------

        if (
            new Date() >
            new Date(user.resetOtpExpiresAt)
        ) {
            user.resetOtpHash = null;
            user.resetOtpExpiresAt = null;

            await user.save();

            return res.status(400).json({
                success: false,
                message:
                    "This verification code has expired. Please request a new code."
            });
        }

        // -------------------------------------------------
        // Hash submitted OTP
        // -------------------------------------------------

        const codeHash = crypto
            .createHash("sha256")
            .update(code)
            .digest("hex");

        // -------------------------------------------------
        // Compare OTP
        // -------------------------------------------------

        if (codeHash !== user.resetOtpHash) {
            return res.status(400).json({
                success: false,
                message:
                    "Incorrect verification code."
            });
        }

        // -------------------------------------------------
        // OTP verified
        // Store user ID in session
        // -------------------------------------------------

        req.session.passwordResetUserId =
            user._id.toString();

        req.session.passwordResetVerified = true;

        return res.status(200).json({
            success: true,
            message:
                "Code verified successfully."
        });

    } catch (error) {
        console.error(
            "OTP verification error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Could not verify the code. Please try again."
        });
    }
});

// =====================================================
// FORGOT PASSWORD
// STEP 3: RESET PASSWORD
// =====================================================

router.post("/forgot-password/reset", async (req, res) => {
    try {
        const {
            password,
            confirmPassword
        } = req.body;

        // -------------------------------------------------
        // Make sure OTP was verified first
        // -------------------------------------------------

        if (
            !req.session.passwordResetVerified ||
            !req.session.passwordResetUserId
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Please verify the code first."
            });
        }

        // -------------------------------------------------
        // Validate passwords
        // -------------------------------------------------

        if (!password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter and confirm your new password."
            });
        }

        if (String(password).length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 6 characters."
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "Passwords do not match."
            });
        }

        // -------------------------------------------------
        // Find user
        // -------------------------------------------------

        const user = await User.findById(
            req.session.passwordResetUserId
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message:
                    "User account was not found."
            });
        }

        // -------------------------------------------------
        // Hash new password
        // -------------------------------------------------

        user.password = await bcrypt.hash(
            String(password),
            10
        );

        // -------------------------------------------------
        // Remove OTP
        // -------------------------------------------------

        user.resetOtpHash = null;
        user.resetOtpExpiresAt = null;

        await user.save();

        // -------------------------------------------------
        // Remove password reset session
        // -------------------------------------------------

        delete req.session.passwordResetUserId;
        delete req.session.passwordResetVerified;

        return res.status(200).json({
            success: true,
            message:
                "Password reset successfully! You can now log in."
        });

    } catch (error) {
        console.error(
            "Password reset error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Could not reset the password. Please try again."
        });
    }
});

// =====================================================
// LOGOUT
// =====================================================

router.get("/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error(
                "Logout error:",
                error
            );

            return res
                .status(500)
                .send("Logout failed.");
        }

        res.clearCookie("connect.sid");

        res.redirect("/login");
    });
});

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;