import React from "react";

export default function Card({ title, value }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow hover:shadow-lg transition">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
