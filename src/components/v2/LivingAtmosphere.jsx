import { motion } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// LivingAtmosphere — Ambiance lumineuse phase-réactive
// Props : glow {string} — couleur de glow (ex: "rgba(189,194,255,0.35)")
// ─────────────────────────────────────────────────────────────────────────────

export default function LivingAtmosphere({ glow }) {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {/* Blob 1 — top-left, large, primary glow */}
      <motion.div
        animate={{
          scale: [1, 1.3, 0.9, 1.2, 1],
          x: [0, 40, -30, 20, 0],
          y: [0, -50, 30, -20, 0],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute", top: "-20%", left: "-15%",
          width: "75%", height: "75%", borderRadius: "50%",
          background: `radial-gradient(circle, ${glow} 0%, transparent 65%)`,
          filter: "blur(60px)", opacity: 0.7,
        }}
      />
      {/* Blob 2 — top-right, warm accent */}
      <motion.div
        animate={{
          scale: [1, 0.85, 1.2, 0.95, 1],
          x: [0, -50, 30, -20, 0],
          y: [0, 40, -35, 50, 0],
        }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        style={{
          position: "absolute", top: "20%", right: "-20%",
          width: "65%", height: "65%", borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,182,138,0.22) 0%, transparent 65%)`,
          filter: "blur(70px)", opacity: 0.5,
        }}
      />
      {/* Blob 3 — bottom-left, primary glow */}
      <motion.div
        animate={{
          scale: [1, 1.15, 0.88, 1.1, 1],
          x: [0, 35, -25, 15, 0],
          y: [0, 30, -40, 20, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 10 }}
        style={{
          position: "absolute", bottom: "-10%", left: "10%",
          width: "55%", height: "55%", borderRadius: "50%",
          background: `radial-gradient(circle, ${glow} 0%, transparent 65%)`,
          filter: "blur(80px)", opacity: 0.4,
        }}
      />
      {/* Blob 4 — bottom-right, cool accent */}
      <motion.div
        animate={{
          scale: [1, 1.2, 0.9, 1.05, 1],
          x: [0, -30, 40, -15, 0],
          y: [0, -30, 20, -40, 0],
        }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut", delay: 15 }}
        style={{
          position: "absolute", bottom: "30%", right: "5%",
          width: "40%", height: "40%", borderRadius: "50%",
          background: `radial-gradient(circle, rgba(154,223,200,0.12) 0%, transparent 65%)`,
          filter: "blur(60px)", opacity: 0.45,
        }}
      />
    </div>
  );
}
