const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

const User = require("./models/User");

dotenv.config();

async function createAdmin() {
    try {

        // Check MONGODB_URI
        if (!process.env.MONGODB_URI) {
            console.error("MONGODB_URI is missing from .env");
            process.exit(1);
        }

        // Safe diagnostic
        console.log(
            "MongoDB URI starts with:",
            process.env.MONGODB_URI.substring(0, 15)
        );

        // Connect
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("================================");
        console.log("MongoDB connected successfully!");
        console.log("================================");

        const name = "Admin";
        const email = "admin@gmail.com";
        const password = "admin123";

        // Check existing user
        const existingUser = await User.findOne({
            email: email
        });

        if (existingUser) {

            existingUser.role = "admin";

            await existingUser.save();

            console.log("================================");
            console.log("EXISTING USER UPDATED");
            console.log("================================");
            console.log("Email:", email);
            console.log("Role:", existingUser.role);

        } else {

            const hashedPassword = await bcrypt.hash(
                password,
                10
            );

            const admin = new User({
                name: name,
                email: email,
                password: hashedPassword,
                role: "admin"
            });

            await admin.save();

            console.log("================================");
            console.log("ADMIN CREATED SUCCESSFULLY");
            console.log("================================");
            console.log("Email:", email);
            console.log("Password:", password);
            console.log("Role:", admin.role);
        }

        await mongoose.connection.close();

        console.log("MongoDB connection closed.");

    } catch (error) {

        console.error("================================");
        console.error("CREATE ADMIN ERROR");
        console.error(error);
        console.error("================================");

        try {
            await mongoose.connection.close();
        } catch (e) {}

        process.exit(1);
    }
}

createAdmin();