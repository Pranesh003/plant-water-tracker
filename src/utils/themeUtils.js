import { readStorage } from "./storageUtils.js";

const SETTINGS_KEY = "plantCareAdminSettings";

export const applyTheme = (themeName) => {
  const root = document.documentElement;
  let theme = themeName;
  
  if (!theme) {
    const saved = readStorage(SETTINGS_KEY, null);
    theme = saved?.theme || "Nature green";
  }

  if (theme === "System default") {
    theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "Dark botanical"
      : "Nature green";
  }

  if (theme === "High contrast green") {
    root.setAttribute("data-theme", "high-contrast");
  } else if (theme === "Dark botanical") {
    root.setAttribute("data-theme", "dark-botanical");
  } else {
    root.setAttribute("data-theme", "nature-green");
  }
};
