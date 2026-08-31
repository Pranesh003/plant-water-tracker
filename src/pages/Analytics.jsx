import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Award, BarChart3, Droplets, Flame, Leaf } from "lucide-react";
import { useMemo, useState } from "react";
import AnalyticsCard from "../components/AnalyticsCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Pagination from "../components/Pagination.jsx";
import { usePlantCare } from "../App.jsx";
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
  const { plants, history } = usePlantCare();
  const [range, setRange] = useState("7");
  const analytics = calculateAnalytics(plants, history);
  const statusData = Object.entries(analytics.statuses).map(([name, value]) => ({ name, value }));
  const leaderboard = [...plants].sort((a, b) => b.currentStreak - a.currentStreak);
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const paginatedLeaderboard = useMemo(() => leaderboard.slice((leaderboardPage - 1) * PAGE_SIZE, leaderboardPage * PAGE_SIZE), [leaderboard, leaderboardPage]);
  if (!plants.length) return <EmptyState title="No analytics yet." message="Add plants and water them to see care insights." action="Add Plant" to="/add-plant" />;
  return (
    <>
      <section className="page-title">
        <p className="eyebrow">PLANT INSIGHTS</p>
        <h1 style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span>Analytics</span>
          <img src="/analytics_icon.png" alt="Analytics Icon" style={{ width: 34, height: 34, objectFit: "contain" }} />
        </h1>
      </section>
      <section className="analytics-grid"><AnalyticsCard title="Total Plants" value={plants.length} /><AnalyticsCard title="Total Waterings" value={analytics.totalWaterings} /><AnalyticsCard title="Current Active Streak" value={`${analytics.currentActiveStreak} days`} /><AnalyticsCard title="Best Streak" value={`${analytics.bestStreak} days`} /><AnalyticsCard title="Watering Consistency" value={`${analytics.consistency}%`} /></section>
      <section className="chart-grid"><div className="panel chart-panel"><div className="chart-head"><h2><Droplets size={19} /> Watering Activity</h2><select value={range} onChange={(e) => setRange(e.target.value)}><option value="7">7 days</option><option value="30">30 days</option></select></div><ResponsiveContainer width="100%" height={260}><BarChart data={activityData(history, Number(range))}><CartesianGrid strokeDasharray="3 3" stroke="#dbe8dc" /><XAxis dataKey="day" interval={range === "30" ? 4 : 0} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="waterings" fill="#2F6B3F" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div><div className="panel chart-panel"><h2><BarChart3 size={19} /> Plant Status</h2><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={4}>{statusData.map((entry) => <Cell key={entry.name} fill={colors[entry.name]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div></section>
      <section className="insight-grid"><div className="panel top-plant"><Award size={34} /><p>Most Consistent Plant</p><h2 style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>{analytics.topPlant && <img src={getPlantIconUrl(analytics.topPlant)} alt="" style={{ width: 28, height: 28, objectFit: "contain" }} />}<span>{analytics.topPlant?.name}</span></h2><strong>{analytics.topPlant?.consistency}% watering consistency</strong></div><div className="panel leaderboard"><h2><Flame size={19} /> Streak Leaderboard</h2>{paginatedLeaderboard.map((plant, index) => <div key={plant.id}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>{((leaderboardPage - 1) * PAGE_SIZE) + index + 1}. <img src={getPlantIconUrl(plant)} alt="" style={{ width: 22, height: 22, objectFit: "contain" }} /> {plant.name}</span><strong>{plant.currentStreak} days</strong></div>)}<Pagination page={leaderboardPage} totalItems={leaderboard.length} pageSize={PAGE_SIZE} onPageChange={setLeaderboardPage} /></div><div className="panel leaderboard"><h2><Leaf size={19} /> Consistency</h2><p className="large-percent">{analytics.consistency}%</p><small>Completed on time across your active plant family.</small></div></section>
    </>
  );
}
