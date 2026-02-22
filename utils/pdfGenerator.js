const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const generateResultPDF = (resultData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
      });

      const fileName = `Result_${resultData.pin}_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, "../temp", fileName);

      // Ensure temp directory exists
      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(24).font("Helvetica-Bold").text("Student Result Report", {
        align: "center",
      });
      doc.moveDown();

      // Student Information
      doc.fontSize(12).font("Helvetica-Bold").text("Student Information");
      doc.fontSize(10).font("Helvetica");
      doc.text(`Name: ${resultData.name || resultData.studentName || "N/A"}`);
      doc.text(`PIN: ${resultData.pin}`);
      if (resultData.rollNumber) {
        doc.text(`Roll Number: ${resultData.rollNumber}`);
      }
      doc.moveDown();

      // Semesters
      if (resultData.semesters && resultData.semesters.length > 0) {
        doc.fontSize(12).font("Helvetica-Bold").text("Academic Performance");
        doc.moveDown(0.5);

        resultData.semesters.forEach((semester, index) => {
          doc
            .fontSize(11)
            .font("Helvetica-Bold")
            .text(`Semester ${semester.semester}`);
          doc.fontSize(10).font("Helvetica");

          if (semester.subjects && semester.subjects.length > 0) {
            // Create table header
            const startX = doc.x;
            const col1X = startX;
            const col2X = startX + 150;
            const col3X = startX + 300;

            doc.text("Subject", col1X, doc.y, { width: 140 });
            doc.text("Grade", col2X, doc.y - doc.currentLineHeight(), {
              width: 140,
            });
            doc.text("Status", col3X, doc.y - doc.currentLineHeight(), {
              width: 100,
            });

            doc
              .moveTo(startX, doc.y)
              .lineTo(startX + 400, doc.y)
              .stroke();
            doc.moveDown();

            semester.subjects.forEach((subject) => {
              doc.text(
                subject.subjectName || subject.subjectCode,
                col1X,
                doc.y,
                {
                  width: 140,
                },
              );
              doc.text(
                subject.grade || "",
                col2X,
                doc.y - doc.currentLineHeight(),
                {
                  width: 140,
                },
              );
              doc.text(
                subject.status || "",
                col3X,
                doc.y - doc.currentLineHeight(),
                {
                  width: 100,
                },
              );
            });
          }

          doc.moveDown();
          if (semester.sgpa) {
            doc.text(`SGPA: ${semester.sgpa}`);
          }
          if (semester.cgpa) {
            doc.text(`CGPA: ${semester.cgpa}`);
          }
          doc.moveDown();
        });
      }

      // Footer
      doc
        .fontSize(9)
        .font("Helvetica")
        .text(`Generated on: ${new Date().toLocaleDateString()}`, {
          align: "center",
          color: "#888",
        });

      doc.end();

      stream.on("finish", () => {
        resolve(filePath);
      });

      stream.on("error", (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateResultPDF };
