import { Camera, Key, Save, Sparkles, Trash2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlantCare } from "../App.jsx";
import { api } from "../services/api.js";
import CameraCaptureModal from "./CameraCaptureModal.jsx";
import PlantCard from "./PlantCard.jsx";
import PlantSearch from "./PlantSearch.jsx";

export default function PlantForm({ plant, mode = "create" }) {
  const { notify, refresh } = usePlantCare();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: plant?.name || "",
    species: plant?.species || "",
    frequency: plant?.frequency || "7",
    lastWatered: plant?.lastWatered || new Date().toISOString().split("T")[0],
    sunlight: plant?.sunlight || "Indirect Sunlight",
    notes: Array.isArray(plant?.notes) ? (plant.notes[0]?.text || "") : (typeof plant?.notes === "string" ? plant.notes : ""),
    photoUrl: plant?.photoUrl || "",
    icon: plant?.icon || "🌿",
    location: plant?.location ? plant.location.split(",")[0].trim() : "Living Room",
    locationCity: plant?.locationCity || (plant?.location && plant.location.includes(",") ? plant.location.split(",")[1].trim() : ""),
    recommendedWaterMl: plant?.recommendedWaterMl || "450"
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(plant?.photoUrl || "");
  const [query, setQuery] = useState("");
  const [speciesSuggestions, setSpeciesSuggestions] = useState([]);
  const [isSearchingSpecies, setIsSearchingSpecies] = useState(false);
  const [speciesSearchError, setSpeciesSearchError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("geminiApiKey") || "" : ""));
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleCameraCapture = async (file, previewUrl) => {
    try {
      const { optimizePlantImage } = await import("../services/imageOptimizerService.js");
      const res = await optimizePlantImage(file, 400, 400);
      setSelectedImage(res.file);
      setImagePreview(res.previewUrl);
      setImageMeta(res);
    } catch {
      setSelectedImage(file);
      setImagePreview(previewUrl);
    }
  };

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const setQueryAndSearch = async (val) => {
    setQuery(val);
    if (!val.trim()) {
      setSpeciesSuggestions([]);
      return;
    }
    setIsSearchingSpecies(true);
    setSpeciesSearchError("");
    try {
      const res = await api.searchSpecies(val);
      setSpeciesSuggestions(res || []);
    } catch {
      setSpeciesSearchError("Species lookup unavailable.");
    } finally {
      setIsSearchingSpecies(false);
    }
  };

  const selectPlant = (selected) => {
    setForm((current) => ({
      ...current,
      name: current.name || selected.name,
      species: selected.species,
      frequency: String(selected.frequency || current.frequency),
      sunlight: selected.sunlight || current.sunlight,
      icon: selected.icon || current.icon
    }));
    setQuery(selected.name);
    setSpeciesSuggestions([]);
  };

  const [imageMeta, setImageMeta] = useState(null);

  const handleImageSelection = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { optimizePlantImage } = await import("../services/imageOptimizerService.js");
      const res = await optimizePlantImage(file, 400, 400);
      setSelectedImage(res.file);
      setImagePreview(res.previewUrl);
      setImageMeta(res);
    } catch {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview("");
    setImageMeta(null);
    setAiReport(null);
    setForm((current) => ({ ...current, photoUrl: "" }));
  };

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      localStorage.setItem("geminiApiKey", apiKeyInput.trim());
      notify("Gemini API Key saved for live real-time AI vision analysis!");
      setShowApiKeyInput(false);
    } else {
      localStorage.removeItem("geminiApiKey");
      notify("Gemini API Key cleared.");
      setShowApiKeyInput(false);
    }
  };

  const handleAiAutoIdentify = async () => {
    const fileToAnalyze = selectedImage || fileInputRef.current?.files?.[0];
    if (!fileToAnalyze && !imagePreview) {
      setError("Please upload or select a plant image first to analyze with AI.");
      return;
    }
    setIsAiAnalyzing(true);
    setError("");
    try {
      const { analyzePlantWithGeminiVision } = await import("../services/geminiVisionService.js");
      const report = await analyzePlantWithGeminiVision(fileToAnalyze || { name: form.name || "plant.jpg" });
      setAiReport(report);
      
      setForm((current) => ({
        ...current,
        name: current.name || report.name,
        species: report.species || current.species,
        frequency: String(report.frequency || current.frequency),
        sunlight: report.sunlight || current.sunlight,
        icon: report.icon || current.icon,
        recommendedWaterMl: String(report.recommendedWaterMl || current.recommendedWaterMl),
        notes: current.notes
          ? `${current.notes}\n\n[Vertex AI Gemini Diagnosis]: ${report.diseaseName} (${report.severity}). ${report.symptoms}`
          : `[Vertex AI Gemini Diagnosis]: ${report.diseaseName} (${report.severity}). ${report.symptoms}`
      }));
      setQuery(report.name);
      notify(`AI Identified ${report.name} (${report.species})!`);
    } catch (err) {
      console.error(err);
      setError("AI Vision analysis failed. Please try again.");
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.species.trim()) return setError("Plant name and species are required.");
    if (Number(form.frequency) < 1) return setError("Watering frequency must be at least 1 day.");
    setIsSaving(true);
    setError("");

    const cleanCity = (form.locationCity || "").trim();
    const cleanRoom = (form.location || "Living Room").trim();
    const finalLocation = cleanCity ? `${cleanRoom}, ${cleanCity}` : cleanRoom;

    const payload = {
      ...form,
      frequency: Number(form.frequency),
      notes: typeof form.notes === "string" ? form.notes : (Array.isArray(form.notes) ? (form.notes[0]?.text || "") : ""),
      location: finalLocation,
      locationCity: cleanCity
    };

    try {
      if (mode === "edit") await api.updatePlant(plant.id, payload, selectedImage);
      else await api.createPlant(payload, selectedImage);
      await refresh();
      notify(mode === "edit" ? "Plant updated successfully." : "Plant saved to My Plants.");
      navigate("/my-plants");
    } catch (err) {
      setError(err.message || "Unable to save plant. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const preview = { ...form, photoUrl: imagePreview || form.photoUrl, id: "preview", currentStreak: plant?.currentStreak || 0, bestStreak: plant?.bestStreak || 0 };

  return (
    <div className="form-layout">
      <form className="panel plant-form" onSubmit={submit}>
        <PlantSearch value={query} onChange={setQueryAndSearch} onSelect={selectPlant} suggestions={speciesSuggestions} loading={isSearchingSpecies} error={speciesSearchError} />
        {error && <p className="error" role="alert">{error}</p>}

        <section>
          <h2>Plant Image & Vertex AI Diagnosis</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginTop: 8 }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                height: 48,
                padding: "0 18px",
                borderRadius: 14,
                background: "#ffffff",
                color: "#1b4332",
                fontWeight: 800,
                fontSize: "0.9rem",
                border: "2px dashed #b7e4c7",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                margin: 0,
                transition: "all 0.2s ease"
              }}
            >
              <Upload size={18} color="#16a34a" />
              <span>Upload Photo File</span>
              <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleImageSelection} style={{ display: "none" }} />
            </label>

            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                height: 48,
                padding: "0 18px",
                borderRadius: 14,
                background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "0.9rem",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(22, 163, 74, 0.3)",
                transition: "all 0.2s ease"
              }}
            >
              <Camera size={18} />
              <span>Take Live Camera Photo</span>
            </button>
          </div>

          <CameraCaptureModal
            isOpen={isCameraOpen}
            onClose={() => setIsCameraOpen(false)}
            onCapture={handleCameraCapture}
          />
          
          {imagePreview && <img src={imagePreview} alt="Plant preview" style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 12, marginTop: 12 }} />}
          
          {imageMeta && (
            <div style={{ marginTop: 8, padding: "8px 12px", background: "#f0f7f2", borderRadius: 8, border: "1px solid #c8e6c9", fontSize: "0.82rem", color: "#2d6a4f", fontWeight: 700 }}>
              🖼️ <strong>400x400 WebP Thumbnail Generated</strong> ({imageMeta.sizeKb} KB) | {imageMeta.aiLabel}
            </div>
          )}
          
          {imagePreview && (
            <div style={{ display: "flex", gap: 12, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleAiAutoIdentify}
                disabled={isAiAnalyzing}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 16px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: "0.86rem",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(27, 67, 50, 0.2)"
                }}
              >
                <Sparkles size={16} color="#74c69d" />
                {isAiAnalyzing ? "Scanning Pixels with Gemini 1.5 Flash..." : "Auto-Identify & Diagnose with Gemini AI"}
              </button>

              <button
                type="button"
                className="ghost-btn"
                onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                style={{ fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Key size={14} /> {localStorage.getItem("geminiApiKey") ? "API Key Set ✓" : "Set API Key"}
              </button>

              <button type="button" className="ghost-btn" onClick={handleRemoveImage} style={{ color: "#d9534f", border: "1px solid #d9534f" }}>
                <Trash2 size={16} /> Remove Photo
              </button>
            </div>
          )}

          {showApiKeyInput && (
            <div style={{ marginTop: 12, padding: 14, background: "#f8faf7", borderRadius: 14, border: "1px solid #cbd5e1" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 750, color: "#0f172a", display: "block", marginBottom: 6 }}>
                🔑 Google Gemini API Key (for live real-time cloud AI identification):
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="password"
                  placeholder="Paste your Gemini API Key (e.g. AIzaSy...)"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.86rem" }}
                />
                <button type="button" onClick={handleSaveApiKey} style={{ padding: "8px 14px", borderRadius: 8, background: "#16a34a", color: "#fff", fontWeight: 800, border: "none", cursor: "pointer" }}>
                  Save Key
                </button>
              </div>
            </div>
          )}

          {/* AI Vision Diagnosis Report Card */}
          {aiReport && (
            <div style={{ marginTop: 16, padding: "18px", borderRadius: 16, background: "linear-gradient(135deg, #f0fdf4 0%, #e6f4ea 100%)", border: "1px solid #bbf7d0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
                <span style={{ fontSize: "0.78rem", background: "#16a34a", color: "#ffffff", padding: "4px 10px", borderRadius: 10, fontWeight: 800, textTransform: "uppercase" }}>
                  🧠 Vertex AI (Gemini 1.5 Flash Vision)
                </span>
                <span style={{ fontSize: "0.78rem", color: "#15803d", fontWeight: 700 }}>
                  Confidence: {aiReport.confidence}
                </span>
              </div>

              <h3 style={{ margin: "4px 0", fontSize: "1.1rem", fontWeight: 850, color: "#0f172a" }}>
                {aiReport.icon} {aiReport.name} <em style={{ fontSize: "0.9rem", color: "#475569" }}>({aiReport.species})</em>
              </h3>
              <span style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: 700, display: "block" }}>Family: {aiReport.family}</span>

              <div style={{ marginTop: 12, padding: "10px 12px", background: "#ffffff", borderRadius: 12, border: "1px solid #dcfce7" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ color: "#0f172a", fontSize: "0.88rem" }}>🩺 Visual Disease Diagnosis:</strong>
                  <span style={{ fontSize: "0.76rem", fontWeight: 800, padding: "2px 8px", borderRadius: 8, background: aiReport.severity === "Healthy" ? "#dcfce7" : "#fef3c7", color: aiReport.severity === "Healthy" ? "#15803d" : "#b45309" }}>
                    {aiReport.severity}
                  </span>
                </div>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "#334155", lineHeight: 1.4 }}>{aiReport.symptoms}</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginTop: 12 }}>
                <div style={{ padding: "8px 10px", background: "#ffffff", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: "0.78rem" }}>
                  <span style={{ color: "#64748b", fontWeight: 600, display: "block" }}>WATER VOLUME</span>
                  <strong style={{ color: "#0284c7", fontSize: "0.88rem" }}>💧 {aiReport.recommendedWaterMl} mL</strong>
                </div>
                <div style={{ padding: "8px 10px", background: "#ffffff", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: "0.78rem" }}>
                  <span style={{ color: "#64748b", fontWeight: 600, display: "block" }}>SOIL PH</span>
                  <strong style={{ color: "#16a34a", fontSize: "0.88rem" }}>🧪 {aiReport.idealSoilPh}</strong>
                </div>
                <div style={{ padding: "8px 10px", background: "#ffffff", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: "0.78rem" }}>
                  <span style={{ color: "#64748b", fontWeight: 600, display: "block" }}>SUNLIGHT</span>
                  <strong style={{ color: "#d97706", fontSize: "0.88rem" }}>☀️ {aiReport.sunlight}</strong>
                </div>
              </div>

              {aiReport.tokenStats && (
                <div style={{ marginTop: 12, padding: "8px 12px", background: "#0f172a", borderRadius: 10, color: "#38bdf8", fontSize: "0.78rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                  <span>⚡ Scan Token Usage: <strong>{aiReport.tokenStats.lastScanTokens} Tokens</strong></span>
                  <span style={{ color: "#4ade80" }}>Daily Remaining: <strong>{aiReport.tokenStats.remainingScans} / 1500 Scans</strong></span>
                </div>
              )}
            </div>
          )}
        </section>

        <section>
          <h2>Basic Information</h2>
          <div className="field-grid">
            <label>Plant Name / Nickname<input value={form.name} onChange={(e) => update("name", e.target.value)} /></label>
            <label>Species<input value={form.species} onChange={(e) => update("species", e.target.value)} /></label>
          </div>
        </section>

        <section>
          <h2>Location & Weather Region</h2>
          <div className="field-grid">
            <label>
              Room / Spot
              <select value={form.location} onChange={(e) => update("location", e.target.value)}>
                {["Living Room", "Bedroom", "Kitchen", "Balcony", "Office", "Garden", "Other"].map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              City / Country (for Plant's Local Weather)
              <input
                type="text"
                value={form.locationCity || ""}
                onChange={(e) => update("locationCity", e.target.value)}
                placeholder="e.g. London, Tokyo, Coimbatore, New York..."
              />
            </label>
          </div>
        </section>

        <section>
          <h2>Watering</h2>
          <div className="field-grid">
            <label>Watering frequency in days<input type="number" min="1" value={form.frequency} onChange={(e) => update("frequency", e.target.value)} /></label>
            <label>Last watered date<input type="date" value={form.lastWatered} onChange={(e) => update("lastWatered", e.target.value)} /></label>
          </div>
        </section>

        <section>
          <h2>Sunlight</h2>
          <div className="segmented" role="group" aria-label="Sunlight requirement">
            {["Direct Sunlight", "Indirect Sunlight", "Low Light"].map((item) => (
              <button type="button" key={item} className={form.sunlight === item ? "selected" : ""} onClick={() => update("sunlight", item)}>{item}</button>
            ))}
          </div>
        </section>

        <section>
          <h2>Notes</h2>
          <label>Initial observations<textarea rows="5" value={form.notes} placeholder="New leaf appeared, soil looked dry..." onChange={(e) => update("notes", e.target.value)} /></label>
        </section>

        <div className="form-actions">
          <button type="button" className="ghost-btn" onClick={() => navigate("/my-plants")}><X size={16} /> Cancel</button>
          <button className="primary-btn" disabled={isSaving}><Save size={16} /> {isSaving ? "Saving..." : "Save Plant"}</button>
        </div>
      </form>
      <aside className="preview-column panel">
        <h2>Live Preview</h2>
        <PlantCard plant={preview} preview />
      </aside>
    </div>
  );
}
