import { memo } from "react";
import GlassCard from "./GlassCard";

const ITEMS = [
  { icon:"❤️", label:"Ce que tu aimes",           k:"aime" },
  { icon:"💡", label:"Ce en quoi tu excelles",    k:"excelle" },
  { icon:"🌍", label:"Ce dont le monde a besoin", k:"monde" },
  { icon:"💰", label:"Ce pour quoi on te paie",   k:"paie" },
];

const IkigaiPane = memo(function IkigaiPane({
  ikigai,
  onGen,
  onOpenPage,
  sessionIndex = 0,
  ikigaiRevealed = false,
  isPageReady = false,
}) {
  // --- CODEX CHANGE START ---
  // Codex modification - keep the mission hidden until the guided journey has
  // reached session 8, while leaving the other Ikigai signals visible.
  const showMission = Boolean(ikigai.mission) && (ikigaiRevealed || sessionIndex >= 8);
  // --- CODEX CHANGE END ---
  return (
    <div className="ik-shell">
      {/* --- CODEX CHANGE START --- */}
      <GlassCard className="ik-intro" tone="violet">
        <div className="ik-intro-eyebrow">Ikigai en convergence</div>
        <div className="ik-intro-copy">
          Une lecture progressive de ce que tu aimes, de ce que tu portes naturellement et de la direction qui commence à se dessiner.
        </div>
      </GlassCard>
      <div className="ikg">
        {ITEMS.map(({icon,label,k}) => (
          <GlassCard className="ikc" key={k} tone="neutral">
            <div className="iki">{icon}</div>
            <div className="ikl">{label}</div>
            <div className="ikv">{ikigai[k] || <span className="ike">À découvrir</span>}</div>
          </GlassCard>
        ))}
      </div>
      {showMission ? (
        <GlassCard className="ik-mission" tone="violet">
          <div className="ik-mission-label">Mission de vie</div>
          <div className="ik-mission-copy">{ikigai.mission}</div>
        </GlassCard>
      ) : (
        <GlassCard className="ik-mission ik-mission--locked" tone="neutral">
          <div className="ik-mission-label">Mission de vie</div>
          <div className="ik-mission-copy">
            🔒 La mission de vie sera révélée autour de la session 8,
            lorsque la compréhension de ton parcours sera suffisamment solide.
          </div>
        </GlassCard>
      )}
      <GlassCard className="ik-actions" tone="neutral">
        <button className="btn-ikg" onClick={onGen}>✨ Générer mon Ikigai maintenant</button>
        <button
          className="btn-ikg btn-ikg-secondary"
          onClick={onOpenPage}
          disabled={!isPageReady}
          type="button"
        >
          Ouvrir la page de mon Ikigai
        </button>
        {!isPageReady && <div className="ik-note">Page dédiée bientôt disponible.</div>}
      </GlassCard>
      {/* --- CODEX CHANGE END --- */}
    </div>
  );
});

export default IkigaiPane;
