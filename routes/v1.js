const express = require("express");
const router = express.Router();
const resultController = require("../controllers/resultController");
const dashboardController = require("../controllers/dashboardController");

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
