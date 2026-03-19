import React, { useState } from "react";
import { detectFraud } from "../services/api";
import RiskMeter, { getRisk } from "../components/RiskScore";
import ShapExplanation from "../components/ShapExplanation";
import { useTheme } from "../context/ThemeContext";

const emptyForm = {
  amount: "", merchant: "", location: "",
  V1: "", V2: "", V3: "", V4: "", V5: "", V6: "", V7: "",
  V8: "", V9: "", V10: "", V11: "", V12: "", V13: "", V14: "",
};

const PRESETS = [
  {
    label: "Normal Purchase",
    amount: 45.99, merchant: "Grocery Store", location: "New York",
    V1: -0.31, V2: 0.47, V3: 1.18, V4: 0.24, V14: 0.17,
  },
  {
    label: "Medium Risk",
    amount: 239.93, merchant: "Electronics Shop", location: "Chicago",
    V1: -2.30, V2: 1.76, V3: -0.36, V4: 2.33, V12: -6.56, V14: -1.47,
  },
  {
    label: "High Risk / Fraud",
    amount: 1.00, merchant: "Unknown Vendor", location: "Unknown",
    V1: 0.03, V2: 4.13, V3: -6.56, V4: 6.35, V5: 1.33,
    V6: -2.51, V7: -1.69, V8: 0.30, V9: -3.14, V10: -6.05,
    V11: 6.75, V12: -8.95, V13: 0.70, V14: -10.73,
  },
];

