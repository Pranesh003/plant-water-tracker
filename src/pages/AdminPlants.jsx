import { MapPin, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AdminHeader } from "../components/AdminSidebar.jsx";
import Pagination from "../components/Pagination.jsx";
import PlantStatusBadge from "../components/PlantStatusBadge.jsx";
import StatusFilter from "../components/StatusFilter.jsx";
import { api } from "../services/api.js";
import { calculateNextWateringDate, calculateWateringStatus, formatDate } from "../utils/wateringUtils.js";
import { getPlantIconUrl } from "../utils/plantIconUtils.js";

const PAGE_SIZE = 8;

export default function AdminPlants() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
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
      setError(err.message || "Unable to load plants. Please try again.");
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

  const filteredPlants = useMemo(() => {
    return plants.filter((plant) => {
      const pStatus = calculateWateringStatus(plant.lastWatered, plant.frequency);
      if (status !== "All" && pStatus !== status) return false;
      if (owner !== "All" && plant.userId !== owner) return false;
      if (location !== "All" && plant.location !== location) return false;
      return true;
    });
  }, [plants, status, owner, location]);

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
    <div className="admin-plants-page">
      <AdminHeader title="Plants" eyebrow="PLANT MANAGEMENT" />
      <p style={{ margin: "-18px 0 24px 0", color: "var(--muted)", fontSize: "0.92rem" }}>
        Manage all plants in the system.
      </p>

      {error && <p className="error" role="alert" style={{ marginBottom: 16 }}>{error}</p>}

      {/* Floating Filter Toolbar */}
      <section className="dashboard-floating-toolbar admin-toolbar-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <StatusFilter value={status} onChange={changeStatus} allLabel="All Status" />
          
          <select value={owner} onChange={(e) => { setPage(1); setOwner(e.target.value); }} aria-label="Filter by owner">
            <option value="All">All Owners</option>
            {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select>

          <select value={location} onChange={(e) => { setPage(1); setLocation(e.target.value); }} aria-label="Filter by location">
            <option value="All">All Locations</option>
            {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>

        <Link className="add-plant-btn-top" to="/add-plant">
          <Plus size={16} /> Add Plant
        </Link>
      </section>

      {/* Large Covered White Card Container */}
      <section className="panel admin-table-panel" style={{ padding: 0, overflow: "hidden", borderRadius: 24, background: "#ffffff", border: "1px solid #e1ebe0" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Loading plants...</div>
        ) : filteredPlants.length ? (
          <>
            <div style={{ overflowX: "auto" }}>
              <table className="admin-data-table admin-plants-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8faf7", borderBottom: "1px solid #e1ebe0", textAlign: "left", fontSize: "0.78rem", fontWeight: 850, letterSpacing: "0.05em", color: "#1b4332" }}>
                    <th style={{ padding: "14px 18px" }}>PLANT NAME</th>
                    <th style={{ padding: "14px 18px" }}>SPECIES</th>
                    <th style={{ padding: "14px 18px" }}>OWNER</th>
                    <th style={{ padding: "14px 18px" }}>LOCATION</th>
                    <th style={{ padding: "14px 18px" }}>FREQUENCY</th>
                    <th style={{ padding: "14px 18px" }}>LAST WATERED</th>
                    <th style={{ padding: "14px 18px" }}>NEXT WATERING</th>
                    <th style={{ padding: "14px 18px" }}>STATUS</th>
                    <th style={{ padding: "14px 18px" }}>STREAK</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPlants.map((plant) => {
                    const pStatus = calculateWateringStatus(plant.lastWatered, plant.frequency);
                    const ownerName = userMap.get(plant.userId) || "Unknown";
                    const nextWatering = calculateNextWateringDate(plant.lastWatered, plant.frequency);
                    const rawId = plant.id || "0873bbf7";
                    const formattedId = rawId.length > 20 ? `${rawId.slice(0, 8)}-${rawId.slice(8, 12)}-...` : rawId;

                    return (
                      <tr key={plant.id} style={{ borderBottom: "1px solid #f0f7ef", fontSize: "0.88rem" }}>
                        <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, overflow: "hidden", background: "#e8f3e7", display: "grid", placeItems: "center", flexShrink: 0 }}>
                              {plant.photoUrl ? <img src={plant.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <img src={getPlantIconUrl(plant)} alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />}
                            </div>
                            <div>
                              <strong style={{ display: "block", color: "#1b4332", fontSize: "0.9rem" }}>{plant.name}</strong>
                              <small style={{ fontSize: "0.72rem", color: "var(--muted)", fontFamily: "monospace" }} title={plant.id}>
                                ID: {formattedId}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "14px 18px", color: "var(--muted)", whiteSpace: "nowrap" }}>
                          {plant.species || "Unknown species"}
                        </td>
                        <td style={{ padding: "14px 18px", fontWeight: 650, color: "#1b4332", whiteSpace: "nowrap" }}>
                          {ownerName}
                        </td>
                        <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--muted)", fontSize: "0.86rem" }}>
                            <MapPin size={14} color="#52b788" /> {plant.location || "N/A"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 18px", whiteSpace: "nowrap", color: "#1b4332" }}>
                          {plant.frequency || 7} days
                        </td>
                        <td style={{ padding: "14px 18px", whiteSpace: "nowrap", color: "var(--muted)" }}>
                          {plant.lastWatered ? formatDate(plant.lastWatered) : "Not yet"}
                        </td>
                        <td style={{ padding: "14px 18px", whiteSpace: "nowrap", color: "#1b4332", fontWeight: 650 }}>
                          {plant.lastWatered ? formatDate(nextWatering) : "Pending"}
                        </td>
                        <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                          <PlantStatusBadge status={pStatus} />
                        </td>
                        <td style={{ padding: "14px 18px", whiteSpace: "nowrap", fontWeight: 750, color: "#1b4332" }}>
                          {plant.currentStreak || 0} days
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
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filteredPlants.length)} to {Math.min(page * PAGE_SIZE, filteredPlants.length)} of {filteredPlants.length} plants
              </span>
              <Pagination page={page} totalItems={filteredPlants.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
            </div>
          </>
        ) : (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
            No plants match your filter selection.
          </div>
        )}
      </section>
    </div>
  );
}
