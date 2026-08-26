import { Eye, EyeOff, Sprout } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePlantCare } from "../App.jsx";
import PasswordStrength from "../components/PasswordStrength.jsx";
import RoleSelector from "../components/RoleSelector.jsx";
import { api } from "../services/api.js";
import { evaluatePasswordStrength } from "../utils/passwordUtils.js";

export default function SignIn() {
  const navigate = useNavigate();
  const { setUser, notify, refresh } = usePlantCare();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("krithika@example.com");
  const [password, setPassword] = useState("Green@123");
  const [remember, setRemember] = useState(true);
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const validEmail = (value) => /\S+@\S+\.\S+/.test(value);
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (role === "user" && !validEmail(email)) return setError("Please enter a valid email address.");
    if (!password) return setError("Password is required.");
    const strength = evaluatePasswordStrength(password, email);
    if (strength.label === "WEAK") return setError(strength.similar ? "Avoid using your username or name as your password." : "Password strength: WEAK");
    try {
      const user = await api.signIn({ email, remember, role });
      setUser(user);
      await refresh();
      navigate(user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    }
  };
  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-logo"><Sprout size={34} /><h1>Plant Care Tracker</h1></div>
        <p>Welcome back to your calm plant care space.</p>
        <RoleSelector role={role} onChange={setRole} />
        {error && <p className="error" role="alert">{error}</p>}
        <label>Email / Username<input type={role === "user" ? "email" : "text"} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Password<div className="password-field"><input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} /><button type="button" onClick={() => setShow(!show)} aria-label="Show or hide password">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
        {password && <PasswordStrength password={password} identity={email} showChecklist={false} />}
        <div className="auth-row"><label className="check"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me</label><button className="link-btn" type="button" onClick={() => notify("Password reset functionality will be available when the backend is connected.")}>Forgot Password?</button></div>
        <button className="primary-btn full" type="submit">Sign In</button>
        <p className="auth-link">New here? <Link to="/signup">Create Account</Link></p>
      </form>
    </main>
  );
}
