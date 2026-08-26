import { Search } from "lucide-react";
import { plantSuggestions } from "../data/mockPlants.js";

export default function PlantSearch({ value, onChange, onSelect, suggestions = [], loading = false, error = "", compact = false }) {
  const localMatches = value ? plantSuggestions.filter((plant) => `${plant.name} ${plant.species}`.toLowerCase().includes(value.toLowerCase())).slice(0, 6) : [];
  const matches = suggestions.length ? suggestions : localMatches;
  return (
    <div className={`plant-search ${compact ? "compact" : ""}`}>
      <label><span className="visually-hidden">Search for a plant</span><Search size={18} /><input placeholder="Search for a plant..." value={value} onChange={(event) => onChange(event.target.value)} /></label>
      {value && (
        <div className="suggestions">
          {loading ? <p>Searching Trefle species…</p> : matches.length ? matches.map((plant) => (
            <button key={`${plant.name}-${plant.species}`} type="button" onClick={() => onSelect?.(plant)}>
              <span>{plant.icon || "🌿"}</span><strong>{plant.name}</strong><small>{plant.species}{plant.family ? ` · ${plant.family}` : ""}</small>
            </button>
          )) : <p><strong>{error || "No plants found."}</strong><br />Try another plant name or add it manually.</p>}
        </div>
      )}
    </div>
  );
}
