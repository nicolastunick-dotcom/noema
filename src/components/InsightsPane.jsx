import { memo } from "react";
import GlassCard from "./GlassCard";

const InsightsPane = memo(function InsightsPane({ insights }) {
  const { forces, blocages, contradictions } = insights;
  const hasBlocages = Boolean(blocages.racine || blocages.entretien || blocages.visible);
  return (
    <div className="insights-pane">
      {/* --- CODEX CHANGE START --- */}
      <GlassCard className="ic mental-module insights-card" tone="violet">
        <div className="ic-head insights-card-head">
          <div className="ic-lbl"><div className="ic-dot"/>Puissance naturelle</div>
          <div className="ic-title">Forces détectées</div>
        </div>
        <div className="ic-items insights-card-items">
          {forces.length > 0
            ? forces.map((it,i) => <div className="ic-item" key={i}>{it}</div>)
            : <span className="empty">Émergent au fil de la conversation</span>}
        </div>
      </GlassCard>

      <GlassCard className="ic mental-module insights-card" tone="rose">
        <div className="ic-head insights-card-head">
          <div className="ic-lbl"><div className="ic-dot"/>Nœud actif</div>
          <div className="ic-title">Cartographie des blocages</div>
        </div>
        {hasBlocages ? (
          <div className="ic-items insights-card-items">
            {blocages.racine && (
              <div className="ic-item insights-detail-item">
                <span className="insights-tag insights-tag--root">Racine</span>
                <span>{blocages.racine}</span>
              </div>
            )}
            {blocages.entretien && (
              <div className="ic-item insights-detail-item">
                <span className="insights-tag insights-tag--support">Entretien</span>
                <span>{blocages.entretien}</span>
              </div>
            )}
            {blocages.visible && (
              <div className="ic-item insights-detail-item">
                <span className="insights-tag insights-tag--visible">Visible</span>
                <span>{blocages.visible}</span>
              </div>
            )}
          </div>
        ) : <span className="empty">Identifiés après l'exploration</span>}
      </GlassCard>

      <GlassCard className="ic mental-module insights-card" tone="sage">
        <div className="ic-head insights-card-head">
          <div className="ic-lbl"><div className="ic-dot"/>Tension interne</div>
          <div className="ic-title">Contradictions</div>
        </div>
        <div className="ic-items insights-card-items">
          {contradictions.length > 0
            ? contradictions.map((it,i) => <div className="ic-item" key={i}>{it}</div>)
            : <span className="empty">Détectées quand elles apparaissent</span>}
        </div>
      </GlassCard>
      {/* --- CODEX CHANGE END --- */}
    </div>
  );
});

export default InsightsPane;
