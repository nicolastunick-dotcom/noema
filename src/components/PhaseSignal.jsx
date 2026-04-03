export default function PhaseSignal({ phase, variant = "full" }) {
  if (!phase) return null;

  const compact = variant === "compact";

  return (
    <div
      style={{
        display: "flex",
        alignItems: compact ? "center" : "flex-start",
        justifyContent: "space-between",
        gap: compact ? 10 : 16,
        padding: compact ? "10px 12px" : "16px 18px",
        borderRadius: compact ? 14 : 18,
        background: compact ? phase.accentSoft : "rgba(30,31,37,0.72)",
        border: `1px solid ${phase.border}`,
        boxShadow: compact ? "none" : `0 16px 36px rgba(0,0,0,0.18), 0 0 32px ${phase.glow}`,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: "0.62rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: phase.accent,
            fontWeight: 700,
          }}
        >
          {phase.navLabel}
        </p>
        <p
          style={{
            margin: compact ? "4px 0 0" : "8px 0 0",
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: compact ? "0.95rem" : "1.15rem",
            lineHeight: 1.3,
            color: "#e2e2e9",
          }}
        >
          {compact ? phase.paceLabel : phase.summary}
        </p>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: "0.58rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(197,197,216,0.72)",
            fontWeight: 700,
          }}
        >
          {phase.stepLabel}
        </p>
        <p
          style={{
            margin: "6px 0 0",
            fontSize: compact ? "0.72rem" : "0.78rem",
            color: phase.accent,
            fontWeight: 600,
          }}
        >
          {compact ? `${phase.phaseProgress}% dans la phase` : phase.horizon}
        </p>
      </div>
    </div>
  );
}
