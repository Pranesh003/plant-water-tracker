import { BarChart3, Bell, Calendar, ChevronDown, History, Home, Leaf, LogOut, Menu, Settings, Shield, Sprout, User, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { usePlantCare } from "../App.jsx";
import { api } from "../services/api.js";
import { readStorage, writeStorage } from "../utils/storageUtils.js";
import { generatePlantNotifications } from "../utils/wateringUtils.js";

import NotificationCenter from "./NotificationCenter.jsx";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/my-plants", label: "My Plants", icon: Leaf },
  { to: "/reminders", label: "Reminders", icon: Calendar },
  { to: "/history", label: "History", icon: History },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings }
];

const SEEN_NOTIFICATIONS_KEY = "plantCareSeenNotifications";

export default function Navbar() {
  const { user, plants, history } = usePlantCare();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [seenNotificationIds, setSeenNotificationIds] = useState(() => readStorage(SEEN_NOTIFICATIONS_KEY, []));
  const [browserNotificationPermission, setBrowserNotificationPermission] = useState(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  const notifications = useMemo(() => generatePlantNotifications(plants, history), [plants, history]);
  const unreadCount = notifications.filter((n) => !seenNotificationIds.includes(n.id)).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setShowProfileMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile Top Header Bar (< 768px) */}
      <header className="mobile-header-bar" aria-label="Mobile Navigation Bar">
        <button
          className="mobile-menu-toggle-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="mobile-brand-title" onClick={() => { navigate("/dashboard"); closeMobile(); }}>
          <img
            src="/app_logo.png"
            alt="Plant Care Logo"
            style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }}
          />
          <span style={{ fontWeight: 850, fontSize: "1.05rem", color: "#1b4332" }}>PlantDoc</span>
        </div>

        <button
          className="mobile-header-user-btn"
          onClick={() => { navigate("/settings"); closeMobile(); }}
          aria-label="Settings"
        >
          <Settings size={20} />
        </button>
      </header>

      {/* Backdrop overlay for mobile drawer */}
      {mobileOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Navigation Drawer */}
      <aside className={`sidebar-container ${mobileOpen ? "mobile-open" : ""}`} aria-label="Sidebar Navigation">
        <div className="sidebar-brand" onClick={() => { navigate("/dashboard"); closeMobile(); }}>
          <img
            src="/app_logo.png"
            alt="Plant Care Logo"
            className="brand-logo-img"
            style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", boxShadow: "0 4px 14px rgba(31,77,46,0.15)", border: "2px solid #ffffff" }}
          />
          <div className="brand-title-wrap">
            <h2>PlantDoc</h2>
            <p style={{ color: "#52b788", fontWeight: 700, fontSize: "0.72rem", margin: "2px 0 0 0" }}>Every Drop Helps You Grow</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={label}
              to={to}
              onClick={closeMobile}
              className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer-art">
          <img src="/sidebar_plant.jpg" alt="House plant" className="sidebar-plant-img" onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
      </aside>

      {/* Fixed Bottom Navigation Bar (< 768px) */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Quick Nav">
        {navItems.slice(0, 5).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={label}
            to={to}
            className={({ isActive }) => (isActive ? "bottom-nav-item active" : "bottom-nav-item")}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}

export function DashboardHeader({ user, notifications, unreadCount, toggleNotifications, showNotifications, notifRef, requestNotificationPermission, browserNotificationPermission }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initial = user?.name ? user.name[0].toUpperCase() : "D";

  const logout = async () => {
    await api.logout();
    navigate("/signin");
  };

  return (
    <header className="dashboard-top-header">
      <div className="header-greeting-wrap">
        <span className="eyebrow-tag">TODAY'S CARE PLAN</span>
        <h1 style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span>Good afternoon, {user?.name || "Dinesh S"}</span>
          <img src="/sprout_icon.png" alt="Sprout Icon" style={{ width: 32, height: 32, objectFit: "contain", display: "inline-block" }} />
        </h1>
        <p>Let's take care of your plants today.</p>
      </div>

      <div className="header-actions-right">
        {/* Automated Daily Reminders Notification Center */}
        <NotificationCenter />
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
        <div className="user-profile-menu-wrap" ref={menuRef}>
          <button className="user-profile-pill-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
            <span className="user-avatar-circle">{initial}</span>
            <span className="user-name-text">{user?.name || "Dinesh S"}</span>
            <ChevronDown size={14} />
          </button>

          {showUserMenu && (
            <div className="user-dropdown-card">
              <button className="dropdown-item" onClick={() => { setShowUserMenu(false); navigate("/admin/settings"); }}>
                <User size={15} /> Account Settings
              </button>
              {api.getRole() === "admin" && (
                <button className="dropdown-item" onClick={() => { setShowUserMenu(false); navigate("/admin"); }}>
                  <Shield size={15} /> Admin Panel
                </button>
              )}
              <button className="dropdown-item danger" onClick={logout}>
                <LogOut size={15} /> Logout
              </button>
            </div>
          )}
        </div>

        {/* Add Plant Primary Button */}
        <button className="add-plant-btn-top" onClick={() => navigate("/add-plant")}>
          + Add Plant
        </button>
      </div>
    </header>
  );
}
