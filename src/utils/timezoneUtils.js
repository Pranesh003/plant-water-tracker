// Timezone resolution and internal plant clock utility

export const cityTimezoneMap = {
  coimbatore: "Asia/Kolkata",
  chennai: "Asia/Kolkata",
  mumbai: "Asia/Kolkata",
  delhi: "Asia/Kolkata",
  bangalore: "Asia/Kolkata",
  hyderabad: "Asia/Kolkata",
  london: "Europe/London",
  uk: "Europe/London",
  "new york": "America/New_York",
  nyc: "America/New_York",
  usa: "America/New_York",
  tokyo: "Asia/Tokyo",
  japan: "Asia/Tokyo",
  paris: "Europe/Paris",
  france: "Europe/Paris",
  sydney: "Australia/Sydney",
  australia: "Australia/Sydney",
  singapore: "Asia/Singapore",
  dubai: "Asia/Dubai",
  uae: "Asia/Dubai",
  "los angeles": "America/Los_Angeles",
  toronto: "America/Toronto",
  canada: "America/Toronto",
  berlin: "Europe/Berlin",
  germany: "Europe/Berlin",
  rome: "Europe/Rome",
  italy: "Europe/Rome",
  madrid: "Europe/Madrid",
  spain: "Europe/Madrid",
  seoul: "Asia/Seoul",
  korea: "Asia/Seoul",
  hongkong: "Asia/Hong_Kong",
  bangkok: "Asia/Bangkok",
  thailand: "Asia/Bangkok"
};

const roomNames = ["living room", "bedroom", "kitchen", "balcony", "office", "garden", "other", "indoor", "outdoor"];

export const extractCityFromLocationString = (locationStr) => {
  if (!locationStr) return "Coimbatore";
  const str = String(locationStr).trim();
  if (!str) return "Coimbatore";

  if (str.includes(",")) {
    const parts = str.split(",");
    const lastPart = parts[parts.length - 1].trim();
    if (lastPart) return lastPart;
  }

  if (str.includes("(") && str.includes(")")) {
    const match = str.match(/\(([^)]+)\)/);
    if (match && match[1]) return match[1].trim();
  }

  const locLower = str.toLowerCase();
  if (!roomNames.includes(locLower)) {
    return str;
  }

  return "Coimbatore";
};

export const resolveCityFromPlant = (plant) => {
  if (!plant) return "Coimbatore";
  if (plant.locationCity && plant.locationCity.trim()) {
    return plant.locationCity.trim();
  }
  return extractCityFromLocationString(plant.location);
};

export const resolvePlantTimezone = (plantLocationCity, serverTimezone) => {
  if (serverTimezone && serverTimezone !== "UTC") return serverTimezone;
  if (!plantLocationCity) return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
  const normalized = String(plantLocationCity).trim().toLowerCase();
  for (const [key, tz] of Object.entries(cityTimezoneMap)) {
    if (normalized.includes(key)) return tz;
  }
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
};

export const getPlantLocalDate = (plantLocationCity, serverTimezone) => {
  const tz = resolvePlantTimezone(plantLocationCity, serverTimezone);
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());

    const year = parts.find((p) => p.type === "year").value;
    const month = parts.find((p) => p.type === "month").value;
    const day = parts.find((p) => p.type === "day").value;
    return `${year}-${month}-${day}`;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
};

export const getPlantLocalTimeFormatted = (plantLocationCity, serverTimezone) => {
  const tz = resolvePlantTimezone(plantLocationCity, serverTimezone);
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    }).format(new Date());
  } catch {
    return new Date().toLocaleTimeString();
  }
};

export const getPlantLocalShortDate = (plantLocationCity, serverTimezone) => {
  const tz = resolvePlantTimezone(plantLocationCity, serverTimezone);
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      month: "short",
      day: "numeric"
    }).format(new Date());
  } catch {
    return "";
  }
};
