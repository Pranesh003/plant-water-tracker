import { Camera, Save, Trash2, X } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlantCare } from "../App.jsx";
import { api } from "../services/api.js";
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
    setForm((current) => ({ ...current, photoUrl: "" }));
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
          <h2>Plant Image</h2>
          <div className="field-grid">
            <label className="upload-box" style={{ display: "grid", gap: 8 }}>
              <span><Camera size={18} /> Upload Plant Photo</span>
              <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleImageSelection} />
            </label>
          </div>
          {imagePreview && <img src={imagePreview} alt="Plant preview" style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 12, marginTop: 12 }} />}
          {imageMeta && (
            <div style={{ marginTop: 8, padding: "8px 12px", background: "#f0f7f2", borderRadius: 8, border: "1px solid #c8e6c9", fontSize: "0.82rem", color: "#2d6a4f", fontWeight: 700 }}>
              🖼️ <strong>400x400 WebP Thumbnail Generated</strong> ({imageMeta.sizeKb} KB) | {imageMeta.aiLabel}
            </div>
          )}
          
          {imagePreview && (
            <div style={{ display: "flex", gap: 12, marginTop: 12, alignItems: "center" }}>
              <button type="button" className="ghost-btn" onClick={handleRemoveImage} style={{ color: "#d9534f", border: "1px solid #d9534f" }}>
                <Trash2 size={16} /> Remove Photo
              </button>
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
