import { AlertTriangle, Bell, Calendar, Check, CheckCircle2, Clock, Droplets, MapPin, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePlantCare } from "../App.jsx";
import EmptyState from "../components/EmptyState.jsx";
import PlantStatusBadge from "../components/PlantStatusBadge.jsx";
import { calculateNextWateringDate, calculateWateringStatus, daysBetween, formatDate, isPlantWaterable, todayISO } from "../utils/wateringUtils.js";
import { getPlantIconUrl } from "../utils/plantIconUtils.js";

const formatLocation = (locStr) => {
  if (!locStr) return "Indoor";
  return locStr
    .split(",")
    .map(part => part.trim().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" "))
    .join(", ");
};

export default function Reminders() {
  const { plants, history, waterPlant, refresh, user } = usePlantCare();
  const navigate = useNavigate();
  const [filterTab, setFilterTab] = useState("all");
  const [query, setQuery] = useState("");
  const [wateredMap, setWateredMap] = useState({});

  // Calculate reminder status for each plant
  const reminderItems = useMemo(() => {
    return plants.map((plant) => {
      const status = calculateWateringStatus(plant.lastWatered, plant.frequency);
      const nextDate = calculateNextWateringDate(plant.lastWatered, plant.frequency);
      const isWateredToday = history.some((h) => h.plantId === plant.id && h.type === "watering" && h.date === todayISO());
      const isOverdue = status === "Overdue";
      const isSoon = status === "Water Soon";
      const recWater = plant.recommendedWaterMl ? `${plant.recommendedWaterMl} mL` : `Every ${plant.frequency || 7} days`;

      return {
        ...plant,
        status,
        nextDate,
        isWateredToday,
        isOverdue,
        isSoon,
        recWater
      };
    });
  }, [plants, history]);

  // Summary counts
  const todayCount = reminderItems.filter((item) => item.isSoon && !item.isWateredToday).length;
  const overdueCount = reminderItems.filter((item) => item.isOverdue && !item.isWateredToday).length;
  const upcomingCount = reminderItems.filter((item) => !item.isOverdue && !item.isSoon && !item.isWateredToday).length;
  const completedCount = reminderItems.filter((item) => item.isWateredToday).length;

  // Filtered list
  const filtered = useMemo(() => {
    return reminderItems.filter((item) => {
      if (query.trim()) {
        const text = `${item.name} ${item.species || ""} ${item.location || ""}`.toLowerCase();
        if (!text.includes(query.toLowerCase())) return false;
      }
      if (filterTab === "today") return (item.isSoon || item.isOverdue) && !item.isWateredToday;
      if (filterTab === "overdue") return item.isOverdue && !item.isWateredToday;
      if (filterTab === "upcoming") return !item.isOverdue && !item.isSoon && !item.isWateredToday;
      if (filterTab === "completed") return item.isWateredToday;
      return true;
    });
  }, [reminderItems, filterTab, query]);

  const handleWaterNow = async (plantId) => {
    setWateredMap((prev) => ({ ...prev, [plantId]: true }));
    try {
      await waterPlant(plantId);
      await refresh();
    } catch {
      setWateredMap((prev) => ({ ...prev, [plantId]: false }));
    }
  };

  return (
    <div className="reminders-page-container">
      {/* Page Header */}
      <header className="dashboard-top-header">
        <div>
          <span className="eyebrow-tag">CARE SCHEDULE</span>
          <h1 style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", margin: "4px 0" }}>
            <span>Watering Reminders</span>
            <img src="/alarm_clock_icon.png" alt="Reminders Icon" style={{ width: 32, height: 32, objectFit: "contain" }} />
          </h1>
          <p>Stay on top of upcoming and overdue watering schedules for all your plants.</p>
        </div>
        <button className="add-plant-btn-top" onClick={() => navigate("/add-plant")}>
          + Add Plant
        </button>
      </header>

      {/* 4 Summary Metric Cards */}
      <section className="summary-grid-cards" style={{ marginBottom: 20 }}>
        <div className="dash-metric-card" onClick={() => setFilterTab("today")}>
          <div className="metric-icon-circle yellow">
            <Clock size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Today's Reminders</span>
            <strong className="metric-value">{todayCount}</strong>
            <span className="metric-subtext">Needs watering today</span>
          </div>
        </div>

        <div className="dash-metric-card" onClick={() => setFilterTab("overdue")}>
          <div className="metric-icon-circle red">
            <AlertTriangle size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Overdue Warnings</span>
            <strong className="metric-value">{overdueCount}</strong>
            <span className="metric-subtext red-text">Needs immediate water</span>
          </div>
        </div>

        <div className="dash-metric-card" onClick={() => setFilterTab("upcoming")}>
          <div className="metric-icon-circle green">
            <Calendar size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Upcoming Care</span>
            <strong className="metric-value">{upcomingCount}</strong>
            <span className="metric-subtext">Scheduled next 7 days</span>
          </div>
        </div>

        <div className="dash-metric-card" onClick={() => setFilterTab("completed")}>
          <div className="metric-icon-circle green-soft">
            <CheckCircle2 size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Watered Today</span>
            <strong className="metric-value">{completedCount}</strong>
            <span className="metric-subtext">Plants hydrated today</span>
          </div>
        </div>
      </section>

      {/* Quick Filter Tabs */}
      <section className="plant-filter-tabs-pills">
        <button
          type="button"
          className={filterTab === "all" ? "tab-pill active" : "tab-pill"}
          onClick={() => setFilterTab("all")}
        >
          All Reminders ({reminderItems.length})
        </button>
        <button
          type="button"
          className={filterTab === "today" ? "tab-pill active" : "tab-pill"}
          onClick={() => setFilterTab("today")}
        >
          Today / Soon ({todayCount + overdueCount})
        </button>
        <button
          type="button"
          className={filterTab === "overdue" ? "tab-pill active" : "tab-pill"}
          onClick={() => setFilterTab("overdue")}
        >
          Overdue ({overdueCount})
        </button>
        <button
          type="button"
          className={filterTab === "upcoming" ? "tab-pill active" : "tab-pill"}
          onClick={() => setFilterTab("upcoming")}
        >
          Upcoming ({upcomingCount})
        </button>
        <button
          type="button"
          className={filterTab === "completed" ? "tab-pill active" : "tab-pill"}
          onClick={() => setFilterTab("completed")}
        >
          Watered Today ({completedCount})
        </button>
      </section>

      {/* Floating Search Toolbar */}
      <section className="dashboard-floating-toolbar" style={{ marginTop: 16, marginBottom: 20 }}>
        <div className="floating-search-wrap" style={{ flex: 1 }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search reminders by plant name or location..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </section>

      {/* Reminders List */}
      {filtered.length ? (
        <section className="reminders-list-container" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.map((plant) => {
            const isWaterable = isPlantWaterable(plant.lastWatered, plant.frequency);
            const isDone = plant.isWateredToday || wateredMap[plant.id] || !isWaterable;

            return (
              <div
                key={plant.id}
                className={`reminder-item-card ${plant.isOverdue ? "is-overdue" : plant.isSoon ? "is-soon" : ""}`}
                style={{
                  background: "#ffffff",
                  borderRadius: 20,
                  padding: "16px 20px",
                  border: `1px solid ${plant.isOverdue ? "#fecaca" : plant.isSoon ? "#ffe58f" : "#e2e8f0"}`,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap"
                }}
              >
                {/* Left: Plant Thumbnail Photo & Details */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, flex: "1 1 300px" }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, overflow: "hidden", background: "#f8faf7", border: "1px solid #e2e8f0", flex: "0 0 56px", display: "grid", placeItems: "center" }}>
                    {plant.photoUrl ? (
                      <img src={plant.photoUrl} alt={plant.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <img src={getPlantIconUrl(plant)} alt="" style={{ width: 34, height: 34, objectFit: "contain" }} />
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <strong style={{ fontSize: "1.05rem", fontWeight: 850, color: "#0f172a" }}>{plant.name}</strong>
                      <PlantStatusBadge status={isDone ? "Safe" : plant.status} />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      {/* Schedule Remaining Badge */}
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        background: plant.isOverdue ? "#fef2f2" : plant.isSoon ? "#fffbe6" : "#f0fdf4",
                        color: plant.isOverdue ? "#dc2626" : plant.isSoon ? "#d97706" : "#16a34a",
                        border: `1px solid ${plant.isOverdue ? "#fecaca" : plant.isSoon ? "#ffe58f" : "#bbf7d0"}`
                      }}>
                        <Clock size={12} />
                        {(() => {
                          if (!plant.lastWatered) return "Schedule Pending";
                          const freq = Number(plant.frequency || 7);
                          const daysElapsed = daysBetween(plant.lastWatered, todayISO());
                          const remaining = freq - daysElapsed;
                          if (remaining < 0) return `Overdue by ${Math.abs(remaining)} day${Math.abs(remaining) === 1 ? "" : "s"}`;
                          if (remaining === 0) return "Due Today";
                          if (remaining === 1) return "In 1 day";
                          return `In ${remaining} days`;
                        })()}
                      </span>

                      {/* Capitalized Location Tag */}
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        background: "#f1f5f9",
                        color: "#475569",
                        border: "1px solid #e2e8f0"
                      }}>
                        <MapPin size={12} />
                        {formatLocation(plant.location)}
                      </span>

                      {/* Recommended Water Volume */}
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        background: "#f0f9ff",
                        color: "#0369a1",
                        border: "1px solid #bae6fd"
                      }}>
                        <Droplets size={12} />
                        {plant.recWater}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Quick Action Buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Link className="ghost-btn" to={`/plant/${plant.id}`} style={{ padding: "8px 16px", borderRadius: 12, fontSize: "0.86rem", fontWeight: 700 }}>
                    View Details
                  </Link>

                  <button
                    type="button"
                    className={`primary-btn ${isDone ? "success-btn" : ""}`}
                    onClick={() => handleWaterNow(plant.id)}
                    disabled={isDone}
                    style={{ padding: "8px 18px", borderRadius: 12, fontSize: "0.86rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    {isDone ? (
                      <>
                        <Check size={16} /> Watered
                      </>
                    ) : (
                      <>
                        <Droplets size={16} /> Water Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      ) : (
        <EmptyState title="No reminders found" message="All your plants are healthy and hydrated!" action="Add Plant" to="/add-plant" />
      )}
    </div>
  );
}
