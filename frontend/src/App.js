import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import PrivateLayout from "./components/PrivateLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import DetectFraud from "./pages/DetectFraud";
import Cards from "./pages/Cards";
import Alerts from "./pages/Alerts";
import ModelComparison from "./pages/ModelComparison";
import Blacklist from "./pages/Blacklist";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <PrivateLayout>
                  <Dashboard />
                </PrivateLayout>
              }
            />
            <Route
              path="/transactions"
              element={
                <PrivateLayout>
                  <Transactions />
                </PrivateLayout>
              }
            />
            <Route
              path="/detect"
              element={
                <PrivateLayout>
                  <DetectFraud />
                </PrivateLayout>
              }
            />
            <Route
              path="/cards"
              element={
                <PrivateLayout>
                  <Cards />
                </PrivateLayout>
              }
            />
            <Route
              path="/alerts"
              element={
                <PrivateLayout>
                  <Alerts />
                </PrivateLayout>
              }
            />
            <Route
              path="/model-lab"
              element={
                <PrivateLayout>
                  <ModelComparison />
                </PrivateLayout>
              }
            />
            <Route
              path="/blacklist"
              element={
                <PrivateLayout>
                  <Blacklist />
                </PrivateLayout>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
