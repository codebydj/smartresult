// Sample data for mockup
const sample = {
  studentName: "Alex Johnson",
  pin: "248H5A0513",
  cgpaTrend: [7.8, 8.05, 8.1, 8.18, 8.54],
  creditPerSem: [18, 18, 20, 22, 24],
  gradeDist: { S: 12, A: 20, B: 28, C: 6, D: 2, F: 0 },
  totalCredits: 156,
  completedCredits: 102,
  semesters: [
    {
      semester: "3",
      sgpa: "8.10",
      cgpa: "8.10",
      subjects: [
        {
          subjectCode: "23BS21104",
          subjectName: "Discrete Mathematics",
          gradePoint: "7",
          grade: "D",
          status: "Passed",
          credit: "3",
        },
        {
          subjectCode: "23CS21301",
          subjectName: "Advanced Data Structures",
          gradePoint: "9",
          grade: "A",
          status: "Passed",
          credit: "3",
        },
        {
          subjectCode: "23CS21302",
          subjectName: "OOP with Java",
          gradePoint: "8",
          grade: "B",
          status: "Passed",
          credit: "3",
        },
        {
          subjectCode: "23CS21653",
          subjectName: "Python Programming",
          gradePoint: "9",
          grade: "A",
          status: "Passed",
          credit: "2",
        },
      ],
    },
    {
      semester: "4",
      sgpa: "8.26",
      cgpa: "8.18",
      subjects: [
        {
          subjectCode: "23BS22102",
          subjectName: "Probability And Statistics",
          gradePoint: "7",
          grade: "D",
          status: "Passed",
          credit: "3",
        },
        {
          subjectCode: "23CS22301",
          subjectName: "Operating Systems",
          gradePoint: "8",
          grade: "B",
          status: "Passed",
          credit: "3",
        },
        {
          subjectCode: "23CS22302",
          subjectName: "DBMS",
          gradePoint: "8",
          grade: "B",
          status: "Passed",
          credit: "3",
        },
      ],
    },
  ],
};

// Populate header
document.getElementById("studentName").innerText = sample.studentName;
document.getElementById("studentPin").innerText = "PIN: " + sample.pin;
document.getElementById("profileName").innerText = sample.studentName;

// semesters list (left panel)
const semesterList = document.getElementById("semesterList");
sample.semesters.forEach((s) => {
  const node = document.createElement("div");
  node.className = "sem-card";
  node.innerHTML = `<div class="sem-head"><div class="sem-title">Semester ${s.semester}</div><div class="sem-metrics">SGPA ${s.sgpa} • CGPA ${s.cgpa}</div></div>`;
  semesterList.appendChild(node);
});

// progress
const pct = Math.round((sample.completedCredits / sample.totalCredits) * 100);
document.getElementById("progressFill").style.width = pct + "%";
document.querySelector(".progress-meta").innerText =
  `${pct}% credits completed — ${sample.completedCredits} / ${sample.totalCredits}`;

// render semester blocks (open two)
const subjectsPanel = document.getElementById("subjectsPanel");
sample.semesters.forEach((s) => {
  const block = document.createElement("div");
  block.className = "semester-block";
  block.innerHTML = `
    <div class="block-head">
      <div><strong>Semester ${s.semester}</strong> <span style="color:#6b7280;margin-left:8px">SGPA: ${s.sgpa}</span></div>
      <div><small>CGPA: ${s.cgpa}</small></div>
    </div>
    <div class="block-body">
      <table class="subject-table">
        <thead>
          <tr><th>Code</th><th>Subject</th><th>Grade Point</th><th>Grade</th><th>Status</th><th>Credit</th><th>Points</th></tr>
        </thead>
        <tbody>
        ${s.subjects
          .map((sub) => {
            const gp = sub.gradePoint || "";
            const credit = parseFloat(sub.credit || 0);
            const points =
              gp && credit ? (parseFloat(gp) * credit).toFixed(2) : "";
            const gradeClass = "g-" + (sub.grade || "B");
            return `<tr><td>${sub.subjectCode}</td><td>${sub.subjectName}</td><td>${gp}</td><td><span class="grade-chip ${gradeClass}">${sub.grade}</span></td><td>${sub.status}</td><td>${sub.credit}</td><td>${points}</td></tr>`;
          })
          .join("")}
        </tbody>
      </table>
    </div>
  `;
  subjectsPanel.appendChild(block);
});

// Charts
const ctxLine = document.getElementById("cgpaLine").getContext("2d");
new Chart(ctxLine, {
  type: "line",
  data: {
    labels: ["Sem1", "Sem2", "Sem3", "Sem4", "Sem5"].slice(
      0,
      sample.cgpaTrend.length,
    ),
    datasets: [
      {
        label: "CGPA",
        data: sample.cgpaTrend,
        borderColor: "#4f46e5",
        backgroundColor: "rgba(79,70,229,0.1)",
        fill: true,
        tension: 0.25,
      },
    ],
  },
  options: { responsive: true, plugins: { legend: { display: false } } },
});

const ctxBar = document.getElementById("creditBar").getContext("2d");
new Chart(ctxBar, {
  type: "bar",
  data: {
    labels: ["Sem1", "Sem2", "Sem3", "Sem4", "Sem5"].slice(
      0,
      sample.creditPerSem.length,
    ),
    datasets: [
      {
        label: "Credits",
        data: sample.creditPerSem,
        backgroundColor: "#06b6d4",
      },
    ],
  },
  options: { responsive: true, plugins: { legend: { display: false } } },
});

const ctxPie = document.getElementById("gradePie").getContext("2d");
new Chart(ctxPie, {
  type: "pie",
  data: {
    labels: Object.keys(sample.gradeDist),
    datasets: [
      {
        data: Object.values(sample.gradeDist),
        backgroundColor: [
          "#10b981",
          "#3b82f6",
          "#60a5fa",
          "#f59e0b",
          "#ef4444",
          "#7f1d1d",
        ],
      },
    ],
  },
  options: { responsive: true },
});

// small niceties: compute overall CGPA display
const cgpa = sample.cgpaTrend[sample.cgpaTrend.length - 1];
document.getElementById("currentCgpa").innerText = cgpa.toFixed(2);
document.getElementById("bestSgpa").innerText = Math.max(
  ...sample.cgpaTrend,
).toFixed(2);
document.getElementById("totalCredits").innerText = sample.totalCredits;
