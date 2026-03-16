import { memo } from "react";
import { motion } from "framer-motion";

const NoemaLogo = memo(function NoemaLogo({ size = 48, className = "" }) {
  const circleSize = size;
  const strokeWidth = 1.5;
  const beamWidth = 2;

  return (
    <div className={`noema-logo-container ${className}`} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
      {/* Symbole : Lentille et Réfraction */}
      <svg
        width={circleSize}
        height={circleSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id="glassBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.5)" />
          </linearGradient>
          <radialGradient id="glassFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.02)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.15)" />
          </radialGradient>
        </defs>

        {/* Cercle : La Lentille */}
        <circle
          cx="50"
          cy="50"
          r={50 - strokeWidth}
          fill="url(#glassFill)"
          stroke="url(#glassBorder)"
          strokeWidth={strokeWidth}
          style={{ backdropFilter: "blur(4px)" }}
        />

        {/* Faisceau blanc entrant (gauche vers centre) */}
        <motion.line
          x1="-20"
          y1="50"
          x2="50"
          y2="50"
          stroke="rgba(255, 255, 255, 0.9)"
          strokeWidth={beamWidth}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.5))" }}
        />

        {/* Réfraction 1 : Violet (Réflexion) */}
        <motion.line
          x1="50"
          y1="50"
          x2="100"
          y2="25"
          stroke="#9b59b6"
          strokeWidth={beamWidth}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.8 }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
          style={{ filter: "drop-shadow(0 0 6px rgba(155, 89, 182, 0.6))" }}
        />

        {/* Réfraction 2 : Orange (Force) */}
        <motion.line
          x1="50"
          y1="50"
          x2="110"
          y2="50"
          stroke="#e67e22"
          strokeWidth={beamWidth}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.8 }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.6 }}
          style={{ filter: "drop-shadow(0 0 6px rgba(230, 126, 34, 0.6))" }}
        />

        {/* Réfraction 3 : Rouge/Or (Blocage/Ambition) */}
        <motion.line
          x1="50"
          y1="50"
          x2="100"
          y2="75"
          stroke="#e74c3c"
          strokeWidth={beamWidth}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.8 }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.7 }}
          style={{ filter: "drop-shadow(0 0 6px rgba(231, 76, 60, 0.6))" }}
        />

        {/* Point central d'impact incandescent */}
        <motion.circle
          cx="50"
          cy="50"
          r="3"
          fill="#ffffff"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0.9] }}
          transition={{ duration: 1, delay: 0.4 }}
          style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.8))" }}
        />
      </svg>

      {/* Texte : Typographie */}
      <h1
        className="serif-font"
        style={{
          margin: 0,
          paddingTop: "4px", // Alignement optique 
          color: "var(--color-text-primary)",
          fontSize: size * 0.75,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          fontWeight: 500,
        }}
      >
        NOEMA
      </h1>
    </div>
  );
});

export default NoemaLogo;
