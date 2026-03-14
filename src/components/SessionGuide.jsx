// --- CODEX CHANGE START ---
// Codex modification - add a lightweight journey guide that can be opened from
// the chat shell without altering the core conversation layout.
import { memo } from "react";

const JOURNEY_STEPS = [
  "Session 1 — État actuel",
  "Session 2 — Histoire personnelle",
  "Session 3 — Schémas répétitifs",
  "Session 4 — Valeurs profondes",
  "Session 5 — Forces naturelles",
  "Session 6 — Blocages racine",
  "Session 7 — Repositionnement intérieur",
  "Session 8 — Révélation de l'Ikigai",
  "Session 9 — Clarification de direction",
  "Session 10 — Plan d'action",
];

const SessionGuide = memo(function SessionGuide() {
  return (
    <div className="sguide">
      <div className="sguide-card">
        <div className="sguide-eyebrow">Parcours Noema</div>
        <h3 className="sguide-title">Une progression pensée pour révéler l'essentiel au bon moment.</h3>
        <p className="sguide-copy">
          Le parcours Noema est un processus progressif.
          Chaque session révèle progressivement des éléments de ta personnalité, de tes forces et de ton Ikigai.
        </p>
      </div>

      <div className="sguide-list" role="list" aria-label="Étapes du parcours Noema">
        {JOURNEY_STEPS.map((label, index) => (
          <div className="sguide-step" key={label} role="listitem">
            <div className="sguide-index">{index + 1}</div>
            <div className="sguide-label">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default SessionGuide;
// --- CODEX CHANGE END ---
