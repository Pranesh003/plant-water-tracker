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
