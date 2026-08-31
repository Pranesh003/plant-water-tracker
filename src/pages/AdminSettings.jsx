import { Bell, LockKeyhole, Save, UserCog } from "lucide-react";
import { useEffect, useState } from "react";
import { usePlantCare } from "../App.jsx";
import { AdminHeader } from "../components/AdminSidebar.jsx";
import { api } from "../services/api.js";
import { readStorage, writeStorage } from "../utils/storageUtils.js";
import { applyTheme } from "../utils/themeUtils.js";

const SETTINGS_KEY = "plantCareAdminSettings";
const defaultSettings = {
  theme: "Nature green",
  wateringAlerts: true,
  overdueAlerts: true,
  activityNotifications: true
};

export default function AdminSettings() {
  const { notify, refresh } = usePlantCare();
  const [admin, setAdmin] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", ...defaultSettings });
  const [initial, setInitial] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.getUser(), Promise.resolve(readStorage(SETTINGS_KEY, defaultSettings))]).then(([user, settings]) => {
      const next = { name: user?.name || "", email: user?.email || "", ...defaultSettings, ...settings };
      setAdmin(user);
      setForm(next);
      setInitial(next);
      applyTheme(next.theme);
    });
  }, []);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const reset = () => {
    if (initial) {
      setForm(initial);
      applyTheme(initial.theme);
    }
    setError("");
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return setError("Name and email are required.");
    if (!/\S+@\S+\.\S+/.test(form.email)) return setError("Please enter a valid email address.");
    try {
      await api.updateUser(admin.id, { ...admin, name: form.name.trim(), email: form.email.trim() });
      const settings = {
        theme: form.theme,
        defaultLocation: form.defaultLocation,
        defaultFrequency: form.defaultFrequency,
        preferredTime: form.preferredTime,
        tempUnit: form.tempUnit,
        wateringAlerts: form.wateringAlerts,
        overdueAlerts: form.overdueAlerts,
        activityNotifications: form.activityNotifications
      };
      writeStorage(SETTINGS_KEY, settings);
      applyTheme(form.theme);
      const next = { ...form, name: form.name.trim(), email: form.email.trim() };
      setInitial(next);
      await refresh();
      notify("Admin settings saved.");
      setError("");
    } catch (err) {
      setError(err.message || "Failed to save settings.");
    }
  };

  if (!admin) return <p className="loading">Loading settings...</p>;

  return (
    <>
      <AdminHeader title="Admin Settings" eyebrow="ADMIN PREFERENCES" />
      <form className="settings-layout" onSubmit={save}>
        {error && <p className="error settings-error" role="alert">{error}</p>}
        <section className="panel settings-section">
          <h2><UserCog size={19} /> Account Settings</h2>
          <div className="field-grid">
            <label htmlFor="settings-name">Admin name<input id="settings-name" value={form.name} onChange={(e) => update("name", e.target.value)} /></label>
            <label htmlFor="settings-email">Admin email<input id="settings-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></label>
          </div>
        </section>

        <section className="panel settings-section">
          <h2><Bell size={19} /> Notification Preferences</h2>
          <label className="check"><input type="checkbox" checked={form.wateringAlerts} onChange={(e) => update("wateringAlerts", e.target.checked)} /> Watering alerts</label>
          <label className="check"><input type="checkbox" checked={form.overdueAlerts} onChange={(e) => update("overdueAlerts", e.target.checked)} /> Overdue plant alerts</label>
          <label className="check"><input type="checkbox" checked={form.activityNotifications} onChange={(e) => update("activityNotifications", e.target.checked)} /> System activity notifications</label>
        </section>

        <section className="panel settings-section">
          <h2><LockKeyhole size={19} /> Security</h2>
          <div className="security-note">
            <strong>Change password</strong>
            <p>Password changes can be updated on your account settings page.</p>
            <button className="ghost-btn" type="button" disabled>Change Password</button>
          </div>
        </section>

        <div className="form-actions settings-actions">
          <button className="ghost-btn" type="button" onClick={reset}>Cancel</button>
          <button className="primary-btn"><Save size={16} /> Save Changes</button>
        </div>
      </form>
    </>
  );
}
