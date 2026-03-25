import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────
// MAPPING PAGE — Profil psychologique visuel
// Props : insights { forces, blocages, contradictions }, ikigai, step
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
  secondary: "#bdc2ff",
  tertiary: "#ffb68a",
  error: "#ffb4ab",
};

const FORCE_POWER = [94, 87, 72, 65, 58, 51];

// ── Ikigai Diagram ────────────────────────────────────────────
function IkigaiDiagram({ ikigai, expanded }) {
  const [hovered, setHovered] = useState(null);

  const circles = [
    { label: "Passion",    sub: ikigai.aime,    color: C.primary,          border: "rgba(189,194,255,0.2)", bg: "rgba(189,194,255,0.05)", style: { top: 0, left: "50%", transform: "translate(-50%, 0)" } },
    { label: "Profession", sub: ikigai.excelle, color: C.tertiary,          border: "rgba(255,182,138,0.2)", bg: "rgba(255,182,138,0.05)", style: { top: "50%", right: 0, transform: "translate(0, -50%)" } },
    { label: "Vocation",   sub: ikigai.monde,   color: C.secondary,         border: "rgba(189,194,255,0.2)", bg: "rgba(120,134,255,0.05)", style: { bottom: 0, left: "50%", transform: "translate(-50%, 0)" } },
    { label: "Mission",    sub: ikigai.paie,    color: C.primaryContainer,  border: "rgba(120,134,255,0.2)", bg: "rgba(120,134,255,0.05)", style: { top: "50%", left: 0, transform: "translate(0, -50%)" } },
  ];

  // Tooltip anchor positions (where the card appears relative to diagram)
  const tooltipPos = [
    { bottom: "100%", left: "50%", transform: "translateX(-50%)", marginBottom: 8 },
    { top: "50%",  left: "100%",  transform: "translateY(-50%)", marginLeft: 8 },
    { top: "100%", left: "50%",  transform: "translateX(-50%)", marginTop: 8 },
    { top: "50%",  right: "100%", transform: "translateY(-50%)", marginRight: 8 },
  ];

  const labelPos = [
    { top: "10%",  left: "50%", transform: "translateX(-50%)", align: "center" },
    { top: "50%",  right: "6%", transform: "translateY(-50%)", align: "right"  },
    { bottom: "8%",left: "50%", transform: "translateX(-50%)", align: "center" },
    { top: "50%",  left: "6%",  transform: "translateY(-50%)", align: "left"   },
  ];

  return (
    <div style={{ position: "relative", paddingBottom: "100%", width: "100%" }}>
      <div style={{ position: "absolute", inset: 0 }}>
        {/* Circles — hoverable */}
        {circles.map((c, i) => (
          <div
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              position: "absolute",
              width: "66%", height: "66%",
              borderRadius: "50%",
              border: `1px solid ${hovered === i ? c.color : c.border}`,
              background: hovered === i ? c.bg.replace("0.05", "0.12") : c.bg,
              mixBlendMode: "screen",
              transition: "border-color 0.2s, background 0.2s",
              cursor: c.sub ? "pointer" : "default",
              zIndex: hovered === i ? 5 : 1,
              ...c.style,
            }}
          />
        ))}

        {/* Labels */}
        {circles.map((c, i) => (
          <div
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              position: "absolute",
              zIndex: 6,
              textAlign: labelPos[i].align,
              cursor: c.sub ? "pointer" : "default",
              ...labelPos[i],
            }}
          >
            <p style={{
              fontFamily: "'Instrument Serif', serif", fontStyle: "italic",
              fontSize: expanded ? "1.1rem" : "0.95rem",
              color: c.color,
              lineHeight: 1, margin: 0,
              transition: "opacity 0.2s, font-size 0.4s",
              opacity: hovered !== null && hovered !== i ? 0.4 : 1,
            }}>{c.label}</p>
            {c.sub && (
              <p style={{
                fontSize: expanded ? "0.75rem" : "0.6rem",
                color: C.onSurfaceVariant,
                marginTop: 2, lineHeight: 1.4,
                maxWidth: expanded ? 140 : 80,
                opacity: hovered !== null && hovered !== i ? 0.3 : 1,
                transition: "opacity 0.2s, font-size 0.4s, max-width 0.4s",
              }}>{c.sub}</p>
            )}
          </div>
        ))}

        {/* Hover tooltip card */}
        {hovered !== null && circles[hovered].sub && (
          <div style={{
            position: "absolute",
            zIndex: 20,
            ...tooltipPos[hovered],
            pointerEvents: "none",
          }}>
            <div style={{
              background: "#1e1f25",
              border: `1px solid ${circles[hovered].color}44`,
              borderRadius: 12,
              padding: "10px 14px",
              minWidth: 160, maxWidth: 220,
              boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${circles[hovered].color}22`,
            }}>
              <p style={{
                fontFamily: "'Instrument Serif', serif", fontStyle: "italic",
                fontSize: "0.85rem", color: circles[hovered].color,
                margin: "0 0 6px",
              }}>{circles[hovered].label}</p>
              <p style={{
                fontSize: "0.75rem", color: C.onSurface,
                lineHeight: 1.5, margin: 0,
              }}>{circles[hovered].sub}</p>
            </div>
          </div>
        )}

        {/* Center */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10,
          width: expanded ? 140 : 96,
          height: expanded ? 140 : 96,
          borderRadius: "50%",
          background: C.surfaceContainerHigh,
          border: "1px solid rgba(69,70,85,0.2)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          textAlign: "center", padding: "0 8px",
          transition: "width 0.4s cubic-bezier(0.4,0,0.2,1), height 0.4s cubic-bezier(0.4,0,0.2,1)",
        }}>
          <span style={{
            fontFamily: "'Instrument Serif', serif", fontStyle: "italic",
            fontSize: expanded ? "1rem" : "1.25rem",
            background: "linear-gradient(135deg, #bdc2ff 0%, #7886ff 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            lineHeight: 1.2,
            transition: "font-size 0.4s",
          }}>
            {ikigai.mission || "Ikigai"}
          </span>
          <span style={{ fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: C.onSurfaceVariant, marginTop: 2 }}>
            Raison d'être
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Force Row ─────────────────────────────────────────────────
function ForceRow({ label, power, index }) {
  const opacity = 1 - index * 0.12;
  const borderOpacity = index === 0 ? 1 : index === 1 ? 0.6 : 0.3;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 16px", borderRadius: 10,
      background: "rgba(255,255,255,0.03)",
      borderLeft: `3px solid rgba(189,194,255,${borderOpacity})`,
      gap: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{
          fontFamily: "'Instrument Serif', serif", fontStyle: "italic",
          fontSize: "1.25rem", color: C.outline, flexShrink: 0, width: 28,
        }}>0{index + 1}</span>
        <div>
          <p style={{ fontSize: "0.85rem", fontWeight: 600, color: C.onSurface, margin: 0 }}>{label}</p>
        </div>
      </div>
      <span style={{
        fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em",
        textTransform: "uppercase", color: C.primary, opacity, flexShrink: 0,
      }}>{power}% Power</span>
    </div>
  );
}

// ── Blocage Bar ───────────────────────────────────────────────
const BLOCAGE_CONFIG = {
  racine:    { label: "Blocage Racine",    critLabel: "Critique", critColor: "#ffb4ab", barW: "85%", barColor: "#ffb4ab" },
  entretien: { label: "Blocage Entretien", critLabel: "Modéré",   critColor: C.tertiary, barW: "50%", barColor: C.tertiary },
  visible:   { label: "Expression",        critLabel: "Surface",  critColor: C.primary,  barW: "30%", barColor: C.primary },
};

function BlocageBar({ type, text }) {
  const cfg = BLOCAGE_CONFIG[type];
  if (!text) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: C.onSurface }}>{text}</span>
        <span style={{ fontSize: "0.65rem", color: cfg.critColor, fontWeight: 600 }}>{cfg.critLabel}</span>
      </div>
      <div style={{ height: 3, borderRadius: 9999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: cfg.barW, borderRadius: 9999, background: cfg.barColor, transition: "width 0.8s ease" }} />
      </div>
      <p style={{ fontSize: "0.65rem", color: C.onSurfaceVariant, fontStyle: "italic", margin: 0 }}>
        Source : {cfg.label.toLowerCase()} détecté par Noema
      </p>
    </div>
  );
}

// ── Glass panel ───────────────────────────────────────────────
const glass = {
  background: "rgba(30,31,37,0.4)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(143,143,161,0.1)",
  borderRadius: 20,
  padding: 28,
  position: "relative",
  overflow: "hidden",
};

// ── Zen Progress Ring ─────────────────────────────────────────
function ZenRing({ step }) {
  const pct = Math.min(step / 4, 1);
  const r = 44, circ = 2 * Math.PI * r;
  const dash = circ * pct;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28, padding: "16px 0" }}>
      <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
        <svg width="96" height="96" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
          <circle cx="48" cy="48" r={r} fill="none"
            stroke="url(#zenGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
          <defs>
            <linearGradient id="zenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#bdc2ff" />
              <stop offset="100%" stopColor="#ffb68a" />
            </linearGradient>
          </defs>
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1.5rem", color: C.onSurface }}>
            {Math.round(pct * 100)}%
          </span>
        </div>
      </div>
      <div>
        <span style={{ display: "block", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: C.onSurfaceVariant, marginBottom: 4 }}>
          Intégration émotionnelle
        </span>
        <span style={{
          display: "block",
          fontFamily: "'Instrument Serif', serif", fontStyle: "italic",
          fontSize: "1.2rem", color: C.onSurface,
        }}>
          {pct < 0.25 ? "En Exploration" : pct < 0.5 ? "En Éveil" : pct < 0.75 ? "En Clarté" : "Vers la Sérénité"}
        </span>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────
function Empty({ msg }) {
  return (
    <p style={{ fontSize: "0.8rem", color: C.outline, fontStyle: "italic", textAlign: "center", padding: "8px 0" }}>{msg}</p>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function MappingPage({ insights, ikigai, step }) {
  const [ikigaiExpanded, setIkigaiExpanded] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const { forces, blocages, contradictions } = insights;
  const hasBlocages = blocages.racine || blocages.entretien || blocages.visible;

  return (
    <div style={{ backgroundColor: C.bg, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.onSurface, overflowX: "hidden", paddingBottom: 96 }}>

      {/* Animated blobs */}
      <style>{`@keyframes float{0%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-50px) scale(1.1)}66%{transform:translate(-20px,20px) scale(0.9)}100%{transform:translate(0,0) scale(1)}}`}</style>
      <div style={{ position:"fixed", width:500, height:500, borderRadius:"50%", background:"#bdc2ff", filter:"blur(120px)", opacity:0.12, top:-180, left:-80, zIndex:0, pointerEvents:"none", animation:"float 20s ease-in-out infinite" }} />
      <div style={{ position:"fixed", width:600, height:600, borderRadius:"50%", background:"#ffb68a", filter:"blur(120px)", opacity:0.08, top:"25%", right:-120, zIndex:0, pointerEvents:"none", animation:"float 25s ease-in-out infinite", animationDelay:"-8s" }} />
      <div style={{ position:"fixed", width:450, height:450, borderRadius:"50%", background:"#7886ff", filter:"blur(120px)", opacity:0.10, bottom:"25%", left:-100, zIndex:0, pointerEvents:"none", animation:"float 22s ease-in-out infinite", animationDelay:"-15s" }} />
      <div style={{ position:"fixed", width:550, height:550, borderRadius:"50%", background:"#bdc2ff", filter:"blur(120px)", opacity:0.07, bottom:-100, right:"20%", zIndex:0, pointerEvents:"none", animation:"float 28s ease-in-out infinite", animationDelay:"-22s" }} />

      {/* Header */}
      <header style={{ position:"sticky", top:0, zIndex:50, background:"rgba(17,19,24,0.9)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderBottom:"1px solid rgba(143,143,161,0.08)", padding:"16px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:"1.5rem", color:C.primary, letterSpacing:"-0.02em" }}>Noema</span>
        <span style={{ fontSize:"0.6rem", color:C.outline, letterSpacing:"0.15em", textTransform:"uppercase" }}>Mapping Psychologique</span>
      </header>

      <div style={{ maxWidth: 768, margin:"0 auto", padding:"32px 20px", display:"flex", flexDirection:"column", gap:28, position:"relative", zIndex:1 }}>

        {/* Hero */}
        <div style={{ paddingBottom:24, borderBottom:"1px solid rgba(69,70,85,0.15)" }}>
          <h1 style={{ fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:"clamp(2.2rem,8vw,3.5rem)", lineHeight:1.1, color:C.onSurface, margin:"0 0 12px" }}>Profil psychologique</h1>
          <p style={{ color:C.onSurfaceVariant, fontSize:"0.875rem", lineHeight:1.65, maxWidth:480, margin:0 }}>Une exploration de votre architecture intérieure. Identifiez vos leviers d'épanouissement et les zones de tension à dénouer.</p>
        </div>

        {/* Ikigai section */}
        <section style={{ display:"flex", gap:20, alignItems:"start" }}>
          {/* Diagram — expands on hover */}
          <div
            onMouseEnter={() => setIkigaiExpanded(true)}
            onMouseLeave={() => setIkigaiExpanded(false)}
            style={{
              ...glass,
              flex: ikigaiExpanded ? "0 0 100%" : "0 0 calc(50% - 10px)",
              transition: "flex-basis 0.45s cubic-bezier(0.4,0,0.2,1)",
              overflow: "hidden",
              cursor: "default",
            }}
          >
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none", overflow:"hidden" }}>
              <div style={{ width:280, height:280, borderRadius:"50%", background:C.primaryContainer, filter:"blur(120px)", opacity:0.08 }} />
            </div>
            <IkigaiDiagram ikigai={ikigai} expanded={ikigaiExpanded} />
          </div>

          {/* Ikigai insights — fades out when diagram expands */}
          <div style={{
            ...glass,
            flex: ikigaiExpanded ? "0 0 0%" : "0 0 calc(50% - 10px)",
            opacity: ikigaiExpanded ? 0 : 1,
            overflow: "hidden",
            transition: "flex-basis 0.45s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease",
            pointerEvents: ikigaiExpanded ? "none" : "auto",
          }}>
            <div style={{ position:"absolute", top:-40, right:-40, width:120, height:120, background:"rgba(189,194,255,0.08)", filter:"blur(40px)", borderRadius:"50%" }} />
            <h3 style={{ fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:"1.4rem", color:C.onSurface, marginBottom:20 }}>Harmonie Détectée</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(189,194,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize:"0.875rem", color:C.primary, fontVariationSettings:"'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>auto_awesome</span>
                </div>
                <p style={{ fontSize:"0.78rem", color:C.onSurface, lineHeight:1.55, margin:0 }}>
                  {ikigai.aime && ikigai.mission
                    ? <>Ta <span style={{ color:C.primary, fontWeight:600 }}>passion</span> pour « {ikigai.aime} » nourrit directement ta <span style={{ color:C.primaryContainer, fontWeight:600 }}>mission</span>.</>
                    : <span style={{ color:C.outline, fontStyle:"italic" }}>Continue la conversation — les connexions apparaîtront ici.</span>
                  }
                </p>
              </div>
              <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(255,182,138,0.1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize:"0.875rem", color:C.tertiary, fontVariationSettings:"'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>balance</span>
                </div>
                <p style={{ fontSize:"0.78rem", color:C.onSurface, lineHeight:1.55, margin:0 }}>
                  {ikigai.excelle && ikigai.paie
                    ? <>Équilibre entre ton <span style={{ color:C.tertiary, fontWeight:600 }}>excellence</span> en « {ikigai.excelle} » et tes besoins de sécurité.</>
                    : <span style={{ color:C.outline, fontStyle:"italic" }}>L'équilibre profession / vocation se révèle progressivement.</span>
                  }
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Forces + Blocages grid */}
        <section style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, alignItems:"start" }}>
          {/* Forces */}
          <div style={{ ...glass }}>
            <div style={{ position:"absolute", bottom:-40, left:-40, width:150, height:150, background:"rgba(189,194,255,0.05)", filter:"blur(40px)", borderRadius:"50%" }} />
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h2 style={{ fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:"1.5rem", color:C.onSurface, margin:0 }}>Forces Motrices</h2>
              <span className="material-symbols-outlined" style={{ color:C.primaryContainer, fontVariationSettings:"'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>trending_up</span>
            </div>
            {forces.length > 0 ? (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {forces.map((f, i) => <ForceRow key={f} label={f} power={FORCE_POWER[i] ?? 50} index={i} />)}
              </div>
            ) : <Empty msg="Tes forces émergent au fil de la conversation." />}
          </div>

          {/* Blocages */}
          <div style={{ ...glass, display:"flex", flexDirection:"column", gap:0 }}>
            <div style={{ position:"absolute", top:-40, right:-40, width:140, height:140, background:"rgba(255,180,171,0.05)", filter:"blur(40px)", borderRadius:"50%" }} />
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h2 style={{ fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:"1.5rem", color:C.onSurface, margin:0 }}>Blocages</h2>
              <span className="material-symbols-outlined" style={{ color:C.error, fontVariationSettings:"'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>lock_open</span>
            </div>
            {hasBlocages ? (
              <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                <BlocageBar type="racine"    text={blocages.racine} />
                <BlocageBar type="entretien" text={blocages.entretien} />
                <BlocageBar type="visible"   text={blocages.visible} />
              </div>
            ) : <Empty msg="Aucun blocage identifié pour l'instant." />}
            {hasBlocages && (
              <div style={{ marginTop:20, paddingTop:16, borderTop:"1px solid rgba(69,70,85,0.12)", textAlign:"center" }}>
                <p style={{ fontSize:"0.65rem", color:C.onSurfaceVariant, marginBottom:8 }}>Prochaine étape : session de déconstruction</p>
              </div>
            )}
          </div>
        </section>

        {/* Contradictions */}
        <section style={{ ...glass }}>
          <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"75%", height:100, background:"rgba(189,194,255,0.04)", filter:"blur(80px)", borderRadius:9999 }} />
          <div style={{ position:"absolute", top:0, right:0, padding:20, opacity:0.08, pointerEvents:"none" }}>
            <span className="material-symbols-outlined" style={{ fontSize:"5rem", color:C.onSurface }}>psychology_alt</span>
          </div>
          <h2 style={{ fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:"1.5rem", color:C.onSurface, marginBottom:20, position:"relative" }}>Contradictions Détectées</h2>
          {contradictions.length > 0 ? (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, position:"relative" }}>
              {contradictions.map((c, i) => (
                <div key={i} style={{
                  background:"rgba(255,255,255,0.03)",
                  borderLeft:`2px solid ${i % 2 === 0 ? C.tertiary : C.primary}`,
                  borderRadius:"0 10px 10px 0",
                  padding:"16px 14px",
                  backdropFilter:"blur(8px)",
                }}>
                  <h5 style={{ fontSize:"0.55rem", letterSpacing:"0.15em", textTransform:"uppercase", color: i%2===0 ? C.tertiary : C.primary, marginBottom:8, fontWeight:700 }}>Contradiction {i+1}</h5>
                  <p style={{ fontSize:"0.78rem", color:C.onSurface, lineHeight:1.55, margin:0 }}>{c}</p>
                </div>
              ))}
            </div>
          ) : (
            <Empty msg="Aucune contradiction détectée pour l'instant." />
          )}
        </section>

        {/* Zen Progress Ring */}
        <section style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, alignItems:"center" }}>
          {/* Quote */}
          <div style={{ ...glass }}>
            <div style={{ position:"absolute", top:-40, left:-20, width:120, height:120, background:"rgba(189,194,255,0.06)", filter:"blur(40px)", borderRadius:"50%" }} />
            <h2 style={{ fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:"1.5rem", color:C.primary, marginBottom:12 }}>Le Zen Progress Ring</h2>
            <p style={{ color:C.onSurfaceVariant, fontSize:"0.8rem", lineHeight:1.65, marginBottom:20 }}>Votre harmonie globale s'affine. Vous atteignez un point de bascule où l'observation remplace le jugement.</p>
            <ZenRing step={step} />
          </div>

          {/* Citation */}
          <div style={{ ...glass }}>
            <p style={{ fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:"1.1rem", color:C.onSurface, lineHeight:1.5, margin:0 }}>
              "Le cartographe de l'esprit ne dessine pas des terres, mais des silences."
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
