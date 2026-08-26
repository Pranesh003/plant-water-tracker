export const plantSuggestions = [
  { name: "Money Plant", species: "Epipremnum aureum", frequency: 7, sunlight: "Indirect Sunlight", icon: "🌿" },
  { name: "Snake Plant", species: "Dracaena trifasciata", frequency: 14, sunlight: "Low Light", icon: "🌱" },
  { name: "Aloe Vera", species: "Aloe barbadensis miller", frequency: 12, sunlight: "Direct Sunlight", icon: "🌵" },
  { name: "Peace Lily", species: "Spathiphyllum wallisii", frequency: 5, sunlight: "Indirect Sunlight", icon: "🪴" },
  { name: "Spider Plant", species: "Chlorophytum comosum", frequency: 6, sunlight: "Indirect Sunlight", icon: "🌾" },
  { name: "Rose", species: "Rosa rubiginosa", frequency: 3, sunlight: "Direct Sunlight", icon: "🌹" },
  { name: "Tulsi", species: "Ocimum tenuiflorum", frequency: 2, sunlight: "Direct Sunlight", icon: "🌿" },
  { name: "Areca Palm", species: "Dypsis lutescens", frequency: 6, sunlight: "Indirect Sunlight", icon: "🌴" },
  { name: "Jade Plant", species: "Crassula ovata", frequency: 15, sunlight: "Direct Sunlight", icon: "🪴" },
  { name: "Rubber Plant", species: "Ficus elastica", frequency: 8, sunlight: "Indirect Sunlight", icon: "🌳" },
  { name: "Jasmine", species: "Jasminum sambac", frequency: 4, sunlight: "Direct Sunlight", icon: "🌼" }
];

const daysAgo = (days) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

export const mockPlants = [
  ["plant-1", "Money Plant", "Epipremnum aureum", "Living Room", 7, 6, "Indirect Sunlight", 12, 21, "New vine is reaching toward the window.", "🌿"],
  ["plant-2", "Snake Plant", "Dracaena trifasciata", "Bedroom", 14, 10, "Low Light", 7, 15, "Leaves are upright and firm.", "🌱"],
  ["plant-3", "Aloe Vera", "Aloe barbadensis miller", "Balcony", 12, 13, "Direct Sunlight", 4, 11, "Soil is very dry after the sunny week.", "🌵"],
  ["plant-4", "Peace Lily", "Spathiphyllum wallisii", "Office", 5, 5, "Indirect Sunlight", 14, 18, "One flower opened this morning.", "🪴"],
  ["plant-5", "Spider Plant", "Chlorophytum comosum", "Kitchen", 6, 3, "Indirect Sunlight", 9, 13, "Small baby shoot spotted.", "🌾"],
  ["plant-6", "Rose", "Rosa rubiginosa", "Garden", 3, 4, "Direct Sunlight", 3, 8, "Pruned two dry leaves.", "🌹"],
  ["plant-7", "Tulsi", "Ocimum tenuiflorum", "Balcony", 2, 1, "Direct Sunlight", 30, 36, "Plant is growing well after trimming.", "🌿"],
  ["plant-8", "Areca Palm", "Dypsis lutescens", "Living Room", 6, 6, "Indirect Sunlight", 5, 10, "Mist leaves twice this week.", "🌴"],
  ["plant-9", "Jade Plant", "Crassula ovata", "Office", 15, 7, "Direct Sunlight", 6, 9, "Compact leaves look glossy.", "🪴"],
  ["plant-10", "Rubber Plant", "Ficus elastica", "Bedroom", 8, 2, "Indirect Sunlight", 11, 16, "Wiped dust from two large leaves.", "🌳"],
  ["plant-11", "Jasmine", "Jasminum sambac", "Garden", 4, 4, "Direct Sunlight", 8, 12, "New buds are forming.", "🌼"]
].map(([id, name, species, location, frequency, last, sunlight, currentStreak, bestStreak, note, icon], index) => ({
  id,
  userId: index % 3 === 1 ? "user002" : "user001",
  name,
  species,
  location,
  room: location,
  frequency,
  wateringFrequency: frequency,
  lastWatered: daysAgo(last),
  sunlight,
  currentStreak,
  bestStreak,
  icon,
  createdAt: daysAgo(30 + index),
  notes: [{ id: `${id}-note`, text: note, date: daysAgo(Math.min(last, 2)), time: "09:30" }]
}));

export const mockHistory = mockPlants.flatMap((plant, index) => [
  { id: `${plant.id}-w1`, plantId: plant.id, plantName: plant.name, type: "watering", date: plant.lastWatered, time: "08:30", streak: plant.currentStreak },
  { id: `${plant.id}-n1`, plantId: plant.id, plantName: plant.name, type: "note", date: plant.notes[0].date, time: plant.notes[0].time, text: plant.notes[0].text },
  { id: `${plant.id}-w2`, plantId: plant.id, plantName: plant.name, type: "watering", date: daysAgo(10 + index), time: "18:00", streak: Math.max(1, plant.currentStreak - 2) }
]);
