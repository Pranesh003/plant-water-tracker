export const todayISO = () => {
  try {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60_000;
    return new Date(today.getTime() - offset).toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
};

export const parseSafeDate = (dateString) => {
  if (!dateString || dateString === "null" || dateString === "undefined") return null;
  const str = String(dateString).trim();
  if (!str) return null;
  const date = str.includes("T") ? new Date(str) : new Date(`${str}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

export const formatTimeAgo = (dateString) => {
  const date = parseSafeDate(dateString);
  if (!date) return "Recently";
  const diffHours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
};

export const isWateredToday = (lastWatered) => {
  if (!lastWatered) return false;
  return String(lastWatered).slice(0, 10) === todayISO();
};

export const addDays = (dateString, days) => {
  const date = parseSafeDate(dateString) || new Date();
  date.setDate(date.getDate() + Number(days || 0));
  if (Number.isNaN(date.getTime())) return todayISO();
  return date.toISOString().slice(0, 10);
};

export const daysBetween = (start, end = todayISO()) => {
  const startDate = parseSafeDate(start);
  const endDate = parseSafeDate(end) || new Date();
  if (!startDate || !endDate) return 0;
  return Math.floor((endDate.getTime() - startDate.getTime()) / 86400000);
};

export const calculateNextWateringDate = (lastWatered, frequency) => {
  if (!lastWatered) return null;
  const parsed = parseSafeDate(lastWatered);
  if (!parsed) return null;
  return addDays(lastWatered, frequency);
};

export const calculateReminderDate = (plant) => {
  if (!plant?.lastWatered || !plant?.frequency) return null;
  const nextWateringDate = calculateNextWateringDate(plant.lastWatered, plant.frequency);
  if (!nextWateringDate) return null;
  return addDays(nextWateringDate, -1);
};

export const calculateWateringStatus = (lastWatered, frequency) => {
  if (!lastWatered || !parseSafeDate(lastWatered)) return "Water Soon";
  const remaining = Number(frequency || 7) - daysBetween(lastWatered);
  if (remaining < 0) return "Overdue";
  if (remaining <= 1) return "Water Soon";
  return "Safe";
};

export const isPlantWaterable = (lastWatered, frequency) => {
  if (!lastWatered || !parseSafeDate(lastWatered)) return true;
  const status = calculateWateringStatus(lastWatered, frequency);
  return status === "Water Soon" || status === "Overdue";
};

export const statusMeta = {
  Safe: { label: "SAFE", className: "safe" },
  "Water Soon": { label: "WATER SOON", className: "soon" },
  Overdue: { label: "OVERDUE", className: "overdue" }
};

export const formatDate = (dateString) => {
  if (!dateString) return "Not yet";
  const date = parseSafeDate(dateString);
  if (!date) return "Not yet";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
};

export const generatePlantNotifications = (plants = [], history = []) => {
  if (!Array.isArray(plants)) return [];

  const list = [];

  plants.forEach((plant) => {
    if (!plant) return;

    const lastWatered = plant.lastWatered;
    const freq = Number(plant.frequency || 7);
    const remainingDays = lastWatered ? freq - daysBetween(lastWatered) : 0;
    const nextDate = calculateNextWateringDate(lastWatered, freq) || todayISO();

    // 1. Watered Confirmation (Post-water)
    if (isWateredToday(lastWatered)) {
      list.push({
        id: `${plant.id}-watered-today`,
        plantId: plant.id,
        title: "✅ Plant Watered",
        message: `${plant.name} was watered today. Current streak: ${plant.currentStreak || 1} day(s)!`,
        type: "watered",
        category: "Completed",
        pillIcon: "✅",
        timeAgo: "Today",
        priority: 4
      });
      return;
    }

    // 2. Overdue Plant Alert
    if (remainingDays < 0) {
      const overdueDays = Math.abs(remainingDays);
      list.push({
        id: `${plant.id}-overdue`,
        plantId: plant.id,
        title: "🚨 Overdue Plant Alert",
        message: `${plant.name} is ${overdueDays} day(s) overdue for watering! Please water now.`,
        type: "overdue",
        category: "Action Required",
        pillIcon: "🚨",
        timeAgo: `${overdueDays}d overdue`,
        priority: 1
      });
      return;
    }

    // 3. Today's Watering Reminder
    if (remainingDays === 0) {
      list.push({
        id: `${plant.id}-due-today`,
        plantId: plant.id,
        title: "💧 Water Needed Today",
        message: `${plant.name} is due for watering today! (${plant.recommendedWaterMl ? `${plant.recommendedWaterMl} mL recommended` : "give it a thorough soak"})`,
        type: "today",
        category: "Due Today",
        pillIcon: "💧",
        timeAgo: "Today",
        priority: 2
      });
      return;
    }

    // 4. Tomorrow's Before-Water Reminder
    if (remainingDays === 1) {
      list.push({
        id: `${plant.id}-due-tomorrow`,
        plantId: plant.id,
        title: "⏳ Tomorrow's Reminder",
        message: `${plant.name} will need watering tomorrow (${formatDate(nextDate)}).`,
        type: "tomorrow",
        category: "Tomorrow",
        pillIcon: "⏳",
        timeAgo: "Tomorrow",
        priority: 3
      });
      return;
    }

    // 5. Future Schedule Reminder (2-3 days ahead)
    if (remainingDays >= 2 && remainingDays <= 3) {
      list.push({
        id: `${plant.id}-future-schedule`,
        plantId: plant.id,
        title: "🗓️ Upcoming Schedule",
        message: `${plant.name} is scheduled for watering on ${formatDate(nextDate)}.`,
        type: "future",
        category: "Upcoming",
        pillIcon: "🗓️",
        timeAgo: `In ${remainingDays} days`,
        priority: 5
      });
    }
  });

  // 6. System Activity Notifications
  if (Array.isArray(history)) {
    history.slice(0, 5).forEach((item) => {
      if (item && item.type === "note") {
        list.push({
          id: `${item.id}-system-note`,
          plantId: item.plantId,
          title: "📝 Care Note Added",
          message: `${item.plantName || "Plant"}: "${item.text}"`,
          type: "system",
          category: "Activity",
          pillIcon: "📝",
          timeAgo: formatDate(item.date),
          priority: 6
        });
      }
    });
  }

  return list.sort((a, b) => a.priority - b.priority);
};
