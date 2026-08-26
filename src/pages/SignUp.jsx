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
    if (!form.terms) return setError("Please accept the terms to continue.");
    await api.signUp(form);
    await refresh();
    navigate("/tutorial");
  };
  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-logo"><Sprout size={34} /><h1>Create Account</h1></div>
        <p>Start tracking your plant family with gentle routines.</p>
        {error && <p className="error" role="alert">{error}</p>}
        <label>Full Name<input value={form.name} onChange={(e) => update("name", e.target.value)} /></label>
        <label>Email<input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></label>
        <label>Password<input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} /></label>
        <PasswordStrength password={form.password} identity={form.name || form.email} />
        <label>Confirm Password<input type="password" value={form.confirm} onChange={(e) => update("confirm", e.target.value)} /></label>
        <label className="check"><input type="checkbox" checked={form.terms} onChange={(e) => update("terms", e.target.checked)} /> I agree to the Terms & Conditions</label>
        <button className="primary-btn full">Create Account</button>
        <p className="auth-link">Already have an account? <Link to="/signin">Sign In</Link></p>
      </form>
    </main>
  );
}
