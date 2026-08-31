import { Eye, EyeOff, Sprout } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePlantCare } from "../App.jsx";
import { api } from "../services/api.js";

export default function SignIn() {
  const navigate = useNavigate();
  const { setUser, refresh } = usePlantCare();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!email.trim()) return setError("Please enter your email or username.");
    if (!password) return setError("Password is required.");
    try {
      const user = await api.signIn({ email: email.trim(), remember, password });
      setUser(user);
      await refresh();
      navigate("/auth-loading", { state: { type: "signin", role: user.role }, replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-split-wrapper">
        {/* Left Side: Plant Growth Image Banner */}
        <div className="auth-hero-side">
          <img src="/auth_hero.jpg" alt="Growing Plant" className="auth-hero-img" />
          <div className="auth-hero-overlay" />
          <div className="auth-hero-content">
            <div className="auth-hero-badge">🌿 PlantDoc</div>
            <h1 className="auth-hero-title">Nurture Your Green Companions</h1>
            <p className="auth-hero-quote">"Every Drop Helps You Grow"</p>
            <p style={{ color: "#d8f3dc", fontSize: "0.92rem", lineHeight: 1.5 }}>
              Track watering schedules, monitor plant health, and receive smart care reminders tailored to your home garden.
            </p>
          </div>
        </div>

        {/* Right Side: Sign In Form Card */}
        <div className="auth-form-side">
          <form className="auth-card" onSubmit={submit}>
            <div className="auth-logo" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginBottom: 16 }}>
              <img src="/app_logo.png" alt="PlantDoc Logo" style={{ width: 62, height: 62, borderRadius: "50%", objectFit: "cover", boxShadow: "0 8px 24px rgba(31,77,46,0.18)" }} />
              <h1 style={{ fontSize: "1.8rem", color: "#1b4332", margin: "4px 0 0", fontWeight: 900, letterSpacing: "-0.02em" }}>Sign In</h1>
              <p style={{ textAlign: "center", margin: "4px 0 0", color: "#2d6a4f", fontSize: "0.88rem", fontWeight: 650 }}>Welcome back to PlantDoc</p>
            </div>
            {error && (
              <div className="error" role="alert" style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center", textAlign: "center" }}>
                <span>{error}</span>
                {(error.toLowerCase().includes("not found") || error.toLowerCase().includes("create an account")) && (
                  <Link to="/signup" style={{ fontWeight: 800, color: "#1f4d2e", textDecoration: "underline" }}>
                    Create Account & Continue →
                  </Link>
                )}
              </div>
            )}
            <label>Email / Username<input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email or username" /></label>
            <label>Password<div className="password-field"><input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" /><button type="button" onClick={() => setShow(!show)} aria-label="Show or hide password">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
            <div className="auth-row"><label className="check"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me</label><Link to="/forgot-password" className="link-btn">Forgot Password?</Link></div>
            <button className="primary-btn full" type="submit">Sign In</button>
            <p className="auth-link">New here? <Link to="/signup">Create Account</Link></p>
          </form>
        </div>
      </div>
    </main>
  );
}
