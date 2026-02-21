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

const ResultSchema = new mongoose.Schema({
  studentName: String,
  rollNumber: String,
  registrationNumber: String,
  branch: String,
  academicRegulation: String,
  semesters: [SemesterSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Result", ResultSchema);
