import { CalendarDays, Camera, Check, Droplets, Edit, Eye, Flame, MapPin, MessageSquare, Sun, Thermometer, Trash2, Undo2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePlantCare } from "../App.jsx";
import { findPlantMatch } from "../data/plantDatabase.js";
import { getPlantIconUrl } from "../utils/plantIconUtils.js";
import { readStorage } from "../utils/storageUtils.js";
import { calculateNextWateringDate, calculateWateringStatus, daysBetween, formatDate, isPlantWaterable, todayISO } from "../utils/wateringUtils.js";
import PlantStatusBadge from "./PlantStatusBadge.jsx";
import StreakBadge from "./StreakBadge.jsx";

const convertTempString = (tempStr, unit = "°C") => {
  if (!tempStr) return unit === "°F" ? "68-79°F" : "20-26°C";
  const numMatches = tempStr.match(/\d+/g);
  if (unit === "°F") {
    if (tempStr.includes("°F")) return tempStr;
    if (numMatches && numMatches.length === 2) {
      const f1 = Math.round((Number(numMatches[0]) * 9) / 5 + 32);
      const f2 = Math.round((Number(numMatches[1]) * 9) / 5 + 32);
      return `${f1}-${f2}°F`;
    }
    if (numMatches && numMatches.length === 1) {
      const f1 = Math.round((Number(numMatches[0]) * 9) / 5 + 32);
      return `${f1}°F`;
    }
    return `${tempStr}°F`;
  } else {
    if (tempStr.includes("°C")) return tempStr;
    if (tempStr.includes("°F") && numMatches && numMatches.length === 2) {
      const c1 = Math.round(((Number(numMatches[0]) - 32) * 5) / 9);
      const c2 = Math.round(((Number(numMatches[1]) - 32) * 5) / 9);
      return `${c1}-${c2}°C`;
    }
    if (tempStr.includes("°F") && numMatches && numMatches.length === 1) {
      const c1 = Math.round(((Number(numMatches[0]) - 32) * 5) / 9);
      return `${c1}°C`;
    }
    return tempStr.includes("°") ? tempStr : `${tempStr}°C`;
  }
};

const choosePlantEmoji = (plant) => {
  const text = `${plant.name || ""} ${plant.species || ""}`.toLowerCase();
  if (text.includes("rose")) return "🌹";
  if (text.includes("cactus") || text.includes("aloe")) return "🌵";
  if (text.includes("palm")) return "🌴";
  if (text.includes("lily") || text.includes("jasmine") || text.includes("hibiscus")) return "🌺";
  return plant.icon || "🌿";
};

const getSpeciesDefaults = (species = "", name = "") => {
  const match = findPlantMatch(species, name);
  return {
    temp: match.temp,
    humidity: match.humidity,
    sunlight: match.sunlight
  };
};

const getPlantTemp = (plant, weather) => {
  if (weather?.temperature != null) return `${weather.temperature}°C`;
  if (plant?.temperature) return String(plant.temperature).includes("°") ? plant.temperature : `${plant.temperature}°C`;
  const defaults = getSpeciesDefaults(plant?.species, plant?.name);
  return defaults.temp;
};

const getPlantHumidity = (plant, weather) => {
  if (weather?.humidity != null) return `${weather.humidity}%`;
  if (plant?.humidity) return String(plant.humidity).includes("%") ? plant.humidity : `${plant.humidity}%`;
  const defaults = getSpeciesDefaults(plant?.species, plant?.name);
  return defaults.humidity;
};

const getPlantSunlight = (plant) => {
  if (plant?.sunlight) return plant.sunlight;
  const defaults = getSpeciesDefaults(plant?.species, plant?.name);
  return defaults.sunlight;
};

const displayValue = (value, fallback = "Not set") => value || fallback;

