import { AlertTriangle, Bell, Check, ChevronLeft, ChevronRight, Droplets, Eye, Flame, Leaf, MoreVertical, Plus, Search, Sprout, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePlantCare } from "../App.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LocationFilter from "../components/LocationFilter.jsx";
import StatusFilter from "../components/StatusFilter.jsx";
import WeatherCard from "../components/WeatherCard.jsx";
import { api } from "../services/api.js";
import { filterPlants } from "../utils/analyticsUtils.js";
import { getPlantIconUrl } from "../utils/plantIconUtils.js";
import { readStorage, writeStorage } from "../utils/storageUtils.js";
import { calculateNextWateringDate, calculateWateringStatus, daysBetween, formatDate, formatTimeAgo, generatePlantNotifications, isPlantWaterable, todayISO } from "../utils/wateringUtils.js";

const SEEN_NOTIFICATIONS_KEY = "plantCareSeenNotifications";

export default function Dashboard() {
  const { plants, user, history, loading, error, refresh, waterPlant, deletePlant } = usePlantCare();
  const navigate = useNavigate();

  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState("All Plants");
  const [status, setStatus] = useState("All");
  const [query, setQuery] = useState("");
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [seenNotificationIds, setSeenNotificationIds] = useState(() => readStorage(SEEN_NOTIFICATIONS_KEY, []));
  const [browserNotificationPermission, setBrowserNotificationPermission] = useState(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );
  
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  const filtered = useMemo(() => filterPlants(plants, { location, status, query }), [plants, location, status, query]);
  
  const notifications = useMemo(() => generatePlantNotifications(plants, history), [plants, history]);
  const unreadCount = notifications.filter((n) => !seenNotificationIds.includes(n.id)).length;

  const counts = plants.reduce((acc, plant) => {
    const st = calculateWateringStatus(plant.lastWatered, plant.frequency);
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, { Safe: 0, "Water Soon": 0, Overdue: 0 });

  const bestStreak = Math.max(0, ...plants.map((p) => p.bestStreak || 0));
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 17 ? "Good afternoon" : currentHour < 21 ? "Good evening" : "Good night";

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentHour(new Date().getHours()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifications(false);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleNotifications = () => {
    setShowNotifications((open) => {
      const nextOpen = !open;
      if (nextOpen) {
        const nextSeenIds = [...new Set([...seenNotificationIds, ...notifications.map((n) => n.id)])];
        setSeenNotificationIds(nextSeenIds);
        writeStorage(SEEN_NOTIFICATIONS_KEY, nextSeenIds);
      }
      return nextOpen;
    });
  };

  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      setBrowserNotificationPermission(permission);
    }
  };

  const logout = async () => {
    await api.logout();
    navigate("/signin");
  };

  // Upcoming watering plants sorted by actual due date
  const upcomingPlants = useMemo(() => {
    return [...plants]
      .map((plant) => {
        const nextDate = calculateNextWateringDate(plant.lastWatered, plant.frequency);
        const pStatus = calculateWateringStatus(plant.lastWatered, plant.frequency);
        const timeVal = nextDate ? new Date(`${nextDate}T00:00:00`).getTime() : 0;
        return { ...plant, nextDate, pStatus, timeVal };
      })
      .sort((a, b) => {
        if (a.pStatus === "Overdue" && b.pStatus !== "Overdue") return -1;
        if (b.pStatus === "Overdue" && a.pStatus !== "Overdue") return 1;
        return a.timeVal - b.timeVal;
      })
      .slice(0, 4);
  }, [plants]);

  const duePlants = useMemo(() => {
    return plants.filter((plant) => isPlantWaterable(plant.lastWatered, plant.frequency));
  }, [plants]);

  const handleWaterNext = async () => {
    if (duePlants.length > 0) {
      await waterPlant(duePlants[0].id);
      await refresh();
    }
  };

  const visiblePlants = useMemo(() => {
    return filtered.slice(carouselIndex * 3, (carouselIndex + 1) * 3);
  }, [filtered, carouselIndex]);

  const maxIndex = Math.max(0, Math.ceil(filtered.length / 3) - 1);

  if (loading) return <p className="loading">Loading your dashboard...</p>;

  return (
    <div className="dashboard-view-container">
      {error && <p className="error">{error}</p>}

      {/* Top Care Header Bar */}
      <header className="dashboard-top-header">
        <div className="header-greeting-wrap">
          <span className="eyebrow-tag">TODAY'S CARE PLAN</span>
          <h1 style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", margin: "4px 0" }}>
            <span>{greeting}, {user?.name || "Plant Care Admin"}</span>
            <img src="/sprout_icon.png" alt="Sprout Icon" style={{ width: 32, height: 32, objectFit: "contain" }} />
          </h1>
          <p>Let's take care of your plants today.</p>
        </div>

        <div className="header-actions-right">
          {/* Notifications Dropdown */}
          <div className="notification-wrap" ref={notifRef}>
            <button className="icon-btn notif-btn" type="button" onClick={toggleNotifications} aria-label="Notifications">
              <Bell size={18} />
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>
            {showNotifications && (
              <div className="notification-panel" role="dialog">
                <div className="notification-panel-head">
                  <strong>🔔 Notifications ({notifications.length})</strong>
                  {browserNotificationPermission !== "granted" && "Notification" in window && (
                    <button type="button" className="ghost-btn compact" onClick={requestNotificationPermission} style={{ fontSize: "0.72rem", padding: "4px 8px" }}>
                      Enable Desktop Alerts
                    </button>
                  )}
                </div>
                {notifications.length ? (
                  <ul className="notification-list">
                    {notifications.map((item) => (
                      <li key={item.id} className={`notification-item ${item.type}`}>
                        <div className="notification-pill">{item.pillIcon || "💧"}</div>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                            <strong>{item.title}</strong>
                            <small className="notification-tag">{item.category}</small>
                          </div>
                          <p>{item.message}</p>
                          <small className="muted">{item.timeAgo}</small>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="notification-empty">No active notifications</p>
                )}
              </div>
            )}
          </div>

          {/* User Profile Pill Dropdown */}
          <div className="user-profile-menu-wrap" ref={userMenuRef}>
            <button className="user-profile-pill-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
              <span className="user-avatar-circle">{user?.name ? user.name[0].toUpperCase() : "D"}</span>
              <span className="user-name-text">{user?.name || "Dinesh S"}</span>
              <span className="chevron-icon">▾</span>
            </button>

            {showUserMenu && (
              <div className="user-dropdown-card">
                <button className="dropdown-item" onClick={() => { setShowUserMenu(false); navigate("/settings"); }}>
                  Account Settings
                </button>
                {api.getRole() === "admin" && (
                  <button className="dropdown-item" onClick={() => { setShowUserMenu(false); navigate("/admin"); }}>
                    Admin Panel
                  </button>
                )}
                <button className="dropdown-item danger" onClick={logout}>
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Add Plant Primary Button */}
          <button className="add-plant-btn-top" onClick={() => navigate("/add-plant")}>
            <Plus size={16} /> Add Plant
          </button>
        </div>
      </header>

      {/* 4 Top Summary Metric Cards */}
      <section className="summary-grid-cards">
        <div className="dash-metric-card" onClick={() => navigate("/my-plants")}>
          <div className="metric-icon-circle green">
            <Leaf size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Plants</span>
            <strong className="metric-value">{plants.length}</strong>
            <span className="metric-link">View all plants →</span>
          </div>
        </div>

        <div className="dash-metric-card" onClick={() => navigate("/my-plants?filter=need-watering")}>
          <div className="metric-icon-circle yellow">
            <Sprout size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Need Watering</span>
            <strong className="metric-value">{counts["Water Soon"]}</strong>
            <span className="metric-subtext">Needs watering</span>
          </div>
        </div>

        <div className="dash-metric-card" onClick={() => navigate("/my-plants?filter=overdue")}>
          <div className="metric-icon-circle red">
            <AlertTriangle size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Overdue</span>
            <strong className="metric-value">{counts.Overdue}</strong>
            <span className="metric-subtext red-text">Review overdue</span>
          </div>
        </div>

        <div className="dash-metric-card" onClick={() => navigate("/my-plants?filter=best-streak")}>
          <div className="metric-icon-circle green-soft">
            <Flame size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Best Streak</span>
            <strong className="metric-value">{bestStreak} days</strong>
            <span className="metric-subtext">Top streak plants</span>
          </div>
        </div>
      </section>

      {/* Main 2-Column Grid matching reference screenshot */}
      <div className="dashboard-grid-container">
        {/* Left Column */}
        <div className="dashboard-left-col">
          {/* Today's Live Weather Card */}
          <section className="dashboard-weather-section">
            <WeatherCard onWeatherChange={setWeather} />
          </section>

          {/* Search & Filter Toolbar (Floating White Pill Inputs) */}
          <section className="dashboard-floating-toolbar">
            <div className="floating-search-wrap">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search for a plant..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <LocationFilter value={location} onChange={setLocation} />
            <StatusFilter value={status} onChange={setStatus} allLabel="All Status" />
          </section>

          {/* MY PLANTS Covered Large White Box */}
          <section className="my-plants-panel-card">
            <div className="panel-head-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2>MY PLANTS</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {filtered.length > 3 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                      className="arrow-btn"
                      disabled={carouselIndex === 0}
                      onClick={() => setCarouselIndex((i) => Math.max(0, i - 1))}
                      aria-label="Previous plants"
                      style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #d8e5d7", background: "#ffffff", display: "grid", placeItems: "center", cursor: "pointer" }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      className="arrow-btn"
                      disabled={carouselIndex >= maxIndex}
                      onClick={() => setCarouselIndex((i) => Math.min(maxIndex, i + 1))}
                      aria-label="Next plants"
                      style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #d8e5d7", background: "#ffffff", display: "grid", placeItems: "center", cursor: "pointer" }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
                <Link to="/my-plants" className="view-all-link">View all</Link>
              </div>
            </div>

            {filtered.length === 0 ? (
              <EmptyState title="No plants found" message="Try searching or adding a new plant." action="Add Plant" to="/add-plant" />
            ) : (
              <>
                <div className="dash-plant-cards-row">
                  {visiblePlants.map((plant) => {
                    const pStatus = calculateWateringStatus(plant.lastWatered, plant.frequency);
                    const isOverdue = pStatus === "Overdue";
                    const isSoon = pStatus === "Water Soon";

                    return (
                      <article key={plant.id} className={`inner-plant-card state-${pStatus.toLowerCase().replace(/\s+/g, "-")}`} style={{ background: "#ffffff", borderRadius: 16, overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 4px 14px rgba(0,0,0,0.04)" }}>
                        <div className="inner-plant-img-wrap" style={{ height: 160, position: "relative" }}>
                          {plant.photoUrl ? (
                            <img src={plant.photoUrl} alt={plant.name} className="inner-plant-img" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <img src="/monstera_photo.jpg" alt={plant.name} className="inner-plant-img" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.style.display = 'none'; }} />
                          )}
                        </div>

                        <button
                          className="card-more-btn"
                          onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === plant.id ? null : plant.id); }}
                          aria-label="Options"
                        >
                          <MoreVertical size={15} />
                        </button>

                        {activeMenuId === plant.id && (
                          <div className="card-pop-menu" onClick={(e) => e.stopPropagation()}>
                            <button
                              disabled={!isPlantWaterable(plant.lastWatered, plant.frequency)}
                              onClick={() => {
                                if (isPlantWaterable(plant.lastWatered, plant.frequency)) {
                                  waterPlant(plant.id);
                                  setActiveMenuId(null);
                                }
                              }}
                              style={{
                                opacity: isPlantWaterable(plant.lastWatered, plant.frequency) ? 1 : 0.55,
                                cursor: isPlantWaterable(plant.lastWatered, plant.frequency) ? "pointer" : "not-allowed"
                              }}
                            >
                              {isPlantWaterable(plant.lastWatered, plant.frequency) ? <Droplets size={14} /> : <Check size={14} />}
                              {isPlantWaterable(plant.lastWatered, plant.frequency) ? "Water Plant" : "Watered"}
                            </button>
                            <button onClick={() => { navigate(`/plant/${plant.id}`); setActiveMenuId(null); }}>
                              <Eye size={14} /> View Details
                            </button>
                            <button className="danger" onClick={() => { deletePlant(plant.id); setActiveMenuId(null); }}>
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}

                        <div className="inner-plant-body" style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                          <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>{plant.name}</h4>
                          
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <div className={`dash-schedule-badge ${isOverdue ? "overdue" : isSoon ? "soon" : "safe"}`} style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "4px 10px",
                              borderRadius: 20,
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              background: isOverdue ? "#fef2f2" : isSoon ? "#fffbe6" : "#f0fdf4",
                              color: isOverdue ? "#dc2626" : isSoon ? "#d97706" : "#16a34a",
                              border: `1px solid ${isOverdue ? "#fecaca" : isSoon ? "#ffe58f" : "#bbf7d0"}`
                            }}>
                              <Droplets size={13} />
                              <span>
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
                            </div>

                            <span className="dash-location-tag" style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "3px 10px",
                              borderRadius: 20,
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              background: "#f1f5f9",
                              color: "#475569",
                              border: "1px solid #e2e8f0"
                            }}>
                              {(() => {
                                const loc = plant.location || "Indoor";
                                return loc.split(",").map(part => part.trim().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")).join(", ");
                              })()}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </div>

        {/* Right Sidebar Column (UPCOMING WATERING Top Right + RECENT ACTIVITY Bottom Right) */}
        <aside className="dashboard-right-col">
          {/* Upcoming Watering Card */}
          <section className="right-panel-card upcoming-card">
            <div className="panel-head">
              <h3>UPCOMING WATERING</h3>
              <Link to="/my-plants" className="view-all-link">View all</Link>
            </div>

            <div className="upcoming-list">
              {upcomingPlants.length ? (
                upcomingPlants.map((plant) => {
                  const isOverdue = plant.pStatus === "Overdue";
                  const isSoon = plant.pStatus === "Water Soon";
                  const dueLabel = isOverdue
                    ? "Overdue"
                    : isSoon
                    ? "Tomorrow, 8:00 AM"
                    : plant.lastWatered
                    ? `Due: ${formatDate(plant.nextDate)}`
                    : `In ${plant.frequency || 7} days`;

                  return (
                    <div key={plant.id} className="upcoming-item">
                      <div className="plant-thumb-mini">
                        {plant.photoUrl ? <img src={plant.photoUrl} alt="" /> : <img src={getPlantIconUrl(plant)} alt="" style={{ width: 28, height: 28, objectFit: "contain" }} />}
                      </div>
                      <div className="upcoming-info">
                        <strong>{plant.name}</strong>
                        <small className={isOverdue ? "red-text" : isSoon ? "yellow-text" : ""}>
                          <Droplets size={12} /> {dueLabel}
                        </small>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="empty-panel-text">No upcoming waterings today.</p>
              )}
            </div>

            <button className="water-now-btn" onClick={handleWaterNext} disabled={duePlants.length === 0} style={{ opacity: duePlants.length === 0 ? 0.65 : 1, cursor: duePlants.length === 0 ? "not-allowed" : "pointer" }}>
              <Droplets size={16} /> {duePlants.length > 0 ? "Water Next Due Plant" : "All Plants Watered"}
            </button>
          </section>

          {/* Recent Activity Card */}
          <section className="right-panel-card activity-card">
            <div className="panel-head">
              <h3>RECENT ACTIVITY</h3>
              <Link to="/history" className="view-all-link">View all</Link>
            </div>

            <div className="activity-feed">
              {history.length ? (
                history.slice(0, 4).map((item) => (
                  <div key={item.id} className="activity-feed-item">
                    <span className={`activity-icon-badge ${item.type === "watering" ? "water" : "note"}`}>
                      {item.type === "watering" ? (
                        <img src="/plant_icons/watering_can.png" alt="Watering Can" style={{ width: 22, height: 22, objectFit: "contain" }} />
                      ) : (
                        <img src="/plant_icons/herb.png" alt="Note Herb" style={{ width: 22, height: 22, objectFit: "contain" }} />
                      )}
                    </span>
                    <div className="activity-feed-content">
                      <p>
                        <strong>{item.plantName || "Plant"}</strong> {item.type === "watering" ? "watered" : "note added"}
                      </p>
                      <small>{item.date ? formatTimeAgo(item) : "Recently"}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-panel-text" style={{ padding: "16px 8px", color: "var(--muted)", textAlign: "center", fontSize: "0.85rem" }}>
                  No recent activities yet. Add or water plants to track your care history!
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