export default function DetectFraud() {
  const [form, setForm] = useState(emptyForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { dark } = useTheme();

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const applyPreset = (preset) => {
    setForm({ ...emptyForm, ...Object.fromEntries(Object.entries(preset).map(([k, v]) => [k, String(v)])) });
    setResult(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const payload = {};
      Object.entries(form).forEach(([k, v]) => {
        if (v === "" || v === null) payload[k] = 0;
        else { const num = parseFloat(v); payload[k] = isNaN(num) ? v : num; }
      });
      const { data } = await detectFraud(payload);
      setResult(data);
    } catch (err) {
      const errData = err.response?.data;
      if (errData && typeof errData === "object") {
        const messages = Object.entries(errData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" | ");
        setError(messages);
      } else {
        setError(`Server error (${err.response?.status || "network"}). Make sure Django backend is running on port 8000.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const risk = result ? getRisk(result.fraud_probability) : null;
  const card = { background: dark ? "#1e293b" : "#fff", border: "none", borderRadius: 12 };
  const flags = result?.rule_flags || {};

  return (
    <div>
      <h4 className="fw-bold mb-1">Fraud Detection</h4>
      <p className="text-muted small mb-4">Enter transaction details manually or pick a preset to test the system.</p>

      <div className="row g-4">
        {/* Left — Form */}
        <div className="col-lg-7">
          <div className="mb-3 d-flex gap-2 flex-wrap">
            <span className="text-muted small align-self-center me-1">Quick test:</span>
            {PRESETS.map((p) => (
              <button key={p.label} type="button" className="btn btn-sm btn-outline-secondary" onClick={() => applyPreset(p)}>
                {p.label}
              </button>
            ))}
          </div>

          <div className="card shadow-sm p-4" style={card}>
            <h6 className="fw-semibold mb-3">Transaction Details</h6>
            <form onSubmit={handleSubmit}>
              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <label className="form-label">Amount ($) *</label>
                  <input type="number" step="0.01" min="0.01" className="form-control"
                    value={form.amount} onChange={update("amount")} placeholder="e.g. 250.00" required />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Merchant</label>
                  <input className="form-control" value={form.merchant} onChange={update("merchant")} placeholder="e.g. Amazon" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Location</label>
                  <input className="form-control" value={form.location} onChange={update("location")} placeholder="e.g. New York" />
                </div>
              </div>

              <button type="button" className="btn btn-sm btn-link text-muted p-0 mb-2"
                onClick={() => setShowAdvanced(!showAdvanced)}>
                <i className={`bi bi-chevron-${showAdvanced ? "up" : "down"} me-1`} />
                {showAdvanced ? "Hide" : "Show"} Advanced PCA Features (V1–V14)
              </button>

              {showAdvanced && (
                <div className="row g-2 mb-3">
                  <p className="text-muted small mb-1">PCA anonymized features. Leave blank to default to 0.</p>
                  {["V1","V2","V3","V4","V5","V6","V7","V8","V9","V10","V11","V12","V13","V14"].map((v) => (
                    <div className="col-3" key={v}>
                      <input type="number" step="any" className="form-control form-control-sm"
                        placeholder={v} value={form[v]} onChange={update(v)} />
                    </div>
                  ))}
                </div>
              )}

              <button className="btn btn-danger w-100 mt-2" disabled={loading}>
                {loading
                  ? <><span className="spinner-border spinner-border-sm me-2" />Analyzing...</>
                  : <><i className="bi bi-shield-check me-2" />Analyze Transaction</>}
              </button>
            </form>
          </div>

          <div className="card shadow-sm p-3 mt-3" style={{ ...card, borderLeft: "4px solid #6366f1" }}>
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-info-circle text-primary" />
              <span className="small">
                Every analyzed transaction is automatically saved. View all in the{" "}
                <a href="/transactions">Transactions</a> page.
              </span>
            </div>
          </div>
        </div>

        {/* Right — Result */}
        <div className="col-lg-5">
          {error && (
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-triangle-fill me-2" />
              <strong>Error:</strong> {error}
            </div>
          )}

          {result && risk && (
            <div className="card shadow-sm p-4" style={{ ...card, borderLeft: `5px solid ${risk.textColor}` }}>
              <RiskMeter probability={result.fraud_probability} />
              <hr className="my-3" />

              {/* Rule flags */}
              {flags.blacklisted && (
                <div className="alert alert-danger py-2 small mb-2">
                  <i className="bi bi-shield-x-fill me-1" />
                  <strong>Blacklisted Merchant:</strong> {flags.blacklist_reason || "This merchant is on the blacklist."}
                </div>
              )}
              {flags.velocity_triggered && (
                <div className="alert alert-warning py-2 small mb-2">
                  <i className="bi bi-lightning-fill me-1" />
                  <strong>Velocity Alert:</strong> {flags.velocity_count} transactions detected in the last 10 minutes on this card.
                </div>
              )}

              <table className="table table-sm mb-3">
                <tbody>
                  <tr>
                    <td className="text-muted">Transaction ID</td>
                    <td className="fw-semibold">#{result.transaction_id}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Amount</td>
                    <td className="fw-semibold">${parseFloat(result.amount).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Prediction</td>
                    <td>
                      <span className={`badge bg-${result.prediction === "Fraud" ? "danger" : "success"}`}>
                        {result.prediction}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted">Risk Level</td>
                    <td className="fw-bold" style={{ color: risk.textColor }}>
                      {risk.emoji} {risk.label}
                    </td>
                  </tr>
                </tbody>
              </table>

              {risk.score > 70 && (
                <div className="alert alert-danger py-2 small mb-0">
                  <i className="bi bi-bell-fill me-1" />High risk flagged. Fraud alert created automatically.
                </div>
              )}
              {risk.score > 30 && risk.score <= 70 && (
                <div className="alert alert-warning py-2 small mb-0">
                  <i className="bi bi-exclamation-triangle me-1" />Medium risk. Monitor this transaction closely.
                </div>
              )}
              {risk.score <= 30 && (
                <div className="alert alert-success py-2 small mb-0">
                  <i className="bi bi-check-circle me-1" />Transaction appears safe.
                </div>
              )}

              {/* SHAP Explanation */}
              {result.shap_explanation && Object.keys(result.shap_explanation).length > 0 && (
                <ShapExplanation shapValues={result.shap_explanation} />
              )}
            </div>
          )}

          {!result && !error && (
            <div className="card shadow-sm p-4 text-center" style={card}>
              <i className="bi bi-shield-check fs-1 text-secondary mb-2" />
              <p className="fw-semibold mb-1">Risk Analysis</p>
              <p className="small text-muted mb-3">
                Fill in the transaction details and click Analyze, or pick a preset above to test.
              </p>
              <div className="d-flex justify-content-center gap-3 small">
                <span className="text-success">🟢 0–30% Safe</span>
                <span className="text-warning">🟡 30–70% Medium</span>
                <span className="text-danger">🔴 70–100% High</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
