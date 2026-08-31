import { useEffect, useRef, useState } from "react";
import { Camera, Save, Sparkles, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { usePlantCare } from "../App.jsx";
import { generatePlantRecommendation, validatePlantImage } from "../utils/plantAssistant.js";
import { uploadPlantPhoto } from "../utils/storageUtils.js";
import { todayISO } from "../utils/wateringUtils.js";
import PlantCard from "./PlantCard.jsx";
import PlantSearch from "./PlantSearch.jsx";

const initialForm = { name: "", species: "", location: "Living Room", frequency: 7, lastWatered: todayISO(), sunlight: "Indirect Sunlight", notes: "", icon: "🌱", photoUrl: "", recommendedWaterMl: "", humidity: "" };

// A new plant has not been watered until the user records a watering event.
initialForm.lastWatered = "";

export default function PlantForm({ plant, mode = "add" }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { refresh, notify } = usePlantCare();
  const [query, setQuery] = useState("");
  const [speciesSuggestions, setSpeciesSuggestions] = useState([]);
  const [isSearchingSpecies, setIsSearchingSpecies] = useState(false);
  const [speciesSearchError, setSpeciesSearchError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (plant) {
      setForm({ ...initialForm, ...plant, notes: "" });
      setImagePreview(plant.photoUrl || "");
      setSelectedImage(null);
    }
  }, [plant]);

  useEffect(() => {
    const search = query.trim();
    if (search.length < 2) {
      setSpeciesSuggestions([]);
      setSpeciesSearchError("");
      setIsSearchingSpecies(false);
      return undefined;
    }
    const timer = window.setTimeout(async () => {
      setIsSearchingSpecies(true);
      try {
        const results = await api.searchSpecies(search);
        setSpeciesSuggestions(results);
        setSpeciesSearchError("");
      } catch (requestError) {
        setSpeciesSuggestions([]);
        setSpeciesSearchError(requestError.message || "Plant species search is unavailable.");
      } finally {
        setIsSearchingSpecies(false);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const selectPlant = (suggestion) => {
    setQuery("");
    setSpeciesSuggestions([]);
    setForm((current) => ({ ...current, name: suggestion.name, species: suggestion.species, frequency: suggestion.frequency || current.frequency, sunlight: suggestion.sunlight || current.sunlight, icon: suggestion.icon || current.icon }));
  };

  const handleImageSelection = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validation = validatePlantImage(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    setError("");
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setSelectedImage(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview("");
    setAiRecommendation(null);
    setForm((current) => ({ ...current, photoUrl: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const analyzeImage = () => {
    if (!imagePreview) {
      setError("Upload a plant image before identifying the plant.");
      return;
    }
    setIsAnalyzing(true);
    setError("");
    const recommendation = generatePlantRecommendation({ name: imagePreview, size: 2500000, type: "image/jpeg" });
    setTimeout(() => {
      setAiRecommendation(recommendation);
      setForm((current) => ({
        ...current,
        name: recommendation.plantName,
        species: recommendation.species,
        frequency: recommendation.wateringFrequencyDays,
        sunlight: recommendation.sunlight,
        location: recommendation.location?.split(" / ")[0] || current.location,
        recommendedWaterMl: recommendation.recommendedWaterMl,
        humidity: recommendation.humidity,
        notes: recommendation.careTips.join(" ")
      }));
      setIsAnalyzing(false);
    }, 600);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.species.trim()) return setError("Plant name and species are required.");
    if (Number(form.frequency) < 1) return setError("Watering frequency must be at least 1 day.");
    setIsSaving(true);
    setError("");
    try {
      if (mode === "edit") await api.updatePlant(plant.id, form, selectedImage);
      else await api.createPlant(form, selectedImage);
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
        <PlantSearch value={query} onChange={setQuery} onSelect={selectPlant} suggestions={speciesSuggestions} loading={isSearchingSpecies} error={speciesSearchError} />
        {error && <p className="error" role="alert">{error}</p>}

        <section>
          <h2>Plant Image</h2>
          <div className="field-grid">
            <label className="upload-box" style={{ display: "grid", gap: 8 }}>
              <span><Camera size={18} /> Upload Plant Photo</span>
              <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleImageSelection} />
            </label>
          </div>
          {imagePreview && <img src={imagePreview} alt="Plant preview" style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 12, marginTop: 12 }} />}
          {imagePreview && (
            <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
              <button type="button" className="ghost-btn" onClick={handleRemoveImage} style={{ color: "#d9534f", border: "1px solid #d9534f" }}>
                <Trash2 size={16} /> Remove Photo
              </button>
            </div>
          )}
        </section>

        {aiRecommendation && (
          <section>
            <h2>AI Plant Assistant</h2>
            <div className="panel" style={{ padding: 16, background: "#f6fbf5" }}>
              <p><strong>Plant:</strong> {aiRecommendation.plantName}</p>
              <p><strong>Species:</strong> {aiRecommendation.species}</p>
              <p><strong>Confidence:</strong> {aiRecommendation.confidence ? `${(aiRecommendation.confidence * 100).toFixed(0)}%` : "Low"}</p>
              <p><strong>Watering:</strong> Every {aiRecommendation.wateringFrequencyDays} days</p>
              <p><strong>Recommended water:</strong> {aiRecommendation.recommendedWaterMl} mL</p>
              <p><strong>Sunlight:</strong> {aiRecommendation.sunlight}</p>
              <p><strong>Location:</strong> {aiRecommendation.location}</p>
              <p><strong>Humidity:</strong> {aiRecommendation.humidity}</p>
              <ul>
                {aiRecommendation.careTips.map((tip) => <li key={tip}>{tip}</li>)}
              </ul>
              <button type="button" className="ghost-btn" onClick={() => setAiRecommendation(null)}>Edit</button>
            </div>
          </section>
        )}

        <section><h2>Basic Information</h2><div className="field-grid"><label>Plant Name / Nickname<input value={form.name} onChange={(e) => update("name", e.target.value)} /></label><label>Species<input value={form.species} onChange={(e) => update("species", e.target.value)} /></label></div></section>
        <section><h2>Location</h2><label>Plant location<select value={form.location} onChange={(e) => update("location", e.target.value)}>{["Living Room", "Bedroom", "Kitchen", "Balcony", "Office", "Garden", "Other"].map((item) => <option key={item}>{item}</option>)}</select></label></section>
        <section><h2>Watering</h2><div className="field-grid"><label>Watering frequency in days<input type="number" min="1" value={form.frequency} onChange={(e) => update("frequency", e.target.value)} /></label><label>Last watered date<input type="date" value={form.lastWatered} onChange={(e) => update("lastWatered", e.target.value)} /></label></div></section>
        <section><h2>Sunlight</h2><div className="segmented" role="group" aria-label="Sunlight requirement">{["Direct Sunlight", "Indirect Sunlight", "Low Light"].map((item) => <button type="button" key={item} className={form.sunlight === item ? "selected" : ""} onClick={() => update("sunlight", item)}>{item}</button>)}</div></section>
        <section><h2>Notes</h2><label>Initial observations<textarea rows="5" value={form.notes} placeholder="New leaf appeared, soil looked dry..." onChange={(e) => update("notes", e.target.value)} /></label></section>
        <div className="form-actions"><button type="button" className="ghost-btn" onClick={() => navigate("/my-plants")}><X size={16} /> Cancel</button><button className="primary-btn" disabled={isSaving}><Save size={16} /> {isSaving ? "Saving..." : "Save Plant"}</button></div>
      </form>
      <aside className="preview-column panel"><h2>Live Preview</h2><PlantCard plant={preview} preview /></aside>
    </div>
  );
}
