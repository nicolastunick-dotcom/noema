import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DOMPurify from "dompurify";
import { fmt, getTime } from "../../utils/helpers";
import OrbPhase from "../../components/v2/OrbPhase";
import { useNoemaRuntime } from "../../context/NoemaContext";
import { T, phaseButtonTextColor } from "../../design-system/tokens";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useVisualViewportOffset } from "../../hooks/useVisualViewportOffset";

// ─────────────────────────────────────────────────────────────────────────────
// ChatV2 — Refonte complète du chat Noema
// Utilise useNoemaRuntime() — aucune prop nécessaire.
// Nouveautés vs ChatPage :
//   • Ambient blobs phase-réactifs (phaseContext.glow)
//   • Entrées de messages animées (AnimatePresence)
//   • Bubble Noema avec bordure gauche accent phase
//   • Empty state centré + OrbPhase
//   • Bouton send phase-aware (Framer Motion whileTap)
//   • Top info simplifié (pas de 4 cartes empilées)
// ─────────────────────────────────────────────────────────────────────────────

const NAV_HEIGHT = T.nav.height;
const TODAY = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const QUOTA_LOW_THRESHOLD = 3;

const PROMPTS = {
  welcome: [
    "Je veux juste parler",
    "Je ne sais pas encore pourquoi je suis là",
    "Je me sens bloqué sans savoir pourquoi",
    "J'ai du mal à prendre une décision importante",
    "Je veux comprendre ce qui me freine vraiment",
  ],
  resume:  (prompt) => [
    prompt ? `Reprenons : ${prompt}` : "Je veux reprendre là où on s'est arrêté",
    "Quelque chose s'est précisé depuis la dernière fois",
    "Je veux ouvrir un nouveau sujet aujourd'hui",
  ],
  restart: [
    "Je veux repartir sur ce qui compte maintenant",
    "J'ai besoin d'y voir plus clair sur une décision",
    "Quelque chose de nouveau est apparu",
  ],
};

