import React, { useEffect, useState } from "react";
import { Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, ArcElement,
  PointElement, LineElement, Title, Tooltip, Legend,
} from "chart.js";
import { getFraudStats, getDailyTrend, getTransactions } from "../services/api";
import StatCard from "../components/StatCard";
import { RiskBadge } from "../components/RiskScore";
import { useTheme } from "../context/ThemeContext";

ChartJS.register(CategoryScale, LinearScale, ArcElement, PointElement, LineElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [recent, setRecent] = useState([]);
  const { dark } = useTheme();

  useEffect(() => {
    getFraudStats().then((r) => setStats(r.data)).catch(() => {});
    getDailyTrend().then((r) => setTrend(r.data)).catch(() => {});
    getTransactions({ page: 1 }).then((r) => setRecent(r.data.results || r.data)).catch(() => {});
  }, []);

  const cardStyle = { background: dark ? "#1e293b" : "#fff", border: "none", borderRadius: 12 };
  const chartTextColor = dark ? "#94a3b8" : "#666";

  const doughnutData = {
    labels: ["Legitimate", "Fraud"],
    datasets: [{ data: [stats?.legitimate_transactions || 0, stats?.fraud_transactions || 0], backgroundColor: ["#198754", "#dc3545"], borderWidth: 0 }],
  };

  const lineData = {
    labels: trend.map((d) => d.date),
    datasets: [
      { label: "Fraud", data: trend.map((d) => d.fraud), borderColor: "#dc3545", backgroundColor: "rgba(220,53,69,0.15)", fill: true, tension: 0.4 },
      { label: "Legitimate", data: trend.map((d) => d.legitimate), borderColor: "#198754", backgroundColor: "rgba(25,135,84,0.15)", fill: true, tension: 0.4 },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { labels: { color: chartTextColor } } },
    scales: {
      x: { ticks: { color: chartTextColor }, grid: { color: dark ? "#334155" : "#e5e7eb" } },
      y: { ticks: { color: chartTextColor }, grid: { color: dark ? "#334155" : "#e5e7eb" } },
    },
  };

  return (
    <div>
      <h4 className="fw-bold mb-4">Dashboard Overview</h4>
      <div className="row g-3 mb-4">
        <div className="col-md-3"><StatCard title="Total Transactions" value={stats?.total_transactions ?? "—"} icon="bi-arrow-left-right" color="primary" /></div>
        <div className="col-md-3"><StatCard title="Fraud Detected" value={stats?.fraud_transactions ?? "—"} icon="bi-exclamation-triangle-fill" color="danger" /></div>
        <div className="col-md-3"><StatCard title="Fraud Rate" value={stats ? `${stats.fraud_rate}%` : "—"} icon="bi-percent" color="warning" /></div>
        <div className="col-md-3"><StatCard title="Open Alerts" value={stats?.open_alerts ?? "—"} icon="bi-bell-fill" color="info" /></div>
      </div>
      <div className="row g-3 mb-4">
        <div className="col-md-8">
          <div className="card shadow-sm p-3" style={cardStyle}>
            <h6 className="fw-semibold mb-3">Daily Transaction Trend</h6>
            <Line data={lineData} options={chartOptions} />
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm p-3 h-100" style={cardStyle}>
            <h6 className="fw-semibold mb-3">Fraud vs Legitimate</h6>
            <Doughnut data={doughnutData} options={{ responsive: true, plugins: { legend: { position: "bottom", labels: { color: chartTextColor } } } }} />
          </div>
        </div>
      </div>
      <div className="card shadow-sm" style={cardStyle}>
        <div className="card-header fw-semibold border-0" style={{ background: "transparent" }}>Recent Transactions</div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr><th>#</th><th>Amount</th><th>Merchant</th><th>Location</th><th>Prediction</th><th>Risk Score</th><th>Time</th></tr>
            </thead>
            <tbody>
              {(Array.isArray(recent) ? recent : []).slice(0, 10).map((t) => (
                <tr key={t.id}>
                  <td className="text-muted small">{t.id}</td>
                  <td className="fw-semibold">${t.amount?.toFixed(2)}</td>
                  <td>{t.merchant}</td>
                  <td>{t.location}</td>
                  <td><span className={`badge bg-${t.prediction === "Fraud" ? "danger" : "success"}`}>{t.prediction}</span></td>
                  <td><RiskBadge probability={t.fraud_probability} /></td>
                  <td className="small text-muted">{new Date(t.timestamp).toLocaleString()}</td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr><td colSpan={7} className="text-center text-muted py-4">No transactions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}