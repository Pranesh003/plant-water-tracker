import { Check, Globe } from "lucide-react";
import { LANGUAGES, useTranslation } from "../utils/i18n.js";

export default function LanguageSelector({ showHelp = true, compact = false }) {
  const { language, setLanguage, t } = useTranslation();

  return (
    <div className="language-selector-wrapper" style={{ width: "100%" }}>
      {showHelp && (
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.92rem", fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
            <Globe size={18} color="#16a34a" />
            {t("language_select_label")}
          </label>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
            {t("language_help")}
          </p>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: compact ? "repeat(auto-fit, minmax(140px, 1fr))" : "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 12
        }}
      >
        {LANGUAGES.map((lang) => {
          const isSelected = language === lang.code;

          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: compact ? "10px 14px" : "12px 16px",
                borderRadius: 14,
                border: isSelected ? "2px solid #16a34a" : "1px solid #cbd5e1",
                background: isSelected ? "#f0fdf4" : "#ffffff",
                color: isSelected ? "#15803d" : "#334155",
                fontWeight: isSelected ? 800 : 600,
                cursor: "pointer",
                transition: "all 0.18s ease",
                boxShadow: isSelected ? "0 4px 12px rgba(22, 163, 74, 0.15)" : "none",
                textAlign: "left"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>{lang.flag}</span>
                <div>
                  <span style={{ display: "block", fontSize: "0.92rem", fontWeight: 800, color: isSelected ? "#15803d" : "#0f172a" }}>
                    {lang.nativeName}
                  </span>
                  <span style={{ display: "block", fontSize: "0.75rem", color: isSelected ? "#16a34a" : "#64748b" }}>
                    {lang.name}
                  </span>
                </div>
              </div>

              {isSelected && (
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#16a34a", color: "#ffffff", display: "grid", placeItems: "center" }}>
                  <Check size={14} strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
