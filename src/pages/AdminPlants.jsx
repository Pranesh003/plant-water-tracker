import { AlertTriangle, Droplets, Eye, Flame, Leaf, MapPin, Plus, Search, Sprout, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AdminHeader } from "../components/AdminSidebar.jsx";
import Pagination from "../components/Pagination.jsx";
import PlantStatusBadge from "../components/PlantStatusBadge.jsx";
import StatusFilter from "../components/StatusFilter.jsx";
import { api } from "../services/api.js";
import { calculateNextWateringDate, calculateWateringStatus, formatDate } from "../utils/wateringUtils.js";
import { getPlantIconUrl } from "../utils/plantIconUtils.js";

const PAGE_SIZE = 10;

export default function AdminPlants() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(searchParams.get("status") || "All");
  const [owner, setOwner] = useState("All");
  const [location, setLocation] = useState("All");
  const [page, setPage] = useState(1);

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const [userData, plantData] = await Promise.all([
        api.getUsers().catch(() => []),
        api.getAllPlants().catch(() => [])
      ]);
      setUsers(Array.isArray(userData) ? userData : []);
      setPlants(Array.isArray(plantData) ? plantData : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to load plants data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);
  useEffect(() => { setStatus(searchParams.get("status") || "All"); }, [searchParams]);

  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u.name])), [users]);

  const locations = useMemo(() => {
    const set = new Set();
    plants.forEach((p) => { if (p.location) set.add(p.location); });
    return Array.from(set);
  }, [plants]);

  const stats = useMemo(() => {
    let safe = 0;
    let soon = 0;
    let overdue = 0;
    plants.forEach((p) => {
      const st = calculateWateringStatus(p.lastWatered, p.frequency);
      if (st === "Safe") safe++;
      else if (st === "Water Soon") soon++;
      else if (st === "Overdue") overdue++;
    });
    return { total: plants.length, safe, soon, overdue };
  }, [plants]);

  const filteredPlants = useMemo(() => {
    return plants.filter((plant) => {
      const pStatus = calculateWateringStatus(plant.lastWatered, plant.frequency);
      if (query.trim()) {
        const ownerName = userMap.get(plant.userId) || "";
        const searchText = `${plant.name} ${plant.species || ""} ${ownerName} ${plant.location || ""}`.toLowerCase();
        if (!searchText.includes(query.toLowerCase())) return false;
      }
      if (status !== "All" && pStatus !== status) return false;
      if (owner !== "All" && plant.userId !== owner) return false;
      if (location !== "All" && plant.location !== location) return false;
      return true;
    });
  }, [plants, query, status, owner, location, userMap]);

  const paginatedPlants = useMemo(() => {
    return filteredPlants.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredPlants, page]);

  const changeStatus = (nextStatus) => {
    setPage(1);
    setStatus(nextStatus);
    if (nextStatus === "All") {
      searchParams.delete("status");
      setSearchParams(searchParams);
    } else {
      setSearchParams({ status: nextStatus });
    }
  };

  return (
    <div className="admin-plants-page" style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 40 }}>
      <AdminHeader title="Plants" eyebrow="PLANT MANAGEMENT" />
      <p style={{ margin: "-16px 0 24px 0", color: "#64748b", fontSize: "0.92rem", fontWeight: 500 }}>
        Manage all plant species, care schedules, user owners, and watering statuses across the system.
      </p>

      {error && (
        <div style={{ padding: "12px 16px", background: "#fef2f2", color: "#dc2626", borderRadius: 14, border: "1px solid #fecaca", marginBottom: 20, fontSize: "0.88rem", fontWeight: 700 }}>
          {error}
        </div>
      )}

      {/* Top 4 Summary Cards */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#ffffff", borderRadius: 20, padding: "18px 20px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "#f0fdf4", color: "#16a34a", display: "grid", placeItems: "center" }}>
            <Leaf size={22} />
          </div>
          <div>
            <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 700, display: "block" }}>Total Platform Plants</span>
            <strong style={{ fontSize: "1.45rem", fontWeight: 850, color: "#0f172a" }}>{stats.total} plants</strong>
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 20, padding: "18px 20px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "#dcfce7", color: "#15803d", display: "grid", placeItems: "center" }}>
            <Sprout size={22} />
          </div>
          <div>
            <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 700, display: "block" }}>Healthy & Safe</span>
            <strong style={{ fontSize: "1.45rem", fontWeight: 850, color: "#15803d" }}>{stats.safe} safe</strong>
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 20, padding: "18px 20px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "#fef3c7", color: "#d97706", display: "grid", placeItems: "center" }}>
            <Droplets size={22} />
          </div>
          <div>
            <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 700, display: "block" }}>Watering Soon</span>
            <strong style={{ fontSize: "1.45rem", fontWeight: 850, color: "#d97706" }}>{stats.soon} soon</strong>
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 20, padding: "18px 20px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "#fee2e2", color: "#dc2626", display: "grid", placeItems: "center" }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 700, display: "block" }}>Overdue Waterings</span>
            <strong style={{ fontSize: "1.45rem", fontWeight: 850, color: "#dc2626" }}>{stats.overdue} overdue</strong>
          </div>
        </div>
      </section>

      {/* Floating Filter Toolbar */}
      <section style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 12, flex: "1 1 360px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Search Box */}
          <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 340 }}>
            <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search plant, species, owner, location..."
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

          <StatusFilter value={status} onChange={changeStatus} allLabel="All Status" />
          
          <select
            value={owner}
            onChange={(e) => { setPage(1); setOwner(e.target.value); }}
            style={{ padding: "10px 14px", borderRadius: 14, border: "1px solid #cbd5e1", fontSize: "0.86rem", fontWeight: 700, color: "#334155", background: "#ffffff", cursor: "pointer" }}
            aria-label="Filter by owner"
          >
            <option value="All">All Owners</option>
            {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select>

          <select
            value={location}
            onChange={(e) => { setPage(1); setLocation(e.target.value); }}
            style={{ padding: "10px 14px", borderRadius: 14, border: "1px solid #cbd5e1", fontSize: "0.86rem", fontWeight: 700, color: "#334155", background: "#ffffff", cursor: "pointer" }}
            aria-label="Filter by location"
          >
            <option value="All">All Locations</option>
            {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>

        <Link
          to="/add-plant"
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
            textDecoration: "none",
            boxShadow: "0 6px 18px rgba(22, 163, 74, 0.25)",
            transition: "transform 0.18s ease"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
        >
          <Plus size={18} />
          <span>Add Plant</span>
        </Link>
      </section>

      {/* Main Covered White Card Table Container with Internal Scroll */}
      <section style={{ borderRadius: 20, background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#64748b", fontWeight: 600 }}>
            Loading plants data...
          </div>
        ) : filteredPlants.length ? (
          <>
            <div className="custom-scroll" style={{ maxHeight: 520, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#f8faf7", borderBottom: "1px solid #e2e8f0", fontSize: "0.78rem", fontWeight: 850, letterSpacing: "0.05em", color: "#0f172a" }}>
                    <th style={{ padding: "14px 18px" }}>PLANT NAME</th>
                    <th style={{ padding: "14px 18px" }}>SPECIES</th>
                    <th style={{ padding: "14px 18px" }}>OWNER</th>
                    <th style={{ padding: "14px 18px" }}>LOCATION</th>
                    <th style={{ padding: "14px 18px" }}>SCHEDULE</th>
                    <th style={{ padding: "14px 18px" }}>LAST WATERED</th>
                    <th style={{ padding: "14px 18px" }}>NEXT WATERING</th>
                    <th style={{ padding: "14px 18px" }}>STATUS</th>
                    <th style={{ padding: "14px 18px" }}>STREAK</th>
                    <th style={{ padding: "14px 18px", textAlign: "center" }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPlants.map((plant) => {
                    const pStatus = calculateWateringStatus(plant.lastWatered, plant.frequency);
                    const ownerName = userMap.get(plant.userId) || "Unknown";
                    const nextWatering = calculateNextWateringDate(plant.lastWatered, plant.frequency);
                    const rawId = plant.id || "0873bbf7";
                    const formattedId = rawId.length > 16 ? `${rawId.slice(0, 8)}-...` : rawId;

                    return (
                      <tr key={plant.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s ease" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f8faf7"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 12, overflow: "hidden", background: "#f0fdf4", border: "1px solid #bbf7d0", display: "grid", placeItems: "center", flexShrink: 0 }}>
                              {plant.photoUrl ? (
                                <img src={plant.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <img src={getPlantIconUrl(plant)} alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />
                              )}
                            </div>
                            <div>
                              <strong style={{ display: "block", color: "#0f172a", fontSize: "0.92rem", fontWeight: 800 }}>{plant.name}</strong>
                              <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontFamily: "monospace", fontWeight: 700 }} title={plant.id}>
                                ID: {formattedId}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "14px 18px", color: "#475569", fontSize: "0.86rem", fontStyle: "italic", whiteSpace: "nowrap" }}>
                          {plant.species || "Unknown species"}
                        </td>
                        <td style={{ padding: "14px 18px", fontWeight: 750, color: "#0f172a", fontSize: "0.88rem", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <User size={14} color="#0284c7" />
                            <span>{ownerName}</span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#16a34a", fontWeight: 700, fontSize: "0.84rem" }}>
                            <MapPin size={14} color="#16a34a" /> {plant.location || "Unspecified"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 18px", whiteSpace: "nowrap", color: "#0f172a", fontWeight: 700, fontSize: "0.86rem" }}>
                          {plant.frequency || 7} days
                        </td>
                        <td style={{ padding: "14px 18px", whiteSpace: "nowrap", color: "#64748b", fontSize: "0.85rem", fontWeight: 600 }}>
                          {plant.lastWatered ? formatDate(plant.lastWatered) : "Not yet"}
                        </td>
                        <td style={{ padding: "14px 18px", whiteSpace: "nowrap", color: "#0f172a", fontWeight: 750, fontSize: "0.85rem" }}>
                          {plant.lastWatered ? formatDate(nextWatering) : "Pending"}
                        </td>
                        <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                          <PlantStatusBadge status={pStatus} />
                        </td>
                        <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 10, background: "#fff7ed", color: "#ea580c", fontWeight: 800, fontSize: "0.82rem", border: "1px solid #ffedd5" }}>
                            <Flame size={13} /> {plant.currentStreak || 0}d
                          </span>
                        </td>
                        <td style={{ padding: "14px 18px", whiteSpace: "nowrap", textAlign: "center" }}>
                          <Link
                            to={`/plant/${plant.id}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "5px 12px",
                              borderRadius: 10,
                              background: "#f0fdf4",
                              color: "#16a34a",
                              fontWeight: 750,
                              fontSize: "0.8rem",
                              textDecoration: "none",
                              border: "1px solid #bbf7d0",
                              transition: "all 0.15s ease"
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#dcfce7"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "#f0fdf4"; }}
                          >
                            <Eye size={14} /> View
                          </Link>
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
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filteredPlants.length)} to {Math.min(page * PAGE_SIZE, filteredPlants.length)} of {filteredPlants.length} plants
              </span>
              <Pagination page={page} totalItems={filteredPlants.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
            </div>
          </>
        ) : (
          <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem" }}>No plants match your current filter selection.</p>
          </div>
        )}
      </section>
    </div>
  );
}
