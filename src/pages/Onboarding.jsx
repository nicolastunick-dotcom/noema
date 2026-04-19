import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import OrbPhase from "../components/v2/OrbPhase";
import { T } from "../design-system/tokens";

// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING — 4 slides
// Props : user, sb, onComplete()
// ─────────────────────────────────────────────────────────────────────────────

const BG = `
  radial-gradient(ellipse 80% 50% at 20% -10%, rgba(120,134,255,0.09) 0%, transparent 60%),
  radial-gradient(ellipse 60% 40% at 85% 110%, rgba(189,194,255,0.05) 0%, transparent 55%),
  #0c0e13
`;

const accent     = T.color.accent.default;
const accentCont = T.color.accent.container;

// ── Slide 1 — Bienvenue ───────────────────────────────────────────────────────
function Slide1() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, textAlign: "center", padding: "0 32px", maxWidth: 640, margin: "0 auto", width: "100%" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: 48 }}
      >
        <OrbPhase size={120} typing={false} phaseContext={{ id: "perdu" }} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          fontFamily: T.font.serif, fontStyle: "italic",
          fontSize: "clamp(2.5rem, 8vw, 4rem)", lineHeight: 1.1,
          color: T.color.text, margin: "0 0 20px", letterSpacing: "-0.03em",
        }}
      >
        Bienvenue.<br />Je suis Noema.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }}
        style={{
          fontSize: "1.0625rem", color: T.color.textSub,
          fontWeight: 300, lineHeight: 1.75, margin: 0, maxWidth: 460,
        }}
      >
        Pas un chatbot. Un espace de réflexion qui apprend à te connaître — et qui se souvient.
      </motion.p>
    </div>
  );
}

