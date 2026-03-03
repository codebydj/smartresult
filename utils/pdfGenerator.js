const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Generates a PDF for the student result
 * @param {Object} resultData - The student result data
 * @returns {Promise<string>} - Path to the generated PDF file
 */
const generateResultPDF = (resultData) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a document
      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
        bufferPages: true,
      });

      // Define temp directory and file path
      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const fileName = `Result_${resultData.pin}_${Date.now()}.pdf`;
      const filePath = path.join(tempDir, fileName);

      // Pipe output to file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // --- PDF Content ---

      // Header
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("SmartResultMVR", { align: "center" });

      doc
        .fontSize(10)
        .font("Helvetica")
        .text("Student Performance Report", { align: "center" });

      doc.moveDown(1);

      // Student Info Box
      doc.rect(50, doc.y, 495, 80).stroke();
      const infoY = doc.y + 15;

      doc.fontSize(12).font("Helvetica-Bold");
      doc.text("Name:", 70, infoY);
      doc
        .font("Helvetica")
        .text(resultData.studentName || resultData.name || "N/A", 150, infoY, {
          width: 300,
          ellipsis: true,
        });

      doc.font("Helvetica-Bold").text("PIN:", 70, infoY + 20);
      doc.font("Helvetica").text(resultData.pin, 150, infoY + 20);

      if (resultData.rollNumber) {
        doc.font("Helvetica-Bold").text("Roll No:", 300, infoY + 20);
        doc.font("Helvetica").text(resultData.rollNumber, 380, infoY + 20);
      }

      doc.font("Helvetica-Bold").text("Generated:", 300, infoY);
      doc.font("Helvetica").text(new Date().toLocaleDateString(), 380, infoY);

      doc.y = infoY + 65;
      doc.moveDown(1);

      // Summary
      if (resultData.overallCGPA || resultData.overallSGPA) {
        doc.fontSize(14).font("Helvetica-Bold").text("Academic Summary");
        doc.moveDown(0.5);

        const summaryText = [];
        if (resultData.overallCGPA)
          summaryText.push(`CGPA: ${resultData.overallCGPA}`);
        if (resultData.overallSGPA)
          summaryText.push(`SGPA: ${resultData.overallSGPA}`);
        if (resultData.failedCount !== undefined)
          summaryText.push(`Failed Subjects: ${resultData.failedCount}`);

        doc.fontSize(12).font("Helvetica").text(summaryText.join("  |  "));
        doc.moveDown(1);
      }

      // Semesters
      if (resultData.semesters && resultData.semesters.length > 0) {
        let semsOnPage = 0;
        resultData.semesters.forEach((sem) => {
          // start a new page if previous semester pushed us past limit or
          // if we've already placed two semesters on the current page
          if (doc.y > 720 || semsOnPage >= 2) {
            doc.addPage();
            semsOnPage = 0;
          }

          // coloured background for semester heading
          const headingHeight = 20;
          doc.rect(50, doc.y, 495, headingHeight).fill("#E8F0FE");
          doc.fillColor("#000000");

          // left-align the semester heading at the left margin
          doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .text(`Semester ${sem.semester}`, 55, doc.y + 4, { align: "left" });
          doc
            .fontSize(10)
            .font("Helvetica")
            .text(
              `SGPA: ${sem.sgpa || "N/A"}  |  CGPA: ${sem.cgpa || "N/A"}`,
              55,
              doc.y + 18,
              {
                align: "left",
              },
            );
          doc.moveDown(2);
          semsOnPage++;

          // Table structure
          const tableTop = doc.y;
          const colWidths = {
            code: 55,
            name: 195,
            grade: 45,
            credit: 45,
            status: 65,
            points: 45,
          };

          const colX = {
            code: 50,
            name: 50 + colWidths.code + 5,
            grade: 50 + colWidths.code + 5 + colWidths.name + 5,
            credit:
              50 +
              colWidths.code +
              5 +
              colWidths.name +
              5 +
              colWidths.grade +
              5,
            status:
              50 +
              colWidths.code +
              5 +
              colWidths.name +
              5 +
              colWidths.grade +
              5 +
              colWidths.credit +
              5,
            points:
              50 +
              colWidths.code +
              5 +
              colWidths.name +
              5 +
              colWidths.grade +
              5 +
              colWidths.credit +
              5 +
              colWidths.status +
              5,
          };

          // Draw header background
          doc.rect(50, doc.y, 495, 18).fill("#CCCCCC");
          doc.fillColor("#000000");

          // Header row
          doc.fontSize(9).font("Helvetica-Bold");
          const headerY = doc.y + 4;
          doc.text("Code", colX.code, headerY, { width: colWidths.code });
          doc.text("Subject Name", colX.name, headerY, {
            width: colWidths.name,
          });
          doc.text("Grade", colX.grade, headerY, {
            width: colWidths.grade,
            align: "center",
          });
          doc.text("Credit", colX.credit, headerY, {
            width: colWidths.credit,
            align: "center",
          });
          doc.text("Status", colX.status, headerY, {
            width: colWidths.status,
            align: "center",
          });
          doc.text("Points", colX.points, headerY, {
            width: colWidths.points,
            align: "center",
          });

          doc.moveDown(1.3);

          // Subjects
          if (sem.subjects && sem.subjects.length > 0) {
            doc.font("Helvetica").fontSize(8);
            let rowY = doc.y;

            sem.subjects.forEach((sub, idx) => {
              // Page break if near end
              if (rowY > 750) {
                doc.addPage();
                rowY = 50;
              }

              // Alternate row bg for readability
              if (idx % 2 === 0) {
                doc.rect(50, rowY - 2, 495, 14).fill("#F5F5F5");
              }

              // Determine status and failure for coloring
              const grade = String(sub.grade || "").toUpperCase();
              let status = "Passed";
              let isFailed = false;
              if (grade === "F" || grade === "FAIL") {
                status = "Failed";
                isFailed = true;
              } else if (grade === "COMPLETED") {
                status = "Completed";
              } else if (grade === "S") {
                status = "Passed";
              }

              doc.fillColor(isFailed ? "red" : "#000000");

              // Draw row text (normalize numeric placeholders)
              const norm = (v) => {
                const n = parseFloat(String(v || "").replace(/[^0-9.\-]/g, ""));
                if (isNaN(n)) return "";
                return n === 999 ? "0" : n.toString();
              };

              doc.text(sub.subjectCode || "", colX.code, rowY, {
                width: colWidths.code,
              });
              doc.text(sub.subjectName || "", colX.name, rowY, {
                width: colWidths.name,
                ellipsis: true,
              });
              doc.text(sub.grade || "", colX.grade, rowY, {
                width: colWidths.grade,
                align: "center",
              });
              doc.text(norm(sub.credit || ""), colX.credit, rowY, {
                width: colWidths.credit,
                align: "center",
              });
              doc.text(status, colX.status, rowY, {
                width: colWidths.status,
                align: "center",
              });
              doc.text(norm(sub.points || ""), colX.points, rowY, {
                width: colWidths.points,
                align: "center",
              });

              rowY += 14;
            });

            // Draw table border
            doc.moveTo(50, tableTop).lineTo(50, rowY).stroke();
            doc.moveTo(545, tableTop).lineTo(545, rowY).stroke();
            doc.moveTo(50, rowY).lineTo(545, rowY).stroke();

            doc.y = rowY + 10;
          }
          doc.moveDown(1);
        });
      } else {
        doc.text("No semester details found.");
      }

      // Page Numbers
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(8)
          .text(`Page ${i + 1} of ${range.count}`, 50, doc.page.height - 30, {
            align: "center",
            width: 500,
          });
      }

      doc.end();

      stream.on("finish", () => {
        resolve(filePath);
      });

      stream.on("error", (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateResultPDF };
