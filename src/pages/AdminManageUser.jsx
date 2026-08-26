import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import EmptyState from "../components/EmptyState.jsx";
import { usePlantCare } from "../App.jsx";
import { api } from "../services/api.js";

export default function AdminManageUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify, refresh } = usePlantCare();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getUsers().then((data) => {
      setUsers(data);
      const user = data.find((item) => item.id === id);
      if (user) setForm({ name: user.name, email: user.email, role: user.role, status: user.status || "Active" });
    });
  }, [id]);

  const user = users.find((item) => item.id === id);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const save = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return setError("Name and email are required.");
    if (!/\S+@\S+\.\S+/.test(form.email)) return setError("Please enter a valid email address.");
    await api.updateUser(id, {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      status: form.status
    });
    await refresh();
    notify("User updated successfully.");
    navigate("/admin/users");
  };

  if (users.length && !user) return <EmptyState title="User not found." message="This user does not exist." action="Back to Users" to="/admin/users" />;
  if (!form) return <p className="loading">Loading user...</p>;

  return (
    <>
      <section className="page-title">
        <button className="ghost-btn back-link" type="button" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
        <p className="eyebrow">Manage account</p>
        <h1>Manage {user.name}</h1>
      </section>
      <form className="panel manage-user-form" onSubmit={save}>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="field-grid">
          <label>Full Name<input value={form.name} onChange={(e) => update("name", e.target.value)} /></label>
          <label>Email<input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></label>
          <label>Role<select value={form.role} onChange={(e) => update("role", e.target.value)}><option value="user">User</option><option value="admin">Admin</option></select></label>
          <label>Account Status<select value={form.status} onChange={(e) => update("status", e.target.value)}><option>Active</option><option>Suspended</option></select></label>
        </div>
        <div className="form-actions">
          <Link className="ghost-btn" to="/admin/users">Cancel</Link>
          <button className="primary-btn"><Save size={16} /> Save Changes</button>
        </div>
      </form>
    </>
  );
}
