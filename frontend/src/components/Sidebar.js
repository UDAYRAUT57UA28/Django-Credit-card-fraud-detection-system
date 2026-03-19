import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const links = [
  { to: "/dashboard", icon: "bi-speedometer2", label: "Dashboard" },
  { to: "/transactions", icon: "bi-list-ul", label: "Transactions" },
  { to: "/detect", icon: "bi-search", label: "Detect Fraud" },
  { to: "/cards", icon: "bi-credit-card", label: "Cards" },
  { to: "/alerts", icon: "bi-bell", label: "Alerts" },
  { to: "/model-lab", icon: "bi-cpu", label: "Model Lab" },
  { to: "/blacklist", icon: "bi-shield-x", label: "Blacklist" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();

  return (
    <div
      className="d-flex flex-column p-3"
      style={{
        width: 240,
        minHeight: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        background: dark ? "#0f172a" : "#1e293b",
        transition: "background 0.3s",
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div className="text-center mb-4 mt-2">
        <i className="bi bi-shield-lock-fill text-danger fs-2"></i>
        <div className="fw-bold mt-1 text-white">FraudDetect</div>
        <small className="text-white-50">{user?.username}</small>
      </div>

      {/* Nav links */}
      <nav className="flex-grow-1">
        {links.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `d-flex align-items-center gap-2 px-3 py-2 rounded mb-1 text-decoration-none ${
                isActive ? "bg-danger text-white" : "text-white-50"
              }`
            }
          >
            <i className={`bi ${icon}`}></i>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Dark / Light toggle */}
      <button
        className="btn btn-sm mb-2 w-100"
        style={{
          background: dark ? "#334155" : "#475569",
          color: "#fff",
          border: "none",
        }}
        onClick={toggle}
        title="Toggle dark/light mode"
      >
        <i className={`bi ${dark ? "bi-sun-fill" : "bi-moon-fill"} me-2`}></i>
        {dark ? "Light Mode" : "Dark Mode"}
      </button>

      {/* Logout */}
      <button className="btn btn-outline-danger btn-sm" onClick={logout}>
        <i className="bi bi-box-arrow-left me-2"></i>Logout
      </button>
    </div>
  );
}
