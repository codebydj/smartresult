import React, { useState } from "react";
import axios from "axios";

export default function Landing({ onResult }) {
  const [reg, setReg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTestData = async () => {
    setLoading(true);
    try {
      const resp = await axios.get("/api/v1/test/result");
      if (resp.data && resp.data.data) {
        onResult(resp.data.data);
      }
    } catch (e) {
      console.error(e);
      setError("Test data failed. " + (e.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const fetchResult = async () => {
    if (!reg) return;
    setLoading(true);
    setError("");
    try {
      const resp = await axios.post("/api/v1/result", { pin: reg });
      if (resp.data && resp.data.data) {
        onResult(resp.data.data);
      } else {
        setError("No result data received. Please try again.");
      }
    } catch (e) {
      console.error(e);
      const errMsg =
        e.response?.data?.error || e.message || "Failed to fetch result";
      setError(`Error: ${errMsg}`);
      alert(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white/80 backdrop-blur rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold mb-4">
          SmartResult – Academic Performance Dashboard
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Enter your Registration Number to fetch and view an interactive
          academic dashboard.
        </p>
        <div className="flex gap-3">
          <input
            className="flex-1 p-3 rounded-lg border"
            placeholder="Enter Registration Number"
            value={reg}
            onChange={(e) => setReg(e.target.value)}
          />
          <button
            onClick={fetchResult}
            className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow"
            disabled={loading}>
            {loading ? "Fetching..." : "Submit"}
          </button>
        </div>
        {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
        <button
          onClick={fetchTestData}
          className="mt-4 w-full px-4 py-2 bg-slate-400 text-white rounded-lg text-sm hover:bg-slate-500"
          disabled={loading}>
          📋 Try Test Data
        </button>
        <p className="mt-4 text-xs text-slate-500">
          No data is stored on external systems unless you enable saving.
        </p>
      </div>
    </main>
  );
}
