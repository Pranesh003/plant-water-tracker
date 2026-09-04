import { Award, BarChart3, Calendar, Droplets, Flame, Globe, History as HistoryIcon, Leaf, RefreshCw, ThermometerSun } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { usePlantCare } from "../App.jsx";
import AnalyticsCard from "../components/AnalyticsCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Pagination from "../components/Pagination.jsx";
import { calculateAnalytics } from "../utils/analyticsUtils.js";
import { getPlantIconUrl } from "../utils/plantIconUtils.js";

const PAGE_SIZE = 6;

const colors = { Safe: "#16a34a", "Water Soon": "#d97706", Overdue: "#dc2626" };

const formatLocation = (locStr) => {
  if (!locStr) return "Indoor";
  return locStr
    .split(",")
    .map(part => part.trim().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" "))
    .join(", ");
};

const sanitizeRegionText = (str) => {
  if (!str) return "";
  return str.replace(/\(\(/g, "(").replace(/\)\)/g, ")");
};

const activityData = (history, days) => Array.from({ length: days }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() - (days - 1 - index));
  const iso = date.toISOString().slice(0, 10);
  return { day: days === 7 ? date.toLocaleDateString("en", { weekday: "short" }) : `${date.getMonth() + 1}/${date.getDate()}`, waterings: history.filter((item) => item.type === "watering" && item.date === iso).length };
});

