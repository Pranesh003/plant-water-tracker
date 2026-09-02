import { AlertTriangle, Bell, Calendar, Check, CheckCircle2, Clock, Droplets, MapPin, Search, Sprout } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePlantCare } from "../App.jsx";
import EmptyState from "../components/EmptyState.jsx";
import PlantStatusBadge from "../components/PlantStatusBadge.jsx";
import { calculateNextWateringDate, calculateWateringStatus, formatDate, isPlantWaterable, todayISO } from "../utils/wateringUtils.js";
import { getPlantIconUrl } from "../utils/plantIconUtils.js";

export default function Reminders() {
  const { plants, history, waterPlant, refresh, user, notify } = usePlantCare();
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
          <h1 style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span>Watering Reminders</span>
            <img src="/alarm_clock_icon.png" alt="Alarm Clock Icon" style={{ width: 32, height: 32, objectFit: "contain", display: "inline-block" }} />
          </h1>
          <p>Stay on top of upcoming and overdue watering schedules for all your plants.</p>
        </div>
        <button className="add-plant-btn-top" onClick={() => navigate("/add-plant")}>
          + Add Plant
        </button>
      </header>

      {/* 4 Summary Metric Cards */}
      <section className="summary-grid-cards" style={{ marginBottom: 24 }}>
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
      <section className="dashboard-floating-toolbar" style={{ marginTop: 16, marginBottom: 24 }}>
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
                className={`panel reminder-item-card ${plant.isOverdue ? "is-overdue" : plant.isSoon ? "is-soon" : ""}`}
              >
                {/* Left: Plant Photo & Title */}
                <div className="reminder-card-left">
                  <div className="reminder-plant-thumb">
                    {plant.photoUrl ? (
                      <img src={plant.photoUrl} alt={plant.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <img src={getPlantIconUrl(plant)} alt="" style={{ width: 34, height: 34, objectFit: "contain" }} />
                    )}
                  </div>

                  <div>
                    <div className="reminder-title-row">
                      <strong style={{ fontSize: "1.05rem", color: "#1b4332" }}>{plant.name}</strong>
                      <PlantStatusBadge status={isDone ? "Safe" : plant.status} />
                    </div>
                    <div className="reminder-meta-row">
                      <span>
                        <MapPin size={14} color="#52b788" /> {plant.location || "Indoor"}
                      </span>
                      <span>
                        <Droplets size={14} color="#0284c7" /> {plant.recWater}
                      </span>
                      <span>
                        <Clock size={14} color="#d97706" /> {plant.lastWatered ? `Due: ${formatDate(plant.nextDate)}` : "Needs first water"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Quick Action Buttons */}
                <div className="reminder-card-actions">
                  <Link className="ghost-btn" to={`/plant/${plant.id}`}>
                    View Details
                  </Link>

                  <button
                    type="button"
                    className={`primary-btn ${isDone ? "success-btn" : ""}`}
                    onClick={() => handleWaterNow(plant.id)}
                    disabled={isDone}
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
        <div className="reminders-empty-card" style={{ padding: 40, background: "#ffffff", borderRadius: 24, border: "1px dashed #cfe2ce", textAlign: "center" }}>
          <EmptyState title="No reminders found." message="All plants are hydrated! Check back later for upcoming care schedules." action="Add Plant" to="/add-plant" />
        </div>
      )}
    </div>
  );
}
