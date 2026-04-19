import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNoemaRuntime } from "../../context/NoemaContext";
import { T } from "../../design-system/tokens";
import OrbPhase from "../../components/v2/OrbPhase";
import LivingAtmosphere from "../../components/v2/LivingAtmosphere";

// ─────────────────────────────────────────────────────────────────────────────
// MappingV2 — Sanctuaire psychologique
// Zéro props — tout vient de useNoemaRuntime()
// ─────────────────────────────────────────────────────────────────────────────

// ── Force strength — calculée dynamiquement à partir des sessions récentes ────
function computeForceStrengths(forces, recentSessions) {
  if (!forces?.length) return [];
  const total = Math.max(recentSessions?.length || 1, 1);
  return forces.map((force, index) => {
    if (!recentSessions?.length) {
      // Fallback progressif pour les nouveaux utilisateurs
      return Math.min(95, 25 + index * 5);
    }
    const keyword = force.split(/[\s,]/)[0].toLowerCase();
    const count = recentSessions.filter(s => {
      const sForces = s.insights?.forces || [];
      return sForces.some(f => f.toLowerCase().includes(keyword));
    }).length;
    // Minimum 20%, maximum 95%, linéaire sur 3 sessions
    return Math.min(95, Math.max(20, Math.round((count / Math.min(total, 3)) * 75 + 20)));
  });
}

const BLOCAGE_CONFIG = {
  racine:    { label: "Blocage Racine",    critLabel: "Critique", critColor: T.color.error,          barW: "85%", barColor: T.color.error },
  entretien: { label: "Blocage Entretien", critLabel: "Modéré",   critColor: T.color.warning,         barW: "50%", barColor: T.color.warning },
  visible:   { label: "Expression",        critLabel: "Surface",  critColor: T.color.accent.default,  barW: "30%", barColor: T.color.accent.default },
};

// ── Stagger helper ────────────────────────────────────────────────────────────
const stagger = (i) => ({
  initial:    { opacity: 0, y: 18 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: i * 0.09 },
});

// ── Section separator ─────────────────────────────────────────────────────────
function Separator({ accent }) {
  return (
    <div style={{
      height: 1,
      background: `linear-gradient(90deg, transparent, ${accent}44, transparent)`,
      margin: "48px 0",
    }} />
  );
}

// ── Pulse tile ────────────────────────────────────────────────────────────────
function PulseTile({ label, value, hint, accent, index = 0 }) {
  return (
    <motion.div
      {...stagger(index)}
      style={{
        borderRadius:  T.radius.lg,
        padding:       "18px 16px",
        background:    "rgba(17,19,24,0.55)",
        border:        `1px solid ${accent ?? T.color.accent.default}22`,
        minHeight:     108,
        display:       "flex",
        flexDirection: "column",
        gap:           8,
      }}
    >
      <p style={{ margin: 0, fontSize: "0.56rem", letterSpacing: "0.18em", textTransform: "uppercase", color: T.color.textMuted, fontWeight: 700 }}>
        {label}
      </p>
      <p style={{ margin: 0, fontFamily: T.font.serif, fontStyle: "italic", fontSize: "0.9rem", lineHeight: 1.6, color: T.color.text, flex: 1 }}>
        {value}
      </p>
      {hint && (
        <p style={{ margin: 0, fontSize: "0.68rem", lineHeight: 1.5, color: accent ?? T.color.accent.default }}>
          {hint}
        </p>
      )}
    </motion.div>
  );
}

