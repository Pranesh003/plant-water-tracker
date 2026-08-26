import { CalendarDays, Camera, Check, Droplets, Edit, Eye, Flame, MapPin, MessageSquare, Sun, Thermometer, Trash2, Undo2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePlantCare } from "../App.jsx";
import { calculateNextWateringDate, calculateWateringStatus, formatDate, todayISO } from "../utils/wateringUtils.js";
import PlantStatusBadge from "./PlantStatusBadge.jsx";
import StreakBadge from "./StreakBadge.jsx";

const choosePlantEmoji = (plant) => {
  const text = `${plant.name || ""} ${plant.species || ""}`.toLowerCase();
  if (text.includes("rose")) return "🌹";
  if (text.includes("cactus") || text.includes("aloe")) return "🌵";
  if (text.includes("palm")) return "🌴";
  if (text.includes("lily") || text.includes("jasmine") || text.includes("hibiscus")) return "🌺";
  return plant.icon || "🌿";
};

const displayValue = (value, fallback = "Not set") => value || fallback;

export default function PlantCard({ plant, preview = false, onDelete, weather }) {
  const { waterPlant, history } = usePlantCare();
  const [flipped, setFlipped] = useState(false);
  const [isWatering, setIsWatering] = useState(false);
  const [watered, setWatered] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const status = calculateWateringStatus(plant.lastWatered, plant.frequency);
  const hasWateringHistory = history.some((item) => item.plantId === plant.id && item.type === "watering");
  const wateredToday = history.some((item) => item.plantId === plant.id && item.type === "watering" && item.date === todayISO());
  const nextWateringDate = calculateNextWateringDate(plant.lastWatered, plant.frequency);
  const plantImage = plant.photoUrl || "";
  const hasPlantImage = plantImage && !imageFailed;
  const recommendedWater = plant.recommendedWaterMl ? `${plant.recommendedWaterMl} mL` : `Every ${plant.frequency} days`;
  const emoji = choosePlantEmoji(plant);
  const streak = Number(plant.currentStreak || 0);
  const bestStreak = Number(plant.bestStreak || 0);

  useEffect(() => {
    setImageFailed(false);
  }, [plant.photoUrl]);

  const stopCardFlip = (event) => {
    event.stopPropagation();
  };

  const toggleFlip = () => {
    if (preview) return;
    setFlipped((current) => !current);
  };

  const handleFlipKeyDown = (event) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleFlip();
    }
  };

  const handleWaterPlant = async (event) => {
    stopCardFlip(event);
    if (preview || isWatering || wateredToday) return;
    setIsWatering(true);
    setWatered(false);
    try {
      await waterPlant(plant.id);
      setWatered(true);
    } catch {
      setWatered(false);
    } finally {
      setIsWatering(false);
    }
  };

  return (
    <article className={`plant-card flip-card ${flipped ? "flipped" : ""}`} aria-label={`${plant.name || "Plant"} plant card`} onClick={toggleFlip} onKeyDown={handleFlipKeyDown} tabIndex={preview ? -1 : 0}>
      <div className="plant-card-inner">
        <div className="plant-card-face plant-card-front">
          <div className="plant-card-image-wrap">
            {hasPlantImage ? (
              <img className="plant-card-image" src={plantImage} alt={plant.name || "Plant"} onError={() => setImageFailed(true)} />
            ) : (
              <div className="plant-card-placeholder" aria-label="No plant photo available">
                <Camera size={28} />
                <span>Plant Photo</span>
              </div>
            )}
          </div>
          <div className="plant-card-content">
            <div className="plant-card-row">
              <div>
                <h3>{plant.name || "Plant Name"}</h3>
                <p className="muted">{plant.species || "Species"}</p>
              </div>
              <PlantStatusBadge status={status} />
            </div>

            <div className="plant-metrics" aria-label="Plant overview">
              <span><Thermometer size={15} /> <strong>Temp</strong> {weather?.temperature != null ? `${weather.temperature}°C` : (plant.temperature ? `${plant.temperature}°C` : "Loading...")}</span>
              <span><Droplets size={15} /> <strong>Humidity</strong> {weather?.humidity != null ? `${weather.humidity}%` : displayValue(plant.humidity, "Loading...")}</span>
              <span><Sun size={15} /> <strong>Sunlight</strong> {displayValue(plant.sunlight)}</span>
            </div>

            <div className="watering-summary">
              <span><Droplets size={16} /> Recommended: {recommendedWater}</span>
              <span><CalendarDays size={16} /> Last watered: {hasWateringHistory ? formatDate(plant.lastWatered) : "Not yet"}</span>
            </div>
            <StreakBadge streak={streak} best={bestStreak} />

            {!preview && (
              <div className="card-actions" onClick={stopCardFlip}>
                <button type="button" className={`primary-btn ${(watered || wateredToday) ? "success-btn" : ""}`} onClick={handleWaterPlant} disabled={isWatering || wateredToday}>
                  {(watered || wateredToday) ? <Check size={16} /> : <Droplets size={16} />}
                  {isWatering ? "Watering..." : (watered || wateredToday) ? "Watered Today" : "Water Now"}
                </button>
                <Link className="ghost-btn" to={`/edit-plant/${plant.id}`} onClick={stopCardFlip}><Camera size={16} /> Upload Photo</Link>
                <Link className="ghost-btn" to={`/plant/${plant.id}`} onClick={stopCardFlip}><MessageSquare size={16} /> Add Note</Link>
                <Link className="ghost-btn" to={`/edit-plant/${plant.id}`} onClick={stopCardFlip}><Edit size={16} /> Edit Plant</Link>
                <button type="button" className="ghost-btn" onClick={(event) => { stopCardFlip(event); setFlipped(true); }} aria-label="View plant details"><Eye size={16} /> View Details</button>
                {onDelete && <button type="button" className="icon-btn danger" onClick={(event) => { stopCardFlip(event); onDelete(plant); }} title="Delete" aria-label={`Delete ${plant.name}`}><Trash2 size={16} /></button>}
              </div>
            )}
          </div>
        </div>

        <div className="plant-card-face plant-card-back">
          <div className="plant-back-emoji" aria-hidden="true">{emoji}</div>
          <h3>{plant.name || "Plant Name"}</h3>
          <p className="plant-back-species">{plant.species || "Unknown species"}</p>
          <div className="plant-back-divider" />
          <div className="plant-back-detail" aria-label="Selected plant details">
            <span><Droplets size={16} /><strong>Watering</strong> Every {plant.frequency} days</span>
            <span><Droplets size={16} /><strong>Recommended</strong> {recommendedWater}</span>
            <span><Sun size={16} /><strong>Sunlight</strong> {displayValue(plant.sunlight)}</span>
            <span><MapPin size={16} /><strong>Location</strong> {displayValue(plant.location)}</span>
            <span><Droplets size={16} /><strong>Humidity</strong> {displayValue(plant.humidity)}</span>
            <span><CalendarDays size={16} /><strong>Next watering</strong> {hasWateringHistory ? formatDate(nextWateringDate) : "After first watering"}</span>
            <span><Flame size={16} /><strong>Streak</strong> {streak} days</span>
          </div>
          <button type="button" className="back-flip-btn" onClick={(event) => { stopCardFlip(event); setFlipped(false); }} aria-label="Return to plant overview"><Undo2 size={16} /> Back</button>
        </div>
      </div>
    </article>
  );
}
