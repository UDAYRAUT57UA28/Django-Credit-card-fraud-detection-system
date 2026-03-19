import React, { useEffect, useState } from "react";
import { getTransactions } from "../services/api";
import { RiskBadge } from "../components/RiskScore";
import { useTheme } from "../context/ThemeContext";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const { dark } = useTheme();

  useEffect(() => {
    const params = filter ? { prediction: filter } : {};
    getTransactions(params)
      .then((r) => setTransactions(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  const cardStyle = { background: dark ? "#1e293b" : "#fff", border: "none", borderRadius: 12 };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Transactions</h4>
        <div className="btn-group">
          {["", "Fraud", "Legitimate"].map((f) => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? "btn-danger" : "btn-outline-secondary"}`}
              onClick={() => setFilter(f)}
            >
              {f || "All"}
            </button>
          ))}
        </div>
      </div>

      <div className="card shadow-sm" style={cardStyle}>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>#</th><th>Amount</th><th>Merchant</th><th>Location</th>
                <th>Prediction</th><th>Risk Score</th><th>Alert</th><th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="text-center py-4">
                  <span className="spinner-border spinner-border-sm"></span>
                </td></tr>
              )}
              {!loading && transactions.length === 0 && (
                <tr><td colSpan={8} className="text-center text-muted py-4">No transactions found</td></tr>
              )}
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td className="text-muted small">{t.id}</td>
                  <td className="fw-semibold">${t.amount?.toFixed(2)}</td>
                  <td>{t.merchant}</td>
                  <td>{t.location}</td>
                  <td>
                    <span className={`badge bg-${t.prediction === "Fraud" ? "danger" : t.prediction === "Legitimate" ? "success" : "secondary"}`}>
                      {t.prediction}
                    </span>
                  </td>
                  <td><RiskBadge probability={t.fraud_probability} /></td>
                  <td>
                    {t.alert_sent
                      ? <span className="badge bg-warning text-dark">Sent</span>
                      : <span className="badge bg-secondary bg-opacity-25 text-muted">No</span>}
                  </td>
                  <td className="small text-muted">{new Date(t.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
