import { AlertTriangle, CalendarDays, Droplets, Eye, Leaf, Sprout, TrendingUp, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PlantStatusBadge from "../components/PlantStatusBadge.jsx";
import SummaryCard from "../components/SummaryCard.jsx";
import { api } from "../services/api.js";
import { calculateAnalytics } from "../utils/analyticsUtils.js";
import { calculateWateringStatus, formatDate, todayISO } from "../utils/wateringUtils.js";

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
  const [data, setData] = useState({ users: [], plants: [], history: [] });
  useEffect(() => {
    Promise.all([api.getUsers(), api.getAllPlants(), api.getHistory()]).then(([users, plants, history]) => setData({ users, plants, history }));
  }, []);

  const analytics = calculateAnalytics(data.plants, data.history);
  const usersById = useMemo(() => new Map(data.users.map((user) => [user.id, user])), [data.users]);
  const wateringActivity = useMemo(() => lastDays(7).map((date) => {
    const iso = dayKey(date);
    return {
      day: date.toLocaleDateString("en", { weekday: "short" }),
      Waterings: data.history.filter((item) => item.type === "watering" && item.date === iso).length
    };
  }), [data.history]);

  const healthRows = [
    { label: "Safe", value: analytics.statuses.Safe, className: "safe" },
    { label: "Needs Water", value: analytics.statuses["Water Soon"], className: "soon" },
    { label: "Overdue", value: analytics.statuses.Overdue, className: "overdue" }
  ];
  const totalPlants = Math.max(data.plants.length, 1);

  const attentionPlants = useMemo(() => data.plants
    .map((plant) => ({ ...plant, status: calculateWateringStatus(plant.lastWatered, plant.frequency) }))
    .filter((plant) => plant.status === "Water Soon" || plant.status === "Overdue")
    .sort((a, b) => (a.status === "Overdue" ? -1 : 1) - (b.status === "Overdue" ? -1 : 1))
  , [data.plants]);

  const recentActivity = useMemo(() => {
    const historyItems = data.history.map((item) => ({
      id: item.id,
      date: item.date,
      time: item.time,
      icon: item.type === "watering" ? Droplets : Leaf,
      title: item.type === "watering" ? "Plant watered" : "Care note added",
      description: item.plantName ? `${item.plantName}${item.text ? ` - ${item.text}` : ""}` : item.text || "Plant activity"
    }));
    const addedItems = data.plants.map((plant) => ({
      id: `${plant.id}-created`,
      date: plant.createdAt,
      time: "09:00",
      icon: Sprout,
      title: "Plant added",
      description: plant.name
    }));
    return [...historyItems, ...addedItems]
      .filter((item) => item.date)
      .sort((a, b) => toTimeValue(b) - toTimeValue(a))
      .slice(0, 5);
  }, [data.history, data.plants]);

  const growthData = useMemo(() => lastDays(30).filter((_, index) => index % 5 === 0 || index === 29).map((date) => {
    const iso = dayKey(date);
    return {
      day: dayLabel(date),
      Users: data.users.filter((user) => (user.createdDate || "") <= iso).length,
      Plants: data.plants.filter((plant) => (plant.createdAt || "") <= iso).length
    };
  }), [data.users, data.plants]);

  return (
    <>
      <section className="page-title"><p className="eyebrow">System overview</p><h1>Admin Dashboard</h1></section>
      <section className="summary-grid admin-summary">
        <SummaryCard icon={Users} label="Total Users" value={data.users.length} to="/admin/users" action="View users" />
        <SummaryCard icon={Leaf} label="Total Plants" value={data.plants.length} to="/admin/plants" action="View plants" />
        <SummaryCard icon={Sprout} label="Safe" value={analytics.statuses.Safe} to="/admin/plants?status=Safe" action="Filter plants" />
        <SummaryCard icon={Sprout} label="Needs Water" value={analytics.statuses["Water Soon"]} tone="yellow" to="/admin/plants?status=Water%20Soon" action="Filter plants" />
        <SummaryCard icon={AlertTriangle} label="Overdue" value={analytics.statuses.Overdue} tone="red" to="/admin/plants?status=Overdue" action="Filter plants" />
      </section>

      <section className="admin-dashboard-grid">
        <article className="panel chart-panel admin-chart-card">
          <h2><Droplets size={19} /> Watering Activity</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={wateringActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dbe8dc" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="Waterings" fill="#2f6b3f" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="panel admin-health-card">
          <h2><Leaf size={19} /> Plant Health</h2>
          <div className="health-list">
            {healthRows.map((row) => {
              const percent = Math.round((row.value / totalPlants) * 100);
              return (
                <div className="health-row" key={row.label}>
                  <div><span className={`health-dot ${row.className}`} /> <strong>{row.label}</strong><span>{row.value}</span></div>
                  <div className="health-meter" aria-label={`${row.label} ${percent}%`}><span className={row.className} style={{ width: `${percent}%` }} /></div>
                  <small>{percent}% of plants</small>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="panel attention-card">
        <div className="section-head">
          <h2><AlertTriangle size={19} /> Plants Needing Attention</h2>
          <Link className="ghost-btn" to="/admin/plants?status=Water%20Soon">Review all</Link>
        </div>
        {attentionPlants.length ? (
          <div className="attention-table">
            <div className="attention-head"><span>Plant</span><span>Owner</span><span>Status</span><span>Action</span></div>
            {attentionPlants.map((plant) => (
              <div className="attention-row" key={plant.id}>
                <strong><span className="plant-mini-icon">{plant.icon || "P"}</span>{plant.name}</strong>
                <span>{usersById.get(plant.userId)?.name || "Unknown"}</span>
                <PlantStatusBadge status={plant.status} />
                <Link className="ghost-btn" to={`/plant/${plant.id}`}><Eye size={15} /> View</Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-inline">No plants need attention right now.</p>
        )}
      </section>

      <section className="admin-dashboard-grid bottom">
        <article className="panel recent-card">
          <h2><CalendarDays size={19} /> Recent Activity</h2>
          {recentActivity.length ? (
            <ul className="activity-list">
              {recentActivity.map(({ id, icon: Icon, title, description, date, time }) => (
                <li key={id}>
                  <span className="activity-icon"><Icon size={17} /></span>
                  <div>
                    <strong>{title}</strong>
                    <p>{description}</p>
                    <small>{formatDate(date)}{time ? ` at ${time}` : ""}</small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-inline">No recent activity yet.</p>
          )}
        </article>

        <article className="panel chart-panel admin-chart-card">
          <h2><TrendingUp size={19} /> User / Plant Growth</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dbe8dc" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Users" stroke="#2f6b3f" strokeWidth={3} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Plants" stroke="#6fa86f" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </article>
      </section>
    </>
  );
}
