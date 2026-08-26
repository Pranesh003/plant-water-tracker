import { Eye, MapPin, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PlantStatusBadge from "../components/PlantStatusBadge.jsx";
import Pagination from "../components/Pagination.jsx";
import StatusFilter from "../components/StatusFilter.jsx";
import { api } from "../services/api.js";
import { calculateNextWateringDate, calculateWateringStatus, formatDate } from "../utils/wateringUtils.js";

const PAGE_SIZE = 8;

export default function AdminPlants() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [plants, setPlants] = useState([]);
  const [status, setStatus] = useState(searchParams.get("status") || "All");
  const [owner, setOwner] = useState("All");
  const [location, setLocation] = useState("All");
  const [page, setPage] = useState(1);
  const refresh = () => Promise.all([api.getUsers(), api.getAllPlants()]).then(([userData, plantData]) => { setUsers(userData); setPlants(plantData); });
  useEffect(() => { refresh(); }, []);
  useEffect(() => { setStatus(searchParams.get("status") || "All"); }, [searchParams]);
  const ownerName = (id) => users.find((user) => user.id === id)?.name || "Unknown";
  const locations = useMemo(() => [...new Set(plants.map((plant) => plant.location).filter(Boolean))].sort(), [plants]);
  const filtered = useMemo(() => plants.filter((plant) => {
    const matchesStatus = status === "All" || calculateWateringStatus(plant.lastWatered, plant.frequency) === status;
    const matchesOwner = owner === "All" || plant.userId === owner;
    const matchesLocation = location === "All" || plant.location === location;
    return matchesStatus && matchesOwner && matchesLocation;
  }), [plants, status, owner, location]);
  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);
  const remove = async (plant) => {
    if (window.confirm(`Delete ${plant.name}? This action cannot be undone.`)) {
      await api.deletePlant(plant.id);
      refresh();
    }
  };
  const changeStatus = (nextStatus) => {
    setPage(1);
    setStatus(nextStatus);
    const nextParams = new URLSearchParams(searchParams);
    if (nextStatus === "All") nextParams.delete("status");
    else nextParams.set("status", nextStatus);
    setSearchParams(nextParams, { replace: true });
  };
  const changeOwner = (nextOwner) => {
    setPage(1);
    setOwner(nextOwner);
  };
  const changeLocation = (nextLocation) => {
    setPage(1);
    setLocation(nextLocation);
  };

  return (
    <>
      <section className="page-title"><p className="eyebrow">Admin</p><h1>Plants</h1></section>
      <section className="toolbar admin-filter-toolbar" aria-label="Filter plants">
        <StatusFilter value={status} onChange={changeStatus} allLabel="All Status" />
        <select value={owner} onChange={(e) => changeOwner(e.target.value)} aria-label="Filter by owner"><option value="All">All Owners</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select>
        <select value={location} onChange={(e) => changeLocation(e.target.value)} aria-label="Filter by location"><option value="All">All Locations</option>{locations.map((item) => <option key={item}>{item}</option>)}</select>
      </section>
      <section className="admin-table-shell">
        {filtered.length ? (
          <table className="admin-data-table admin-plants-table">
            <thead>
              <tr>
                <th>Plant Name</th>
                <th>Species</th>
                <th>Owner</th>
                <th>Location</th>
                <th>Frequency</th>
                <th>Last Watered</th>
                <th>Next Watering</th>
                <th>Status</th>
                <th>Streak</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((plant) => {
                const plantStatus = calculateWateringStatus(plant.lastWatered, plant.frequency);
                return (
                  <tr key={plant.id}>
                    <td>
                      <div className="admin-plant-cell">
                        <span className="admin-plant-thumb">{plant.photoUrl ? <img src={plant.photoUrl} alt="" /> : plant.icon || "P"}</span>
                        <div><strong>{plant.name}</strong><small>ID: {plant.id}</small></div>
                      </div>
                    </td>
                    <td>{plant.species}</td>
                    <td>{ownerName(plant.userId)}</td>
                    <td><span className="table-icon-text"><MapPin size={15} /> {plant.location}</span></td>
                    <td>{plant.frequency} days</td>
                    <td>{formatDate(plant.lastWatered)}</td>
                    <td>{formatDate(calculateNextWateringDate(plant.lastWatered, plant.frequency))}</td>
                    <td><PlantStatusBadge status={plantStatus} /></td>
                    <td><strong>{plant.currentStreak || 0} days</strong></td>
                    <td>
                      <div className="table-actions compact">
                        <Link className="table-icon-btn view" to={`/plant/${plant.id}`} aria-label="View plant"><Eye size={17} /></Link>
                        <button className="table-icon-btn delete" type="button" onClick={() => remove(plant)} aria-label="Delete plant"><Trash2 size={17} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="admin-empty-state"><span aria-hidden="true">P</span><h2>No plants found</h2><p>Try changing your filters to see more plants.</p></div>
        )}
      </section>
      <Pagination page={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </>
  );
}
