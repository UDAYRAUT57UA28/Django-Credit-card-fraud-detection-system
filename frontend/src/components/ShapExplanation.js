import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useTheme } from "../context/ThemeContext";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * ShapExplanation — horizontal bar chart showing which features drove the fraud decision.
 * Green bars = pushed toward legitimate, Red bars = pushed toward fraud.
 */
export default function ShapExplanation({ shapValues }) {
  const { dark } = useTheme();

  if (!shapValues || Object.keys(shapValues).length === 0) return null;

  // Take top 10 features by absolute impact
  const entries = Object.entries(shapValues).slice(0, 10);
  const labels = entries.map(([k]) => k);
  const values = entries.map(([, v]) => v);
  const colors = values.map((v) =>
    v > 0 ? "rgba(220, 53, 69, 0.8)" : "rgba(25, 135, 84, 0.8)"
  );

  const data = {
    labels,
    datasets: [
      {
        label: "SHAP Value (impact on fraud score)",
        data: values,
        backgroundColor: colors,
        borderRadius: 4,
      },
    ],
  };

  const textColor = dark ? "#94a3b8" : "#555";

  const options = {
    indexAxis: "y",
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = ctx.raw;
            return `${v > 0 ? "↑ Fraud" : "↓ Legit"}: ${v.toFixed(4)}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: textColor },
        grid: { color: dark ? "#334155" : "#e5e7eb" },
        title: { display: true, text: "SHAP Value", color: textColor },
      },
      y: { ticks: { color: textColor }, grid: { display: false } },
    },
  };

  return (
    <div className="mt-3">
      <h6 className="fw-semibold mb-1">
        <i className="bi bi-bar-chart-fill me-2 text-primary"></i>
        Why this decision? (SHAP Explanation)
      </h6>
      <p className="text-muted small mb-2">
        <span className="text-danger fw-semibold">Red bars</span> pushed toward fraud,{" "}
        <span className="text-success fw-semibold">green bars</span> pushed toward legitimate.
      </p>
      <Bar data={data} options={options} height={220} />
    </div>
  );
}
