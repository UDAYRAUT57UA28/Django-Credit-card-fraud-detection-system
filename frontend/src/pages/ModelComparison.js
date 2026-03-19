import React, { useState } from "react";
import { compareModels } from "../services/api";
import { useTheme } from "../context/ThemeContext";

const emptyForm = {
  amount: "", V1: "", V2: "", V3: "", V4: "", V5: "",
  V6: "", V7: "", V8: "", V9: "", V10: "", V11: "",
  V12: "", V13: "", V14: "",
};

const PRESETS = [
  {
    label: "Normal",
    amount: 45.99, V1: -0.31, V2: 0.47, V3: 1.18, V4: 0.24, V14: 0.17,
  },
  {
    label: "Fraud",
    amount: 1.00, V1: 0.03, V2: 4.13, V3: -6.56, V4: 6.35, V5: 1.33,
    V6: -2.51, V7: -1.69, V8: 0.30, V9: -3.14, V10: -6.05,
    V11: 6.75, V12: -8.95, V13: 0.70, V14: -10.73,
  },
];

function ProbBar({ value, available }) {
  if (!available || value === null || value === undefined) {
    return <span className="text-muted small">Not trained</span>;
  }
  const pct = Math.round(value * 100);
  const color = pct >= 70 ? "danger" : pct >= 30 ? "warning" : "success";
  return (
    <div>
      <div className="d-flex justify-content-between small mb-1">
        <span>{pct}%</span>
      </div>
      <div className="progress" style={{ height: 8 }}>
        <div
          className={`progress-bar bg-${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ModelComparison() {
  const [form, setForm] = useState(emptyForm);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { dark } = useTheme();

  const card = { background: dark ? "#1e293b" : "#fff", border: "none", borderRadius: 12 };

  const applyPreset = (preset) => {
    setForm({ ...emptyForm, ...Object.fromEntries(Object.entries(preset).map(([k, v]) => [k, String(v)])) });
    setResults(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResults(null);
    try {
      const payload = {};
      Object.entries(form).forEach(([k, v]) => {
        if (v === "") payload[k] = 0;
        else { const n = parseFloat(v); payload[k] = isNaN(n) ? v : n; }
      });
      const { data } = await compareModels(payload);
      setResults(data.models);
    } catch (err) {
      setError("Comparison failed. Make sure Django backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h4 className="fw-bold mb-1">Model Lab</h4>
      <p className="text-muted small mb-4">
        Run the same transaction through all models side-by-side and compare results.
      </p>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="mb-3 d-flex gap-2 flex-wrap align-items-center">
            <span className="text-muted small">Quick test:</span>
            {PRESETS.map((p) => (
              <button key={p.label} type="button" className="btn btn-sm btn-outline-secondary" onClick={() => applyPreset(p)}>
                {p.label}
              </button>
            ))}
          </div>

          <div className="card shadow-sm p-4" style={card}>
            <h6 className="fw-semibold mb-3">Transaction Input</h6>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Amount ($) *</label>
                <input
                  type="number" step="0.01" min="0.01" required
                  className="form-control"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="e.g. 250.00"
                />
              </div>
              <div className="row g-2 mb-3">
                {["V1","V2","V3","V4","V5","V6","V7","V8","V9","V10","V11","V12","V13","V14"].map((v) => (
                  <div className="col-3" key={v}>
                    <input
                      type="number" step="any"
                      className="form-control form-control-sm"
                      placeholder={v}
                      value={form[v]}
                      onChange={(e) => setForm({ ...form, [v]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
              <button className="btn btn-primary w-100" disabled={loading}>
                {loading
                  ? <><span className="spinner-border spinner-border-sm me-2" />Comparing...</>
                  : <><i className="bi bi-cpu me-2" />Compare All Models</>}
              </button>
            </form>
          </div>
        </div>

        <div className="col-lg-7">
          {error && <div className="alert alert-danger">{error}</div>}

          {results ? (
            <div className="card shadow-sm" style={card}>
              <div className="card-header fw-semibold border-0" style={{ background: "transparent" }}>
                <i className="bi bi-bar-chart-steps me-2 text-primary" />
                Comparison Results
              </div>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Model</th>
                      <th>Prediction</th>
                      <th style={{ minWidth: 160 }}>Fraud Probability</th>
                      <th>Latency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((m) => (
                      <tr key={m.name}>
                        <td className="fw-semibold">{m.name}</td>
                        <td>
                          {m.available ? (
                            <span className={`badge bg-${m.prediction === "Fraud" || m.prediction === "Anomaly" ? "danger" : "success"}`}>
                              {m.prediction}
                            </span>
                          ) : (
                            <span className="badge bg-secondary">N/A</span>
                          )}
                        </td>
                        <td><ProbBar value={m.probability} available={m.available} /></td>
                        <td className="text-muted small">{m.inference_ms} ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-3 border-top small text-muted">
                <i className="bi bi-info-circle me-1" />
                XGBoost and Isolation Forest require trained model files. Random Forest and Rule Engine are always available.
              </div>
            </div>
          ) : (
            !loading && (
              <div className="card shadow-sm p-4 text-center" style={card}>
                <i className="bi bi-cpu fs-1 text-secondary mb-2" />
                <p className="fw-semibold mb-1">Model Comparison</p>
                <p className="small text-muted">
                  Pick a preset or enter values, then click Compare to see all models side-by-side.
                </p>
                <div className="row g-2 mt-2 text-start">
                  {["Random Forest", "XGBoost", "Isolation Forest", "Rule Engine"].map((m) => (
                    <div className="col-6" key={m}>
                      <div className="p-2 rounded small" style={{ background: dark ? "#0f172a" : "#f8fafc" }}>
                        <i className="bi bi-check-circle-fill text-success me-1" />{m}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
