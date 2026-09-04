import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import AdminSidebar from "./components/AdminSidebar.jsx";
import Notification from "./components/Notification.jsx";
import { api } from "./services/api.js";
import AddPlant from "./pages/AddPlant.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminManageUser from "./pages/AdminManageUser.jsx";
import AdminPlants from "./pages/AdminPlants.jsx";
import AdminProfile from "./pages/AdminProfile.jsx";
import AdminSettings from "./pages/AdminSettings.jsx";
import AdminUserDetails from "./pages/AdminUserDetails.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import Analytics from "./pages/Analytics.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import EditPlant from "./pages/EditPlant.jsx";
import History from "./pages/History.jsx";
import MyPlants from "./pages/MyPlants.jsx";
import PlantDetails from "./pages/PlantDetails.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import AuthLoadingScreen from "./pages/AuthLoadingScreen.jsx";
import Tutorial from "./pages/Tutorial.jsx";
import Settings from "./pages/Settings.jsx";
import Reminders from "./pages/Reminders.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";
import { applyTheme } from "./utils/themeUtils.js";
import { readStorage, writeStorage } from "./utils/storageUtils.js";
import { todayISO } from "./utils/wateringUtils.js";

const PlantCareContext = createContext(null);
export const usePlantCare = () => useContext(PlantCareContext);

function ProtectedRoute({ children }) {
  const location = useLocation();
  if (!api.isLoggedIn()) return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  if (api.getRole() !== "admin" && !api.isTutorialComplete() && location.pathname !== "/tutorial") return <Navigate to="/tutorial" replace />;
  if (api.getRole() === "admin" && location.pathname === "/tutorial") return <Navigate to="/admin" replace />;
  return children;
}

function AdminRoute({ children }) {
  if (!api.isLoggedIn()) return <Navigate to="/signin" replace />;
  if (api.getRole() !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">{children}</main>
    </div>
  );
}

function AdminShell({ children }) {
  return (
    <div className="app-shell">
      <AdminSidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

export default function App() {
  const [plants, setPlants] = useState([]);
  const [history, setHistory] = useState([]);
  const [user, setUser] = useState(() => readStorage(api.keys.user, null));
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const refresh = async () => {
    try {
      setError("");
      const [plantData, historyData, userData] = await Promise.all([
        api.getPlants().catch(() => readStorage(api.keys.plants, [])),
        api.getHistory().catch(() => readStorage(api.keys.history, [])),
        api.getUser().catch(() => readStorage(api.keys.user, null))
      ]);
      setPlants(plantData || []);
      setHistory(historyData || []);
      if (userData) setUser(userData);
    } catch {
      // Suppress error banner when fallback cached data is available
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyTheme();
    if (api.isLoggedIn()) {
      refresh();
    } else {
      setLoading(false);
    }
  }, []);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const value = useMemo(() => ({
    plants,
    history,
    user,
    loading,
    error,
    refresh,
    setUser,
    notify,
    waterPlant: async (id) => {
      try {
        const plant = await api.waterPlant(id);
        
        // 1. Update plant in state immediately
        setPlants((current) => current.map((item) => item.id === id ? plant : item));

        // 2. Optimistically prepend new watering log to history state immediately
        const todayStr = todayISO();
        const newHistoryLog = {
          id: `h_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          plantId: id,
          plantName: plant.name || "Plant",
          type: "watering",
          date: todayStr,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: new Date().toISOString(),
          streak: plant.currentStreak || 1
        };

        setHistory((current) => [newHistoryLog, ...current]);

        // 3. Persist to LocalStorage cache immediately
        const cachedHistory = readStorage(api.keys.history, []);
        writeStorage(api.keys.history, [newHistoryLog, ...cachedHistory]);

        // 4. Background sync
        refresh().catch(() => {});

        notify("Plant watered successfully.");
        return plant;
      } catch {
        notify("Unable to update watering status.");
        throw new Error("Unable to update watering status.");
      }
    },
    addNote: async (id, text) => {
      try {
        await api.addNote(id, text);
        const targetPlant = plants.find((p) => p.id === id);
        const todayStr = todayISO();
        const newNoteLog = {
          id: `h_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          plantId: id,
          plantName: targetPlant?.name || "Plant",
          type: "note",
          text: text,
          date: todayStr,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setHistory((current) => [newNoteLog, ...current]);
        const cachedHistory = readStorage(api.keys.history, []);
        writeStorage(api.keys.history, [newNoteLog, ...cachedHistory]);

        refresh().catch(() => {});
        notify("Note added to your plant timeline.");
      } catch {
        notify("Something went wrong. Please try again.");
      }
    },
    deletePlant: async (id) => {
      await api.deletePlant(id);
      await refresh();
      notify("Plant removed from your collection.");
    }
  }), [plants, history, user, loading, error]);

  return (
    <PlantCareContext.Provider value={value}>
      <Notification message={toast} />
      <Routes>
        <Route path="/" element={<Navigate to={api.isLoggedIn() ? (api.getRole() === "admin" ? "/admin" : "/dashboard") : "/signin"} replace />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/auth-loading" element={<AuthLoadingScreen />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/tutorial" element={<ProtectedRoute><Tutorial /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><AppShell><Dashboard /></AppShell></ProtectedRoute>} />
        <Route path="/my-plants" element={<ProtectedRoute><AppShell><MyPlants /></AppShell></ProtectedRoute>} />
        <Route path="/plant/:id" element={<ProtectedRoute><AppShell><PlantDetails /></AppShell></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><AppShell><History /></AppShell></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><AppShell><Analytics /></AppShell></ProtectedRoute>} />
        <Route path="/add-plant" element={<ProtectedRoute><AppShell><AddPlant /></AppShell></ProtectedRoute>} />
        <Route path="/edit-plant/:id" element={<ProtectedRoute><AppShell><EditPlant /></AppShell></ProtectedRoute>} />
        <Route path="/reminders" element={<ProtectedRoute><AppShell><Reminders /></AppShell></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><AppShell><Settings /></AppShell></ProtectedRoute>} />
        <Route path="/change-password" element={<ProtectedRoute><AppShell><ChangePassword /></AppShell></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminShell><AdminDashboard /></AdminShell></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminShell><AdminUsers /></AdminShell></AdminRoute>} />
        <Route path="/admin/users/:id" element={<AdminRoute><AdminShell><AdminUserDetails /></AdminShell></AdminRoute>} />
        <Route path="/admin/users/:id/manage" element={<AdminRoute><AdminShell><AdminManageUser /></AdminShell></AdminRoute>} />
        <Route path="/admin/plants" element={<AdminRoute><AdminShell><AdminPlants /></AdminShell></AdminRoute>} />
        <Route path="/admin/profile" element={<AdminRoute><AdminShell><AdminProfile /></AdminShell></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><AdminShell><AdminSettings /></AdminShell></AdminRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </PlantCareContext.Provider>
  );
}
