import React, { useState, useEffect } from "react";
import Login from "./views/Login";
import PrincipalDashboard from "./views/PrincipalDashboard";
import TeacherDashboard from "./views/TeacherDashboard";
import { api } from "./utils/api";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Toast notifier helper
  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Verify auth session on boot
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem("sms_token");
      const storedUser = localStorage.getItem("sms_user");

      if (token && storedUser) {
        try {
          // Validate token with back-end
          const data = await api.get("/auth/me");
          setUser(data.user);
          localStorage.setItem("sms_user", JSON.stringify(data.user));
        } catch (e) {
          // Token expired or invalid
          console.error("Session verification failed:", e);
          localStorage.removeItem("sms_token");
          localStorage.removeItem("sms_user");
          showToast("Session expired. Please log in again.", "error");
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          flexDirection: "column",
          gap: "16px",
          background: "radial-gradient(circle at 50% 50%, #151821 0%, #0b0c10 100%)",
        }}
      >
        <div
          style={{
            width: "50px",
            height: "50px",
            border: "3px dashed var(--accent, #06b6d4)",
            borderRadius: "50%",
            animation: "spin 1.5s linear infinite",
          }}
        />
        <div style={{ color: "var(--text-secondary, #94a3b8)", fontSize: "14px", fontWeight: "600" }}>
          Configuring school registry...
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      {/* View routing based on User Role */}
      {!user ? (
        <Login onLoginSuccess={handleLoginSuccess} showToast={showToast} />
      ) : user.role === "PRINCIPAL" ? (
        <PrincipalDashboard showToast={showToast} />
      ) : (
        <TeacherDashboard user={user} showToast={showToast} />
      )}

      {/* Floating Notification Toasts */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type === "error" ? "toast-error" : toast.type === "success" ? "toast-success" : ""}`}>
            <span>{toast.type === "error" ? "❌" : toast.type === "success" ? "✅" : "ℹ️"}</span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export default App;