// ── Zen ring ──────────────────────────────────────────────────────────────────
function ZenRing({ step, accent }) {
  const pct = Math.min(step / 6, 1);
  const r = 56;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div style={{ position: "relative", width: 128, height: 128 }}>
        {/* Outer glow */}
        <div style={{
          position: "absolute", inset: -12,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
          filter: "blur(8px)",
        }} />
        <svg width="128" height="128" style={{ transform: "rotate(-90deg)", position: "relative", zIndex: 1 }}>
          <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
          <motion.circle
            cx="64" cy="64" r={r} fill="none"
            stroke={accent ?? T.color.accent.default}
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circ}` }}
            animate={{ strokeDasharray: `${circ * pct} ${circ}` }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 2,
        }}>
          <span style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "1.6rem", color: T.color.text }}>
            {Math.round(pct * 100)}%
          </span>
          <span style={{ fontSize: "0.5rem", letterSpacing: "0.16em", textTransform: "uppercase", color: T.color.textMuted }}>
            progression
          </span>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <span style={{ display: "block", fontFamily: T.font.serif, fontStyle: "italic", fontSize: "1.1rem", color: T.color.text }}>
          Parcours en cours
        </span>
        <span style={{ display: "block", marginTop: 6, fontSize: "0.72rem", color: accent }}>
          Session {step} · Le profil s'affine
        </span>
      </div>
    </div>
  );
}

// ── Ikigai diagram ────────────────────────────────────────────────────────────
function IkigaiDiagram({ ikigai, accent }) {
  const [hovered, setHovered] = useState(null);

  // Completion ratio — drives circle size dynamically
  const filledCount = [ikigai.aime, ikigai.excelle, ikigai.monde, ikigai.paie]
    .filter(v => v && v.trim().length > 0).length;
  const completionRatio = filledCount / 4; // 0 à 1

  // Per-circle size: empty = 42%, fully complete = 72%
  const circleSize = (filled) => filled ? `${52 + completionRatio * 20}%` : "42%";

  const circles = [
    {
      label: "Passion",
      sub:   ikigai.aime,
      color: accent ?? T.color.accent.default,
      bg:    `${accent ?? T.color.accent.default}0d`,
      size:  circleSize(ikigai.aime?.trim()),
      style: { top: 0, left: "50%", transform: "translate(-50%, 0)" },
    },
    {
      label: "Profession",
      sub:   ikigai.excelle,
      color: T.color.warning,
      bg:    "rgba(255,182,138,0.05)",
      size:  circleSize(ikigai.excelle?.trim()),
      style: { top: "50%", right: 0, transform: "translate(0, -50%)" },
    },
    {
      label: "Vocation",
      sub:   ikigai.monde,
      color: T.color.success,
      bg:    "rgba(154,223,200,0.05)",
      size:  circleSize(ikigai.monde?.trim()),
      style: { bottom: 0, left: "50%", transform: "translate(-50%, 0)" },
    },
    {
      label: "Mission",
      sub:   ikigai.paie,
      color: T.color.accent.container,
      bg:    "rgba(120,134,255,0.05)",
      size:  circleSize(ikigai.paie?.trim()),
      style: { top: "50%", left: 0, transform: "translate(0, -50%)" },
    },
  ];

  const labelPos = [
    { top: "10%",  left: "50%",  transform: "translateX(-50%)", textAlign: "center" },
    { top: "50%",  right: "6%",  transform: "translateY(-50%)", textAlign: "right"  },
    { bottom: "8%",left: "50%",  transform: "translateX(-50%)", textAlign: "center" },
    { top: "50%",  left: "6%",   transform: "translateY(-50%)", textAlign: "left"   },
  ];

  return (
    <div style={{ position: "relative", paddingBottom: "100%", width: "100%" }}>
      <div style={{ position: "absolute", inset: 0 }}>
        {circles.map((c, i) => (
          <div
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              position:     "absolute",
              width:        c.size, height: c.size,
              borderRadius: "50%",
              border:       `1px solid ${hovered === i ? c.color : c.color + "33"}`,
              background:   hovered === i ? c.bg.replace("0.05", "0.12") : c.bg,
              mixBlendMode: "screen",
              transition:   "all 0.8s ease",
              cursor:       c.sub ? "pointer" : "default",
              zIndex:       hovered === i ? 5 : 1,
              ...c.style,
            }}
          />
        ))}
        {circles.map((c, i) => (
          <div
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ position: "absolute", zIndex: 6, cursor: c.sub ? "pointer" : "default", ...labelPos[i] }}
          >
            <p style={{
              fontFamily: T.font.serif, fontStyle: "italic",
              fontSize: "0.95rem", color: c.color,
              lineHeight: 1, margin: 0,
              opacity: hovered !== null && hovered !== i ? 0.3 : 1,
              transition: "opacity 0.2s",
            }}>
              {c.label}
            </p>
            {c.sub && (
              <p style={{
                fontSize: "0.6rem", color: T.color.textSub,
                marginTop: 2, lineHeight: 1.4, maxWidth: 80,
                opacity: hovered !== null && hovered !== i ? 0.2 : 1,
                transition: "opacity 0.2s",
              }}>
                {c.sub}
              </p>
            )}
          </div>
        ))}
        {/* Center */}
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          zIndex: 10, width: 96, height: 96, borderRadius: "50%",
          background: T.color.high, border: "1px solid rgba(69,70,85,0.25)",
          boxShadow: T.shadow.md,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          textAlign: "center", padding: "0 8px",
        }}>
          <span style={{
            fontFamily: T.font.serif, fontStyle: "italic", fontSize: "1.1rem",
            background: `linear-gradient(135deg, ${T.color.accent.default} 0%, ${T.color.accent.container} 100%)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            lineHeight: 1.2,
          }}>
            {ikigai.mission || "Ikigai"}
          </span>
          <span style={{ fontSize: "0.46rem", letterSpacing: "0.1em", textTransform: "uppercase", color: T.color.textMuted, marginTop: 3 }}>
            Raison d'être
          </span>
        </div>
      </div>
      {/* Completion indicator */}
      <p style={{ fontSize: T.type.label?.size ?? "0.62rem", color: T.color.textMuted, textAlign: "center", marginTop: 12, position: "relative", top: "100%" }}>
        {filledCount === 0 && "Ikigai à construire — commence par une session"}
        {filledCount === 1 && "1 dimension découverte sur 4"}
        {filledCount === 2 && "2 dimensions sur 4 — le profil prend forme"}
        {filledCount === 3 && "3 dimensions sur 4 — presque complet"}
        {filledCount === 4 && "Profil Ikigai complet ✦"}
      </p>
    </div>
  );
}

