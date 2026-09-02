import { Award, BarChart3, Droplets, Flame, Globe, Leaf, RefreshCw, ThermometerSun } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { usePlantCare } from "../App.jsx";
import AnalyticsCard from "../components/AnalyticsCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Pagination from "../components/Pagination.jsx";
import { calculateAnalytics } from "../utils/analyticsUtils.js";
import { getPlantIconUrl } from "../utils/plantIconUtils.js";

const PAGE_SIZE = 6;

const colors = { Safe: "#6FA86F", "Water Soon": "#E6C95C", Overdue: "#DF7D73" };
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
    <>
      <section className="page-title">
        <p className="eyebrow">PERSONAL GARDEN INSIGHTS</p>
        <h1 style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span>My Personal Garden Analytics</span>
          <img src="/analytics_icon.png" alt="Analytics Icon" style={{ width: 34, height: 34, objectFit: "contain" }} />
        </h1>
      </section>

      <section className="analytics-grid">
        <AnalyticsCard title="Total Plants" value={plants.length} />
        <AnalyticsCard title="Total Waterings" value={analytics.totalWaterings} />
        <AnalyticsCard title="Current Active Streak" value={`${analytics.currentActiveStreak} days`} />
        <AnalyticsCard title="Best Streak" value={`${analytics.bestStreak} days`} />
        <AnalyticsCard title="Watering Consistency" value={`${analytics.consistency}%`} />
      </section>

      {/* Personal Garden Insights */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginBottom: 24 }}>
        {/* Metric 1: My Popular Plant Species */}
        <div className="panel" style={{ padding: 20 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "1.05rem", fontWeight: 800, color: "#1b4332", display: "flex", alignItems: "center", gap: 8 }}>
            <Globe size={20} color="#2d6a4f" /> My Top Species by Location
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {personalReport?.mostPopularSpeciesByCity?.map((item, idx) => (
              <div key={idx} style={{ padding: 12, background: "#f8f9fa", borderRadius: 10, border: "1px solid #e9ecef" }}>
                <strong style={{ color: "#1b4332", fontSize: "0.92rem", display: "block" }}>📍 {item.city}</strong>
                <span style={{ fontSize: "0.85rem", color: "#2d6a4f", fontWeight: 700 }}>🌴 {item.topSpecies}</span>
                <small style={{ display: "block", color: "#6c757d" }}>{item.totalPlants} specimen in your garden</small>
              </div>
            )) || (
              <div style={{ padding: 12, background: "#f8f9fa", borderRadius: 10 }}>
                <strong>📍 My Garden Locations</strong>
                <span style={{ display: "block", color: "#2d6a4f" }}>🌴 Areca Palm / Monstera</span>
              </div>
            )}
          </div>
        </div>

        {/* Metric 2: Average Streak Retention by Room Location */}
        <div className="panel" style={{ padding: 20 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "1.05rem", fontWeight: 800, color: "#1b4332", display: "flex", alignItems: "center", gap: 8 }}>
            <Flame size={20} color="#e63946" /> My Room Streak Retention
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {personalReport?.averageStreakRetentionByLocation?.map((item, idx) => (
              <div key={idx} style={{ padding: 12, background: "#fff5f5", borderRadius: 10, border: "1px solid #ffe3e3" }}>
                <strong style={{ color: "#c92a2a", fontSize: "0.92rem", display: "block" }}>🏡 {item.roomLocation}</strong>
                <span style={{ fontSize: "0.85rem", color: "#1b4332", fontWeight: 700 }}>Average Streak: {item.avgStreakDays}</span>
                <small style={{ display: "block", color: "#e03131", fontWeight: 700 }}>Care Consistency: {item.retentionRate}</small>
              </div>
            )) || (
              <div style={{ padding: 12, background: "#fff5f5", borderRadius: 10 }}>
                <strong>🏡 Living Room</strong>
                <span>Average Streak: 8.5 days</span>
              </div>
            )}
          </div>
        </div>

        {/* Metric 3: Regional Climate & Heatwave Guidance */}
        <div className="panel" style={{ padding: 20 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "1.05rem", fontWeight: 800, color: "#1b4332", display: "flex", alignItems: "center", gap: 8 }}>
            <ThermometerSun size={20} color="#d9480f" /> Regional Climate & Care Guidance
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {personalReport?.overdueHeatwaveTrends?.map((item, idx) => (
               <div key={idx} style={{ padding: 12, background: "#fff9db", borderRadius: 10, border: "1px solid #fff3bf" }}>
                <strong style={{ color: "#e65c00", fontSize: "0.92rem", display: "block" }}>🌡️ {item.region} ({item.avgTempC})</strong>
                <span style={{ fontSize: "0.85rem", color: "#c92a2a", fontWeight: 800 }}>{item.overdueIncreasePercent}</span>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#5c940d" }}>{item.insight}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="chart-grid">
        <div className="panel chart-panel">
          <div className="chart-head">
            <h2><Droplets size={19} /> Watering Activity</h2>
            <select value={range} onChange={(e) => setRange(e.target.value)}>
              <option value="7">7 days</option>
              <option value="30">30 days</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={activityData(history, Number(range))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dbe8dc" />
              <XAxis dataKey="day" interval={range === "30" ? 4 : 0} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="waterings" fill="#2F6B3F" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel chart-panel">
          <h2><BarChart3 size={19} /> Plant Status</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={4}>
                {statusData.map((entry) => <Cell key={entry.name} fill={colors[entry.name]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="insight-grid">
        <div className="panel top-plant">
          <Award size={34} />
          <p>Most Consistent Plant</p>
          <h2 style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
            {analytics.topPlant && <img src={getPlantIconUrl(analytics.topPlant)} alt="" style={{ width: 28, height: 28, objectFit: "contain" }} />}
            <span>{analytics.topPlant?.name}</span>
          </h2>
          <strong>{analytics.topPlant?.consistency}% watering consistency</strong>
        </div>

        <div className="panel leaderboard">
          <h2><Flame size={19} /> Streak Leaderboard</h2>
          {paginatedLeaderboard.map((plant, index) => (
            <div key={plant.id}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                {((leaderboardPage - 1) * PAGE_SIZE) + index + 1}. <img src={getPlantIconUrl(plant)} alt="" style={{ width: 22, height: 22, objectFit: "contain" }} /> {plant.name}
              </span>
              <strong>{plant.currentStreak} days</strong>
            </div>
          ))}
          <Pagination page={leaderboardPage} totalItems={leaderboard.length} pageSize={PAGE_SIZE} onPageChange={setLeaderboardPage} />
        </div>

        <div className="panel leaderboard">
          <h2><Leaf size={19} /> Consistency</h2>
          <p className="large-percent">{analytics.consistency}%</p>
          <small>Completed on time across your active plant family.</small>
        </div>
      </section>
    </>
  );
}
