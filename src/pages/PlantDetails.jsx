import { ArrowLeft, CalendarDays, Droplets, Edit, Flame, MapPin, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import EmptyState from "../components/EmptyState.jsx";
import HistoryItem from "../components/HistoryItem.jsx";
import NoteCard from "../components/NoteCard.jsx";
import PlantStatusBadge from "../components/PlantStatusBadge.jsx";
import SummaryCard from "../components/SummaryCard.jsx";
import { usePlantCare } from "../App.jsx";
import { calculateWateringConsistency } from "../utils/analyticsUtils.js";
import { getPlantIconUrl } from "../utils/plantIconUtils.js";
import { calculateNextWateringDate, calculateWateringStatus, formatDate } from "../utils/wateringUtils.js";

export default function PlantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { plants, history, addNote, deletePlant } = usePlantCare();
  const [tab, setTab] = useState("Overview");
  const [note, setNote] = useState("");
  const plant = plants.find((item) => item.id === id);
  if (!plant) return <EmptyState title="Plant not found." message="This plant may have been removed." action="Back to Dashboard" to="/dashboard" />;
  const plantHistory = history.filter((item) => item.plantId === plant.id);
  const status = calculateWateringStatus(plant.lastWatered, plant.frequency);
  const submitNote = async () => { if (note.trim()) { await addNote(plant.id, note.trim()); setNote(""); } };
  const removePlant = async () => { await deletePlant(plant.id); navigate("/dashboard"); };
  return (
    <>
      <button className="ghost-btn back-link" type="button" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
      <section className="detail-hero"><div className="detail-icon" style={{ display: "grid", placeItems: "center" }}>{plant.photoUrl ? <img src={plant.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 18 }} /> : <img src={getPlantIconUrl(plant)} alt="" style={{ width: 44, height: 44, objectFit: "contain" }} />}</div><div><PlantStatusBadge status={status} /><h1>{plant.name}</h1><p>{plant.species} · {plant.location}</p></div><Link className="primary-btn" to={`/edit-plant/${plant.id}`}><Edit size={16} /> Edit</Link><button className="ghost-btn danger" onClick={removePlant}><Trash2 size={16} /> Delete</button></section>
      <section className="summary-grid"><SummaryCard icon={Flame} label="Current Streak" value={`${plant.currentStreak} days`} /><SummaryCard icon={Flame} label="Best Streak" value={`${plant.bestStreak} days`} tone="accent" /><SummaryCard icon={Droplets} label="Total Waterings" value={plantHistory.filter((item) => item.type === "watering").length} /><SummaryCard icon={CalendarDays} label="Consistency" value={`${calculateWateringConsistency(plant, history)}%`} tone="yellow" /></section>
      <div className="tabs">{["Overview", "History", "Notes"].map((item) => <button key={item} className={tab === item ? "selected" : ""} onClick={() => setTab(item)}>{item}</button>)}</div>
      {tab === "Overview" && <section className="panel info-grid"><p><Droplets size={17} /> Every {plant.frequency} days</p><p><CalendarDays size={17} /> Last watered {formatDate(plant.lastWatered)}</p><p><CalendarDays size={17} /> Next watering {formatDate(calculateNextWateringDate(plant.lastWatered, plant.frequency))}</p><p><MapPin size={17} /> {plant.location}</p><p>{plant.sunlight}</p><PlantStatusBadge status={status} /></section>}
      {tab === "History" && <section className="timeline">{plantHistory.map((item) => <HistoryItem key={item.id} item={item} />)}</section>}
      {tab === "Notes" && <section className="notes-section"><div className="note-composer"><label>Add observation<textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Soil looked dry..." /></label><button className="primary-btn" onClick={submitNote}><Plus size={16} /> Add Note</button></div>{(plant.notes || []).map((item) => <NoteCard key={item.id} note={item} />)}</section>}
    </>
  );
}
