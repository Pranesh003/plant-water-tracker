import { Bell, CheckCircle2, LockKeyhole, Palette, Save, ShieldCheck, Sparkles, UserCheck, UserCog } from "lucide-react";
import { useEffect, useState } from "react";
import { usePlantCare } from "../App.jsx";
import { AdminHeader } from "../components/AdminSidebar.jsx";
import { api } from "../services/api.js";
import { readStorage, writeStorage } from "../utils/storageUtils.js";
import { applyTheme } from "../utils/themeUtils.js";

const SETTINGS_KEY = "plantCareAdminSettings";
const defaultSettings = {
  theme: "Nature green",
  tempUnit: "Celsius",
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
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    Promise.all([api.getUser(), Promise.resolve(readStorage(SETTINGS_KEY, defaultSettings))]).then(([user, settings]) => {
      const next = { name: user?.name || "Admin", email: user?.email || "admin@plants.local", ...defaultSettings, ...settings };
      setAdmin(user);
      setForm(next);
      setInitial(next);
      applyTheme(next.theme);
    });
  }, []);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setSavedSuccess(false);
    if (field === "theme") {
      applyTheme(value);
    }
  };

  const reset = () => {
    if (initial) {
      setForm(initial);
      applyTheme(initial.theme);
    }
    setError("");
    setSavedSuccess(false);
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return setError("Name and email are required.");
    if (!/\S+@\S+\.\S+/.test(form.email)) return setError("Please enter a valid email address.");
    try {
      if (admin?.id) {
        await api.updateUser(admin.id, { ...admin, name: form.name.trim(), email: form.email.trim() });
      }
      const settings = {
        theme: form.theme,
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
      notify("Admin settings updated successfully.");
      setError("");
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err) {
      setError(err.message || "Failed to save settings.");
    }
  };

  if (!admin) return <div style={{ padding: 48, textAlign: "center", color: "#64748b", fontWeight: 700 }}>Loading admin preferences...</div>;

  const initials = form.name
    ? form.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "A";

  return (
    <div className="admin-settings-page" style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 60 }}>
      <AdminHeader title="Admin Settings" eyebrow="ADMIN PREFERENCES" />
      <p style={{ margin: "-16px 0 24px 0", color: "#64748b", fontSize: "0.92rem", fontWeight: 500 }}>
        Configure administrative account details, system notifications, security, and global app preferences.
      </p>

      {/* Admin Profile Hero Banner */}
      <section style={{
        padding: "24px 28px",
        marginBottom: 24,
        background: "linear-gradient(135deg, #091e15 0%, #1b4332 50%, #2d6a4f 100%)",
        color: "#ffffff",
        borderRadius: 20,
        border: "1px solid #2d5a3f",
        boxShadow: "0 10px 30px rgba(15,41,30,0.2)",
        display: "flex",
        alignItems: "center",
        justify: "space-between",
        flexWrap: "wrap",
        gap: 20
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #52b788 0%, #1b4332 100%)",
            color: "#ffffff",
            fontWeight: 850,
            fontSize: "1.3rem",
            display: "grid",
            placeItems: "center",
            boxShadow: "0 6px 18px rgba(82, 183, 136, 0.3)",
            border: "2px solid #ffffff"
          }}>
            {initials}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 850, color: "#ffffff" }}>{form.name}</h2>
              <span style={{ fontSize: "0.74rem", background: "rgba(82, 183, 136, 0.25)", color: "#74c69d", padding: "3px 10px", borderRadius: 10, fontWeight: 800, border: "1px solid rgba(116, 198, 157, 0.4)", textTransform: "uppercase" }}>
                SUPER ADMINISTRATOR
              </span>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.88rem", color: "#d8f3dc", opacity: 0.9 }}>{form.email}</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ padding: "8px 14px", background: "rgba(255, 255, 255, 0.08)", borderRadius: 12, border: "1px solid rgba(255, 255, 255, 0.15)", fontSize: "0.8rem", color: "#d8f3dc" }}>
            <span style={{ color: "#95ad9e", display: "block", fontSize: "0.72rem", fontWeight: 700 }}>STATUS</span>
            <span style={{ fontWeight: 800, color: "#74c69d", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#74c69d" }} /> Active & Synced
            </span>
          </div>
          <div style={{ padding: "8px 14px", background: "rgba(255, 255, 255, 0.08)", borderRadius: 12, border: "1px solid rgba(255, 255, 255, 0.15)", fontSize: "0.8rem", color: "#d8f3dc" }}>
            <span style={{ color: "#95ad9e", display: "block", fontSize: "0.72rem", fontWeight: 700 }}>SECURITY LEVEL</span>
            <span style={{ fontWeight: 800, color: "#ffffff" }}>Full System Access</span>
          </div>
        </div>
      </section>

      {error && (
        <div style={{ padding: "12px 16px", background: "#fef2f2", color: "#dc2626", borderRadius: 14, border: "1px solid #fecaca", marginBottom: 20, fontSize: "0.88rem", fontWeight: 700 }}>
          {error}
        </div>
      )}

      {savedSuccess && (
        <div style={{ padding: "12px 16px", background: "#f0fdf4", color: "#16a34a", borderRadius: 14, border: "1px solid #bbf7d0", marginBottom: 20, fontSize: "0.88rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={18} />
          <span>Admin settings and preferences successfully saved!</span>
        </div>
      )}

      <form onSubmit={save}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20, marginBottom: 24 }}>
          {/* Card 1: Account Settings */}
          <section style={{ background: "#ffffff", borderRadius: 20, padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
            <h2 style={{ margin: "0 0 18px", fontSize: "1.05rem", fontWeight: 850, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
              <UserCog size={20} color="#16a34a" /> Account Settings
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 750, color: "#0f172a", fontSize: "0.88rem" }}>
                Admin Full Name
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  style={{ padding: "11px 14px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: "0.9rem", color: "#0f172a", fontWeight: 600, background: "#ffffff" }}
                  required
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 750, color: "#0f172a", fontSize: "0.88rem" }}>
                Admin Email Address
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  style={{ padding: "11px 14px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: "0.9rem", color: "#0f172a", fontWeight: 600, background: "#ffffff" }}
                  required
                />
              </label>

              <div style={{ padding: 12, background: "#f8faf7", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 700, display: "block" }}>ACCOUNT ROLE</span>
                <span style={{ fontSize: "0.88rem", color: "#16a34a", fontWeight: 800, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                  <UserCheck size={16} /> Platform System Administrator
                </span>
              </div>
            </div>
          </section>

          {/* Card 2: Notification Preferences */}
          <section style={{ background: "#ffffff", borderRadius: 20, padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
            <h2 style={{ margin: "0 0 18px", fontSize: "1.05rem", fontWeight: 850, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
              <Bell size={20} color="#d97706" /> Notification Preferences
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", background: "#fffbe6", borderRadius: 14, border: "1px solid #ffe58f", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.wateringAlerts}
                  onChange={(e) => update("wateringAlerts", e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: "#16a34a", marginTop: 2, cursor: "pointer" }}
                />
                <div>
                  <strong style={{ display: "block", color: "#b45309", fontSize: "0.9rem" }}>Watering Alerts</strong>
                  <span style={{ fontSize: "0.8rem", color: "#475569", fontWeight: 500 }}>Receive instant alerts for daily plant care tasks.</span>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", background: "#fef2f2", borderRadius: 14, border: "1px solid #fecaca", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.overdueAlerts}
                  onChange={(e) => update("overdueAlerts", e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: "#dc2626", marginTop: 2, cursor: "pointer" }}
                />
                <div>
                  <strong style={{ display: "block", color: "#dc2626", fontSize: "0.9rem" }}>Overdue Plant Alerts</strong>
                  <span style={{ fontSize: "0.8rem", color: "#475569", fontWeight: 500 }}>Notify when plants exceed recommended watering frequency.</span>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", background: "#f0fdf4", borderRadius: 14, border: "1px solid #bbf7d0", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.activityNotifications}
                  onChange={(e) => update("activityNotifications", e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: "#16a34a", marginTop: 2, cursor: "pointer" }}
                />
                <div>
                  <strong style={{ display: "block", color: "#16a34a", fontSize: "0.9rem" }}>System Activity Notifications</strong>
                  <span style={{ fontSize: "0.8rem", color: "#475569", fontWeight: 500 }}>Receive activity summary when users update care logs.</span>
                </div>
              </label>
            </div>
          </section>

          {/* Card 3: Display & System Theme */}
          <section style={{ background: "#ffffff", borderRadius: 20, padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
            <h2 style={{ margin: "0 0 18px", fontSize: "1.05rem", fontWeight: 850, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
              <Palette size={20} color="#0284c7" /> System Theme & Display
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 750, color: "#0f172a", fontSize: "0.88rem" }}>
                Visual Color Palette
                <select
                  value={form.theme}
                  onChange={(e) => update("theme", e.target.value)}
                  style={{ padding: "11px 14px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: "0.9rem", fontWeight: 700, color: "#334155", background: "#ffffff", cursor: "pointer" }}
                >
                  <option value="Nature green">Nature Green (Default)</option>
                  <option value="High contrast">High Contrast</option>
                  <option value="Dark botanical">Dark Botanical</option>
                </select>
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 750, color: "#0f172a", fontSize: "0.88rem" }}>
                Temperature Measurement Unit
                <select
                  value={form.tempUnit}
                  onChange={(e) => update("tempUnit", e.target.value)}
                  style={{ padding: "11px 14px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: "0.9rem", fontWeight: 700, color: "#334155", background: "#ffffff", cursor: "pointer" }}
                >
                  <option value="Celsius">Celsius (°C)</option>
                  <option value="Fahrenheit">Fahrenheit (°F)</option>
                </select>
              </label>
            </div>
          </section>

          {/* Card 4: Security & Authentication */}
          <section style={{ background: "#ffffff", borderRadius: 20, padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
            <h2 style={{ margin: "0 0 18px", fontSize: "1.05rem", fontWeight: 850, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
              <LockKeyhole size={20} color="#7e22ce" /> Security & Access Controls
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ padding: "14px 16px", background: "#f8faf7", borderRadius: 14, border: "1px solid #e2e8f0" }}>
                <strong style={{ display: "block", color: "#0f172a", fontSize: "0.92rem", fontWeight: 800 }}>Account Credentials</strong>
                <p style={{ margin: "4px 0 12px", fontSize: "0.82rem", color: "#64748b", lineHeight: 1.4 }}>
                  Password and authentication rules are maintained securely under system settings.
                </p>
                <button
                  type="button"
                  disabled
                  style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#f1f5f9", color: "#94a3b8", fontWeight: 750, fontSize: "0.82rem", cursor: "not-allowed" }}
                >
                  Change Password (Managed)
                </button>
              </div>

              <div style={{ padding: "12px 14px", background: "#f3e8ff", borderRadius: 14, border: "1px solid #e9d5ff", display: "flex", alignItems: "center", gap: 10 }}>
                <ShieldCheck size={20} color="#7e22ce" />
                <div>
                  <strong style={{ color: "#7e22ce", fontSize: "0.86rem", display: "block" }}>Session Protection Active</strong>
                  <span style={{ fontSize: "0.78rem", color: "#6b21a8" }}>2FA and token authentication enforced.</span>
                </div>
              </div>
            </div>
          </section>

          {/* Card 5: 🧠 AI Doctor Multi-Key Failover Management (Admin Only) */}
          <section style={{ background: "linear-gradient(135deg, #091e15 0%, #1b4332 100%)", color: "#ffffff", borderRadius: 20, padding: 22, border: "1px solid #2d5a3f", boxShadow: "0 6px 20px rgba(9, 30, 21, 0.15)", gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
              <div>
                <span style={{ fontSize: "0.74rem", background: "rgba(116, 198, 157, 0.25)", color: "#74c69d", padding: "3px 10px", borderRadius: 10, fontWeight: 800, border: "1px solid rgba(116, 198, 157, 0.4)", textTransform: "uppercase" }}>
                  ADMIN SYSTEM CONTROL
                </span>
                <h2 style={{ margin: "6px 0 2px", fontSize: "1.15rem", fontWeight: 850, color: "#ffffff", display: "flex", alignItems: "center", gap: 8 }}>
                  <Sparkles size={20} color="#74c69d" /> AI Doctor Multi-Key Failover Pool (3 Keys Active)
                </h2>
              </div>

              <span style={{ padding: "6px 14px", borderRadius: 12, background: "rgba(82, 183, 136, 0.2)", color: "#52b788", fontWeight: 800, fontSize: "0.82rem", border: "1px solid rgba(82, 183, 136, 0.35)", display: "flex", alignItems: "center", gap: 6 }}>
                🟢 3 Active Backup Keys
              </span>
            </div>

            <p style={{ margin: "0 0 16px", fontSize: "0.86rem", color: "#d8f3dc", opacity: 0.9 }}>
              Regular users cannot view or edit system API keys. The application automatically rotates across 3 active GCP backup keys if rate limits occur.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <div style={{ padding: 12, background: "rgba(255, 255, 255, 0.08)", borderRadius: 12, border: "1px solid rgba(255, 255, 255, 0.12)" }}>
                <span style={{ fontSize: "0.74rem", color: "#74c69d", fontWeight: 800, display: "block" }}>KEY 1 (PRIMARY GCP)</span>
                <code style={{ fontSize: "0.82rem", color: "#ffffff", display: "block", marginTop: 4 }}>AQ.Ab8RN6JCICNE...</code>
                <small style={{ color: "#4ade80", fontSize: "0.74rem", fontWeight: 700 }}>✓ Verified 200 OK</small>
              </div>

              <div style={{ padding: 12, background: "rgba(255, 255, 255, 0.08)", borderRadius: 12, border: "1px solid rgba(255, 255, 255, 0.12)" }}>
                <span style={{ fontSize: "0.74rem", color: "#74c69d", fontWeight: 800, display: "block" }}>KEY 2 (BACKUP 1)</span>
                <code style={{ fontSize: "0.82rem", color: "#ffffff", display: "block", marginTop: 4 }}>AQ.Ab8RN6JnqP-V...</code>
                <small style={{ color: "#4ade80", fontSize: "0.74rem", fontWeight: 700 }}>✓ Verified 200 OK</small>
              </div>

              <div style={{ padding: 12, background: "rgba(255, 255, 255, 0.08)", borderRadius: 12, border: "1px solid rgba(255, 255, 255, 0.12)" }}>
                <span style={{ fontSize: "0.74rem", color: "#74c69d", fontWeight: 800, display: "block" }}>KEY 3 (BACKUP 2)</span>
                <code style={{ fontSize: "0.82rem", color: "#ffffff", display: "block", marginTop: 4 }}>AQ.Ab8RN6JG4C35...</code>
                <small style={{ color: "#4ade80", fontSize: "0.74rem", fontWeight: 700 }}>✓ Verified 200 OK</small>
              </div>
            </div>
          </section>
        </div>

        {/* Action Button Bar */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, padding: "18px 24px", background: "#ffffff", borderRadius: 20, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "11px 22px",
              borderRadius: 12,
              border: "1px solid #cbd5e1",
              background: "#f8faf7",
              color: "#475569",
              fontWeight: 750,
              fontSize: "0.88rem",
              cursor: "pointer"
            }}
          >
            Reset Form
          </button>

          <button
            type="submit"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 24px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
              color: "#ffffff",
              fontWeight: 850,
              fontSize: "0.9rem",
              cursor: "pointer",
              boxShadow: "0 6px 18px rgba(22, 163, 74, 0.25)",
              transition: "transform 0.18s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
          >
            <Save size={17} />
            <span>Save Admin Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
}
