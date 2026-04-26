import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { buildImpactStats, buildReturnVisitState } from "../../lib/productProof";
import { buildZenRitual } from "../../lib/progressionSignals";
import { useNoemaRuntime } from "../../context/NoemaContext";
import { T, phaseButtonTextColor } from "../../design-system/tokens";
import LivingAtmosphere from "../../components/v2/LivingAtmosphere";

// ─────────────────────────────────────────────────────────────────────────────
// TodayV2 — Rituel matinal / sanctuaire du jour
// Utilise useNoemaRuntime() — aucune prop nécessaire.
// ─────────────────────────────────────────────────────────────────────────────

const TODAY     = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const TODAY_ISO = new Date().toISOString().slice(0, 10);
const MAPPING_REVEAL_STORAGE_KEY = "noema_mapping_reveal_shown";

const PHASE_QUESTIONS = {
  perdu: [
    "Qu'est-ce qui occupe le plus de place dans ta tête en ce moment — pas ce que tu devrais faire, ce qui est là, maintenant ?",
    "Qu'est-ce que tu évites de regarder en face depuis quelques jours ?",
    "Si tu n'avais pas peur du jugement, qu'est-ce que tu ferais différemment cette semaine ?",
    "Quel est le sujet sur lequel tu reviens toujours, sans jamais vraiment avancer ?",
    "Qu'est-ce que tu ne t'autorises pas encore à vouloir vraiment ?",
  ],
  guide: [
    "Parmi les blocages que tu commences à voir — lequel revient le plus souvent, même déguisé différemment ?",
    "Qu'est-ce qui s'est précisé pour toi depuis la dernière fois ?",
    "Y a-t-il une vérité que tu connais déjà mais que tu n'as pas encore décidé d'accepter ?",
    "Qu'est-ce que tes actions de cette semaine disent sur ce que tu veux vraiment ?",
    "Quel est le prochain pas que tu repousses — et pourquoi maintenant n'est jamais le bon moment ?",
  ],
  stratege: [
    "Qu'est-ce que tu as fait cette semaine qui était aligné avec qui tu es vraiment ?",
    "Quel obstacle est apparu que tu n'avais pas anticipé ?",
    "Si tu regardes le chemin parcouru — qu'est-ce qui t'a le plus surpris sur toi-même ?",
    "Quelle décision tu sais que tu dois prendre, mais que tu diffères encore ?",
    "Qu'est-ce que tu veux que la prochaine version de toi ait accompli dans 30 jours ?",
  ],
};

function getDailyQuestion(phaseId) {
  const questions = PHASE_QUESTIONS[phaseId] ?? PHASE_QUESTIONS.perdu;
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return questions[dayOfYear % questions.length];
}

