require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const { connectDB } = require("./config/database");
const errorHandler = require("./middleware/errorHandler");
const apiRoutes = require("./routes/v1");
const { getResult } = require("./services/scraperService");

const app = express();

// ============================================
// MIDDLEWARE
// ============================================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdnjs.cloudflare.com",
          "https://cdn.jsdelivr.net",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdnjs.cloudflare.com",
          "https://cdn.jsdelivr.net",
        ],
        connectSrc: [
          "'self'",
          "https://cdnjs.cloudflare.com",
          "https://www.student.apamaravathi.in",
          "https://smartresult-y496.onrender.com",
        ],
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// ============================================
// DATABASE CONNECTION
// ============================================
if (process.env.MONGODB_URI) {
  connectDB().then(() => {
    console.log("✓ Database connection established");
  });
} else {
  console.warn("⚠ MONGODB_URI not set; running without database persistence");
}

// ============================================
// API ROUTES
// ============================================
app.use("/api/v1", apiRoutes);

// ============================================
// LEGACY ROUTES (Backward Compatibility)
// ============================================
app.get("/result", async (req, res, next) => {
  const { pin } = req.query;
  if (!pin) return res.status(400).json({ error: "PIN is required" });
  try {
    const data = await getResult(pin);
    res.json(data);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to fetch result" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// ============================================
// ERROR HANDLING
// ============================================
// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use(errorHandler);

// ============================================
// SERVER START
// ============================================
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Start server and keep reference for graceful shutdown
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║      SmartResult Portal Running        ║
╠════════════════════════════════════════╣
║ Server: http://localhost:${PORT}          ║
║ Environment: ${NODE_ENV}               ║
║ API: http://localhost:${PORT}/api/v1      ║
╚════════════════════════════════════════╝
  `);
});

// Handle server errors (e.g., port in use)
server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(
      `✗ Port ${PORT} is already in use. Please free the port or set PORT in .env.`,
    );
    process.exit(1);
  }
  console.error("✗ Server error:", err);
  process.exit(1);
});

// Graceful Shutdown
const shutdown = () => {
  console.log("SIGTERM/SIGINT received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
  // Force shutdown after 10s
  setTimeout(() => {
    console.error("Forcing shutdown");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
