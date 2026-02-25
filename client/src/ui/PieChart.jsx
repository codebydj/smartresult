import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);

export default function PieChart({ data }) {
  const subjects = (data.semesters || []).flatMap((s) => s.subjects || []);
  const counts = { S: 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
  subjects.forEach((s) => {
    const g = (s.grade || "").toUpperCase().trim();
    if (counts[g] != null) counts[g]++;
  });
  const cfg = {
    labels: ["S", "A", "B", "C", "D", "F"],
    datasets: [
      {
        data: ["S", "A", "B", "C", "D", "F"].map((l) => counts[l]),
        backgroundColor: [
          "#16a34a",
          "#2563eb",
          "#60a5fa",
          "#f97316",
          "#ef4444",
          "#7f1d1d",
        ],
      },
    ],
  };
  return <Pie data={cfg} />;
}