export default function PlantCard({ plant, preview = false, onDelete, weather }) {
  const { waterPlant, history } = usePlantCare();
  const navigate = useNavigate();
  const [flipped, setFlipped] = useState(false);
  const [isWatering, setIsWatering] = useState(false);
  const [watered, setWatered] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const targetCity = plant.locationCity || plant.location;
  const status = calculateWateringStatus(plant.lastWatered, plant.frequency, targetCity);
  const hasWateringHistory = history.some((item) => item.plantId === plant.id && item.type === "watering");
  const wateredToday = history.some((item) => item.plantId === plant.id && item.type === "watering" && item.date === todayISO());
  const nextWateringDate = calculateNextWateringDate(plant.lastWatered, plant.frequency);
  const plantImage = plant.photoUrl || "";
  const hasPlantImage = plantImage && !imageFailed;
  const recommendedWater = plant.recommendedWaterMl ? `${plant.recommendedWaterMl} mL` : `Every ${plant.frequency || 7} days`;
  const emoji = choosePlantEmoji(plant);
  const streak = Number(plant.currentStreak || 0);
  const bestStreak = Number(plant.bestStreak || 0);

  const userSettings = readStorage("plantCareUserSettings", { tempUnit: "°C" });
  const tempUnit = userSettings.tempUnit || "°C";
  const displayTemp = convertTempString(getPlantTemp(plant, weather), tempUnit);
  const displayHumidity = getPlantHumidity(plant, weather);
  const displaySunlight = getPlantSunlight(plant);

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

  const isWaterable = isPlantWaterable(plant.lastWatered, plant.frequency);
  const isButtonDisabled = isWatering || watered || wateredToday || !isWaterable;

  const handleWaterPlant = async (event) => {
    stopCardFlip(event);
    if (preview || isWatering || wateredToday || !isWaterable) return;
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
    <article className={`plant-card flip-card ${flipped ? "flipped" : ""} state-${status.toLowerCase().replace(/\s+/g, "-")}`} aria-label={`${plant.name || "Plant"} plant card`} onClick={toggleFlip} tabIndex={preview ? -1 : 0}>
      <div className="plant-card-inner">
        <div className={`plant-card-face plant-card-front state-${status.toLowerCase().replace(/\s+/g, "-")}`}>
          <div className="plant-card-image-wrap">
            {hasPlantImage ? (
              <img className="plant-card-image" src={plantImage} alt={plant.name || "Plant"} onError={() => setImageFailed(true)} />
            ) : (
              <div className="plant-card-placeholder" aria-label="No plant photo available">
                <img src={getPlantIconUrl(plant)} alt="" style={{ width: 68, height: 68, objectFit: "contain" }} />
                <span>{plant.name || "Plant"}</span>
              </div>
            )}
          </div>
          <div className="plant-card-content" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Header Title & Status Badge */}
            <div className="plant-card-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 850, color: "#0f172a" }}>{plant.name || "Plant Name"}</h3>
                <p className="muted" style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#64748b" }}>{plant.species || "Species"}</p>
              </div>
              <PlantStatusBadge status={status} />
            </div>

            {/* 3 Overview Metrics */}
            <div className="plant-metrics" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, background: "#f8faf7", padding: "10px 12px", borderRadius: 14, border: "1px solid #e2e8f0" }}>
              <span style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: "0.76rem", color: "#475569" }}><Thermometer size={14} color="#16a34a" /> <strong style={{ color: "#0f172a", fontSize: "0.8rem", marginTop: 2 }}>{displayTemp}</strong></span>
              <span style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: "0.76rem", color: "#475569" }}><Droplets size={14} color="#0284c7" /> <strong style={{ color: "#0f172a", fontSize: "0.8rem", marginTop: 2 }}>{displayHumidity}</strong></span>
              <span style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: "0.76rem", color: "#475569" }}><Sun size={14} color="#d97706" /> <strong style={{ color: "#0f172a", fontSize: "0.8rem", marginTop: 2 }}>{displaySunlight}</strong></span>
            </div>

            {/* Clean Pill Tags (Schedule + Location + Recommended) */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                borderRadius: 20,
                fontSize: "0.78rem",
                fontWeight: 700,
                background: status === "Overdue" ? "#fef2f2" : status === "Water Soon" ? "#fffbe6" : "#f0fdf4",
                color: status === "Overdue" ? "#dc2626" : status === "Water Soon" ? "#d97706" : "#16a34a",
                border: `1px solid ${status === "Overdue" ? "#fecaca" : status === "Water Soon" ? "#ffe58f" : "#bbf7d0"}`
              }}>
                <Droplets size={12} />
                {(() => {
                  if (!plant.lastWatered) return "Schedule Pending";
                  const freq = Number(plant.frequency || 7);
                  const daysElapsed = daysBetween(plant.lastWatered, todayISO());
                  const remaining = freq - daysElapsed;
                  if (remaining < 0) return `Overdue by ${Math.abs(remaining)} day${Math.abs(remaining) === 1 ? "" : "s"}`;
                  if (remaining === 0) return "Due Today";
                  if (remaining === 1) return "In 1 day";
                  return `In ${remaining} days`;
                })()}
              </span>

              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                borderRadius: 20,
                fontSize: "0.78rem",
                fontWeight: 600,
                background: "#f1f5f9",
                color: "#475569",
                border: "1px solid #e2e8f0"
              }}>
                <MapPin size={12} />
                {(() => {
                  const loc = plant.location || "Indoor";
                  return loc.split(",").map(part => part.trim().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")).join(", ");
                })()}
              </span>

              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                borderRadius: 20,
                fontSize: "0.78rem",
                fontWeight: 600,
                background: "#fffbe6",
                color: "#92400e",
                border: "1px solid #ffe58f"
              }}>
                <CalendarDays size={12} />
                {recommendedWater}
              </span>
            </div>

            {/* Streak & Last Watered Row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem", color: "#64748b", background: "#fdf8f6", padding: "8px 12px", borderRadius: 12, border: "1px solid #fce8e6" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontWeight: 700, color: "#c2410c" }}>
                <Flame size={14} color="#ea580c" /> {streak} Day Streak
              </span>
              <span>
                Last: <strong>{hasWateringHistory ? formatDate(plant.lastWatered) : "Not yet"}</strong>
              </span>
            </div>

            {/* Clean Action Buttons */}
            {!preview && (
              <div className="card-actions-grid" onClick={stopCardFlip} style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button type="button" className={`primary-btn ${(!isWaterable || watered || wateredToday) ? "success-btn" : ""}`} onClick={handleWaterPlant} disabled={isButtonDisabled} style={{ minHeight: 40, fontSize: "0.84rem", borderRadius: 12 }}>
                    {(!isWaterable || watered || wateredToday) ? <Check size={15} /> : <Droplets size={15} />}
                    {isWatering ? "Watering..." : (!isWaterable || watered || wateredToday) ? "Watered" : "Water Now"}
                  </button>
                  
                  <button type="button" className="full-view-btn" onClick={(event) => { stopCardFlip(event); navigate(`/plant/${plant.id}`); }} style={{ minHeight: 40, fontSize: "0.84rem", borderRadius: 12 }}>
                    <Eye size={15} /> View Details
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 40px", gap: 8 }}>
                  <Link className="ghost-btn" to={`/edit-plant/${plant.id}`} onClick={stopCardFlip} style={{ minHeight: 38, fontSize: "0.8rem", borderRadius: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Edit size={14} /> Edit Plant
                  </Link>
                  
                  <Link className="ghost-btn" to={`/plant/${plant.id}`} onClick={stopCardFlip} style={{ minHeight: 38, fontSize: "0.8rem", borderRadius: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <MessageSquare size={14} /> Note / Photo
                  </Link>

                  {onDelete && (
                    <button type="button" className="trash-icon-btn" onClick={(event) => { stopCardFlip(event); onDelete(plant); }} title="Delete" style={{ width: 40, height: 38, borderRadius: 12, flex: "0 0 40px" }}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`plant-card-face plant-card-back state-${status.toLowerCase().replace(/\s+/g, "-")}`}>
          <div className="plant-back-status-badge">
            <PlantStatusBadge status={status} />
          </div>
          <div className="plant-back-emoji" aria-hidden="true">
            <img src={getPlantIconUrl(plant)} alt="" style={{ width: 54, height: 54, objectFit: "contain" }} />
          </div>
          <h3>{plant.name || "Plant Name"}</h3>
          <p className="plant-back-species">{plant.species || "Unknown species"}</p>
          <div className="plant-back-divider" />
          <div className="plant-back-detail" aria-label="Selected plant details">
            <span><Droplets size={16} /><strong>Status State</strong> <strong className={`state-label ${status.toLowerCase().replace(/\s+/g, "-")}`}>{status === "Overdue" ? "🔴 Overdue" : status === "Water Soon" ? "🟡 Water Soon" : "🟢 Healthy"}</strong></span>
            <span><Droplets size={16} /><strong>Watering</strong> Every {plant.frequency} days</span>
            <span><Droplets size={16} /><strong>Recommended</strong> {recommendedWater}</span>
            <span><Sun size={16} /><strong>Sunlight</strong> {displaySunlight}</span>
            <span><MapPin size={16} /><strong>Location</strong> {displayValue(plant.location)}</span>
            <span><Droplets size={16} /><strong>Humidity</strong> {displayHumidity}</span>
            <span><CalendarDays size={16} /><strong>Next watering</strong> {hasWateringHistory ? formatDate(nextWateringDate) : "After first watering"}</span>
            <span><Flame size={16} /><strong>Streak</strong> {streak} days</span>
          </div>
          <button type="button" className="back-flip-btn" onClick={(event) => { stopCardFlip(event); setFlipped(false); }} aria-label="Return to plant overview"><Undo2 size={16} /> Back</button>
        </div>
      </div>
    </article>
  );
}
