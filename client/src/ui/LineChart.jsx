import React, { useRef } from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export default function LineChart({data, onPointClick}){
  const chartRef = useRef(null);
  const sems = (data.semesters||[]).map(s=>s.semester||'')
  const sgpas = (data.semesters||[]).map(s=> parseFloat(s.sgpa)||null)
  const cgpas = (data.semesters||[]).map(s=> parseFloat(s.cgpa)||null)

  const cfg = {
    labels: sems,
    datasets: [
      { label: 'SGPA', data: sgpas, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.12)', tension:0.4, fill: true, pointRadius:6, pointHoverRadius:8 },
      { label: 'CGPA', data: cgpas, borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.08)', tension:0.4, fill: false, pointRadius:4 }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      tooltip: { enabled: true, mode: 'index', intersect: false },
      legend: { display: true }
    },
    scales: {
      y: { suggestedMin: 0, suggestedMax: 10 }
    },
    animation: { duration: 900, easing: 'easeOutQuart' }
  };

  const handleClick = (evt, elements) => {
    if (!elements || elements.length === 0) return;
    const el = elements[0];
    const idx = el.index;
    if (onPointClick) onPointClick(idx);
  }

  return (
    <div style={{height: 320}}>
      <Line ref={chartRef} data={cfg} options={options} onClick={handleClick} />
    </div>
  )
}
);

export default function LineChart({ data }) {
  const sems = (data.semesters || []).map((s) => s.semester || "");
  const sgpas = (data.semesters || []).map((s) => parseFloat(s.sgpa) || 0);
  const cgpas = (data.semesters || []).map((s) => parseFloat(s.cgpa) || null);
  const cfg = {
    labels: sems,
    datasets: [
      {
        label: "SGPA",
        data: sgpas,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37,99,235,0.08)",
        tension: 0.3,
      },
      {
        label: "CGPA",
        data: cgpas,
        borderColor: "#06b6d4",
        backgroundColor: "rgba(6,182,212,0.08)",
        tension: 0.3,
      },
    ],
  };
  return <Line data={cfg} />;
}
