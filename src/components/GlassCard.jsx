// --- CODEX CHANGE START ---
// Codex modification - introduce a restrained reusable glass card wrapper so
// the mental-space panels can share one premium but readable surface system.
import { memo } from "react";

const GlassCard = memo(function GlassCard({
  as: Component = "section",
  className = "",
  tone = "neutral",
  children,
  ...props
}) {
  const classes = ["glass-card", `glass-card--${tone}`, className].filter(Boolean).join(" ");
  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
});

export default GlassCard;
// --- CODEX CHANGE END ---
