import { Calendar, Clock, Droplets, Eye, Flame, MapPin, MessageSquare, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import AiDoctorReportModal from "./AiDoctorReportModal.jsx";
import { usePlantCare } from "../App.jsx";
import { getPlantIconUrl } from "../utils/plantIconUtils.js";
import { formatDate, formatTimeAgo } from "../utils/wateringUtils.js";

const formatLocation = (locStr) => {
  if (!locStr) return "Indoor";
  return locStr
    .split(",")
    .map(part => part.trim().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" "))
    .join(", ");
};

export default function HistoryItem({ item }) {
  const { plants } = usePlantCare();
  const plant = plants.find((p) => p.id === item.plantId || p.name === item.plantName);
  const [showModal, setShowModal] = useState(false);

  const isAiDoctor = item.type === "ai_doctor" || (typeof item.text === "string" && item.text.includes("[Vertex AI Doctor Diagnosis]"));
  const isWatering = item.type === "watering" || (!item.type && !item.text && !isAiDoctor);
  const isNote = (item.type === "note" || !!item.text) && !isAiDoctor;
  const isStreak = item.type === "streak";

  const streakVal = item.streak || plant?.currentStreak || 0;

  return (
    <>
      <article
        className="history-item-card"
        onClick={() => isAiDoctor && setShowModal(true)}
        style={{
          background: "#ffffff",
          borderRadius: 20,
          padding: "16px 20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          cursor: isAiDoctor ? "pointer" : "default",
          transition: "transform 0.2s ease, box-shadow 0.2s ease"
        }}
      >
        {/* Left: Plant Thumbnail & Activity Details */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flex: "1 1 320px" }}>
          {/* Plant Photo Thumbnail */}
          <div style={{ width: 56, height: 56, borderRadius: 16, overflow: "hidden", background: "#f8faf7", border: "1px solid #e2e8f0", flex: "0 0 56px", display: "grid", placeItems: "center" }}>
            {item.leafPhoto ? (
              <img src={item.leafPhoto} alt={item.plantName || "Plant leaf"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : plant?.photoUrl ? (
              <img src={plant.photoUrl} alt={item.plantName || "Plant"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : plant ? (
              <img src={getPlantIconUrl(plant)} alt="" style={{ width: 34, height: 34, objectFit: "contain" }} />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: 10, background: isAiDoctor ? "#f0fdf4" : isWatering ? "#e0f2fe" : isNote ? "#fef3c7" : "#dcfce7", display: "grid", placeItems: "center" }}>
                {isAiDoctor ? <span style={{ fontSize: "1.2rem" }}>🧠</span> : isWatering ? <Droplets size={18} color="#0284c7" /> : isNote ? <MessageSquare size={18} color="#d97706" /> : <Flame size={18} color="#16a34a" />}
              </div>
            )}
          </div>

          {/* Info Stack */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {/* Header Title + Activity Type Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <strong style={{ fontSize: "1.05rem", fontWeight: 850, color: "#0f172a" }}>{item.plantName || plant?.name || "Plant"}</strong>

              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 10px",
                borderRadius: 20,
                fontSize: "0.78rem",
                fontWeight: 700,
                background: isAiDoctor ? "#f0fdf4" : isWatering ? "#f0f9ff" : isNote ? "#fffbe6" : "#f0fdf4",
                color: isAiDoctor ? "#16a34a" : isWatering ? "#0369a1" : isNote ? "#b45309" : "#15803d",
                border: `1px solid ${isAiDoctor ? "#bbf7d0" : isWatering ? "#bae6fd" : isNote ? "#ffe58f" : "#bbf7d0"}`
              }}>
                {isAiDoctor ? "🧠 AI Doctor Scan" : isWatering ? "Watered" : isNote ? "Note Added" : "Streak Milestone"}
              </span>
            </div>

            {/* Meta Details Row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {/* Timestamp */}
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.8rem", color: "#64748b" }}>
                <Calendar size={13} color="#94a3b8" />
                {item.date ? formatDate(item.date) : "Recently"}
              </span>

              {/* Relative Time */}
              {item.date && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.78rem", color: "#94a3b8" }}>
                  <Clock size={12} />
                  {formatTimeAgo(item.date)}
                </span>
              )}

              {/* Location Tag */}
              {plant?.location && (
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "2px 8px",
                  borderRadius: 16,
                  fontSize: "0.76rem",
                  fontWeight: 600,
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #e2e8f0"
                }}>
                  <MapPin size={11} />
                  {formatLocation(plant.location)}
                </span>
              )}

              {/* Note text if present */}
              {item.text && (
                <span style={{ fontSize: "0.8rem", color: isAiDoctor ? "#15803d" : "#475569", fontWeight: isAiDoctor ? 600 : 500 }}>
                  "{item.text}"
                </span>
              )}

              {/* Streak Badge */}
              {streakVal > 0 && (
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 8px",
                  borderRadius: 16,
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  background: "#fff7ed",
                  color: "#c2410c",
                  border: "1px solid #ffedd5"
                }}>
                  <Flame size={11} color="#ea580c" />
                  {streakVal} {streakVal === 1 ? "day" : "days"} streak
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Action Link */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isAiDoctor && (
            <button
              type="button"
              className="primary-btn"
              onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
              style={{ padding: "8px 14px", borderRadius: 12, fontSize: "0.82rem", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)", color: "#fff", border: "none", cursor: "pointer" }}
            >
              <Sparkles size={14} /> Full AI Review
            </button>
          )}

          {plant?.id && (
            <Link className="ghost-btn" to={`/plant/${plant.id}`} onClick={(e) => e.stopPropagation()} style={{ padding: "8px 16px", borderRadius: 12, fontSize: "0.84rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Eye size={15} /> View Plant
            </Link>
          )}
        </div>
      </article>

      {/* AI Doctor Report Full Modal */}
      {showModal && (
        <AiDoctorReportModal
          log={item}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
