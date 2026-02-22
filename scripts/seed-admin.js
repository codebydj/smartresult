#!/usr/bin/env node

/**
 * Seed Script: Create default admin account
 * Usage: node scripts/seed-admin.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../models/Admin");

const ADMIN_USERNAME = "admin410";
const ADMIN_EMAIL = "admin@smartresult.local";
const ADMIN_PASSWORD = "sr@admin410";

async function seedAdmin() {
  try {
    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI is not set in .env file");
      process.exit(1);
    }

    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✓ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ username: ADMIN_USERNAME }, { email: ADMIN_EMAIL }],
    });

    if (existingAdmin) {
      console.log("ℹ Admin account already exists:");
      console.log(`  Username: ${existingAdmin.username}`);
      console.log(`  Email: ${existingAdmin.email}`);
      console.log(`  Role: ${existingAdmin.role}`);
      console.log(`  Created: ${existingAdmin.createdAt}`);
      await mongoose.disconnect();
      process.exit(0);
    }

    // Create new admin
    console.log("🚀 Creating default admin account...");
    const admin = await Admin.create({
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: "admin",
    });

    console.log("✓ Admin account created successfully!");
    console.log("\n📋 Admin Details:");
    console.log(`  ID: ${admin._id}`);
    console.log(`  Username: ${admin.username}`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Role: ${admin.role}`);
    console.log(`  Created: ${admin.createdAt}`);
    console.log("\n🔐 Login with these credentials at /admin-login.html");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during seeding:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedAdmin();
