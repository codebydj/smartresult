// Frontend script: single search, history, accordion, compact bar chart, SweetAlert2
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("searchForm");
  const pinInput = document.getElementById("pin");
  const submitBtn = document.getElementById("searchBtn");
  const resultDiv = document.getElementById("result");
  const resultContainer = document.getElementById("resultContainer");
  const graphSection = document.getElementById("graphSection");
  const sgpaCanvas = document.getElementById("sgpaChart");
  const downloadPdfBtn = document.getElementById("downloadPdfBtn");
  const semesterFilter = document.getElementById("semesterFilter");
  const historyBtn = document.getElementById("historyBtn");
  const historyPanel = document.getElementById("historyPanel");

  let chart = null;
  const PIN_REGEX = /^[0-9A-Z]{4,}$/; // frontend len flexible; backend enforces full rule

  function toUpper(s) {
    return String(s || "").toUpperCase();
  }

  function busy(state) {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.style.display = state ? "flex" : "none";
    if (submitBtn) {
      submitBtn.disabled = state;
      submitBtn.textContent = state ? "Searching..." : "Search";
    }
  }

  function alertError(title, text) {
    if (window.Swal)
      Swal.fire({ icon: "error", title, text, confirmButtonColor: "#2563EB" });
    else alert(text);
  }

  function saveHistory(pin, name) {
    if (!pin) return;
    try {
      const key = "sr_history_session";
      const raw = sessionStorage.getItem(key) || "[]";
      const arr = JSON.parse(raw);
      const clean = arr.filter((i) => i.pin !== pin);
      clean.unshift({ pin, name });
      const final = clean.slice(0, 5);
      sessionStorage.setItem(key, JSON.stringify(final));
      renderHistory();
    } catch (e) {
      console.warn(e);
    }
  }
  function readHistory() {
    try {
      return JSON.parse(sessionStorage.getItem("sr_history_session") || "[]");
    } catch (e) {
      return [];
    }
  }
  function clearHistory() {
    sessionStorage.removeItem("sr_history_session");
    renderHistory();
  }

  function renderHistory() {
    if (!historyPanel) return;
    const list = readHistory();
    if (list.length === 0) {
      historyPanel.innerHTML =
        '<div class="p-2 text-muted">No recent searches</div>';
      return;
    }
    historyPanel.innerHTML =
      list
        .map(
          (i) => `
      <div class="history-item" data-pin="${i.pin}">
        <div>
          <div class="history-pin">${i.pin}</div>
          <div class="history-name">${i.name || ""}</div>
        </div>
        <div class="history-actions"><button class="btn btn-sm btn-link load-btn">Load</button></div>
      </div>
    `,
        )
        .join("") +
      '<small class="text-muted ms-2">stores last 5 searches</small><div class="mt-2 d-flex justify-content-end"><button id="clearHistoryBtn" class="btn btn-sm btn-outline-secondary">Clear History</button></div>';
    // attach events
    historyPanel.querySelectorAll(".history-item").forEach((el) =>
      el.addEventListener("click", () => {
        const p = el.getAttribute("data-pin");
        if (p) {
          pinInput.value = p;
          fetchResult(p);
          historyPanel.style.display = "none";
        }
      }),
    );
    const cb = historyPanel.querySelector("#clearHistoryBtn");
    if (cb)
      cb.addEventListener("click", () => {
        clearHistory();
      });
  }

  if (historyBtn)
    historyBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (historyPanel.style.display === "block") {
        historyPanel.style.display = "none";
      } else {
        renderHistory();
        historyPanel.style.display = "block";
      }
    });
  document.addEventListener("click", (e) => {
    if (
      historyPanel &&
      !historyPanel.contains(e.target) &&
      e.target !== historyBtn
    )
      historyPanel.style.display = "none";
  });

  // Render accordion for semesters
  function isFailed(sub) {
    if (!sub) return false;
    const grade = String(sub.grade || "")
      .trim()
      .toUpperCase();
    // treat explicit F as failure
    if (grade === "F") return true;
    // if the record says COMPLETED it's not a failure
    if (grade === "COMPLETED") return false;
    // status like 'Absent'
    const status = String(sub.status || "")
      .trim()
      .toLowerCase();
    if (status && status.includes("absent")) return true;
    // treat special numeric markers as failure (e.g., 999 or 0)
    const vals = [sub.marks, sub.gradePoint, sub.points, sub.total];
    for (const v of vals) {
      const n = parseFloat(String(v || "").replace(/[^0-9.\-]/g, ""));
      if (!isNaN(n) && (n === 999 || n === 0)) return true;
    }
    return false;
  }

  function renderAccordion(semesters) {
    const accId = "semAccordion";
    const acc = document.getElementById(accId);
    if (!acc) return;
    acc.querySelectorAll(".accordion-item")?.forEach((n) => n.remove());
    semesters.forEach((sem, idx) => {
      const subjects = sem.subjects || [];
      // count failures
      const failCount = subjects.reduce((c, s) => (isFailed(s) ? c + 1 : c), 0);
      const failBadge =
        failCount > 0
          ? `<span class="failed-count" style="color: #DC2626">(${failCount} Failed)</span>`
          : "";

      const item = document.createElement("div");
      item.className = "accordion-item";
      item.dataset.idx = idx;
      const header = document.createElement("div");
      header.className = "accordion-header";
      header.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <span class="accordion-title">Semester ${sem.semester || idx + 1}</span>
          ${failBadge}
        </div>
        <div class="d-flex align-items-center gap-2">
          <span class="accordion-meta text-muted">SGPA: ${sem.sgpa || "N/A"}</span>
          <span class="accordion-arrow">&#x25BC;</span>
        </div>
      `;
      const body = document.createElement("div");
      body.className = "accordion-body";
      const table = document.createElement("div");
      table.className = "table-responsive";
      const rows = subjects
        .map((s) => {
          const failed = isFailed(s);
          return `<tr class="${failed ? "failed-subject" : ""}">
            <td>${s.subjectCode || ""}</td>
            <td>${s.subjectName || ""}</td>
            <td>${s.grade || ""}</td>
            <td>${s.gradePoint || s.total || ""}</td>
            <td>${s.credit || s.credits || ""}${
              failed ? '<span class="failed-badge">FAILED</span>' : ""
            }</td>
          </tr>`;
        })
        .join("");
      table.innerHTML = `<table class="table table-sm mb-0"><thead><tr><th>Code</th><th>Subject</th><th>Grade</th><th>GP</th><th>Credit</th></tr></thead><tbody>${rows}</tbody></table>`;
      body.appendChild(table);
      item.appendChild(header);
      item.appendChild(body);
      acc.appendChild(item);
      // click behavior
      header.addEventListener("click", () => {
        // close others
        acc.querySelectorAll(".accordion-body").forEach((b) => {
          if (b !== body) {
            b.style.maxHeight = 0;
            b.classList.remove("open");
            // also reset arrow on other headers
            const h = b.previousElementSibling;
            if (h) h.classList.remove("open");
          }
        });
        const opening = !body.classList.contains("open");
        if (!opening) {
          body.style.maxHeight = 0;
          body.classList.remove("open");
          header.classList.remove("open");
        } else {
          body.classList.add("open");
          body.style.maxHeight = body.scrollHeight + "px";
          header.classList.add("open");
        }
        updateChartForOpenSemester();
      });
    });
  }

  function renderResultCompact(data) {
    if (!data) return;
    const name = data.studentName || data.name || "N/A";
    const pin = data.pin || "";
    const cgpa =
      data.overallCGPA ||
      (data.semesters && data.semesters[0] && data.semesters[0].cgpa) ||
      "N/A";
    let status = "PASS";
    if (data.failedCount && Number(data.failedCount) > 0) status = "FAIL";
    if (!data.semesters || !data.semesters.length) status = "WITHHELD";

    const totalFailed = (data.semesters || []).reduce(
      (sum, sem) =>
        sum +
        (sem.subjects || []).reduce((c, s) => (isFailed(s) ? c + 1 : c), 0),
      0,
    );
    const statusText = totalFailed > 0 ? `${status}[${totalFailed}]` : status;

    const container = document.createElement("div");
    container.className = "result-card";
    container.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 class="mb-0">${name}</h4>
          <small class="text-muted">PIN: ${pin}</small>
          <div id="totalGradePoints" class="text-muted small mt-1"></div>
        </div>
        <div class="text-end">
          <div style="font-size:0.95rem"><strong>CGPA:</strong> <span style="color:var(--primary)">${cgpa}</span></div>
          <div class="mt-1"><span class="status-badge ${status === "PASS" ? "pass" : "fail"}">${statusText}</span></div>
        </div>
      </div>
      <div id="semAccordion" class="mb-0"></div>
    `;
    resultDiv.innerHTML = "";
    resultDiv.appendChild(container);
    // compute total grade points and credits
    try {
      const semesters = data.semesters || [];
      let totalPoints = 0;
      let totalCredits = 0;
      semesters.forEach((sem) => {
        (sem.subjects || []).forEach((s) => {
          const credit = parseFloat(s.credit ?? s.credits ?? 0) || 0;
          const pointsVal = parseFloat(s.points ?? "") || NaN;
          const gp = parseFloat(s.gradePoint ?? "") || NaN;
          if (!isNaN(pointsVal)) {
            totalPoints += pointsVal;
          } else if (!isNaN(gp)) {
            totalPoints += gp * credit;
          }
          totalCredits += credit;
        });
      });
      const tEl = container.querySelector("#totalGradePoints");
      if (tEl)
        tEl.innerText = `TOTAL GRADE POINTS: ${totalPoints.toFixed(2)} / ${totalCredits.toFixed(2)}`;
    } catch (e) {
      /* ignore */
    }
    renderAccordion(data.semesters || []);
    resultContainer.style.display = "block";
    graphSection.style.display = "block";
  }

  function buildBarChart(semesters) {
    if (!sgpaCanvas) return;
    const labels = (semesters || []).map((s) => s.semester || "");
    const data = (semesters || []).map((s) => {
      const v = parseFloat(String(s.sgpa || ""));
      return isNaN(v) ? null : v;
    });
    // destroy
    if (chart) {
      try {
        chart.destroy();
      } catch (e) {}
      chart = null;
    }
    const ctx = sgpaCanvas.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 0, 300);
    grad.addColorStop(0, "rgba(37,99,235,0.9)");
    grad.addColorStop(1, "rgba(37,99,235,0.35)");
    chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          { label: "SGPA", data, backgroundColor: grad, borderRadius: 6 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600 },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true },
          title: { display: false },
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, suggestedMax: 10, ticks: { stepSize: 1 } },
        },
      },
    });
  }

  function buildSubjectChart(subjects) {
    if (!sgpaCanvas) return;
    const labels = (subjects || []).map(
      (s) => s.subjectCode || s.subjectName || "",
    );
    const data = (subjects || []).map((s) => {
      let v = parseFloat(s.marks ?? s.gradePoint ?? s.points ?? s.total ?? "");
      if (isNaN(v)) v = null;
      return v;
    });
    if (chart) {
      try {
        chart.destroy();
      } catch (e) {}
      chart = null;
    }
    const ctx = sgpaCanvas.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 0, 300);
    grad.addColorStop(0, "rgba(37,99,235,0.9)");
    grad.addColorStop(1, "rgba(37,99,235,0.35)");
    chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          { label: "Marks", data, backgroundColor: grad, borderRadius: 6 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600 },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true },
          title: { display: false },
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, ticks: { stepSize: 10 } },
        },
      },
    });
  }

  function populateSemesterFilter(selectedIdx) {
    if (!semesterFilter) return;
    const list = window.lastSemesters || [];
    if (typeof selectedIdx === "number" && list[selectedIdx]) {
      const s = list[selectedIdx];
      semesterFilter.innerHTML = `<option value="${selectedIdx}">Semester ${s.semester || selectedIdx + 1}</option>`;
      semesterFilter.value = selectedIdx;
    } else {
      semesterFilter.innerHTML =
        '<option value="all">All</option>' +
        list
          .map(
            (s, i) =>
              `<option value="${i}">Semester ${s.semester || i + 1}</option>`,
          )
          .join("");
      semesterFilter.value = "all";
    }
  }

  function updateChartForOpenSemester() {
    const openBody = document.querySelector(".accordion-body.open");
    if (openBody) {
      const idx = openBody.parentElement.dataset.idx;
      const sem = (window.lastSemesters || [])[Number(idx)];
      if (sem && sem.subjects) {
        buildSubjectChart(sem.subjects);
        populateSemesterFilter(Number(idx));
        updatePerfText();
        return;
      }
    }
    // no open semester -> default overall
    buildBarChart(window.lastSemesters || []);
    populateSemesterFilter();
    updatePerfText();
  }

  // always compare the first two (latest) semesters; idx parameter is ignored since
  // the requirement is to show improvement/decrease based on the most recent pair.
  function updatePerfText(/* idx */) {
    const perfEl = document.getElementById("perfText");
    if (!perfEl) return;
    let html = "";
    const list = window.lastSemesters || [];
    if (list && list.length >= 2) {
      const latest = parseFloat(list[list.length - 1].sgpa) || 0;
      const prev = parseFloat(list[list.length - 2].sgpa) || 0;
      const diff = latest - prev;
      if (diff > 0)
        html = `<div class="performance-text perf-improved">🔼 Performance Improved by +${diff.toFixed(2)} SGPA 🎉</div>`;
        else if (diff < 0)
        html = `<div class="performance-text perf-decreased">🔽 Performance Decreased by ${diff.toFixed(2)} SGPA ☹️</div>`;
      else
        html = `<div class="performance-text perf-nochange"> 🟰 Performance unchanged from previous semester 😧</div>`;
    }
    perfEl.innerHTML = html;
  }

  async function fetchResult(pin) {
    if (!pin) return alertError("Invalid PIN", "Please enter a PIN");
    const up = toUpper(pin);
    if (!PIN_REGEX.test(up))
      return alertError("Invalid PIN", "PIN looks invalid");
    busy(true);
    try {
      const res = await fetch("/api/v1/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: up }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false)
        return alertError(
          "Result Not Found",
          (json && json.message) || "No result",
        );
      const data = json.data;
      renderResultCompact(data);
      buildBarChart(data.semesters || []);
      window.lastSemesters = data.semesters || [];
      updatePerfText();
      // populate filter using centralized helper
      populateSemesterFilter();
      if (downloadPdfBtn) {
        downloadPdfBtn.href = `/api/v1/result/${data.pin}/download-pdf`;
        downloadPdfBtn.setAttribute("download", `Result_${data.pin}.pdf`);
      }
      saveHistory(data.pin, data.studentName || data.name || "");
    } catch (err) {
      console.error(err);
      alertError("Server Error", "Failed to fetch result");
    } finally {
      busy(false);
    }
  }

  if (form)
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      fetchResult(pinInput.value);
    });
  if (pinInput) {
    pinInput.addEventListener(
      "input",
      (e) => (e.target.value = toUpper(e.target.value)),
    );
    pinInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        fetchResult(e.target.value);
      }
    });
  }

  if (semesterFilter)
    semesterFilter.addEventListener("change", function () {
      const v = this.value;
      if (v === "all") {
        buildBarChart(window.lastSemesters || []);
      } else {
        const s = (window.lastSemesters || [])[Number(v)];
        if (s) buildSubjectChart(s.subjects || []);
      }
      updatePerfText();
    });

  // initialize history on load
  renderHistory();
});