export default function Analytics() {
  const { plants, history, user } = usePlantCare();
  const [range, setRange] = useState("7");
  const [personalReport, setPersonalReport] = useState(null);

  const analytics = calculateAnalytics(plants, history);
  const statusData = Object.entries(analytics.statuses).map(([name, value]) => ({ name, value }));
  const leaderboard = [...plants].sort((a, b) => b.currentStreak - a.currentStreak);
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const paginatedLeaderboard = useMemo(() => leaderboard.slice((leaderboardPage - 1) * PAGE_SIZE, leaderboardPage * PAGE_SIZE), [leaderboard, leaderboardPage]);

  useEffect(() => {
    const url = user?.id
      ? `https://plant-care-service-358974981913.asia-south1.run.app/api/analytics/bigquery-report?userId=${user.id}`
      : "https://plant-care-service-358974981913.asia-south1.run.app/api/analytics/bigquery-report";

    fetch(url)
      .then((res) => res.json())
      .then((data) => setPersonalReport(data))
      .catch(() => setPersonalReport(null));
  }, [user?.id]);

  if (!plants.length) return <EmptyState title="No analytics yet." message="Add plants and water them to see care insights." action="Add Plant" to="/add-plant" />;

  return (
    <div className="analytics-page-container">
      {/* Page Header */}
      <header className="dashboard-top-header">
        <div>
          <span className="eyebrow-tag">PERSONAL GARDEN INSIGHTS</span>
          <h1 style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", margin: "4px 0" }}>
            <span>My Personal Garden Analytics</span>
            <img src="/analytics_icon.png" alt="Analytics Icon" style={{ width: 32, height: 32, objectFit: "contain" }} />
          </h1>
          <p>Real-time analytics, watering consistency, species breakdown, and regional climate trends.</p>
        </div>
      </header>

      {/* 5 Summary Metric Cards */}
      <section className="summary-grid-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div className="dash-metric-card">
          <div className="metric-icon-circle green">
            <Leaf size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Plants</span>
            <strong className="metric-value">{plants.length}</strong>
            <span className="metric-subtext">Active garden specimens</span>
          </div>
        </div>

        <div className="dash-metric-card">
          <div className="metric-icon-circle green-soft">
            <Droplets size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Waterings</span>
            <strong className="metric-value">{analytics.totalWaterings}</strong>
            <span className="metric-subtext">Hydration events logged</span>
          </div>
        </div>

        <div className="dash-metric-card">
          <div className="metric-icon-circle yellow">
            <Flame size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Active Streak</span>
            <strong className="metric-value">{analytics.currentActiveStreak} days</strong>
            <span className="metric-subtext">Current care streak</span>
          </div>
        </div>

        <div className="dash-metric-card">
          <div className="metric-icon-circle red">
            <Award size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Best Streak</span>
            <strong className="metric-value">{analytics.bestStreak} days</strong>
            <span className="metric-subtext">All-time record</span>
          </div>
        </div>

        <div className="dash-metric-card">
          <div className="metric-icon-circle green">
            <BarChart3 size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Watering Consistency</span>
            <strong className="metric-value">{analytics.consistency}%</strong>
            <span className="metric-subtext">On-time care rate</span>
          </div>
        </div>
      </section>

      {/* Personal Garden Insights (3 Column Cards) */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginBottom: 24 }}>
        {/* Metric 1: My Popular Plant Species by Location */}
        <div style={{ background: "#ffffff", borderRadius: 20, padding: 20, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "1.05rem", fontWeight: 850, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
            <Globe size={20} color="#16a34a" /> My Top Species by Location
          </h3>
          <div className="custom-scroll" style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 290, overflowY: "auto" }}>
            {personalReport?.mostPopularSpeciesByCity?.map((item, idx) => (
              <div key={idx} style={{ padding: "12px 14px", background: "#f8faf7", borderRadius: 14, border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ color: "#0f172a", fontSize: "0.94rem" }}>📍 {formatLocation(item.city)}</strong>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, background: "#f0fdf4", color: "#16a34a", padding: "2px 8px", borderRadius: 12, border: "1px solid #bbf7d0" }}>
                    {item.totalPlants} plant{item.totalPlants === 1 ? "" : "s"}
                  </span>
                </div>
                <span style={{ fontSize: "0.86rem", color: "#16a34a", fontWeight: 700, display: "block", marginTop: 4 }}>🌴 {item.topSpecies}</span>
              </div>
            )) || (
              <div style={{ padding: 14, background: "#f8faf7", borderRadius: 14, border: "1px solid #e2e8f0" }}>
                <strong style={{ color: "#0f172a" }}>📍 My Garden Locations</strong>
                <span style={{ display: "block", color: "#16a34a", fontWeight: 700, marginTop: 4 }}>🌴 Areca Palm / Monstera</span>
              </div>
            )}
          </div>
        </div>

        {/* Metric 2: Average Streak Retention by Room Location */}
        <div style={{ background: "#ffffff", borderRadius: 20, padding: 20, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "1.05rem", fontWeight: 850, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
            <Flame size={20} color="#ea580c" /> My Room Streak Retention
          </h3>
          <div className="custom-scroll" style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 290, overflowY: "auto" }}>
            {personalReport?.averageStreakRetentionByLocation?.map((item, idx) => (
              <div key={idx} style={{ padding: "12px 14px", background: "#fff7ed", borderRadius: 14, border: "1px solid #ffedd5" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ color: "#c2410c", fontSize: "0.94rem" }}>🏡 {formatLocation(item.roomLocation)}</strong>
                  <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#ea580c" }}>{item.retentionRate}</span>
                </div>
                <span style={{ fontSize: "0.84rem", color: "#475569", fontWeight: 600, display: "block", marginTop: 4 }}>Average Streak: <strong>{item.avgStreakDays}</strong></span>
              </div>
            )) || (
              <div style={{ padding: 14, background: "#fff7ed", borderRadius: 14, border: "1px solid #ffedd5" }}>
                <strong style={{ color: "#c2410c" }}>🏡 Living Room</strong>
                <span style={{ display: "block", color: "#475569", marginTop: 4 }}>Average Streak: 8.5 days</span>
              </div>
            )}
          </div>
        </div>

        {/* Metric 3: Regional Climate & Heatwave Guidance */}
        <div style={{ background: "#ffffff", borderRadius: 20, padding: 20, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "1.05rem", fontWeight: 850, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
            <ThermometerSun size={20} color="#d97706" /> Regional Climate Guidance
          </h3>
          <div className="custom-scroll" style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 290, overflowY: "auto" }}>
            {personalReport?.overdueHeatwaveTrends?.map((item, idx) => (
              <div key={idx} style={{ padding: "12px 14px", background: "#fffbe6", borderRadius: 14, border: "1px solid #ffe58f" }}>
                <strong style={{ color: "#b45309", fontSize: "0.92rem", display: "block" }}>🌡️ {sanitizeRegionText(item.region)}</strong>
                <span style={{ fontSize: "0.82rem", color: "#dc2626", fontWeight: 800, display: "inline-block", marginTop: 2 }}>{item.overdueIncreasePercent}</span>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#475569", lineHeight: 1.4 }}>{item.insight}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recharts Charts Grid */}
      <section className="chart-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20, marginBottom: 24 }}>
        <div style={{ background: "#ffffff", borderRadius: 20, padding: 20, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 850, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
              <Droplets size={19} color="#0284c7" /> Watering Activity
            </h3>
            <select value={range} onChange={(e) => setRange(e.target.value)} style={{ padding: "6px 12px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: "0.84rem", fontWeight: 600 }}>
              <option value="7">7 days</option>
              <option value="30">30 days</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={activityData(history, Number(range))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" interval={range === "30" ? 4 : 0} tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
              <Tooltip />
              <Bar dataKey="waterings" fill="#16a34a" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 20, padding: 20, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "1.05rem", fontWeight: 850, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
            <BarChart3 size={19} color="#16a34a" /> Plant Health Status
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={4}>
                {statusData.map((entry) => <Cell key={entry.name} fill={colors[entry.name] || "#16a34a"} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Bottom Insights Row */}
      <section className="insight-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
        <div style={{ background: "#ffffff", borderRadius: 20, padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f0fdf4", color: "#16a34a", display: "grid", placeItems: "center", margin: "0 auto 12px" }}>
            <Award size={30} />
          </div>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Most Consistent Plant</p>
          <h3 style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", margin: "6px 0", fontSize: "1.2rem", fontWeight: 850, color: "#0f172a" }}>
            {analytics.topPlant && <img src={getPlantIconUrl(analytics.topPlant)} alt="" style={{ width: 28, height: 28, objectFit: "contain" }} />}
            <span>{analytics.topPlant?.name || "None yet"}</span>
          </h3>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#16a34a" }}>{analytics.topPlant?.consistency || 100}% watering consistency</span>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 20, padding: 20, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: "1.05rem", fontWeight: 850, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
            <Flame size={19} color="#ea580c" /> Streak Leaderboard
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {paginatedLeaderboard.map((plant, index) => (
              <div key={plant.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f8faf7", borderRadius: 12, border: "1px solid #f1f5f9" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "0.88rem", fontWeight: 700, color: "#0f172a" }}>
                  {((leaderboardPage - 1) * PAGE_SIZE) + index + 1}. <img src={getPlantIconUrl(plant)} alt="" style={{ width: 22, height: 22, objectFit: "contain" }} /> {plant.name}
                </span>
                <strong style={{ fontSize: "0.85rem", color: "#ea580c" }}>{plant.currentStreak} {plant.currentStreak === 1 ? "day" : "days"}</strong>
              </div>
            ))}
          </div>
          <Pagination page={leaderboardPage} totalItems={leaderboard.length} pageSize={PAGE_SIZE} onPageChange={setLeaderboardPage} />
        </div>

        <div style={{ background: "#ffffff", borderRadius: 20, padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)", textAlign: "center" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "1.05rem", fontWeight: 850, color: "#0f172a", display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
            <Leaf size={19} color="#16a34a" /> Overall Consistency
          </h3>
          <p style={{ fontSize: "2.8rem", fontWeight: 900, color: "#16a34a", margin: "8px 0" }}>{analytics.consistency}%</p>
          <small style={{ color: "#64748b", fontSize: "0.82rem" }}>Completed on time across your active plant family.</small>
        </div>
      </section>
    </div>
  );
}
