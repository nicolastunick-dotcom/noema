// --- CODEX CHANGE START ---
// Codex modification - add a lightweight journey guide that can be opened from
// the chat shell without altering the core conversation layout.
import { memo } from "react";

const JOURNEY_STEPS = [
  {
    session: "Session 1",
    label: "Comprendre ton état actuel",
  },
  {
    session: "Session 3",
    label: "Identifier tes schémas répétitifs",
  },
  {
    session: "Session 6",
    label: "Découvrir ton blocage racine",
  },
  {
    session: "Session 8",
    label: "Révélation de ton Ikigai",
  },
];

const SessionGuide = memo(function SessionGuide() {
  return (
    <div className="sguide">
      <div className="sguide-card">
        {/* --- CODEX CHANGE START --- */}
        {/* Codex modification - simplify the journey guide into key milestones
            while preserving the existing modal structure and visual hierarchy. */}
        <div className="sguide-eyebrow">Un parcours progressif</div>
        <h3 className="sguide-title">Chaque étape éclaire un niveau plus profond de toi-même.</h3>
        <p className="sguide-copy">
          Noema avance par révélations successives, en partant de ton présent pour aller jusqu'à ce qui donne une direction plus juste à ta vie.
        </p>
        {/* --- CODEX CHANGE END --- */}
      </div>

      <div className="sguide-list" role="list" aria-label="Étapes du parcours Noema">
        {JOURNEY_STEPS.map(({ session, label }, index) => (
          <div className="sguide-step" key={session} role="listitem">
            <div className="sguide-index">{index + 1}</div>
            <div>
              <div className="sguide-eyebrow" style={{marginBottom:4}}>{session}</div>
              <div className="sguide-label">{label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default SessionGuide;
// --- CODEX CHANGE END ---