export default function TodayV2() {
  const {
    user, sb, nextAction, sessionNote, proofState, quotaState: quota,
    phaseContext, progressSignals, changeTab,
  } = useNoemaRuntime();

  const [lastJournalEntry,    setLastJournalEntry]    = useState(null);
  const [latestSession,       setLatestSession]       = useState(null);
  const [loading,             setLoading]             = useState(true);
  const [journeyDay,          setJourneyDay]          = useState(null);
  const [sessionCount,        setSessionCount]        = useState(0);
  const [clarifiedIntentions, setClarifiedIntentions] = useState(0);
  const [mappingRevealWasShown] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(MAPPING_REVEAL_STORAGE_KEY) === "true";
  });

  const accent        = phaseContext?.accent     ?? T.color.accent.default;
  const glow          = phaseContext?.glow       ?? T.color.accent.glow;
  const accentSoft    = phaseContext?.accentSoft ?? T.color.accent.soft;
  const border        = phaseContext?.border     ?? "rgba(255,255,255,0.06)";
  const btnTextColor  = phaseButtonTextColor(phaseContext?.id);

  // ── Mount : charger données Supabase ──
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "auto";

    if (!sb || !user) { setLoading(false); return; }

    (async () => {
      const [entryRes, countRes, sessCountRes, intentRes, latestSessRes] = await Promise.all([
        sb.from("journal_entries")
          .select("content, next_action, entry_date")
          .eq("user_id", user.id)
          .order("entry_date", { ascending: false }).limit(1).maybeSingle(),
        sb.from("journal_entries")
          .select("id", { count: "exact", head: true }).eq("user_id", user.id),
        sb.from("sessions")
          .select("id", { count: "exact", head: true }).eq("user_id", user.id),
        sb.from("sessions")
          .select("id", { count: "exact", head: true }).eq("user_id", user.id)
          .not("next_action", "is", null).neq("next_action", ""),
        sb.from("sessions")
          .select("next_action, session_note, insights, step, ended_at, created_at")
          .eq("user_id", user.id)
          .order("ended_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      if (entryRes.data)       setLastJournalEntry(entryRes.data);
      if (latestSessRes.data)  setLatestSession(latestSessRes.data);
      if (countRes.count  > 0) setJourneyDay(countRes.count);
      if (sessCountRes.count != null) setSessionCount(sessCountRes.count);
      if (intentRes.count != null)    setClarifiedIntentions(intentRes.count);
      setLoading(false);
    })();

    return () => { document.body.style.overflow = prev; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstName      = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "toi";
  const intentionSource = nextAction || lastJournalEntry?.next_action || null;
  const hasData         = Boolean(intentionSource);
  const todayHasEntry   = lastJournalEntry?.entry_date === TODAY_ISO;
  const journeyDayValue = journeyDay != null ? Math.max(1, journeyDay) : (hasData || todayHasEntry ? 1 : null);

  const impactStats = useMemo(() =>
    buildImpactStats({ journalDays: journeyDay || 0, clarifiedIntentions, hasActiveThread: hasData, sessionCount }),
    [clarifiedIntentions, hasData, journeyDay, sessionCount]
  );
  const returnVisitState = useMemo(() =>
    buildReturnVisitState({ previousSession: latestSession, currentNextAction: intentionSource, currentSessionNote: sessionNote }),
    [intentionSource, latestSession, sessionNote]
  );
  const zenRitual = useMemo(() =>
    buildZenRitual({ phaseContext, progressSignals, intention: intentionSource, journalEntry: lastJournalEntry }),
    [intentionSource, lastJournalEntry, phaseContext, progressSignals]
  );
  const shouldShowMappingReveal = Boolean(progressSignals?.hasRecurringThemes) && !mappingRevealWasShown;

  useEffect(() => {
    if (shouldShowMappingReveal) {
      localStorage.setItem(MAPPING_REVEAL_STORAGE_KEY, "true");
    }
  }, [shouldShowMappingReveal]);

  const daysSinceLastSession = useMemo(() => {
    if (!latestSession) return null;
    const dateStr = latestSession.ended_at ?? latestSession.created_at;
    if (!dateStr) return null;
    const last = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - last) / 86400000);
    return diff;
  }, [latestSession]);

  const questionText   = todayHasEntry
    ? "Tu as déjà écrit aujourd'hui. Que retiens-tu de cette réflexion ?"
    : getDailyQuestion(phaseContext?.id ?? "perdu");

  const primaryAction = hasData
    ? { label: "Passer à l'action",    helper: "Ouvre ton journal pour transformer cette intention.", onClick: () => changeTab("journal") }
    : { label: "Définir mon intention", helper: "Commence avec Noema pour clarifier ce qui compte.",  onClick: () => changeTab("chat") };

  const reflectionAction = todayHasEntry
    ? { label: "Continuer dans le journal", icon: "edit_note", onClick: () => changeTab("journal") }
    : hasData
      ? { label: "Écrire dans le journal",   icon: "edit_note", onClick: () => changeTab("journal") }
      : { label: "Clarifier avec Noema",      icon: "chat",     onClick: () => changeTab("chat") };

  const stagger = (i) => ({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay: i * 0.09, ease: [0.16, 1, 0.3, 1] },
  });

  const card = {
    position: "relative", overflow: "hidden",
    borderRadius: T.radius["2xl"],
    ...T.glass.md,
  };

  // ── État Jour 0 : aucune donnée encore ──
  if (!loading && sessionCount === 0 && !latestSession && !lastJournalEntry) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px 120px",
        gap: 32,
        textAlign: "center",
        backgroundColor: T.color.bg,
        fontFamily: T.font.sans,
        color: T.color.text,
      }}>
        <LivingAtmosphere glow={glow} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
          <div style={{
            fontFamily: T.font.serif,
            fontStyle: "italic",
            fontSize: "1.4rem",
            color: T.color.text,
            lineHeight: 1.5,
            maxWidth: 320,
          }}>
            {firstName && firstName !== "toi" ? `Bonjour ${firstName}.` : "Bienvenue."}{" "}
            Ton espace se construit au fil des sessions.
          </div>
          <p style={{
            fontSize: "0.9rem",
            color: T.color.textSub,
            lineHeight: 1.65,
            maxWidth: 280,
            margin: 0,
          }}>
            Lance ta première conversation avec Noema — tout commence là.
          </p>
          <button
            onClick={() => {
              localStorage.setItem("noema_first_session", "true");
              changeTab("chat");
            }}
            style={{
              padding: "12px 28px",
              borderRadius: 9999,
              background: `linear-gradient(135deg, ${accent}, ${phaseContext?.accentStrong ?? T.color.accent.container})`,
              color: btnTextColor,
              fontWeight: 700,
              fontSize: "0.875rem",
              border: "none",
              cursor: "pointer",
              fontFamily: T.font.sans,
            }}
          >
            Parle à Noema maintenant
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: T.color.bg,
      minHeight: "100vh", fontFamily: T.font.sans,
      color: T.color.text, overflowX: "hidden", paddingBottom: 120,
    }}>

      {/* ── Living atmosphere ── */}
      <LivingAtmosphere glow={glow} />

      {/* ── Header — minimal ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(12,14,19,0.85)",
        backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        padding: "14px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "1.5rem", color: accent, letterSpacing: "-0.02em" }}>Noema</span>
        <span style={{ fontSize: T.type.caption.size, textTransform: "uppercase", letterSpacing: "0.18em", color: T.color.textMuted, fontWeight: 600 }}>
          Rituel du jour
        </span>
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
          padding: "48px 24px 120px",
          display: "flex", flexDirection: "column", gap: 32,
        }}>

          {/* ── Greeting — dramatic ── */}
          <motion.section {...stagger(0)}>
            {/* Date as visual anchor */}
            <p style={{
              fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.22em",
              textTransform: "uppercase", color: accent, marginBottom: 12, opacity: 0.8, margin: "0 0 12px",
            }}>{TODAY}</p>
            <h1 style={{
              fontFamily: T.font.serif, fontStyle: "italic",
              fontSize: "clamp(2.2rem, 8vw, 3.2rem)", lineHeight: 1.1,
              color: T.color.text, margin: `0 0 10px`,
            }}>
              Bonjour{" "}
              <span style={{ color: accent, fontStyle: "italic", fontFamily: T.font.serif }}>{firstName}.</span>
            </h1>
            {journeyDayValue != null && (
              <p style={{ fontSize: "0.72rem", color: `${accent}99`, marginTop: 8, letterSpacing: "0.04em" }}>
                Jour {journeyDayValue} de ton parcours
              </p>
            )}
            {daysSinceLastSession != null && daysSinceLastSession >= 2 && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{
                  marginTop: 16, fontSize: "0.88rem", lineHeight: 1.75,
                  color: T.color.textSub,
                  padding: "12px 16px", borderRadius: T.radius.lg,
                  background: accentSoft,
                  border: `1px solid ${border}`,
                }}
              >
                {daysSinceLastSession === 2
                  ? "Tu n'étais pas là hier. Bienvenue de retour."
                  : daysSinceLastSession <= 7
                    ? `${daysSinceLastSession} jours sans qu'on se parle. L'important c'est que tu sois là.`
                    : "Ça fait un moment. On reprend là où tu en es maintenant."}
              </motion.p>
            )}
          </motion.section>

          {loading ? (
            <TodaySkeleton />
          ) : (
            <>
              {/* Phase signal */}
              {phaseContext && (
                <motion.div {...stagger(1)} style={{
                  padding: "12px 18px", borderRadius: T.radius.lg,
                  background: accentSoft, border: `1px solid ${border}`,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: T.type.caption.size, textTransform: "uppercase", letterSpacing: T.type.caption.ls, color: accent, fontWeight: 700 }}>
                    {phaseContext.navLabel}
                  </span>
                  <span style={{ fontSize: T.type.caption.size, color: T.color.textSub }}>{phaseContext.paceLabel}</span>
                </motion.div>
              )}

              {shouldShowMappingReveal && (
                <motion.button
                  {...stagger(3)}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => changeTab("mapping")}
                  style={{
                    ...card,
                    padding: 24,
                    border: `1px solid ${accent}33`,
                    borderLeft: `2.5px solid ${accent}`,
                    background: "rgba(12,14,20,0.88)",
                    color: T.color.text,
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: T.font.sans,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 18,
                  }}
                >
                  <span style={{
                    fontFamily: T.font.serif,
                    fontStyle: "italic",
                    fontSize: "1.2rem",
                    lineHeight: 1.45,
                    color: T.color.text,
                  }}>
                    Quelque chose prend forme dans ton profil.
                  </span>
                  <span className="material-symbols-outlined" style={{
                    fontSize: "1.1rem",
                    color: accent,
                    fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                  }}>arrow_forward</span>
                </motion.button>
              )}

              {/* Quota */}
              {quota && (
                <motion.div {...stagger(2)} style={{
                  padding: "14px 18px", borderRadius: T.radius.lg,
                  background: quota.isTrial ? accentSoft : "rgba(22,23,29,0.6)",
                  border: `1px solid ${quota.isTrial ? border : "rgba(69,70,85,0.15)"}`,
                }}>
                  <p style={{ margin: 0, fontSize: T.type.caption.size, textTransform: "uppercase", letterSpacing: T.type.caption.ls, color: quota.isTrial ? accent : T.color.textSub, fontWeight: 700 }}>
                    {quota.label}
                  </p>
                  <p style={{ margin: "6px 0 0", fontSize: T.type.bodySm.size, color: T.color.text, lineHeight: 1.7 }}>
                    {quota.remainingLabel}
                  </p>
                </motion.div>
              )}

              {/* Return visit */}
              {returnVisitState?.hasData && (
                <motion.div {...stagger(3)} style={{ ...card, padding: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "0.875rem", color: accent, fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>history</span>
                    <h3 style={{ fontSize: T.type.caption.size, letterSpacing: "0.2em", textTransform: "uppercase", color: T.color.textSub, fontWeight: 700, margin: 0 }}>
                      {returnVisitState.title}
                    </h3>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {returnVisitState.items.map((item) => (
                      <div key={`${item.label}-${item.value}`} style={{ borderRadius: T.radius.md, padding: "14px 16px", background: "rgba(12,14,19,0.5)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <p style={{ margin: 0, fontSize: T.type.caption.size, letterSpacing: "0.16em", textTransform: "uppercase", color: T.color.textMuted, fontWeight: 700 }}>{item.label}</p>
                        <p style={{ margin: "6px 0 0", fontSize: T.type.bodySm.size, lineHeight: 1.7, color: T.color.text }}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Stats — BIG numbers ── */}
              {impactStats.length > 0 && (
                <motion.div {...stagger(4)} style={{ ...card, padding: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "0.875rem", color: accent, fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>timeline</span>
                    <h3 style={{ fontSize: T.type.caption.size, letterSpacing: "0.2em", textTransform: "uppercase", color: T.color.textSub, fontWeight: 700, margin: 0 }}>Impact déjà visible</h3>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                    {impactStats.map((stat) => (
                      <div key={stat.label} style={{ borderRadius: T.radius.lg, padding: "20px 16px", background: "rgba(12,14,19,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        {/* Big serif italic number */}
                        <p style={{ margin: 0, fontSize: "2.5rem", color: accent, fontFamily: T.font.serif, fontStyle: "italic", lineHeight: 1.1 }}>{stat.value}</p>
                        <p style={{ margin: "10px 0 0", fontSize: T.type.bodySm.size, lineHeight: 1.65, color: T.color.text }}>{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Intention — centerpiece ── */}
              <motion.div {...stagger(5)} style={{
                ...card,
                padding: 40,
                borderLeft: `2.5px solid ${accent}`,
                borderTop: `1px solid ${border}`,
                borderRight: `1px solid ${border}`,
                borderBottom: `1px solid ${border}`,
              }}>
                <div style={{ position: "absolute", bottom: -28, right: -28, width: 120, height: 120, background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`, opacity: 0.4, pointerEvents: "none" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "0.875rem", color: accent, fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>visibility</span>
                  <h3 style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "1.1rem", color: accent, margin: 0 }}>Intention du jour</h3>
                </div>
                {hasData ? (
                  <>
                    {/* Big serif intention text */}
                    <p style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "1.55rem", color: T.color.text, lineHeight: 1.5, margin: `0 0 16px` }}>
                      {intentionSource}
                    </p>
                    <p style={{ fontSize: T.type.bodySm.size, color: T.color.textSub, lineHeight: 1.8, margin: `0 0 24px` }}>
                      {primaryAction.helper}
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize: T.type.bodyLg.size, color: T.color.textSub, lineHeight: 1.8, margin: `0 0 24px` }}>
                    Commence une conversation pour définir ton intention du jour.
                  </p>
                )}
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={primaryAction.onClick}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "12px 24px", borderRadius: T.radius.full,
                    background: `linear-gradient(135deg, ${accent} 0%, ${phaseContext?.accentStrong ?? T.color.accent.container} 100%)`,
                    color: btnTextColor, fontWeight: 700, fontSize: T.type.bodySm.size,
                    border: "none", cursor: "pointer", fontFamily: T.font.sans,
                  }}
                >
                  <span>{primaryAction.label}</span>
                  <span className="material-symbols-outlined" style={{ fontSize: "1rem", fontVariationSettings: "'FILL' 0, 'wght' 400" }}>arrow_forward</span>
                </motion.button>
              </motion.div>

              {/* Rituel Zen — most atmospheric ── */}
              <motion.div {...stagger(6)} style={{
                ...card, padding: 32,
                background: "rgba(12,14,20,0.88)",
                boxShadow: `0 0 80px ${glow}, 0 20px 40px rgba(0,0,0,0.3)`,
                border: `1px solid ${accent}33`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "0.9rem", color: accent, fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>self_improvement</span>
                  <h3 style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "1.1rem", color: accent, margin: 0 }}>{zenRitual.title}</h3>
                </div>
                <p style={{ margin: `0 0 14px`, fontSize: T.type.bodySm.size, lineHeight: 1.85, color: T.color.textSub }}>{zenRitual.intro}</p>
                <p style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "1.2rem", lineHeight: 1.65, color: T.color.text, margin: `0 0 14px` }}>{zenRitual.prompt}</p>
                <p style={{ margin: 0, fontSize: T.type.bodySm.size, lineHeight: 1.7, color: `${T.color.textSub}aa` }}>{zenRitual.close}</p>
              </motion.div>

              {/* Question du jour */}
              <motion.div {...stagger(7)} style={{ borderRadius: T.radius["2xl"], background: T.color.container, padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "0.875rem", color: T.color.warning, fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>psychology</span>
                    <h3 style={{ fontSize: T.type.caption.size, letterSpacing: "0.2em", textTransform: "uppercase", color: T.color.textSub, fontWeight: 700, margin: 0 }}>Une question pour toi</h3>
                  </div>
                  <p style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "1.35rem", lineHeight: 1.5, color: T.color.text, margin: 0 }}>
                    {questionText}
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={reflectionAction.onClick}
                  style={{
                    width: "100%", padding: "14px 20px", borderRadius: T.radius.full,
                    background: `linear-gradient(135deg, ${accent}, ${phaseContext?.accentStrong ?? T.color.accent.container})`,
                    color: btnTextColor, fontWeight: 600, fontSize: T.type.bodySm.size,
                    border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    fontFamily: T.font.sans,
                  }}
                >
                  <span>{reflectionAction.label}</span>
                  <span className="material-symbols-outlined" style={{ fontSize: "1rem", fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>{reflectionAction.icon}</span>
                </motion.button>
              </motion.div>

              {/* Pas concret */}
              {hasData && (
                <motion.div {...stagger(8)} style={{ borderRadius: T.radius["2xl"], background: T.color.elevated, border: "1px solid rgba(255,255,255,0.04)", padding: 28 }}>
                  <h3 style={{ fontSize: T.type.caption.size, letterSpacing: "0.2em", textTransform: "uppercase", color: T.color.textSub, fontWeight: 700, marginBottom: 14 }}>Un pas concret</h3>
                  <p style={{ fontSize: T.type.bodyLg.size, color: T.color.text, lineHeight: 1.8, margin: `0 0 14px` }}>
                    Choisis une action simple autour de cette intention. Quand tu auras avancé, reviens dans le journal.
                  </p>
                  <div style={{ height: 1, background: "rgba(69,70,85,0.3)", margin: "12px 0" }} />
                  <p style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "1.1rem", lineHeight: 1.65, color: accent, margin: 0 }}>
                    {intentionSource}
                  </p>
                </motion.div>
              )}

              {/* Récurrence */}
              {progressSignals?.hasRecurringThemes && (
                <motion.div {...stagger(9)} style={{ ...card, padding: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "0.875rem", color: accent, fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>cycle</span>
                    <h3 style={{ fontSize: T.type.caption.size, letterSpacing: "0.2em", textTransform: "uppercase", color: T.color.textSub, fontWeight: 700, margin: 0 }}>Ce qui revient vraiment</h3>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[...progressSignals.recurringBlockages, ...progressSignals.recurringContradictions, ...progressSignals.recurringForces]
                      .slice(0, 3).map((item) => (
                      <div key={`${item.label}-${item.value}`} style={{ borderRadius: T.radius.md, padding: "14px 16px", background: "rgba(12,14,19,0.5)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <p style={{ margin: 0, fontSize: T.type.caption.size, letterSpacing: "0.18em", textTransform: "uppercase", color: T.color.textMuted, fontWeight: 700 }}>{item.label}</p>
                        <p style={{ margin: "6px 0 0", fontSize: T.type.bodySm.size, lineHeight: 1.7, color: T.color.text }}>{item.value}</p>
                        <p style={{ margin: "4px 0 0", fontSize: "0.68rem", color: accent }}>{item.count} sessions</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </main>
      </motion.div>
    </div>
  );
}

function TodaySkeleton() {
  const rows = [
    { height: 50, width: "100%" },
    { height: 120, width: "100%" },
    { height: 190, width: "100%" },
    { height: 112, width: "100%" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {rows.map((row, index) => (
        <motion.div
          key={index}
          animate={{ opacity: [0.35, 0.72, 0.35] }}
          transition={{ duration: 1.45, repeat: Infinity, delay: index * 0.12 }}
          style={{
            ...T.glass.md,
            width: row.width,
            height: row.height,
            borderRadius: index === 0 ? T.radius.lg : T.radius["2xl"],
            background: "rgba(22,23,29,0.64)",
          }}
        />
      ))}
    </div>
  );
}
