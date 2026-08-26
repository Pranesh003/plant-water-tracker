import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const PORT = process.env.PORT || 8080;

function kmh(ms) {
  return Math.round(ms * 3.6);
}

app.get("/api/weather", async (req, res) => {
  try {
    if (!WEATHER_API_KEY) return res.status(500).json({ error: "Missing WEATHER_API_KEY in server environment." });
    const { lat, lon, city, baseWaterMl = 400, outdoor } = req.query;
    let latitude = lat;
    let longitude = lon;
    if (!latitude || !longitude) {
      if (!city) return res.status(400).json({ error: "Provide either lat+lon or city query parameters." });
      // Geocode city using OpenWeatherMap geocoding
      const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${WEATHER_API_KEY}`;
      const geoResp = await fetch(geoUrl, { timeout: 8000 });
      const geoJson = await geoResp.json();
      if (!Array.isArray(geoJson) || geoJson.length === 0) return res.status(404).json({ error: "City not found." });
      latitude = geoJson[0].lat;
      longitude = geoJson[0].lon;
    }

    const onecall = `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely,hourly,alerts&units=metric&appid=${WEATHER_API_KEY}`;
    const resp = await fetch(onecall, { timeout: 10000 });
    if (!resp.ok) return res.status(502).json({ error: `Weather provider returned ${resp.status}` });
    const data = await resp.json();
    const current = data.current || {};
    const daily0 = (data.daily && data.daily[0]) || {};

    const temperature = Math.round(current.temp ?? null);
    const humidity = current.humidity ?? null;
    const condition = (current.weather && current.weather[0] && current.weather[0].description) ? current.weather[0].description : "Unknown";
    const rainProbability = Math.round((daily0.pop ?? 0) * 100);
    const windSpeed = kmh(current.wind_speed ?? 0);
    const updatedAt = new Date((current.dt || Date.now()) * 1000).toISOString();

    // Simple watering adjustment factors
    const temp = temperature ?? 0;
    let tempFactor = 1;
    if (temp < 20) tempFactor = 0.9;
    else if (temp <= 28) tempFactor = 1;
    else if (temp <= 34) tempFactor = 1.1;
    else tempFactor = 1.2;

    const hum = humidity ?? 50;
    let humFactor = 1;
    if (hum > 80) humFactor = 0.9;
    else if (hum >= 60) humFactor = 1;
    else if (hum >= 40) humFactor = 1.1;
    else humFactor = 1.25;

    const pop = rainProbability;
    let rainFactor = 1;
    const isOutdoor = outdoor === "true" || outdoor === true || outdoor === "1";
    if (pop >= 60 && isOutdoor) rainFactor = 0.5;
    else if (pop >= 30) rainFactor = 0.8;

    // sunlight factor: try to infer from condition
    let sunlightFactor = 1;
    const cond = (condition || "").toLowerCase();
    if (cond.includes("cloud")) sunlightFactor = 0.95;
    else if (cond.includes("rain") || cond.includes("shower")) sunlightFactor = 0.9;
    else if (cond.includes("clear") || cond.includes("sun")) sunlightFactor = 1.1;

    const base = Number(baseWaterMl) || 400;
    const recommended = Math.max(0, Math.round(base * tempFactor * humFactor * rainFactor * sunlightFactor));

    return res.json({
      location: city || `${latitude},${longitude}`,
      temperature,
      humidity,
      condition,
      rainProbability: pop,
      windSpeed,
      updatedAt,
      watering: {
        baseWaterMl: Number(base),
        recommendedWaterMl: recommended,
        factors: { tempFactor, humFactor, rainFactor, sunlightFactor }
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Unknown server error" });
  }
});

app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
