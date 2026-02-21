require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const apiRoutes = require("./routes/api");

const { getResult } = require("./services/scraperService");

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
});
app.use(limiter);

// MongoDB connect (optional)
const MONGO = process.env.MONGODB_URI || process.env.MONGO || "";
if (MONGO) {
  mongoose
    .connect(MONGO, { keepAlive: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.warn("MongoDB connection failed:", err.message));
} else {
  console.log("MONGODB_URI not set; running without DB persistence");
}

app.use("/api", apiRoutes);

// keep existing simple endpoint for backward compatibility
app.get("/result", async (req, res) => {
  const { pin, semester } = req.query;
  if (!pin) return res.status(400).json({ error: "PIN is required" });
  try {
    const data = await getResult(pin, semester);
    res.json(data);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to fetch result" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`),
);
