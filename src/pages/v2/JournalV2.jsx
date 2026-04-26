import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNoemaRuntime } from "../../context/NoemaContext";
import { T } from "../../design-system/tokens";
import LivingAtmosphere from "../../components/v2/LivingAtmosphere";
import { useMediaQuery } from "../../hooks/useMediaQuery";

// ─────────────────────────────────────────────────────────────────────────────
// JournalV2 — Sanctuaire de réflexion
// Utilise useNoemaRuntime() — aucune prop nécessaire.
// ─────────────────────────────────────────────────────────────────────────────

const TODAY     = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const TODAY_ISO = new Date().toISOString().slice(0, 10);

const FALLBACK_PROMPTS = [
  "Qu'est-ce que tu as fait aujourd'hui qui t'a rendu fier ?",
  "Quelle émotion a été la plus difficile à nommer ce matin ?",
  "Si tu devais résumer ton état d'esprit en une seule métaphore…",
  "Qu'est-ce qui te retient encore de franchir ce pas ?",
  "En quoi cette situation rejoint ce qu'on a découvert sur toi récemment ?",
];

const SAVE_LABELS = {
  idle:   "Prêt à enregistrer",
  saving: "Enregistrement…",
  saved:  "Entrée enregistrée ✓",
  error:  "Impossible d'enregistrer pour l'instant",
};

