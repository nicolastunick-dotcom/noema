/* eslint-disable */
import { useEffect } from "react";

const COLORS = {
  background: "#0D0F14",
  surface: "#111318",
  onBackground: "#e2e2e9",
  onSurfaceVariant: "#c5c5d8",
  primary: "#bdc2ff",
  primaryContainer: "#7886ff",
  onPrimaryContainer: "#00118c",
};

export default function Success({ onNav }) {
  useEffect(() => {
    document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: COLORS.background,
        color: COLORS.onBackground,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(120,134,255,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 480 }}>
        {/* Checkmark icon */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "rgba(189,194,255,0.1)",
            border: "1px solid rgba(189,194,255,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 40px",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: "2.5rem",
              color: COLORS.primary,
              fontVariationSettings: "'FILL' 1, 'wght' 300",
            }}
          >
            check_circle
          </span>
        </div>

        {/* Logo */}
        <p
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: "1.1rem",
            color: "rgba(189,194,255,0.6)",
            marginBottom: 24,
          }}
        >
          Noema
        </p>

        {/* Headline */}
        <h1
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: "clamp(2rem, 5vw, 3rem)",
            lineHeight: 1.15,
            color: COLORS.onBackground,
            marginBottom: 20,
          }}
        >
          Ton exploration commence maintenant.
        </h1>

        <p
          style={{
            fontSize: "1rem",
            color: COLORS.onSurfaceVariant,
            lineHeight: 1.7,
            marginBottom: 48,
          }}
        >
          Ton abonnement est activé. Bienvenue dans Noema — un espace conçu pour te connaître vraiment.
        </p>

        <button
          onClick={() => onNav?.("/app/chat")}
          style={{
            background: "linear-gradient(135deg, #bdc2ff 0%, #7886ff 100%)",
            color: COLORS.onPrimaryContainer,
            border: "none",
            borderRadius: 9999,
            padding: "16px 40px",
            fontSize: "1rem",
            fontWeight: 700,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            cursor: "pointer",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(120,134,255,0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Accéder à Noema
        </button>
      </div>
    </div>
  );
}
