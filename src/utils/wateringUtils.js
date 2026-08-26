export const todayISO = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60_000;
  return new Date(today.getTime() - offset).toISOString().slice(0, 10);
};
export const isWateredToday = (lastWatered) => lastWatered === todayISO();
export const addDays = (dateString, days) => {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
};
export const daysBetween = (start, end = todayISO()) => Math.floor((new Date(`${end}T12:00:00`) - new Date(`${start}T12:00:00`)) / 86400000);
export const calculateNextWateringDate = (lastWatered, frequency) => lastWatered ? addDays(lastWatered, frequency) : null;
export const calculateReminderDate = (plant) => {
  if (!plant?.lastWatered || !plant?.frequency) return null;
  const nextWateringDate = calculateNextWateringDate(plant.lastWatered, plant.frequency);
  return addDays(nextWateringDate, -1);
};
export const calculateWateringStatus = (lastWatered, frequency) => {
  if (!lastWatered) return "Water Soon";
  const remaining = Number(frequency) - daysBetween(lastWatered);
  if (remaining < 0) return "Overdue";
  if (remaining <= 1) return "Water Soon";
  return "Safe";
};
export const statusMeta = {
  Safe: { label: "SAFE", className: "safe" },
  "Water Soon": { label: "WATER SOON", className: "soon" },
  Overdue: { label: "OVERDUE", className: "overdue" }
};
export const formatDate = (dateString) => dateString ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${dateString}T12:00:00`)) : "Not yet";
export const generatePlantNotifications = (plants = []) => plants
  .map((plant) => {
    // A completed watering should suppress every watering reminder for the
    // remainder of the local calendar day.
    if (isWateredToday(plant.lastWatered)) return null;
    const reminderDate = calculateReminderDate(plant);
    if (!reminderDate) return null;
    const reminderDay = daysBetween(reminderDate, todayISO());
    if (reminderDay !== 0) return null;
    return {
      id: `${plant.id}-reminder`,
      plantId: plant.id,
      title: "Watering Reminder",
      message: `${plant.name || "Your plant"} needs watering tomorrow.`,
      type: "watering",
      scheduledFor: reminderDate,
      createdAt: todayISO(),
      read: false
    };
  })
  .filter(Boolean);
