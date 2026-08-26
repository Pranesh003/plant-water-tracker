import { CloudSun, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../services/api.js";

export default function WeatherCard({ baseWaterMl = 400, onWeatherChange }) {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const [inputs, setInputs] = useState({
    city: "Chennai",
    baseWaterMl,
    outdoor: false
  });
  const [usingDeviceLocation, setUsingDeviceLocation] = useState(false);
  const fetchWeather = async (coordinates) => {
    try {
      const result = await api.getWeather({ ...inputs, ...coordinates });
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

      <div className="weather-form-grid">
        <label>City<input type="text" value={inputs.city} onChange={(event) => setInputs({ ...inputs, city: event.target.value })} /></label>
        <label>Base Water (mL)<input type="number" value={inputs.baseWaterMl} onChange={(event) => setInputs({ ...inputs, baseWaterMl: event.target.value })} /></label>
        <label className="check weather-check"><input type="checkbox" checked={!!inputs.outdoor} onChange={(event) => setInputs({ ...inputs, outdoor: event.target.checked })} /> Outdoor plant</label>
      </div>

      {error && <div className="error weather-message" role="alert">{error}</div>}
      {!weather && !error && <div className="weather-empty">Weather data unavailable</div>}

      {weather && (
        <div className="weather-result">
          <div><small>Temperature</small><strong>{weather.temperature != null ? `${weather.temperature} C` : "Not available"}</strong></div>
          <div><small>Humidity</small><strong>{weather.humidity != null ? `${weather.humidity}%` : "Not available"}</strong></div>
          <div><small>Rain Chance</small><strong>{weather.rainProbability != null ? `${weather.rainProbability}%` : "Not available"}</strong></div>
          <div><small>Wind</small><strong>{weather.windSpeed != null ? `${weather.windSpeed} km/h` : "Not available"}</strong></div>
          <div><small>Condition</small><strong>{weather.condition || "Not available"}</strong></div>
          <div><small>Recommended Water</small><strong>{weather.watering ? `${weather.watering.recommendedWaterMl} mL` : "Not available"}</strong></div>
          <p className="muted">{usingDeviceLocation ? "Using your device location" : "Using the selected city"}{weather.source ? ` · Source: ${weather.source}` : ""}</p>
          <p className="muted">Last updated: {new Date(weather.updatedAt).toLocaleString()}</p>
        </div>
      )}
    </article>
  );
}
