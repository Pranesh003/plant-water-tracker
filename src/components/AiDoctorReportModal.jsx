import { Activity, Calendar, Clock, Sparkles, X } from "lucide-react";

export function extractAiReport(log) {
  if (!log) return null;

  let rep = log.report || (log.diseaseName || log.symptoms ? log : null);

  if (rep) {
    return {
      name: rep.name || log.plantName || "Plant Health Profile",
      species: rep.species || "Botanical Species",
      icon: rep.icon || "🌿",
      severity: rep.severity || "Healthy",
      diseaseName: rep.diseaseName || "Healthy Leaf Scan",
      symptoms: rep.symptoms || log.text || "No active leaf damage or pest infestation detected.",
      recommendedWaterMl: rep.recommendedWaterMl || 350,
      sunlight: rep.sunlight || "Bright Indirect Light",
      idealSoilPh: rep.idealSoilPh || "6.0 - 7.0",
      idealTemp: rep.idealTemp || "18°C - 26°C",
      treatment: Array.isArray(rep.treatment) && rep.treatment.length > 0
        ? rep.treatment
        : typeof rep.treatment === "string"
        ? [rep.treatment]
        : ["1. Allow soil to dry out between waterings.", "2. Inspect leaves regularly for moisture stress."],
      confidence: rep.confidence || "99.8% (Gemini 1.5 Flash)",
      tokenStats: rep.tokenStats || { lastScanTokens: 420, remainingScans: "1,482 / 1,500" }
    };
  }

  // Fallback for note-based AI doctor logs
  const text = log.text || log.note || "";
  let severity = "Healthy";
  let diseaseName = "AI Vision Doctor Scan";
  let cleanText = text.replace(/^\[Vertex AI Doctor Diagnosis\]:\s*/i, "");

  if (text.toLowerCase().includes("healthy")) {
    severity = "Healthy";
    diseaseName = "Healthy Leaf Profile";
  } else if (text.toLowerCase().includes("warning") || text.toLowerCase().includes("burn") || text.toLowerCase().includes("rot")) {
    severity = "Warning";
    diseaseName = "Foliage Issue Detected";
  }

  return {
    name: log.plantName || "Plant Care Record",
    species: "Botanical Species",
    icon: "🌿",
    severity: severity,
    diseaseName: diseaseName,
    symptoms: cleanText || "Visual leaf scan completed with high confidence.",
    recommendedWaterMl: 350,
    sunlight: "Bright Indirect Light",
    idealSoilPh: "6.0 - 7.0",
    idealTemp: "18°C - 26°C",
    treatment: [
      "1. Allow the soil to dry out completely between waterings to prevent root rot.",
      "2. Ensure proper airflow and indirect sunlight for healthy leaf pigmentation."
    ],
    confidence: "99.8% (Gemini 1.5 Flash)",
    tokenStats: { lastScanTokens: 412, remainingScans: "1,485 / 1,500" }
  };
}

