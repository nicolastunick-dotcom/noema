import { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────
// TODAY PAGE — Rituel quotidien
// Sprint 5 : données issues de la session live (nextAction prop)
//            + dernière entrée journal lue en Supabase au mount
// Props : user, sb, nextAction, onJournal
// ─────────────────────────────────────────────────────────────

const C = {
  bg: "#111318",
  surfaceContainer: "#1e1f25",
  surfaceContainerLow: "#1a1b21",
  surfaceContainerLowest: "#0c0e13",
  surfaceVariant: "#33353a",
  outlineVariant: "#454655",
  outline: "#8f8fa1",
  onSurface: "#e2e2e9",
  onSurfaceVariant: "#c5c5d8",
  primary: "#bdc2ff",
  primaryContainer: "#7886ff",
  tertiary: "#ffb68a",
};

const TODAY = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const TODAY_ISO = new Date().toISOString().slice(0, 10);

const FALLBACK_QUESTION = "Qu'est-ce que tu évites de regarder en face depuis quelques jours ?";

export default function TodayPage({ user, sb, nextAction = "", onJournal, onChat }) {
  const [lastJournalEntry, setLastJournalEntry] = useState(null); // { content, next_action, entry_date }
  const [loading, setLoading] = useState(true);
  const [journeyDay, setJourneyDay] = useState(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "auto";

    if (!sb || !user) {
      setLoading(false);
      return;
    }

    (async () => {
      const [entryResult, countResult] = await Promise.all([
        sb.from("journal_entries")
          .select("content, next_action, entry_date")
          .eq("user_id", user.id)
          .order("entry_date", { ascending: false })
          .limit(1)
          .maybeSingle(),
        sb.from("journal_entries")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      if (entryResult.error) console.error("[Today] Erreur chargement journal:", entryResult.error);
      if (entryResult.data) setLastJournalEntry(entryResult.data);
      if (countResult.count != null && countResult.count > 0) setJourneyDay(countResult.count);
      setLoading(false);
    })();

    return () => { document.body.style.overflow = prev; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "toi";

  // Source de vérité pour l'intention du jour :
  // 1. nextAction de la session en cours (prop live depuis AppShell)
  // 2. next_action de la dernière entrée journal persistée
  // 3. null → affiche un message d'invitation à converser
  const intentionSource = nextAction || lastJournalEntry?.next_action || null;

  // Question du jour : si une entrée journal existe aujourd'hui, invite à continuer
  const todayHasEntry = lastJournalEntry?.entry_date === TODAY_ISO;
  const questionText = todayHasEntry
    ? "Tu as déjà écrit aujourd'hui. Que retiens-tu de cette réflexion ?"
    : FALLBACK_QUESTION;

  const hasData = Boolean(intentionSource);
  const journeyDayValue = journeyDay != null
    ? Math.max(1, journeyDay)
    : (hasData || todayHasEntry ? 1 : null);
  const primaryAction = hasData
    ? {
        label: "Passer à l'action",
        helper: "Ouvre ton journal pour transformer cette intention en un pas concret aujourd'hui.",
        onClick: () => onJournal && onJournal(),
      }
    : {
        label: "Définir mon intention",
        helper: "Commence une conversation avec Noema pour clarifier ce qui compte aujourd'hui.",
        onClick: () => onChat && onChat(),
      };
  const reflectionAction = todayHasEntry
    ? {
        label: "Continuer dans le journal",
        icon: "edit_note",
        onClick: () => onJournal && onJournal(),
      }
    : hasData
      ? {
          label: "Écrire dans le journal",
          icon: "edit_note",
          onClick: () => onJournal && onJournal(),
        }
      : {
          label: "Clarifier avec Noema",
          icon: "chat",
          onClick: () => onChat && onChat(),
        };

  const glass = {
    position: "relative", overflow: "hidden", borderRadius: 24,
    background: "rgba(30,31,37,0.4)", backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(69,70,85,0.1)", padding: 28,
  };

  return (
    <div style={{ backgroundColor: C.bg, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.onSurface, overflowX: "hidden", paddingBottom: 96 }}>

      {/* ── Ambient Blobs ── */}
      <div style={{ position:"fixed", width:"100vw", height:"100vh", top:0, left:0, zIndex:0, overflow:"hidden", pointerEvents:"none" }}>
        <div style={{ position:"absolute", borderRadius:"50%", filter:"blur(80px)", opacity:0.15, background:"#7886ff", width:400, height:400, top:-80, left:-80 }} />
        <div style={{ position:"absolute", borderRadius:"50%", filter:"blur(80px)", opacity:0.15, background:"#ffb68a", width:300, height:300, top:"50%", right:-80 }} />
        <div style={{ position:"absolute", borderRadius:"50%", filter:"blur(80px)", opacity:0.15, background:"#bdc2ff", width:250, height:250, bottom:80, left:"25%" }} />
      </div>

      {/* ── Header ── */}
      <header style={{ position:"sticky", top:0, zIndex:40, background:"rgba(17,19,24,0.95)", padding:"16px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:"1.5rem", color:C.primary, letterSpacing:"-0.02em" }}>Noema</span>
        <div style={{ display:"flex", gap:16 }}>
          {["settings","notifications"].map(icon => (
            <button key={icon} style={{ background:"none", border:"none", cursor:"pointer", color:C.outlineVariant, padding:0, transition:"color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.color = C.primary}
              onMouseLeave={e => e.currentTarget.style.color = C.outlineVariant}
            >
              <span className="material-symbols-outlined" style={{ fontSize:"1.25rem" }}>{icon}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ── Content ── */}
      <main style={{ maxWidth:640, margin:"0 auto", padding:"32px 24px", position:"relative", zIndex:10, display:"flex", flexDirection:"column", gap:24 }}>

        {/* Hero greeting */}
        <section>
          <h2 style={{ fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:"clamp(2rem,7vw,2.8rem)", lineHeight:1.2, color:C.onSurface, margin:"0 0 8px" }}>
            Bonjour {firstName}.<br />Voici ton espace du jour.
          </h2>
          <p style={{ fontSize:"0.625rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(197,197,216,0.7)", margin:0 }}>{TODAY}</p>
          {journeyDayValue != null && (
            <p style={{ fontSize:"0.7rem", color:"rgba(189,194,255,0.45)", marginTop:10, margin:"10px 0 0", letterSpacing:"0.04em" }}>
              Jour {journeyDayValue} de ton parcours
            </p>
          )}
        </section>

        {loading ? (
          <div style={{ padding:"32px 0", color:C.outline, fontSize:"0.8rem", textAlign:"center" }}>
            Chargement…
          </div>
        ) : (
          <>
            {/* Card 1 — Intention */}
            <div style={glass}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                <span className="material-symbols-outlined" style={{ fontSize:"0.875rem", color:C.primary, fontVariationSettings:"'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>visibility</span>
                <h3 style={{ fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:"1.15rem", color:C.primary, margin:0 }}>Intention du jour</h3>
              </div>
              {hasData ? (
                <>
                  <p style={{ fontSize:"0.82rem", color:C.onSurfaceVariant, lineHeight:1.7, margin:"0 0 14px" }}>
                    Garde ce fil simple et concret pendant la journée.
                  </p>
                  <p style={{ fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:"1.3rem", color:C.onSurface, lineHeight:1.55, margin:"0 0 12px" }}>
                    {intentionSource}
                  </p>
                  <p style={{ fontSize:"0.8rem", color:"rgba(197,197,216,0.72)", lineHeight:1.65, margin:"0 0 22px" }}>
                    {primaryAction.helper}
                  </p>
                  <button
                    onClick={primaryAction.onClick}
                    style={{
                      display:"inline-flex", alignItems:"center", gap:8,
                      padding:"12px 22px", borderRadius:9999,
                      background:"linear-gradient(135deg, #bdc2ff 0%, #7886ff 100%)",
                      color:"#000965", fontWeight:700, fontSize:"0.875rem",
                      border:"none", cursor:"pointer",
                      fontFamily:"'Plus Jakarta Sans', sans-serif",
                      transition:"transform 0.15s, box-shadow 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 6px 20px rgba(120,134,255,0.35)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}
                  >
                    <span>{primaryAction.label}</span>
                    <span className="material-symbols-outlined" style={{ fontSize:"1rem", fontVariationSettings:"'FILL' 0, 'wght' 400" }}>arrow_forward</span>
                  </button>
                </>
              ) : (
                <>
                  <p style={{ fontSize:"0.95rem", color:C.onSurfaceVariant, lineHeight:1.7, margin:"0 0 14px" }}>
                    Commence une conversation pour définir ton intention du jour.
                  </p>
                  <p style={{ fontSize:"0.8rem", color:"rgba(197,197,216,0.72)", lineHeight:1.65, margin:"0 0 22px" }}>
                    {primaryAction.helper}
                  </p>
                  <button
                    onClick={primaryAction.onClick}
                    style={{
                      display:"inline-flex", alignItems:"center", gap:8,
                      padding:"12px 22px", borderRadius:9999,
                      background:"linear-gradient(135deg, #bdc2ff 0%, #7886ff 100%)",
                      color:"#000965", fontWeight:700, fontSize:"0.875rem",
                      border:"none", cursor:"pointer",
                      fontFamily:"'Plus Jakarta Sans', sans-serif",
                      transition:"transform 0.15s, box-shadow 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 6px 20px rgba(120,134,255,0.35)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}
                  >
                    <span>{primaryAction.label}</span>
                    <span className="material-symbols-outlined" style={{ fontSize:"1rem", fontVariationSettings:"'FILL' 0, 'wght' 400" }}>arrow_forward</span>
                  </button>
                </>
              )}
              <div style={{ position:"absolute", bottom:-32, right:-32, width:120, height:120, background:"rgba(189,194,255,0.05)", borderRadius:"50%", filter:"blur(30px)", pointerEvents:"none" }} />
            </div>

            {/* Card 2 — Question */}
            <div style={{ borderRadius:24, background:C.surfaceContainer, padding:28, display:"flex", flexDirection:"column", gap:20 }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <span className="material-symbols-outlined" style={{ fontSize:"0.875rem", color:C.tertiary, fontVariationSettings:"'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>psychology</span>
                  <h3 style={{ fontSize:"0.6rem", letterSpacing:"0.2em", textTransform:"uppercase", color:C.onSurfaceVariant, fontWeight:700, margin:0 }}>Une question pour toi</h3>
                </div>
                <p style={{ fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:"1.35rem", lineHeight:1.4, color:C.onSurface, margin:0 }}>
                  {questionText}
                </p>
              </div>
              <button
                onClick={reflectionAction.onClick}
                style={{
                  width:"100%", padding:"14px 20px", borderRadius:9999,
                  background:"linear-gradient(135deg, #5B6CFF, #7886ff)",
                  color:"#fff", fontWeight:600, fontSize:"0.875rem",
                  border:"none", cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  transition:"transform 0.15s",
                  fontFamily:"'Plus Jakarta Sans', sans-serif",
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.01)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
                onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
              >
                <span>{reflectionAction.label}</span>
                <span className="material-symbols-outlined" style={{ fontSize:"1rem", fontVariationSettings:"'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>{reflectionAction.icon}</span>
              </button>
            </div>

            {/* Card 3 — Repère du jour */}
            {hasData && (
              <div style={{ borderRadius:24, background:C.surfaceContainerLow, border:"1px solid rgba(69,70,85,0.05)", padding:28 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, gap:16 }}>
                  <div>
                    <h3 style={{ fontSize:"0.6rem", letterSpacing:"0.2em", textTransform:"uppercase", color:C.onSurfaceVariant, fontWeight:700, marginBottom:8 }}>Un pas concret</h3>
                    <p style={{ fontSize:"1.05rem", color:C.onSurface, lineHeight:1.6, margin:"0 0 12px" }}>
                      Choisis une action simple et faisable autour de cette intention.
                    </p>
                    <p style={{ fontSize:"0.9rem", color:C.onSurfaceVariant, lineHeight:1.7, margin:0 }}>
                      Quand tu auras avancé, reviens dans le journal pour noter ce que tu as fait, ressenti ou compris.
                    </p>
                  </div>
                </div>
                <div style={{ height:1, width:"100%", background:"rgba(69,70,85,0.35)", margin:"4px 0 14px" }} />
                <p style={{ fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:"1.05rem", lineHeight:1.6, color:C.primary, margin:0 }}>
                  {intentionSource}
                </p>
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}
