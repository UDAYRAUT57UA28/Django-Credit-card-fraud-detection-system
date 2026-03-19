import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Sidebar from "./Sidebar";

export default function PrivateLayout({ children }) {
  const { user, loading } = useAuth();
  const { dark } = useTheme();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <span className="spinner-border text-danger"></span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="d-flex">
      <Sidebar />
      <main
        className="flex-grow-1 p-4"
        style={{
          marginLeft: 240,
          minHeight: "100vh",
          background: dark ? "#111827" : "#f8f9fa",
          color: dark ? "#f1f5f9" : "inherit",
          transition: "background 0.3s, color 0.3s",
        }}
      >
        {children}
      </main>
    </div>
  );
}
