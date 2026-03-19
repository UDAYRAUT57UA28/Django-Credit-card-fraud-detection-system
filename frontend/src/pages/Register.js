import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../services/api";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", first_name: "", last_name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register(form);
      navigate("/login");
    } catch (err) {
      setError(JSON.stringify(err.response?.data || "Registration failed."));
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark">
      <div className="card shadow-lg p-4" style={{ width: "100%", maxWidth: 460 }}>
        <div className="text-center mb-4">
          <i className="bi bi-shield-lock-fill text-danger fs-1"></i>
          <h3 className="mt-2 fw-bold">Create Account</h3>
        </div>
        {error && <div className="alert alert-danger py-2 small">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="row g-2 mb-2">
            <div className="col">
              <input className="form-control" placeholder="First Name" value={form.first_name} onChange={update("first_name")} />
            </div>
            <div className="col">
              <input className="form-control" placeholder="Last Name" value={form.last_name} onChange={update("last_name")} />
            </div>
          </div>
          <div className="mb-2">
            <input className="form-control" placeholder="Username" value={form.username} onChange={update("username")} required />
          </div>
          <div className="mb-2">
            <input type="email" className="form-control" placeholder="Email" value={form.email} onChange={update("email")} required />
          </div>
          <div className="mb-3">
            <input type="password" className="form-control" placeholder="Password (min 8 chars)" value={form.password} onChange={update("password")} required minLength={8} />
          </div>
          <button className="btn btn-danger w-100" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>
        <p className="text-center mt-3 small">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
