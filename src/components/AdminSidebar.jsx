import { ChevronDown, LayoutDashboard, Leaf, LogOut, Menu, Settings as SettingsIcon, Sprout, User, Users, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";

const adminNavItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/plants", label: "Plants", icon: Leaf },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon }
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile Top Header Bar (< 768px) */}
      <header className="mobile-header-bar admin-mobile-header" aria-label="Admin Mobile Navigation Bar">
        <button
          className="mobile-menu-toggle-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="mobile-brand-title" onClick={() => { navigate("/admin"); closeMobile(); }}>
          <img
            src="/app_logo.png"
            alt="Plant Care Logo"
            style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }}
          />
          <span style={{ fontWeight: 850, fontSize: "1.05rem", color: "#1b4332" }}>Admin Panel</span>
        </div>

        <button
          className="mobile-header-user-btn"
          onClick={() => { navigate("/admin/settings"); closeMobile(); }}
          aria-label="Settings"
        >
          <SettingsIcon size={20} />
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
      <aside className={`sidebar-container admin-sidebar-container ${mobileOpen ? "mobile-open" : ""}`} aria-label="Admin Sidebar Navigation">
        <div className="sidebar-brand" onClick={() => { navigate("/admin"); closeMobile(); }}>
          <img
            src="/app_logo.png"
            alt="Plant Care Logo"
            className="brand-logo-img"
            style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", boxShadow: "0 4px 14px rgba(31,77,46,0.15)", border: "2px solid #ffffff" }}
          />
          <div className="brand-title-wrap">
            <h2>Admin</h2>
            <p style={{ color: "#52b788", fontWeight: 700, fontSize: "0.72rem", margin: "2px 0 0 0" }}>Every Drop Helps You Grow</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {adminNavItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={label}
              to={to}
              end={to === "/admin"}
              onClick={closeMobile}
              className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer-art">
          <img src="/sidebar_plant.jpg" alt="Potted plant" className="sidebar-plant-img" onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
      </aside>

      {/* Fixed Bottom Navigation Bar (< 768px) */}
      <nav className="mobile-bottom-nav" aria-label="Admin Mobile Quick Nav">
        {adminNavItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={label}
            to={to}
            end={to === "/admin"}
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

export function AdminHeader({ title = "Admin Dashboard", eyebrow = "SYSTEM OVERVIEW" }) {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    api.getUser().then(setAdmin);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logout = async () => {
    await api.logout();
    navigate("/signin");
  };

  const adminName = admin?.name || "Sample Administrator";
  const initial = adminName[0].toUpperCase();

  return (
    <header className="dashboard-top-header admin-top-header">
      <div className="header-greeting-wrap">
        <span className="eyebrow-tag">{eyebrow}</span>
        <h1>{title} 🌿</h1>
      </div>

      <div className="header-actions-right" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Settings Icon Button */}
        <button
          className="admin-circle-icon-btn"
          type="button"
          onClick={() => navigate("/admin/settings")}
          title="Settings"
          aria-label="Settings"
        >
          <SettingsIcon size={18} />
        </button>

        {/* Profile Avatar Pill Dropdown */}
        <div className="user-profile-menu-wrap" ref={dropdownRef}>
          <button className="user-profile-pill-btn" onClick={() => setShowDropdown(!showDropdown)}>
            <span className="user-avatar-circle" style={{ background: "#1f4d2e" }}>{initial}</span>
            <span className="user-name-text">{adminName}</span>
            <ChevronDown size={14} />
          </button>

          {showDropdown && (
            <div className="user-dropdown-card">
              <button className="dropdown-item" onClick={() => { setShowDropdown(false); navigate("/admin/settings"); }}>
                <SettingsIcon size={15} /> Admin Settings
              </button>
              <button className="dropdown-item" onClick={() => { setShowDropdown(false); navigate("/dashboard"); }}>
                <User size={15} /> User Dashboard
              </button>
              <button className="dropdown-item danger" onClick={logout}>
                <LogOut size={15} /> Logout
              </button>
            </div>
          )}
        </div>

        {/* Logout Exit Icon Button */}
        <button
          className="admin-square-icon-btn"
          type="button"
          onClick={logout}
          title="Logout"
          aria-label="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
