import { AlertTriangle, CalendarDays, Droplets, ExternalLink, Eye, Flame, Globe, Leaf, ShieldCheck, Sprout, TrendingUp, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AdminHeader } from "../components/AdminSidebar.jsx";
import PlantStatusBadge from "../components/PlantStatusBadge.jsx";
import { api } from "../services/api.js";
import { calculateAnalytics } from "../utils/analyticsUtils.js";
import { calculateWateringStatus, formatDate, todayISO } from "../utils/wateringUtils.js";
import { getPlantIconUrl } from "../utils/plantIconUtils.js";

const dayKey = (date) => date.toISOString().slice(0, 10);
const dayLabel = (date) => date.toLocaleDateString("en", { month: "short", day: "numeric" });

const lastDays = (days) => Array.from({ length: days }, (_, index) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - (days - 1 - index));
  return date;
});

const toTimeValue = (item) => new Date(`${item.date || todayISO()}T${item.time || "12:00"}`).getTime();

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState({ users: [], plants: [], history: [] });

  useEffect(() => {
    Promise.all([api.getUsers(), api.getAllPlants(), api.getHistory()]).then(([users, plants, history]) => setData({ users, plants, history }));
  }, []);

  const analytics = calculateAnalytics(data.plants, data.history);
  const usersById = useMemo(() => new Map(data.users.map((user) => [user.id, user])), [data.users]);
  const plantsById = useMemo(() => new Map(data.plants.map((plant) => [plant.id, plant])), [data.plants]);

  const wateringActivity = useMemo(() => lastDays(7).map((date) => {
    const iso = dayKey(date);
    return {
      day: date.toLocaleDateString("en", { weekday: "short" }),
      Waterings: data.history.filter((item) => item.type === "watering" && item.date === iso).length
    };
  }), [data.history]);

  const healthRows = [
    { label: "Safe", value: analytics.statuses.Safe, className: "safe", dotColor: "#16a34a", bg: "#f0fdf4" },
    { label: "Needs Water", value: analytics.statuses["Water Soon"], className: "soon", dotColor: "#d97706", bg: "#fffbe6" },
    { label: "Overdue", value: analytics.statuses.Overdue, className: "overdue", dotColor: "#dc2626", bg: "#fef2f2" }
  ];
  const totalPlants = Math.max(data.plants.length, 1);

  const attentionPlants = useMemo(() => data.plants
    .map((plant) => ({ ...plant, status: calculateWateringStatus(plant.lastWatered, plant.frequency) }))
    .filter((plant) => plant.status === "Water Soon" || plant.status === "Overdue")
    .sort((a, b) => (a.status === "Overdue" ? -1 : 1) - (b.status === "Overdue" ? -1 : 1))
  , [data.plants]);

  const recentActivity = useMemo(() => {
    const historyItems = data.history.map((item) => {
      const plant = plantsById.get(item.plantId);
      const userId = item.userId || plant?.userId;
      const userName = usersById.get(userId)?.name || "User";
      return {
        id: item.id,
        date: item.date,
        time: item.time,
        userName,
        icon: item.type === "watering" ? Droplets : Leaf,
        title: item.type === "watering" ? "Plant watered" : "Care note added",
        description: item.plantName ? `${item.plantName}${item.text ? ` - ${item.text}` : ""}` : item.text || "Plant activity"
      };
    });
    const addedItems = data.plants.map((plant) => {
      const userName = usersById.get(plant.userId)?.name || "User";
      return {
        id: `${plant.id}-created`,
        date: plant.createdAt,
        time: "09:00",
        userName,
        icon: Sprout,
        title: "Plant added",
        description: plant.name
      };
    });
    return [...historyItems, ...addedItems]
      .filter((item) => item.date)
      .sort((a, b) => toTimeValue(b) - toTimeValue(a))
      .slice(0, 10);
  }, [data.history, data.plants, usersById, plantsById]);

  const growthData = useMemo(() => lastDays(30).filter((_, index) => index % 5 === 0 || index === 29).map((date) => {
    const iso = dayKey(date);
    return {
      day: dayLabel(date),
      Users: data.users.filter((user) => (user.createdDate || "") <= iso).length,
      Plants: data.plants.filter((plant) => (plant.createdAt || "") <= iso).length
    };
  }), [data.users, data.plants]);

  return (
    <div className="admin-dashboard-view" style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 40 }}>
      <AdminHeader title="Admin Dashboard" eyebrow="SYSTEM OVERVIEW" />

      {/* 5 Top Summary Metric Cards Row */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div
          onClick={() => navigate("/admin/users")}
          style={{
            background: "#ffffff",
            borderRadius: 20,
            padding: "18px 20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: "#e0f2fe", color: "#0284c7", display: "grid", placeItems: "center" }}>
              <Users size={22} />
            </div>
            <div>
              <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 700, display: "block" }}>Total Users</span>
              <strong style={{ fontSize: "1.5rem", fontWeight: 850, color: "#0f172a", lineHeight: 1.1 }}>{data.users.length}</strong>
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: "0.78rem", fontWeight: 700, color: "#0284c7", display: "flex", alignItems: "center", gap: 4 }}>
            View users →
          </div>
        </div>

        <div
          onClick={() => navigate("/admin/plants")}
          style={{
            background: "#ffffff",
            borderRadius: 20,
            padding: "18px 20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: "#f0fdf4", color: "#16a34a", display: "grid", placeItems: "center" }}>
              <Leaf size={22} />
            </div>
            <div>
              <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 700, display: "block" }}>Total Plants</span>
              <strong style={{ fontSize: "1.5rem", fontWeight: 850, color: "#0f172a", lineHeight: 1.1 }}>{data.plants.length}</strong>
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: "0.78rem", fontWeight: 700, color: "#16a34a", display: "flex", alignItems: "center", gap: 4 }}>
            View plants →
          </div>
        </div>

        <div
          onClick={() => navigate("/admin/plants?status=Safe")}
          style={{
            background: "#ffffff",
            borderRadius: 20,
            padding: "18px 20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: "#dcfce7", color: "#15803d", display: "grid", placeItems: "center" }}>
              <Sprout size={22} />
            </div>
            <div>
              <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 700, display: "block" }}>Safe</span>
              <strong style={{ fontSize: "1.5rem", fontWeight: 850, color: "#15803d", lineHeight: 1.1 }}>{analytics.statuses.Safe}</strong>
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: "0.78rem", fontWeight: 700, color: "#64748b" }}>
            Filter plants
          </div>
        </div>

        <div
          onClick={() => navigate("/admin/plants?status=Water%20Soon")}
          style={{
            background: "#ffffff",
            borderRadius: 20,
            padding: "18px 20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: "#fef3c7", color: "#d97706", display: "grid", placeItems: "center" }}>
              <Droplets size={22} />
            </div>
            <div>
              <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 700, display: "block" }}>Needs Water</span>
              <strong style={{ fontSize: "1.5rem", fontWeight: 850, color: "#d97706", lineHeight: 1.1 }}>{analytics.statuses["Water Soon"]}</strong>
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: "0.78rem", fontWeight: 700, color: "#d97706" }}>
            Filter plants
          </div>
        </div>

        <div
          onClick={() => navigate("/admin/plants?status=Overdue")}
          style={{
            background: "#ffffff",
            borderRadius: 20,
            padding: "18px 20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: "#fee2e2", color: "#dc2626", display: "grid", placeItems: "center" }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 700, display: "block" }}>Overdue</span>
              <strong style={{ fontSize: "1.5rem", fontWeight: 850, color: "#dc2626", lineHeight: 1.1 }}>{analytics.statuses.Overdue}</strong>
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: "0.78rem", fontWeight: 700, color: "#dc2626" }}>
            Filter plants
          </div>
        </div>
      </section>

      {/* GCP BigQuery & Looker Studio Admin BI Dashboard */}
      <section style={{ padding: "24px 28px", marginBottom: 24, background: "linear-gradient(135deg, #091e15 0%, #1b4332 50%, #2d6a4f 100%)", color: "#ffffff", borderRadius: 20, border: "1px solid #2d5a3f", boxShadow: "0 10px 30px rgba(15,41,30,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <span style={{ fontSize: "0.78rem", background: "rgba(82, 183, 136, 0.2)", color: "#74c69d", padding: "5px 14px", borderRadius: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", border: "1px solid rgba(116, 198, 157, 0.3)" }}>
              📊 Admin BI Analytics (BigQuery + Looker Studio)
            </span>
            <h3 style={{ margin: "10px 0 6px", fontSize: "1.3rem", fontWeight: 850, color: "#ffffff", letterSpacing: "-0.01em" }}>
              Global Platform Analytics & Enterprise Reporting
            </h3>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "#d8f3dc", opacity: 0.95, maxWidth: 680, lineHeight: 1.5 }}>
              Aggregates all users, cities, room retention, and heatwave trends into GCP BigQuery dataset <code style={{ background: "rgba(0,0,0,0.4)", color: "#74c69d", padding: "2px 8px", borderRadius: 6, fontFamily: "monospace" }}>plant_analytics_db</code>.
            </p>
          </div>
          <a
            href="https://datastudio.google.com/reporting/9c8927e2-9477-4f48-a6d7-e73dbbc54129"
            target="_blank"
            rel="noreferrer"
            style={{
              background: "linear-gradient(135deg, #4285F4 0%, #34A853 100%)",
              color: "#ffffff",
              fontWeight: 850,
              padding: "12px 22px",
              borderRadius: 14,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 6px 20px rgba(52, 168, 83, 0.3)",
              transition: "transform 0.18s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
          >
            <span>Launch Looker Studio Admin BI</span>
            <ExternalLink size={16} />
          </a>
        </div>
      </section>

      {/* Middle Section (Watering Activity Chart + Plant Health Card) */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20, marginBottom: 24 }}>
        <article style={{ background: "#ffffff", borderRadius: 20, padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <h2 style={{ margin: "0 0 18px", fontSize: "1.05rem", fontWeight: 850, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
            <Droplets size={20} color="#0284c7" /> Watering Activity
          </h2>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={wateringActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tick={{ fontSize: 12, fill: "#64748b" }} />
              <Tooltip />
              <Bar dataKey="Waterings" fill="#16a34a" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article style={{ background: "#ffffff", borderRadius: 20, padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <h2 style={{ margin: "0 0 18px", fontSize: "1.05rem", fontWeight: 850, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
            <Leaf size={20} color="#16a34a" /> Plant Health Status
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 10 }}>
            {healthRows.map((row) => {
              const percent = Math.round((row.value / totalPlants) * 100) || 0;
              return (
                <div key={row.label} style={{ padding: "12px 14px", background: row.bg, borderRadius: 14, border: `1px solid ${row.dotColor}22` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, color: "#0f172a", fontSize: "0.92rem" }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: row.dotColor }} />
                      {row.label}
                    </span>
                    <strong style={{ fontSize: "1rem", color: "#0f172a", fontWeight: 850 }}>{row.value}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <small style={{ color: "#64748b", fontWeight: 650, fontSize: "0.78rem" }}>{percent}% of total plants</small>
                  </div>
                  <div style={{ width: "100%", height: 8, background: "rgba(0,0,0,0.06)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${percent}%`, height: "100%", background: row.dotColor, borderRadius: 999, transition: "width 0.4s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      {/* Plants Needing Attention Card */}
      <section style={{ background: "#ffffff", borderRadius: 20, padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 850, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={20} color="#dc2626" /> Plants Needing Attention
          </h2>
          <Link
            to="/admin/plants?status=Water%20Soon"
            style={{ fontSize: "0.82rem", fontWeight: 750, padding: "6px 14px", borderRadius: 10, background: "#f1f5f9", color: "#475569", textDecoration: "none" }}
          >
            Review all →
          </Link>
        </div>

        {attentionPlants.length ? (
          <div className="custom-scroll" style={{ maxHeight: 280, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left", fontSize: "0.82rem", color: "#64748b", fontWeight: 750 }}>
                  <th style={{ padding: "10px 12px" }}>Plant Name</th>
                  <th style={{ padding: "10px 12px" }}>Owner</th>
                  <th style={{ padding: "10px 12px" }}>Status</th>
                  <th style={{ padding: "10px 12px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {attentionPlants.map((plant) => (
                  <tr key={plant.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px", fontWeight: 750, color: "#0f172a" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <img src={getPlantIconUrl(plant)} alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />
                        <span>{plant.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px", color: "#475569", fontSize: "0.88rem", fontWeight: 600 }}>
                      {usersById.get(plant.userId)?.name || "Unknown"}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <PlantStatusBadge status={plant.status} />
                    </td>
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      <Link
                        to={`/plant/${plant.id}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "5px 12px",
                          borderRadius: 8,
                          background: "#f0fdf4",
                          color: "#16a34a",
                          fontWeight: 750,
                          fontSize: "0.8rem",
                          textDecoration: "none",
                          border: "1px solid #bbf7d0"
                        }}
                      >
                        <Eye size={14} /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ border: "1px dashed #cbd5e1", borderRadius: 16, padding: "28px 16px", textAlign: "center", background: "#f8faf7" }}>
            <p style={{ margin: 0, color: "#16a34a", fontWeight: 700, fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              🌿 All plants are healthy and properly watered right now!
            </p>
          </div>
        )}
      </section>

      {/* Bottom Section (Recent Activity Feed + User / Plant Growth Chart) */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20 }}>
        <article style={{ background: "#ffffff", borderRadius: 20, padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <h2 style={{ margin: "0 0 18px", fontSize: "1.05rem", fontWeight: 850, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
            <CalendarDays size={20} color="#16a34a" /> Recent Platform Activity
          </h2>
          {recentActivity.length ? (
            <div className="custom-scroll" style={{ maxHeight: 290, overflowY: "auto" }}>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {recentActivity.map(({ id, icon: Icon, title, description, userName, date, time }) => (
                  <li key={id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 12px", background: "#f8faf7", borderRadius: 14, border: "1px solid #f1f5f9" }}>
                    <span style={{ width: 34, height: 34, borderRadius: "50%", background: "#f0fdf4", color: "#16a34a", display: "grid", placeItems: "center", flexShrink: 0, border: "1px solid #bbf7d0" }}>
                      <Icon size={16} />
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                        <strong style={{ fontSize: "0.88rem", color: "#0f172a", fontWeight: 800 }}>{title}</strong>
                        <span style={{ fontSize: "0.72rem", background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: 8, fontWeight: 750 }}>
                          {userName}
                        </span>
                      </div>
                      <p style={{ margin: "2px 0 4px", fontSize: "0.83rem", color: "#475569", fontWeight: 500 }}>{description}</p>
                      <small style={{ fontSize: "0.74rem", color: "#94a3b8", fontWeight: 600 }}>{formatDate(date)}{time ? ` at ${time}` : ""}</small>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div style={{ border: "1px dashed #cbd5e1", borderRadius: 16, padding: "28px 16px", textAlign: "center", background: "#f8faf7" }}>
              <p style={{ margin: 0, color: "#64748b", fontWeight: 600, fontSize: "0.88rem" }}>No recent platform activity yet.</p>
            </div>
          )}
        </article>

        <article style={{ background: "#ffffff", borderRadius: 20, padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <h2 style={{ margin: "0 0 18px", fontSize: "1.05rem", fontWeight: 850, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={20} color="#0284c7" /> User & Plant Growth (30 Days)
          </h2>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tick={{ fontSize: 12, fill: "#64748b" }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Plants" stroke="#16a34a" strokeWidth={3} dot={{ r: 4, fill: "#16a34a" }} />
              <Line type="monotone" dataKey="Users" stroke="#0284c7" strokeWidth={3} dot={{ r: 4, fill: "#0284c7" }} />
            </LineChart>
          </ResponsiveContainer>
        </article>
      </section>
    </div>
  );
}
