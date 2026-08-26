import { ArrowLeft, CalendarDays, Droplets, Flame, Leaf } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EmptyState from "../components/EmptyState.jsx";
import Pagination from "../components/Pagination.jsx";
import PlantStatusBadge from "../components/PlantStatusBadge.jsx";
import SummaryCard from "../components/SummaryCard.jsx";
import { api } from "../services/api.js";
import { calculateNextWateringDate, calculateWateringStatus, formatDate } from "../utils/wateringUtils.js";

const PAGE_SIZE = 6;

export default function AdminUserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [plants, setPlants] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    Promise.all([api.getUsers(), api.getAllPlants()]).then(([userData, plantData]) => {
      setUsers(userData);
      setPlants(plantData);
    });
  }, []);

  const user = users.find((item) => item.id === id);
  const userPlants = useMemo(() => plants.filter((plant) => plant.userId === id), [plants, id]);
  const paginatedPlants = useMemo(() => userPlants.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [userPlants, page]);
  const counts = userPlants.reduce((acc, plant) => {
    acc[calculateWateringStatus(plant.lastWatered, plant.frequency)] += 1;
    return acc;
  }, { Safe: 0, "Water Soon": 0, Overdue: 0 });

  if (users.length && !user) return <EmptyState title="User not found." message="This user does not exist." action="Back to Users" to="/admin/users" />;
  if (!user) return <p className="loading">Loading user...</p>;

  return (
    <>
      <section className="page-title">
        <button className="ghost-btn back-link" type="button" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
        <p className="eyebrow">User profile</p>
        <h1>{user.name}</h1>
      </section>
      <section className="panel user-profile">
        <div><small>Name</small><strong>{user.name}</strong></div>
        <div><small>Email</small><span>{user.email}</span></div>
        <div><small>Role</small><span>{user.role}</span></div>
        <div><small>Account Status</small><span className={`status-badge ${user.status?.toLowerCase() === "suspended" ? "overdue" : "safe"}`}>{user.status}</span></div>
        <div><small>Created Date</small><span>{user.createdDate}</span></div>
      </section>
      <section className="page-title compact-title"><p className="eyebrow">Plant summary</p><h2>Plant Summary</h2></section>
      <section className="summary-grid">
        <SummaryCard icon={Leaf} label="Total Plants" value={userPlants.length} />
        <SummaryCard icon={Leaf} label="Safe Plants" value={counts.Safe} />
        <SummaryCard icon={Droplets} label="Needs Water" value={counts["Water Soon"]} tone="yellow" />
        <SummaryCard icon={CalendarDays} label="Overdue Plants" value={counts.Overdue} tone="red" />
      </section>
      <section className="page-title compact-title"><p className="eyebrow">User's plants</p><h2>User's Plants</h2></section>
      <section className="admin-table wide user-plant-list">
        {paginatedPlants.map((plant) => (
          <article key={plant.id}>
            <div><small>Plant Name</small><strong>{plant.icon} {plant.name}</strong></div>
            <div><small>Species</small><span>{plant.species}</span></div>
            <div><small>Room</small><span>{plant.room || plant.location}</span></div>
            <div><small>Watering Frequency</small><span>Every {plant.frequency} days</span></div>
            <div><small>Last Watered</small><span>{formatDate(plant.lastWatered)}</span></div>
            <div><small>Next Watering</small><span>{formatDate(calculateNextWateringDate(plant.lastWatered, plant.frequency))}</span></div>
            <div><small>Status</small><PlantStatusBadge status={calculateWateringStatus(plant.lastWatered, plant.frequency)} /></div>
            <div><small>Current Streak</small><span><Flame size={14} /> {plant.currentStreak} days</span></div>
          </article>
        ))}
      </section>
      <Pagination page={page} totalItems={userPlants.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </>
  );
}
