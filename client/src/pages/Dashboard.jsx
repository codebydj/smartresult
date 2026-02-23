import React, { useMemo, useState } from "react";
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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 transform hover:scale-105 transition-transform duration-300">
        <div className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-1">Current CGPA</div>
        <div className="text-4xl font-bold tracking-tight">{cgpa || "N/A"}</div>
      </div>
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 transform hover:scale-105 transition-transform duration-300">
        <div className="text-indigo-100 text-sm font-medium uppercase tracking-wider mb-1">Latest SGPA</div>
        <div className="text-4xl font-bold tracking-tight">{latestSgpa || "N/A"}</div>
      </div>
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-purple-200 transform hover:scale-105 transition-transform duration-300">
        <div className="text-purple-100 text-sm font-medium uppercase tracking-wider mb-1">Credits Completed</div>
        <div className="text-4xl font-bold tracking-tight">{totalCredits}</div>
      </div>
      <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg shadow-pink-200 transform hover:scale-105 transition-transform duration-300">
        <div className="text-pink-100 text-sm font-medium uppercase tracking-wider mb-1">Academic Standing</div>
        <div className="text-2xl font-bold mt-2 tracking-tight">{classText}</div>
      </div>
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

  const API_BASE_URL =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? ""
      : "https://smartresult-7z5x.onrender.com";

  return (
    <div className="min-h-screen bg-slate-50/50">
      <header className="flex items-center justify-between px-6 py-5 bg-white shadow-sm border-b border-slate-100 sticky top-0 z-10">
        <div className="flex flex-col">
          <div className="font-bold text-xl text-slate-800">
            {data.studentName || data.name || "Student"}
          </div>
          <div className="text-sm text-slate-500 font-mono">{data.rollNumber || ""}</div>
        </div>
        <div className="flex items-center gap-4">
          <a
            href={`${API_BASE_URL}/api/v1/result/${data.pin || data.rollNumber}/download-pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors text-sm shadow-sm shadow-indigo-200">
            📥 PDF
          </a>
          <button className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors text-sm" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <Summary data={data} />

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 mb-4 text-lg">SGPA Performance</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleExportJSON}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-md border border-slate-200 transition-colors">
                  Export JSON
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-md border border-slate-200 transition-colors">
                  Export CSV
                </button>
              </div>
            </div>
            <LineChart data={data} onPointClick={handlePointClick} />
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 text-lg">Grade Distribution</h3>
            <PieChart data={data} />
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-3 text-lg">
            <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
            Semester Details
          </h3>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {(semesters || []).map((s, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedSem(idx)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                  selectedSem === idx
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 transform scale-105"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-300"
                }`}>
                Sem {s.semester}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {semesters[selectedSem] ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-slate-800">
                      Semester {semesters[selectedSem].semester}
                    </div>
                    <div className="flex gap-3 mt-1">
                      <span className="text-sm font-medium px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                        SGPA: {semesters[selectedSem].sgpa || "N/A"}
                      </span>
                      <span className="text-sm font-medium px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100">
                        CGPA: {semesters[selectedSem].cgpa || "N/A"}
                      </span>
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

                <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                  <table className="min-w-full table-auto">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="p-3">Code</th>
                        <th className="p-3">Subject</th>
                        <th className="p-3">Grade</th>
                        <th className="p-3">Grade Point</th>
                        <th className="p-3">Credits</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {(semesters[selectedSem].subjects || []).map((sub, i) => (
                        <tr
                          key={i}
                          className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-sm font-medium text-slate-700">
                            {sub.subjectCode}
                          </td>
                          <td className="p-3 text-sm text-slate-600">
                            {sub.subjectName}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${getBadgeClass(sub.grade)}`}>
                              {sub.grade}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-slate-600 font-medium">
                            {sub.gradePoint}
                          </td>
                          <td className="p-3 text-sm text-slate-600">
                            {sub.credit}
                          </td>
                          <td className="p-3 text-sm">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                (sub.status || "")
                                  .toLowerCase()
                                  .includes("pass")
                                  ? "bg-green-50 text-green-700 border border-green-100"
                                  : "bg-red-50 text-red-700 border border-red-100"
                              }`}>
                              {sub.status}
                            </span>
                          </td>
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
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="font-semibold text-slate-500 text-sm uppercase tracking-wide">Highest scoring subject</div>
            <div className="mt-3 text-lg font-medium text-slate-800">
              {analytics.highest
                ? `${analytics.highest.subjectName} (${analytics.highest.subjectCode}) — ${analytics.highest.gradePoint}`
                : "N/A"}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="font-semibold text-slate-500 text-sm uppercase tracking-wide">Lowest scoring subject</div>
            <div className="mt-3 text-lg font-medium text-slate-800">
              {analytics.lowest
                ? `${analytics.lowest.subjectName} (${analytics.lowest.subjectCode}) — ${analytics.lowest.gradePoint}`
                : "N/A"}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="font-semibold text-slate-500 text-sm uppercase tracking-wide">Semester improvement</div>
            <div className={`mt-3 text-2xl font-bold ${parseFloat(analytics.improvement) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {parseFloat(analytics.improvement) > 0 ? '+' : ''}{analytics.improvement}%
            </div>
            <div className="text-sm text-slate-500 mt-2 flex justify-between">
              Credit efficiency: {analytics.creditEfficiency}
            </div>
            <div className="text-sm text-slate-500 flex justify-between">
              Total S grades: {analytics.sCount}
            </div>
            <div className="text-sm text-slate-500 flex justify-between">
              Class: {analytics.academicClass}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 text-lg">Feedback</h3>
          <div className="flex gap-4 flex-wrap">
            <div className="px-4 py-3 rounded-xl bg-green-50 text-green-700 font-medium border border-green-100">
              ✅ Great Improvement This Semester
            </div>
            <div className="px-4 py-3 rounded-xl bg-blue-50 text-blue-700 font-medium border border-blue-100">
              📈 Performance Increased by {analytics.improvement}%
            </div>
            <div className="px-4 py-3 rounded-xl bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
              🌱 Consistent Academic Growth
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function getBadgeClass(grade) {
  if (!grade) return "bg-slate-100 text-slate-600 border border-slate-200";
  const g = grade.trim().toUpperCase();
  if (g === "S" || g === "O")
    return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  if (g === "A" || g === "A+")
    return "bg-blue-100 text-blue-700 border border-blue-200";
  if (g === "B") return "bg-cyan-100 text-cyan-700 border border-cyan-200";
  if (g === "C")
    return "bg-yellow-100 text-yellow-700 border border-yellow-200";
  if (g === "D")
    return "bg-orange-100 text-orange-700 border border-orange-200";
  if (g === "F") return "bg-red-100 text-red-700 border border-red-200";
  return "bg-slate-100 text-slate-600 border border-slate-200";
}
