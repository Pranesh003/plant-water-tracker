export const calculateCurrentStreak = (plant, wasOnTime = true) => (wasOnTime ? Number(plant.currentStreak || 0) + 1 : 1);
export const calculateBestStreak = (plant, currentStreak) => Math.max(Number(plant.bestStreak || 0), currentStreak);
export const getMilestone = (streak = 0) => {
  if (streak >= 60) return "Plant Master";
  if (streak >= 30) return "Green Guardian";
  if (streak >= 14) return "Plant Keeper";
  if (streak >= 7) return "Plant Friend";
  if (streak >= 3) return "Good Start";
  return "Growing";
};