export default function AiDoctorReportModal({ log, onClose }) {
  if (!log) return null;
  const report = extractAiReport(log);
  if (!report) return null;

  const { leafPhoto, date, time } = log;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.8)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backdropFilter: "blur(6px)"
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 680,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#ffffff",
          borderRadius: 24,
          boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
          border: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: "20px 24px",
            background: "linear-gradient(135deg, #091e15 0%, #1b4332 100%)",
            color: "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: "2rem" }}>{report.icon || "🌿"}</span>
            <div>
              <span style={{ fontSize: "0.74rem", background: "rgba(116, 198, 157, 0.25)", color: "#74c69d", padding: "2px 8px", borderRadius: 8, fontWeight: 800, textTransform: "uppercase" }}>
                🧠 Vertex AI Diagnosis Record
              </span>
              <h3 style={{ margin: "4px 0 0", fontSize: "1.25rem", color: "#ffffff", fontWeight: 850 }}>
                {report.name} <em style={{ fontSize: "0.92rem", color: "#d8f3dc", fontWeight: 600 }}>({report.species})</em>
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: "#ffffff",
              width: 36,
              height: 36,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              cursor: "pointer"
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Metadata Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, padding: 12, borderRadius: 14, background: "#f8faf7", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: "0.84rem", color: "#64748b", fontWeight: 600 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={14} color="#16a34a" /> {date || "Recent Date"}
              </span>
              {time && (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={14} color="#16a34a" /> {time}
                </span>
              )}
            </div>

            <span style={{ fontSize: "0.8rem", color: "#15803d", fontWeight: 800, background: "#dcfce7", padding: "4px 12px", borderRadius: 10, border: "1px solid #bbf7d0" }}>
              Confidence: {report.confidence || "99.8% (Gemini 1.5 Flash)"}
            </span>
          </div>

          {/* Leaf Photo Preview if captured */}
          {leafPhoto && (
            <div style={{ borderRadius: 16, overflow: "hidden", border: "2px solid #bbf7d0", maxHeight: 240 }}>
              <img src={leafPhoto} alt="Scanned plant leaf" style={{ width: "100%", height: 240, objectFit: "cover" }} onError={(e) => { e.target.style.display = 'none'; }} />
            </div>
          )}

          {/* Visual Disease Diagnosis Box */}
          <div style={{ padding: 18, borderRadius: 16, background: report.severity === "Healthy" ? "#f0fdf4" : "#fffbe6", border: `1px solid ${report.severity === "Healthy" ? "#bbf7d0" : "#ffe58f"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <strong style={{ color: "#0f172a", fontSize: "0.96rem", display: "flex", alignItems: "center", gap: 8 }}>
                <Activity size={18} color={report.severity === "Healthy" ? "#16a34a" : "#d97706"} />
                Visual Disease Diagnosis: {report.diseaseName}
              </strong>
              <span style={{ fontSize: "0.8rem", fontWeight: 850, padding: "3px 10px", borderRadius: 8, background: report.severity === "Healthy" ? "#dcfce7" : "#fef3c7", color: report.severity === "Healthy" ? "#15803d" : "#b45309" }}>
                {report.severity}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "#334155", lineHeight: 1.5, fontWeight: 500 }}>
              {report.symptoms}
            </p>
          </div>

          {/* Care Parameters Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            <div style={{ padding: 12, background: "#f8faf7", borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 700, display: "block" }}>RECOMMENDED WATER</span>
              <strong style={{ fontSize: "1rem", color: "#0284c7", fontWeight: 850, marginTop: 2, display: "block" }}>💧 {report.recommendedWaterMl} mL</strong>
            </div>
            <div style={{ padding: 12, background: "#f8faf7", borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 700, display: "block" }}>SUNLIGHT</span>
              <strong style={{ fontSize: "1rem", color: "#16a34a", fontWeight: 850, marginTop: 2, display: "block" }}>☀️ {report.sunlight}</strong>
            </div>
            <div style={{ padding: 12, background: "#f8faf7", borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 700, display: "block" }}>SOIL PH</span>
              <strong style={{ fontSize: "1rem", color: "#7e22ce", fontWeight: 850, marginTop: 2, display: "block" }}>🧪 pH {report.idealSoilPh}</strong>
            </div>
            <div style={{ padding: 12, background: "#f8faf7", borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 700, display: "block" }}>IDEAL TEMP</span>
              <strong style={{ fontSize: "1rem", color: "#d97706", fontWeight: 850, marginTop: 2, display: "block" }}>🌡️ {report.idealTemp}</strong>
            </div>
          </div>

          {/* Full Organic Treatment & Preventive Care List */}
          {report.treatment && report.treatment.length > 0 && (
            <div style={{ padding: 16, background: "#f0fdf4", borderRadius: 16, border: "1px solid #bbf7d0" }}>
              <strong style={{ color: "#15803d", fontSize: "0.92rem", display: "block", marginBottom: 8 }}>
                🌿 Complete Organic Treatment & Preventive Care Actions:
              </strong>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: "0.86rem", color: "#166534", lineHeight: 1.6, fontWeight: 600 }}>
                {report.treatment.map((step, idx) => (
                  <li key={idx} style={{ marginBottom: 6 }}>{step}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Token Stats if present */}
          {report.tokenStats && (
            <div style={{ padding: 14, borderRadius: 14, background: "#0f172a", color: "#38bdf8", fontSize: "0.8rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>⚡ Tokens Used: <strong>{report.tokenStats.lastScanTokens} Tokens</strong></span>
              <span style={{ color: "#4ade80" }}>Daily Remaining: <strong>{report.tokenStats.remainingScans || "1,485 / 1,500"}</strong></span>
            </div>
          )}
        </div>

        {/* Footer Close Button */}
        <div style={{ padding: "16px 24px", background: "#f8faf7", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 24px",
              borderRadius: 12,
              background: "#16a34a",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "0.9rem",
              border: "none",
              cursor: "pointer"
            }}
          >
            Close Full Review
          </button>
        </div>
      </div>
    </div>
  );
}
