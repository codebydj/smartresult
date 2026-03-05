const express = require("express");
const router = express.Router();

const resultController = require("../controllers/resultController");
const validatePin = require("../middleware/validatePin");

// ============================================
// RESULT ROUTES
// ============================================

// Get/Scrape result and store in DB (validate PIN)
router.get("/result", validatePin, resultController.getResult);
router.post("/result", validatePin, resultController.getResult);

// Test endpoint with sample data
router.get("/test/result", resultController.getTestResult);

// ✅ STATIC routes MUST come before /:pin dynamic routes
router.get("/result/stats/public", resultController.getPublicStats);

// ✅ Live stats (online users + total searches)
router.get("/result/stats/live", async (req, res) => {
  try {
    const Result = require("../models/Result");
    const count = await Result.countDocuments();
    // onlineUsers is tracked in server.js via socket.io
    // We pass it via app locals
    const onlineUsers = req.app.get("onlineUsers") || 0;
    res.json({ onlineUsers, totalSearches: count });
  } catch {
    res.json({ onlineUsers: 0, totalSearches: 0 });
  }
});

// ✅ Dynamic :pin routes AFTER static routes
router.get("/result/:pin/download-pdf", resultController.downloadResultPDF);
router.get("/result/:pin", resultController.getResultByPin);

module.exports = router;
