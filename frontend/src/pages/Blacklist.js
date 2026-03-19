import React, { useEffect, useState } from "react";
import { getBlacklist, addToBlacklist, removeFromBlacklist } from "../services/api";
import { useTheme } from "../context/ThemeContext";

export default function Blacklist() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ merchant_name: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { dark } = useTheme();

  const card = { background: dark ? "#1e293b" : "#fff", border: "none", borderRadius: 12 };

  const fetchList = async () => {
    try {
      const { data } = await getBlacklist();
      setList(Array.isArray(data) ? data : data.results || []);
    } catch {
      setError("Failed to load blacklist.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.merchant_name.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await addToBlacklist(form);
      setForm({ merchant_name: "", reason: "" });
      fetchList();
    } catch (err) {
      const msg = err.response?.data?.merchant_name?.[0] || "Failed to add merchant.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      await removeFromBlacklist(id);
      setList((prev) => prev.filter((m) => m.id !== id));
    } catch {
      setError("Failed to remove merchant.");
    }
  };

  return (
    <div>
      <h4 className="fw-bold mb-1">Merchant Blacklist</h4>
      <p className="text-muted small mb-4">
        Blacklisted merchants automatically receive 100% fraud risk, regardless of ML result.
      </p>

      {error && <div className="alert alert-danger alert-dismissible">
        {error}
        <button type="button" className="btn-close" onClick={() => setError("")} />
      </div>}

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card shadow-sm p-4" style={card}>
            <h6 className="fw-semibold mb-3">
              <i className="bi bi-plus-circle me-2 text-danger" />
              Add Merchant to Blacklist
            </h6>
            <form onSubmit={handleAdd}>
              <div className="mb-3">
                <label className="form-label">Merchant Name *</label>
                <input
                  className="form-control"
                  placeholder="e.g. Shady Store"
                  value={form.merchant_name}
                  onChange={(e) => setForm({ ...form, merchant_name: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Reason</label>
                <input
                  className="form-control"
                  placeholder="e.g. Known fraud merchant"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                />
              </div>
              <button className="btn btn-danger w-100" disabled={submitting}>
                {submitting
                  ? <><span className="spinner-border spinner-border-sm me-2" />Adding...</>
                  : <><i className="bi bi-shield-x me-2" />Blacklist Merchant</>}
              </button>
            </form>
          </div>

          <div className="card shadow-sm p-3 mt-3" style={{ ...card, borderLeft: "4px solid #dc3545" }}>
            <div className="d-flex align-items-start gap-2">
              <i className="bi bi-info-circle text-danger mt-1" />
              <span className="small text-muted">
                Any transaction from a blacklisted merchant will be flagged as 100% fraud and trigger an alert automatically.
              </span>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card shadow-sm" style={card}>
            <div className="card-header fw-semibold border-0 d-flex justify-content-between align-items-center"
              style={{ background: "transparent" }}>
              <span><i className="bi bi-shield-exclamation me-2 text-danger" />Blacklisted Merchants</span>
              <span className="badge bg-danger">{list.length}</span>
            </div>
            {loading ? (
              <div className="text-center py-4">
                <span className="spinner-border spinner-border-sm text-danger" />
              </div>
            ) : list.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-shield-check fs-2 mb-2 d-block text-success" />
                No merchants blacklisted yet.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Merchant</th>
                      <th>Reason</th>
                      <th>Added By</th>
                      <th>Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((m) => (
                      <tr key={m.id}>
                        <td className="fw-semibold">{m.merchant_name}</td>
                        <td className="text-muted small">{m.reason || "—"}</td>
                        <td className="small">{m.added_by_username || "admin"}</td>
                        <td className="small text-muted">{new Date(m.created_at).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleRemove(m.id)}
                            title="Remove from blacklist"
                          >
                            <i className="bi bi-trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
