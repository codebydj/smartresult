const express = require("express");
const router = express.Router();
const Result = require("../models/Result");
const { parseHtml } = require("../services/parserService");
const { getResult } = require("../services/scraperService");

// POST /api/parse -- accepts raw HTML and returns parsed JSON; optional save
router.post("/parse", async (req, res) => {
  try {
    const { html, save, meta } = req.body || {};
    if (!html)
      return res.status(400).json({ error: "html is required in body" });
    const parsed = parseHtml(html);
    if (save) {
      const doc = new Result({
        studentName: parsed.studentName,
        rollNumber: parsed.rollNumber,
        registrationNumber: meta && meta.registrationNumber,
        semesters: parsed.semesters,
      });
      await doc.save();
      return res.json({ saved: true, id: doc._id, parsed });
    }
    return res.json({ parsed });
  } catch (err) {
    console.error("parse error", err);
    res.status(500).json({ error: "parse failed" });
  }
});

// POST /api/fetch -- fetch remotely using existing scraper and store
router.post("/fetch", async (req, res) => {
  try {
    const { pin, semester, save } = req.body || {};
    if (!pin) return res.status(400).json({ error: "pin required" });
    const data = await getResult(pin, semester);
    if (save) {
      const doc = new Result({
        studentName: data.studentName || data.name,
        rollNumber: data.rollNumber,
        registrationNumber: pin,
        semesters: data.semesters || [],
      });
      await doc.save();
      return res.json({ saved: true, id: doc._id, data });
    }
    res.json({ data });
  } catch (err) {
    console.error("fetch error", err);
    res.status(500).json({ error: "fetch failed" });
  }
});

module.exports = router;
