document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("resultForm");
  const spinner = document.getElementById("spinner");
  const submitBtn = document.getElementById("submitBtn");
  const resultDiv = document.getElementById("result");

  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const pin = document.getElementById("pin").value.trim();
      const semester = document.getElementById("semester").value;

      if (!pin) {
        resultDiv.innerHTML = `<p style="color:red">Please enter a PIN.</p>`;
        return;
      }

      // show loading
      spinner.classList.add("show");
      spinner.setAttribute("aria-hidden", "false");
      submitBtn.disabled = true;

      try {
        const res = await fetch(
          `/result?pin=${encodeURIComponent(pin)}&semester=${encodeURIComponent(semester)}`,
        );
        const data = await res.json();

        if (data.error) {
          resultDiv.innerHTML = `<p style="color:red">${data.error}</p>`;
        } else {
          let html = `<h3>Result Details</h3>`;
          const displayName = data.name || data.studentName || "";
          html += `<p><strong>Name:</strong> ${displayName}</p>`;
          if (data.rollNumber)
            html += `<p><strong>Roll Number:</strong> ${data.rollNumber}</p>`;
          // show top-level semester/sgpa/cgpa if present
          if (data.semester)
            html += `<p><strong>Semester:</strong> ${data.semester}</p>`;
          if (data.sgpa) html += `<p><strong>SGPA:</strong> ${data.sgpa}</p>`;
          if (data.cgpa) html += `<p><strong>CGPA:</strong> ${data.cgpa}</p>`;

          // Render detailed semesters if available
          if (Array.isArray(data.semesters) && data.semesters.length) {
            data.semesters.forEach((s) => {
              html += `<h4>Semester: ${s.semester || ""}</h4>`;
              if (Array.isArray(s.subjects) && s.subjects.length) {
                html += `<table style="width:100%;border-collapse:collapse" border="1"><thead><tr><th>Code</th><th>Subject</th><th>Grade Point</th><th>Grade</th><th>Status</th><th>Credit</th><th>Points</th></tr></thead><tbody>`;
                s.subjects.forEach((sub) => {
                  const gp = sub.gradePoint || sub.total || "";
                  const grade = sub.grade || "";
                  const status = sub.status || "";
                  const credit = sub.credit || sub.credits || "";
                  let points = sub.points || "";
                  if ((!points || points === "") && gp && credit) {
                    const gpn = parseFloat(
                      String(gp).replace(/[^0-9.\-]/g, ""),
                    );
                    const crn = parseFloat(
                      String(credit).replace(/[^0-9.\-]/g, ""),
                    );
                    if (!isNaN(gpn) && !isNaN(crn))
                      points = (gpn * crn).toFixed(2);
                  }
                  html += `<tr><td>${sub.subjectCode || ""}</td><td>${sub.subjectName || ""}</td><td>${gp}</td><td>${grade}</td><td>${status}</td><td>${credit}</td><td>${points}</td></tr>`;
                });
                html += `</tbody></table>`;
              }
              html += `<p><strong>SGPA:</strong> ${s.sgpa || ""} &nbsp; <strong>CGPA:</strong> ${s.cgpa || ""}</p>`;
            });
          }

          resultDiv.innerHTML = html;
        }
      } catch (err) {
        console.error(err);
        resultDiv.innerHTML = `<p style="color:red">Failed to fetch result. Try again later.</p>`;
      } finally {
        // hide loading
        spinner.classList.remove("show");
        spinner.setAttribute("aria-hidden", "true");
        submitBtn.disabled = false;
      }
    });
  }
});
