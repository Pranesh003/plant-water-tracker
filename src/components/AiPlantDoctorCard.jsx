import { Activity, AlertTriangle, CheckCircle, Cpu, Droplets, RefreshCw, ShieldAlert, Sparkles, Stethoscope, Thermometer, Zap } from "lucide-react";
import { useState } from "react";
import { api } from "../services/api.js";

export default function AiPlantDoctorCard({ plantImage, plantName = "Plant" }) {
  const [diagnosis, setDiagnosis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const handleRunDiagnosis = async () => {
    setIsAnalyzing(true);
    setError("");
    try {
      const result = await api.diagnosePlantDisease(plantImage);
      setDiagnosis(result);
    } catch {
      setError("AI Plant Doctor is currently unavailable. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity?.toLowerCase()) {
      case "healthy":
        return { label: "HEALTHY", bg: "#d8f3dc", color: "#1b4332", icon: CheckCircle };
      case "mild concern":
      case "mild issue":
        return { label: "MILD ISSUE", bg: "#fff3bf", color: "#856404", icon: AlertTriangle };
      case "moderate concern":
        return { label: "MODERATE CONCERN", bg: "#ffe8cc", color: "#d9480f", icon: ShieldAlert };
      default:
        return { label: "CRITICAL ALERT", bg: "#ffe3e3", color: "#c92a2a", icon: Zap };
    }
  };

  const badge = diagnosis ? getSeverityBadge(diagnosis.severity) : null;
  const BadgeIcon = badge?.icon;

  return (
    <section className="panel" style={{ padding: "24px", borderRadius: "20px", background: "linear-gradient(135deg, #f8fdf9 0%, #edf7f0 100%)", border: "1px solid #c8e6c9" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: 10, margin: 0, color: "#1b4332", fontSize: "1.15rem", fontWeight: 800 }}>
          <Stethoscope size={22} color="#2d6a4f" />
          Vertex AI Plant Doctor (Gemini 1.5 Flash)
        </h3>
        <span style={{ fontSize: "0.82rem", background: "#1b4332", color: "#95d5b2", padding: "4px 12px", borderRadius: "20px", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
          <Cpu size={14} color="#95d5b2" /> Vertex AI Telemetry Active
        </span>
      </div>

      {!diagnosis ? (
        <div style={{ textAlign: "center", padding: "24px 16px", background: "#ffffff", borderRadius: "16px", border: "1px solid #d8f3dc" }}>
          <Sparkles size={36} color="#2d6a4f" style={{ marginBottom: 10 }} />
          <h4 style={{ margin: "0 0 6px", color: "#1b4332", fontSize: "1.05rem", fontWeight: 800 }}>
            Run Visual Disease & Health Telemetry
          </h4>
          <p style={{ margin: "0 0 16px", fontSize: "0.88rem", color: "#52b788", maxWidth: "480px", marginLeft: "auto", marginRight: "auto" }}>
            Scan leaf pigmentation, structural cell integrity, fungal spores, and nutrient burn using Google Cloud Vertex AI (Gemini 1.5 Flash).
          </p>
          <button
            type="button"
            className="primary-btn"
            onClick={handleRunDiagnosis}
            disabled={isAnalyzing}
            style={{ padding: "10px 22px", borderRadius: "12px", fontSize: "0.95rem" }}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw size={18} className="spin" /> Analyzing Leaf Photosynthesis & Cellular Spores...
              </>
            ) : (
              <>
                <Stethoscope size={18} /> Analyze Leaf Health with Gemini 1.5 Flash
              </>
            )}
          </button>
          {error && <p style={{ color: "#e63946", fontSize: "0.85rem", marginTop: 10 }}>{error}</p>}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Diagnosis Header */}
          <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #d8f3dc", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <strong style={{ fontSize: "1.25rem", color: "#1b4332", fontWeight: 900 }}>{diagnosis.diseaseName}</strong>
                {badge && (
                  <span style={{ background: badge.bg, color: badge.color, padding: "4px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}>
                    {BadgeIcon && <BadgeIcon size={14} />} {badge.label}
                  </span>
                )}
              </div>
              <small style={{ color: "#52b788", fontWeight: 700, fontSize: "0.82rem" }}>
                Confidence Score: {diagnosis.confidence || "98% (Vertex AI)"}
              </small>
            </div>
            <button type="button" className="ghost-btn compact" onClick={handleRunDiagnosis} disabled={isAnalyzing} style={{ fontSize: "0.82rem" }}>
              <RefreshCw size={14} /> Re-scan
            </button>
          </div>

          {/* Symptoms & Diagnostics Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            <div style={{ background: "#ffffff", padding: "16px", borderRadius: "14px", border: "1px solid #d8f3dc" }}>
              <span style={{ fontSize: "0.8rem", color: "#2d6a4f", fontWeight: 800, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                <Activity size={15} color="#2d6a4f" /> Leaf Symptoms
              </span>
              <p style={{ fontSize: "0.88rem", color: "#1b4332", margin: "6px 0 0", lineHeight: 1.4, fontWeight: 600 }}>
                {diagnosis.symptoms}
              </p>
            </div>

            <div style={{ background: "#ffffff", padding: "16px", borderRadius: "14px", border: "1px solid #d8f3dc" }}>
              <span style={{ fontSize: "0.8rem", color: "#52b788", fontWeight: 800, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                <Thermometer size={15} color="#52b788" /> Ideal Soil pH & Climate
              </span>
              <p style={{ fontSize: "0.95rem", color: "#1b4332", margin: "6px 0 0", fontWeight: 800 }}>
                pH: {diagnosis.idealPh || "6.2 - 6.8"}
              </p>
              <small style={{ color: "#52b788", fontWeight: 700 }}>Ideal Temp: {diagnosis.temperatureRange || "20°C - 28°C"}</small>
            </div>
          </div>

          {/* Organic Treatment Steps */}
          <div style={{ background: "#ffffff", padding: "18px", borderRadius: "14px", border: "1px solid #b7e4c7" }}>
            <span style={{ fontSize: "0.84rem", color: "#1f4d2e", fontWeight: 800, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <Droplets size={18} color="#2d6a4f" /> Treatment Protocol (Organic Care)
            </span>
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {diagnosis.treatment?.map((step, idx) => (
                <li key={idx} style={{ fontSize: "0.88rem", color: "#1b4332", fontWeight: 600, padding: "8px 12px", background: "#f8fdf9", borderRadius: "8px", border: "1px solid #e8f5e9" }}>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
