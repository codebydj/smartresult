const { getResult } = require("../services/scraperService");
const Result = require("../models/Result");
const { generateResultPDF } = require("../utils/pdfGenerator");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

/**
 * Controller: getResult
 * - Validates and uses sanitized PIN from middleware
 * - Returns cached DB result if younger than 10 minutes
 * - Otherwise scrapes fresh result, upserts into MongoDB and returns it
 * @route POST/GET /api/v1/result
 */
exports.getResult = async (req, res, next) => {
  // Prefer sanitized pin from middleware
  const pin = req.cleanPin || req.body?.pin || req.query?.pin;

  if (!pin) {
    return res.status(400).json({ success: false, message: "PIN is required" });
  }

  console.log("🔍 Fetching result for PIN:", pin);
  try {
    // 1) Check cache (MongoDB) - if available and fresh (<10 minutes), return it
    const freshMs = 10 * 60 * 1000; // 10 minutes
    if (mongoose.connection.readyState === 1) {
      const existing = await Result.findOne({ pin: pin.toUpperCase() }).lean();
      if (existing && existing.createdAt) {
        const age = Date.now() - new Date(existing.createdAt).getTime();
        if (age <= freshMs) {
          console.log("⏱ Returning cached result for PIN:", pin);
          return res.json({ success: true, cached: true, data: existing });
        }
      }
    }

    // 2) Fetch from scraper / mock
    let scrapedData;
    if (process.env.MOCK_MODE === "true") {
      console.log("📋 Using MOCK MODE - returning test data");
      scrapedData = {
        studentName:
          "Mock Student - " + String(pin).substring(0, 5).toUpperCase(),
        name: "Mock Student",
        rollNumber: "MOCK001",
        semesters: [
          {
            semester: "1",
            sgpa: "8.5",
            cgpa: "8.5",
            subjects: [
              {
                subjectCode: "CS101",
                subjectName: "Programming Fundamentals",
                gradePoint: "9",
                grade: "A",
                status: "Passed",
                credit: "4",
                points: "36",
              },
            ],
          },
        ],
      };
    } else {
      scrapedData = await getResult(pin);
    }

    // Basic validation on scraped output
    if (!scrapedData || !scrapedData.studentName) {
      return res.status(404).json({
        success: false,
        message: "Result not found. Please check your PIN.",
      });
    }

    if (!scrapedData.semesters || scrapedData.semesters.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No semester data found for this PIN.",
      });
    }

    // Prepare DB document
    const resultData = {
      pin: String(pin).toUpperCase(),
      name: scrapedData.name || scrapedData.studentName || "N/A",
      studentName: scrapedData.studentName || scrapedData.name || "N/A",
      rollNumber: scrapedData.rollNumber || null,
      semesters: scrapedData.semesters || [],
      ipAddress: req.ip || req.connection?.remoteAddress,
      scrapedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (scrapedData.semesters && scrapedData.semesters.length > 0) {
      const lastSem = scrapedData.semesters[scrapedData.semesters.length - 1];
      resultData.overallCGPA = lastSem.cgpa || null;
      resultData.overallSGPA = scrapedData.sgpa || lastSem.sgpa || null;
      resultData.totalSemesters = scrapedData.semesters.length;
    }

    // compute failed count
    let failedCount = 0;
    scrapedData.semesters.forEach((sem) => {
      (sem.subjects || []).forEach((sub) => {
        const grade = (sub.grade || "").toString().toUpperCase();
        const status = (sub.status || "").toString().toLowerCase();
        if (grade === "F" || grade === "FAIL" || status.includes("fail"))
          failedCount++;
      });
    });
    resultData.failedCount = failedCount;

    // Save to DB if connected (upsert)
    let storedResult = resultData;
    if (mongoose.connection.readyState === 1) {
      try {
        const updated = await Result.findOneAndUpdate(
          { pin: resultData.pin },
          { $set: resultData },
          { new: true, upsert: true, setDefaultsOnInsert: true },
        ).lean();
        storedResult = updated || resultData;
      } catch (dbErr) {
        console.warn("⚠️ Database save/update failed:", dbErr.message);
        storedResult = resultData; // return scraped data
      }
    }

    return res.json({ success: true, cached: false, data: storedResult });
  } catch (err) {
    console.error("❌ Error fetching result:", err.message);
    return next(err);
  }
};

// Get result by PIN
exports.getResultByPin = async (req, res, next) => {
  try {
    const { pin } = req.params;

    if (!pin) {
      return res
        .status(400)
        .json({ success: false, message: "PIN is required" });
    }

    const result = await Result.findOne({ pin: pin.toUpperCase() });

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Result not found" });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Get public stats (Total results checked)
exports.getPublicStats = async (req, res) => {
  try {
    const count = await Result.countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ count: 0 });
  }
};

// Download result as PDF
exports.downloadResultPDF = async (req, res, next) => {
  try {
    const pin = (req.params.pin || "").trim().toUpperCase();
    let resultData = null;

    // 1. Try to get from DB if connected
    if (mongoose.connection.readyState === 1) {
      const result = await Result.findOne({ pin: pin });
      if (result) {
        resultData = result.toObject();
      }
    }

    // 2. If not in DB or DB down, scrape it on the fly
    if (!resultData) {
      console.log(
        `PDF Download: Result not in DB (or DB down), scraping for PIN: ${pin}`,
      );
      try {
        const scrapedData = await getResult(pin);
        resultData = {
          pin: pin,
          name: scrapedData.name || scrapedData.studentName || "N/A",
          studentName: scrapedData.studentName || scrapedData.name || "N/A",
          rollNumber: scrapedData.rollNumber || null,
          semesters: scrapedData.semesters || [],
          scrapedAt: new Date(),
        };
      } catch (scrapeErr) {
        console.error(
          "Scrape failed during PDF generation:",
          scrapeErr.message,
        );
        return res
          .status(404)
          .json({ error: "Result not found and could not be scraped." });
      }
    }

    if (!resultData) {
      return res.status(404).json({ error: "Result not found" });
    }

    // Generate PDF
    const filePath = await generateResultPDF(resultData);

    // Send file
    res.download(filePath, `Result_${pin}.pdf`, (err) => {
      if (err) {
        console.error("Error sending file:", err);
      }

      // Delete temp file after sending
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) console.error("Error deleting temp file:", unlinkErr);
      });
    });
  } catch (error) {
    next(error);
  }
};

// Test endpoint with sample data (for debugging)
exports.getTestResult = async (req, res) => {
  res.json({
    message: "Test result data",
    data: {
      studentName: "Test Student",
      name: "Test Student",
      rollNumber: "TEST001",
      pin: "test123",
      semesters: [
        {
          semester: "1",
          sgpa: "8.5",
          cgpa: "8.5",
          subjects: [
            {
              subjectCode: "CS101",
              subjectName: "Programming Fundamentals",
              gradePoint: "9",
              grade: "A",
              status: "Passed",
              credit: "4",
              points: "36",
            },
            {
              subjectCode: "CS102",
              subjectName: "Data Structures",
              gradePoint: "8",
              grade: "B",
              status: "Passed",
              credit: "3",
              points: "24",
            },
          ],
        },
      ],
    },
  });
};