export default function ChatV2() {
  const {
    msgs, typing, input, setInput,
    phaseContext, quotaState, chatContinuity, proofState,
    send, newSession, handleLogout, onNav,
    taRef, sb,
  } = useNoemaRuntime();

  const feedEndRef = useRef(null);
  const [inputFocused, setInputFocused] = useState(false);
  const isCompact = useMediaQuery("(max-width: 640px)");
  const keyboardOffset = useVisualViewportOffset();
  const isBlocked  = Boolean(quotaState?.exhausted);
  const isTrial    = Boolean(quotaState?.isTrial);
  const showQuotaHint = !isBlocked
    && Number.isFinite(quotaState?.remaining)
    && quotaState.remaining <= QUOTA_LOW_THRESHOLD;
  const mode       = chatContinuity?.mode ?? "welcome";
  const canSend    = Boolean(input.trim()) && !typing && !isBlocked;

  // Pré-amorce Jour 0 : si l'utilisateur arrive depuis le CTA première session,
  // envoyer automatiquement le premier prompt d'ouverture
  useEffect(() => {
    const isFirstSession = localStorage.getItem("noema_first_session") === "true";
    if (isFirstSession && msgs.length === 0 && !typing && !isBlocked) {
      localStorage.removeItem("noema_first_session");
      const openingPrompt = PROMPTS.welcome[0];
      // Délai court pour laisser le composant se monter complètement
      const timer = setTimeout(() => send(openingPrompt), 400);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prompts = mode === "resume"
    ? PROMPTS.resume(chatContinuity?.prompt)
    : mode === "restart"
      ? PROMPTS.restart
      : PROMPTS.welcome;

  // Scroll to bottom on new message / typing change
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  const handleInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  // Phase-derived values
  const accent     = phaseContext?.accent     ?? T.color.accent.default;
  const glow       = phaseContext?.glow       ?? T.color.accent.glow;
  const accentSoft = phaseContext?.accentSoft ?? T.color.accent.soft;
  const btnTextColor = phaseButtonTextColor(phaseContext?.id);
  const composerBottom = isCompact
    ? `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom) + ${keyboardOffset}px)`
    : `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom))`;
  const feedBottomPadding = isCompact
    ? `calc(190px + env(safe-area-inset-bottom) + ${keyboardOffset}px)`
    : `calc(200px + env(safe-area-inset-bottom))`;

  return (
    <div style={{
      backgroundColor: T.color.surface,
      height: "100dvh",
      fontFamily: T.font.sans,
      color: T.color.text,
      position: "relative",
      overflow: "hidden",
    }}>

      {/* ── Ambient phase-réactif ── */}
      <motion.div
        key={`blob-top-${phaseContext?.id}`}
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 0.14, 0.22, 0.14],
          scale: [1, 1.10, 1],
        }}
        transition={{
          opacity: { duration: 1.8, times: [0, 0.2, 0.5, 1] },
          scale: { duration: 9, repeat: Infinity, ease: "easeInOut" },
        }}
        style={{
          position: "fixed", borderRadius: "50%", pointerEvents: "none", zIndex: 0,
          width: 560, height: 560, top: -140, right: -120,
          background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
        }}
      />
      <motion.div
        key={`blob-bottom-${phaseContext?.id}`}
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 0.10, 0.18, 0.10],
          scale: [1, 1.08, 1],
        }}
        transition={{
          opacity: { duration: 1.8, times: [0, 0.2, 0.5, 1] },
          scale: { duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 },
        }}
        style={{
          position: "fixed", borderRadius: "50%", pointerEvents: "none", zIndex: 0,
          width: 400, height: 400, bottom: "10%", left: -100,
          background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
        }}
      />

      {/* ── Header ── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        ...T.glass.md,
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        borderRadius: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: isCompact ? "12px 16px" : "14px 24px",
      }}>
        <button
          onClick={() => onNav("landing")}
          style={{
            fontFamily: T.font.serif, fontStyle: "italic",
            fontSize: isCompact ? "1.35rem" : "1.5rem", color: accent,
            letterSpacing: "-0.02em", background: "none",
            border: "none", cursor: "pointer", padding: 0,
            transition: "color 0.25s",
          }}
        >Noema</button>

        <div style={{ display: "flex", gap: isCompact ? 2 : 6 }}>
          <button onClick={newSession} style={{ ...ghostBtn, minHeight: 44, padding: isCompact ? "6px 8px" : "6px 12px" }}>
            {isCompact ? "Nouvelle" : "Nouvelle session"}
          </button>
          {sb && (
            <button onClick={handleLogout} style={{ ...ghostBtn, minHeight: 44, padding: isCompact ? "6px 8px" : "6px 12px" }}>
              {isCompact ? "Sortir" : "Déconnexion"}
            </button>
          )}
        </div>
      </header>

      {/* ── Feed ── */}
      <main style={{
        position: "absolute",
        top: 57, bottom: 0, left: 0, right: 0,
        overflowY: "auto", overflowX: "hidden", zIndex: 1,
      }}>
        <div style={{
          maxWidth: T.layout.pageMax, margin: "0 auto",
          padding: isCompact ? `20px 16px ${feedBottomPadding}` : `24px 20px ${feedBottomPadding}`,
          display: "flex", flexDirection: "column", gap: 0,
        }}>

          {/* Date pill */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
            <span style={{
              fontSize: T.type.caption.size, textTransform: "uppercase",
              letterSpacing: T.type.caption.ls, color: T.color.textMuted,
              padding: "4px 14px", borderRadius: T.radius.full,
              background: "rgba(22,23,29,0.5)", border: "1px solid rgba(69,70,85,0.12)",
            }}>{TODAY}</span>
          </div>

          {/* Phase pill — toujours visible, discret */}
          {phaseContext && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 12, marginBottom: 24,
              padding: "8px 14px", borderRadius: T.radius.lg,
              background: accentSoft,
              border: `1px solid ${phaseContext.border}`,
            }}>
              <span style={{
                fontSize: T.type.caption.size, textTransform: "uppercase",
                letterSpacing: T.type.caption.ls, color: accent, fontWeight: 700,
              }}>
                {phaseContext.navLabel}
              </span>
              <span style={{
                fontSize: T.type.caption.size, color: T.color.textSub,
                letterSpacing: "0.04em",
              }}>
                {phaseContext.paceLabel}
              </span>
            </div>
          )}

          {/* Continuité — uniquement si resume + pas encore de messages */}
          {mode === "resume" && chatContinuity?.items?.length > 0 && msgs.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={T.motion.normal}
              style={{
                marginBottom: 24,
                padding: "16px 18px", borderRadius: T.radius["2xl"],
                ...T.glass.sm,
                border: `1px solid ${phaseContext?.border ?? "rgba(255,255,255,0.06)"}`,
              }}
            >
              <p style={{
                fontSize: T.type.caption.size, textTransform: "uppercase",
                letterSpacing: T.type.caption.ls, color: accent,
                fontWeight: 700, marginBottom: 12,
              }}>
                {chatContinuity.title}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {chatContinuity.items.map((item) => (
                  <div key={`${item.label}-${item.value}`} style={{
                    padding: "10px 12px", borderRadius: T.radius.md,
                    background: "rgba(12,14,19,0.45)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}>
                    <p style={{
                      margin: 0, fontSize: "0.6rem", textTransform: "uppercase",
                      letterSpacing: "0.16em", color: T.color.textMuted, fontWeight: 700,
                    }}>{item.label}</p>
                    <p style={{
                      margin: "6px 0 0",
                      fontSize: T.type.bodySm.size, lineHeight: T.type.bodySm.lh,
                      color: T.color.text,
                    }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Empty state ── */}
          {msgs.length === 0 && !typing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", padding: "48px 16px 32px",
                gap: 20, textAlign: "center",
              }}
            >
              <OrbPhase size={72} typing={false} phaseContext={phaseContext} />

              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 360 }}>
                <h2 style={{
                  fontFamily: T.font.serif, fontStyle: "italic",
                  fontSize: T.type.h1.size, lineHeight: T.type.h1.lh,
                  letterSpacing: T.type.h1.ls, color: T.color.text, margin: 0,
                }}>
                  {mode === "resume" ? "On reprend." : mode === "restart" ? "On repart." : "Bonjour."}
                </h2>
                <p style={{
                  fontSize: T.type.bodySm.size, lineHeight: T.type.bodySm.lh,
                  color: T.color.textSub, margin: 0,
                }}>
                  {mode === "resume"
                    ? "Le fil reste visible. Continue d'où tu t'étais arrêté."
                    : mode === "restart"
                      ? "Un nouveau fil. Garde seulement ce qui est vivant."
                      : "Dis-moi ce qui t'occupe l'esprit."}
                </p>
              </div>

              <div style={{
                display: "flex", flexDirection: "column",
                gap: 8, width: "100%", maxWidth: 340,
              }}>
                {prompts.map((p) => (
                  <motion.button
                    key={p}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => send(p)}
                    style={{
                      padding: "11px 16px",
                      ...T.glass.sm,
                      borderRadius: T.radius.md,
                      color: T.color.textSub,
                      fontSize: T.type.bodySm.size,
                      textAlign: "left", cursor: "pointer",
                      fontFamily: T.font.sans,
                      transition: "color 0.15s, border-color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = T.color.text;
                      e.currentTarget.style.borderColor = `${accent}4d`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = T.color.textSub;
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                    }}
                  >{p}</motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Messages ── */}
          <AnimatePresence initial={false}>
            {msgs.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  maxWidth: isCompact ? (m.role === "user" ? "88%" : "96%") : (m.role === "user" ? "78%" : "90%"),
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: i < msgs.length - 1 ? 28 : 0,
                }}
              >
                {m.role === "noema" ? (
                  <div style={{
                    borderLeft:   `2.5px solid ${accent}`,
                    borderTop:    "1px solid rgba(255,255,255,0.05)",
                    borderRight:  "1px solid rgba(255,255,255,0.05)",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    background:   "rgba(18,20,26,0.70)",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                    borderRadius: "2px 20px 20px 20px",
                    padding:      isCompact ? "16px 17px" : "20px 22px",
                    position:     "relative",
                    overflow:     "hidden",
                  }}>
                    {/* Glow intérieur discret */}
                    <div style={{
                      position: "absolute", top: -30, left: -30,
                      width: 100, height: 100,
                      background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
                      opacity: 0.4, pointerEvents: "none",
                    }} />
                    <div
                      style={{
                        fontFamily:    m.isErr ? T.font.sans : T.font.handwriting,
                        fontSize:      m.isErr ? T.type.body.size : "1.5rem",
                        lineHeight:    1.65,
                        letterSpacing: "0.01em",
                        color:         m.isErr ? T.color.error : T.color.textSub,
                        position:      "relative",
                        overflowWrap:  "anywhere",
                      }}
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(fmt(m.text)) }}
                    />
                    {m.hasUpdate && (
                      <div style={{
                        marginTop: 14, padding: "8px 12px",
                        background: accentSoft,
                        border: `1px solid ${phaseContext?.border ?? "rgba(189,194,255,0.15)"}`,
                        borderRadius: T.radius.sm,
                        fontSize: T.type.label.size, color: accent,
                      }}>
                        {m.updateLabel || "Ce qui s'est précisé"}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{
                    ...T.glass.sm,
                    background: "rgba(38,40,46,0.80)",
                    borderRadius: "20px 2px 20px 20px",
                    padding: isCompact ? "12px 15px" : "13px 18px",
                  }}>
                    <p style={{
                      fontFamily: T.font.handwriting,
                      fontSize: "1.35rem", lineHeight: 1.6,
                      letterSpacing: "0.01em",
                      color: T.color.text, margin: 0,
                      overflowWrap: "anywhere",
                    }}>{m.text}</p>
                  </div>
                )}

                <span style={{
                  fontSize: "0.6rem", textTransform: "uppercase",
                  letterSpacing: "0.15em", color: T.color.textOff,
                  fontWeight: 500,
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  marginLeft: m.role === "noema" ? 6 : 0,
                  marginRight: m.role === "user" ? 6 : 0,
                }}>
                  {m.role === "noema" ? "NOEMA" : "VOUS"} · {m.time}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {typing && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ alignSelf: "flex-start", padding: "6px 0 6px 4px", marginBottom: 28 }}
            >
              <OrbPhase size={46} typing={true} phaseContext={phaseContext} />
            </motion.div>
          )}

          {/* Quota épuisé — essai */}
          {isBlocked && isTrial && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={T.motion.normal}
              style={{
                alignSelf: "stretch", marginTop: 16,
                padding: "20px 22px", borderRadius: T.radius["2xl"],
                background: "rgba(255,182,138,0.07)",
                border: "1px solid rgba(255,182,138,0.18)",
                display: "flex", flexDirection: "column", gap: 14,
              }}
            >
              <div>
                <p style={{
                  margin: 0, fontSize: T.type.caption.size,
                  textTransform: "uppercase", letterSpacing: T.type.caption.ls,
                  color: T.color.warning, fontWeight: 700,
                }}>Essai du jour terminé</p>
                <p style={{
                  margin: "10px 0 0", fontSize: T.type.bodyLg.size,
                  lineHeight: T.type.bodyLg.lh, color: T.color.text,
                }}>
                  Ce qui s'est précisé ici reste visible. Continue avec Noema pour garder ce fil vivant.
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onNav?.("pricing")}
                  style={{
                    padding: "11px 18px", borderRadius: T.radius.full,
                    border: "none", cursor: "pointer",
                    fontWeight: 700, fontSize: T.type.bodySm.size,
                    color: "#331a00",
                    background: "linear-gradient(135deg, #ffddb7 0%, #ffb68a 100%)",
                    fontFamily: T.font.sans,
                  }}
                >Garder ce fil vivant</motion.button>
              </div>
            </motion.div>
          )}

          <div ref={feedEndRef} />
        </div>
      </main>

      {/* ── Input area ── */}
      <div style={{
        position: "fixed",
        bottom: composerBottom,
        left: 0, right: 0, zIndex: 40,
        background: `linear-gradient(to top, ${T.color.surface} 52%, transparent)`,
        paddingTop: isCompact ? 34 : 44,
        paddingBottom: 10,
      }}>
        <div style={{ maxWidth: T.layout.pageMax, margin: "0 auto", padding: isCompact ? "0 12px" : "0 20px" }}>
          {isBlocked ? (
            <UpgradeBar isTrial={isTrial} onPricing={() => onNav?.("pricing")} />
          ) : (
            <div style={{
              ...T.glass.input,
              borderRadius: T.radius.xl,
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
              padding: isCompact ? "9px 9px 9px 14px" : "10px 10px 10px 16px",
              boxShadow: inputFocused
                ? `0 0 0 1.5px ${accent}66, 0 0 16px ${accent}14, ${T.shadow.xl}`
                : T.shadow.xl,
              transition: "box-shadow 0.2s ease",
            }}>
              <textarea
                ref={taRef}
                rows={1}
                placeholder="Partage ce qui t'occupe…"
                value={input}
                disabled={typing}
                onChange={handleInput}
                onKeyDown={handleKey}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                maxLength={2000}
                style={{
                  flex: 1, background: "none", border: "none",
                  outline: "none", resize: "none",
                  color: T.color.text, fontFamily: T.font.sans,
                  fontSize: "16px", fontWeight: 300,
                  lineHeight: 1.6, padding: "8px 4px 8px 0",
                  maxHeight: 120, overflowY: "auto",
                  caretColor: accent,
                }}
              />
              <motion.button
                whileTap={canSend ? { scale: 0.91 } : {}}
                onClick={() => send(input)}
                disabled={!canSend}
                style={{
                  width: 44, height: 44, flexShrink: 0,
                  borderRadius: T.radius.md,
                  background: canSend
                    ? `linear-gradient(135deg, ${accent} 0%, ${phaseContext?.accentStrong ?? T.color.accent.container} 100%)`
                    : "rgba(55,57,65,0.6)",
                  border: "none",
                  cursor: canSend ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.25s",
                }}
              >
                <span className="material-symbols-outlined" style={{
                  fontSize: "1.125rem",
                  color: canSend ? btnTextColor : T.color.textOff,
                  fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                }}>arrow_upward</span>
              </motion.button>
            </div>
          )}

          <p style={{
            margin: "8px 4px 0",
            fontSize: "0.68rem", lineHeight: 1.5,
            color: T.color.textOff,
            textAlign: "center", letterSpacing: "0.03em",
          }}>
            {showQuotaHint ? quotaState.remainingLabel : "La continuité reste visible d'une session à l'autre."}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Styles locaux ─────────────────────────────────────────────────────────────
