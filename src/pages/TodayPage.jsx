import { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────
// TODAY PAGE — Rituel quotidien
// Props : user, onJournal (ouvre l'onglet Journal)
// Données statiques pour l'instant
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

const STATIC_DATA = {
  intention: "Aujourd'hui, observe comment tu réagis quand quelqu'un remet en question une de tes décisions.",
  question:  "Qu'est-ce que tu évites de regarder en face depuis quelques jours ?",
  defi:      "Fais une chose que tu repousses depuis 3 jours. Juste une.",
  citation:  { text: "Whatever the mind can conceive and believe, it can achieve.", author: "Napoleon Hill" },
};

export default function TodayPage({ user, onJournal }) {
  const [defiDone, setDefiDone] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "toi";

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
          <p style={{ fontSize:"0.7rem", color:"rgba(197,197,216,0.4)", marginTop:8, margin:"8px 0 0" }}>Aperçu — contenu statique, personnalisation disponible prochainement.</p>
        </section>

        {/* Card 1 — Intention */}
        <div style={{
          position:"relative", overflow:"hidden", borderRadius:24,
          background:"rgba(30,31,37,0.4)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
          border:"1px solid rgba(69,70,85,0.1)", padding:28,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
            <span className="material-symbols-outlined" style={{ fontSize:"0.875rem", color:C.primary, fontVariationSettings:"'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>visibility</span>
            <h3 style={{ fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:"1.15rem", color:C.primary, margin:0 }}>Intention du jour</h3>
          </div>
          <p style={{ fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:"1.15rem", color:C.onSurface, lineHeight:1.65, margin:0 }}>
            "{STATIC_DATA.intention}"
          </p>
          {/* Glow */}
          <div style={{ position:"absolute", bottom:-32, right:-32, width:120, height:120, background:"rgba(189,194,255,0.05)", borderRadius:"50%", filter:"blur(30px)", pointerEvents:"none" }} />
        </div>

        {/* Card 2 — Question */}
        <div style={{
          borderRadius:24, background:C.surfaceContainer,
          padding:28, display:"flex", flexDirection:"column", gap:20,
        }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <span className="material-symbols-outlined" style={{ fontSize:"0.875rem", color:C.tertiary, fontVariationSettings:"'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>psychology</span>
              <h3 style={{ fontSize:"0.6rem", letterSpacing:"0.2em", textTransform:"uppercase", color:C.onSurfaceVariant, fontWeight:700, margin:0 }}>Une question pour toi</h3>
            </div>
            <p style={{ fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:"1.35rem", lineHeight:1.4, color:C.onSurface, margin:0 }}>
              {STATIC_DATA.question}
            </p>
          </div>
          <button
            onClick={() => onJournal && onJournal()}
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
            <span>Répondre dans le journal</span>
            <span className="material-symbols-outlined" style={{ fontSize:"1rem", fontVariationSettings:"'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>edit_note</span>
          </button>
        </div>

        {/* Card 3 — Défi */}
        <div style={{
          borderRadius:24, background:C.surfaceContainerLow,
          border:"1px solid rgba(69,70,85,0.05)", padding:28,
        }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, gap:16 }}>
            <div>
              <h3 style={{ fontSize:"0.6rem", letterSpacing:"0.2em", textTransform:"uppercase", color:C.onSurfaceVariant, fontWeight:700, marginBottom:8 }}>Ton défi aujourd'hui</h3>
              <p style={{ fontSize:"1.05rem", color:C.onSurface, lineHeight:1.5, margin:0 }}>{STATIC_DATA.defi}</p>
            </div>
            {/* Checkbox */}
            <button
              onClick={() => setDefiDone(d => !d)}
              style={{
                width:36, height:36, borderRadius:10, flexShrink:0,
                border:`2px solid ${defiDone ? C.primary : "rgba(69,70,85,0.35)"}`,
                background: defiDone ? C.primary : "transparent",
                cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
                transition:"all 0.2s",
              }}
            >
              {defiDone && (
                <span className="material-symbols-outlined" style={{ fontSize:"1.125rem", color:"#000965", fontVariationSettings:"'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>check</span>
              )}
            </button>
          </div>
          {/* Progress bar */}
          <div style={{ height:3, width:"100%", background:C.surfaceVariant, borderRadius:9999, overflow:"hidden" }}>
            <div style={{ height:"100%", width: defiDone ? "100%" : "0%", background:C.primary, borderRadius:9999, transition:"width 0.5s ease" }} />
          </div>
        </div>

        {/* Card 4 — Citation */}
        <div style={{
          position:"relative", borderRadius:24,
          background:C.surfaceContainerLowest,
          padding:"36px 28px",
          display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center",
          overflow:"hidden",
        }}>
          {/* Top gradient line */}
          <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:"linear-gradient(90deg, transparent, rgba(189,194,255,0.2), transparent)" }} />
          <span className="material-symbols-outlined" style={{ fontSize:"2.5rem", color:"rgba(120,134,255,0.3)", marginBottom:16, fontVariationSettings:"'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>format_quote</span>
          <blockquote style={{ fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:"1.25rem", color:C.onSurfaceVariant, lineHeight:1.6, maxWidth:420, margin:"0 0 16px" }}>
            "{STATIC_DATA.citation.text}"
          </blockquote>
          <cite style={{ fontStyle:"normal", fontSize:"0.6rem", letterSpacing:"0.2em", textTransform:"uppercase", color:C.outline }}>
            — {STATIC_DATA.citation.author}
          </cite>
          {/* Glow */}
          <div style={{ position:"absolute", bottom:-80, left:-80, width:240, height:240, background:"rgba(189,194,255,0.03)", borderRadius:"50%", filter:"blur(40px)", pointerEvents:"none" }} />
        </div>

      </main>
    </div>
  );
}
