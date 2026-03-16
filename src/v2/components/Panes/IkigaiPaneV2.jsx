import { memo } from "react";
import "../../styles/v2-app.css";

const ITEMS = [
  { icon:"❤️", label:"Ce que tu aimes",           k:"aime" },
  { icon:"💡", label:"Ce en quoi tu excelles",    k:"excelle" },
  { icon:"🌍", label:"Ce dont le monde a besoin", k:"monde" },
  { icon:"💰", label:"Ce pour quoi on te paie",   k:"paie" },
];

const IkigaiPaneV2 = memo(function IkigaiPaneV2({
  ikigai,
  onGen,
}) {
  const showMission = Boolean(ikigai?.mission);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      
      {/* Intro */}
      <div className="v2-glass-card" style={{ padding: "1.5rem" }}>
        <div style={{ fontSize: "0.75rem", color: "var(--accent-blue)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>Ikigai en convergence</div>
        <div style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
          Une lecture progressive de ce que tu aimes, de ce que tu portes naturellement et de la direction qui commence à se dessiner.
        </div>
      </div>

      {/* Ikigai Points */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        {ITEMS.map(({ icon, label, k }) => (
          <div key={k} className="v2-glass-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>{icon}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: 500 }}>{label}</div>
            <div style={{ fontSize: "0.95rem", color: "var(--color-text-primary)", fontWeight: 500, lineHeight: 1.4 }}>
              {ikigai?.[k] || <span style={{ color: "var(--color-text-muted)", fontStyle: "italic", fontWeight: 400 }}>À découvrir</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Mission */}
      {showMission ? (
        <div className="v2-glass-card" style={{ padding: "1.5rem", background: "linear-gradient(135deg, rgba(91,108,255,0.1) 0%, rgba(138,124,255,0.1) 100%)", borderColor: "rgba(138,124,255,0.2)" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--accent-purple)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Mission de vie</div>
          <div className="serif-font" style={{ fontSize: "1.4rem", color: "var(--color-text-primary)", lineHeight: 1.5 }}>{ikigai.mission}</div>
        </div>
      ) : (
        <div className="v2-glass-card" style={{ padding: "1.5rem" }}>
           <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Mission de vie</div>
           <div style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
             🔒 La mission de vie sera révélée lorsque la compréhension de ton parcours sera suffisamment solide.
           </div>
        </div>
      )}

      {/* Actions */}
      <div className="v2-glass-card" style={{ padding: "1.5rem", textAlign: "center" }}>
        <button 
          onClick={onGen}
          style={{ width: "100%", background: "var(--color-text-primary)", color: "var(--color-bg-base)", border: "none", padding: "14px", borderRadius: "12px", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)", transition: "opacity 0.2s" }}
        >
          ✨ Générer mon Ikigai
        </button>
      </div>

    </div>
  );
});

export default IkigaiPaneV2;
