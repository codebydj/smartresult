const { getResult } = require("../services/scraperService");
const Result = require("../models/Result");
const { generateResultPDF } = require("../utils/pdfGenerator");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// Get result and store in database
exports.getResult = async (req, res, next) => {
  const pin = req.body?.pin || req.query?.pin;

  if (!pin) {
    return res.status(400).json({ error: "PIN is required" });
  }

  console.log("🔍 Fetching result for PIN:", pin);
  try {
    let scrapedData;

    // Use mock data if MOCK_MODE is enabled
    if (process.env.MOCK_MODE === "true") {
      console.log("📋 Using MOCK MODE - returning test data");
      scrapedData = {
        studentName: "Mock Student - " + pin.substring(0, 5).toUpperCase(),
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
      };
    } else {
      // Fetch from actual scraper
      scrapedData = await getResult(pin);
    }

    console.log(
      "✓ Scraper returned data:",
      JSON.stringify(scrapedData).substring(0, 200),
    );

    // Check if student name exists. If not, the PIN is likely invalid.
    if (
      !scrapedData ||
      !scrapedData.studentName ||
      scrapedData.studentName.trim() === ""
    ) {
      return res
        .status(400)
        .json({ error: "Invalid PIN. Student details not found." });
    }

    if (
      !scrapedData ||
      !scrapedData.semesters ||
      scrapedData.semesters.length === 0
    ) {
      console.warn("⚠️  No semesters found in scraped data:", scrapedData);
      return res.status(400).json({
        error:
          "No result data found for the provided PIN. Please check the PIN and try again. (Scraped data: " +
          JSON.stringify(scrapedData).substring(0, 100) +
          ")",
      });
    }

    // Prepare data for storage
    const resultData = {
      pin: pin.toLowerCase(),
      name:
        scrapedData.name ||
        scrapedData.studentName ||
        scrapedData.Name ||
        scrapedData.StudentName ||
        scrapedData["Student Name"] ||
        "N/A",
      studentName:
        scrapedData.studentName ||
        scrapedData.name ||
        scrapedData.StudentName ||
        scrapedData.Name ||
        scrapedData["Student Name"] ||
        "N/A",
      rollNumber: scrapedData.rollNumber || null,
      semesters: scrapedData.semesters || [],
      searchedBy: req.admin?.username || "anonymous",
      ipAddress: req.ip || req.connection.remoteAddress,
      scrapedAt: new Date(),
    };

    // Calculate aggregates if available
    if (scrapedData.semesters && scrapedData.semesters.length > 0) {
      const lastSem = scrapedData.semesters[scrapedData.semesters.length - 1];
      resultData.overallCGPA = lastSem.cgpa || null;
      resultData.overallSGPA = scrapedData.sgpa || lastSem.sgpa || null;
      resultData.totalSemesters = scrapedData.semesters.length;
    }

    // Try to save to database (optional - run without DB if not available)
    let storedResult = resultData;
    try {
      // Check if result already exists
      const existingResult = await Result.findOne({ pin: pin.toLowerCase() });

      if (existingResult) {
        // Update existing result
        storedResult = Object.assign(existingResult, resultData);
        await storedResult.save();
      } else {
        // Create new result
        storedResult = await Result.create(resultData);
      }
    } catch (dbErr) {
      console.warn(
        "⚠️  Database save failed, returning scraped data anyway:",
        dbErr.message,
      );
      // Return scraped data even if DB is not available
      storedResult = resultData;
    }

    res.json({
      message: "Result fetched successfully",
      data: storedResult,
    });
  } catch (err) {
    console.error("❌ Error fetching result:", err.message);
    console.error("Stack trace:", err.stack);

    // Return a helpful error message
    const errorMessage = err.message.includes("timeout")
      ? "Request timed out. The website might be down or slow."
      : err.message.includes("Cannot reach")
        ? "Cannot reach the result website. Check your internet connection."
        : err.message ||
          "Failed to fetch result. The website might be down or the PIN may be invalid.";

    res.status(500).json({
      error: errorMessage,
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Get result by PIN
exports.getResultByPin = async (req, res, next) => {
  try {
    const { pin } = req.params;

    if (!pin) {
      return res.status(400).json({ error: "PIN is required" });
    }

    const result = await Result.findOne({ pin: pin.toLowerCase() });

    if (!result) {
      return res.status(404).json({ error: "Result not found" });
    }

    res.json({
      data: result,
    });
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
    const pin = (req.params.pin || "").trim().toLowerCase();
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

// Admin stubs to prevent routing errors
exports.getAllResults = async (req, res, next) => {
  res.status(404).json({ error: "Admin portal disabled" });
};

exports.getResultStats = async (req, res, next) => {
  res.status(404).json({ error: "Admin portal disabled" });
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
