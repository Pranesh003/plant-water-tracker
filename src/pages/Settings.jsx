import { Bell, Download, KeyRound, Leaf, LockKeyhole, RefreshCw, Save, Settings as SettingsIcon, Sparkles, User, UserCog } from "lucide-react";
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
  activityNotifications: true,
  geminiApiKey: ""
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
      const storedKey = (typeof window !== "undefined" && (localStorage.getItem("geminiApiKey") || localStorage.getItem("openAiApiKey"))) || "";
      const next = { name: userData?.name || "", email: userData?.email || "", ...defaultSettings, ...settings, geminiApiKey: storedKey || settings?.geminiApiKey || "" };
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
    if (event) event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim()) return setError("Name and email are required.");
    if (!/\S+@\S+\.\S+/.test(form.email)) return setError("Please enter a valid email address.");

    try {
      await api.updateUser(profile.id, { ...profile, name: form.name.trim(), email: form.email.trim() });
      const cleanKey = form.geminiApiKey ? form.geminiApiKey.trim() : "";
      if (typeof window !== "undefined") {
        if (cleanKey) {
          localStorage.setItem("geminiApiKey", cleanKey);
        } else {
          localStorage.removeItem("geminiApiKey");
        }
      }
      const settings = {
        theme: form.theme,
        defaultLocation: form.defaultLocation,
        defaultFrequency: form.defaultFrequency,
        preferredTime: form.preferredTime,
        tempUnit: form.tempUnit,
        wateringAlerts: form.wateringAlerts,
        overdueAlerts: form.overdueAlerts,
        activityNotifications: form.activityNotifications,
        geminiApiKey: cleanKey
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
      {/* Page Header */}
      <header className="dashboard-top-header">
        <div>
          <span className="eyebrow-tag">PREFERENCES</span>
          <h1 style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", margin: "4px 0" }}>
            <span>Account & Care Settings</span>
            <img src="/settings_icon.png" alt="Settings Gear Icon" style={{ width: 32, height: 32, objectFit: "contain" }} />
          </h1>
          <p>Maintain your profile records, plant care defaults, temperature units, and security.</p>
        </div>
      </header>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="settings-grid" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Profile Banner Card */}
        <section style={{ background: "#ffffff", borderRadius: 20, padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#16a34a", color: "#ffffff", display: "grid", placeItems: "center", fontSize: "1.5rem", fontWeight: 850, boxShadow: "0 6px 20px rgba(22,163,74,0.25)" }}>
              {profile?.name ? profile.name[0].toUpperCase() : "P"}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 850, color: "#0f172a" }}>{form.name || "Plant Care User"}</h2>
              <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "0.88rem" }}>{form.email}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                <span style={{ fontSize: "0.76rem", fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
                  Role: {profile.role || "User"}
                </span>
                <span style={{ fontSize: "0.76rem", fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }}>
                  ID: #{String(profile.id).slice(0, 8)}
                </span>
              </div>
            </div>
          </div>

          <button className="primary-btn" onClick={saveProfileSettings} style={{ padding: "10px 22px", borderRadius: 14, fontSize: "0.88rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Save size={18} /> Save All Changes
          </button>
        </section>

        {/* Section 1: Personal Profile */}
        <section style={{ background: "#ffffff", borderRadius: 20, padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "1.05rem", fontWeight: 850, color: "#0f172a", display: "flex", alignItems: "center", gap: 10 }}>
            <UserCog size={20} color="#16a34a" /> Personal Profile
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            <div>
              <label htmlFor="settings-name" style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#475569", marginBottom: 6 }}>Display Name</label>
              <input id="settings-name" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Your Name" style={{ width: "100%", height: 46, padding: "0 14px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: "0.92rem", fontWeight: 600 }} />
            </div>
            <div>
              <label htmlFor="settings-email" style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#475569", marginBottom: 6 }}>Email Address</label>
              <input id="settings-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="your@email.com" style={{ width: "100%", height: 46, padding: "0 14px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: "0.92rem", fontWeight: 600 }} />
            </div>
          </div>
        </section>

        {/* Section 2: Plant Care Defaults & Units */}
        <section style={{ background: "#ffffff", borderRadius: 20, padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "1.05rem", fontWeight: 850, color: "#0f172a", display: "flex", alignItems: "center", gap: 10 }}>
            <Leaf size={20} color="#16a34a" /> Plant Care Defaults & Units
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            <div>
              <label htmlFor="default-location" style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#475569", marginBottom: 6 }}>Default Location</label>
              <select id="default-location" value={form.defaultLocation} onChange={(e) => update("defaultLocation", e.target.value)} style={{ width: "100%", height: 46, padding: "0 14px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: "0.92rem", fontWeight: 600, background: "#ffffff" }}>
                <option>Living Room</option>
                <option>Bedroom</option>
                <option>Kitchen</option>
                <option>Balcony</option>
                <option>Office</option>
                <option>Garden</option>
              </select>
            </div>
            <div>
              <label htmlFor="default-frequency" style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#475569", marginBottom: 6 }}>Default Watering Cycle</label>
              <select id="default-frequency" value={form.defaultFrequency} onChange={(e) => update("defaultFrequency", e.target.value)} style={{ width: "100%", height: 46, padding: "0 14px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: "0.92rem", fontWeight: 600, background: "#ffffff" }}>
                <option value="3">Every 3 days</option>
                <option value="7">Every 7 days</option>
                <option value="14">Every 14 days</option>
                <option value="30">Every 30 days</option>
              </select>
            </div>
            <div>
              <label htmlFor="pref-time" style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#475569", marginBottom: 6 }}>Reminder Preferred Time</label>
              <input id="pref-time" type="time" value={form.preferredTime} onChange={(e) => update("preferredTime", e.target.value)} style={{ width: "100%", height: 46, padding: "0 14px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: "0.92rem", fontWeight: 600 }} />
            </div>
            <div>
              <label htmlFor="temp-unit" style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#475569", marginBottom: 6 }}>Temperature Unit (°C / °F)</label>
              <select id="temp-unit" value={form.tempUnit} onChange={(e) => handleTempUnitChange(e.target.value)} style={{ width: "100%", height: 46, padding: "0 14px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: "0.92rem", fontWeight: 600, background: "#ffffff" }}>
                <option value="°C">Celsius (°C)</option>
                <option value="°F">Fahrenheit (°F)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Section 2.5: 🧠 Gemini AI Vision & Real-Time Token Quota Monitor */}
        <section style={{ background: "linear-gradient(135deg, #091e15 0%, #1b4332 100%)", color: "#ffffff", borderRadius: 20, padding: 24, border: "1px solid #2d5a3f", boxShadow: "0 6px 20px rgba(9, 30, 21, 0.15)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div>
              <span style={{ fontSize: "0.76rem", background: "rgba(116, 198, 157, 0.25)", color: "#74c69d", padding: "4px 12px", borderRadius: 12, fontWeight: 800, border: "1px solid rgba(116, 198, 157, 0.4)", textTransform: "uppercase" }}>
                ⚡ REAL-TIME AI ENGINE
              </span>
              <h3 style={{ margin: "8px 0 2px", fontSize: "1.15rem", fontWeight: 850, color: "#ffffff", display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={20} color="#74c69d" /> Google Gemini 3.5 Flash Token & Quota Monitor
              </h3>
              <p style={{ margin: 0, fontSize: "0.86rem", color: "#d8f3dc", opacity: 0.9 }}>
                Monitor your live API status, daily free tier scan quota, and token usage per plant diagnosis.
              </p>
            </div>

            <span style={{ padding: "6px 14px", borderRadius: 12, background: "rgba(82, 183, 136, 0.2)", color: "#52b788", fontWeight: 800, fontSize: "0.82rem", border: "1px solid rgba(82, 183, 136, 0.35)", display: "flex", alignItems: "center", gap: 6 }}>
              🟢 Live Cloud Connected
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 16 }}>
            <div style={{ background: "rgba(255, 255, 255, 0.08)", padding: 14, borderRadius: 14, border: "1px solid rgba(255, 255, 255, 0.12)" }}>
              <span style={{ fontSize: "0.76rem", color: "#b7e4c7", fontWeight: 700, display: "block" }}>FREE DAILY SCANS</span>
              <strong style={{ fontSize: "1.25rem", color: "#ffffff", fontWeight: 900, marginTop: 2, display: "block" }}>
                1,500 <small style={{ fontSize: "0.78rem", color: "#95d5b2" }}>Scans / Day</small>
              </strong>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.08)", padding: 14, borderRadius: 14, border: "1px solid rgba(255, 255, 255, 0.12)" }}>
              <span style={{ fontSize: "0.76rem", color: "#b7e4c7", fontWeight: 700, display: "block" }}>DAILY TOKEN LIMIT</span>
              <strong style={{ fontSize: "1.25rem", color: "#38bdf8", fontWeight: 900, marginTop: 2, display: "block" }}>
                900,000 <small style={{ fontSize: "0.78rem", color: "#7dd3fc" }}>Tokens / Day</small>
              </strong>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.08)", padding: 14, borderRadius: 14, border: "1px solid rgba(255, 255, 255, 0.12)" }}>
              <span style={{ fontSize: "0.76rem", color: "#b7e4c7", fontWeight: 700, display: "block" }}>AVG SCAN COST</span>
              <strong style={{ fontSize: "1.25rem", color: "#facc15", fontWeight: 900, marginTop: 2, display: "block" }}>
                ~450 <small style={{ fontSize: "0.78rem", color: "#fde047" }}>Tokens / Scan</small>
              </strong>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.08)", padding: 14, borderRadius: 14, border: "1px solid rgba(255, 255, 255, 0.12)" }}>
              <span style={{ fontSize: "0.76rem", color: "#b7e4c7", fontWeight: 700, display: "block" }}>RATE LIMIT (SPEED)</span>
              <strong style={{ fontSize: "1.25rem", color: "#4ade80", fontWeight: 900, marginTop: 2, display: "block" }}>
                15 <small style={{ fontSize: "0.78rem", color: "#86efac" }}>Scans / Min</small>
              </strong>
            </div>
          </div>

          <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 12, background: "rgba(0, 0, 0, 0.25)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
            <label htmlFor="settings-gemini-key" style={{ fontSize: "0.82rem", fontWeight: 750, color: "#d8f3dc", display: "block", marginBottom: 6 }}>
              🔑 Custom Gemini API Key (Optional - default system key is active):
            </label>
            <input
              id="settings-gemini-key"
              type="password"
              placeholder="Paste your key (e.g. AQ.Ab8RN... or AIzaSy...)"
              value={form.geminiApiKey}
              onChange={(e) => update("geminiApiKey", e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255, 255, 255, 0.2)", background: "rgba(255, 255, 255, 0.1)", color: "#ffffff", fontSize: "0.88rem" }}
            />
          </div>
        </section>

        {/* Section 3: Notifications & Desktop Push Alerts */}
        <section style={{ background: "#ffffff", borderRadius: 20, padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "1.05rem", fontWeight: 850, color: "#0f172a", display: "flex", alignItems: "center", gap: 10 }}>
            <Bell size={20} color="#d97706" /> Notification & Push Alerts
          </h3>
          <div style={{ marginBottom: 16 }}>
            {browserNotificationPermission !== "granted" ? (
              <button type="button" className="ghost-btn" onClick={requestNotificationPermission} style={{ padding: "8px 16px", borderRadius: 12, fontSize: "0.86rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Bell size={16} /> Enable Browser Desktop Alerts
              </button>
            ) : (
              <span style={{ fontSize: "0.82rem", fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
                ✓ Desktop Alerts Active
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: "0.9rem", color: "#0f172a", fontWeight: 600 }}>
              <input type="checkbox" checked={form.wateringAlerts} onChange={(e) => update("wateringAlerts", e.target.checked)} style={{ width: 18, height: 18, accentColor: "#16a34a" }} />
              Same-day watering notifications
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: "0.9rem", color: "#0f172a", fontWeight: 600 }}>
              <input type="checkbox" checked={form.overdueAlerts} onChange={(e) => update("overdueAlerts", e.target.checked)} style={{ width: 18, height: 18, accentColor: "#16a34a" }} />
              Overdue plant warnings
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: "0.9rem", color: "#0f172a", fontWeight: 600 }}>
              <input type="checkbox" checked={form.activityNotifications} onChange={(e) => update("activityNotifications", e.target.checked)} style={{ width: 18, height: 18, accentColor: "#16a34a" }} />
              Care history activity log alerts
            </label>
          </div>
        </section>

        {/* Section 4: Data & Record Maintenance */}
        <section style={{ background: "#ffffff", borderRadius: 20, padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <h3 style={{ margin: "0 0 10px", fontSize: "1.05rem", fontWeight: 850, color: "#0f172a", display: "flex", alignItems: "center", gap: 10 }}>
            <Download size={20} color="#0284c7" /> Data & Record Maintenance
          </h3>
          <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "0.88rem" }}>
            Manage your plant history records ({plants.length} active plants, {history.length} care logs recorded).
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="button" className="ghost-btn" onClick={exportCSVRecords} style={{ padding: "8px 16px", borderRadius: 12, fontSize: "0.86rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Download size={16} /> Export Records (CSV)
            </button>
            <button type="button" className="ghost-btn danger" onClick={clearLocalCache} style={{ padding: "8px 16px", borderRadius: 12, fontSize: "0.86rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8, color: "#dc2626", borderColor: "#fecaca" }}>
              <RefreshCw size={16} /> Clear Local Cache
            </button>
          </div>
        </section>

        {/* Section 5: Security & Password */}
        <section style={{ background: "#ffffff", borderRadius: 20, padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <h3 style={{ margin: "0 0 10px", fontSize: "1.05rem", fontWeight: 850, color: "#0f172a", display: "flex", alignItems: "center", gap: 10 }}>
            <LockKeyhole size={20} color="#dc2626" /> Security & Password
          </h3>
          <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "0.88rem" }}>
            Manage your security credentials and update your account password on the dedicated security page.
          </p>
          <button type="button" className="ghost-btn" onClick={() => navigate("/change-password")} style={{ padding: "8px 18px", borderRadius: 12, fontSize: "0.86rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <KeyRound size={16} /> Change Password & Security →
          </button>
        </section>
      </div>

      {/* Save Button Bar */}
      <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
        <button className="primary-btn" onClick={saveProfileSettings} style={{ padding: "12px 28px", borderRadius: 14, fontSize: "0.94rem", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Save size={18} /> Save All Settings
        </button>
      </div>
    </div>
  );
}
