import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { usePlantCare } from "../App.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LocationFilter from "../components/LocationFilter.jsx";
import Pagination from "../components/Pagination.jsx";
import PlantCard from "../components/PlantCard.jsx";
import StatusFilter from "../components/StatusFilter.jsx";
import { filterPlants } from "../utils/analyticsUtils.js";

const PAGE_SIZE = 6;

const quickFilters = [
  { key: "all", label: "All", status: "All" },
  { key: "need-watering", label: "Need Watering", status: "Water Soon" },
  { key: "overdue", label: "Overdue", status: "Overdue" },
  { key: "best-streak", label: "Best Streak", status: "All" }
];

const emptyMessage = {
  all: "Try another plant name or add it manually.",
  "need-watering": "No plants need watering right now. Keep growing.",
  overdue: "No overdue plants.",
  "best-streak": "No streak data available."
};

export default function MyPlants() {
  const { plants, deletePlant } = usePlantCare();
  const [searchParams, setSearchParams] = useSearchParams();
  const routeFilter = searchParams.get("filter") || "all";
  const activeFilter = quickFilters.some((filter) => filter.key === routeFilter) ? routeFilter : "all";
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(quickFilters.find((filter) => filter.key === activeFilter)?.status || "All");
  const [location, setLocation] = useState("All Plants");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [page, setPage] = useState(1);
  const bestStreak = useMemo(() => Math.max(0, ...plants.map((plant) => Number(plant.bestStreak || 0))), [plants]);

  useEffect(() => {
    setStatus(quickFilters.find((filter) => filter.key === activeFilter)?.status || "All");
    setPage(1);
  }, [activeFilter]);

  const filtered = useMemo(() => {
    const quickFiltered = activeFilter === "best-streak"
      ? plants.filter((plant) => bestStreak > 0 && Number(plant.bestStreak || 0) === bestStreak)
      : plants;
    return filterPlants(quickFiltered, { query, status, location });
  }, [plants, query, status, location, activeFilter, bestStreak]);
  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [query, status, location]);

  const applyQuickFilter = (filter) => {
    setSearchParams({ filter });
    setStatus(quickFilters.find((item) => item.key === filter)?.status || "All");
  };

  const changeStatus = (nextStatus) => {
    setStatus(nextStatus);
    if (activeFilter !== "all") setSearchParams({ filter: "all" });
  };

  const confirmDelete = async () => {
    await deletePlant(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <div className="my-plants-page-container">
      {/* Header */}
      <header className="dashboard-top-header">
        <div>
          <span className="eyebrow-tag">MY PLANTS</span>
          <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span>My Plants</span>
            <img src="/my_plants_icon.png" alt="My Plants Icon" style={{ width: 34, height: 34, objectFit: "contain" }} />
          </h1>
          <p>Keep track of your plants and their watering needs.</p>
        </div>
        <Link className="add-plant-btn-top" to="/add-plant"><Plus size={16} /> Add Plant</Link>
      </header>

      {/* Quick Filter Pills */}
      <section className="plant-filter-tabs-pills">
        {quickFilters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            className={activeFilter === filter.key ? "tab-pill active" : "tab-pill"}
            onClick={() => applyQuickFilter(filter.key)}
          >
            {filter.label}
          </button>
        ))}
      </section>

      {/* Floating Search & Filter Toolbar */}
      <section className="dashboard-floating-toolbar" style={{ marginTop: 16 }}>
        <div className="floating-search-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search for a plant..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <StatusFilter value={status} onChange={changeStatus} allLabel="All" />
        <LocationFilter value={location} onChange={setLocation} />
      </section>

      {/* Plant Grid / Empty State */}
      {filtered.length ? (
        <>
          <section className="my-plants-grid">
            {paginated.map((plant) => <PlantCard key={plant.id} plant={plant} onDelete={setPendingDelete} />)}
          </section>
          <Pagination page={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      ) : (
        <div className="my-plants-empty-card">
          <EmptyState title="No plants found." message={emptyMessage[activeFilter]} action="Add Plant" to="/add-plant" />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {pendingDelete && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="confirm-modal">
            <h2>Delete {pendingDelete.name}?</h2>
            <p>This action cannot be undone.</p>
            <div className="form-actions">
              <button className="ghost-btn" onClick={() => setPendingDelete(null)}>Cancel</button>
              <button className="primary-btn danger-solid" onClick={confirmDelete}>Delete</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
