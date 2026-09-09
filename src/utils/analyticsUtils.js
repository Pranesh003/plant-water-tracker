import { calculateWateringStatus, daysBetween, todayISO } from "./wateringUtils";

export const filterPlants = (plants, { location = "All Plants", status = "All", query = "" }) =>
  plants.filter((plant) => {
    const matchesLocation = location === "All Plants" || plant.location === location;
    const matchesStatus = status === "All" || calculateWateringStatus(plant.lastWatered, plant.frequency) === status;
    return matchesLocation && matchesStatus && `${plant.name} ${plant.species}`.toLowerCase().includes(query.toLowerCase());
  });

export const filterHistory = (history, { plantId = "All Plants", type = "All Activities", range = "All" }) =>
  history.filter((item) => {
    const matchesPlant = plantId === "All Plants" || item.plantId === plantId;
    const isAiDoc = item.type === "ai_doctor" || (typeof item.text === "string" && item.text.includes("[Vertex AI Doctor Diagnosis]"));
    
    let matchesType = true;
    if (type.includes("AI Doctor") || type === "ai_doctor") {
      matchesType = isAiDoc;
    } else if (type === "Notes" || type === "note") {
      matchesType = (item.type === "note" || !!item.text) && !isAiDoc;
    } else if (type === "Watering" || type === "watering") {
      matchesType = (item.type === "watering" || (!item.type && !item.text)) && !isAiDoc;
    } else if (type === "Streak" || type === "streak") {
      matchesType = item.type === "streak" || (item.streak != null && Number(item.streak) > 0);
    } else if (type !== "All Activities") {
      matchesType = item.type === type.toLowerCase();
    }

    const matchesRange = range === "All" || daysBetween(item.date, todayISO()) <= Number(range);
    return matchesPlant && matchesType && matchesRange;
  });

export const calculateWateringConsistency = (plant, history) => {
  const waterings = history.filter((item) => item.plantId === plant.id && item.type === "watering");
  if (!waterings.length) return 0;
  const status = calculateWateringStatus(plant.lastWatered, plant.frequency);
  const statusScore = status === "Overdue" ? 72 : status === "Water Soon" ? 88 : 96;
  return Math.min(100, Math.round(statusScore + Math.min(plant.currentStreak, 20) / 5));
};

export const computeSpeciesByLocation = (plants = []) => {
  if (!plants.length) return [];
  const map = new Map();
  plants.forEach((plant) => {
    const loc = plant.locationCity || plant.location || "Indoor Garden";
    if (!map.has(loc)) {
      map.set(loc, { city: loc, totalPlants: 0, speciesMap: new Map() });
    }
    const entry = map.get(loc);
    entry.totalPlants += 1;
    const speciesName = plant.species || plant.name || "Houseplant";
    entry.speciesMap.set(speciesName, (entry.speciesMap.get(speciesName) || 0) + 1);
  });

  return Array.from(map.values()).map((entry) => {
    let topSpecies = "Houseplant";
    let maxCount = 0;
    entry.speciesMap.forEach((count, sp) => {
      if (count > maxCount) {
        maxCount = count;
        topSpecies = sp;
      }
    });
    return {
      city: entry.city,
      totalPlants: entry.totalPlants,
      topSpecies
    };
  });
};

export const computeRoomStreakRetention = (plants = []) => {
  if (!plants.length) return [];
  const map = new Map();
  plants.forEach((plant) => {
    const room = plant.location || plant.room || "Living Room";
    if (!map.has(room)) {
      map.set(room, { roomLocation: room, total: 0, safeCount: 0, streakSum: 0 });
    }
    const entry = map.get(room);
    entry.total += 1;
    const status = calculateWateringStatus(plant.lastWatered, plant.frequency);
    if (status === "Safe") entry.safeCount += 1;
    entry.streakSum += Number(plant.currentStreak || 0);
  });

  return Array.from(map.values()).map((entry) => {
    const retention = entry.total ? Math.round((entry.safeCount / entry.total) * 100) : 0;
    const avgStreak = entry.total ? (entry.streakSum / entry.total).toFixed(1) : "0.0";
    return {
      roomLocation: entry.roomLocation,
      retentionRate: `${retention}%`,
      avgStreakDays: `${avgStreak} days`
    };
  });
};

export const computeRegionalClimateGuidance = (plants = []) => {
  if (!plants.length) return [];
  const map = new Map();
  plants.forEach((plant) => {
    const loc = plant.locationCity || plant.location || "Local Garden";
    if (!map.has(loc)) {
      map.set(loc, { region: loc, total: 0, overdue: 0, directSun: 0 });
    }
    const entry = map.get(loc);
    entry.total += 1;
    const status = calculateWateringStatus(plant.lastWatered, plant.frequency);
    if (status === "Overdue") entry.overdue += 1;
    if ((plant.sunlight || "").toLowerCase().includes("direct")) entry.directSun += 1;
  });

  return Array.from(map.values()).map((entry) => {
    const overduePercent = entry.total ? Math.round((entry.overdue / entry.total) * 100) : 0;
    const hasHighSun = entry.directSun > 0;
    let insight = "Stable humidity preserves soil moisture. Standard 7-day schedule optimal.";
    if (overduePercent > 30 || hasHighSun) {
      insight = "Higher ambient transpiration accelerates dry soil by 2.4x. Extra 150 mL recommended.";
    }
    return {
      region: entry.region,
      overdueIncreasePercent: overduePercent > 0 ? `+${overduePercent}% Overdue Spike` : "Optimal Soil Moisture",
      insight
    };
  });
};

export const calculateAnalytics = (plants, history) => {
  const statuses = plants.reduce((acc, plant) => {
    acc[calculateWateringStatus(plant.lastWatered, plant.frequency)] += 1;
    return acc;
  }, { Safe: 0, "Water Soon": 0, Overdue: 0 });
  const totalWaterings = history.filter((item) => item.type === "watering").length;
  const bestStreak = Math.max(0, ...plants.map((plant) => plant.bestStreak || 0));
  const currentActiveStreak = Math.max(0, ...plants.map((plant) => plant.currentStreak || 0));
  const consistencyValues = plants.map((plant) => calculateWateringConsistency(plant, history));
  const consistency = plants.length ? Math.round(consistencyValues.reduce((sum, value) => sum + value, 0) / plants.length) : 0;
  const topPlant = plants.map((plant) => ({ ...plant, consistency: calculateWateringConsistency(plant, history) })).sort((a, b) => b.consistency - a.consistency)[0];
  return { statuses, totalWaterings, bestStreak, currentActiveStreak, consistency, topPlant };
};
