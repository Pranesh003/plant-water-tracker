import { Bell, Download, KeyRound, Leaf, LockKeyhole, RefreshCw, Save, User, UserCog } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlantCare } from "../App.jsx";
import { api } from "../services/api.js";
import { readStorage, writeStorage } from "../utils/storageUtils.js";
import { applyTheme } from "../utils/themeUtils.js";

const SETTINGS_KEY = "plantCareUserSettings";
const defaultSettings = {
  theme: "Nature green",
  defaultLocation: "Living Room",
  defaultFrequency: "7",
  preferredTime: "08:00",
  tempUnit: "°C",
  wateringAlerts: true,
  overdueAlerts: true,
  activityNotifications: true
};

export default function Settings() {
  const { user, plants, history, notify, refresh } = usePlantCare();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", ...defaultSettings });
  const [error, setError] = useState("");
  const [browserNotificationPermission, setBrowserNotificationPermission] = useState(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );

  useEffect(() => {
    Promise.all([api.getUser(), Promise.resolve(readStorage(SETTINGS_KEY, defaultSettings))]).then(([userData, settings]) => {
      const next = { name: userData?.name || "", email: userData?.email || "", ...defaultSettings, ...settings };
      setProfile(userData);
      setForm(next);
      applyTheme(next.theme);
    });
  }, []);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleTempUnitChange = (unit) => {
    update("tempUnit", unit);
    const currentSettings = readStorage(SETTINGS_KEY, defaultSettings);
    writeStorage(SETTINGS_KEY, { ...currentSettings, tempUnit: unit });
    notify(`Temperature unit set to ${unit}`);
  };

  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      setBrowserNotificationPermission(permission);
      if (permission === "granted") notify("Desktop alerts enabled!");
    }
  };

  const exportCSVRecords = () => {
    try {
      const headers = ["Plant Name", "Species", "Location", "Frequency (Days)", "Last Watered", "Current Streak", "Best Streak"];
      const rows = plants.map((p) => [
        `"${p.name || ""}"`,
        `"${p.species || ""}"`,
        `"${p.location || "Indoor"}"`,
        p.frequency || 7,
        `"${p.lastWatered || ""}"`,
        p.currentStreak || 0,
        p.bestStreak || 0
      ]);

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `plant_care_records_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      notify("Plant care records exported as CSV.");
    } catch {
      notify("Failed to export records.");
    }
  };

  const clearLocalCache = () => {
    try {
      localStorage.clear();
      notify("Local cache cleared. Refreshing...");
      window.setTimeout(() => window.location.reload(), 1000);
    } catch {
      notify("Failed to clear cache.");
    }
  };

  const saveProfileSettings = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim()) return setError("Name and email are required.");
    if (!/\S+@\S+\.\S+/.test(form.email)) return setError("Please enter a valid email address.");

    try {
      await api.updateUser(profile.id, { ...profile, name: form.name.trim(), email: form.email.trim() });
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
      await refresh();
      notify("Settings saved successfully!");
    } catch (err) {
      setError(err.message || "Failed to save settings.");
    }
  };

  if (!profile) return <p className="loading">Loading settings...</p>;

  return (
    <div className="settings-page-container">
      <header className="dashboard-top-header">
        <div>
          <span className="eyebrow-tag">PREFERENCES</span>
          <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span>Account & Care Settings</span>
            <img src="/settings_icon.png" alt="Settings Gear Icon" style={{ width: 34, height: 34, objectFit: "contain" }} />
          </h1>
          <p>Maintain your profile records, plant care defaults, temperature units, and security.</p>
        </div>
      </header>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="settings-grid" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* App Branding & Logo */}
        <section className="panel settings-section" style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <img
            src="/app_logo.png"
            alt="Plant Care Logo"
            style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", boxShadow: "0 8px 24px rgba(31,77,46,0.16)", border: "3px solid #ffffff" }}
          />
          <div>
            <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#1b4332" }}>PlantDoc Care Tracker</h2>
            <p style={{ margin: "4px 0 0 0", color: "var(--muted)", fontSize: "0.88rem" }}>
              Official Plant Water Tracking & Recommendations Platform
            </p>
          </div>
        </section>

        {/* Section 1: Profile & Account Information */}
        <section className="panel settings-section">
          <h2><UserCog size={20} /> Personal Profile</h2>
          <div className="field-grid">
            <label htmlFor="settings-name">Display Name
              <input id="settings-name" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Your Name" />
            </label>
            <label htmlFor="settings-email">Email Address
              <input id="settings-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="your@email.com" />
            </label>
          </div>
          <div className="profile-meta-row" style={{ marginTop: 14, display: "flex", gap: 16, fontSize: "0.86rem", color: "var(--muted)" }}>
            <span>Role: <strong style={{ color: "var(--dark)" }}>{profile.role || "User"}</strong></span>
            <span>Account ID: <strong style={{ color: "var(--dark)" }}>#{String(profile.id).slice(0, 8)}</strong></span>
          </div>
        </section>

        {/* Section 2: Plant Care Defaults & Units */}
        <section className="panel settings-section">
          <h2><Leaf size={20} /> Plant Care Defaults & Units</h2>
          <div className="field-grid">
            <label htmlFor="default-location">Default Location
              <select id="default-location" value={form.defaultLocation} onChange={(e) => update("defaultLocation", e.target.value)}>
                <option>Living Room</option>
                <option>Bedroom</option>
                <option>Kitchen</option>
                <option>Balcony</option>
                <option>Office</option>
                <option>Garden</option>
              </select>
            </label>
            <label htmlFor="default-frequency">Default Watering Cycle
              <select id="default-frequency" value={form.defaultFrequency} onChange={(e) => update("defaultFrequency", e.target.value)}>
                <option value="3">Every 3 days</option>
                <option value="7">Every 7 days</option>
                <option value="14">Every 14 days</option>
                <option value="30">Every 30 days</option>
              </select>
            </label>
            <label htmlFor="pref-time">Reminder Preferred Time
              <input id="pref-time" type="time" value={form.preferredTime} onChange={(e) => update("preferredTime", e.target.value)} />
            </label>
            <label htmlFor="temp-unit">Temperature Unit (°C / °F)
              <select id="temp-unit" value={form.tempUnit} onChange={(e) => handleTempUnitChange(e.target.value)}>
                <option value="°C">Celsius (°C)</option>
                <option value="°F">Fahrenheit (°F)</option>
              </select>
            </label>
          </div>
        </section>

        {/* Section 4: Notifications & Alerts */}
        <section className="panel settings-section">
          <h2><Bell size={20} /> Notification & Desktop Push Alerts</h2>
          <div style={{ marginBottom: 14 }}>
            {browserNotificationPermission !== "granted" ? (
              <button type="button" className="ghost-btn" onClick={requestNotificationPermission}>
                <Bell size={16} /> Enable Browser Desktop Alerts
              </button>
            ) : (
              <span className="status-badge safe">✓ Desktop Alerts Active</span>
            )}
          </div>
          <label className="check"><input type="checkbox" checked={form.wateringAlerts} onChange={(e) => update("wateringAlerts", e.target.checked)} /> Same-day watering notifications</label>
          <label className="check"><input type="checkbox" checked={form.overdueAlerts} onChange={(e) => update("overdueAlerts", e.target.checked)} /> Overdue plant warnings</label>
          <label className="check"><input type="checkbox" checked={form.activityNotifications} onChange={(e) => update("activityNotifications", e.target.checked)} /> Care history activity log alerts</label>
        </section>

        {/* Section 5: Data Backup & Records Maintenance */}
        <section className="panel settings-section">
          <h2><Download size={20} /> Data & Record Maintenance</h2>
          <p className="muted" style={{ marginBottom: 14 }}>
            Manage your plant history records ({plants.length} active plants, {history.length} care logs recorded).
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="button" className="ghost-btn" onClick={exportCSVRecords}>
              <Download size={16} /> Export Records (CSV)
            </button>
            <button type="button" className="ghost-btn danger" onClick={clearLocalCache}>
              <RefreshCw size={16} /> Clear Local Cache
            </button>
          </div>
        </section>

        {/* Section 6: Security & Password Navigation */}
        <section className="panel settings-section">
          <h2><LockKeyhole size={20} /> Security & Password</h2>
          <p className="muted" style={{ marginBottom: 14 }}>
            Manage your security credentials and update your account password on the dedicated security page.
          </p>
          <button type="button" className="ghost-btn" onClick={() => navigate("/change-password")} style={{ width: "fit-content" }}>
            <KeyRound size={16} /> Change Password & Security →
          </button>
        </section>
      </div>

      {/* Global Save Button Bar */}
      <div className="form-actions settings-actions" style={{ marginTop: 24 }}>
        <button className="primary-btn" onClick={saveProfileSettings}>
          <Save size={18} /> Save All Settings
        </button>
      </div>
    </div>
  );
}
