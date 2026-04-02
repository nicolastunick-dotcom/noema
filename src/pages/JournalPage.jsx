import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────
// JOURNAL PAGE — Espace de réflexion guidé par Noema
// Sprint 5 : écriture et lecture réelles via Supabase
// Props : user, sb, nextAction (depuis la session courante), sessionId
// ─────────────────────────────────────────────────────────────

const C = {
  bg: "#111318",
  surfaceContainer: "#1e1f25",
  surfaceContainerHigh: "#282a2f",
  outlineVariant: "#454655",
  outline: "#8f8fa1",
  onSurface: "#e2e2e9",
  onSurfaceVariant: "#c5c5d8",
  primary: "#bdc2ff",
  primaryContainer: "#7886ff",
  tertiary: "#ffb68a",
};

const TODAY = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const TODAY_ISO = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

const FALLBACK_PROMPTS = [
  "Qu'est-ce que tu as fait aujourd'hui qui t'a rendu fier ?",
  "Quelle émotion a été la plus difficile à nommer ce matin ?",
  "Si tu devais résumer ton état d'esprit en une seule métaphore…",
  "Qu'est-ce qui te retient encore de franchir ce pas ?",
  "En quoi cette situation rejoint ce qu'on a découvert sur toi récemment ?",
];

export default function JournalPage({ user, sb, nextAction = "" }) {
  const [text, setText] = useState("");
  const [activePrompt, setActivePrompt] = useState("");
  const [saveState, setSaveState] = useState("idle");
  const [loading, setLoading] = useState(true);
  const [journeyDay, setJourneyDay] = useState(null);
  const taRef = useRef(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const hasReflection = text.trim().length > 0;
  const journeyDayValue = journeyDay != null
    ? Math.max(1, journeyDay)
    : (nextAction || hasReflection ? 1 : null);
  const saveFeedback = {
    idle: "Prêt à enregistrer",
    saving: "Enregistrement…",
    saved: "Entrée enregistrée ✓",
    error: "Impossible d'enregistrer pour l'instant",
  };

  const altPrompts = nextAction ? FALLBACK_PROMPTS : FALLBACK_PROMPTS.slice(1);

  // ── Chargement de l'entrée du jour au mount ──────────────────
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "auto";

    setActivePrompt(nextAction || FALLBACK_PROMPTS[0]);

    if (!sb || !user) {
      setLoading(false);
      return;
    }

    (async () => {
      const [entryResult, countResult] = await Promise.all([
        sb.from("journal_entries")
          .select("content, next_action")
          .eq("user_id", user.id)
          .eq("entry_date", TODAY_ISO)
          .maybeSingle(),
        sb.from("journal_entries")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      if (entryResult.error) console.error("[Journal] Erreur chargement entrée:", entryResult.error);
      if (entryResult.data) {
        if (entryResult.data.content) setText(entryResult.data.content);
        if (!nextAction && entryResult.data.next_action) setActivePrompt(entryResult.data.next_action);
      }
      if (countResult.count != null && countResult.count > 0) setJourneyDay(countResult.count);
      setLoading(false);
    })();

    return () => { document.body.style.overflow = prev; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sauvegarde réelle dans Supabase ──────────────────────────
  async function handleSave() {
    if (!sb || !user) {
      // Fallback visuel si pas de Supabase (DEV sans config)
      setSaveState("saved");
      return;
    }

    setSaveState("saving");
    // session_id omis volontairement : la ligne sessions n'existe pas encore en DB
    // tant que saveSession() n'a pas été déclenché (beforeunload / autosave 2min).
    // Envoyer un UUID non persisté déclencherait une erreur FK 23503.
    const entry = {
      user_id:     user.id,
      entry_date:  TODAY_ISO,
      content:     text,
      next_action: nextAction || activePrompt,
      updated_at:  new Date().toISOString(),
    };

    const { error } = await sb
      .from("journal_entries")
      .upsert(entry, { onConflict: "user_id,entry_date" });

    if (error) {
      console.error("[Journal] Erreur sauvegarde:", error);
      setSaveState("error");
    } else {
      setSaveState("saved");
    }
  }

  function markDirty() {
    if (saveState === "saved" || saveState === "error") {
      setSaveState("idle");
    }
  }

  function selectPrompt(p) {
    markDirty();
    setActivePrompt(p);
    taRef.current?.focus();
  }

  const glass = {
    background: "rgba(30,31,37,0.4)",
    backdropFilter: "blur(12px) saturate(180%)",
    WebkitBackdropFilter: "blur(12px) saturate(180%)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
  };

  return (
    <div style={{ backgroundColor: C.bg, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.onSurface, overflowX: "hidden", paddingBottom: 120 }}>

      {/* ── Ambient Blobs ── */}
      <div style={{ position:"fixed", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
        <div style={{ position:"absolute", top:"-10%", left:"-10%", width:"60%", height:"60%", borderRadius:"50%", background:"rgba(189,194,255,0.10)", filter:"blur(120px)", mixBlendMode:"screen" }} />
        <div style={{ position:"absolute", top:"20%", right:"-15%", width:"50%", height:"50%", borderRadius:"50%", background:"rgba(255,182,138,0.10)", filter:"blur(140px)", mixBlendMode:"screen" }} />
        <div style={{ position:"absolute", bottom:"-10%", left:"20%", width:"55%", height:"55%", borderRadius:"50%", background:"rgba(120,134,255,0.10)", filter:"blur(130px)", mixBlendMode:"screen" }} />
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"40%", height:"40%", borderRadius:"50%", background:"rgba(189,194,255,0.05)", filter:"blur(100px)" }} />
      </div>

      {/* ── Header ── */}
      <header style={{ position:"sticky", top:0, zIndex:40, background:"rgba(17,19,24,0.9)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderBottom:"1px solid rgba(143,143,161,0.08)", padding:"16px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:"1.5rem", color:C.primary, letterSpacing:"-0.02em" }}>Noema</span>
        <span style={{ fontSize:"0.68rem", textTransform:"uppercase", letterSpacing:"0.18em", color:"rgba(197,197,216,0.7)" }}>
          Journal
        </span>
      </header>

      {/* ── Content ── */}
      <main style={{ position:"relative", zIndex:10, maxWidth:640, margin:"0 auto", padding:"32px 24px 48px" }}>

        {/* Date header */}
        <div style={{ marginBottom:40 }}>
          <p style={{ fontSize:"0.625rem", fontWeight:600, letterSpacing:"0.2em", textTransform:"uppercase", color:C.outline, marginBottom:8 }}>{TODAY}</p>
          <h1 style={{ fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:"clamp(2rem,7vw,3rem)", lineHeight:1.15, color:C.onSurface, margin:0 }}>L'espace de réflexion</h1>
          <p style={{ fontSize:"0.9rem", color:C.onSurfaceVariant, lineHeight:1.7, margin:"14px 0 0", maxWidth:460 }}>
            Un espace simple pour poser ce que tu vis, ce que tu comprends et ce que tu veux garder.
          </p>
          {journeyDayValue != null && (
            <p style={{ fontSize:"0.7rem", color:"rgba(189,194,255,0.45)", marginTop:10, margin:"10px 0 0", letterSpacing:"0.04em" }}>
              Jour {journeyDayValue} de ton parcours
            </p>
          )}
        </div>

        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:"40px 0", color:C.outline, fontSize:"0.8rem" }}>
            Chargement…
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:32 }}>

            {/* ── Active Prompt Card ── */}
            <div style={{ position:"relative" }}>
              {/* Glow */}
              <div style={{ position:"absolute", inset:-4, background:"linear-gradient(135deg, rgba(189,194,255,0.08), transparent)", filter:"blur(20px)", opacity:0.6, borderRadius:20, pointerEvents:"none" }} />
              <div style={{ ...glass, padding:28, position:"relative" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                  <span className="material-symbols-outlined" style={{ fontSize:"0.875rem", color:C.primary, fontVariationSettings:"'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>psychology</span>
                  <span style={{ fontSize:"0.6rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(189,194,255,0.8)", fontWeight:600 }}>
                    Intention du jour
                  </span>
                </div>
                <blockquote style={{ fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:"1.3rem", color:"#dfe0ff", lineHeight:1.5, margin:"0 0 16px" }}>
                  "{activePrompt}"
                </blockquote>
                <p style={{ fontSize:"0.8rem", color:C.onSurfaceVariant, lineHeight:1.65, margin:0, fontWeight:300 }}>
                  Prends un moment pour respirer. Commence simplement par ce qui est le plus vivant pour toi maintenant.
                </p>
              </div>
            </div>

            {/* ── Editor Surface ── */}
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0 4px" }}>
                <span style={{ fontSize:"0.6rem", letterSpacing:"0.2em", textTransform:"uppercase", color:C.outline, fontWeight:600 }}>Réflexion libre</span>
                <span style={{ fontSize:"0.6rem", letterSpacing:"0.2em", textTransform:"uppercase", color:C.outline }}>{wordCount} mot{wordCount !== 1 ? "s" : ""}</span>
              </div>
              <div style={{ ...glass, padding:28, minHeight:360, position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:0, right:0, width:120, height:120, background:"rgba(189,194,255,0.04)", filter:"blur(40px)", borderRadius:"50%", transform:"translate(30%, -30%)", pointerEvents:"none" }} />
                <p style={{ fontSize:"0.82rem", color:C.onSurfaceVariant, lineHeight:1.65, margin:"0 0 18px" }}>
                  Écris sans chercher la bonne formule. Décris ce que tu as fait, ce que tu as ressenti et ce que tu comprends mieux.
                </p>
                <textarea
                  ref={taRef}
                  value={text}
                  onChange={e => {
                    markDirty();
                    setText(e.target.value);
                  }}
                  placeholder={"Qu'as-tu fait aujourd'hui ?\nQu'as-tu ressenti ?\nQu'est-ce que tu comprends mieux maintenant ?"}
                  style={{
                    width:"100%", minHeight:280,
                    background:"transparent", border:"none", outline:"none",
                    resize:"none",
                    fontSize:"1.05rem", lineHeight:1.7,
                    color:C.onSurface,
                    fontFamily:"'Plus Jakarta Sans', sans-serif",
                    caretColor:C.primary,
                  }}
                />
                <style>{`textarea::placeholder { color: rgba(69,70,85,0.5); white-space: pre-line; }`}</style>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:16, borderTop:"1px solid rgba(255,255,255,0.05)", marginTop:20, paddingTop:16, flexWrap:"wrap" }}>
                  <p style={{ fontSize:"0.78rem", color:saveState === "error" ? "#ffb4ab" : "rgba(197,197,216,0.72)", margin:0, lineHeight:1.5 }}>
                    {saveFeedback[saveState]}
                  </p>
                  <button
                    onClick={handleSave}
                    disabled={saveState === "saving"}
                    style={{
                      display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8,
                      padding:"12px 20px", borderRadius:9999,
                      background: saveState === "saved"
                        ? "rgba(189,194,255,0.12)"
                        : "linear-gradient(135deg, #bdc2ff, #7886ff)",
                      color: saveState === "saved" ? C.primary : "#000965",
                      border: saveState === "saved" ? "1px solid rgba(189,194,255,0.2)" : "none",
                      cursor: saveState === "saving" ? "default" : "pointer",
                      fontWeight:700, fontSize:"0.82rem",
                      fontFamily:"'Plus Jakarta Sans', sans-serif",
                      opacity: saveState === "saving" ? 0.7 : 1,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize:"1rem", fontVariationSettings:"'FILL' 1, 'wght' 400" }}>
                      {saveState === "saved" ? "check" : "save"}
                    </span>
                    <span>{saveState === "saving" ? "Enregistrement…" : saveState === "saved" ? "Enregistrée" : "Enregistrer"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── Retention Cue ── */}
            <div style={{ ...glass, padding:24, display:"flex", flexDirection:"column", gap:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span className="material-symbols-outlined" style={{ fontSize:"0.875rem", color:C.tertiary, fontVariationSettings:"'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>bookmark</span>
                <span style={{ fontSize:"0.6rem", letterSpacing:"0.2em", textTransform:"uppercase", color:C.onSurfaceVariant, fontWeight:600 }}>
                  Ce que tu retiens
                </span>
              </div>
              <p style={{ fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:"1.05rem", lineHeight:1.55, color:C.onSurface, margin:0 }}>
                Termine par une phrase simple: ce que tu veux garder de cette journée, ou ce que tu comprends mieux maintenant.
              </p>
              <p style={{ fontSize:"0.8rem", color:C.onSurfaceVariant, lineHeight:1.65, margin:0 }}>
                Tu peux l'écrire à la fin de ta note. Pas besoin d'un format spécial, juste une vérité claire.
              </p>
            </div>

            {/* ── Alternative Prompts horizontal scroll ── */}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <h3 style={{ fontSize:"0.6rem", letterSpacing:"0.2em", textTransform:"uppercase", color:C.outline, fontWeight:600, padding:"0 4px", margin:0 }}>D'autres pistes à explorer</h3>
              <div style={{ display:"flex", gap:16, overflowX:"auto", paddingBottom:8, margin:"0 -24px", padding:"0 24px 8px", scrollbarWidth:"none", msOverflowStyle:"none" }}>
                <style>{`.alt-prompt-scroll::-webkit-scrollbar{display:none}`}</style>
                {altPrompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => selectPrompt(p)}
                    style={{
                      flexShrink:0, width:240,
                      ...glass,
                      padding:"20px 20px 16px",
                      cursor:"pointer",
                      textAlign:"left",
                      display:"flex", flexDirection:"column", justifyContent:"space-between", gap:12,
                      transition:"border-color 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(189,194,255,0.3)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                  >
                    <p style={{ fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:"0.875rem", color:C.onSurface, lineHeight:1.5, margin:0 }}>"{p}"</p>
                    <span className="material-symbols-outlined" style={{ fontSize:"1.125rem", color:C.outline, fontVariationSettings:"'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>arrow_forward</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}
      </main>

    </div>
  );
}
