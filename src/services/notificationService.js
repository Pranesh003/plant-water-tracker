// Notification Service for Web Push and Daily Plant Reminders

import { calculateWateringStatus, isPlantWaterable } from "../utils/wateringUtils.js";

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  return false;
};

export const showNativeNotification = (title, body, icon = "/favicon.ico") => {
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, {
        body,
        icon,
        badge: icon,
        vibrate: [200, 100, 200]
      });
    } catch {
      // Ignore if native notification construction fails
    }
  }
};

export const generateDailyReminders = (plants = [], userName = "Gardener") => {
  if (!plants || plants.length === 0) return null;

  const duePlants = plants.filter((plant) => {
    const status = calculateWateringStatus(plant.lastWatered, plant.frequency, plant.locationCity || plant.location);
    return status === "Water Soon" || status === "Overdue" || isPlantWaterable(plant.lastWatered, plant.frequency);
  });

  if (duePlants.length === 0) return null;

  const plantNames = duePlants.map((p) => p.name).join(", ");
  const count = duePlants.length;

  return {
    id: `reminder-${new Date().toISOString().slice(0, 10)}`,
    title: `🔔 Good morning ${userName}!`,
    message: `${count} of your ${count === 1 ? "plant" : "plants"} (${plantNames}) ${count === 1 ? "needs" : "need"} watering today.`,
    count,
    duePlants,
    timestamp: new Date().toISOString()
  };
};

export const triggerDailyReminderCheck = async (plants = [], userName = "Gardener") => {
  const reminder = generateDailyReminders(plants, userName);
  if (reminder) {
    const hasPermission = await requestNotificationPermission();
    if (hasPermission) {
      showNativeNotification(reminder.title, reminder.message);
    }
  }
  return reminder;
};
