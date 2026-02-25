import React, { useState } from "react";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [result, setResult] = useState(null);
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {!result ? (
        <Landing onResult={setResult} />
      ) : (
        <Dashboard data={result} onLogout={() => setResult(null)} />
      )}
    </div>
  );
}
