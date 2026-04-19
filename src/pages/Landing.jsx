/* eslint-disable */
import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import OrbPhase from "../components/v2/OrbPhase";
import { T } from "../design-system/tokens";

// ─────────────────────────────────────────────────────────────────────────────
// Landing — Scrollytelling
// Sections : Hero → Manifeste → Timeline Coach → Features → Numbers → CTA
// ─────────────────────────────────────────────────────────────────────────────

const BG = `
  radial-gradient(ellipse 80% 50% at 20% -10%, rgba(120,134,255,0.09) 0%, transparent 60%),
  radial-gradient(ellipse 60% 40% at 85% 110%, rgba(189,194,255,0.05) 0%, transparent 55%),
  #0c0e13
`;

const inView = (delay = 0, dir = "up") => ({
  initial:     { opacity: 0, y: dir === "up" ? 28 : dir === "down" ? -28 : 0, x: dir === "left" ? 28 : dir === "right" ? -28 : 0 },
  whileInView: { opacity: 1, y: 0, x: 0 },
  viewport:    { once: true, margin: "-80px" },
  transition:  { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] },
});

function Parallax({ children, speed = 0.3, style = {} }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${speed * -80}px`, `${speed * 80}px`]);
  return (
    <motion.div ref={ref} style={{ y, ...style }}>
      {children}
    </motion.div>
  );
}

function Divider() {
  return (
    <motion.div
      {...inView(0)}
      style={{
        height: 1,
        background: `linear-gradient(90deg, transparent 0%, ${T.color.accent.default}55 40%, ${T.color.accent.default}55 60%, transparent 100%)`,
        margin: "0 auto",
        maxWidth: 680,
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
export default function Landing({ onNav }) {
  const heroRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY       = useTransform(heroScroll, [0, 1], ["0px", "80px"]);
  const heroOpacity = useTransform(heroScroll, [0, 0.6], [1, 0]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const fonts = [
      "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap",
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap",
    ];
    fonts.forEach((href) => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
      }
    });
  }, []);

  return (
    <div style={{ background: BG, color: T.color.text, fontFamily: T.font.sans, margin: 0, minHeight: "100vh", overflowX: "hidden" }}>

      {/* ── Ambient permanent ── */}
      <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <motion.div
          animate={{ scale: [1, 1.35, 0.9, 1.2, 1], x: [0, 60, -40, 30, 0], y: [0, -60, 40, -25, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", top: "-20%", left: "-15%", width: "70%", height: "70%", borderRadius: "50%", background: "radial-gradient(circle, rgba(120,134,255,0.14) 0%, transparent 65%)", filter: "blur(60px)" }}
        />
        <motion.div
          animate={{ scale: [1, 1.2, 0.85, 1.15, 1], x: [0, -50, 35, -20, 0], y: [0, 50, -30, 20, 0] }}
          transition={{ duration: 34, repeat: Infinity, ease: "easeInOut", delay: 10 }}
          style={{ position: "absolute", top: "40%", right: "-20%", width: "55%", height: "55%", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,182,138,0.09) 0%, transparent 65%)", filter: "blur(60px)" }}
        />
        <motion.div
          animate={{ scale: [1, 1.25, 0.92, 1.1, 1], x: [0, 40, -25, 15, 0], y: [0, -35, 45, -20, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 6 }}
          style={{ position: "absolute", bottom: "-10%", left: "20%", width: "60%", height: "50%", borderRadius: "50%", background: "radial-gradient(circle, rgba(189,194,255,0.08) 0%, transparent 65%)", filter: "blur(60px)" }}
        />
      </div>

      {/* ── Nav ── */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(12,14,19,0.85)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        <nav style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", boxSizing: "border-box" }}>
          <span style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "1.5rem", color: T.color.accent.default, letterSpacing: "-0.03em" }}>
            Noema
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <button
              onClick={() => onNav?.("login")}
              style={{ background: "none", border: "none", color: T.color.textMuted, fontFamily: T.font.sans, fontWeight: 500, fontSize: "0.9rem", cursor: "pointer", transition: "color 0.2s", padding: "6px 4px" }}
              onMouseEnter={(e) => e.currentTarget.style.color = T.color.text}
              onMouseLeave={(e) => e.currentTarget.style.color = T.color.textMuted}
            >
              Se connecter
            </button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onNav?.("login")}
              style={{ background: `linear-gradient(135deg, ${T.color.accent.default}, ${T.color.accent.container})`, color: "#00118c", border: "none", borderRadius: T.radius.full, padding: "9px 22px", fontFamily: T.font.sans, fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }}
            >
              Commencer
            </motion.button>
          </div>
        </nav>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* HERO                                                                    */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 40px 60px", position: "relative", zIndex: 1 }}>
        <motion.div style={{ y: heroY, opacity: heroOpacity, textAlign: "center", maxWidth: 820 }}>
          {/* Orb */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}
          >
            <OrbPhase size={72} typing={false} phaseContext={{ id: "perdu" }} />
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 16px", borderRadius: T.radius.full, background: T.color.accent.soft, border: `1px solid rgba(189,194,255,0.2)`, marginBottom: 32 }}
          >
            <span className="material-symbols-outlined" style={{ color: T.color.accent.default, fontSize: "0.85rem", fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>psychology</span>
            <span style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.16em", color: T.color.accent.default, fontWeight: 700 }}>Pour ceux qui avancent sans savoir vraiment vers quoi</span>
          </motion.div>

          {/* H1 */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "clamp(2.6rem, 7vw, 5.5rem)", lineHeight: 0.95, letterSpacing: "-0.04em", color: T.color.text, margin: "0 0 32px" }}
          >
            Tu n'as pas raté ta vie.{" "}
            <span style={{ background: `linear-gradient(135deg, ${T.color.accent.default} 0%, ${T.color.accent.container} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Tu ne t'es juste jamais vraiment connu.
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.82, ease: "easeOut" }}
            style={{ color: T.color.textSub, fontSize: "1.0625rem", lineHeight: 1.88, maxWidth: 560, margin: "0 auto 44px", fontWeight: 300, letterSpacing: "0.005em" }}
          >
            La plupart des gens ne manquent pas de volonté. Ils manquent de quelqu'un qui les connaît vraiment — leurs forces réelles, leurs blocages profonds, ce qui les retient encore. Noema est ça.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.96, ease: "easeOut" }}
            style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNav?.("login")}
              style={{ background: `linear-gradient(135deg, ${T.color.accent.default}, ${T.color.accent.container})`, color: "#00118c", border: "none", borderRadius: T.radius.full, padding: "17px 40px", fontSize: "1rem", fontFamily: T.font.sans, fontWeight: 700, cursor: "pointer", boxShadow: `0 16px 40px ${T.color.accent.glow}` }}
            >
              Commencer gratuitement
            </motion.button>
            <motion.button
              whileHover={{ borderColor: "rgba(189,194,255,0.35)", backgroundColor: "rgba(189,194,255,0.05)" }}
              onClick={() => document.getElementById("coach-timeline")?.scrollIntoView({ behavior: "smooth" })}
              style={{ background: "none", border: `1px solid rgba(69,70,85,0.3)`, borderRadius: T.radius.full, padding: "17px 40px", fontSize: "1rem", fontFamily: T.font.sans, fontWeight: 600, color: T.color.text, cursor: "pointer", transition: "border-color 0.2s, background 0.2s" }}
            >
              Voir comment ça marche
            </motion.button>
          </motion.div>

          {/* Scroll cue */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 0.6 }}
            style={{ marginTop: 72, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
          >
            <span style={{ fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase", color: T.color.textOff }}>Découvrir</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="material-symbols-outlined" style={{ color: T.color.textOff, fontSize: "1.25rem", fontVariationSettings: "'FILL' 0, 'wght' 200" }}>keyboard_arrow_down</span>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MANIFESTE                                                               */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: "120px 40px", position: "relative", zIndex: 1, overflow: "hidden" }}>
        <Parallax speed={0.2} style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "60%", height: "100%", background: `radial-gradient(ellipse, ${T.color.accent.glow} 0%, transparent 70%)`, pointerEvents: "none" }} />
        <motion.div {...inView(0)} style={{ textAlign: "center", maxWidth: 720, margin: "0 auto", position: "relative" }}>
          <p style={{ fontSize: "0.6rem", letterSpacing: "0.22em", textTransform: "uppercase", color: T.color.textMuted, marginBottom: 28, fontWeight: 700 }}>
            La promesse
          </p>
          <p style={{
            fontFamily:    T.font.serif,
            fontStyle:     "italic",
            fontSize:      "clamp(1.6rem, 4vw, 2.5rem)",
            lineHeight:    1.35,
            letterSpacing: "-0.02em",
            color:         T.color.text,
            margin:        0,
          }}>
            "La plupart des gens passent des années à se demander pourquoi ils n'avancent pas. La réponse n'est pas dans plus d'efforts. Elle est dans une connaissance plus profonde de soi-même."
          </p>
          <motion.div {...inView(0.2)} style={{ width: 40, height: 2, background: `linear-gradient(90deg, transparent, ${T.color.accent.default}, transparent)`, margin: "36px auto 0" }} />
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* COMMENT IL DEVIENT TON COACH                                            */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section id="coach-timeline" style={{ padding: "80px 40px 120px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.div {...inView(0)} style={{ textAlign: "center", marginBottom: 80 }}>
            <p style={{ fontSize: "0.6rem", letterSpacing: "0.22em", textTransform: "uppercase", color: T.color.textMuted, marginBottom: 16, fontWeight: 700 }}>
              La progression
            </p>
            <h2 style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", lineHeight: 1.1, letterSpacing: "-0.03em", color: T.color.text, margin: "0 0 16px" }}>
              Il devient plus précis à chaque session.
            </h2>
            <p style={{ color: T.color.textSub, fontSize: "1rem", lineHeight: 1.8, maxWidth: 480, margin: "0 auto" }}>
              Ce n'est pas un outil statique. C'est un espace qui apprend à te connaître.
            </p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
            {/* Timeline steps */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                {
                  num: "01",
                  session: "Session 1",
                  title: "Il t'écoute",
                  body: "Il identifie tes premières forces et blocages, pose les fondations de ton profil.",
                  color: T.color.accent.default,
                },
                {
                  num: "02",
                  session: "Session 3",
                  title: "Il relie les patterns",
                  body: "Il commence à voir ce qui revient — contradictions, résistances, schémas récurrents.",
                  color: T.color.warning,
                },
                {
                  num: "03",
                  session: "Session 10",
                  title: "Il anticipe",
                  body: "Il te pose les bonnes questions avant que tu les formules. Il connaît ce qui te bloque avant que tu en parles.",
                  color: T.color.success,
                },
              ].map((item, i) => (
                <motion.div key={item.num} {...inView(i * 0.18)} style={{ display: "flex", gap: 28, paddingBottom: i < 2 ? 48 : 0 }}>
                  {/* Left col: number + line */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: "50%",
                      background: T.color.elevated,
                      border: `1px solid ${item.color}44`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: `0 0 24px ${item.color}33`,
                      flexShrink: 0,
                    }}>
                      <span style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "1.1rem", color: item.color }}>{item.num}</span>
                    </div>
                    {i < 2 && (
                      <div style={{ width: 1, flex: 1, background: `linear-gradient(180deg, ${item.color}44, transparent)`, marginTop: 8 }} />
                    )}
                  </div>
                  {/* Right col: content */}
                  <div style={{ paddingTop: 12, flex: 1 }}>
                    <span style={{ fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: item.color, fontWeight: 700 }}>{item.session}</span>
                    <h3 style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "1.5rem", color: T.color.text, margin: "8px 0 10px", letterSpacing: "-0.02em" }}>
                      {item.title}
                    </h3>
                    <p style={{ margin: 0, color: T.color.textSub, fontSize: "0.9375rem", lineHeight: 1.82 }}>{item.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Visual: growing map */}
            <motion.div {...inView(0.3, "right")}>
              <div style={{
                background: T.glass.md.background,
                backdropFilter: T.glass.md.backdropFilter,
                WebkitBackdropFilter: T.glass.md.WebkitBackdropFilter,
                border: T.glass.md.border,
                borderRadius: T.radius.xl,
                padding: 36,
                display: "flex", flexDirection: "column", gap: 24,
              }}>
                <p style={{ margin: 0, fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: T.color.textMuted, fontWeight: 700 }}>Profil en construction</p>

                {[
                  { label: "Créativité", pct: 94, color: T.color.accent.default },
                  { label: "Résilience", pct: 78, color: T.color.warning },
                  { label: "Expression", pct: 65, color: T.color.success },
                  { label: "Clarté stratégique", pct: 52, color: T.color.accent.default },
                ].map((b, i) => (
                  <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "1.4rem", color: `${b.color}cc`, width: 26, flexShrink: 0, textAlign: "right" }}>
                      0{i + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 6px", fontSize: "0.82rem", fontWeight: 600, color: T.color.text }}>{b.label}</p>
                      <div style={{ height: 2, borderRadius: 9999, background: "rgba(255,255,255,0.06)" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${b.pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.2, delay: 0.3 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                          style={{ height: "100%", borderRadius: 9999, background: `linear-gradient(90deg, ${b.color}, ${b.color}88)`, boxShadow: `0 0 8px ${b.color}66` }}
                        />
                      </div>
                    </div>
                    <span style={{ fontSize: "0.6rem", color: b.color, fontWeight: 700, flexShrink: 0 }}>{b.pct}%</span>
                  </div>
                ))}

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.62rem", color: T.color.textMuted, letterSpacing: "0.1em" }}>Session 7 · profil actif</span>
                  <span style={{ fontSize: "0.62rem", color: T.color.accent.default, letterSpacing: "0.1em" }}>En cours ✓</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* FEATURES — 3 glass cards                                               */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: "80px 40px 120px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Divider />
          <motion.div {...inView(0)} style={{ textAlign: "center", margin: "72px 0 56px" }}>
            <p style={{ fontSize: "0.6rem", letterSpacing: "0.22em", textTransform: "uppercase", color: T.color.textMuted, marginBottom: 16, fontWeight: 700 }}>Ce qui t'attend</p>
            <h2 style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", lineHeight: 1.1, letterSpacing: "-0.03em", color: T.color.text, margin: 0 }}>
              Trois surfaces, un seul fil.
            </h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {[
              {
                icon: "forum",
                color: T.color.accent.default,
                title: "Chat avec mémoire",
                body: "Il reprend là où vous vous étiez arrêtés — intention active, blocages en cours, dernière clarté atteinte.",
              },
              {
                icon: "hub",
                color: T.color.warning,
                title: "Cartographie vivante",
                body: "Forces, blocages, contradictions — visualisés et reliés. Une carte de ton esprit qui se précise à chaque échange.",
              },
              {
                icon: "auto_stories",
                color: T.color.success,
                title: "Rituel quotidien",
                body: "Journal + intention du jour, liés au chat. Transformer une conversation en un pas concret.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                {...inView(i * 0.12)}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.2 }}
                style={{
                  background:           T.glass.md.background,
                  backdropFilter:       T.glass.md.backdropFilter,
                  WebkitBackdropFilter: T.glass.md.WebkitBackdropFilter,
                  border:               T.glass.md.border,
                  borderRadius:         T.radius.xl,
                  padding:              36,
                  borderTop:            `2px solid ${item.color}55`,
                  cursor:               "default",
                }}
              >
                <span className="material-symbols-outlined" style={{ color: item.color, fontSize: "1.5rem", fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24", marginBottom: 20, display: "block" }}>
                  {item.icon}
                </span>
                <h4 style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "1.35rem", color: T.color.text, lineHeight: 1.2, margin: "0 0 14px" }}>
                  {item.title}
                </h4>
                <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.85, color: T.color.textSub }}>
                  {item.body}
                </p>
              </motion.div>
            ))}
          </div>

          <Divider />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SOCIAL PROOF / NUMBERS                                                  */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 40px", position: "relative", zIndex: 1 }}>
        <Parallax speed={0.15} style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "50%", height: "80%", background: `radial-gradient(circle, rgba(255,182,138,0.07) 0%, transparent 70%)`, pointerEvents: "none", filter: "blur(40px)" }} />

        <motion.div {...inView(0)} style={{ textAlign: "center", marginBottom: 72 }}>
          <p style={{ fontSize: "0.6rem", letterSpacing: "0.22em", textTransform: "uppercase", color: T.color.textMuted, marginBottom: 16, fontWeight: 700 }}>Ce que ça change</p>
          <h2 style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", lineHeight: 1.1, letterSpacing: "-0.03em", color: T.color.text, margin: 0 }}>
            Ce qui change, session après session.
          </h2>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40, maxWidth: 900, margin: "0 auto" }}>
          {[
            { number: "S1", label: "Première session — Noema cartographie tes forces et blocages", color: T.color.accent.default },
            { number: "S3", label: "Il commence à voir ce qui revient. Les patterns. Les résistances.", color: T.color.warning },
            { number: "S10", label: "Il anticipe. Il pose les questions avant que tu les formules.", color: T.color.success },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              {...inView(i * 0.15)}
              style={{ textAlign: "center", position: "relative", zIndex: 1 }}
            >
              <p style={{
                fontFamily: T.font.serif,
                fontStyle: "italic",
                fontSize: "clamp(3rem, 6vw, 4.5rem)",
                lineHeight: 1,
                letterSpacing: "-0.04em",
                color: item.color,
                margin: "0 0 16px",
              }}>
                {item.number}
              </p>
              <p style={{ color: T.color.textSub, fontSize: "0.9375rem", lineHeight: 1.65, margin: 0, maxWidth: 220, marginInline: "auto" }}>
                {item.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* CTA FINAL                                                               */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: "80px 40px 140px", position: "relative", zIndex: 1 }}>
        <motion.div
          {...inView(0)}
          style={{
            maxWidth:             660,
            margin:               "0 auto",
            background:           T.glass.md.background,
            backdropFilter:       T.glass.md.backdropFilter,
            WebkitBackdropFilter: T.glass.md.WebkitBackdropFilter,
            border:               `1px solid rgba(189,194,255,0.12)`,
            borderRadius:         T.radius["2xl"],
            padding:              "64px 56px",
            textAlign:            "center",
            position:             "relative",
            overflow:             "hidden",
          }}
        >
          <Parallax speed={0.1} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "90%", height: 200, background: T.color.accent.glow, filter: "blur(80px)", borderRadius: 9999 }} />
          </Parallax>
          <div style={{ position: "relative" }}>
            <p style={{ fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: T.color.accent.default, fontWeight: 700, marginBottom: 20 }}>
              Première session gratuite
            </p>
            <h2 style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", lineHeight: 1.1, letterSpacing: "-0.03em", color: T.color.text, margin: "0 0 18px" }}>
              Commence le fil. Noema se souvient.
            </h2>
            <p style={{ color: T.color.textSub, fontSize: "0.9375rem", lineHeight: 1.82, marginBottom: 16 }}>
              Pas d'inscription longue. Pas de carte requise.
              <br />Une conversation pour commencer à y voir plus clair.
            </p>
            <p style={{ color: T.color.textMuted, fontSize: "0.78rem", marginBottom: 32, letterSpacing: "0.04em" }}>
              8 messages gratuits · 19 € / mois ensuite · Sans engagement
            </p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNav?.("login")}
              style={{ background: `linear-gradient(135deg, ${T.color.accent.default}, ${T.color.accent.container})`, color: "#00118c", border: "none", borderRadius: T.radius.full, padding: "18px 48px", fontSize: "1.0625rem", fontFamily: T.font.sans, fontWeight: 700, cursor: "pointer", boxShadow: `0 16px 40px ${T.color.accent.glow}` }}
            >
              Commencer gratuitement
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, borderTop: `1px solid rgba(69,70,85,0.1)`, backgroundColor: T.color.surface, padding: "36px 40px" }}>
        <div>
          <div style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "1.1rem", color: T.color.text, marginBottom: 6 }}>Noema</div>
          <p style={{ fontFamily: T.font.sans, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: T.color.textOff, margin: 0 }}>
            © 2026 Noema · Conversation introspective continue.
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 28 }}>
          {[
            { label: "Confidentialité", target: "privacy" },
            { label: "Conditions",      target: "terms" },
            { label: "IA éthique",      target: "ethical-ai" },
            { label: "Contact",         target: "contact" },
          ].map(({ label, target }) => (
            <button
              key={label}
              onClick={() => onNav?.(target)}
              style={{ background: "none", border: "none", padding: 0, fontFamily: T.font.sans, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: T.color.textOff, cursor: "pointer", transition: "color 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.color = T.color.accent.default}
              onMouseLeave={(e) => e.currentTarget.style.color = T.color.textOff}
            >
              {label}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
