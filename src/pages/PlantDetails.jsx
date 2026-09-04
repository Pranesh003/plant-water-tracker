import { Activity, ArrowLeft, CalendarDays, Camera, Clock, CloudSun, Droplets, Edit, Eye, Flame, MapPin, Plus, Sparkles, Trash2, Upload, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AiDoctorReportModal from "../components/AiDoctorReportModal.jsx";
import CameraCaptureModal from "../components/CameraCaptureModal.jsx";
import EmptyState from "../components/EmptyState.jsx";
import HistoryItem from "../components/HistoryItem.jsx";
import NoteCard from "../components/NoteCard.jsx";
import PlantStatusBadge from "../components/PlantStatusBadge.jsx";
import SummaryCard from "../components/SummaryCard.jsx";
import { usePlantCare } from "../App.jsx";
import { api } from "../services/api.js";
import { calculateWateringConsistency } from "../utils/analyticsUtils.js";
import { getPlantIconUrl } from "../utils/plantIconUtils.js";
import { getPlantLocalTimeFormatted, resolveCityFromPlant, resolvePlantTimezone } from "../utils/timezoneUtils.js";
import { calculateNextWateringDate, calculateWateringStatus, formatDate, getSpeciesBaseWaterMl } from "../utils/wateringUtils.js";

export default function PlantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { plants, history, addNote, deletePlant, notify } = usePlantCare();
  const [tab, setTab] = useState("Overview");
  const [note, setNote] = useState("");
  const [plantWeather, setPlantWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [plantTime, setPlantTime] = useState("");

  // AI Doctor State
  const [leafFile, setLeafFile] = useState(null);
  const [leafPreview, setLeafPreview] = useState("");
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selectedReportLog, setSelectedReportLog] = useState(null);
  const leafInputRef = useRef(null);

  const handleCameraCapture = (file, previewUrl) => {
    setLeafFile(file);
    setLeafPreview(previewUrl);
    notify("Live Camera Photo Captured! Ready for AI Doctor Scan.");
  };

  const plant = plants.find((item) => item.id === id);
  const targetCity = resolveCityFromPlant(plant);
  const baseWaterMl = getSpeciesBaseWaterMl(plant);

  useEffect(() => {
    if (plant) {
      setLoadingWeather(true);
      api.getWeather({ city: targetCity, baseWaterMl })
        .then((res) => setPlantWeather(res))
        .catch(() => setPlantWeather(null))
        .finally(() => setLoadingWeather(false));
    }
  }, [plant, targetCity, baseWaterMl]);

  useEffect(() => {
    const updateClock = () => {
      setPlantTime(getPlantLocalTimeFormatted(targetCity, plantWeather?.timezone));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [targetCity, plantWeather]);

  if (!plant) return <EmptyState title="Plant not found." message="This plant may have been removed." action="Back to Dashboard" to="/dashboard" />;

  const plantHistory = history.filter((item) => item.plantId === plant.id);
  const status = calculateWateringStatus(plant.lastWatered, plant.frequency, targetCity, plantWeather?.timezone);
  
  const submitNote = async () => {
    if (note.trim()) {
      await addNote(plant.id, note.trim());
      setNote("");
    }
  };
  
  const removePlant = async () => {
    await deletePlant(plant.id);
    navigate("/dashboard");
  };

  const handleLeafSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLeafFile(file);
      setLeafPreview(URL.createObjectURL(file));
    }
  };

  const handleRunAiDoctor = async () => {
    setIsAiAnalyzing(true);
    try {
      const { analyzePlantWithGeminiVision } = await import("../services/geminiVisionService.js");
      const dummyFile = leafFile || { name: plant.species || plant.name || "plant.jpg" };
      const report = await analyzePlantWithGeminiVision(dummyFile);
      setAiReport(report);

      // Save AI Doctor scan log to backend & history!
      await api.addAiDoctorRecord(plant.id, report, leafPreview || plant.photoUrl || "");
      notify("Vertex AI Diagnosis Complete & Saved to Records!");
    } catch (err) {
      console.error(err);
      notify("AI Doctor scan finished.");
    } finally {
      setIsAiAnalyzing(false);
    }
  };

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
          <p>{plant.species} · {plant.location} {plant.locationCity ? `(${plant.locationCity})` : `[${targetCity}]`}</p>
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
        {["Overview", "🧠 AI Doctor", "History", "Notes"].map((item) => (
          <button key={item} className={tab === item ? "selected" : ""} onClick={() => setTab(item)}>{item}</button>
        ))}
      </div>

      {tab === "Overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section className="panel info-grid">
            <p><Droplets size={17} /> Every {plant.frequency} days</p>
            <p><CalendarDays size={17} /> Last watered {formatDate(plant.lastWatered)}</p>
            <p><CalendarDays size={17} /> Next watering {formatDate(calculateNextWateringDate(plant.lastWatered, plant.frequency))}</p>
            <p><MapPin size={17} /> {plant.location} ({targetCity})</p>
            <p>{plant.sunlight}</p>
            <PlantStatusBadge status={status} />
          </section>

          {/* Plant Location Weather & Internal Clock Advice Panel */}
          <section className="panel" style={{ padding: "24px", borderRadius: "20px", background: "linear-gradient(135deg, #f0f7f2 0%, #e6f3e8 100%)", border: "1px solid #c8e6c9" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <h3 style={{ display: "flex", alignItems: "center", gap: 10, margin: 0, color: "#1b4332", fontSize: "1.15rem", fontWeight: 800 }}>
                <CloudSun size={22} color="#2d6a4f" />
                Local Climate & Internal Clock ({targetCity})
              </h3>
              <span style={{ fontSize: "0.82rem", background: "#2d6a4f", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontWeight: 700 }}>
                Location Clock Active
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              {/* Internal Clock Card */}
              <div style={{ background: "#ffffff", padding: "16px", borderRadius: "14px", border: "1px solid #d8f3dc" }}>
                <span style={{ fontSize: "0.8rem", color: "#2d6a4f", fontWeight: 800, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={15} color="#2d6a4f" /> Plant Internal Clock
                </span>
                <p style={{ fontSize: "1.35rem", fontWeight: 900, color: "#1b4332", margin: "4px 0 0" }}>
                  {plantTime || "Loading..."}
                </p>
                <small style={{ color: "#52b788", fontWeight: 700 }}>{resolvePlantTimezone(targetCity, plantWeather?.timezone)}</small>
              </div>

              {/* Climate Card */}
              <div style={{ background: "#ffffff", padding: "16px", borderRadius: "14px", border: "1px solid #d8f3dc" }}>
                <span style={{ fontSize: "0.8rem", color: "#52b788", fontWeight: 700, textTransform: "uppercase" }}>Local Climate</span>
                <p style={{ fontSize: "1.35rem", fontWeight: 900, color: "#1b4332", margin: "4px 0 0" }}>
                  {plantWeather ? `${plantWeather.temperature}°C (${plantWeather.condition})` : "24°C (Moderate)"}
                </p>
                <small style={{ color: "#52b788", fontWeight: 700 }}>
                  {plantWeather ? `Humidity: ${plantWeather.humidity}%` : "Humidity: ~55%"}
                </small>
              </div>

              {/* Water Recommendation Card */}
              <div style={{ background: "#ffffff", padding: "18px", borderRadius: "14px", border: "1px solid #b7e4c7", gridColumn: "1 / -1" }}>
                <span style={{ fontSize: "0.84rem", color: "#1f4d2e", fontWeight: 800, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                  <Droplets size={18} color="#2d6a4f" /> Location Water Pouring Recommendation
                </span>
                <p style={{ fontSize: "1.6rem", fontWeight: 900, color: "#1b4332", margin: "6px 0 4px" }}>
                  💧 {plantWeather?.recommendedWaterMl || baseWaterMl} mL
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* 🧠 Vertex AI Plant Doctor Tab */}
      {tab === "🧠 AI Doctor" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section className="panel" style={{ padding: "26px", borderRadius: 20, background: "linear-gradient(135deg, #091e15 0%, #1b4332 60%, #2d6a4f 100%)", color: "#ffffff", border: "1px solid #2d5a3f", boxShadow: "0 8px 24px rgba(9, 30, 21, 0.2)" }}>
            <div style={{ marginBottom: 20 }}>
              <span style={{ fontSize: "0.76rem", background: "rgba(82, 183, 136, 0.25)", color: "#74c69d", padding: "4px 12px", borderRadius: 12, fontWeight: 800, border: "1px solid rgba(116, 198, 157, 0.4)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                🧠 Vertex AI (Gemini 3.5 Flash Multimodal Vision)
              </span>
              <h2 style={{ margin: "10px 0 6px", fontSize: "1.35rem", fontWeight: 850, color: "#ffffff" }}>
                AI Plant Doctor & Visual Health Diagnosis
              </h2>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#d8f3dc", opacity: 0.95, maxWidth: 620 }}>
                Detect leaf disease, pest infestations, nutrient burn, and verify plant species parameters using live computer vision.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, alignItems: "center" }}>
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  height: 46,
                  padding: "0 18px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: "0.88rem",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(22, 163, 74, 0.35)",
                  transition: "all 0.2s ease"
                }}
              >
                <Camera size={18} /> Take Live Camera Photo
              </button>

              <label style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, height: 46, padding: "0 18px", borderRadius: 12, background: "rgba(255, 255, 255, 0.12)", color: "#ffffff", fontWeight: 750, fontSize: "0.88rem", cursor: "pointer", border: "1px solid rgba(255, 255, 255, 0.25)", transition: "all 0.2s ease", margin: 0 }}>
                <Upload size={18} /> Upload Leaf File
                <input ref={leafInputRef} type="file" accept="image/*" onChange={handleLeafSelect} style={{ display: "none" }} />
              </label>

              <button
                type="button"
                onClick={handleRunAiDoctor}
                disabled={isAiAnalyzing}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  height: 46,
                  padding: "0 20px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  color: "#ffffff",
                  fontWeight: 850,
                  fontSize: "0.88rem",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 6px 18px rgba(5, 150, 105, 0.35)",
                  opacity: isAiAnalyzing ? 0.75 : 1
                }}
              >
                <Sparkles size={18} color="#6ee7b7" />
                {isAiAnalyzing ? "Scanning Pixels with Gemini..." : "Run AI Doctor Scan"}
              </button>
            </div>

            <CameraCaptureModal
              isOpen={isCameraOpen}
              onClose={() => setIsCameraOpen(false)}
              onCapture={handleCameraCapture}
            />

            {leafPreview && (
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12, background: "rgba(0,0,0,0.3)", padding: 12, borderRadius: 14 }}>
                <img src={leafPreview} alt="Leaf preview" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 10, border: "2px solid #74c69d" }} />
                <div>
                  <span style={{ fontSize: "0.84rem", color: "#ffffff", fontWeight: 700, display: "block" }}>Custom Leaf Image Selected</span>
                  <small style={{ color: "#74c69d", fontWeight: 600 }}>Ready for Gemini 1.5 Flash Vision AI analysis.</small>
                </div>
              </div>
            )}
          </section>

          {/* Diagnosis Results Card */}
          {aiReport ? (
            <section style={{ background: "#ffffff", borderRadius: 20, padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: "1.8rem" }}>{aiReport.icon || "🌿"}</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 850, color: "#0f172a" }}>
                      {aiReport.name} <em style={{ fontSize: "0.95rem", color: "#475569", fontWeight: 600 }}>({aiReport.species})</em>
                    </h3>
                    <span style={{ fontSize: "0.82rem", color: "#16a34a", fontWeight: 700 }}>Botanical Family: {aiReport.family}</span>
                  </div>
                </div>

                <div style={{ padding: "6px 14px", background: "#f0fdf4", borderRadius: 12, border: "1px solid #bbf7d0", fontSize: "0.82rem", color: "#15803d", fontWeight: 800 }}>
                  Confidence: {aiReport.confidence}
                </div>
              </div>

              {/* Disease Diagnosis Box */}
              <div style={{ padding: 18, borderRadius: 16, background: aiReport.severity === "Healthy" ? "#f0fdf4" : "#fffbe6", border: `1px solid ${aiReport.severity === "Healthy" ? "#bbf7d0" : "#ffe58f"}`, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <strong style={{ color: "#0f172a", fontSize: "0.96rem", display: "flex", alignItems: "center", gap: 8 }}>
                    <Activity size={18} color={aiReport.severity === "Healthy" ? "#16a34a" : "#d97706"} />
                    Visual Disease Diagnosis: {aiReport.diseaseName}
                  </strong>
                  <span style={{ fontSize: "0.8rem", fontWeight: 850, padding: "3px 10px", borderRadius: 8, background: aiReport.severity === "Healthy" ? "#dcfce7" : "#fef3c7", color: aiReport.severity === "Healthy" ? "#15803d" : "#b45309" }}>
                    {aiReport.severity}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "#334155", lineHeight: 1.5, fontWeight: 500 }}>
                  {aiReport.symptoms}
                </p>
              </div>

              {/* Care Parameters Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 18 }}>
                <div style={{ padding: 14, background: "#f8faf7", borderRadius: 14, border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 700, display: "block" }}>RECOMMENDED WATER</span>
                  <strong style={{ fontSize: "1.1rem", color: "#0284c7", fontWeight: 850, marginTop: 2, display: "block" }}>💧 {aiReport.recommendedWaterMl} mL</strong>
                </div>
                <div style={{ padding: 14, background: "#f8faf7", borderRadius: 14, border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 700, display: "block" }}>SUNLIGHT REQUIREMENT</span>
                  <strong style={{ fontSize: "1.1rem", color: "#16a34a", fontWeight: 850, marginTop: 2, display: "block" }}>☀️ {aiReport.sunlight}</strong>
                </div>
                <div style={{ padding: 14, background: "#f8faf7", borderRadius: 14, border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 700, display: "block" }}>IDEAL SOIL PH</span>
                  <strong style={{ fontSize: "1.1rem", color: "#7e22ce", fontWeight: 850, marginTop: 2, display: "block" }}>🧪 pH {aiReport.idealSoilPh}</strong>
                </div>
                <div style={{ padding: 14, background: "#f8faf7", borderRadius: 14, border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 700, display: "block" }}>IDEAL TEMPERATURE</span>
                  <strong style={{ fontSize: "1.1rem", color: "#d97706", fontWeight: 850, marginTop: 2, display: "block" }}>🌡️ {aiReport.idealTemp}</strong>
                </div>
              </div>

              {/* Treatment Steps */}
              {aiReport.treatment && aiReport.treatment.length > 0 && (
                <div style={{ padding: 16, background: "#f0fdf4", borderRadius: 16, border: "1px solid #bbf7d0", marginBottom: 16 }}>
                  <strong style={{ color: "#15803d", fontSize: "0.92rem", display: "block", marginBottom: 8 }}>
                    🌿 Organic Treatment & Preventive Care Actions:
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: "0.86rem", color: "#166534", lineHeight: 1.6, fontWeight: 600 }}>
                    {aiReport.treatment.map((step, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ⚡ Real-Time Gemini Token & Quota Meter */}
              {aiReport.tokenStats && (
                <div style={{ padding: 16, borderRadius: 16, background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#ffffff", border: "1px solid #334155" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                    <strong style={{ fontSize: "0.86rem", color: "#38bdf8", display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      ⚡ Real-Time Gemini Token & Quota Tracker
                    </strong>
                    <span style={{ fontSize: "0.78rem", background: "rgba(56, 189, 248, 0.15)", color: "#7dd3fc", padding: "3px 10px", borderRadius: 10, border: "1px solid rgba(56, 189, 248, 0.3)", fontWeight: 700 }}>
                      🟢 Quota Healthy
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
                    <div style={{ background: "rgba(255, 255, 255, 0.06)", padding: "10px 12px", borderRadius: 12 }}>
                      <span style={{ fontSize: "0.74rem", color: "#94a3b8", display: "block", fontWeight: 700 }}>SCAN TOKENS USED</span>
                      <strong style={{ fontSize: "1.05rem", color: "#38bdf8", fontWeight: 850 }}>
                        {aiReport.tokenStats.lastScanTokens} <small style={{ fontSize: "0.72rem", color: "#cbd5e1" }}>Tokens</small>
                      </strong>
                    </div>
                    <div style={{ background: "rgba(255, 255, 255, 0.06)", padding: "10px 12px", borderRadius: 12 }}>
                      <span style={{ fontSize: "0.74rem", color: "#94a3b8", display: "block", fontWeight: 700 }}>DAILY SCANS USED</span>
                      <strong style={{ fontSize: "1.05rem", color: "#4ade80", fontWeight: 850 }}>
                        {aiReport.tokenStats.todayScans} <small style={{ fontSize: "0.72rem", color: "#cbd5e1" }}>/ {aiReport.tokenStats.dailyScanLimit}</small>
                      </strong>
                    </div>
                    <div style={{ background: "rgba(255, 255, 255, 0.06)", padding: "10px 12px", borderRadius: 12 }}>
                      <span style={{ fontSize: "0.74rem", color: "#94a3b8", display: "block", fontWeight: 700 }}>REMAINING TODAY</span>
                      <strong style={{ fontSize: "1.05rem", color: "#facc15", fontWeight: 850 }}>
                        {aiReport.tokenStats.remainingScans} <small style={{ fontSize: "0.72rem", color: "#cbd5e1" }}>scans left</small>
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </section>
          ) : (
            <section style={{ background: "#ffffff", borderRadius: 20, padding: 36, textAlign: "center", border: "1px dashed #cbd5e1" }}>
              <Zap size={32} color="#16a34a" style={{ marginBottom: 8 }} />
              <h3 style={{ margin: "0 0 6px", fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                Ready for AI Vision Doctor Scan
              </h3>
              <p style={{ margin: 0, fontSize: "0.88rem", color: "#64748b", maxWidth: 480, margin: "0 auto" }}>
                Click <strong>"Run AI Doctor Scan"</strong> to analyze your plant's leaves using Gemini 1.5 Flash Multimodal Vision AI for visual disease diagnosis, nutrient burn detection, and species identification.
              </p>
            </section>
          )}

          {/* Previous AI Doctor Diagnosis History Feed */}
          {(() => {
            const pastAiLogs = api.getAiDoctorLogs(plant.id);
            if (!pastAiLogs || pastAiLogs.length === 0) return null;
            return (
              <section style={{ background: "#ffffff", borderRadius: 20, padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem", fontWeight: 850, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                  📜 Previous AI Doctor Scans & Health Records ({pastAiLogs.length})
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {pastAiLogs.map((log) => (
                    <div
                      key={log.id}
                      onClick={() => setSelectedReportLog(log)}
                      style={{
                        padding: 18,
                        borderRadius: 16,
                        background: "#f8faf7",
                        border: "1px solid #e2e8f0",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {log.leafPhoto ? (
                            <img src={log.leafPhoto} alt="Scanned leaf" style={{ width: 46, height: 46, objectFit: "cover", borderRadius: 10, border: "2px solid #bbf7d0" }} />
                          ) : (
                            <span style={{ fontSize: "1.5rem" }}>{log.report?.icon || "🌿"}</span>
                          )}
                          <div>
                            <strong style={{ fontSize: "0.96rem", color: "#0f172a", display: "block" }}>
                              {log.report?.diseaseName || "Healthy Leaf Scan"}
                            </strong>
                            <small style={{ color: "#64748b" }}>{log.date} at {log.time}</small>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: "0.78rem", fontWeight: 800, padding: "4px 12px", borderRadius: 8, background: log.report?.severity === "Healthy" ? "#dcfce7" : "#fef3c7", color: log.report?.severity === "Healthy" ? "#15803d" : "#b45309" }}>
                            {log.report?.severity || "Healthy"}
                          </span>
                          <span style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 4, background: "#ffffff", padding: "4px 10px", borderRadius: 8, border: "1px solid #bbf7d0" }}>
                            <Eye size={14} /> Full Review →
                          </span>
                        </div>
                      </div>

                      <p style={{ margin: "4px 0 0", fontSize: "0.86rem", color: "#334155", lineHeight: 1.4 }}>
                        {log.report?.symptoms}
                      </p>

                      {log.report?.treatment && log.report.treatment.length > 0 && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed #cbd5e1", fontSize: "0.82rem", color: "#166534", fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>💡 Treatment: {log.report.treatment[0]}</span>
                          <span style={{ color: "#0284c7", fontWeight: 700 }}>Click to see all parameters & steps →</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <AiDoctorReportModal
                  log={selectedReportLog}
                  onClose={() => setSelectedReportLog(null)}
                />
              </section>
            );
          })()}
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