// ── Harmonie narrative builder ────────────────────────────────────────────────
function buildHarmonieText(ikigai) {
  const parts = [];
  if (ikigai.aime && ikigai.excelle) {
    parts.push(`Tu excelles dans ${ikigai.excelle.toLowerCase()} — et c'est aussi ce qui t'anime.`);
  }
  if (ikigai.monde && ikigai.paie) {
    parts.push(`Le monde a besoin de ${ikigai.monde.toLowerCase()}, et c'est une direction dans laquelle tu peux aller.`);
  }
  if (ikigai.mission) {
    parts.push(`Ta mission telle qu'elle apparaît : ${ikigai.mission}.`);
  }
  if (parts.length === 0) return "Continue les sessions — l'Ikigai se construit progressivement.";
  return parts.join(" ");
}

// ── Empty state ───────────────────────────────────────────────────────────────
function Empty({ msg }) {
  return (
    <p style={{ fontSize: "0.78rem", color: T.color.textMuted, fontStyle: "italic", textAlign: "center", padding: "16px 0", margin: 0 }}>
      {msg}
    </p>
  );
}

function SectionEmpty({ msg, phaseContext, onSessionClick }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 14,
      padding: "32px 0",
      opacity: 0.65,
    }}>
      <OrbPhase size={32} typing={false} phaseContext={phaseContext} />
      <p style={{ margin: 0, fontSize: "0.78rem", color: T.color.textMuted, fontStyle: "italic", textAlign: "center", lineHeight: 1.7 }}>
        {msg}
      </p>
      <button
        onClick={onSessionClick}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          fontSize: "0.75rem",
          color: T.color.textMuted,
          fontFamily: T.font.sans,
          letterSpacing: "0.02em",
          textDecoration: "none",
        }}
      >
        Commencer une session →
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MappingV2() {
  const {
    insights,
    ikigai,
    step,
    phaseContext,
    progressSignals,
    recentSessions,
    changeTab,
  } = useNoemaRuntime();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const accent     = phaseContext?.accent     ?? T.color.accent.default;
  const accentSoft = phaseContext?.accentSoft ?? T.color.accent.soft;
  const glow       = phaseContext?.glow       ?? T.color.accent.glow;

  const { forces, blocages, contradictions } = insights ?? { forces: [], blocages: {}, contradictions: [] };
  const hasBlocages = blocages?.racine || blocages?.entretien || blocages?.visible;
  const forceStrengths = computeForceStrengths(forces, recentSessions);

  // Ikigai completion — used for conditional Harmonie section
  const ikigaiFilledCount = [ikigai?.aime, ikigai?.excelle, ikigai?.monde, ikigai?.paie]
    .filter(v => v && v.trim().length > 0).length;

  return (
    <div style={{
      backgroundColor: T.color.bg,
      minHeight:       "100vh",
      fontFamily:      T.font.sans,
      color:           T.color.text,
      overflowX:       "hidden",
      paddingBottom:   120,
    }}>

      {/* ── Living atmosphere ── */}
      <LivingAtmosphere glow={glow} />

      {/* ── Cinematic entrance wrapper ── */}
      <motion.div
        initial={{ opacity: 0, filter: "blur(12px)", scale: 0.98 }}
        animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "relative", zIndex: 1 }}
      >
        <div style={{
          maxWidth:      720,
          margin:        "0 auto",
          padding:       "0 24px 80px",
          display:       "flex",
          flexDirection: "column",
        }}>

          {/* ── Hero section — psychological sanctuary entrance ── */}
          <section style={{
            textAlign: "center",
            padding: "72px 24px 56px",
            position: "relative",
          }}>
            {/* Orb as symbol */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ marginBottom: 32, display: "flex", justifyContent: "center" }}
            >
              <OrbPhase size={130} typing={false} phaseContext={phaseContext} />
            </motion.div>

            {/* Phase pill */}
            {phaseContext && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: accentSoft, border: `1px solid ${accent}33`,
                  borderRadius: T.radius.full, padding: "5px 16px",
                  marginBottom: 24,
                }}
              >
                <span style={{ fontSize: "0.56rem", letterSpacing: "0.18em", textTransform: "uppercase", color: accent, fontWeight: 700 }}>
                  {phaseContext.navLabel}
                </span>
              </motion.div>
            )}

            {/* Big serif title */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontFamily: T.font.serif, fontStyle: "italic",
                fontSize: "clamp(2.4rem, 8vw, 3.6rem)",
                lineHeight: 1.1, letterSpacing: "-0.02em",
                color: T.color.text, margin: "0 0 16px",
              }}
            >
              Profil psychologique
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              style={{
                fontSize: T.type.bodyLg.size, color: T.color.textSub,
                lineHeight: 1.8, maxWidth: 480, margin: "0 auto",
              }}
            >
              {phaseContext?.summary
                ? `${phaseContext.summary} Le mapping révèle ce qui se construit en toi.`
                : "Une exploration de ton architecture intérieure — forces, blocages, contradictions, lus session après session."}
            </motion.p>
          </section>

          <Separator accent={accent} />

          {/* ── Trajectoire ── */}
          {progressSignals && (
            <motion.div {...stagger(0)} style={{ marginBottom: 48 }}>
              <div style={{
                ...T.glass.md,
                borderRadius: T.radius["2xl"],
                padding: 32,
                position: "relative",
                overflow: "hidden",
                border: `1px solid ${accent}22`,
              }}>
                <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`, opacity: 0.15, borderRadius: "50%", pointerEvents: "none" }} />
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: T.type.h2.size, color: accent, margin: "0 0 10px" }}>
                    Trajectoire actuelle
                  </h2>
                  <p style={{ margin: 0, fontSize: T.type.body.size, lineHeight: 1.8, color: T.color.textSub, maxWidth: 500 }}>
                    {progressSignals.movementSummary ?? "La trajectoire se précise session après session."}
                  </p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
                  <PulseTile label="Cap du moment"  value={progressSignals.trajectoryLabel ?? "Trajectoire en construction"} hint={progressSignals.continuitySummary ?? "Lecture en cours"} accent={accent} index={0} />
                  <PulseTile label="Motif dominant" value={progressSignals.dominantThread?.value ?? "Aucun motif dominant"} hint={progressSignals.dominantThread ? `${progressSignals.dominantThread.count} session(s)` : "Aucune récurrence nette"} accent={accent} index={1} />
                  <PulseTile label="Fils ouverts"   value={progressSignals.openLoops[0]?.value ?? "Aucun fil ouvert"} hint={progressSignals.openLoops.length > 1 ? `${progressSignals.openLoops.length} fils actifs` : "Un fil prioritaire"} accent={accent} index={2} />
                  <PulseTile label="Dernier cran"   value={progressSignals.latestStepLabel ?? "Niveau non résolu"} hint={progressSignals.latestNote ?? "Apparaît après la prochaine session"} accent={accent} index={3} />
                </div>
              </div>
            </motion.div>
          )}

          <Separator accent={accent} />

          {/* ── Forces — dramatic pillars ── */}
          <motion.section {...stagger(1)} style={{ marginBottom: 48 }}>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "clamp(1.5rem, 4vw, 2rem)", color: T.color.text, margin: "0 0 8px" }}>
                Forces motrices
              </h2>
              <p style={{ margin: 0, fontSize: T.type.bodySm.size, color: T.color.textSub, lineHeight: 1.8 }}>
                Les dimensions qui te portent — révélées au fil des sessions.
              </p>
            </div>
            {forces?.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {forces.map((f, i) => (
                  <motion.div
                    key={f}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.55, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      display: "flex", alignItems: "center", gap: 24,
                      padding: "22px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    {/* Giant serial number */}
                    <span style={{
                      fontFamily: T.font.serif, fontStyle: "italic",
                      fontSize: "3.5rem", lineHeight: 1,
                      color: `${accent}${Math.round((1 - i * 0.15) * 255).toString(16).padStart(2, "0")}`,
                      flexShrink: 0, width: 72, textAlign: "right",
                      filter: i === 0 ? `drop-shadow(0 0 12px ${accent})` : "none",
                    }}>
                      0{i + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "1rem", fontWeight: 600, color: T.color.text, margin: 0, lineHeight: 1.4 }}>{f}</p>
                      {/* Glow progress bar */}
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${forceStrengths[i] ?? 50}%` }}
                        transition={{ duration: 1, delay: 0.4 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                          height: 2, marginTop: 10, borderRadius: 9999,
                          background: `linear-gradient(90deg, ${accent}, transparent)`,
                          boxShadow: `0 0 8px ${accent}88`,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "0.65rem", color: accent, fontWeight: 700, letterSpacing: "0.1em", flexShrink: 0 }}>
                      {forceStrengths[i] ?? 50}%
                    </span>
                  </motion.div>
                ))}
                <button
                  onClick={() => changeTab("chat")}
                  style={{
                    marginTop: 12,
                    padding: "6px 14px",
                    borderRadius: 8,
                    border: `1px solid ${accent}44`,
                    background: "transparent",
                    color: accent,
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    fontFamily: T.font.sans,
                    transition: "all 0.2s ease",
                    alignSelf: "flex-start",
                  }}
                >
                  Explorer en session →
                </button>
              </div>
            ) : (
              <SectionEmpty msg="Tes forces apparaîtront au fil des sessions." phaseContext={phaseContext} onSessionClick={() => changeTab("chat")} />
            )}
          </motion.section>

          <Separator accent={accent} />

          {/* ── Ikigai — full width with glow halo ── */}
          <motion.section {...stagger(2)} style={{ marginBottom: 48 }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h2 style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "2rem", color: accent, margin: "0 0 8px" }}>
                Ikigai
              </h2>
              <p style={{ fontStyle: "italic", color: T.color.textSub, fontSize: "0.85rem", margin: 0 }}>
                Raison d'être
              </p>
            </div>
            <div style={{ position: "relative", maxWidth: 400, margin: "0 auto" }}>
              {/* Glow halo behind diagram */}
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                width: "120%", height: "120%",
                background: `radial-gradient(circle, ${glow} 0%, transparent 65%)`,
                filter: "blur(40px)", opacity: 0.35, pointerEvents: "none",
                borderRadius: "50%",
              }} />
              <IkigaiDiagram ikigai={ikigai ?? {}} accent={accent} />
            </div>

            {/* 4 aspects as pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 32 }}>
              {[
                { label: "Passion", value: ikigai?.aime,    color: accent },
                { label: "Profession", value: ikigai?.excelle, color: T.color.warning },
                { label: "Vocation", value: ikigai?.monde,  color: T.color.success },
                { label: "Mission", value: ikigai?.paie,    color: T.color.accent.container },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  padding: "8px 16px", borderRadius: T.radius.full,
                  background: `${color}11`, border: `1px solid ${color}33`,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color, fontWeight: 700 }}>{label}</span>
                  {value && <span style={{ fontSize: "0.75rem", color: T.color.textSub }}>{value}</span>}
                </div>
              ))}
            </div>

            {/* Harmonie detected — visible seulement si >= 2 dimensions remplies */}
            <div style={{
              ...T.glass.md, borderRadius: T.radius.xl,
              padding: 28, marginTop: 32,
              border: `1px solid ${accent}18`,
            }}>
              <h3 style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: T.type.h3.size, color: T.color.text, marginBottom: 16 }}>
                Harmonie détectée
              </h3>
              {ikigaiFilledCount >= 2 ? (
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: accentSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "0.875rem", color: accent, fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>auto_awesome</span>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: T.color.text, lineHeight: 1.8, margin: 0, fontFamily: T.font.serif, fontStyle: "italic" }}>
                    {buildHarmonieText(ikigai ?? {})}
                  </p>
                </div>
              ) : (
                <SectionEmpty msg="Ton ikigai se dessine progressivement." phaseContext={phaseContext} onSessionClick={() => changeTab("chat")} />
              )}
            </div>
          </motion.section>

          <Separator accent={accent} />

          {/* ── Blocages — shadows to dissolve ── */}
          <motion.section {...stagger(3)} style={{ marginBottom: 48 }}>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "clamp(1.5rem, 4vw, 2rem)", color: T.color.text, margin: "0 0 8px" }}>
                Ombres à dissoudre
              </h2>
              <p style={{ margin: 0, fontSize: T.type.bodySm.size, color: T.color.textSub, lineHeight: 1.8 }}>
                Ce qui freine — conscient ou non — révélé par les patterns de conversation.
              </p>
            </div>
            <div style={{
              background: "rgba(10,11,16,0.8)",
              border: `1px solid ${T.color.error}22`,
              borderRadius: T.radius.xl,
              padding: 28,
              boxShadow: `inset 0 0 40px rgba(255,180,171,0.04)`,
            }}>
              {hasBlocages ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {[
                    { type: "racine",    text: blocages?.racine,    index: 0 },
                    { type: "entretien", text: blocages?.entretien, index: 1 },
                    { type: "visible",   text: blocages?.visible,   index: 2 },
                  ].filter(b => b.text).map(({ type, text, index }) => {
                    const cfg = BLOCAGE_CONFIG[type];
                    return (
                      <motion.div
                        key={type}
                        {...stagger(index)}
                        style={{ display: "flex", flexDirection: "column", gap: 8 }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: T.color.text, lineHeight: 1.4 }}>{text}</span>
                          <span style={{ fontSize: "0.62rem", color: cfg.critColor, fontWeight: 700, letterSpacing: "0.06em", flexShrink: 0, marginLeft: 16 }}>
                            {cfg.critLabel}
                          </span>
                        </div>
                        <div style={{ height: 3, borderRadius: 9999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: cfg.barW }}
                            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.3 + index * 0.1 }}
                            style={{ height: "100%", borderRadius: 9999, background: cfg.barColor }}
                          />
                        </div>
                        <p style={{ fontSize: "0.62rem", color: T.color.textMuted, fontStyle: "italic", margin: 0 }}>
                          {cfg.label} · détecté par Noema
                        </p>
                      </motion.div>
                    );
                  })}
                  <div style={{ paddingTop: 14, borderTop: "1px solid rgba(255,180,171,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <p style={{ fontSize: "0.62rem", color: T.color.textMuted, margin: 0 }}>
                      Prochaine étape · session de déconstruction
                    </p>
                    <button
                      onClick={() => changeTab("chat")}
                      style={{
                        marginTop: 0,
                        padding: "6px 14px",
                        borderRadius: 8,
                        border: `1px solid ${accent}44`,
                        background: "transparent",
                        color: accent,
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        fontFamily: T.font.sans,
                        transition: "all 0.2s ease",
                      }}
                    >
                      Explorer en session →
                    </button>
                  </div>
                </div>
              ) : (
                <SectionEmpty msg="Les tensions se révèlent en session." phaseContext={phaseContext} onSessionClick={() => changeTab("chat")} />
              )}
            </div>
          </motion.section>

          <Separator accent={accent} />

          {/* ── Contradictions ── */}
          <motion.div {...stagger(4)} style={{ marginBottom: 48 }}>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "clamp(1.5rem, 4vw, 2rem)", color: T.color.text, margin: "0 0 8px" }}>
                Contradictions détectées
              </h2>
              <p style={{ margin: 0, fontSize: T.type.bodySm.size, color: T.color.textSub, lineHeight: 1.8 }}>
                Les tensions intérieures que l'on porte — souvent la source d'énergie la plus profonde.
              </p>
            </div>
            <div style={{
              ...T.glass.md, borderRadius: T.radius["2xl"],
              padding: 28, position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "70%", height: 80, background: accentSoft, filter: "blur(80px)", borderRadius: 9999, pointerEvents: "none" }} />
              {contradictions?.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, position: "relative" }}>
                  {contradictions.map((c, i) => (
                    <div key={i} style={{
                      background: "rgba(255,255,255,0.025)",
                      borderLeft: `2.5px solid ${i % 2 === 0 ? T.color.warning : accent}`,
                      borderRadius: "0 12px 12px 0",
                      padding: "18px 16px",
                    }}>
                      <h5 style={{
                        fontSize: "0.52rem", letterSpacing: "0.15em", textTransform: "uppercase",
                        color: i % 2 === 0 ? T.color.warning : accent,
                        marginBottom: 10, fontWeight: 700, margin: "0 0 10px",
                      }}>
                        Contradiction {i + 1}
                      </h5>
                      <p style={{ fontSize: "0.85rem", color: T.color.text, lineHeight: 1.7, margin: 0 }}>
                        {c}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty msg="Aucune contradiction détectée pour l'instant." />
              )}
            </div>
          </motion.div>

          <Separator accent={accent} />

          {/* ── Ton parcours — historique des sessions récentes ── */}
          {recentSessions?.length > 0 && (
            <motion.section {...stagger(4)} style={{ marginBottom: 48 }}>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "clamp(1.5rem, 4vw, 2rem)", color: T.color.text, margin: "0 0 8px" }}>
                  Ton parcours
                </h2>
                <p style={{ margin: 0, fontSize: T.type.bodySm.size, color: T.color.textSub, lineHeight: 1.8 }}>
                  La mémoire des sessions — ce qui a été traversé.
                </p>
              </div>
              <div style={{
                ...T.glass.md,
                borderRadius: T.radius.xl,
                padding: "8px 0",
                border: `1px solid ${accent}18`,
                overflow: "hidden",
              }}>
                {recentSessions.map((s, i) => {
                  const date = s.ended_at
                    ? new Date(s.ended_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
                    : null;
                  const note = s.session_note
                    ? s.session_note.slice(0, 200) + (s.session_note.length > 200 ? "…" : "")
                    : null;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.45, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 16,
                        padding: "16px 24px",
                        borderBottom: i < recentSessions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      }}
                    >
                      {/* Timeline dot */}
                      <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        flexShrink: 0,
                        paddingTop: 3,
                      }}>
                        <div style={{
                          width: 8, height: 8,
                          borderRadius: "50%",
                          background: i === 0 ? accent : `${accent}55`,
                          boxShadow: i === 0 ? `0 0 8px ${accent}88` : "none",
                        }} />
                      </div>
                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: note ? 6 : 0, flexWrap: "wrap" }}>
                          {date && (
                            <span style={{ fontSize: "0.62rem", color: accent, fontWeight: 700, letterSpacing: "0.08em", flexShrink: 0 }}>
                              {date}
                            </span>
                          )}
                          {s.step != null && (
                            <span style={{
                              fontSize: "0.54rem", letterSpacing: "0.14em", textTransform: "uppercase",
                              color: T.color.textMuted, background: "rgba(255,255,255,0.05)",
                              padding: "2px 8px", borderRadius: T.radius.full,
                            }}>
                              Session {s.step}
                            </span>
                          )}
                        </div>
                        {note && (
                          <p style={{ margin: 0, fontSize: "0.78rem", color: T.color.textSub, lineHeight: 1.6, fontStyle: "italic" }}>
                            {note}
                          </p>
                        )}
                        {!note && (
                          <p style={{ margin: 0, fontSize: "0.72rem", color: T.color.textMuted, fontStyle: "italic" }}>
                            Session complétée
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          )}

          <Separator accent={accent} />

          {/* ── Phase + Zen ring — dramatic focal point ── */}
          <motion.section {...stagger(5)} style={{ marginBottom: 48 }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h2 style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "2rem", color: accent, margin: "0 0 8px" }}>
                La phase actuelle
              </h2>
              <p style={{ margin: 0, fontSize: T.type.bodySm.size, fontStyle: "italic", color: T.color.textSub, lineHeight: 1.8 }}>
                {phaseContext
                  ? `${phaseContext.paceLabel}. ${phaseContext.horizon ?? "Le parcours s'affine."}`
                  : "Le parcours avance session après session."}
              </p>
            </div>
            <div style={{
              ...T.glass.md, borderRadius: T.radius["2xl"],
              padding: "48px 32px", position: "relative", overflow: "hidden",
              border: `1px solid ${accent}22`,
              boxShadow: `0 0 60px ${glow}44, 0 20px 40px rgba(0,0,0,0.3)`,
              display: "flex", flexDirection: "column", alignItems: "center",
            }}>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "60%", height: "60%", background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`, opacity: 0.2, borderRadius: "50%", pointerEvents: "none" }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <ZenRing step={step ?? 0} accent={accent} />
              </div>
            </div>

            {/* Quote */}
            <div style={{
              textAlign: "center", padding: "40px 24px 0",
            }}>
              <p style={{
                fontFamily: T.font.serif, fontStyle: "italic",
                fontSize: "1.1rem", color: T.color.textSub,
                lineHeight: 1.7, margin: 0, maxWidth: 480, marginLeft: "auto", marginRight: "auto",
              }}>
                "Le cartographe de l'esprit ne dessine pas des terres, mais des silences."
              </p>
            </div>
          </motion.section>

          {/* ── Progression vivante ── */}
          {progressSignals?.hasRecurringThemes && (
            <>
              <Separator accent={accent} />
              <motion.div {...stagger(6)} style={{ marginBottom: 48 }}>
                <div style={{ marginBottom: 28 }}>
                  <h2 style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "clamp(1.5rem, 4vw, 2rem)", color: accent, margin: "0 0 8px" }}>
                    Progression vivante
                  </h2>
                  <p style={{ margin: 0, fontSize: T.type.bodySm.size, lineHeight: 1.8, color: T.color.textSub }}>
                    {progressSignals.movementSummary ?? "Les motifs récurrents donnent une lecture longitudinale du parcours."}
                  </p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ background: "rgba(17,19,24,0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: T.radius.xl, padding: 24 }}>
                    <p style={{ margin: "0 0 16px", fontSize: "0.56rem", letterSpacing: "0.18em", textTransform: "uppercase", color: T.color.textMuted, fontWeight: 700 }}>
                      Ce qui revient
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {[...progressSignals.recurringBlockages, ...progressSignals.recurringContradictions].slice(0, 3).map((item) => (
                        <div key={`${item.label}-${item.value}`} style={{ paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <p style={{ margin: 0, fontSize: "0.85rem", color: T.color.text, lineHeight: 1.6 }}>{item.value}</p>
                          <p style={{ margin: "5px 0 0", fontSize: "0.62rem", color: T.color.warning }}>{item.count} sessions</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: "rgba(17,19,24,0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: T.radius.xl, padding: 24 }}>
                    <p style={{ margin: "0 0 16px", fontSize: "0.56rem", letterSpacing: "0.18em", textTransform: "uppercase", color: T.color.textMuted, fontWeight: 700 }}>
                      Ce qui tient
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {progressSignals.recurringForces.slice(0, 3).map((item) => (
                        <div key={`${item.label}-${item.value}`} style={{ paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <p style={{ margin: 0, fontSize: "0.85rem", color: T.color.text, lineHeight: 1.6 }}>{item.value}</p>
                          <p style={{ margin: "5px 0 0", fontSize: "0.62rem", color: accent }}>{item.count} sessions</p>
                        </div>
                      ))}
                      {progressSignals.continuitySummary && (
                        <p style={{ margin: "4px 0 0", fontSize: "0.68rem", color: accent, lineHeight: 1.6 }}>
                          {progressSignals.continuitySummary}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}

        </div>
      </motion.div>
    </div>
  );
}
