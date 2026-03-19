import React from "react";

/**
 * getRisk — returns label, Bootstrap color, and emoji based on probability (0–1)
 * 0.00–0.30 → Safe (green)
 * 0.30–0.70 → Medium (yellow)
 * 0.70–1.00 → High Risk (red)
 */
export function getRisk(probability) {
  const score = Math.round(probability * 100);
  if (score <= 30) return { score, label: "Safe", color: "success", emoji: "🟢", textColor: "#198754" };
  if (score <= 70) return { score, label: "Medium Risk", color: "warning", emoji: "🟡", textColor: "#ffc107" };
  return { score, label: "High Risk", color: "danger", emoji: "🔴", textColor: "#dc3545" };
}

/**
 * RiskBadge — compact inline badge for tables
 */
export function RiskBadge({ probability }) {
  const { score, label, color, emoji } = getRisk(probability);
  return (
    <span className={`badge bg-${color} bg-opacity-15 text-${color} border border-${color} border-opacity-25`}
      style={{ fontSize: "0.75rem" }}>
      {emoji} {score}% — {label}
    </span>
  );
}

/**
 * RiskMeter — full visual gauge for the DetectFraud result panel
 */
export default function RiskMeter({ probability }) {
  const { score, label, color, emoji, textColor } = getRisk(probability);

  return (
    <div className="text-center">
      {/* Circular score display */}
      <div
        className="mx-auto d-flex align-items-center justify-content-center rounded-circle border border-4 mb-3"
        style={{
          width: 110,
          height: 110,
          borderColor: textColor,
          boxShadow: `0 0 20px ${textColor}40`,
        }}
      >
        <div>
          <div className="fw-bold" style={{ fontSize: "1.8rem", color: textColor, lineHeight: 1 }}>
            {score}%
          </div>
          <div style={{ fontSize: "0.65rem", color: textColor, letterSpacing: 1 }}>RISK SCORE</div>
        </div>
      </div>

      {/* Label */}
      <div className="fw-bold fs-5 mb-2" style={{ color: textColor }}>
        {emoji} {label}
      </div>

      {/* Progress bar */}
      <div className="progress mb-2" style={{ height: 10, borderRadius: 8 }}>
        <div
          className={`progress-bar bg-${color}`}
          style={{ width: `${score}%`, borderRadius: 8, transition: "width 0.8s ease" }}
        />
      </div>

      {/* Scale legend */}
      <div className="d-flex justify-content-between" style={{ fontSize: "0.7rem" }}>
        <span className="text-success">🟢 0–30 Safe</span>
        <span className="text-warning">🟡 30–70 Medium</span>
        <span className="text-danger">🔴 70–100 High</span>
      </div>
    </div>
  );
}
