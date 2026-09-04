import { Calendar, Edit, Eye, Mail, Plus, Search, Shield, Sprout, User, UserCheck, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AdminHeader } from "../components/AdminSidebar.jsx";
import Pagination from "../components/Pagination.jsx";
import { api } from "../services/api.js";

const PAGE_SIZE = 10;

const AVATAR_COLORS = [
  { bg: "#dcfce7", color: "#15803d" },
  { bg: "#e0f2fe", color: "#0369a1" },
  { bg: "#fef3c7", color: "#b45309" },
  { bg: "#f3e8ff", color: "#7e22ce" },
  { bg: "#ffe4e6", color: "#be123c" }
];

const getAvatarStyle = (name) => {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

export default function AdminUsers() {
  const navigate = useNavigate();
  const [data, setData] = useState({ users: [], plants: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  
  // Filter states
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All Roles");
  const [userStatus, setUserStatus] = useState("All Status");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "user" });

  const refreshData = () => {
    setLoading(true);
    setError("");
    Promise.all([
      api.getUsers().catch(() => []),
      api.getAllPlants().catch(() => [])
    ])
      .then(([users, plants]) => {
        setData({
          users: Array.isArray(users) ? users : [],
          plants: Array.isArray(plants) ? plants : []
        });
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load users data.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { refreshData(); }, []);

  const usersList = Array.isArray(data.users) ? data.users : [];
  const plantsList = Array.isArray(data.plants) ? data.plants : [];

  const plantsCountMap = useMemo(() => {
    const map = new Map();
    plantsList.forEach((plant) => {
      if (plant.userId) {
        map.set(plant.userId, (map.get(plant.userId) || 0) + 1);
      }
    });
    return map;
  }, [plantsList]);

  const stats = useMemo(() => {
    const total = usersList.length;
    const active = usersList.filter(u => (u.status || "Active").toLowerCase() === "active").length;
    const admins = usersList.filter(u => (u.role || "user").toLowerCase() === "admin").length;
    const totalPlants = plantsList.length;
    return { total, active, admins, totalPlants };
  }, [usersList, plantsList]);

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      if (query.trim()) {
        const text = `${u.name} ${u.email}`.toLowerCase();
        if (!text.includes(query.toLowerCase())) return false;
      }
      if (role !== "All Roles" && (u.role || "user").toLowerCase() !== role.toLowerCase()) return false;
      if (userStatus !== "All Status" && (u.status || "Active").toLowerCase() !== userStatus.toLowerCase()) return false;
      return true;
    });
  }, [usersList, query, role, userStatus]);

  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredUsers, page]);

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim()) return;
    try {
      await api.signUp({ name: newUser.name.trim(), email: newUser.email.trim(), role: newUser.role });
      setShowAddUserModal(false);
      setNewUser({ name: "", email: "", role: "user" });
      refreshData();
    } catch {
      setError("Failed to add user.");
    }
  };

  return (
    <div className="admin-users-page" style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 40 }}>
      <AdminHeader title="Users" eyebrow="USER MANAGEMENT" />
      <p style={{ margin: "-16px 0 24px 0", color: "#64748b", fontSize: "0.92rem", fontWeight: 500 }}>
        Manage platform accounts, role permissions, and user activity status.
      </p>

      {error && (
        <div style={{ padding: "12px 16px", background: "#fef2f2", color: "#dc2626", borderRadius: 14, border: "1px solid #fecaca", marginBottom: 20, fontSize: "0.88rem", fontWeight: 700 }}>
          {error}
        </div>
      )}

      {/* Top 4 Summary Cards */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#ffffff", borderRadius: 20, padding: "18px 20px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "#e0f2fe", color: "#0284c7", display: "grid", placeItems: "center" }}>
            <Users size={22} />
          </div>
          <div>
            <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 700, display: "block" }}>Total Registered</span>
            <strong style={{ fontSize: "1.45rem", fontWeight: 850, color: "#0f172a" }}>{stats.total} users</strong>
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 20, padding: "18px 20px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "#dcfce7", color: "#16a34a", display: "grid", placeItems: "center" }}>
            <UserCheck size={22} />
          </div>
          <div>
            <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 700, display: "block" }}>Active Accounts</span>
            <strong style={{ fontSize: "1.45rem", fontWeight: 850, color: "#16a34a" }}>{stats.active} active</strong>
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 20, padding: "18px 20px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "#f3e8ff", color: "#7e22ce", display: "grid", placeItems: "center" }}>
            <Shield size={22} />
          </div>
          <div>
            <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 700, display: "block" }}>Administrators</span>
            <strong style={{ fontSize: "1.45rem", fontWeight: 850, color: "#7e22ce" }}>{stats.admins} admins</strong>
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 20, padding: "18px 20px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "#fef3c7", color: "#d97706", display: "grid", placeItems: "center" }}>
            <Sprout size={22} />
          </div>
          <div>
            <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 700, display: "block" }}>Total User Plants</span>
            <strong style={{ fontSize: "1.45rem", fontWeight: 850, color: "#d97706" }}>{stats.totalPlants} plants</strong>
          </div>
        </div>
      </section>

      {/* Floating Toolbar Row */}
      <section style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 12, flex: "1 1 360px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Search Box */}
          <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 380 }}>
            <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search by user name or email..."
              value={query}
              onChange={(e) => { setPage(1); setQuery(e.target.value); }}
              style={{
                width: "100%",
                padding: "10px 14px 10px 42px",
                borderRadius: 14,
                border: "1px solid #cbd5e1",
                fontSize: "0.88rem",
                outline: "none",
                background: "#ffffff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
              }}
            />
          </div>

          {/* Role Filter Dropdown */}
          <select
            value={role}
            onChange={(e) => { setPage(1); setRole(e.target.value); }}
            style={{ padding: "10px 14px", borderRadius: 14, border: "1px solid #cbd5e1", fontSize: "0.86rem", fontWeight: 700, color: "#334155", background: "#ffffff", cursor: "pointer" }}
            aria-label="Filter by role"
          >
            <option value="All Roles">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          {/* Status Filter Dropdown */}
          <select
            value={userStatus}
            onChange={(e) => { setPage(1); setUserStatus(e.target.value); }}
            style={{ padding: "10px 14px", borderRadius: 14, border: "1px solid #cbd5e1", fontSize: "0.86rem", fontWeight: 700, color: "#334155", background: "#ffffff", cursor: "pointer" }}
            aria-label="Filter by status"
          >
            <option value="All Status">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Add User Button */}
        <button
          onClick={() => setShowAddUserModal(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 20px",
            borderRadius: 14,
            background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
            color: "#ffffff",
            fontWeight: 800,
            fontSize: "0.9rem",
            border: "none",
            boxShadow: "0 6px 18px rgba(22, 163, 74, 0.25)",
            cursor: "pointer",
            transition: "transform 0.18s ease"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
        >
          <Plus size={18} />
          <span>Add User</span>
        </button>
      </section>

      {/* Main Covered White Card Table Container with Internal Scroll */}
      <section style={{ borderRadius: 20, background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#64748b", fontWeight: 600 }}>
            Loading users data...
          </div>
        ) : filteredUsers.length ? (
          <>
            <div className="custom-scroll" style={{ maxHeight: 520, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#f8faf7", borderBottom: "1px solid #e2e8f0", fontSize: "0.78rem", fontWeight: 850, letterSpacing: "0.05em", color: "#0f172a" }}>
                    <th style={{ padding: "14px 20px" }}>USER</th>
                    <th style={{ padding: "14px 20px" }}>EMAIL</th>
                    <th style={{ padding: "14px 20px" }}>ROLE</th>
                    <th style={{ padding: "14px 20px" }}>PLANTS</th>
                    <th style={{ padding: "14px 20px" }}>JOINED DATE</th>
                    <th style={{ padding: "14px 20px" }}>STATUS</th>
                    <th style={{ padding: "14px 20px", textAlign: "center" }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((usr, index) => {
                    const initials = usr.name
                      ? usr.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()
                      : "U";
                    const usrRole = (usr.role || "user").toLowerCase();
                    const isAdmin = usrRole === "admin";
                    const usrPlantsCount = plantsCountMap.get(usr.id) || 0;
                    const joinedDate = usr.createdDate || "2026-08-27";
                    const usrIdTag = `USR${String((page - 1) * PAGE_SIZE + index + 1).padStart(3, "0")}`;
                    const avatarStyle = getAvatarStyle(usr.name);

                    return (
                      <tr key={usr.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s ease" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f8faf7"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "14px 20px", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: "50%", background: avatarStyle.bg, color: avatarStyle.color, fontWeight: 850, display: "grid", placeItems: "center", fontSize: "0.88rem", flexShrink: 0, border: `1px solid ${avatarStyle.color}33` }}>
                              {initials}
                            </div>
                            <div>
                              <strong style={{ display: "block", color: "#0f172a", fontSize: "0.92rem", fontWeight: 800 }}>{usr.name}</strong>
                              <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontFamily: "monospace", fontWeight: 700 }}>
                                ID: {usrIdTag}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "14px 20px", color: "#334155", fontWeight: 600, fontSize: "0.88rem", whiteSpace: "nowrap" }}>
                          {usr.email}
                        </td>
                        <td style={{ padding: "14px 20px", whiteSpace: "nowrap" }}>
                          <span style={{
                            padding: "4px 12px",
                            borderRadius: 12,
                            fontSize: "0.78rem",
                            fontWeight: 800,
                            background: isAdmin ? "#f3e8ff" : "#e0f2fe",
                            color: isAdmin ? "#7e22ce" : "#0369a1",
                            border: `1px solid ${isAdmin ? "#e9d5ff" : "#bae6fd"}`
                          }}>
                            {isAdmin ? "Admin" : "User"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px", whiteSpace: "nowrap" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 10, background: "#f0fdf4", color: "#16a34a", fontWeight: 800, fontSize: "0.82rem", border: "1px solid #bbf7d0" }}>
                            <Sprout size={13} /> {usrPlantsCount}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px", whiteSpace: "nowrap", color: "#64748b", fontSize: "0.85rem", fontWeight: 600 }}>
                          {joinedDate}
                        </td>
                        <td style={{ padding: "14px 20px", whiteSpace: "nowrap" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 12, fontSize: "0.78rem", fontWeight: 800, background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} />
                            Active
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px", whiteSpace: "nowrap", textAlign: "center" }}>
                          <div style={{ display: "inline-flex", gap: 8 }}>
                            <button
                              type="button"
                              style={{ width: 34, height: 34, borderRadius: 10, background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#475569", display: "grid", placeItems: "center", cursor: "pointer", transition: "all 0.15s ease" }}
                              onClick={() => navigate(`/admin/users/${usr.id}`)}
                              title="View user details"
                              onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#0f172a"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#475569"; }}
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              type="button"
                              style={{ width: 34, height: 34, borderRadius: 10, background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#475569", display: "grid", placeItems: "center", cursor: "pointer", transition: "all 0.15s ease" }}
                              onClick={() => navigate(`/admin/users/${usr.id}/manage`)}
                              title="Edit user permissions"
                              onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#0f172a"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#475569"; }}
                            >
                              <Edit size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e2e8f0", fontSize: "0.86rem", color: "#64748b", fontWeight: 600, background: "#ffffff" }}>
              <span>
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filteredUsers.length)} to {Math.min(page * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length} users
              </span>
              <Pagination page={page} totalItems={filteredUsers.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
            </div>
          </>
        ) : (
          <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem" }}>No users match your filter criteria.</p>
          </div>
        )}
      </section>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(6px)", zIndex: 100, display: "grid", placeItems: "center", padding: 16 }}>
          <section style={{ width: "100%", maxWidth: 440, padding: 26, borderRadius: 20, background: "#ffffff", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#0f172a", fontWeight: 850 }}>Add New User Account</h2>
              <button onClick={() => setShowAddUserModal(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 10, width: 32, height: 32, display: "grid", placeItems: "center", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddUserSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 750, color: "#0f172a", fontSize: "0.88rem" }}>
                Full Name
                <input type="text" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="Jane Doe" required style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 750, color: "#0f172a", fontSize: "0.88rem" }}>
                Email Address
                <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="jane@example.com" required style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 750, color: "#0f172a", fontSize: "0.88rem" }}>
                Role Permission
                <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: "0.9rem", fontWeight: 700 }}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                <button type="button" onClick={() => setShowAddUserModal(false)} style={{ flex: 1, padding: "11px", borderRadius: 12, border: "1px solid #cbd5e1", background: "#f8faf7", fontWeight: 750, color: "#475569", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: "11px", borderRadius: 12, border: "none", background: "#16a34a", color: "#ffffff", fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 14px rgba(22, 163, 74, 0.25)" }}>Create Account</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
