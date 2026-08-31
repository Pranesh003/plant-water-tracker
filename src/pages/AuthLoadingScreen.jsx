import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePlantCare } from "../App.jsx";
import { api } from "../services/api.js";

export default function AuthLoadingScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refresh } = usePlantCare();

  const searchParams = new URLSearchParams(location.search);
  const type = location.state?.type || searchParams.get("type") || "signin";
  const targetRole = location.state?.role || searchParams.get("role") || api.getRole();

  const isSignUp = type === "signup";

  const signupSteps = [
    "Creating your PlantDoc account...",
    "Setting up your garden workspace...",
    "Preparing your interactive onboarding tutorial..."
  ];

  const signinSteps = [
    "Signing in to PlantDoc...",
    "Syncing your plant care schedule & reminders...",
    "Welcome back to your green space!"
  ];

  const steps = isSignUp ? signupSteps : signinSteps;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    // Refresh background context data
    refresh().catch(() => {});

    // Step sequence timer
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 600);

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 18;
      });
    }, 280);

    // Completion redirect timer
    const redirectTimer = setTimeout(() => {
      if (isSignUp) {
        navigate("/tutorial", { replace: true });
      } else {
        if (targetRole === "admin") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }
    }, 2100);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
      clearTimeout(redirectTimer);
    };
  }, [isSignUp, navigate, refresh, steps.length, targetRole]);

  return (
    <div className="auth-loading-container">
      <div className="auth-loading-card">
        <div className="auth-logo-pulse-wrap">
          <img src="/app_logo.png" alt="PlantDoc Logo" className="auth-loading-logo" />
          <div className="pulse-ring ring-1" />
          <div className="pulse-ring ring-2" />
        </div>

        <h2 className="auth-loading-title">
          {isSignUp ? "Creating Your Account" : "Logging You In"}
        </h2>

        <p className="auth-loading-step-text">
          {steps[currentStepIndex]}
        </p>

        <div className="auth-loading-bar-track">
          <div className="auth-loading-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="auth-loading-footer-badge">
          <img src="/sprout_icon.png" alt="" style={{ width: 18, height: 18 }} />
          <span>PlantDoc Secure Authentication</span>
        </div>
      </div>
    </div>
  );
}