export default function JournalV2() {
  const { user, sb, nextAction, proofState, phaseContext } = useNoemaRuntime();
  const isCompact = useMediaQuery("(max-width: 640px)");

  const [text,          setText]          = useState("");
  const [activePrompt,  setActivePrompt]  = useState("");
  const [saveState,     setSaveState]     = useState("idle");
  const [loading,       setLoading]       = useState(true);
  const [journeyDay,    setJourneyDay]    = useState(null);
  const [isFocused,     setIsFocused]     = useState(false);
  const [pastEntries,   setPastEntries]   = useState([]);
  const taRef = useRef(null);

  const nextActionPrompt = nextAction
    ? `Tu t'étais engagé à : ${nextAction}. Est-ce que tu l'as fait ? Comment ça s'est passé ?`
    : null;
  const wordCount      = text.trim() ? text.trim().split(/\s+/).length : 0;
  const hasReflection  = text.trim().length > 0;
  const altPrompts     = nextActionPrompt ? FALLBACK_PROMPTS : FALLBACK_PROMPTS.slice(1);
  const supportProof   = proofState?.items?.find((i) => i.label !== "Fil actif") || null;
  const journalReason  = supportProof
    ? `${supportProof.tag} — ${supportProof.value}`
    : nextActionPrompt ? "Elle prolonge l'intention que tu avais laissée ouverte." : "";
  const journeyDayValue = journeyDay != null
    ? Math.max(1, journeyDay)
    : (nextAction || hasReflection ? 1 : null);

  const accent     = phaseContext?.accent     ?? T.color.accent.default;
  const glow       = phaseContext?.glow       ?? T.color.accent.glow;
  const accentSoft = phaseContext?.accentSoft ?? T.color.accent.soft;
  const border     = phaseContext?.border     ?? "rgba(255,255,255,0.06)";

  // ── Mount : charger l'entrée du jour ──
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "auto";
    setActivePrompt(nextActionPrompt || FALLBACK_PROMPTS[0]);

    if (!sb || !user?.id) { setLoading(false); return; }

    (async () => {
      const [entryRes, countRes] = await Promise.all([
        sb.from("journal_entries")
          .select("content, next_action")
          .eq("user_id", user.id).eq("entry_date", TODAY_ISO)
          .maybeSingle(),
        sb.from("journal_entries")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);
      if (entryRes.data) {
        if (entryRes.data.content) setText(entryRes.data.content);
        if (!nextActionPrompt && entryRes.data.next_action) setActivePrompt(entryRes.data.next_action);
      }
      if (countRes.count != null && countRes.count > 0) setJourneyDay(countRes.count);

      const pastRes = await sb.from("journal_entries")
        .select("content, entry_date, next_action")
        .eq("user_id", user.id)
        .neq("entry_date", TODAY_ISO)
        .order("entry_date", { ascending: false })
        .limit(3);
      if (pastRes.data?.length) setPastEntries(pastRes.data);

      setLoading(false);
    })();

    return () => { document.body.style.overflow = prev; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    if (!sb || !user?.id) return;
    setSaveState("saving");
    const { error } = await sb.from("journal_entries").upsert({
      user_id:     user.id,
      entry_date:  TODAY_ISO,
      content:     text,
      next_action: nextAction || activePrompt,
      updated_at:  new Date().toISOString(),
    }, { onConflict: "user_id,entry_date" });
    setSaveState(error ? "error" : "saved");
    if (error) console.error("[JournalV2] Erreur save:", error);
  }

  function markDirty() {
    if (saveState === "saved" || saveState === "error") setSaveState("idle");
  }

  function selectPrompt(p) {
    markDirty();
    setActivePrompt(p);
    taRef.current?.focus();
  }

  return (
    <div style={{
      backgroundColor: T.color.bg,
      minHeight: "100dvh",
      fontFamily: T.font.sans,
      color: T.color.text,
      overflowX: "hidden",
      paddingBottom: "calc(120px + env(safe-area-inset-bottom))",
    }}>
      {/* Placeholder style scoped */}
      <style>{`.nv2-ta::placeholder { color: rgba(69,70,85,0.45); white-space: pre-line; }`}</style>

      {/* ── Living atmosphere ── */}
      <LivingAtmosphere glow={glow} />

      {/* ── Header — minimal ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(12,14,19,0.85)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        padding: isCompact ? "12px 16px" : "14px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{
          fontFamily: T.font.serif, fontStyle: "italic",
          fontSize: "1.5rem", color: accent, letterSpacing: "-0.02em",
        }}>Noema</span>
        <span style={{
          fontSize: T.type.caption.size, textTransform: "uppercase",
          letterSpacing: "0.18em", color: T.color.textMuted, fontWeight: 600,
        }}>Journal</span>
      </header>

      {/* ── Cinematic entrance ── */}
      <motion.div
        initial={{ opacity: 0, filter: "blur(12px)", scale: 0.98 }}
        animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "relative", zIndex: 10 }}
      >
        <main style={{
          maxWidth: 640, margin: "0 auto",
          padding: isCompact ? "34px 16px 72px" : "48px 24px 80px",
        }}>

          {/* Date + titre */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ marginBottom: isCompact ? 34 : 48 }}
          >
            {/* Date as visual anchor */}
            <p style={{
              fontSize: "0.7rem", fontWeight: 700,
              letterSpacing: "0.22em", textTransform: "uppercase",
              color: accent, marginBottom: 8, opacity: 0.8,
            }}>{TODAY}</p>
            <h1 style={{
              fontFamily: T.font.serif, fontStyle: "italic",
              fontSize: "clamp(2.2rem, 7vw, 3rem)",
              lineHeight: 1.1, color: T.color.text, margin: `0 0 16px`,
            }}>L'espace de réflexion</h1>
            <p style={{
              fontSize: T.type.body.size, color: T.color.textSub,
              lineHeight: 1.8, margin: 0, maxWidth: 440,
            }}>
              Pose ce que tu vis, ce que tu comprends, et ce que tu veux garder.
            </p>
            {journeyDayValue != null && (
              <p style={{
                fontSize: "0.72rem", color: `${accent}99`,
                marginTop: 10, letterSpacing: "0.04em",
              }}>Jour {journeyDayValue} de ton parcours</p>
            )}
          </motion.div>

          {loading ? (
            <div style={{
              display: "flex", justifyContent: "center",
              padding: "48px 0", color: T.color.textMuted, fontSize: T.type.bodySm.size,
            }}>Chargement…</div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              style={{ display: "flex", flexDirection: "column", gap: isCompact ? 30 : 40 }}
            >

              {/* ── Intention du jour — generous padding, bigger quote ── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  ...T.glass.md,
                  borderRadius: T.radius["2xl"],
                  padding: isCompact ? 22 : 36,
                  position: "relative", overflow: "hidden",
                  borderLeft: `2.5px solid ${accent}`,
                  borderTop: `1px solid ${border}`,
                  borderRight: `1px solid ${border}`,
                  borderBottom: `1px solid ${border}`,
                }}
              >
                <div style={{ position: "absolute", top: -24, left: -24, width: 100, height: 100, background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`, opacity: 0.5, pointerEvents: "none" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "0.875rem", color: accent, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>psychology</span>
                  <span style={{ fontSize: T.type.caption.size, letterSpacing: "0.2em", textTransform: "uppercase", color: accent, fontWeight: 700 }}>
                    Intention du jour
                  </span>
                </div>
                <blockquote style={{
                  fontFamily: T.font.serif, fontStyle: "italic",
                  fontSize: isCompact ? "1.18rem" : "1.45rem", color: T.color.text,
                  lineHeight: 1.55, margin: `0 0 16px`,
                  overflowWrap: "anywhere",
                }}>"{activePrompt}"</blockquote>
                <p style={{ fontSize: T.type.body.size, color: T.color.textSub, lineHeight: 1.8, margin: 0 }}>
                  Prends un moment. Commence simplement par ce qui est le plus vivant pour toi maintenant.
                </p>
                {journalReason && (
                  <div style={{
                    marginTop: 20, padding: "14px 18px",
                    borderRadius: T.radius.md,
                    background: "rgba(12,14,19,0.5)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}>
                    <p style={{ margin: 0, fontSize: T.type.caption.size, textTransform: "uppercase", letterSpacing: "0.18em", color: accent, fontWeight: 700 }}>
                      Pourquoi cette question revient
                    </p>
                    <p style={{ margin: "8px 0 0", fontSize: T.type.bodySm.size, lineHeight: 1.7, color: T.color.text }}>
                      {journalReason}
                    </p>
                  </div>
                )}
              </motion.div>

              {/* ── Éditeur — page-like feel with focus glow ── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px" }}>
                  <span style={{ fontSize: T.type.caption.size, letterSpacing: "0.2em", textTransform: "uppercase", color: T.color.textMuted, fontWeight: 600 }}>Réflexion libre</span>
                  <span style={{ fontSize: T.type.caption.size, letterSpacing: "0.2em", textTransform: "uppercase", color: T.color.textMuted }}>
                    {wordCount} mot{wordCount !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Editor — paper-like with focus glow */}
                <div style={{
                  borderRadius: T.radius["2xl"],
                  background: "rgba(26,27,33,0.95)",
                  boxShadow: isFocused
                    ? `0 0 60px ${glow}, inset 0 0 30px ${glow}22, 0 2px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04)`
                    : `0 2px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04)`,
                  transition: "box-shadow 0.5s ease",
                  padding: isCompact ? 20 : 32,
                  position: "relative", overflow: "hidden",
                  minHeight: isCompact ? 320 : 360,
                }}>
                  <div style={{ position: "absolute", top: 0, right: 0, width: 120, height: 120, background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`, opacity: isFocused ? 0.4 : 0.15, transform: "translate(30%, -30%)", pointerEvents: "none", transition: "opacity 0.5s ease" }} />
                  <p style={{ fontSize: T.type.bodySm.size, color: T.color.textSub, lineHeight: 1.8, margin: `0 0 20px` }}>
                    Écris sans chercher la bonne formule. Décris ce que tu as fait, ressenti et compris.
                  </p>
                  <textarea
                    ref={taRef}
                    className="nv2-ta"
                    value={text}
                    onChange={(e) => { markDirty(); setText(e.target.value); }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={"Qu'as-tu fait aujourd'hui ?\nQu'as-tu ressenti ?\nQu'est-ce que tu comprends mieux maintenant ?"}
                    style={{
                      width: "100%", minHeight: isCompact ? 230 : 260,
                      background: "transparent", border: "none", outline: "none",
                      resize: "none",
                      fontSize: "16px", lineHeight: 1.85,
                      color: T.color.text, fontFamily: T.font.sans,
                      caretColor: accent,
                      boxSizing: "border-box",
                    }}
                  />
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", gap: 16,
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    marginTop: 20, paddingTop: 18, flexWrap: "wrap",
                  }}>
                    <p style={{
                      fontSize: T.type.bodySm.size, margin: 0, lineHeight: 1.5,
                      color: saveState === "error" ? T.color.error : T.color.textSub,
                    }}>
                      {SAVE_LABELS[saveState]}
                    </p>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={handleSave}
                      disabled={saveState === "saving"}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        padding: "11px 22px", borderRadius: T.radius.full,
                        background: saveState === "saved"
                          ? accentSoft
                          : `linear-gradient(135deg, ${accent}, ${phaseContext?.accentStrong ?? T.color.accent.container})`,
                        color: saveState === "saved" ? accent : "#0a0b12",
                        border: saveState === "saved" ? `1px solid ${border}` : "none",
                        cursor: saveState === "saving" ? "default" : "pointer",
                        fontWeight: 700, fontSize: T.type.bodySm.size,
                        fontFamily: T.font.sans,
                        opacity: saveState === "saving" ? 0.7 : 1,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "1rem", fontVariationSettings: "'FILL' 1, 'wght' 400" }}>
                        {saveState === "saved" ? "check" : "save"}
                      </span>
                      <span>{saveState === "saving" ? "Enregistrement…" : saveState === "saved" ? "Enregistrée" : "Enregistrer"}</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>

              {/* ── Ce que tu retiens ── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  ...T.glass.md,
                  borderRadius: T.radius["2xl"],
                  padding: isCompact ? 22 : 32, position: "relative", overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "0.875rem", color: T.color.warning, fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>bookmark</span>
                  <span style={{ fontSize: T.type.caption.size, letterSpacing: "0.2em", textTransform: "uppercase", color: T.color.textSub, fontWeight: 600 }}>Ce que tu retiens</span>
                </div>
                <p style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "1.1rem", lineHeight: 1.7, color: T.color.text, margin: `0 0 10px` }}>
                  Termine par une phrase simple : ce que tu veux garder de cette journée.
                </p>
                <p style={{ fontSize: T.type.bodySm.size, color: T.color.textSub, lineHeight: 1.8, margin: 0 }}>
                  Pas besoin d'un format spécial, juste une vérité claire.
                </p>
              </motion.div>

              {/* ── Autres pistes — hover accent border ── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <h3 style={{
                  fontSize: T.type.caption.size, letterSpacing: "0.2em",
                  textTransform: "uppercase", color: T.color.textMuted,
                  fontWeight: 600, margin: 0,
                }}>D'autres pistes à explorer</h3>
                <div style={{
                  display: "flex", gap: 16,
                  overflowX: "auto", paddingBottom: 8,
                  scrollbarWidth: "none", msOverflowStyle: "none",
                }}>
                  {altPrompts.map((p) => (
                    <AltPromptCard
                      key={p}
                      p={p}
                      accent={accent}
                      onSelect={() => selectPrompt(p)}
                    />
                  ))}
                </div>
              </motion.div>

              {/* ── Tes dernières réflexions — mémoire longitudinale ── */}
              {pastEntries.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  style={{ marginTop: 40, paddingTop: 32, borderTop: `1px solid ${border}` }}
                >
                  <p style={{
                    fontSize: T.type.label.size,
                    letterSpacing: T.type.label.ls,
                    textTransform: "uppercase",
                    color: T.color.textMuted,
                    fontWeight: 700,
                    marginBottom: 20,
                  }}>
                    Tes dernières réflexions
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {pastEntries.map((entry, i) => (
                      <PastEntryCard
                        key={entry.entry_date}
                        entry={entry}
                        accent={accent}
                        border={border}
                        index={i}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

            </motion.div>
          )}
        </main>
      </motion.div>
    </div>
  );
}

// ── Past entry card — mémoire longitudinale ──────────────────────────────────
function PastEntryCard({ entry, accent, border, index }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(entry.entry_date).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long"
  });
  const preview = entry.content?.slice(0, 140) ?? "";
  const isTruncated = (entry.content?.length ?? 0) > 140;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 * index }}
      onClick={() => isTruncated && setExpanded(e => !e)}
      style={{
        padding: "16px 20px",
        borderRadius: T.radius.md,
        border: `1px solid ${border}`,
        background: "rgba(255,255,255,0.025)",
        cursor: isTruncated ? "pointer" : "default",
        transition: "border-color 0.2s",
      }}
    >
      <p style={{
        fontSize: T.type.label.size,
        color: accent,
        fontWeight: 600,
        letterSpacing: "0.04em",
        marginBottom: 8,
        textTransform: "capitalize",
      }}>
        {date}
      </p>
      <p style={{
        fontSize: T.type.body.size,
        color: "rgba(197,197,216,0.75)",
        lineHeight: T.type.body.lh,
        margin: 0,
        whiteSpace: "pre-wrap",
      }}>
        {expanded ? entry.content : preview}
        {isTruncated && !expanded && "…"}
      </p>
      {isTruncated && (
        <p style={{
          fontSize: T.type.label.size,
          color: accent,
          opacity: 0.6,
          marginTop: 8,
          fontWeight: 600,
        }}>
          {expanded ? "Réduire ↑" : "Lire la suite ↓"}
        </p>
      )}
    </motion.div>
  );
}

// ── Alt prompt card — hover accent border ────────────────────────────────────
function AltPromptCard({ p, accent, onSelect }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.button
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flexShrink: 0, width: 224,
        background: "rgba(22,23,29,0.72)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRadius: T.radius.xl,
        padding: "22px 20px 18px",
        cursor: "pointer", textAlign: "left",
        display: "flex", flexDirection: "column",
        justifyContent: "space-between", gap: 12,
        border: hovered ? `1px solid ${accent}66` : "1px solid rgba(255,255,255,0.06)",
        borderLeftWidth: hovered ? "3px" : "1px",
        transition: "border-color 0.25s ease, border-left-width 0.25s ease",
      }}
    >
      <p style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: T.type.bodySm.size, color: T.color.text, lineHeight: 1.6, margin: 0 }}>"{p}"</p>
      <span className="material-symbols-outlined" style={{ fontSize: "1.125rem", color: hovered ? accent : T.color.textMuted, fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24", transition: "color 0.25s ease" }}>arrow_forward</span>
    </motion.button>
  );
}
