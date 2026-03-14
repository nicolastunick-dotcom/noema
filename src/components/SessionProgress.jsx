// --- CODEX CHANGE START ---
// Codex modification - add a UI-only panel that visualizes the current session
// and estimated sub-session progress from the metadata already returned by Noema.
import { memo, useState } from "react";
import GlassCard from "./GlassCard";
import {
  SESSION_SUB_STEPS,
  formatSessionStage,
  getSessionNumber,
  getSessionTitle,
  getSubSessionIndex,
} from "../utils/sessionProgress";

const SessionProgress = memo(function SessionProgress({
  sessionIndex = 0,
  sessionStage = "",
  messagesToday = 0,
  messagesRemaining = 0,
  subSessionSummary = "",
}) {
  const [expanded, setExpanded] = useState(true);
  const currentSession = getSessionNumber(sessionIndex);
  const currentSubSession = getSubSessionIndex(messagesToday);
  const subSteps = SESSION_SUB_STEPS[currentSession];
  const remainingText = messagesRemaining > 0
    ? `Encore environ ${messagesRemaining} messages avant une pause naturelle.`
    : "Pause naturelle proche.";

  return (
    <GlassCard className="session-progress mental-module" tone="sage">
      <div className="session-progress-head">
        <div className="session-progress-eyebrow">Parcours en cours</div>
        <div className="session-progress-title">{getSessionTitle(currentSession)}</div>
        <div className="session-progress-meta">
          <span>{currentSubSession} / 7 sous-sessions en cours</span>
          <span>Session {currentSession} / 10</span>
        </div>
      </div>

      <div className="session-progress-badges">
        <span className="session-progress-badge">{formatSessionStage(sessionStage)}</span>
        <span className="session-progress-badge subtle">{remainingText}</span>
      </div>

      {subSessionSummary && (
        <div className="session-progress-summary">
          <div className="session-progress-summary-label">Résumé de la sous-session</div>
          <p>{subSessionSummary}</p>
        </div>
      )}

      <button
        type="button"
        className="session-progress-toggle"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
      >
        <span>{expanded ? "▲" : "▼"} {expanded ? "Masquer les sous-sessions" : "Voir les sous-sessions"}</span>
        <span>{currentSubSession} / 7</span>
      </button>

      {expanded && (
        <div className="session-progress-list" role="list" aria-label="Progression des sous-sessions">
          {subSteps.map((label, index) => {
            const itemIndex = index + 1;
            const state = itemIndex < currentSubSession ? "completed" : itemIndex === currentSubSession ? "current" : "upcoming";
            const marker = state === "completed" ? "✔" : state === "current" ? "●" : "○";
            const suffix = state === "completed" ? "complétée" : state === "current" ? "en cours" : "à venir";

            return (
              <div className={`session-progress-item ${state}`} key={`${currentSession}-${label}`} role="listitem">
                <span className="session-progress-marker" aria-hidden="true">{marker}</span>
                <span className="session-progress-label">Sous-session {itemIndex} — {label}</span>
                <span className="session-progress-state">{suffix}</span>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
});

export default SessionProgress;
// --- CODEX CHANGE END ---
