import { motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// OrbPhase — Orbe vivante, CSS pur + Framer Motion
//
// Props :
//   size         {number}  Diamètre en px (défaut 48)
//   typing       {boolean} Active l'état chargement (défaut false)
//   phaseContext {Object}  Données de phase depuis getPhaseState()
//
// Design : 5 couches superposées
//   1. Halo atmosphérique — diffus, lent, grande zone de glow
//   2. Anneau orbital — fine bordure, rotation continue
//   3. Sphère principale — gradient radial, morphing léger
//   4. Couche intérieure — contre-rotation, effet iridescent
//   5. Point spéculaire + lettrine N
// ─────────────────────────────────────────────────────────────────────────────

// Palette par phase — alignée sur T.color.phase (tokens.js)
const PHASE_PALETTE = {
  perdu: {
    core:      "#7886ff",          // T.color.accent.container (plus saturé pour le gradient)
    coreLight: "#bdc2ff",          // T.color.phase.perdu.accent
    glow:      "rgba(189,194,255,0.55)",
    halo:      "rgba(189,194,255,0.18)",
    ring:      "rgba(189,194,255,0.28)",
    inner:     "rgba(150,160,255,0.35)",
  },
  guide: {
    core:      "#e8802a",          // version saturée de l'accent guide
    coreLight: "#ffb68a",          // T.color.phase.guide.accent
    glow:      "rgba(255,182,138,0.52)",
    halo:      "rgba(255,182,138,0.16)",
    ring:      "rgba(255,182,138,0.28)",
    inner:     "rgba(255,160,80,0.32)",
  },
  stratege: {
    core:      "#2db88a",          // version saturée de l'accent stratège
    coreLight: "#9adfc8",          // T.color.phase.stratege.accent
    glow:      "rgba(154,223,200,0.50)",
    halo:      "rgba(154,223,200,0.16)",
    ring:      "rgba(154,223,200,0.28)",
    inner:     "rgba(100,210,170,0.32)",
  },
};

const FALLBACK_PALETTE = PHASE_PALETTE.perdu;

function getPalette(phaseContext) {
  if (!phaseContext?.id) return FALLBACK_PALETTE;
  return PHASE_PALETTE[phaseContext.id] ?? FALLBACK_PALETTE;
}

export default function OrbPhase({ size = 48, typing = false, phaseContext }) {
  const p        = getPalette(phaseContext);
  const isLarge  = size >= 120;
  const speed    = typing ? 0.5 : 1;      // accélère tout quand typing
  const glowSize = size * (isLarge ? 1.8 : 2.0);

  const prevPhaseRef = useRef(phaseContext?.id);
  const [bursting, setBursting] = useState(false);

  useEffect(() => {
    if (!phaseContext?.id) return;
    if (prevPhaseRef.current && prevPhaseRef.current !== phaseContext.id) {
      setBursting(true);
      const t = setTimeout(() => setBursting(false), 1800);
      return () => clearTimeout(t);
    }
    prevPhaseRef.current = phaseContext.id;
  }, [phaseContext?.id]);

  // Morphing border-radius — forme légèrement organique
  const morphFrames = [
    "42% 58% 55% 45% / 45% 42% 58% 55%",
    "55% 45% 42% 58% / 58% 55% 45% 42%",
    "48% 52% 58% 42% / 42% 48% 52% 58%",
    "42% 58% 55% 45% / 45% 42% 58% 55%",
  ];

  return (
    <div style={{
      position:       "relative",
      width:          size,
      height:         size,
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      flexShrink:     0,
    }}>

      {/* ── Couche 1 : Halo atmosphérique ── */}
      <motion.div
        animate={{
          scale:   bursting ? [1, 2.8, 1.4, 1] : (typing ? [1, 1.25, 1] : [1, 1.12, 1]),
          opacity: bursting ? [0.3, 1.0, 0.7, 0.35] : (typing ? [0.6, 0.9, 0.6] : [0.3, 0.55, 0.3]),
        }}
        transition={{
          duration: bursting ? 1.8 : (typing ? 1.6 * speed : 5),
          repeat:   bursting ? 0 : Infinity,
          ease:     "easeOut",
        }}
        style={{
          position:     "absolute",
          width:        glowSize,
          height:       glowSize,
          borderRadius: "50%",
          background:   `radial-gradient(circle at 50% 50%, ${p.glow} 0%, ${p.halo} 40%, transparent 70%)`,
          pointerEvents: "none",
          zIndex:       0,
        }}
      />

      {/* ── Couche 2 : Anneau orbital ── */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: typing ? 6 : 18,
          repeat:   Infinity,
          ease:     "linear",
        }}
        style={{
          position:     "absolute",
          width:        size * 1.22,
          height:       size * 1.22,
          borderRadius: "50%",
          border:       `1px solid ${p.ring}`,
          transform:    "rotate(0deg) scaleY(0.45)",
          pointerEvents: "none",
          zIndex:       1,
        }}
      />

      {/* ── Couche 2b : Second anneau orbital (incliné) ── */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{
          duration: typing ? 9 : 28,
          repeat:   Infinity,
          ease:     "linear",
        }}
        style={{
          position:     "absolute",
          width:        size * 1.15,
          height:       size * 1.15,
          borderRadius: "50%",
          border:       `1px solid ${p.ring}`,
          transform:    "rotate(65deg) scaleY(0.35)",
          opacity:      0.6,
          pointerEvents: "none",
          zIndex:       1,
        }}
      />

      {/* ── Couche 3 : Sphère principale (morphing) ── */}
      <motion.div
        animate={{
          borderRadius: morphFrames,
          scale:        bursting ? [1, 1.15, 1.05, 1] : (typing ? [1, 1.04, 1] : [1, 1.02, 1]),
        }}
        transition={{
          borderRadius: {
            duration: typing ? 2.5 : 7,
            repeat:   Infinity,
            ease:     "easeInOut",
          },
          scale: {
            duration: typing ? 1.4 : 4,
            repeat:   Infinity,
            ease:     "easeInOut",
          },
        }}
        style={{
          position:   "relative",
          width:      size,
          height:     size,
          background: `radial-gradient(circle at 36% 32%, ${p.coreLight} 0%, ${p.core} 55%, #0a0b12 100%)`,
          boxShadow:  `0 0 ${size * 0.5}px ${p.glow}, 0 0 ${size * 0.18}px ${p.glow} inset`,
          zIndex:     2,
          overflow:   "hidden",
        }}
      >
        {/* ── Couche 4 : Contre-rotation intérieure (iridescence) ── */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{
            duration: typing ? 4 : 12,
            repeat:   Infinity,
            ease:     "linear",
          }}
          style={{
            position:     "absolute",
            top:          "-30%",
            left:         "-30%",
            width:        "160%",
            height:       "160%",
            background:   `conic-gradient(from 0deg, transparent 0%, ${p.inner} 25%, transparent 50%, ${p.inner} 75%, transparent 100%)`,
            opacity:      isLarge ? 0.25 : 0.35,
            mixBlendMode: "screen",
          }}
        />

        {/* ── Couche 5a : Reflet spéculaire ── */}
        <div style={{
          position:     "absolute",
          top:          "10%",
          left:         "14%",
          width:        "36%",
          height:       "26%",
          borderRadius: "50%",
          background:   "rgba(255,255,255,0.22)",
          filter:       "blur(2.5px)",
          transform:    "rotate(-20deg)",
        }} />

        {/* ── Couche 5b : Lettrine N ── */}
        <div style={{
          position:       "absolute",
          inset:          0,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          fontFamily:     "'Instrument Serif', serif",
          fontStyle:      "italic",
          fontSize:       Math.round(size * 0.44),
          color:          "rgba(255,255,255,0.68)",
          letterSpacing:  "-0.02em",
          userSelect:     "none",
          lineHeight:     1,
          textShadow:     `0 0 ${size * 0.2}px rgba(255,255,255,0.3)`,
        }}>N</div>
      </motion.div>

      {/* ── Dots de chargement (typing uniquement) ── */}
      {typing && (
        <div style={{
          position:   "absolute",
          bottom:     -(size * 0.62),
          left:       "50%",
          transform:  "translateX(-50%)",
          display:    "flex",
          gap:        4,
          alignItems: "center",
        }}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.2, 1, 0.2], y: [0, -3, 0] }}
              transition={{
                duration: 0.9,
                repeat:   Infinity,
                delay:    i * 0.16,
                ease:     "easeInOut",
              }}
              style={{
                width:        4,
                height:       4,
                borderRadius: "50%",
                background:   p.coreLight,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
