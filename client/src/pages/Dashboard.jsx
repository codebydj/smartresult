import React, { useMemo, useState } from "react";
import Card from "../ui/Card";
import LineChart from "../ui/LineChart";
import PieChart from "../ui/PieChart";
import { exportJSON, exportCSV } from "../utils/export";

function Summary({ data }) {
  // compute basic stats
  const semesters = data.semesters || [];
  const latest = semesters[semesters.length - 1] || {};
  const cgpa =
    latest.cgpa || semesters.reduce((acc, s) => acc || s.cgpa, "") || "";
  const latestSgpa = latest.sgpa || "";
  const totalCredits = semesters
    .flatMap((s) => s.subjects || [])
    .reduce((acc, sub) => acc + (parseFloat(sub.credit) || 0), 0);
  const classText = (parseFloat(cgpa) || 0) >= 7.5 ? "First Class" : "Pass";
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card title="Current CGPA" value={cgpa || "N/A"} />
      <Card title="Latest SGPA" value={latestSgpa || "N/A"} />
      <Card title="Credits Completed" value={`${totalCredits}`} />
      <Card title="Academic Standing" value={classText} />
    </div>
  );
}

export default function Dashboard({ data, onLogout }) {
  const [selectedSem, setSelectedSem] = useState(
    (data.semesters || []).length - 1 || 0,
  );

  const semesters = data.semesters || [];
  const subjectsAll = semesters.flatMap((s) => s.subjects || []);

  const analytics = useMemo(() => {
    const numeric = (v) =>
      parseFloat((v || "").toString().replace(/[^0-9.\-]/g, "")) || 0;
    let highest = null,
      lowest = null;
    subjectsAll.forEach((sub) => {
      const gp = numeric(sub.gradePoint);
      if (highest == null || gp > numeric(highest.gradePoint)) highest = sub;
      if (lowest == null || gp < numeric(lowest.gradePoint)) lowest = sub;
    });
    const last = semesters[semesters.length - 1] || {};
    const prev = semesters[semesters.length - 2] || {};
    const lastS = numeric(last.sgpa);
    const prevS = numeric(prev.sgpa);
    const improvement = prevS ? ((lastS - prevS) / prevS) * 100 : 0;
    const totalCredits = subjectsAll.reduce(
      (acc, s) => acc + (numeric(s.credit) || 0),
      0,
    );
    const totalPoints = subjectsAll.reduce(
      (acc, s) => acc + (numeric(s.points) || 0),
      0,
    );
    const creditEfficiency = totalCredits
      ? (totalPoints / totalCredits).toFixed(2)
      : "0";
    const sCount = subjectsAll.filter(
      (s) => (s.grade || "").toUpperCase().trim() === "S",
    ).length;
    const cgpaLatest = numeric(last.cgpa) || 0;
    const academicClass =
      cgpaLatest >= 8.0
        ? "Distinction"
        : cgpaLatest >= 7.5
          ? "First Class"
          : "Pass";
    return {
      highest,
      lowest,
      improvement: improvement.toFixed(2),
      creditEfficiency,
      sCount,
      academicClass,
      totalCredits,
    };
  }, [data]);

  const handlePointClick = (idx) => {
    if (idx != null && idx >= 0 && idx < semesters.length) setSelectedSem(idx);
  };

  const handleExportJSON = () =>
    exportJSON(data, `${data.rollNumber || "student"}-summary.json`);
  const handleExportCSV = () =>
    exportCSV(data, `${data.rollNumber || "student"}-summary.csv`);

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between p-4 bg-white shadow">
        <div>
          <div className="font-semibold">
            {data.studentName || data.name || "Student"}
          </div>
          <div className="text-sm text-slate-500">{data.rollNumber || ""}</div>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-3 py-2 rounded bg-slate-100" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <Summary data={data} />

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl p-4 shadow">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold mb-3">CGPA Trend</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleExportJSON}
                  className="px-3 py-1 bg-slate-100 rounded">
                  Export JSON
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1 bg-slate-100 rounded">
                  Export CSV
                </button>
              </div>
            </div>
            <LineChart data={data} onPointClick={handlePointClick} />
          </div>
          <div className="bg-white rounded-xl p-4 shadow">
            <h3 className="font-semibold mb-3">Grade Distribution</h3>
            <PieChart data={data} />
          </div>
        </section>

        <section className="bg-white rounded-xl p-4 shadow">
          <h3 className="font-semibold mb-3">Semester Details</h3>
          <div className="flex gap-2 mb-3 overflow-auto">
            {(semesters || []).map((s, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedSem(idx)}
                className={`px-3 py-2 rounded ${selectedSem === idx ? "bg-indigo-600 text-white" : ""} border`}>
                Sem {s.semester}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {semesters[selectedSem] ? (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      Semester {semesters[selectedSem].semester} — SGPA:{" "}
                      {semesters[selectedSem].sgpa || "N/A"}
                    </div>
                    <div className="text-sm text-slate-500">
                      CGPA: {semesters[selectedSem].cgpa || "N/A"}
                    </div>
                  </div>
                  <div className="w-1/3">
                    <div className="text-sm text-slate-500">
                      Completed Credits
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 mt-2 overflow-hidden">
                      <div
                        className="h-3 bg-gradient-to-r from-green-400 to-blue-500"
                        style={{
                          width: `${Math.min(100, (analytics.totalCredits / 160) * 100)}%`,
                          transition: "width 800ms ease",
                        }}
                      />
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {analytics.totalCredits} / 160
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead className="sticky top-0 bg-white">
                      <tr className="text-left text-sm text-slate-600">
                        <th className="p-2">Code</th>
                        <th className="p-2">Subject</th>
                        <th className="p-2">Grade</th>
                        <th className="p-2">Grade Point</th>
                        <th className="p-2">Credits</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(semesters[selectedSem].subjects || []).map((sub, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2 text-sm">{sub.subjectCode}</td>
                          <td className="p-2 text-sm">{sub.subjectName}</td>
                          <td className="p-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeClass(sub.grade)}`}>
                              {sub.grade}
                            </span>
                          </td>
                          <td className="p-2 text-sm">{sub.gradePoint}</td>
                          <td className="p-2 text-sm">{sub.credit}</td>
                          <td className="p-2 text-sm">{sub.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div>No semester selected</div>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow">
            <div className="font-medium">Highest scoring subject</div>
            <div className="mt-2">
              {analytics.highest
                ? `${analytics.highest.subjectName} (${analytics.highest.subjectCode}) — ${analytics.highest.gradePoint}`
                : "N/A"}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow">
            <div className="font-medium">Lowest scoring subject</div>
            <div className="mt-2">
              {analytics.lowest
                ? `${analytics.lowest.subjectName} (${analytics.lowest.subjectCode}) — ${analytics.lowest.gradePoint}`
                : "N/A"}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow">
            <div className="font-medium">Semester improvement</div>
            <div className="mt-2">{analytics.improvement}%</div>
            <div className="text-sm text-slate-500">
              Credit efficiency: {analytics.creditEfficiency}
            </div>
            <div className="text-sm text-slate-500">
              Total S grades: {analytics.sCount}
            </div>
            <div className="text-sm text-slate-500">
              Class: {analytics.academicClass}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl p-4 shadow">
          <h3 className="font-semibold mb-3">Feedback</h3>
          <div className="flex gap-4 flex-wrap">
            <div className="p-3 rounded-lg bg-green-50">
              ✅ Great Improvement This Semester
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              📈 Performance Increased by {analytics.improvement}%
            </div>
            <div className="p-3 rounded-lg bg-indigo-50">
              🌱 Consistent Academic Growth
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function getBadgeClass(grade) {
  if (!grade) return "bg-gray-100 text-gray-700";
  const g = grade.trim().toUpperCase();
  if (g === "S") return "bg-green-100 text-green-800";
  if (g === "A") return "bg-blue-100 text-blue-800";
  if (g === "B") return "bg-sky-100 text-sky-800";
  if (g === "C") return "bg-orange-100 text-orange-800";
  if (g === "D") return "bg-red-100 text-red-800";
  if (g === "F") return "bg-red-800 text-white";
  return "bg-gray-100 text-gray-700";
}
