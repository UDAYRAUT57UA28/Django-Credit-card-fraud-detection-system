import React, { useEffect, useState } from "react";
import { getAlerts, resolveAlert } from "../services/api";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    getAlerts()
      .then((r) => setAlerts(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleResolve = async (id) => {
    await resolveAlert(id);
    load();
  };

  return (
    <div>
      <h4 className="fw-bold mb-4">Fraud Alerts</h4>
      {loading && <div className="text-center"><span className="spinner-border spinner-border-sm"></span></div>}
      {!loading && alerts.length === 0 && (
        <div className="card border-0 shadow-sm p-5 text-center text-muted">
          <i className="bi bi-check-circle-fill text-success fs-1 mb-2"></i>
          <p>No open fraud alerts. All clear.</p>
        </div>
      )}
      <div className="row g-3">
        {alerts.map((alert) => (
          <div className="col-12" key={alert.id}>
            <div className="card border-0 shadow-sm border-start border-4 border-danger">
              <div className="card-body d-flex justify-content-between align-items-start">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <i className="bi bi-exclamation-triangle-fill text-danger"></i>
                    <span className="fw-semibold">Alert #{alert.id}</span>
                    <span className="badge bg-danger">Open</span>
                  </div>
                  <p className="mb-1">{alert.message}</p>
                  <div className="small text-muted">
                    Transaction #{alert.transaction?.id} — ${alert.transaction?.amount?.toFixed(2)} —{" "}
                    {alert.transaction?.merchant} — {new Date(alert.created_at).toLocaleString()}
                  </div>
                </div>
                <button className="btn btn-sm btn-outline-success" onClick={() => handleResolve(alert.id)}>
                  <i className="bi bi-check-lg me-1"></i>Resolve
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
