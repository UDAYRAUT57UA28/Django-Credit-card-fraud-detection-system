import React from "react";

export default function StatCard({ title, value, icon, color = "danger", subtitle }) {
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body d-flex align-items-center gap-3">
        <div className={`bg-${color} bg-opacity-10 rounded-3 p-3`}>
          <i className={`bi ${icon} text-${color} fs-4`}></i>
        </div>
        <div>
          <div className="text-muted small">{title}</div>
          <div className="fw-bold fs-4">{value}</div>
          {subtitle && <div className="text-muted small">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}
