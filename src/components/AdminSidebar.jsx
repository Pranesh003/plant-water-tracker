import { ChevronDown, LayoutDashboard, Leaf, LogOut, Settings, Sprout, UserCircle, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";

export default function AdminSidebar() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    api.getUser().then(setAdmin);
  }, []);

  useEffect(() => {
    const closeMenu = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  const logout = async () => {
    await api.logout();
    navigate("/signin");
  };

  const adminName = admin?.name || "Admin";

  return (
    <>
      <header className="topbar admin-topbar">
        <strong className="brand"><span className="brand-mark"><Sprout size={22} /></span><span>Admin</span></strong>
        <nav className="desktop-nav" aria-label="Admin navigation">
          <NavLink to="/admin"><LayoutDashboard size={18} /> Dashboard</NavLink>
          <NavLink to="/admin/users"><Users size={18} /> Users</NavLink>
          <NavLink to="/admin/plants"><Leaf size={18} /> Plants</NavLink>
        </nav>
        <div className="admin-actions">
          <button className="icon-btn admin-settings-btn" type="button" onClick={() => navigate("/admin/settings")} aria-label="Open settings">
            <Settings size={18} />
          </button>
          <div className="profile-menu" ref={menuRef}>
            <button className="profile-menu-trigger" type="button" onClick={() => setOpen((value) => !value)} aria-label="Open admin profile" aria-haspopup="menu" aria-expanded={open}>
              <span className="avatar" aria-hidden="true">{adminName[0]}</span>
              <span className="profile-name">{adminName}</span>
              <ChevronDown size={16} />
            </button>
            {open && (
              <div className="profile-dropdown" role="menu">
                <button type="button" role="menuitem" onClick={() => { setOpen(false); navigate("/admin/profile"); }}><UserCircle size={16} /> Profile</button>
                <button type="button" role="menuitem" onClick={() => { setOpen(false); navigate("/admin/settings"); }}><Settings size={16} /> Settings</button>
                <button type="button" role="menuitem" onClick={logout}><LogOut size={16} /> Logout</button>
              </div>
            )}
          </div>
          <button className="ghost-btn logout-btn" type="button" onClick={logout} aria-label="Logout"><LogOut size={18} /> Logout</button>
        </div>
      </header>
      <nav className="mobile-nav admin-mobile-nav" aria-label="Admin mobile navigation">
        <NavLink to="/admin"><LayoutDashboard size={18} /><span>Dashboard</span></NavLink>
        <NavLink to="/admin/users"><Users size={18} /><span>Users</span></NavLink>
        <NavLink to="/admin/plants"><Leaf size={18} /><span>Plants</span></NavLink>
        <NavLink to="/admin/settings"><Settings size={18} /><span>Settings</span></NavLink>
      </nav>
    </>
  );
}
