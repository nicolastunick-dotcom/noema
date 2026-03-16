import { memo } from "react";
import "../../styles/v2-app.css";

const InsightsPaneV2 = memo(function InsightsPaneV2({ insights }) {
  const { forces = [], blocages = {}, contradictions = [] } = insights || {};
  const hasBlocages = Boolean(blocages.racine || blocages.entretien || blocages.visible);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      
      {/* Forces */}
      <div className="v2-glass-card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", color: "var(--accent-purple)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-purple)" }} /> Puissance naturelle
        </div>
        <h3 className="serif-font" style={{ fontSize: "1.5rem", color: "var(--color-text-primary)", marginBottom: "1rem" }}>Forces détectées</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {forces.length > 0
            ? forces.map((it, i) => (
                <div key={i} style={{ padding: "0.85rem 1rem", background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: "10px", color: "var(--color-text-secondary)", fontSize: "0.95rem", lineHeight: 1.5 }}>
                  {it}
                </div>
              ))
            : <div style={{ color: "var(--color-text-muted)", fontStyle: "italic", fontSize: "0.9rem" }}>Émergent au fil de la conversation</div>}
        </div>
      </div>

      {/* Blocages */}
      <div className="v2-glass-card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", color: "#ff6b6b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ff6b6b" }} /> Nœud actif
        </div>
        <h3 className="serif-font" style={{ fontSize: "1.5rem", color: "var(--color-text-primary)", marginBottom: "1rem" }}>Cartographie des blocages</h3>
        {hasBlocages ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {blocages.racine && (
              <div style={{ padding: "0.85rem 1rem", background: "rgba(255,107,107,0.05)", border: "1px solid rgba(255,107,107,0.1)", borderRadius: "10px", color: "var(--color-text-secondary)", fontSize: "0.95rem", lineHeight: 1.5 }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#ff6b6b", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>Racine</span>
                {blocages.racine}
              </div>
            )}
            {blocages.entretien && (
              <div style={{ padding: "0.85rem 1rem", background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: "10px", color: "var(--color-text-secondary)", fontSize: "0.95rem", lineHeight: 1.5 }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>Entretien</span>
                {blocages.entretien}
              </div>
            )}
            {blocages.visible && (
              <div style={{ padding: "0.85rem 1rem", background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: "10px", color: "var(--color-text-secondary)", fontSize: "0.95rem", lineHeight: 1.5 }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>Visible</span>
                {blocages.visible}
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: "var(--color-text-muted)", fontStyle: "italic", fontSize: "0.9rem" }}>Identifiés après l'exploration</div>
        )}
      </div>

      {/* Contradictions */}
      <div className="v2-glass-card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", color: "var(--accent-amber)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-amber)" }} /> Tension interne
        </div>
        <h3 className="serif-font" style={{ fontSize: "1.5rem", color: "var(--color-text-primary)", marginBottom: "1rem" }}>Contradictions</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {contradictions.length > 0
            ? contradictions.map((it, i) => (
                <div key={i} style={{ padding: "0.85rem 1rem", background: "rgba(255,179,71,0.05)", border: "1px solid rgba(255,179,71,0.1)", borderRadius: "10px", color: "var(--color-text-secondary)", fontSize: "0.95rem", lineHeight: 1.5 }}>
                  {it}
                </div>
              ))
            : <div style={{ color: "var(--color-text-muted)", fontStyle: "italic", fontSize: "0.9rem" }}>Détectées quand elles apparaissent</div>}
        </div>
      </div>
    </div>
  );
});

export default InsightsPaneV2;
