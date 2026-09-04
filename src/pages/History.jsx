import { Calendar, Clock, Droplets, Flame, History as HistoryIcon, MessageSquare, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePlantCare } from "../App.jsx";
import EmptyState from "../components/EmptyState.jsx";
import HistoryItem from "../components/HistoryItem.jsx";
import Pagination from "../components/Pagination.jsx";
import LocationFilter from "../components/LocationFilter.jsx";
import { filterHistory } from "../utils/analyticsUtils.js";

const PAGE_SIZE = 8;

export default function History() {
  const { plants, history } = usePlantCare();
  const [plantId, setPlantId] = useState("All Plants");
  const [type, setType] = useState("All Activities");
  const [range, setRange] = useState("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // Summary Metrics
  const totalLogs = history.length;
  const wateringCount = useMemo(() => history.filter((item) => item.type === "watering" || (!item.type && !item.text)).length, [history]);
  const notesCount = useMemo(() => history.filter((item) => item.type === "note" || !!item.text).length, [history]);
  const streakMilestones = useMemo(() => history.filter((item) => item.type === "streak" || item.streak > 0).length, [history]);

  const filtered = useMemo(() => {
    let result = filterHistory(history, { plantId, type, range });
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter((item) => {
        const text = `${item.plantName || ""} ${item.text || ""} ${item.type || ""}`.toLowerCase();
        return text.includes(q);
      });
    }
    return result;
  }, [history, plantId, type, range, query]);

  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [plantId, type, range, query]);

  return (
    <div className="history-page-container">
      {/* Page Header */}
      <header className="dashboard-top-header">
        <div>
          <span className="eyebrow-tag">CARE TIMELINE</span>
          <h1 style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", margin: "4px 0" }}>
            <span>Plant Care History</span>
            <img src="/history_icon.png" alt="History Icon" style={{ width: 32, height: 32, objectFit: "contain" }} />
          </h1>
          <p>Full chronological audit log of all plant watering, notes, photos, and care streaks.</p>
        </div>
      </header>

      {/* 4 Summary Metric Cards */}
      <section className="summary-grid-cards" style={{ marginBottom: 20 }}>
        <div className="dash-metric-card" onClick={() => { setType("All Activities"); setRange("All"); }}>
          <div className="metric-icon-circle green">
            <HistoryIcon size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Logs</span>
            <strong className="metric-value">{totalLogs}</strong>
            <span className="metric-subtext">Care activities recorded</span>
          </div>
        </div>

        <div className="dash-metric-card" onClick={() => setType("Watering")}>
          <div className="metric-icon-circle green-soft">
            <Droplets size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Watering Events</span>
            <strong className="metric-value">{wateringCount}</strong>
            <span className="metric-subtext">Hydration logs</span>
          </div>
        </div>

        <div className="dash-metric-card" onClick={() => setType("Notes")}>
          <div className="metric-icon-circle yellow">
            <MessageSquare size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Notes & Photos</span>
            <strong className="metric-value">{notesCount}</strong>
            <span className="metric-subtext">Journal entries</span>
          </div>
        </div>

        <div className="dash-metric-card" onClick={() => setType("Streak")}>
          <div className="metric-icon-circle red">
            <Flame size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Streak Milestones</span>
            <strong className="metric-value">{streakMilestones}</strong>
            <span className="metric-subtext">Growth streak streaks</span>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="plant-filter-tabs-pills">
        {["All Activities", "Watering", "🧠 AI Doctor", "Notes", "Streak"].map((item) => (
          <button
            key={item}
            type="button"
            className={type === item ? "tab-pill active" : "tab-pill"}
            onClick={() => setType(item)}
          >
            {item}
          </button>
        ))}
      </section>

      {/* Floating Toolbar (Search + Plant Filter + Date Range) */}
      <section className="dashboard-floating-toolbar" style={{ marginTop: 16, marginBottom: 20 }}>
        <div className="floating-search-wrap" style={{ flex: 1 }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search care logs by plant name or text..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <select value={plantId} onChange={(e) => setPlantId(e.target.value)}>
          <option>All Plants</option>
          {plants.map((plant) => (
            <option value={plant.id} key={plant.id}>
              {plant.name}
            </option>
          ))}
        </select>

        <select value={range} onChange={(e) => setRange(e.target.value)}>
          <option value="All">All dates</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </section>

      {/* History Timeline Cards */}
      {filtered.length ? (
        <>
          <section className="timeline-container" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {paginated.map((item) => (
              <HistoryItem key={item.id} item={item} />
            ))}
          </section>
          <Pagination page={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState title="No care history found" message="Water a plant or add notes to build your garden history!" action="My Plants" to="/my-plants" />
      )}
    </div>
  );
}
