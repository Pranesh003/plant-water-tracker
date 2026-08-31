import { ArrowLeft, CheckCircle2, KeyRound, Mail, Sprout } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PasswordStrength from "../components/PasswordStrength.jsx";
import { api } from "../services/api.js";
import { evaluatePasswordStrength } from "../utils/passwordUtils.js";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("request"); // "request" | "reset" | "complete"
  const [email, setEmail] = useState("");
  const [userTokenInput, setUserTokenInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      return setError("Please enter a valid registered email address.");
    }
    setLoading(true);
    try {
      await api.forgotPassword({ email });
      setStep("reset");
    } catch (err) {
      setError(err.message || "Failed to process request. Please verify your email.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (!userTokenInput.trim()) {
      return setError("Please enter the verification code.");
    }
    if (!newPassword) {
      return setError("New password is required.");
    }
    const strength = evaluatePasswordStrength(newPassword, email);
    if (strength.label === "WEAK") {
      return setError(strength.similar ? "Avoid using your username or email as your password." : "Please choose a stronger password.");
    }
    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    try {
      await api.resetPassword({ email, token: userTokenInput.trim(), newPassword });
      setStep("complete");
    } catch (err) {
      setError(err.message || "Failed to reset password. Please verify your code and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Sprout size={34} />
          <h1>Plant Care Tracker</h1>
        </div>

        {step === "request" && (
          <form onSubmit={handleRequestReset}>
            <h2>Forgot Password?</h2>
            <p style={{ marginBottom: 16, color: "var(--muted-color, #666)" }}>
              Enter your registered email address and we'll send a 6-digit verification code to your email.
            </p>
            {error && <p className="error" role="alert">{error}</p>}
            <label>
              Email Address
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <button className="primary-btn full" type="submit" disabled={loading} style={{ marginTop: 16 }}>
              {loading ? "Sending Code..." : "Send Verification Code"}
            </button>
            <div style={{ marginTop: 18, textAlign: "center" }}>
              <Link to="/signin" className="link-btn" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <ArrowLeft size={16} /> Back to Sign In
              </Link>
            </div>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleResetPassword}>
            <h2>Reset Your Password</h2>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, marginBottom: 16, fontSize: "0.9rem" }}>
              <Mail size={20} color="#16a34a" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <strong>Check your email inbox</strong>
                <p style={{ margin: "4px 0 0", color: "#15803d", fontSize: "0.85rem" }}>
                  A 6-digit verification code has been sent to <strong>{email}</strong>. Please enter the code below.
                </p>
              </div>
            </div>
            {error && <p className="error" role="alert">{error}</p>}
            <label>
              Verification Code
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={userTokenInput}
                onChange={(e) => setUserTokenInput(e.target.value)}
                required
              />
            </label>
            <label style={{ marginTop: 12 }}>
              New Password
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </label>
            {newPassword && <PasswordStrength password={newPassword} identity={email} showChecklist={false} />}
            <label style={{ marginTop: 12 }}>
              Confirm New Password
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </label>
            <button className="primary-btn full" type="submit" disabled={loading} style={{ marginTop: 20 }}>
              <KeyRound size={16} /> {loading ? "Resetting Password..." : "Reset Password"}
            </button>
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <button type="button" className="ghost-btn" onClick={() => setStep("request")}>
                <ArrowLeft size={16} /> Change Email / Resend Code
              </button>
            </div>
          </form>
        )}

        {step === "complete" && (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <CheckCircle2 size={48} color="#22c55e" style={{ margin: "0 auto 12px" }} />
            <h2>Password Reset Complete!</h2>
            <p style={{ margin: "12px 0 20px", color: "var(--muted-color, #666)" }}>
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
            <button className="primary-btn full" type="button" onClick={() => navigate("/signin")}>
              Sign In Now
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
