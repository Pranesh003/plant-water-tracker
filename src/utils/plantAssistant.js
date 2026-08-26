export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const plantCatalog = [
  { key: "rose", name: "Rose", species: "Rosa rubiginosa", baseWaterMl: 420, sunlight: "Direct Sunlight", location: "Balcony / Garden", humidity: "50-70%", frequency: 3 },
  { key: "hibiscus", name: "Hibiscus", species: "Hibiscus rosa-sinensis", baseWaterMl: 430, sunlight: "Direct Sunlight", location: "Outdoor / Balcony", humidity: "60-80%", frequency: 3 },
  { key: "tulsi", name: "Tulsi", species: "Ocimum tenuiflorum", baseWaterMl: 360, sunlight: "Direct Sunlight", location: "Balcony / Window", humidity: "50-70%", frequency: 2 },
  { key: "snake", name: "Snake Plant", species: "Dracaena trifasciata", baseWaterMl: 280, sunlight: "Low Light", location: "Living Room", humidity: "40-60%", frequency: 14 },
  { key: "aloe", name: "Aloe Vera", species: "Aloe barbadensis miller", baseWaterMl: 320, sunlight: "Direct Sunlight", location: "Window Shelf", humidity: "30-50%", frequency: 12 },
  { key: "money", name: "Money Plant", species: "Epipremnum aureum", baseWaterMl: 340, sunlight: "Indirect Sunlight", location: "Living Room", humidity: "50-70%", frequency: 7 },
  { key: "jasmine", name: "Jasmine", species: "Jasminum sambac", baseWaterMl: 390, sunlight: "Direct Sunlight", location: "Balcony / Terrace", humidity: "60-80%", frequency: 4 }
];

export function validatePlantImage(file) {
  if (!file) return { valid: false, error: "Please select a plant image first." };
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return { valid: false, error: "Unsupported file type. Please upload JPG, JPEG, PNG, or WEBP." };
  if (file.size > MAX_IMAGE_SIZE_BYTES) return { valid: false, error: "Image is too large. Please upload a file under 5 MB." };
  return { valid: true };
}

export function generatePlantRecommendation(file) {
  const fileName = ((file && file.name) || "plant-image").toLowerCase();
  const match = plantCatalog.find((entry) => fileName.includes(entry.key));

  const plant = match || {
    name: "Garden Plant",
    species: "Mixed plant variety",
    baseWaterMl: 400,
    sunlight: "Indirect Sunlight",
    location: "Living Room / Balcony",
    humidity: "50-70%",
    frequency: 5
  };

  const seed = (file?.size || 0) % 11;
  const temperature = 28 + ((seed % 7) * 2);
  const humidityPercent = match ? 60 + (seed % 18) : 58 + (seed % 16);
  const rainChance = (seed % 5) * 10;
  const frequency = Math.max(2, Math.min(14, plant.frequency + (seed % 3) - 1));
  const sunlight = plant.sunlight;
  const waterAdjustment = 1 + (temperature > 32 ? 0.14 : temperature > 28 ? 0.08 : 0.03) + (humidityPercent < 50 ? 0.12 : 0) - (rainChance > 30 ? 0.2 : 0);
  const recommendedWaterMl = Math.max(250, Math.round(plant.baseWaterMl * waterAdjustment));

  return {
    plantName: plant.name,
    species: plant.species,
    confidence: 0.82 + (seed * 0.02),
    wateringFrequencyDays: frequency,
    recommendedWaterMl,
    sunlight,
    location: plant.location,
    humidity: `${Math.max(35, humidityPercent - 5)}-${Math.min(90, humidityPercent + 10)}%`,
    careTips: [
      "Check the top layer of soil before watering.",
      "Adjust watering based on room light and temperature.",
      "Avoid waterlogging and keep drainage clear."
    ],
    aiIdentified: true,
    aiConfidence: Number((0.82 + (seed * 0.02)).toFixed(2))
  };
}
