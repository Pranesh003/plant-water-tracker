import { Edit, Eye, Plus, Search, User, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AdminHeader } from "../components/AdminSidebar.jsx";
import Pagination from "../components/Pagination.jsx";
import { api } from "../services/api.js";

const PAGE_SIZE = 8;

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
    <div className="admin-users-page">
      <AdminHeader title="Users" eyebrow="USER MANAGEMENT" />
      <p style={{ margin: "-18px 0 24px 0", color: "var(--muted)", fontSize: "0.92rem" }}>
        Manage all users registered in the system.
      </p>

      {error && <p className="error" role="alert" style={{ marginBottom: 16 }}>{error}</p>}

      {/* Floating Toolbar Row matching screenshot */}
      <section className="dashboard-floating-toolbar admin-toolbar-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 14, flex: 1, alignItems: "center" }}>
          {/* Search Box */}
          <div className="floating-search-wrap" style={{ flex: "1 1 320px", maxWidth: 400 }}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search users..."
              value={query}
              onChange={(e) => { setPage(1); setQuery(e.target.value); }}
            />
          </div>

          {/* Role Filter Dropdown */}
          <select value={role} onChange={(e) => { setPage(1); setRole(e.target.value); }} aria-label="Filter by role">
            <option value="All Roles">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          {/* Status Filter Dropdown */}
          <select value={userStatus} onChange={(e) => { setPage(1); setUserStatus(e.target.value); }} aria-label="Filter by status">
            <option value="All Status">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Add User Button */}
        <button className="add-plant-btn-top" onClick={() => setShowAddUserModal(true)}>
          <Plus size={16} /> Add User
        </button>
      </section>

      {/* Large Covered White Card Container */}
      <section className="panel admin-table-panel" style={{ padding: 0, overflow: "hidden", borderRadius: 24, background: "#ffffff", border: "1px solid #e1ebe0" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Loading users...</div>
        ) : filteredUsers.length ? (
          <>
            <div style={{ overflowX: "auto" }}>
              <table className="admin-data-table admin-users-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8faf7", borderBottom: "1px solid #e1ebe0", textAlign: "left", fontSize: "0.78rem", fontWeight: 850, letterSpacing: "0.05em", color: "#1b4332" }}>
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
                    const usrIdTag = `USR${String(index + 1).padStart(3, "0")}`;

                    return (
                      <tr key={usr.id} style={{ borderBottom: "1px solid #f0f7ef", fontSize: "0.88rem" }}>
                        <td style={{ padding: "14px 20px", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#d8e7d7", color: "#1b4332", fontWeight: 900, display: "grid", placeItems: "center", fontSize: "0.85rem", flexShrink: 0 }}>
                              {initials}
                            </div>
                            <div>
                              <strong style={{ display: "block", color: "#1b4332", fontSize: "0.9rem" }}>{usr.name}</strong>
                              <small style={{ fontSize: "0.72rem", color: "var(--muted)", fontFamily: "monospace" }}>
                                ID: {usrIdTag}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "14px 20px", color: "#1b4332", whiteSpace: "nowrap" }}>
                          {usr.email}
                        </td>
                        <td style={{ padding: "14px 20px", whiteSpace: "nowrap" }}>
                          <span style={{
                            padding: "4px 12px",
                            borderRadius: 999,
                            fontSize: "0.78rem",
                            fontWeight: 800,
                            background: isAdmin ? "#f3e8ff" : "#e0f2fe",
                            color: isAdmin ? "#7e22ce" : "#0369a1"
                          }}>
                            {isAdmin ? "Admin" : "User"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px", whiteSpace: "nowrap", fontWeight: 700, color: "#1b4332" }}>
                          {usrPlantsCount}
                        </td>
                        <td style={{ padding: "14px 20px", whiteSpace: "nowrap", color: "var(--muted)" }}>
                          {joinedDate}
                        </td>
                        <td style={{ padding: "14px 20px", whiteSpace: "nowrap" }}>
                          <span style={{ padding: "4px 12px", borderRadius: 999, fontSize: "0.78rem", fontWeight: 800, background: "#dcfce7", color: "#15803d" }}>
                            Active
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px", whiteSpace: "nowrap", textAlign: "center" }}>
                          <div style={{ display: "inline-flex", gap: 8 }}>
                            <button
                              type="button"
                              className="icon-btn"
                              style={{ width: 34, height: 34, borderRadius: 10, background: "#f0f7ef", border: "1px solid #d8e5d7", color: "#1b4332", display: "grid", placeItems: "center", cursor: "pointer" }}
                              onClick={() => navigate(`/admin/users/${usr.id}`)}
                              title="View details"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              type="button"
                              className="icon-btn"
                              style={{ width: 34, height: 34, borderRadius: 10, background: "#f0f7ef", border: "1px solid #d8e5d7", color: "#1b4332", display: "grid", placeItems: "center", cursor: "pointer" }}
                              onClick={() => navigate(`/admin/users/${usr.id}/manage`)}
                              title="Edit user"
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
            <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e1ebe0", fontSize: "0.86rem", color: "var(--muted)" }}>
              <span>
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filteredUsers.length)} to {Math.min(page * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length} users
              </span>
              <Pagination page={page} totalItems={filteredUsers.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
            </div>
          </>
        ) : (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
            No users match your filter selection.
          </div>
        )}
      </section>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="confirm-modal" style={{ maxWidth: 440, padding: 24, borderRadius: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#1b4332" }}>Add New User</h2>
              <button className="ghost-btn" onClick={() => setShowAddUserModal(false)} style={{ padding: 4 }}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddUserSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label htmlFor="modal-user-name" style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 750, color: "#1b4332" }}>
                Full Name
                <input id="modal-user-name" type="text" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="John Doe" required />
              </label>
              <label htmlFor="modal-user-email" style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 750, color: "#1b4332" }}>
                Email Address
                <input id="modal-user-email" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="john@example.com" required />
              </label>
              <label htmlFor="modal-user-role" style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 750, color: "#1b4332" }}>
                Role
                <select id="modal-user-role" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                <button type="button" className="ghost-btn" onClick={() => setShowAddUserModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="primary-btn" style={{ flex: 1 }}>Create User</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
