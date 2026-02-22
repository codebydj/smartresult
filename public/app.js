document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("resultForm");
  const submitBtn = document.getElementById("submitBtn");
  const resultDiv = document.getElementById("result");
  const resultContainer = document.getElementById("resultContainer");
  const loadingOverlay = document.getElementById("loadingOverlay");

  // CONFIGURATION: API BASE URL
  // If hosting on GitHub Pages, set this to your deployed backend URL (e.g., "https://your-app.onrender.com")
  // If hosting everything together (Docker/Local), leave it as an empty string ""
  // Auto-detect: If running on localhost, use local backend. If on GitHub Pages, use Render backend.
  const API_BASE_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
      ? ""
      : "https://smartresult-7z5x.onrender.com";

  // Store chart instances to destroy them before re-rendering
  let chartInstances = {
    sgpa: null,
  };

  // 1. Display Live Date & Time
  const clockDiv = document.createElement("div");
  clockDiv.className = "text-center mb-4 text-muted fw-bold";
  clockDiv.style.fontSize = "1.1rem";
  const mainContainer = document.querySelector(".container") || document.body;
  mainContainer.insertBefore(clockDiv, mainContainer.firstChild);

  function updateClock() {
    const now = new Date();
    clockDiv.textContent = now.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
  setInterval(updateClock, 1000);
  updateClock();

  // 2. Remove Admin Login Button (if present in HTML)
  const adminLinks = document.querySelectorAll(
    'a[href*="admin"], button[id*="admin"]',
  );
  adminLinks.forEach((el) => el.remove());

  // 3. Load Footer Stats
  loadFooterStats();

  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const pin = document.getElementById("pin").value.trim();

      if (!pin) {
        showAlert("Please enter a PIN.", "danger");
        return;
      }

      // show loading overlay
      loadingOverlay.style.display = "flex";
      submitBtn.disabled = true;

      try {
        const res = await fetch(
          `${API_BASE_URL}/api/v1/result?pin=${encodeURIComponent(pin)}`,
        );
        const data = await res.json();

        if (data.error) {
          showAlert(data.error, "danger");
          resultContainer.style.display = "none";
        } else {
          resultContainer.style.display = "block";
          const resultData = data.data || data;
          displayResult(resultData);
        }
      } catch (err) {
        console.error(err);
        showAlert("Network error. Please try again.", "danger");
        resultContainer.style.display = "none";
      } finally {
        // hide loading overlay
        loadingOverlay.style.display = "none";
        submitBtn.disabled = false;
      }
    });
  }

  function showAlert(message, type = "info") {
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    resultDiv.prepend(alertDiv);

    // Auto-dismiss after 5 seconds
    setTimeout(() => alertDiv.remove(), 5000);
  }

  async function displayResult(resultData) {
    let html = `
      <div class="card shadow-lg border-0 mb-4 animate-in">
        <div class="card-header bg-primary text-white">
          <h3 class="mb-0">✓ Result Found</h3>
        </div>
        <div class="card-body">
          <div class="row mb-4">
            <div class="col-md-6">
              <p><strong>Name:</strong> ${resultData.name || resultData.studentName || "N/A"}</p>
              ${resultData.rollNumber ? `<p><strong>Roll Number:</strong> ${resultData.rollNumber}</p>` : ""}
            </div>
            <div class="col-md-6">
              ${resultData.overallCGPA ? `<p><strong>CGPA:</strong> <span class="badge bg-success">${resultData.overallCGPA}</span></p>` : ""}
              ${resultData.totalSemesters ? `<p><strong>Semesters:</strong> ${resultData.totalSemesters}</p>` : ""}
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="mb-4">
            <a href="${API_BASE_URL}/api/v1/result/${resultData.pin}/download-pdf" class="btn btn-outline-primary" target="_blank">
              📥 Download PDF
            </a>
          </div>

          <!-- Performance Charts Section -->
          <div class="row mb-4">
            <!-- SGPA Performance Chart -->
            <div class="col-12 mb-4">
              <div class="card shadow-sm border-0 h-100">
                <div class="card-body">
                  <h6 class="card-title text-muted text-uppercase fw-bold mb-3 small">SGPA Performance</h6>
                  <div style="position: relative; height: 250px; width: 100%;">
                    <canvas id="sgpaChart"></canvas>
                  </div>
                  <div id="sgpaInsight" class="mt-3 p-2 rounded bg-light text-center small fw-bold text-muted"></div>
                </div>
              </div>
            </div>
          </div>
    `;

    // Render detailed semesters if available
    if (Array.isArray(resultData.semesters) && resultData.semesters.length) {
      html += `<div class="accordion mb-4" id="semesterAccordion">`;

      resultData.semesters.forEach((sem, index) => {
        html += `
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button ${index === 0 ? "" : "collapsed"}" type="button" data-bs-toggle="collapse" data-bs-target="#sem${index}">
                <strong>Semester ${sem.semester}</strong>
                ${sem.sgpa ? `<span class="ms-3">SGPA: <span class="badge bg-info">${sem.sgpa}</span></span>` : ""}
              </button>
            </h2>
            <div id="sem${index}" class="accordion-collapse collapse ${index === 0 ? "show" : ""}" data-bs-parent="#semesterAccordion">
              <div class="accordion-body p-0">
        `;

        if (Array.isArray(sem.subjects) && sem.subjects.length) {
          html += `
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Code</th>
                    <th>Subject</th>
                    <th>Grade</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
          `;

          sem.subjects.forEach((sub) => {
            html += `
              <tr>
                <td><code>${sub.subjectCode || ""}</code></td>
                <td>${sub.subjectName || ""}</td>
                <td>${sub.grade || ""}</td>
                <td>${sub.gradePoint || ""}</td>
              </tr>
            `;
          });

          html += `
                </tbody>
              </table>
            </div>
          `;
        }

        html += `
              </div>
            </div>
          </div>
        `;
      });

      html += `</div>`;
    }

    html += `</div></div>`;
    resultDiv.innerHTML = html;

    // Initialize Charts
    await ensureChartJS();
    renderCharts(resultData);
  }

  // Helper to load Chart.js dynamically if not present
  function ensureChartJS() {
    return new Promise((resolve, reject) => {
      if (typeof Chart !== "undefined") return resolve();
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/chart.js";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function renderCharts(data) {
    // 1. Prepare Data
    // Helper to parse Semester (Handles "1", "I", "Sem 1", etc.)
    const parseSem = (sem) => {
      const s = String(sem)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
      if (!isNaN(parseInt(s))) return parseInt(s);
      const romans = {
        I: 1,
        II: 2,
        III: 3,
        IV: 4,
        V: 5,
        VI: 6,
        VII: 7,
        VIII: 8,
      };
      return romans[s] || 0;
    };

    // Sort semesters numerically to ensure correct trend line
    const sortedSemesters = (data.semesters || []).slice().sort((a, b) => {
      return parseSem(a.semester) - parseSem(b.semester);
    });

    if (sortedSemesters.length === 0) {
      document.getElementById("sgpaInsight").textContent =
        "No performance data available for charts.";
      return;
    }

    const labels = sortedSemesters.map((s) => `Sem ${s.semester}`);

    // Robust parsing for SGPA/CGPA to prevent empty charts
    const parseGrade = (val) => {
      if (!val) return 0;
      const num = parseFloat(String(val).replace(/[^0-9.]/g, ""));
      return isNaN(num) ? 0 : num;
    };
    const sgpaData = sortedSemesters.map((s) => parseGrade(s.sgpa));

    // 2. Destroy old instances
    if (chartInstances.sgpa) chartInstances.sgpa.destroy();

    // 3. Render SGPA Chart
    const ctxSGPA = document.getElementById("sgpaChart").getContext("2d");
    chartInstances.sgpa = new Chart(ctxSGPA, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "SGPA",
            data: sgpaData,
            borderColor: "#4f46e5", // Indigo
            backgroundColor: "rgba(79, 70, 229, 0.1)",
            borderWidth: 2,
            tension: 0.4, // Smooth curve
            fill: true,
            pointBackgroundColor: "#ffffff",
            pointBorderColor: "#4f46e5",
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: "index",
            intersect: false,
            backgroundColor: "rgba(0,0,0,0.8)",
            titleFont: { size: 13 },
            bodyFont: { size: 13 },
            padding: 10,
            cornerRadius: 4,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 10,
            grid: { borderDash: [2, 4], color: "#e5e7eb" },
          },
          x: {
            grid: { display: false },
          },
        },
      },
    });

    // 5. Performance Insight
    const insightDiv = document.getElementById("sgpaInsight");
    if (sgpaData.length >= 2) {
      const current = sgpaData[sgpaData.length - 1];
      const prev = sgpaData[sgpaData.length - 2];
      const diff = (current - prev).toFixed(2);

      if (diff > 0) {
        insightDiv.innerHTML = `<span class="text-success">📈 Your performance improved by ${diff} points!</span>`;
      } else if (diff < 0) {
        insightDiv.innerHTML = `<span class="text-danger">📉 Your SGPA dropped by ${Math.abs(
          diff,
        )} points. Review subject performance.</span>`;
      } else {
        insightDiv.innerHTML = `<span class="text-primary">Your performance is consistent.</span>`;
      }
    } else {
      insightDiv.textContent = "More data needed for insights.";
    }
  }

  async function loadFooterStats() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/result/stats/public`);
      if (res.ok) {
        const data = await res.json();
        const footer = document.createElement("footer");
        footer.className = "text-center mt-5 mb-4 text-muted small";
        footer.innerHTML = `<hr><p>Total Results Checked: <strong>${data.count}</strong></p>`;
        document.body.appendChild(footer);
      }
    } catch (err) {
      console.log("Stats not available");
    }
  }
});
