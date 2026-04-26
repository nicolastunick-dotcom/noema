// ─────────────────────────────────────────────────────────────────────────────
// Noema Design System — Tokens
// Source de vérité unique pour les V2 components.
// Les pages V1 restent sur leurs palettes inline (pas de migration forcée).
// ─────────────────────────────────────────────────────────────────────────────

export const T = {

  // ── Couleurs ─────────────────────────────────────────────────────────────
  color: {
    // Surfaces (du plus sombre au plus clair)
    bg:        "#0c0e13",
    surface:   "#111318",
    elevated:  "#1a1b21",
    container: "#1e1f25",
    high:      "#282a2f",
    highest:   "#33353a",

    // Texte
    text:      "#e2e2e9",
    textSub:   "#c5c5d8",
    textMuted: "#8f8fa1",
    textOff:   "#454655",

    // Accents fixes (fallback — les valeurs live viennent de phaseContext)
    accent: {
      default:   "#bdc2ff",
      container: "#7886ff",
      glow:      "rgba(189,194,255,0.35)",
      soft:      "rgba(189,194,255,0.09)",
    },

    // Couleurs par phase (source de vérité pour phaseContext)
    phase: {
      perdu:    { accent: "#bdc2ff", bg: "#111318", glow: "rgba(189,194,255,0.35)" },
      guide:    { accent: "#ffb68a", bg: "#13100c", glow: "rgba(255,182,138,0.32)" },
      stratege: { accent: "#9adfc8", bg: "#0c1312", glow: "rgba(154,223,200,0.30)" },
    },

    // Sémantique
    error:   "#ffb4ab",
    warning: "#ffb68a",
    success: "#9adfc8",
  },

  // ── Espacement ────────────────────────────────────────────────────────────
  space: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
  },

  // ── Rayon ────────────────────────────────────────────────────────────────
  radius: {
    sm:   8,
    md:   12,
    lg:   16,
    xl:   20,
    "2xl": 24,
    full: 9999,
  },

  // ── Typographie ──────────────────────────────────────────────────────────
  font: {
    sans:         "'Figtree', sans-serif",
    serif:        "'Instrument Serif', serif",
    handwriting:  "'Caveat', cursive",
  },
  type: {
    noema:   { size: "1.125rem",   lh: 1.85, ls: "0.005em"  },
    bodyLg:  { size: "1.0rem",     lh: 1.78, ls: "0em"      },
    body:    { size: "0.9375rem",  lh: 1.75, ls: "0em"      },
    bodySm:  { size: "0.875rem",   lh: 1.7,  ls: "0em"      },
    label:   { size: "0.75rem",    lh: 1.4,  ls: "0.04em"   },
    caption: { size: "0.625rem",   lh: 1.3,  ls: "0.16em"   },
    tiny:    { size: "0.625rem",   lh: 1.3,  ls: "0.18em"   }, // Labels micro, horodatages fins
    input:   { size: "0.9375rem", lh: 1.6,  ls: "0em", weight: 300 }, // Textarea chat
    h1:      { size: "1.75rem",    lh: 1.15, ls: "-0.02em"  },
    h2:      { size: "1.35rem",    lh: 1.2,  ls: "-0.01em"  },
    h3:      { size: "1.1rem",     lh: 1.3,  ls: "0em"      },
  },

  // ── Ombres ───────────────────────────────────────────────────────────────
  shadow: {
    sm:  "0 2px 8px rgba(0,0,0,0.18)",
    md:  "0 8px 24px rgba(0,0,0,0.22)",
    lg:  "0 16px 40px rgba(0,0,0,0.26)",
    xl:  "0 24px 60px rgba(0,0,0,0.32)",
  },

  // ── Glass surfaces ────────────────────────────────────────────────────────
  glass: {
    sm: {
      background:              "rgba(22,23,29,0.60)",
      backdropFilter:          "blur(16px)",
      WebkitBackdropFilter:    "blur(16px)",
      border:                  "1px solid rgba(255,255,255,0.05)",
    },
    md: {
      background:              "rgba(22,23,29,0.72)",
      backdropFilter:          "blur(24px)",
      WebkitBackdropFilter:    "blur(24px)",
      border:                  "1px solid rgba(255,255,255,0.06)",
    },
    input: {
      background:              "rgba(38,40,46,0.90)",
      backdropFilter:          "blur(28px)",
      WebkitBackdropFilter:    "blur(28px)",
      border:                  "1px solid rgba(255,255,255,0.07)",
    },
  },

  // ── Navigation ─────────────────────────────────────────────────────────────
  nav: {
    height:    88,  // Hauteur totale bottom nav
    phaseBarH: 27,  // Hauteur de la zone phase label
    tabRadius:  6,  // Border radius du tab indicator
  },

  // ── Motion ────────────────────────────────────────────────────────────────
  motion: {
    fast:   { duration: 0.12, ease: "easeOut" },
    normal: { duration: 0.22, ease: "easeOut" },
    slow:   { duration: 0.4,  ease: [0.16, 1, 0.3, 1] },
    spring: { type: "spring", stiffness: 380, damping: 32 },
  },
};

// ── Focus rings ───────────────────────────────────────────────────────────────
// Fonctions utilitaires — exportées séparément pour éviter les problèmes de sérialisation
export const focusRing = {
  ring:  (accent) => `0 0 0 2px ${accent}66`,
  input: (accent) => `0 0 0 1.5px ${accent}66, 0 0 16px ${accent}14`,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
/** Retourne la couleur de texte du bouton CTA selon la phase */
export function phaseButtonTextColor(phaseId) {
  const map = { guide: "#2a1200", stratege: "#002218" };
  return map[phaseId] ?? "#00118c";
}
