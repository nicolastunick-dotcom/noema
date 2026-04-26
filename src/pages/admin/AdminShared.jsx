import { T } from "../../design-system/tokens";
import { A, fmt } from "./adminConstants";

export function Icon({ name, fill = false, size = "1.1rem", color = A, style = {} }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{
        fontSize: size,
        color,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
        lineHeight: 1,
        flexShrink: 0,
        ...style,
      }}
    >
      {name}
    </span>
  );
}

export function Pill({ label, color = A }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: T.radius.full,
        background: `${color}16`,
        border: `1px solid ${color}33`,
        fontSize: "0.65rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color,
      }}
    >
      {label}
    </span>
  );
}

export function StatCard({ label, value, icon, color = A, sub, loading }) {
  return (
    <div
      style={{
        padding: "24px 28px",
        borderRadius: T.radius.xl,
        background: "rgba(26,27,33,0.7)",
        border: "1px solid rgba(189,194,255,0.08)",
        backdropFilter: "blur(16px)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <Icon name={icon} fill size="1.4rem" color={`${color}70`} />
      </div>
      <p
        style={{
          margin: 0,
          fontSize: "0.62rem",
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          color: T.color.textMuted,
          fontWeight: 700,
        }}
      >
        {label}
      </p>
      {loading ? (
        <div
          style={{
            height: 44,
            width: 90,
            borderRadius: 8,
            background: "rgba(255,255,255,0.05)",
            animation: "pulse 1.4s ease-in-out infinite",
          }}
        />
      ) : (
        <p
          style={{
            margin: 0,
            fontFamily: T.font.serif,
            fontStyle: "italic",
            fontSize: "2.5rem",
            lineHeight: 1,
            color,
            letterSpacing: "-0.02em",
          }}
        >
          {fmt(value)}
        </p>
      )}
      {sub && <p style={{ margin: 0, fontSize: "0.72rem", color: T.color.textMuted }}>{sub}</p>}
    </div>
  );
}

export function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2
        style={{
          margin: 0,
          fontFamily: T.font.serif,
          fontStyle: "italic",
          fontSize: "1.6rem",
          color: T.color.text,
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h2>
      {sub && <p style={{ margin: "6px 0 0", fontSize: "0.85rem", color: T.color.textSub }}>{sub}</p>}
    </div>
  );
}
