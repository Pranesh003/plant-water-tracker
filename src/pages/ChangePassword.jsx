import { ArrowLeft, CheckCircle2, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlantCare } from "../App.jsx";
import { api } from "../services/api.js";

export default function ChangePassword() {
  const { notify } = usePlantCare();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword) return setError("Current password is required.");
    if (!newPassword) return setError("New password is required.");
    if (newPassword.length < 6) return setError("New password must be at least 6 characters long.");
    if (newPassword !== confirmPassword) return setError("New passwords do not match.");

    setLoading(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setSuccess("Your password has been updated successfully!");
      notify("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      window.setTimeout(() => navigate("/settings"), 1500);
    } catch (err) {
      setError(err.message || "Failed to update password. Please check your current password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-container" style={{ maxWidth: 580, margin: "0 auto", paddingTop: 20 }}>
      <button className="ghost-btn" style={{ marginBottom: 18, width: "fit-content" }} onClick={() => navigate("/settings")}>
        <ArrowLeft size={16} /> Back to Settings
      </button>

      <div className="panel settings-section" style={{ padding: 32, borderRadius: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div className="metric-icon-circle green" style={{ width: 44, height: 44 }}>
            <KeyRound size={22} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", color: "var(--dark)" }}>Change Password</h1>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>Keep your account secure with a strong password.</p>
          </div>
        </div>

        {error && <p className="error" role="alert" style={{ marginBottom: 16 }}>{error}</p>}
        {success && (
          <div className="success-banner" style={{ background: "#eef7ed", color: "#1f4d2e", padding: "12px 16px", borderRadius: 14, fontWeight: 750, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={18} /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="field-grid" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <label htmlFor="curr-pass" style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 750, color: "var(--dark)" }}>
            Current Password
            <input
              id="curr-pass"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
            />
          </label>

          <label htmlFor="new-pass" style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 750, color: "var(--dark)" }}>
            New Password
            <input
              id="new-pass"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min. 6 chars)"
              required
            />
          </label>

          <label htmlFor="conf-pass" style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 750, color: "var(--dark)" }}>
            Confirm New Password
            <input
              id="conf-pass"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
            />
          </label>

          <div className="security-tips-box" style={{ background: "#f8faf7", border: "1px solid #e1ebe0", borderRadius: 16, padding: 16, marginTop: 4 }}>
            <strong style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.86rem", color: "#1b4332", marginBottom: 6 }}>
              <ShieldCheck size={16} /> Password Requirements
            </strong>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: "0.82rem", color: "var(--muted)", display: "grid", gap: 4 }}>
              <li>At least 6 characters long</li>
              <li>Combine letters, numbers, and special characters</li>
            </ul>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
            <button type="button" className="ghost-btn" style={{ flex: 1 }} onClick={() => navigate("/settings")}>
              Cancel
            </button>
            <button type="submit" className="primary-btn" style={{ flex: 1 }} disabled={loading}>
              <Lock size={16} /> {loading ? "Updating..." : "Save New Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