// ── Slide 2 — Comment ça marche ──────────────────────────────────────────────
function Slide2() {
  const modes = [
    {
      icon: "chat_bubble",
      label: "Chat",
      body: "Parle de ce qui est vivant. Je t'écoute et je retiens ce qui compte.",
      color: accent,
    },
    {
      icon: "account_tree",
      label: "Mapping",
      body: "Ton profil prend forme — forces, blocages, contradictions détectées.",
      color: T.color.warning,
    },
    {
      icon: "book_2",
      label: "Journal",
      body: "Un espace pour écrire. Pour toi, à ton rythme.",
      color: T.color.success,
    },
  ];

  // 3 phases de l'orb
  const phases = [
    { id: "perdu",   label: "Exploration",  color: accent },
    { id: "clarity", label: "Clarté",       color: T.color.warning },
    { id: "anchor",  label: "Ancrage",      color: T.color.success },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, padding: "0 32px", justifyContent: "center", width: "100%", maxWidth: 680, margin: "0 auto" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ textAlign: "center", marginBottom: 36 }}
      >
        <h1 style={{
          fontFamily: T.font.serif, fontStyle: "italic",
          fontSize: "clamp(1.8rem, 5vw, 3rem)", lineHeight: 1.1,
          color: T.color.text, margin: "0 0 14px", letterSpacing: "-0.02em",
        }}>
          Chaque session compte.
        </h1>
        <p style={{ fontSize: "1rem", color: T.color.textSub, fontWeight: 300, maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
          Je retiens ce qui compte pour toi — et je m'adapte au fil du temps.
        </p>
      </motion.div>

      {/* 3 modes */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", marginBottom: 32 }}>
        {modes.map((mode, i) => (
          <motion.div
            key={mode.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: "flex", gap: 16, alignItems: "center",
              padding: "14px 18px", borderRadius: T.radius.lg,
              background: "rgba(22,23,29,0.6)",
              border: `1px solid ${mode.color}22`,
              backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
              background: `${mode.color}14`, border: `1px solid ${mode.color}33`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span className="material-symbols-outlined" style={{ color: mode.color, fontSize: "1rem", fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
                {mode.icon}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 2px", fontSize: "0.875rem", fontWeight: 700, color: T.color.text }}>{mode.label}</p>
              <p style={{ margin: 0, fontSize: "0.8rem", color: T.color.textSub, lineHeight: 1.6 }}>{mode.body}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* OrbPhase phases */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.55, ease: "easeOut" }}
        style={{ display: "flex", alignItems: "center", gap: 20 }}
      >
        {phases.map((ph) => (
          <div key={ph.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <OrbPhase size={44} typing={false} phaseContext={{ id: ph.id }} />
            <span style={{ fontSize: "0.68rem", color: T.color.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>{ph.label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ── Slide 3 — Ce qui est différent ───────────────────────────────────────────
function Slide3() {
  const points = [
    {
      icon: "do_not_disturb_on",
      title: "Pas de diagnostic",
      body: "Je ne t'étiquette pas. Pas de case, pas de profil figé. Tu es plus complexe que ça.",
      color: accent,
    },
    {
      icon: "shuffle",
      title: "Pas de conseil standard",
      body: "Je ne te donne pas de liste de 5 tips. Je t'aide à trouver ce qui est vrai pour toi.",
      color: T.color.warning,
    },
    {
      icon: "flag_circle",
      title: "Pas d'objectif imposé",
      body: "Je ne décide pas de ce que tu dois vouloir. C'est toi qui tiens les rênes.",
      color: T.color.success,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "0 32px", justifyContent: "center", width: "100%", maxWidth: 600, margin: "0 auto" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: 40 }}
      >
        <h1 style={{
          fontFamily: T.font.serif, fontStyle: "italic",
          fontSize: "clamp(2rem, 6vw, 3.2rem)", lineHeight: 1.1,
          color: T.color.text, margin: "0 0 12px", letterSpacing: "-0.02em",
        }}>
          Je ne te juge pas.
        </h1>
        <p style={{ fontSize: "1rem", color: T.color.textSub, fontWeight: 300, margin: 0, lineHeight: 1.65 }}>
          Je n'ai pas de réponses toutes faites. Ce que j'ai, c'est de la présence et de la mémoire.
        </p>
      </motion.div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {points.map((point, i) => (
          <motion.div
            key={point.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: "flex", gap: 20, alignItems: "flex-start",
              padding: "20px 22px", borderRadius: T.radius.lg,
              background: "rgba(22,23,29,0.6)",
              border: `1px solid ${point.color}22`,
              backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
              background: `${point.color}14`, border: `1px solid ${point.color}33`,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginTop: 2,
            }}>
              <span className="material-symbols-outlined" style={{ color: point.color, fontSize: "1.1rem", fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
                {point.icon}
              </span>
            </div>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "0.9375rem", fontWeight: 700, color: T.color.text }}>{point.title}</p>
              <p style={{ margin: 0, fontSize: "0.82rem", color: T.color.textSub, lineHeight: 1.65 }}>{point.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Slide 4 — Prêt ? ──────────────────────────────────────────────────────────
function Slide4({ onComplete, loading }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, textAlign: "center", padding: "0 32px" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: 40 }}
      >
        <OrbPhase size={100} typing={false} phaseContext={{ id: "perdu" }} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ maxWidth: 520, display: "flex", flexDirection: "column", gap: 16, marginBottom: 48 }}
      >
        <p style={{ fontSize: "0.7rem", color: accent, textTransform: "uppercase", letterSpacing: "0.3em", fontWeight: 700, margin: 0 }}>
          C'est parti
        </p>
        <h1 style={{
          fontFamily: T.font.serif, fontStyle: "italic",
          fontSize: "clamp(2.5rem, 7vw, 3.8rem)", lineHeight: 1.1,
          color: T.color.text, margin: 0, letterSpacing: "-0.02em",
        }}>
          Ta première question t'attend.
        </h1>
        <p style={{ fontSize: "1.0625rem", color: T.color.textSub, fontWeight: 300, margin: 0, lineHeight: 1.75 }}>
          Commence par ce qui est le plus vivant en toi aujourd'hui. Je m'adapterai à toi — pas l'inverse.
        </p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
        whileHover={!loading ? { scale: 1.04 } : {}}
        whileTap={!loading ? { scale: 0.97 } : {}}
        onClick={onComplete}
        disabled={loading}
        style={{
          display: "inline-flex", alignItems: "center", gap: 12,
          padding: "16px 40px", borderRadius: T.radius.full,
          background: `linear-gradient(135deg, ${accent} 0%, ${accentCont} 100%)`,
          color: "#111318", border: "none",
          cursor: loading ? "wait" : "pointer",
          fontFamily: T.font.sans, fontWeight: 700, fontSize: "1rem",
          letterSpacing: "0.03em",
          boxShadow: `0 8px 32px rgba(120,134,255,0.28)`,
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Chargement…" : "Commencer"}
        {!loading && (
          <span className="material-symbols-outlined" style={{ fontSize: "1.1rem", fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
            arrow_forward
          </span>
        )}
      </motion.button>
    </div>
  );
}

// ── Progress — pill style ────────────────────────────────────────────────────
function Progress({ slide }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          animate={{
            width:      i === slide ? 28 : 8,
            background: i === slide ? accent : "rgba(69,70,85,0.5)",
          }}
          transition={{ duration: 0.3 }}
          style={{ height: 3, borderRadius: 9999 }}
        />
      ))}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Onboarding({ user, sb, onComplete }) {
  const [slide, setSlide]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [animDir, setAnimDir] = useState("next");

  function goNext() {
    if (slide < 3) { setAnimDir("next"); setSlide((s) => s + 1); }
  }
  function goPrev() {
    if (slide > 0) { setAnimDir("prev"); setSlide((s) => s - 1); }
  }

  async function handleComplete() {
    setLoading(true);
    if (sb && user) {
      await sb.from("memory").upsert(
        { user_id: user.id, onboarding_done: true },
        { onConflict: "user_id" }
      );
    }
    onComplete();
  }

  const slides = [
    <Slide1 key={0} />,
    <Slide2 key={1} />,
    <Slide3 key={2} />,
    <Slide4 key={3} onComplete={handleComplete} loading={loading} />,
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: BG,
      display: "flex", flexDirection: "column",
      fontFamily: T.font.sans, color: T.color.text,
      overflow: "hidden",
    }}>
      {/* Ambient blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: "40vw", height: "40vw", borderRadius: "50%", background: accent, filter: "blur(100px)", opacity: 0.07 }} />
        <div style={{ position: "absolute", bottom: "-15%", right: "-8%", width: "45vw", height: "45vw", borderRadius: "50%", background: accentCont, filter: "blur(120px)", opacity: 0.05 }} />
        <div style={{ position: "absolute", top: "30%", right: "10%", width: "30vw", height: "30vw", borderRadius: "50%", background: T.color.warning, filter: "blur(100px)", opacity: 0.04 }} />
      </div>

      {/* Header */}
      <header style={{
        position: "relative", zIndex: 10,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px 32px",
      }}>
        <span style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "1.5rem", color: accent, letterSpacing: "-0.02em" }}>
          Noema
        </span>
        <span style={{ fontSize: "0.6rem", color: T.color.textMuted, textTransform: "uppercase", letterSpacing: "0.15em" }}>
          Étape {slide + 1} sur 4
        </span>
      </header>

      {/* Slide content with Framer Motion transitions */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", zIndex: 1, overflow: "hidden" }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={slide}
            initial={{ opacity: 0, x: animDir === "next" ? 32 : -32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: animDir === "next" ? -32 : 32 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 40px" }}
          >
            {slides[slide]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer — navigation */}
      <footer style={{
        position: "relative", zIndex: 10,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px 32px 36px",
      }}>
        {/* Précédent */}
        <button
          onClick={goPrev}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none",
            color: T.color.text, opacity: slide === 0 ? 0 : 0.6,
            cursor: slide === 0 ? "default" : "pointer",
            fontSize: "0.8rem", fontWeight: 500,
            textTransform: "uppercase", letterSpacing: "0.1em",
            fontFamily: T.font.sans,
            pointerEvents: slide === 0 ? "none" : "auto",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => slide > 0 && (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = slide === 0 ? "0" : "0.6")}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "1rem", fontVariationSettings: "'FILL' 0, 'wght' 300" }}>arrow_back</span>
          Précédent
        </button>

        {/* Progress */}
        <Progress slide={slide} />

        {/* Suivant */}
        {slide < 3 ? (
          <button
            onClick={goNext}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 24px", borderRadius: T.radius.full,
              background: `linear-gradient(135deg, ${accent} 0%, ${accentCont} 100%)`,
              color: "#111318", border: "none", cursor: "pointer",
              fontFamily: T.font.sans, fontWeight: 700, fontSize: "0.8rem",
              letterSpacing: "0.1em", textTransform: "uppercase",
              boxShadow: "0 4px 20px rgba(120,134,255,0.2)",
              transition: "transform 0.15s, opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Suivant
            <span className="material-symbols-outlined" style={{ fontSize: "1rem", fontVariationSettings: "'FILL' 0, 'wght' 300" }}>arrow_forward</span>
          </button>
        ) : (
          <div style={{ width: 120 }} />
        )}
      </footer>
    </div>
  );
}
