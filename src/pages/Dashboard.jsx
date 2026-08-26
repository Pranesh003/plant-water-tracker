import { AlertTriangle, Flame, Leaf, Plus, Sprout } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../components/EmptyState.jsx";
import LocationFilter from "../components/LocationFilter.jsx";
import Pagination from "../components/Pagination.jsx";
import PlantCard from "../components/PlantCard.jsx";
import PlantSearch from "../components/PlantSearch.jsx";
import StatusFilter from "../components/StatusFilter.jsx";
import SummaryCard from "../components/SummaryCard.jsx";
import WeatherCard from "../components/WeatherCard.jsx";
import { usePlantCare } from "../App.jsx";
import { filterPlants } from "../utils/analyticsUtils.js";
import { calculateWateringStatus } from "../utils/wateringUtils.js";

const PAGE_SIZE = 6;

export default function Dashboard() {
  const { plants, user, loading, error } = usePlantCare();
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState("All Plants");
  const [status, setStatus] = useState("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => filterPlants(plants, { location, status, query }), [plants, location, status, query]);
  const paginatedPlants = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);
  const counts = plants.reduce((acc, plant) => {
    acc[calculateWateringStatus(plant.lastWatered, plant.frequency)] += 1;
    return acc;
  }, { Safe: 0, "Water Soon": 0, Overdue: 0 });
  const bestStreak = Math.max(0, ...plants.map((p) => p.bestStreak || 0));
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 17 ? "Good afternoon" : currentHour < 21 ? "Good evening" : "Good night";

  useEffect(() => {
    setPage(1);
  }, [location, status, query]);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentHour(new Date().getHours()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  if (loading) return <p className="loading">Loading your plants...</p>;

  return (
    <>
      {error && <p className="error">{error}</p>}
      <section className="page-hero">
        <div>
          <p className="eyebrow">Today's care plan</p>
          <h1>{greeting}, {user?.name || "Plant Friend"}</h1>
          <p>Let's take care of your plants today.</p>
        </div>
        <Link className="primary-btn" to="/add-plant"><Plus size={18} /> Add Plant</Link>
      </section>
      <section className="summary-grid">
        <SummaryCard icon={Leaf} label="Total Plants" value={plants.length} to="/my-plants?filter=all" action="View all plants" />
        <SummaryCard icon={Sprout} label="Need Watering" value={counts["Water Soon"]} tone="yellow" to="/my-plants?filter=need-watering" action="Needs watering" />
        <SummaryCard icon={AlertTriangle} label="Overdue" value={counts.Overdue} tone="red" to="/my-plants?filter=overdue" action="Review overdue" />
        <SummaryCard icon={Flame} label="Best Streak" value={`${bestStreak} days`} tone="accent" to="/my-plants?filter=best-streak" action="Top streak plants" />
      </section>
      <section style={{ marginTop: 18 }}>
        <WeatherCard onWeatherChange={setWeather} />
      </section>
      <section className="toolbar">
        <PlantSearch compact value={query} onChange={setQuery} onSelect={(plant) => setQuery(plant.name)} />
        <LocationFilter value={location} onChange={setLocation} />
        <StatusFilter value={status} onChange={setStatus} />
      </section>
      {plants.length === 0 ? (
        <EmptyState title="Your plant family is empty" message="Add your first plant to start tracking its care." action="Add Your First Plant" to="/add-plant" />
      ) : filtered.length === 0 ? (
        <EmptyState title="No plants found." message="Try another plant name or add it manually." />
      ) : (
        <>
          <section className="plant-grid">{paginatedPlants.map((plant) => <PlantCard key={plant.id} plant={plant} weather={weather} />)}</section>
          <Pagination page={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}
    </>
  );
}
