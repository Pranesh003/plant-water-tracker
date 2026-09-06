import { Leaf, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { usePlantCare } from "../App.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LocationFilter from "../components/LocationFilter.jsx";
import Pagination from "../components/Pagination.jsx";
import PlantCard from "../components/PlantCard.jsx";
import StatusFilter from "../components/StatusFilter.jsx";
import { filterPlants } from "../utils/analyticsUtils.js";
import { useTranslation } from "../utils/i18n.js";

const PAGE_SIZE = 6;

export default function MyPlants() {
  const { plants, deletePlant } = usePlantCare();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const quickFilters = useMemo(() => [
    { key: "all", label: t("tab_all"), status: "All" },
    { key: "need-watering", label: t("tab_need_watering"), status: "Water Soon" },
    { key: "overdue", label: t("tab_overdue"), status: "Overdue" },
    { key: "best-streak", label: t("tab_best_streak"), status: "All" }
  ], [t]);

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
  }, [activeFilter, quickFilters]);

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
          <span className="eyebrow-tag">{t("my_plants_tag")}</span>
          <h1 style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
            <span>{t("my_plants_title")}</span>
            <img src="/my_plants_icon.png" alt="My Plants Icon" style={{ width: 32, height: 32, objectFit: "contain" }} />
          </h1>
          <p>{t("my_plants_subtitle")}</p>
        </div>
        <Link className="add-plant-btn-top" to="/add-plant"><Plus size={16} /> {t("btn_add_plant")}</Link>
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
            placeholder={t("search_plant_placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <StatusFilter value={status} onChange={changeStatus} allLabel={t("tab_all")} />
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
          <EmptyState title="No plants found." message="Try searching or adding a new plant." action={t("btn_add_plant")} to="/add-plant" />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {pendingDelete && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="confirm-modal">
            <h2>{t("btn_delete")} {pendingDelete.name}?</h2>
            <p>This action cannot be undone.</p>
            <div className="form-actions">
              <button className="ghost-btn" onClick={() => setPendingDelete(null)}>{t("btn_cancel")}</button>
              <button className="primary-btn danger-solid" onClick={confirmDelete}>{t("btn_delete")}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
