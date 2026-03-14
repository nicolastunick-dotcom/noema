import { memo } from "react";
import GlassCard from "./GlassCard";

const InsightsPane = memo(function InsightsPane({ insights }) {
  const { forces, blocages, contradictions } = insights;
  const hasBlocages = blocages.racine || blocages.entretien || blocages.visible;
  return (
    <>
      {/* --- CODEX CHANGE START --- */}
      <GlassCard className="ic mental-module" tone="violet">
        <div className="ic-head">
          <div className="ic-lbl"><div className="ic-dot"/>Puissance naturelle</div>
          <div className="ic-title">Forces détectées</div>
        </div>
        <div className="ic-items">
          {forces.length > 0
            ? forces.map((it,i) => <div className="ic-item" key={i}>{it}</div>)
            : <span className="empty">Émergent au fil de la conversation</span>}
        </div>
      </GlassCard>

      <GlassCard className="ic mental-module" tone="rose">
        <div className="ic-head">
          <div className="ic-lbl"><div className="ic-dot"/>Nœud actif</div>
          <div className="ic-title">Cartographie des blocages</div>
        </div>
        {hasBlocages ? (
          <div className="ic-items">
            {blocages.racine    && <div className="ic-item"><span style={{fontSize:".6rem",fontWeight:700,textTransform:"uppercase",color:"#F59E0B",marginRight:6}}>Racine</span>{blocages.racine}</div>}
            {blocages.entretien && <div className="ic-item"><span style={{fontSize:".6rem",fontWeight:700,textTransform:"uppercase",color:"#8A7CFF",marginRight:6}}>Entretien</span>{blocages.entretien}</div>}
            {blocages.visible   && <div className="ic-item"><span style={{fontSize:".6rem",fontWeight:700,textTransform:"uppercase",color:"var(--text3)",marginRight:6}}>Visible</span>{blocages.visible}</div>}
          </div>
        ) : <span className="empty">Identifiés après l'exploration</span>}
      </GlassCard>

      <GlassCard className="ic mental-module" tone="sage">
        <div className="ic-head">
          <div className="ic-lbl"><div className="ic-dot"/>Tension interne</div>
          <div className="ic-title">Contradictions</div>
        </div>
        <div className="ic-items">
          {contradictions.length > 0
            ? contradictions.map((it,i) => <div className="ic-item" key={i}>{it}</div>)
            : <span className="empty">Détectées quand elles apparaissent</span>}
        </div>
      </GlassCard>
      {/* --- CODEX CHANGE END --- */}
    </>
  );
});

export default InsightsPane;
