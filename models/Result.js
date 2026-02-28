const mongoose = require("mongoose");

const SubjectSchema = new mongoose.Schema({
  subjectCode: String,
  subjectName: String,
  grade: String,
  gradePoint: String,
  credit: String,
  status: String,
  points: String,
});

const SemesterSchema = new mongoose.Schema({
  semester: String,
  sgpa: String,
  cgpa: String,
  subjects: [SubjectSchema],
});

const resultSchema = new mongoose.Schema(
  {
    pin: {
      type: String,
      required: [true, "PIN is required"],
      trim: true,
      uppercase: true,
      match: [
        /^[0-9A-Z]{10}$/,
        "PIN must be 10 characters: digits and uppercase letters only",
      ],
    },
    studentName: String,
    name: {
      type: String,
      default: "N/A",
    },
    rollNumber: String,
    registrationNumber: String,
    branch: String,
    academicRegulation: String,

    // Structured semester data
    semesters: [SemesterSchema],

    // Aggregated data
    overallCGPA: String,
    overallSGPA: String,
    totalSemesters: {
      type: Number,
      default: 0,
    },

    // Metadata
    searchedBy: {
      type: String,
      default: "anonymous",
    },
    ipAddress: String,
    scrapedAt: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// Indexes
// Indexes
// Pin index for fast lookups
resultSchema.index({ pin: 1 });
resultSchema.index({ studentName: "text", name: "text" });
resultSchema.index({ createdAt: -1 });

// Optional TTL index (uncomment to enable automatic expiry)
// resultSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 }); // 7 days

module.exports = mongoose.model("Result", resultSchema);
