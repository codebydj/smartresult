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
      lowercase: true,
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
resultSchema.index({ pin: 1 });
resultSchema.index({ studentName: "text", name: "text" });
resultSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Result", resultSchema);
