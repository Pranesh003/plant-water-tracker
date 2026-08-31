import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Global UI Error Caught:", error, errorInfo);
  }

  handleReload = () => {
    if (window.caches) {
      window.caches.keys().then((names) => {
        names.forEach((name) => window.caches.delete(name));
      });
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f7fbf4", color: "#1f4d2e" }}>
          <div style={{ background: "#ffffff", padding: 36, borderRadius: 20, border: "1px solid #d5e3d5", boxShadow: "0 18px 45px rgba(31, 77, 46, 0.11)", textAlign: "center", maxWidth: 480 }}>
            <span style={{ fontSize: 42, display: "block", marginBottom: 12 }}>🌱</span>
            <h2 style={{ fontSize: "1.4rem", margin: "0 0 8px" }}>App Update Available</h2>
            <p style={{ color: "#657568", marginBottom: 20 }}>Click below to refresh and load the latest updates for Plant Care Tracker.</p>
            <button
              type="button"
              onClick={this.handleReload}
              style={{ background: "#2f6b3f", color: "#ffffff", border: "none", borderRadius: 12, padding: "12px 24px", fontWeight: 800, cursor: "pointer" }}
            >
              Refresh Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
