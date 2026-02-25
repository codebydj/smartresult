export function exportJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "data.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportCSV(data, filename) {
  const rows = [
    [
      "Semester",
      "SubjectCode",
      "SubjectName",
      "Grade",
      "GradePoint",
      "Credit",
      "Status",
    ],
  ];
  (data.semesters || []).forEach((s) => {
    (s.subjects || []).forEach((sub) => {
      rows.push([
        s.semester || "",
        sub.subjectCode || "",
        sub.subjectName || "",
        sub.grade || "",
        sub.gradePoint || "",
        sub.credit || "",
        sub.status || "",
      ]);
    });
  });
  const csv = rows
    .map((r) =>
      r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "data.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
