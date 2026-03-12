import { memo } from "react";
import { THEMES, MODE_LABELS } from "../constants/themes";

const StateBadge = memo(function StateBadge({ state, mode }) {
  return (
    <div className="state-badge">
      <div className="state-dot"/>
      <span>{THEMES[state].label}</span>
      {mode && mode !== "accueil" && (
        <span style={{opacity:.55, fontSize:".65rem"}}>· {MODE_LABELS[mode] || mode}</span>
      )}
    </div>
  );
});

export default StateBadge;
