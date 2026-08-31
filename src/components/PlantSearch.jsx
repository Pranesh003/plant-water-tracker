import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { plantSuggestions } from "../data/mockPlants.js";
import { getPlantIconUrl } from "../utils/plantIconUtils.js";

export default function PlantSearch({ value, onChange, onSelect, suggestions = [], loading = false, error = "", compact = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const localMatches = useMemo(() => {
    if (!value || !value.trim()) return plantSuggestions.slice(0, 6);
    const lower = value.toLowerCase().trim();
    return plantSuggestions.filter((plant) =>
      `${plant.name} ${plant.species}`.toLowerCase().includes(lower)
    ).slice(0, 8);
  }, [value]);

  const matches = useMemo(() => {
    const map = new Map();
    localMatches.forEach((item) => {
      map.set(`${item.name.toLowerCase()}-${item.species.toLowerCase()}`, item);
    });
    if (Array.isArray(suggestions)) {
      suggestions.forEach((item) => {
        if (item && item.name && item.species) {
          const key = `${item.name.toLowerCase()}-${item.species.toLowerCase()}`;
          if (!map.has(key)) map.set(key, item);
        }
      });
    }
    return Array.from(map.values());
  }, [localMatches, suggestions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (event) => {
    onChange(event.target.value);
    setIsOpen(true);
  };

  const handleSelect = (plant) => {
    setIsOpen(false);
    onSelect?.(plant);
  };

  return (
    <div ref={containerRef} className={`plant-search ${compact ? "compact" : ""}`}>
      <label>
        <span className="visually-hidden">Search for a plant</span>
        <Search size={18} />
        <input
          placeholder="Search plant name or species (e.g. Snake Plant, Money Plant)..."
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
        />
      </label>
      {isOpen && value && (
        <div className="suggestions">
          {matches.length > 0 ? (
            matches.map((plant) => (
              <button key={`${plant.name}-${plant.species}`} type="button" onClick={() => handleSelect(plant)}>
                <img src={getPlantIconUrl(plant)} alt="" style={{ width: 22, height: 22, objectFit: "contain", verticalAlign: "middle" }} />
                <strong>{plant.name}</strong>
                <small>{plant.species}{plant.family ? ` · ${plant.family}` : ""}</small>
              </button>
            ))
          ) : (
            <p>
              <strong>{error || (loading ? "Searching..." : "No plants found.")}</strong>
              <br />
              Type custom plant details or select from options.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
