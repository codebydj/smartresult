const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

exports.generateResultPDF = (resultData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });

      // Ensure downloads directory exists
      const downloadDir = path.join(__dirname, "..", "public", "downloads");
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      const fileName = `Result_${resultData.pin}.pdf`;
      const filePath = path.join(downloadDir, fileName);
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // --- Header ---
      doc.fontSize(18).text("Student Result Report", { align: "center" });
      doc.moveDown();

      // --- Student Info ---
      doc.fontSize(12).font("Helvetica-Bold").text("Student Information");
      doc.font("Helvetica").fontSize(10);
      doc.text(`Name: ${resultData.name || resultData.studentName || "N/A"}`);
      doc.text(`PIN: ${resultData.pin}`);
      if (resultData.rollNumber)
        doc.text(`Roll Number: ${resultData.rollNumber}`);
      if (resultData.overallCGPA)
        doc.text(`Overall CGPA: ${resultData.overallCGPA}`);
      if (resultData.failedCount !== undefined)
        doc.text(`Failed Subjects: ${resultData.failedCount}`);

      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke(); // Separator line
      doc.moveDown();

      // --- Semesters ---
      doc.fontSize(14).font("Helvetica-Bold").text("Academic Performance");
      doc.moveDown(0.5);

      if (resultData.semesters && resultData.semesters.length > 0) {
        resultData.semesters.forEach((sem, index) => {
          // Check if we need a new page for the semester header
          if (doc.y > 700) doc.addPage();

          doc
            .fontSize(12)
            .font("Helvetica-Bold")
            .fillColor("#000000")
            .text(`Semester ${sem.semester}`);
          if (sem.sgpa || sem.cgpa) {
            doc
              .fontSize(10)
              .font("Helvetica")
              .text(`SGPA: ${sem.sgpa || "N/A"} | CGPA: ${sem.cgpa || "N/A"}`);
          }
          doc.moveDown(0.5);

          // Table Header
          const startX = 50;
          let currentY = doc.y;

          // Draw Header Background
          doc.rect(startX, currentY, 500, 20).fill("#f0f0f0");
          doc.fillColor("#000000");

          doc.fontSize(9).font("Helvetica-Bold");
          doc.text("Subject Code", startX + 5, currentY + 5, { width: 80 });
          doc.text("Subject Name", startX + 90, currentY + 5, { width: 250 });
          doc.text("Grade", startX + 350, currentY + 5, {
            width: 50,
            align: "center",
          });
          doc.text("Status", startX + 410, currentY + 5, {
            width: 80,
            align: "center",
          });

          currentY += 25;
          doc.font("Helvetica");

          // Subjects
          if (sem.subjects && sem.subjects.length > 0) {
            sem.subjects.forEach((sub, i) => {
              const code = sub.subjectCode || "-";
              const name = sub.subjectName || "-";
              const grade = sub.grade || "-";
              // Use the status from the object, or derive it
              let status = sub.status || "Passed";
              if (
                grade.toUpperCase() === "F" ||
                grade.toUpperCase() === "FAIL" ||
                grade.toUpperCase() === "ABSENT"
              ) {
                status = "Failed";
              }

              // Calculate dynamic row height based on subject name length
              doc.fontSize(9);
              const nameWidth = 250;
              const nameHeight = doc.heightOfString(name, { width: nameWidth });
              const rowHeight = Math.max(20, nameHeight + 10);

              // Check for page break inside table
              if (currentY + rowHeight > 750) {
                doc.addPage();
                currentY = 50;
                // Re-draw header on new page
                doc.rect(startX, currentY, 500, 20).fill("#f0f0f0");
                doc.fillColor("#000000");
                doc.fontSize(9).font("Helvetica-Bold");
                doc.text("Subject Code", startX + 5, currentY + 5, {
                  width: 80,
                });
                doc.text("Subject Name", startX + 90, currentY + 5, {
                  width: 250,
                });
                doc.text("Grade", startX + 350, currentY + 5, {
                  width: 50,
                  align: "center",
                });
                doc.text("Status", startX + 410, currentY + 5, {
                  width: 80,
                  align: "center",
                });
                doc.font("Helvetica");
                currentY += 25;
              }

              // Row background for readability (alternating or failed)
              if (status.toLowerCase().includes("fail")) {
                doc.rect(startX, currentY, 500, rowHeight).fill("#ffebee");
              } else if (i % 2 === 1) {
                doc.rect(startX, currentY, 500, rowHeight).fill("#f9f9f9");
              }

              doc.fillColor("#000000");
              const textY = currentY + 5;

              doc.text(code, startX + 5, textY, { width: 80 });
              doc.text(name, startX + 90, textY, {
                width: nameWidth,
              });
              doc.text(grade, startX + 350, textY, {
                width: 50,
                align: "center",
              });

              // Color status
              if (status.toLowerCase().includes("fail")) {
                doc.fillColor("red");
              } else {
                doc.fillColor("green");
              }
              doc.text(status, startX + 410, textY, {
                width: 80,
                align: "center",
              });
              doc.fillColor("black");

              currentY += rowHeight;
            });
          } else {
            doc
              .fontSize(9)
              .text(
                "No subjects found for this semester.",
                startX + 5,
                currentY,
              );
            currentY += 15;
          }

          doc.y = currentY + 10; // Update doc.y for next iteration
        });
      } else {
        doc.text("No semester data available.");
      }

      doc.end();

      stream.on("finish", () => resolve(filePath));
      stream.on("error", (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};
