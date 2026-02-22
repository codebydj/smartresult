const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const resultController = require("../controllers/resultController");
const dashboardController = require("../controllers/dashboardController");
const authenticateAdmin = require("../middleware/auth");

// ============================================
// AUTH ROUTES (Public)
// ============================================
router.post("/auth/register", authController.registerAdmin);
router.post("/auth/login", authController.loginAdmin);

// ============================================
// RESULT ROUTES
// ============================================
// Get/Scrape result and store in DB
router.get("/result", resultController.getResult);
router.post("/result", resultController.getResult);

// Test endpoint with sample data
router.get("/test/result", resultController.getTestResult);

// Get result by PIN
router.get("/result/:pin", resultController.getResultByPin);

// Get public stats
router.get("/result/stats/public", resultController.getPublicStats);

// Download result as PDF
router.get("/result/:pin/download-pdf", resultController.downloadResultPDF);

module.exports = router;
