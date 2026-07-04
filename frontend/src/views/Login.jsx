import React, { useState } from "react";
import { api } from "../utils/api";

export const Login = ({ onLoginSuccess, showToast }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Please enter both email and password.", "error");
      return;
    }

    setLoading(true);
    try {
      const data = await api.post("/auth/login", { email, password });
      localStorage.setItem("sms_token", data.token);
      localStorage.setItem("sms_user", JSON.stringify(data.user));
      showToast("Logged in successfully!", "success");
      onLoginSuccess(data.user);
    } catch (error) {
      showToast(error.message || "Failed to log in. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for review
  const handleQuickFill = (role) => {
    if (role === "PRINCIPAL") {
      setEmail("principal@school.com");
      setPassword("principal123");
    } else if (role === "TEACHER") {
      setEmail("teacher@school.com");
      setPassword("teacher123");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <div className="logo-container" style={{ justifyContent: "center", marginBottom: "20px" }}>
          <div className="logo-icon">S</div>
          <span className="logo-text" style={{ fontSize: "24px" }}>School Management System</span>
        </div>
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Login to access your administrative dashboard</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: "left" }}>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. principal@school.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group" style={{ textAlign: "left" }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: "100%", marginTop: "10px", padding: "14px" }}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div style={{ marginTop: "32px", borderTop: "1px solid var(--glass-border)", paddingTop: "20px" }}>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" }}>
            💡 Quick Demo Access for testing:
          </p>
          <div className="gap-sm" style={{ justifyContent: "center" }}>
            <button
              onClick={() => handleQuickFill("PRINCIPAL")}
              className="btn-secondary"
              style={{ padding: "8px 12px", fontSize: "11px" }}
              disabled={loading}
            >
              🔑 Principal
            </button>
            <button
              onClick={() => handleQuickFill("TEACHER")}
              className="btn-secondary"
              style={{ padding: "8px 12px", fontSize: "11px" }}
              disabled={loading}
            >
              🔑 Teacher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;
