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

export default function JournalPage({ user, sb, nextAction = "", sessionId = null }) {
  const [text, setText] = useState("");
  const [activePrompt, setActivePrompt] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const taRef = useRef(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  // Prompt principal : next_action si dispo, sinon fallback aléatoire
  const mainPrompt = nextAction || FALLBACK_PROMPTS[0];
  const altPrompts = nextAction
    ? FALLBACK_PROMPTS
    : FALLBACK_PROMPTS.slice(1);

  // ── Chargement de l'entrée du jour au mount ──────────────────
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "auto";

    // Définit le prompt actif (next_action ou fallback)
    setActivePrompt(nextAction || FALLBACK_PROMPTS[0]);

    if (!sb || !user) {
      setLoading(false);
      return;
    }

    (async () => {
      const { data, error } = await sb
        .from("journal_entries")
        .select("content, next_action")
        .eq("user_id", user.id)
        .eq("entry_date", TODAY_ISO)
        .maybeSingle();

      if (error) console.error("[Journal] Erreur chargement entrée:", error);

      if (data) {
        if (data.content) setText(data.content);
        // Si une next_action était enregistrée et qu'on n'en a pas de plus récente
        if (!nextAction && data.next_action) setActivePrompt(data.next_action);
      }
      setLoading(false);
    })();

    return () => { document.body.style.overflow = prev; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sauvegarde réelle dans Supabase ──────────────────────────
  async function handleSave() {
    if (!sb || !user) {
      // Fallback visuel si pas de Supabase (DEV sans config)
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return;
    }

    setSaving(true);
    const entry = {
      user_id:    user.id,
      session_id: sessionId,
      entry_date: TODAY_ISO,
      content:    text,
      next_action: nextAction || activePrompt,
      updated_at: new Date().toISOString(),
    };

    const { error } = await sb
      .from("journal_entries")
      .upsert(entry, { onConflict: "user_id,entry_date" });

    if (error) {
      console.error("[Journal] Erreur sauvegarde:", error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  function selectPrompt(p) {
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
        <div style={{ display:"flex", gap:16 }}>
          {["settings","notifications"].map(icon => (
            <button key={icon} style={{ background:"none", border:"none", cursor:"pointer", color:C.outlineVariant, padding:0 }}
              onMouseEnter={e => e.currentTarget.style.color = C.primary}
              onMouseLeave={e => e.currentTarget.style.color = C.outlineVariant}
            >
              <span className="material-symbols-outlined" style={{ fontSize:"1.25rem" }}>{icon}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ── Content ── */}
      <main style={{ position:"relative", zIndex:10, maxWidth:640, margin:"0 auto", padding:"32px 24px 48px" }}>

        {/* Date header */}
        <div style={{ marginBottom:40 }}>
          <p style={{ fontSize:"0.625rem", fontWeight:600, letterSpacing:"0.2em", textTransform:"uppercase", color:C.outline, marginBottom:8 }}>{TODAY}</p>
          <h1 style={{ fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:"clamp(2rem,7vw,3rem)", lineHeight:1.15, color:C.onSurface, margin:0 }}>L'espace de réflexion</h1>
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
                    {nextAction ? "Action de ta session" : "Suggestion de Noema"}
                  </span>
                </div>
                <blockquote style={{ fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:"1.3rem", color:"#dfe0ff", lineHeight:1.5, margin:"0 0 16px" }}>
                  "{activePrompt}"
                </blockquote>
                <p style={{ fontSize:"0.8rem", color:C.onSurfaceVariant, lineHeight:1.65, margin:0, fontWeight:300 }}>
                  Prends un moment pour respirer. Il n'y a pas de mauvaise réponse, seulement ton honnêteté.
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
                <textarea
                  ref={taRef}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Écris librement ici…"
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
                <style>{`textarea::placeholder { color: rgba(69,70,85,0.5); }`}</style>
              </div>
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

      {/* ── FAB Save ── */}
      <div style={{ position:"fixed", bottom:96, right:24, zIndex:40 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width:56, height:56, borderRadius:"50%",
            background: saved
              ? "linear-gradient(135deg, #4caf50, #2e7d32)"
              : "linear-gradient(135deg, #bdc2ff, #7886ff)",
            border:"none", cursor: saving ? "default" : "pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 8px 24px rgba(120,134,255,0.3)",
            transition:"transform 0.15s, background 0.3s",
            opacity: saving ? 0.7 : 1,
          }}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.transform = "scale(1.05)"; }}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          onMouseDown={e => { if (!saving) e.currentTarget.style.transform = "scale(0.95)"; }}
          onMouseUp={e => { if (!saving) e.currentTarget.style.transform = "scale(1.05)"; }}
        >
          <span className="material-symbols-outlined" style={{ fontSize:"1.375rem", color:"#000965", fontVariationSettings:"'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
            {saved ? "check" : "edit_note"}
          </span>
        </button>
      </div>

    </div>
  );
}
