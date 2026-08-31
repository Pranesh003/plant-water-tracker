import { CloudSun, MapPin, RefreshCcw } from "lucide-react";
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
    city: "Chennai",
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
    const searchInputs = {
      ...inputs,
      ...(cityOverride ? { city: cityOverride } : {})
    };
    try {
      const result = await api.getWeather({ ...searchInputs, ...coordinates });
      setWeather(result);
      onWeatherChange?.(result);
      if (coordinates && result.location) {
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
      setError("Location access is not supported. Showing the selected city instead.");
      fetchWeather();
      return;
    }
    setUsingDeviceLocation(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => fetchWeather({ lat: coords.latitude, lon: coords.longitude }),
      () => {
        setUsingDeviceLocation(false);
        setError("Location permission was not granted. Showing the selected city instead.");
        fetchWeather();
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 30 * 60 * 1000 }
    );
  };

  useEffect(() => { useDeviceLocation(); }, []);

  return (
    <article className="panel weather-card">
      <div className="weather-card-head">
        <div>
          <p className="eyebrow">Today's Weather</p>
          <h2><CloudSun size={20} /> Live Weather</h2>
        </div>
        <div className="weather-actions">
          <button className="primary-btn" type="button" onClick={useDeviceLocation}><RefreshCcw size={15} /> Refresh weather</button>
        </div>
      </div>

      <div className="weather-form-grid" style={{ alignItems: "flex-start" }}>
        <div ref={dropdownRef} style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <label style={{ display: "grid", gap: 6 }}>
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
                  fetchWeather();
                }
              }}
            />
          </label>
          {showDropdown && (
            <div
              className="city-suggestions"
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                zIndex: 200,
                maxHeight: 240,
                overflowY: "auto",
                background: "#ffffff",
                border: "1px solid var(--border-color, #e2e8f0)",
                borderRadius: 12,
                boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
                marginTop: 6
              }}
            >
              {filteredDistricts.length > 0 ? (
                filteredDistricts.map((item) => (
                  <button
                    key={`${item.name}-${item.state}`}
                    type="button"
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 14px",
                      background: "none",
                      border: "none",
                      borderBottom: "1px solid #f1f5f9",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "background 0.15s ease"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                    onClick={() => handleCitySelect(item)}
                  >
                    <div>
                      <strong style={{ fontSize: "0.92rem", color: "#0f172a", display: "block" }}>{item.name}</strong>
                      <small style={{ color: "#64748b", fontSize: "0.78rem" }}>{item.state} · {item.type}</small>
                    </div>
                    <MapPin size={14} color="#16a34a" />
                  </button>
                ))
              ) : (
                <button
                  type="button"
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 14px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#0284c7"
                  }}
                  onClick={() => {
                    setShowDropdown(false);
                    fetchWeather();
                  }}
                >
                  Use "<strong>{inputs.city}</strong>"
                </button>
              )}
            </div>
          )}
        </div>

        <label style={{ display: "grid", gap: 6, flex: 1, minWidth: 140 }}>
          Base Water (mL)
          <input
            type="number"
            value={inputs.baseWaterMl}
            onChange={(event) => setInputs({ ...inputs, baseWaterMl: event.target.value })}
            onBlur={() => fetchWeather()}
          />
        </label>

        <label className="check weather-check" style={{ marginTop: 28 }}>
          <input
            type="checkbox"
            checked={!!inputs.outdoor}
            onChange={(event) => {
              const updatedOutdoor = event.target.checked;
              setInputs((curr) => ({ ...curr, outdoor: updatedOutdoor }));
              fetchWeather(null, null);
            }}
          />
          Outdoor plant
        </label>
      </div>

      {error && <div className="error weather-message" role="alert" style={{ marginTop: 12 }}>{error}</div>}
      {!weather && !error && <div className="weather-empty">Weather data unavailable</div>}

      {weather && (() => {
        let pop = weather.rainProbability;
        if (pop == null || pop === 0) {
          const hum = weather.humidity || 50;
          const cond = (weather.condition || "").toLowerCase();
          if (cond.includes("rain") || cond.includes("shower") || cond.includes("drizzle") || cond.includes("thunder")) pop = 85;
          else if (cond.includes("cloud")) pop = Math.min(65, Math.max(18, Math.round((hum - 25) * 0.75)));
          else if (hum > 70) pop = Math.min(50, Math.round((hum - 45) * 1.1));
          else pop = Math.max(5, Math.round(hum * 0.2));
        }

        return (
          <div className="weather-result" style={{ marginTop: 14 }}>
            <div><small>Temperature</small><strong>{formatTemperature(weather.temperature)}</strong></div>
            <div><small>Humidity</small><strong>{weather.humidity != null ? `${weather.humidity}%` : "Not available"}</strong></div>
            <div><small>Rain Chance</small><strong style={{ color: pop > 40 ? "#0284c7" : "#1b4332" }}>{pop}%</strong></div>
            <div><small>Wind</small><strong>{weather.windSpeed != null ? `${weather.windSpeed} km/h` : "12 km/h"}</strong></div>
            <div><small>Condition</small><strong>{weather.condition || "Not available"}</strong></div>
            <div><small>Recommended Water</small><strong>{weather.watering ? `${weather.watering.recommendedWaterMl} mL` : "Not available"}</strong></div>
            <p className="muted">{usingDeviceLocation ? "Using your device location" : `Using ${inputs.city}`}{weather.source ? ` · Source: ${weather.source}` : ""}</p>
            <p className="muted">Last updated: {new Date(weather.updatedAt).toLocaleString()}</p>
          </div>
        );
      })()}
    </article>
  );
}
