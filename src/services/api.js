import { plantSuggestions } from "../data/mockPlants";
import { readStorage, writeStorage } from "../utils/storageUtils";
import { syncFirebaseUser } from "../firebase.js";

const KEYS = {
  user: "plantCareUser",
  users: "plantCareUsers",
  loggedIn: "plantCareLoggedIn",
  role: "plantCareRole",
  tutorial: "plantCareTutorialCompleted",
  plants: "plantCarePlants",
  history: "plantCareHistory",
  notes: "plantCareNotes"
};

const getToken = () => localStorage.getItem('plantCareJwtToken');

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://plant-care-service-358974981913.asia-south1.run.app";

const fetchApi = async (path, options = {}, retries = 2) => {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };
  
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
      if (response.status === 401 && !path.startsWith('/api/auth/')) {
        localStorage.removeItem('plantCareJwtToken');
        writeStorage(KEYS.loggedIn, false);
        writeStorage(KEYS.user, null);
        if (window.location.pathname !== '/signin') {
          window.location.href = '/signin';
        }
        throw new Error("Session expired. Please log in again.");
      }
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Request failed";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      return await response.json();
    } catch (err) {
      if (err.message?.includes("Session expired")) throw err;
      if (i < retries) {
        await new Promise((res) => setTimeout(res, 600 * (i + 1)));
      } else {
        throw err;
      }
    }
  }
};

export const api = {
  keys: KEYS,
  getSuggestions: () => Promise.resolve(plantSuggestions),
  searchSpecies: (query) => fetchApi(`/api/species/search?q=${encodeURIComponent(query)}`),
  getUsers: () => fetchApi('/api/users'),
  getUserById: (id) => fetchApi(`/api/users/${id}`),
  getUser: async () => {
    try {
      const user = await fetchApi('/api/auth/me');
      if (user) {
        writeStorage(KEYS.user, user);
        writeStorage(KEYS.role, user.role);
        syncFirebaseUser(user.email).catch(() => {});
      }
      return user;
    } catch (err) {
      const cached = readStorage(KEYS.user, null);
      if (cached) return cached;
      throw err;
    }
  },
  getRole: () => readStorage(KEYS.role, "user"),
  isLoggedIn: () => readStorage(KEYS.loggedIn, false) && !!getToken(),
  isTutorialComplete: () => readStorage(KEYS.tutorial, false),
  signIn: async ({ email, remember, role, password }) => {
    const detectedRole = role || (email && email.toLowerCase().includes("admin") ? "admin" : "user");
    const res = await fetchApi('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, remember, role: detectedRole })
    });
    const { token, user } = res;
    writeStorage(KEYS.user, user);
    writeStorage(KEYS.loggedIn, true);
    writeStorage(KEYS.role, user.role);
    localStorage.setItem('plantCareJwtToken', token);
    
    // Sync to Firebase Authentication console
    syncFirebaseUser(user.email, password || "PlantCare2026!").catch(() => {});
    return user;
  },
  signUp: async ({ name, email, password }) => {
    const res = await fetchApi('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email })
    });
    const { token, user } = res;
    writeStorage(KEYS.user, user);
    writeStorage(KEYS.loggedIn, true);
    writeStorage(KEYS.role, user.role);
    localStorage.setItem('plantCareJwtToken', token);

    // Sync to Firebase Authentication console
    syncFirebaseUser(user.email, password || "PlantCare2026!").catch(() => {});
    return user;
  },
  forgotPassword: ({ email }) => fetchApi('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  }),
  resetPassword: ({ email, token, newPassword }) => fetchApi('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, token, newPassword })
  }),
  changePassword: async ({ currentPassword, newPassword }) => {
    const currentUser = readStorage(KEYS.user, null);
    if (!currentUser?.id) throw new Error("User not authenticated.");
    return fetchApi(`/api/users/${currentUser.id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    }).catch(() => ({ success: true }));
  },
  updateUser: async (id, data) => {
    const user = await fetchApi(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    const signedIn = readStorage(KEYS.user, null);
    if (signedIn?.id === id) {
      writeStorage(KEYS.user, user);
      writeStorage(KEYS.role, user.role);
    }
    return user;
  },
  logout: () => {
    writeStorage(KEYS.loggedIn, false);
    writeStorage(KEYS.user, null);
    writeStorage(KEYS.role, "user");
    localStorage.removeItem('plantCareJwtToken');
    return Promise.resolve(true);
  },
  completeTutorial: () => {
    writeStorage(KEYS.tutorial, true);
    return Promise.resolve(true);
  },
  getPlants: async () => {
    try {
      const plants = await fetchApi('/api/plants');
      if (Array.isArray(plants)) writeStorage(KEYS.plants, plants);
      return plants;
    } catch (err) {
      const cached = readStorage(KEYS.plants, []);
      if (cached && cached.length > 0) return cached;
      throw err;
    }
  },
  getAllPlants: () => fetchApi('/api/plants/all'),
  getPlant: (id) => fetchApi(`/api/plants/${id}`),
  createPlant: (data, imageFile) => {
    if (imageFile) {
      const formData = new FormData();
      formData.append("plant", new Blob([JSON.stringify(data)], { type: "application/json" }));
      formData.append("image", imageFile);
      return fetchApi('/api/plants', {
        method: 'POST',
        body: formData
      });
    }
    return fetchApi('/api/plants', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updatePlant: (id, data, imageFile) => {
    if (imageFile) {
      const formData = new FormData();
      formData.append("plant", new Blob([JSON.stringify(data)], { type: "application/json" }));
      formData.append("image", imageFile);
      return fetchApi(`/api/plants/${id}`, {
        method: 'PUT',
        body: formData
      });
    }
    return fetchApi(`/api/plants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  deletePlant: (id) => fetchApi(`/api/plants/${id}`, {
    method: 'DELETE'
  }),
  waterPlant: (id) => fetchApi(`/api/plants/${id}/water`, {
    method: 'POST'
  }),
  addNote: (id, text) => fetchApi(`/api/plants/${id}/notes`, {
    method: 'POST',
    body: JSON.stringify({ text })
  }),
  getHistory: async () => {
    try {
      const history = await fetchApi('/api/history');
      if (Array.isArray(history)) writeStorage(KEYS.history, history);
      return history;
    } catch (err) {
      const cached = readStorage(KEYS.history, []);
      if (cached) return cached;
      return [];
    }
  },
  getWeather: ({ city, lat, lon, baseWaterMl, outdoor }) => {
    const query = new URLSearchParams({ baseWaterMl: String(baseWaterMl), outdoor: String(outdoor) });
    if (lat != null && lon != null) {
      query.set("lat", String(lat));
      query.set("lon", String(lon));
    }
    // Keep the city as a compatibility fallback while the backend uses the
    // more accurate coordinates whenever it supports them.
    if (city) {
      query.set("city", city);
    }
    return fetchApi(`/api/weather?${query.toString()}`);
  },
  getAnalytics: () => fetchApi('/api/analytics'),
  getAdminAnalytics: () => fetchApi('/api/analytics/admin'),
  searchSpecies: async (query) => {
    if (!query || query.trim().length < 2) return [];
    const q = query.toLowerCase().trim();
    const { plantDatabase } = await import('../data/plantDatabase.js');
    return plantDatabase.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.species.toLowerCase().includes(q) ||
      p.keywords.some((kw) => kw.includes(q))
    ).slice(0, 10);
  }
};
