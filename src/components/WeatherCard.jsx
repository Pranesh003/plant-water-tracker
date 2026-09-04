import { CloudRain, CloudSun, Compass, Droplets, MapPin, RefreshCcw, Sun, Thermometer, Wind } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../services/api.js";
import { tnDistrictsAndCities } from "../data/tnDistricts.js";
import { readStorage } from "../utils/storageUtils.js";

export default function WeatherCard({ baseWaterMl = 400, onWeatherChange }) {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const settings = readStorage("plantCareUserSettings", { tempUnit: "°C" });
  const tempUnit = settings.tempUnit || "°C";

  const formatTemperature = (celsiusTemp) => {
    if (celsiusTemp == null) return "Not available";
    if (tempUnit === "°F") {
      const fahrenheit = Math.round((Number(celsiusTemp) * 9) / 5 + 32);
      return `${fahrenheit} °F`;
    }
    return `${celsiusTemp} °C`;
  };

  const [inputs, setInputs] = useState({
    city: "Coimbatore",
    baseWaterMl,
    outdoor: false
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [usingDeviceLocation, setUsingDeviceLocation] = useState(false);
  const dropdownRef = useRef(null);

  const filteredDistricts = inputs.city ? tnDistrictsAndCities.filter((item) =>
    `${item.name} ${item.alias || ''} ${item.state} ${item.label}`.toLowerCase().includes(inputs.city.toLowerCase())
  ) : tnDistrictsAndCities.slice(0, 12);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchWeather = async (coordinates, cityOverride) => {
    try {
      const queryParams = coordinates
        ? { lat: coordinates.lat, lon: coordinates.lon, baseWaterMl: inputs.baseWaterMl, outdoor: inputs.outdoor }
        : { city: cityOverride || inputs.city, baseWaterMl: inputs.baseWaterMl, outdoor: inputs.outdoor };

      const result = await api.getWeather(queryParams);
      setWeather(result);
      onWeatherChange?.(result);
      if (result?.location) {
        setInputs((current) => ({ ...current, city: result.location }));
      }
      setError(null);
    } catch (requestError) {
      setError(requestError.message || "Weather unavailable");
    }
  };

  const handleCitySelect = (item) => {
    setInputs((current) => ({ ...current, city: item.name }));
    setShowDropdown(false);
    setUsingDeviceLocation(false);
    fetchWeather(null, item.name);
  };

  const useDeviceLocation = () => {
    if (!navigator.geolocation) {
      setUsingDeviceLocation(false);
      setError("Location access is not supported by your browser.");
      fetchWeather();
      return;
    }
    setUsingDeviceLocation(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        fetchWeather({ lat: coords.latitude, lon: coords.longitude });
      },
      (geoError) => {
        setUsingDeviceLocation(false);
        fetchWeather(null, inputs.city);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    useDeviceLocation();
  }, []);

  return (
    <article className="panel weather-card" style={{ background: "#ffffff", borderRadius: 20, padding: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", color: "#15803d", textTransform: "uppercase", background: "#f0fdf4", padding: "4px 10px", borderRadius: 20, border: "1px solid #bbf7d0" }}>
            TODAY'S WEATHER
          </span>
          <h2 style={{ margin: "6px 0 0", fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
            <CloudSun size={24} color="#16a34a" /> Live Local Weather
          </h2>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={useDeviceLocation}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
              color: "#ffffff",
              border: "none",
              padding: "9px 16px",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: "0.88rem",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(22, 163, 74, 0.25)",
              transition: "transform 0.2s, boxShadow 0.2s"
            }}
          >
            <MapPin size={16} /> Use Live Location
          </button>
          <button
            type="button"
            onClick={() => fetchWeather(null, inputs.city)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#f1f5f9",
              color: "#334155",
              border: "1px solid #cbd5e1",
              padding: "9px 14px",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: "0.88rem",
              cursor: "pointer"
            }}
          >
            <RefreshCcw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Input Controls */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 16 }}>
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>
            City / District
            <input
              type="text"
              placeholder="Type city or select district..."
              value={inputs.city}
              onFocus={() => setShowDropdown(true)}
              onChange={(event) => {
                setInputs({ ...inputs, city: event.target.value });
                setShowDropdown(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setShowDropdown(false);
                  fetchWeather(null, inputs.city);
                }
              }}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 12,
                border: "1.5px solid #cbd5e1",
                fontSize: "0.95rem",
                fontWeight: 600,
                color: "#0f172a",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </label>

          {showDropdown && filteredDistricts.length > 0 && (
            <ul style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 100,
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: 12,
              boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
              maxHeight: 220,
              overflowY: "auto",
              listStyle: "none",
              margin: "4px 0 0",
              padding: "6px 0"
            }}>
              {filteredDistricts.map((item) => (
                <li
                  key={item.id || item.name}
                  onClick={() => handleCitySelect(item)}
                  style={{
                    padding: "10px 16px",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.9rem",
                    color: "#16a34a",
                    fontWeight: 600
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f0fdf4"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <span><strong>{item.name}</strong> {item.alias ? `(${item.alias})` : ""}</span>
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>{item.label || "District"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>
            Base Water (mL)
            <input
              type="number"
              value={inputs.baseWaterMl}
              onChange={(event) => setInputs({ ...inputs, baseWaterMl: event.target.value })}
              onBlur={() => fetchWeather(null, inputs.city)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 12,
                border: "1.5px solid #cbd5e1",
                fontSize: "0.95rem",
                fontWeight: 600,
                color: "#0f172a",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </label>
        </div>
      </div>

      {/* Outdoor Checkbox Pill */}
      <div style={{ marginBottom: 20 }}>
        <label style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 14px",
          background: inputs.outdoor ? "#f0fdf4" : "#f8fafc",
          border: `1.5px solid ${inputs.outdoor ? "#bbf7d0" : "#e2e8f0"}`,
          borderRadius: 12,
          fontSize: "0.88rem",
          fontWeight: 600,
          color: inputs.outdoor ? "#15803d" : "#475569",
          cursor: "pointer",
          transition: "all 0.2s"
        }}>
          <input
            type="checkbox"
            checked={inputs.outdoor}
            onChange={(event) => {
              const updated = event.target.checked;
              setInputs({ ...inputs, outdoor: updated });
              fetchWeather(null, inputs.city);
            }}
            style={{ width: 16, height: 16, accentColor: "#16a34a", cursor: "pointer" }}
          />
          🌧️ Outdoor plant (automatically adjusts water calculations for local rainfall)
        </label>
      </div>

      {error && (
        <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, color: "#dc2626", fontSize: "0.88rem", fontWeight: 600, marginBottom: 16 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Metric Cards Grid */}
      {weather && (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 14
          }}>
            {/* Temperature */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em", color: "#64748b", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>
                <Thermometer size={14} color="#ea580c" /> TEMPERATURE
              </span>
              <strong style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a" }}>
                {formatTemperature(weather.temperature)}
              </strong>
            </div>

            {/* Humidity */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em", color: "#64748b", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>
                <Droplets size={14} color="#0284c7" /> HUMIDITY
              </span>
              <strong style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a" }}>
                {weather.humidity != null ? `${weather.humidity}%` : "N/A"}
              </strong>
            </div>

            {/* Rain Chance */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em", color: "#64748b", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>
                <CloudRain size={14} color="#2563eb" /> RAIN CHANCE
              </span>
              <strong style={{ fontSize: "1.35rem", fontWeight: 800, color: "#2563eb" }}>
                {weather.rainProbability != null ? `${weather.rainProbability}%` : "N/A"}
              </strong>
            </div>

            {/* Wind */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em", color: "#64748b", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>
                <Wind size={14} color="#0284c7" /> WIND SPEED
              </span>
              <strong style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a" }}>
                {weather.windSpeed != null ? `${weather.windSpeed} km/h` : "N/A"}
              </strong>
            </div>

            {/* Condition */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em", color: "#64748b", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>
                <Sun size={14} color="#d97706" /> CONDITION
              </span>
              <strong style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", textTransform: "capitalize" }}>
                {weather.condition || "N/A"}
              </strong>
            </div>

            {/* Recommended Water (Highlighted Green Card) */}
            <div style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", border: "1.5px solid #bbf7d0", borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em", color: "#15803d", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>
                <Droplets size={14} color="#16a34a" /> RECOMMENDED WATER
              </span>
              <strong style={{ fontSize: "1.4rem", fontWeight: 900, color: "#15803d" }}>
                {weather.watering?.recommendedWaterMl != null ? `${weather.watering.recommendedWaterMl} mL` : "N/A"}
              </strong>
            </div>
          </div>

          {/* Footer Metadata */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px dashed #e2e8f0", fontSize: "0.82rem", color: "#64748b", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
              <Compass size={14} color="#16a34a" />
              {usingDeviceLocation ? "📍 Live GPS Location" : "🏙️ Selected City"}: <strong style={{ color: "#0f172a" }}>{weather.location}</strong> · Source: Open-Meteo
            </span>
            <span>Last updated: {new Date(weather.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </>
      )}
    </article>
  );
}
