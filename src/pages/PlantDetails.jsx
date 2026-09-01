import { ArrowLeft, CalendarDays, CloudSun, Droplets, Edit, Flame, MapPin, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import EmptyState from "../components/EmptyState.jsx";
import HistoryItem from "../components/HistoryItem.jsx";
import NoteCard from "../components/NoteCard.jsx";
import PlantStatusBadge from "../components/PlantStatusBadge.jsx";
import SummaryCard from "../components/SummaryCard.jsx";
import { usePlantCare } from "../App.jsx";
import { api } from "../services/api.js";
import { calculateWateringConsistency } from "../utils/analyticsUtils.js";
import { getPlantIconUrl } from "../utils/plantIconUtils.js";
import { calculateNextWateringDate, calculateWateringStatus, formatDate } from "../utils/wateringUtils.js";

export default function PlantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { plants, history, addNote, deletePlant } = usePlantCare();
  const [tab, setTab] = useState("Overview");
  const [note, setNote] = useState("");
  const [plantWeather, setPlantWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  const plant = plants.find((item) => item.id === id);

  const targetCity = plant ? (plant.locationCity || plant.location || "Coimbatore") : "Coimbatore";

  useEffect(() => {
    if (plant) {
      setLoadingWeather(true);
      api.getWeather({ city: targetCity, baseWaterMl: 400 })
        .then((res) => setPlantWeather(res))
        .catch(() => setPlantWeather(null))
        .finally(() => setLoadingWeather(false));
    }
  }, [plant, targetCity]);

  if (!plant) return <EmptyState title="Plant not found." message="This plant may have been removed." action="Back to Dashboard" to="/dashboard" />;

  const plantHistory = history.filter((item) => item.plantId === plant.id);
  const status = calculateWateringStatus(plant.lastWatered, plant.frequency);
  const submitNote = async () => { if (note.trim()) { await addNote(plant.id, note.trim()); setNote(""); } };
  const removePlant = async () => { await deletePlant(plant.id); navigate("/dashboard"); };

  return (
    <>
      <button className="ghost-btn back-link" type="button" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
      <section className="detail-hero">
        <div className="detail-icon" style={{ display: "grid", placeItems: "center" }}>
          {plant.photoUrl ? <img src={plant.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 18 }} /> : <img src={getPlantIconUrl(plant)} alt="" style={{ width: 44, height: 44, objectFit: "contain" }} />}
        </div>
        <div>
          <PlantStatusBadge status={status} />
          <h1>{plant.name}</h1>
          <p>{plant.species} · {plant.location} {plant.locationCity ? `(${plant.locationCity})` : ""}</p>
        </div>
        <Link className="primary-btn" to={`/edit-plant/${plant.id}`}><Edit size={16} /> Edit</Link>
        <button className="ghost-btn danger" onClick={removePlant}><Trash2 size={16} /> Delete</button>
      </section>

      <section className="summary-grid">
        <SummaryCard icon={Flame} label="Current Streak" value={`${plant.currentStreak} days`} />
        <SummaryCard icon={Flame} label="Best Streak" value={`${plant.bestStreak} days`} tone="accent" />
        <SummaryCard icon={Droplets} label="Total Waterings" value={plantHistory.filter((item) => item.type === "watering").length} />
        <SummaryCard icon={CalendarDays} label="Consistency" value={`${calculateWateringConsistency(plant, history)}%`} tone="yellow" />
      </section>

      <div className="tabs">
        {["Overview", "History", "Notes"].map((item) => <button key={item} className={tab === item ? "selected" : ""} onClick={() => setTab(item)}>{item}</button>)}
      </div>

      {tab === "Overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section className="panel info-grid">
            <p><Droplets size={17} /> Every {plant.frequency} days</p>
            <p><CalendarDays size={17} /> Last watered {formatDate(plant.lastWatered)}</p>
            <p><CalendarDays size={17} /> Next watering {formatDate(calculateNextWateringDate(plant.lastWatered, plant.frequency))}</p>
            <p><MapPin size={17} /> {plant.location} {plant.locationCity ? `(${plant.locationCity})` : ""}</p>
            <p>{plant.sunlight}</p>
            <PlantStatusBadge status={status} />
          </section>

          {/* Plant Location Weather & Recommended Water Advice Panel */}
          <section className="panel" style={{ padding: "24px", borderRadius: "20px", background: "linear-gradient(135deg, #f0f7f2 0%, #e6f3e8 100%)", border: "1px solid #c8e6c9" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <h3 style={{ display: "flex", alignItems: "center", gap: 10, margin: 0, color: "#1b4332", fontSize: "1.15rem", fontWeight: 800 }}>
                <CloudSun size={22} color="#2d6a4f" />
                Local Climate & Water Advice for {targetCity}
              </h3>
              <span style={{ fontSize: "0.82rem", background: "#2d6a4f", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontWeight: 700 }}>
                Location Weather
              </span>
            </div>

            {loadingWeather ? (
              <p style={{ color: "#2d6a4f", margin: 0, fontSize: "0.9rem" }}>Loading climate data for {targetCity}...</p>
            ) : plantWeather ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                <div style={{ background: "#ffffff", padding: "16px", borderRadius: "14px", border: "1px solid #d8f3dc" }}>
                  <span style={{ fontSize: "0.8rem", color: "#52b788", fontWeight: 700, textTransform: "uppercase" }}>Local Temperature</span>
                  <p style={{ fontSize: "1.4rem", fontWeight: 900, color: "#1b4332", margin: "4px 0 0" }}>
                    {plantWeather.temperature}°C ({plantWeather.condition})
                  </p>
                </div>
                <div style={{ background: "#ffffff", padding: "16px", borderRadius: "14px", border: "1px solid #d8f3dc" }}>
                  <span style={{ fontSize: "0.8rem", color: "#52b788", fontWeight: 700, textTransform: "uppercase" }}>Local Humidity</span>
                  <p style={{ fontSize: "1.4rem", fontWeight: 900, color: "#1b4332", margin: "4px 0 0" }}>
                    {plantWeather.humidity}% Humidity
                  </p>
                </div>
                <div style={{ background: "#ffffff", padding: "18px", borderRadius: "14px", border: "1px solid #b7e4c7", gridColumn: "1 / -1" }}>
                  <span style={{ fontSize: "0.84rem", color: "#1f4d2e", fontWeight: 800, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                    <Droplets size={18} color="#2d6a4f" /> Recommended Pouring Amount for this Plant
                  </span>
                  <p style={{ fontSize: "1.6rem", fontWeight: 900, color: "#1b4332", margin: "6px 0 4px" }}>
                    💧 {plantWeather.recommendedWaterMl || 400} mL
                  </p>
                  <p style={{ fontSize: "0.88rem", color: "#2d6a4f", margin: 0, fontWeight: 600 }}>
                    {plantWeather.adjustmentReason || `Calculated based on local climate in ${targetCity}.`}
                  </p>
                </div>
              </div>
            ) : (
              <p style={{ color: "#2d6a4f", margin: 0, fontSize: "0.9rem" }}>Weather information for {targetCity} is currently unavailable.</p>
            )}
          </section>
        </div>
      )}

      {tab === "History" && <section className="timeline">{plantHistory.map((item) => <HistoryItem key={item.id} item={item} />)}</section>}
      {tab === "Notes" && (
        <section className="notes-section">
          <div className="note-composer">
            <label>Add observation<textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Soil looked dry..." /></label>
            <button className="primary-btn" onClick={submitNote}><Plus size={16} /> Add Note</button>
          </div>
          {(plant.notes || []).map((item) => <NoteCard key={item.id} note={item} />)}
        </section>
      )}
    </>
  );
}
