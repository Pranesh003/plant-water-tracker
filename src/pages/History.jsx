import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState.jsx";
import HistoryItem from "../components/HistoryItem.jsx";
import Pagination from "../components/Pagination.jsx";
import { usePlantCare } from "../App.jsx";
import { filterHistory } from "../utils/analyticsUtils.js";

const PAGE_SIZE = 8;

export default function History() {
  const { plants, history } = usePlantCare();
  const [plantId, setPlantId] = useState("All Plants");
  const [type, setType] = useState("All Activities");
  const [range, setRange] = useState("All");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => filterHistory(history, { plantId, type, range }), [history, plantId, type, range]);
  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);
  useEffect(() => {
    setPage(1);
  }, [plantId, type, range]);
  return (
    <>
      <section className="page-title">
        <p className="eyebrow">CARE TIMELINE</p>
        <h1 style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span>Plant Care History</span>
          <img src="/history_icon.png" alt="History Icon" style={{ width: 34, height: 34, objectFit: "contain" }} />
        </h1>
      </section>
      <section className="toolbar"><select value={plantId} onChange={(e) => setPlantId(e.target.value)}><option>All Plants</option>{plants.map((plant) => <option value={plant.id} key={plant.id}>{plant.name}</option>)}</select><select value={type} onChange={(e) => setType(e.target.value)}>{["All Activities", "Watering", "Notes", "Streak"].map((item) => <option key={item}>{item}</option>)}</select><select value={range} onChange={(e) => setRange(e.target.value)}><option value="All">All dates</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></section>
      {filtered.length ? (
        <>
          <section className="timeline">{paginated.map((item) => <HistoryItem key={item.id} item={item} />)}</section>
          <Pagination page={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      ) : <EmptyState title="No care history yet." message="Water a plant to start building your history." />}
    </>
  );
}
