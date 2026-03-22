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
  const PIN_REGEX = /^[0-9A-Z]{4,}$/;

  function toUpper(s) {
    return String(s || "").toUpperCase();
  }

  function busy(state) {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.style.display = state ? "flex" : "none";
    if (state && window.startLoadingAnimation) window.startLoadingAnimation();
    if (!state && window.stopLoadingAnimation) window.stopLoadingAnimation();
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

  // ✅ Load live stats (online users + total searches)
  async function loadLiveStats() {
    try {
      const res = await fetch(
        "https://smartresult-backend.onrender.com/stats/live",
      );
      const data = await res.json();
      const onlineEl = document.getElementById("onlineCount");
      const totalEl = document.getElementById("totalSearchCount");
      if (onlineEl) onlineEl.textContent = data.onlineUsers || 0;
      if (totalEl)
        totalEl.textContent = (data.totalSearches || 0).toLocaleString();
    } catch (err) {
      console.log("Stats fetch failed:", err.message);
    }
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
        <div class="history-actions"><button class="btn btn-sm btn-link load-btn">GET</button></div>
      </div>
    `,
        )
        .join("") +
      '<small class="text-muted ms-2">stores last 5 searches</small><div class="mt-2 d-flex justify-content-end"><button id="clearHistoryBtn" class="btn btn-sm btn-outline-secondary">Clear History</button></div>';
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

  function getRank(cgpa) {
    const val = parseFloat(cgpa || 0);
    if (val >= 9.5)
      return { name: "Conqueror/Heroic", emoji: "", badge: "🔥", color: "#FFD700" };
    if (val >= 8.5)
      return { name: "Diamond", emoji: "💎", badge: "💎", color: "#00CED1" };
    if (val >= 7.5)
      return { name: "Platinum", emoji: "🟣", badge: "🟣", color: "#9370DB" };
    if (val >= 6.5)
      return { name: "Gold", emoji: "🟡", badge: "🟡", color: "#FFD700" };
    if (val >= 5.5)
      return { name: "Silver", emoji: "⚪", badge: "⚪", color: "#C0C0C0" };
    if (val >= 4.5)
      return { name: "Bronze", emoji: "🟤", badge: "🟤", color: "#CD7F32" };
    return { name: "noob", emoji: "💀", badge: "💀", color: "#8B0000" };
  }

  function renderRankingTable(targetElement) {
    const rankTable = targetElement || document.getElementById("rankingTable");
    if (!rankTable) return;

    const ranks = [
      { range: "9.5 – 10", name: "Conqueror/Heroic", emoji: "👑", badge: "🏆🔥" },
      { range: "8.5 – 9.4", name: "Diamond", emoji: "💎", badge: "💎" },
      { range: "7.5 – 8.4", name: "Platinum", emoji: "🟣", badge: "🟣" },
      { range: "6.5 – 7.4", name: "Gold", emoji: "🟡", badge: "🟡" },
      { range: "5.5 – 6.4", name: "Silver", emoji: "⚪", badge: "⚪" },
      { range: "4.5 – 5.4", name: "Bronze", emoji: "🟤", badge: "🟤" },
      { range: "Below 4.5", name: "noob", emoji: "💀", badge: "💀" },
    ];

    rankTable.innerHTML = `
      <div style="margin-top: 2rem; margin-bottom: 3rem; padding: 2rem; background: #f8f9fa; border-radius: 8px;">
        <h5 style="margin-bottom: 1rem; text-align: center; color: #333;">🎮 Gaming Rank Levels</h5>
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
          <thead>
            <tr style="background: #007bff; color: white;">
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">SGPA Range</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Gaming Rank</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Badge Style</th>
            </tr>
          </thead>
          <tbody>
            ${ranks
              .map(
                (r) => `
              <tr style="background: ${ranks.indexOf(r) % 2 === 0 ? "#fff" : "#f0f0f0"}; border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; border: 1px solid #ddd;">${r.range}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${r.emoji} ${r.name}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 1.2rem;">${r.badge}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function normalizeNumber(val) {
    const n = parseFloat(String(val || "").replace(/[^0-9.\-]/g, ""));
    if (isNaN(n)) return NaN;
    if (n === 999) return 0;
    return n;
  }

  function isFailed(sub) {
    if (!sub) return false;
    const grade = String(sub.grade || "").trim().toUpperCase();
    if (grade === "F" || grade === "FAIL") return true;
    if (grade === "COMPLETED") return false;
    const status = String(sub.status || "").trim().toLowerCase();
    if (status && (status.includes("absent") || status.includes("fail")))
      return true;
    const vals = [sub.marks, sub.gradePoint, sub.points, sub.total];
    for (const v of vals) {
      const raw = parseFloat(String(v || "").replace(/[^0-9.\-]/g, ""));
      if (!isNaN(raw) && raw === 0) return true;
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
          <button class="share-sem-btn btn btn-sm" 
            style="background:linear-gradient(90deg,#6366f1,#06b6d4);color:white;border:none;border-radius:20px;padding:3px 10px;font-size:0.72rem;font-weight:600;"
            data-idx="${idx}">
            📤 Share
          </button>
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
          const gpNum = normalizeNumber(s.gradePoint ?? s.total ?? "");
          const gpText = isNaN(gpNum) ? "" : gpNum.toString();
          const creditText = (() => {
            const cnum = normalizeNumber(s.credit ?? s.credits ?? "");
            return isNaN(cnum) ? "" : cnum.toString();
          })();

          return `<tr class="${failed ? "failed-subject" : ""}">
            <td>${s.subjectCode || ""}</td>
            <td>${s.subjectName || ""}</td>
            <td>${s.grade || ""}</td>
            <td>${gpText}</td>
            <td>${creditText}${
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
      header.addEventListener("click", () => {
        acc.querySelectorAll(".accordion-body").forEach((b) => {
          if (b !== body) {
            b.style.maxHeight = 0;
            b.classList.remove("open");
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
      const shareBtn = header.querySelector(".share-sem-btn");
      if (shareBtn) {
        shareBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const semIdx = parseInt(shareBtn.getAttribute("data-idx"));
          const semData = (window.lastSemesters || [])[semIdx];
          const studentName =
            document.querySelector(".result-card h4")?.textContent || "";
          const cgpa =
            document.querySelector(".result-card [style*='var(--primary)']")
              ?.textContent || "";
          if (semData) shareSemesterAsImage(semData, studentName, cgpa);
        });
      }
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
    const totalFailed = (data.semesters || []).reduce(
      (sum, sem) =>
        sum +
        (sem.subjects || []).reduce((c, s) => (isFailed(s) ? c + 1 : c), 0),
      0,
    );

    let status = "PASS";
    if (totalFailed > 0) status = "FAIL";
    if (!data.semesters || !data.semesters.length) status = "WITHHELD";
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
          <div style="font-size:0.95rem">
            <strong>CGPA:</strong> <span style="color:var(--primary)">${cgpa}</span>
          </div>
          <div style="font-size:0.85rem; margin-top: 0.3rem;">
            ${cgpa !== "N/A" ? `<span style="font-weight:600;">${getRank(cgpa).emoji} ${getRank(cgpa).name}</span>` : ""}
          </div>
          <div class="mt-1"><span class="status-badge ${status === "PASS" ? "pass" : "fail"}">${statusText}</span></div>
        </div>
      </div>
      <div id="semAccordion" class="mb-0"></div>
    `;
    resultDiv.innerHTML = "";
    resultDiv.appendChild(container);
    try {
      const semesters = data.semesters || [];
      let totalPoints = 0;
      let totalCredits = 0;
      semesters.forEach((sem) => {
        (sem.subjects || []).forEach((s) => {
          const credit = normalizeNumber(s.credit ?? s.credits ?? 0) || 0;
          const pointsVal = normalizeNumber(s.points ?? "");
          const gp = normalizeNumber(s.gradePoint ?? "");
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
    } catch (e) {}
    renderAccordion(data.semesters || []);

    resultContainer.style.display = "block";
    graphSection.style.display = "block";

    const staticRankingTable = document.getElementById("staticRankingTable");
    if (staticRankingTable) {
      staticRankingTable.style.display = "none";
    }

    let rankingTableDiv = document.getElementById("resultRankingTable");
    if (!rankingTableDiv) {
      rankingTableDiv = document.createElement("div");
      rankingTableDiv.id = "resultRankingTable";
      graphSection.parentNode.insertBefore(
        rankingTableDiv,
        graphSection.nextSibling,
      );
    }
    renderRankingTable(rankingTableDiv);
  }

  function buildBarChart(semesters) {
    if (!sgpaCanvas) return;
    const labels = (semesters || []).map((s) => s.semester || "");
    const data = (semesters || []).map((s) => {
      const v = parseFloat(String(s.sgpa || ""));
      return isNaN(v) ? null : v;
    });
    if (chart) {
      try { chart.destroy(); } catch (e) {}
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
        datasets: [{ label: "SGPA", data, backgroundColor: grad, borderRadius: 6 }],
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
      let v = normalizeNumber(s.marks ?? s.gradePoint ?? s.points ?? s.total ?? "");
      if (isNaN(v)) v = null;
      return v;
    });
    if (chart) {
      try { chart.destroy(); } catch (e) {}
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
        datasets: [{ label: "Marks", data, backgroundColor: grad, borderRadius: 6 }],
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
    semesterFilter.innerHTML =
      '<option value="all">All</option>' +
      list
        .map(
          (s, i) =>
            `<option value="${i}">Semester ${s.semester || i + 1}</option>`,
        )
        .join("");
    if (typeof selectedIdx === "number" && list[selectedIdx]) {
      semesterFilter.value = selectedIdx;
    } else {
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
    buildBarChart(window.lastSemesters || []);
    populateSemesterFilter();
    updatePerfText();
  }

  function updatePerfText() {
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
      const res = await fetch(
        "https://smartresult-backend.onrender.com/api/v1/result",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: up }),
        },
      );
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
      populateSemesterFilter();
      if (downloadPdfBtn) {
        downloadPdfBtn.onclick = () => {
          window.open(
            `https://smartresult-backend.onrender.com/api/v1/result/${data.pin}/download-pdf`,
            "_blank",
          );
        };
      }
      saveHistory(data.pin, data.studentName || data.name || "");

      // ✅ REFRESH COUNT ON SCREEN AFTER EVERY SEARCH
      await loadLiveStats();

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

  async function shareSemesterAsImage(sem, studentName, cgpa) {
    const card = document.createElement("div");
    card.id = "shareCard";
    card.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 400px;
    background: linear-gradient(135deg, #0f172a, #1e293b);
    border-radius: 20px;
    padding: 28px;
    color: white;
    font-family: Inter, sans-serif;
    z-index: -1;
  `;

    const rank = getRank(sem.sgpa);
    const subjects = sem.subjects || [];
    const failCount = subjects.filter((s) => isFailed(s)).length;

    const subjectRows = subjects
      .map(
        (s) => `
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.07);font-size:0.78rem;">
      <span style="color:#cbd5e1;max-width:220px;">${s.subjectName || s.subjectCode || ""}</span>
      <span style="font-weight:700;color:${isFailed(s) ? "#f87171" : "#34d399"};">${s.grade || ""}</span>
    </div>
  `,
      )
      .join("");

    card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div>
        <div style="font-size:0.7rem;color:#94a3b8;letter-spacing:1px;">SMARTRESULTMVR</div>
        <div style="font-size:1.1rem;font-weight:800;margin-top:2px;">${studentName || "Student"}</div>
      </div>
      <div style="font-size:2rem;">${rank.emoji || "🎓"}</div>
    </div>
    <div style="background:rgba(255,255,255,0.07);border-radius:12px;padding:14px;margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:0.7rem;color:#94a3b8;">SEMESTER</div>
          <div style="font-size:1.4rem;font-weight:800;">${sem.semester}</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:0.7rem;color:#94a3b8;">SGPA</div>
          <div style="font-size:2rem;font-weight:800;color:#60a5fa;">${sem.sgpa || "N/A"}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:0.7rem;color:#94a3b8;">RANK</div>
          <div style="font-size:0.9rem;font-weight:700;color:${rank.color || "#fff"};">${rank.name}</div>
        </div>
      </div>
      ${failCount > 0 ? `<div style="margin-top:8px;color:#f87171;font-size:0.78rem;font-weight:600;">⚠️ ${failCount} subject(s) failed</div>` : `<div style="margin-top:8px;color:#34d399;font-size:0.78rem;font-weight:600;">✅ All subjects passed</div>`}
    </div>
    <div style="margin-bottom:16px;">
      <div style="font-size:0.7rem;color:#94a3b8;letter-spacing:1px;margin-bottom:8px;">SUBJECTS</div>
      ${subjectRows}
    </div>
    <div style="text-align:center;margin-top:16px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.1);">
      <div style="font-size:0.7rem;color:#64748b;">smartresultmvr.vercel.app</div>
    </div>
  `;

    document.body.appendChild(card);

    try {
      const canvas = await html2canvas(card, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `SmartResult_Sem${sem.semester}_${studentName || "result"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Share failed:", err);
      alert("Failed to generate image. Try again.");
    } finally {
      document.body.removeChild(card);
    }
  }

  // ✅ Load stats on page load
  loadLiveStats();

  // initialize history on load
  renderHistory();
});