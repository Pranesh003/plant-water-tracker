import { BarChart3, Bell, History, Home, Leaf, LogOut, Sprout } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { usePlantCare } from "../App.jsx";
import { api } from "../services/api.js";
import { readStorage, writeStorage } from "../utils/storageUtils.js";
import { generatePlantNotifications } from "../utils/wateringUtils.js";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/my-plants", label: "My Plants", icon: Leaf },
  { to: "/history", label: "History", icon: History },
  { to: "/analytics", label: "Analytics", icon: BarChart3 }
];
const SEEN_NOTIFICATIONS_KEY = "plantCareSeenNotifications";

export default function Navbar() {
  const { user, plants } = usePlantCare();
  const [showNotifications, setShowNotifications] = useState(false);
  const [seenNotificationIds, setSeenNotificationIds] = useState(() => readStorage(SEEN_NOTIFICATIONS_KEY, []));
  const panelRef = useRef(null);
  const navigate = useNavigate();

  const notifications = useMemo(() => generatePlantNotifications(plants), [plants]);
  const unreadCount = notifications.filter((notification) => !seenNotificationIds.includes(notification.id)).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) setShowNotifications(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logout = async () => {
    await api.logout();
    navigate("/signin");
  };

  const toggleNotifications = () => {
    setShowNotifications((open) => {
      const nextOpen = !open;
      if (nextOpen) {
        const nextSeenIds = [...new Set([...seenNotificationIds, ...notifications.map((notification) => notification.id)])];
        setSeenNotificationIds(nextSeenIds);
        writeStorage(SEEN_NOTIFICATIONS_KEY, nextSeenIds);
      }
      return nextOpen;
    });
  };

  return (
    <>
      <header className="topbar">
        <button className="brand" onClick={() => navigate("/dashboard")} aria-label="Plant Care Tracker home">
          <span className="brand-mark"><Sprout size={23} /></span><span>Plant Care Tracker</span>
        </button>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={label} to={to} className={({ isActive }) => isActive ? "active" : ""}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="profile">
          <div className="notification-wrap" ref={panelRef}>
            <button className="icon-btn notification-trigger" type="button" onClick={toggleNotifications} aria-label="Notifications" aria-expanded={showNotifications}>
              <Bell size={18} />
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>
            {showNotifications && (
              <div className="notification-panel" role="dialog" aria-label="Notifications panel">
                <div className="notification-panel-head">
                  <strong>🔔 Notifications</strong>
                </div>
                {notifications.length ? (
                  <ul className="notification-list">
                    {notifications.map((item) => (
                      <li key={item.id}>
                        <div className="notification-pill">💧</div>
                        <div>
                          <strong>{item.title}</strong>
                          <p>{item.message}</p>
                          <small>{item.scheduledFor ? `Tomorrow • ${item.scheduledFor}` : `Today`}</small>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="notification-empty">No notifications</p>
                )}
              </div>
            )}
          </div>
          <span className="avatar" aria-label="Profile">{user?.name?.[0] || "P"}</span>
          <span className="profile-name">{user?.name || "Plant Friend"}</span>
          <button className="icon-btn" onClick={logout} title="Logout" aria-label="Logout"><LogOut size={18} /></button>
        </div>
      </header>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={label} to={to}><Icon size={18} /><span>{label}</span></NavLink>
        ))}
      </nav>
    </>
  );
}