const ghostBtn = {
  background: "none", border: "none",
  color: T.color.textMuted, cursor: "pointer",
  fontSize: "0.75rem", fontFamily: T.font.sans,
  padding: "6px 12px", borderRadius: T.radius.full,
  transition: "color 0.2s",
};

function UpgradeBar({ isTrial, onPricing }) {
  return (
    <div style={{
      ...T.glass.input,
      borderRadius: T.radius.xl,
      padding: "14px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 14,
      border: "1px solid rgba(255,182,138,0.2)",
      background: "rgba(255,182,138,0.08)",
      boxShadow: T.shadow.xl,
    }}>
      <div>
        <p style={{
          margin: 0,
          fontSize: T.type.caption.size,
          letterSpacing: T.type.caption.ls,
          textTransform: "uppercase",
          color: T.color.warning,
          fontWeight: 700,
        }}>
          {isTrial ? "Essai du jour terminé" : "Limite atteinte"}
        </p>
        <p style={{ margin: "5px 0 0", fontSize: T.type.bodySm.size, lineHeight: 1.5, color: T.color.textSub }}>
          Accès illimité · Mémoire complète · 19€/mois
        </p>
      </div>
      {isTrial && (
        <button
          onClick={onPricing}
          style={{
            border: "none",
            borderRadius: T.radius.md,
            padding: "11px 14px",
            background: "linear-gradient(135deg, #ffddb7 0%, #ffb68a 100%)",
            color: "#331a00",
            fontFamily: T.font.sans,
            fontSize: T.type.bodySm.size,
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Garder ce fil vivant
        </button>
      )}
    </div>
  );
}
