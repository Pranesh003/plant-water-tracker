import { Bell, CheckCircle, Droplets, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePlantCare } from "../App.jsx";
import { generateDailyReminders, requestNotificationPermission, showNativeNotification } from "../services/notificationService.js";

export default function NotificationCenter() {
  const { plants, waterPlant, user, notify } = usePlantCare();
  const [open, setOpen] = useState(false);
  const [isWateringAll, setIsWateringAll] = useState(false);
  const dropdownRef = useRef(null);

  const userName = user?.name ? user.name.split(" ")[0] : "Gardener";
  const reminder = generateDailyReminders(plants, userName);
  const badgeCount = reminder?.count || 0;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEnablePush = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      notify("🔔 Push notifications enabled! Daily 8:00 AM reminders active.");
      showNativeNotification(`🔔 Good morning ${userName}!`, "Automated daily plant watering reminders are now active.");
    } else {
      notify("Browser notification permissions disabled.");
    }
  };

  const handleWaterAll = async () => {
    if (!reminder?.duePlants?.length) return;
    setIsWateringAll(true);
    try {
      for (const plant of reminder.duePlants) {
        await waterPlant(plant.id);
      }
      notify(`💧 Successfully watered all ${reminder.duePlants.length} plants!`);
      showNativeNotification("🎉 All Plants Watered!", `Great job ${userName}! All due plants are happy and healthy.`);
      setOpen(false);
    } catch {
      notify("Error watering plants. Please try again.");
    } finally {
      setIsWateringAll(false);
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
      {/* Bell Trigger Icon Button */}
      <button
        type="button"
        className="ghost-btn"
        onClick={() => setOpen(!open)}
        title="Automated Daily Watering Notifications"
        style={{
          position: "relative",
          padding: "8px 12px",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: open ? "rgba(45, 106, 79, 0.12)" : "transparent"
        }}
      >
        <Bell size={20} color="#2d6a4f" />
        {badgeCount > 0 && (
          <span
            style={{
              background: "#e63946",
              color: "#ffffff",
              fontSize: "0.72rem",
              fontWeight: 800,
              padding: "2px 7px",
              borderRadius: "10px",
              lineHeight: 1
            }}
          >
            {badgeCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: "350px",
            maxWidth: "90vw",
            background: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.15)",
            border: "1px solid #d8f3dc",
            zIndex: 1000,
            overflow: "hidden",
            animation: "fadeIn 0.2s ease-out"
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={18} color="#95d5b2" />
              <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700 }}>Daily Watering Reminders</h4>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", color: "#ffffff", cursor: "pointer", padding: 2 }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: "16px" }}>
            {reminder ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div
                  style={{
                    background: "#f0f7f2",
                    padding: "14px",
                    borderRadius: "12px",
                    border: "1px solid #c8e6c9"
                  }}
                >
                  <strong style={{ display: "block", color: "#1b4332", fontSize: "0.92rem", marginBottom: 4 }}>
                    {reminder.title}
                  </strong>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#2d6a4f", lineHeight: 1.4 }}>
                    {reminder.message}
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {reminder.duePlants.map((plant) => (
                    <div
                      key={plant.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        background: "#fafafa",
                        borderRadius: "10px",
                        border: "1px solid #eeeeee"
                      }}
                    >
                      <span style={{ fontWeight: 700, color: "#1b4332", fontSize: "0.88rem" }}>
                        🌱 {plant.name}
                      </span>
                      <small style={{ color: "#e63946", fontWeight: 700 }}>Needs Water</small>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={handleWaterAll}
                  disabled={isWateringAll}
                  style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
                >
                  <Droplets size={16} /> {isWateringAll ? "Watering..." : `Water All (${reminder.duePlants.length})`}
                </button>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "16px 8px" }}>
                <CheckCircle size={32} color="#52b788" style={{ marginBottom: 8 }} />
                <h5 style={{ margin: "0 0 4px", color: "#1b4332", fontSize: "0.95rem" }}>All Plants Are Watered!</h5>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "#52b788" }}>
                  No plants are due for watering right now. Great job keeping your garden healthy!
                </p>
              </div>
            )}
          </div>

          <div
            style={{
              padding: "10px 16px",
              background: "#f8f9fa",
              borderTop: "1px solid #eeeeee",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <small style={{ color: "#666", fontSize: "0.75rem" }}>⏰ 8:00 AM Daily Cron Active</small>
            <button
              type="button"
              onClick={handleEnablePush}
              style={{
                background: "none",
                border: "none",
                color: "#2d6a4f",
                fontWeight: 700,
                fontSize: "0.75rem",
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              Enable Push Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
