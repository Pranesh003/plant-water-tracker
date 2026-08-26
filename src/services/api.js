import { plantSuggestions } from "../data/mockPlants";
import { readStorage, writeStorage } from "../utils/storageUtils";

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

const fetchApi = async (path, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };
  const response = await fetch(path, { ...options, headers });
  if (response.status === 401) {
    // Only an unauthenticated response means the token is no longer valid.
    // A 403 can be an authorization error for one request and must not log the
    // user out after they have successfully added a plant.
    localStorage.removeItem('plantCareJwtToken');
    writeStorage(KEYS.loggedIn, false);
    writeStorage(KEYS.user, null);
    window.location.href = '/signin';
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
  return response.json();
};

export const api = {
  keys: KEYS,
  getSuggestions: () => Promise.resolve(plantSuggestions),
  searchSpecies: (query) => fetchApi(`/api/species/search?q=${encodeURIComponent(query)}`),
  getUsers: () => fetchApi('/api/users'),
  getUserById: (id) => fetchApi(`/api/users/${id}`),
  getUser: () => fetchApi('/api/auth/me'),
  isLoggedIn: () => readStorage(KEYS.loggedIn, false) && !!getToken(),
  getRole: () => readStorage(KEYS.role, "user"),
  isTutorialComplete: () => readStorage(KEYS.tutorial, false),
  signIn: async ({ email, remember, role }) => {
    const res = await fetchApi('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, remember, role })
    });
    const { token, user } = res;
    writeStorage(KEYS.user, user);
    writeStorage(KEYS.loggedIn, true);
    writeStorage(KEYS.role, user.role);
    localStorage.setItem('plantCareJwtToken', token);
    return user;
  },
  signUp: async ({ name, email }) => {
    const res = await fetchApi('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email })
    });
    const { token, user } = res;
    writeStorage(KEYS.user, user);
    writeStorage(KEYS.loggedIn, true);
    writeStorage(KEYS.role, user.role);
    localStorage.setItem('plantCareJwtToken', token);
    return user;
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
  getPlants: () => fetchApi('/api/plants'),
  getAllPlants: () => fetchApi('/api/plants/all'),
  getPlant: (id) => fetchApi(`/api/plants/${id}`),
  createPlant: (data) => fetchApi('/api/plants', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updatePlant: (id, data) => fetchApi(`/api/plants/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
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
  getHistory: () => fetchApi('/api/history'),
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
  getAdminAnalytics: () => fetchApi('/api/analytics/admin')
};
