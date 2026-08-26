import { CalendarDays, Mail, Save, ShieldCheck, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { usePlantCare } from "../App.jsx";
import { api } from "../services/api.js";

export default function AdminProfile() {
  const { notify, refresh } = usePlantCare();
  const [admin, setAdmin] = useState(null);
  const [form, setForm] = useState({ name: "", email: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    api.getUser().then((user) => {
      setAdmin(user);
      setForm({ name: user?.name || "", email: user?.email || "" });
    });
  }, []);

  const save = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return setError("Name and email are required.");
    if (!/\S+@\S+\.\S+/.test(form.email)) return setError("Please enter a valid email address.");
    const updated = await api.updateUser(admin.id, {
      ...admin,
      name: form.name.trim(),
      email: form.email.trim()
    });
    setAdmin(updated);
    await refresh();
    notify("Admin profile updated.");
    setError("");
  };

  if (!admin) return <p className="loading">Loading profile...</p>;

  return (
    <>
      <section className="page-title"><p className="eyebrow">Admin account</p><h1>Profile</h1></section>
      <section className="panel admin-profile-panel">
        <div className="admin-profile-hero">
          <span className="admin-profile-avatar"><UserCircle size={40} /></span>
          <div>
            <h2>{admin.name}</h2>
            <p>{admin.email}</p>
          </div>
          <span className="status-badge safe">{admin.status || "Active"}</span>
        </div>
        <div className="admin-profile-meta">
          <div><ShieldCheck size={18} /><small>Role</small><strong>Administrator</strong></div>
          <div><Mail size={18} /><small>Email</small><strong>{admin.email}</strong></div>
          <div><CalendarDays size={18} /><small>Created</small><strong>{admin.createdDate || "Not available"}</strong></div>
        </div>
      </section>
      <form className="panel manage-user-form" onSubmit={save}>
        <h2>Edit Profile</h2>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="field-grid">
          <label htmlFor="admin-name">Admin name<input id="admin-name" value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} /></label>
          <label htmlFor="admin-email">Admin email<input id="admin-email" type="email" value={form.email} onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))} /></label>
        </div>
        <div className="form-actions">
          <button className="ghost-btn" type="button" onClick={() => setForm({ name: admin.name || "", email: admin.email || "" })}>Cancel</button>
          <button className="primary-btn"><Save size={16} /> Save Changes</button>
        </div>
      </form>
    </>
  );
}
