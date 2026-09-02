import { AlertTriangle, CalendarDays, Droplets, Eye, Leaf, Sprout, TrendingUp, Users } from "lucide-react";
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
    { label: "Safe", value: analytics.statuses.Safe, className: "safe", dotColor: "#1f4d2e" },
    { label: "Needs Water", value: analytics.statuses["Water Soon"], className: "soon", dotColor: "#d97706" },
    { label: "Overdue", value: analytics.statuses.Overdue, className: "overdue", dotColor: "#dc2626" }
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
      .slice(0, 6);
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
    <div className="admin-dashboard-view">
      <AdminHeader title="Admin Dashboard" eyebrow="SYSTEM OVERVIEW" />

      {/* 5 Top Summary Metric Cards Row */}
      <section className="summary-grid-cards admin-5-cards-row">
        <div className="dash-metric-card" onClick={() => navigate("/admin/users")}>
          <div className="metric-icon-circle green">
            <Users size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Users</span>
            <strong className="metric-value">{data.users.length}</strong>
            <span className="metric-link">View users</span>
          </div>
        </div>

        <div className="dash-metric-card" onClick={() => navigate("/admin/plants")}>
          <div className="metric-icon-circle green-soft">
            <Leaf size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Plants</span>
            <strong className="metric-value">{data.plants.length}</strong>
            <span className="metric-link">View plants</span>
          </div>
        </div>

        <div className="dash-metric-card" onClick={() => navigate("/admin/plants?status=Safe")}>
          <div className="metric-icon-circle green-soft">
            <Sprout size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Safe</span>
            <strong className="metric-value">{analytics.statuses.Safe}</strong>
            <span className="metric-subtext">Filter plants</span>
          </div>
        </div>

        <div className="dash-metric-card" onClick={() => navigate("/admin/plants?status=Water%20Soon")}>
          <div className="metric-icon-circle yellow">
            <Sprout size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Needs Water</span>
            <strong className="metric-value">{analytics.statuses["Water Soon"]}</strong>
            <span className="metric-subtext">Filter plants</span>
          </div>
        </div>

        <div className="dash-metric-card" onClick={() => navigate("/admin/plants?status=Overdue")}>
          <div className="metric-icon-circle red">
            <AlertTriangle size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Overdue</span>
            <strong className="metric-value">{analytics.statuses.Overdue}</strong>
            <span className="metric-subtext red-text">Filter plants</span>
          </div>
        </div>
      </section>

      {/* GCP BigQuery & Looker Studio Admin BI Dashboard */}
      <section className="panel" style={{ padding: "20px 24px", marginBottom: 24, background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)", color: "#ffffff", borderRadius: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <span style={{ fontSize: "0.78rem", background: "rgba(255, 255, 255, 0.2)", color: "#ffffff", padding: "4px 12px", borderRadius: 12, fontWeight: 700, textTransform: "uppercase" }}>
              📊 Admin BI Analytics (BigQuery + Looker Studio)
            </span>
            <h3 style={{ margin: "8px 0 4px", fontSize: "1.2rem", fontWeight: 800, color: "#ffffff" }}>
              Global Platform Analytics & Enterprise Reporting
            </h3>
            <p style={{ margin: 0, fontSize: "0.86rem", color: "#d8f3dc", opacity: 0.95 }}>
              Aggregates all users, cities, room retention, and heatwave trends into GCP BigQuery dataset <code style={{ background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: 4 }}>plant_analytics_db</code>.
            </p>
          </div>
          <a
            href="https://datastudio.google.com/reporting/9c8927e2-9477-4f48-a6d7-e73dbbc54129"
            target="_blank"
            rel="noreferrer"
            className="primary-btn"
            style={{ background: "linear-gradient(135deg, #4285F4 0%, #34A853 100%)", color: "#ffffff", fontWeight: 800, padding: "10px 18px", borderRadius: 12, textDecoration: "none" }}
          >
            Launch Looker Studio Admin BI
          </a>
        </div>
      </section>

      {/* Middle Section (Watering Activity Chart + Plant Health Card) */}
      <section className="admin-dashboard-grid top-charts">
        <article className="panel chart-panel admin-chart-card">
          <h2><Droplets size={19} /> Watering Activity</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={wateringActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e1ebe0" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} />
              <Tooltip />
              <Bar dataKey="Waterings" fill="#1f4d2e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="panel admin-health-card">
          <h2><Leaf size={19} /> Plant Health</h2>
          <div className="health-rows" style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 14 }}>
            {healthRows.map((row) => {
              const percent = Math.round((row.value / totalPlants) * 100) || 0;
              return (
                <div className="health-row-item" key={row.label}>
                  <div className="health-meta-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 750, color: "#1b4332", fontSize: "0.9rem" }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: row.dotColor }} />
                      {row.label}
                    </span>
                    <strong style={{ fontSize: "0.94rem", color: "#1b4332" }}>{row.value}</strong>
                  </div>
                  <small style={{ display: "block", color: "var(--muted)", marginBottom: 6, fontSize: "0.78rem" }}>{percent}% of plants</small>
                  <div className="health-meter-bg" style={{ width: "100%", height: 6, background: "#f0f7ef", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${percent}%`, height: "100%", background: row.dotColor, borderRadius: 999, transition: "width 0.4s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      {/* Plants Needing Attention Card */}
      <section className="panel attention-card" style={{ marginBottom: 24 }}>
        <div className="section-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#1b4332", display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={19} /> Plants Needing Attention
          </h2>
          <Link className="ghost-btn" to="/admin/plants?status=Water%20Soon" style={{ fontSize: "0.84rem", padding: "6px 14px", borderRadius: 12, background: "#f0f7ef" }}>Review all</Link>
        </div>
        {attentionPlants.length ? (
          <div className="attention-table">
            <div className="attention-head" style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr 1fr", padding: "10px 14px", fontWeight: 750, color: "var(--muted)", borderBottom: "1px solid #e1ebe0" }}>
              <span>Plant</span><span>Owner</span><span>Status</span><span>Action</span>
            </div>
            {attentionPlants.map((plant) => (
              <div className="attention-row" key={plant.id} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr 1fr", alignItems: "center", padding: "12px 14px", borderBottom: "1px solid #f0f7ef" }}>
                <strong><img src={getPlantIconUrl(plant)} alt="" style={{ width: 22, height: 22, objectFit: "contain", marginRight: 8, verticalAlign: "middle" }} />{plant.name}</strong>
                <span>{usersById.get(plant.userId)?.name || "Unknown"}</span>
                <PlantStatusBadge status={plant.status} />
                <Link className="ghost-btn" to={`/plant/${plant.id}`} style={{ padding: "4px 10px", fontSize: "0.8rem" }}><Eye size={14} /> View</Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="dashed-empty-container" style={{ border: "1px dashed #cfe2ce", borderRadius: 16, padding: "24px 16px", textAlign: "center", background: "#fbfdfb" }}>
            <p className="empty-inline" style={{ margin: 0, color: "#1b4332", fontWeight: 650, fontSize: "0.88rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              🌿 No plants need attention right now.
            </p>
          </div>
        )}
      </section>

      {/* Bottom Section (Recent Activity Feed + User / Plant Growth Chart) */}
      <section className="admin-dashboard-grid bottom-charts">
        <article className="panel recent-card">
          <h2><CalendarDays size={19} /> Recent Activity</h2>
          {recentActivity.length ? (
            <ul className="activity-list" style={{ listStyle: "none", padding: 0, margin: "14px 0 0 0", display: "flex", flexDirection: "column", gap: 14 }}>
              {recentActivity.map(({ id, icon: Icon, title, description, userName, date, time }) => (
                <li key={id} style={{ display: "flex", gap: 12, alignItems: "flex-start", paddingBottom: 12, borderBottom: "1px solid #f0f7ef" }}>
                  <span className="activity-icon" style={{ width: 34, height: 34, borderRadius: "50%", background: "#e8f3e7", color: "#1f4d2e", display: "grid", placeItems: "center" }}>
                    <Icon size={16} />
                  </span>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <strong style={{ fontSize: "0.9rem", color: "#1b4332" }}>{title}</strong>
                      <span style={{ fontSize: "0.74rem", background: "#edf6ed", color: "#1f4d2e", padding: "2px 8px", borderRadius: 8, fontWeight: 750 }}>
                        by {userName}
                      </span>
                    </div>
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>{description}</p>
                    <small style={{ fontSize: "0.76rem", color: "#748c7a" }}>{formatDate(date)}{time ? ` at ${time}` : ""}</small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="dashed-empty-container" style={{ border: "1px dashed #cfe2ce", borderRadius: 16, padding: "24px 16px", textAlign: "center", background: "#fbfdfb", marginTop: 14 }}>
              <p className="empty-inline" style={{ margin: 0, color: "var(--muted)", fontWeight: 550, fontSize: "0.88rem" }}>No recent activity yet.</p>
            </div>
          )}
        </article>

        <article className="panel chart-panel admin-chart-card">
          <h2><TrendingUp size={19} /> User / Plant Growth</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e1ebe0" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Plants" stroke="#1f4d2e" strokeWidth={3} dot={{ r: 4, fill: "#1f4d2e" }} />
              <Line type="monotone" dataKey="Users" stroke="#52b788" strokeWidth={3} dot={{ r: 4, fill: "#52b788" }} />
            </LineChart>
          </ResponsiveContainer>
        </article>
      </section>
    </div>
  );
}
