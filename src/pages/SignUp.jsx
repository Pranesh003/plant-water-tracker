import { Sprout } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePlantCare } from "../App.jsx";
import PasswordStrength from "../components/PasswordStrength.jsx";
import { api } from "../services/api.js";
import { evaluatePasswordStrength } from "../utils/passwordUtils.js";

export default function SignUp() {
  const navigate = useNavigate();
  const { refresh } = usePlantCare();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", terms: false });
  const [error, setError] = useState("");
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) return setError("Please complete all required fields.");
    if (!/\S+@\S+\.\S+/.test(form.email)) return setError("Please enter a valid email address.");
    const strength = evaluatePasswordStrength(form.password, form.name || form.email);
    if (!strength.isStrong) return setError(strength.similar ? "Avoid using your username or name as your password." : "Create a strong password before continuing.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    try {
      await api.signUp(form);
      await refresh();
      navigate("/auth-loading", { state: { type: "signup" }, replace: true });
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
            <h1 className="auth-hero-title">Start Your Plant Journey Today</h1>
            <p className="auth-hero-quote">"Every Drop Helps You Grow"</p>
            <p style={{ color: "#d8f3dc", fontSize: "0.92rem", lineHeight: 1.5 }}>
              Join thousands of plant parents tracking customized watering schedules, sunlight levels, and plant health care notes.
            </p>
          </div>
        </div>

        {/* Right Side: Sign Up Form Card */}
        <div className="auth-form-side">
          <form className="auth-card" onSubmit={submit}>
            <div className="auth-logo" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginBottom: 12 }}>
              <img src="/app_logo.png" alt="PlantDoc Logo" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", boxShadow: "0 8px 24px rgba(31,77,46,0.18)" }} />
              <h1 style={{ fontSize: "1.75rem", color: "#1b4332", margin: "2px 0 0", fontWeight: 900, letterSpacing: "-0.02em" }}>Create Account</h1>
              <p style={{ textAlign: "center", margin: "2px 0 0", color: "#2d6a4f", fontSize: "0.86rem", fontWeight: 650 }}>Start tracking your plant family with PlantDoc</p>
            </div>
            {error && <p className="error" role="alert">{error}</p>}
            <label>Full Name<input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Dinesh S" /></label>
            <label>Email<input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="name@example.com" /></label>
            <label>Password<input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Create password" /></label>
            <PasswordStrength password={form.password} identity={form.name || form.email} />
            <label>Confirm Password<input type="password" value={form.confirm} onChange={(e) => update("confirm", e.target.value)} placeholder="Confirm password" /></label>
            <label className="check"><input type="checkbox" checked={form.terms} onChange={(e) => update("terms", e.target.checked)} /> I agree to the Terms & Conditions</label>
            <button className="primary-btn full">Create Account</button>
            <p className="auth-link">Already have an account? <Link to="/signin">Sign In</Link></p>
          </form>
        </div>
      </div>
    </main>
  );
}
