import { useState } from "react";

// ─────────────────────────────────────────────────────────────
// ONBOARDING — 4 slides, affiché une seule fois après le login
// Props : user, sb, onComplete()
// ─────────────────────────────────────────────────────────────

const C = {
  bg:                    "#111318",
  surfaceContainer:      "#1e1f25",
  surfaceContainerHigh:  "#282a2f",
  surfaceContainerLow:   "#1a1b21",
  surfaceContainerLowest:"#0c0e13",
  primary:               "#bdc2ff",
  primaryContainer:      "#7886ff",
  tertiary:              "#ffb68a",
  onSurface:             "#e2e2e9",
  onSurfaceVariant:      "#c5c5d8",
  outline:               "#8f8fa1",
  outlineVariant:        "#454655",
};

// ── Slide 1 — Bienvenue ───────────────────────────────────────
function Slide1() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, textAlign: "center", padding: "0 24px" }}>
      {/* Orbe pulsant */}
      <div style={{ position: "relative", marginBottom: 64 }}>
        <div style={{
          width: 160, height: 160, borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryContainer} 100%)`,
          boxShadow: `0 0 60px 10px rgba(91,108,255,0.3)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "orbPulse 3s ease-in-out infinite",
          position: "relative", zIndex: 1,
        }}>
          <div style={{
            width: "100%", height: "100%", borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(4px)",
          }} />
        </div>
        {/* Anneau orbital */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "140%", height: "140%",
          borderRadius: "50%",
          border: `1px solid rgba(69,70,85,0.3)`,
          pointerEvents: "none",
        }} />
      </div>

      {/* Texte */}
      <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 20 }}>
        <h1 style={{
          fontFamily: "'Instrument Serif', serif", fontStyle: "italic",
          fontSize: "clamp(2.5rem, 8vw, 4.5rem)", lineHeight: 1.1,
          color: C.onSurface, margin: 0, letterSpacing: "-0.02em",
        }}>
          Bienvenue.<br />Je suis Noema.
        </h1>
        <p style={{
          fontSize: "1.1rem", color: C.onSurfaceVariant,
          fontWeight: 300, letterSpacing: "0.02em", margin: 0, lineHeight: 1.6,
        }}>
          Un espace sobre pour parler, retrouver le fil, et avancer pas a pas.
        </p>
      </div>
    </div>
  );
}

// ── Slide 2 — Méthode ─────────────────────────────────────────
function Slide2() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, padding: "0 24px", justifyContent: "center", width: "100%", maxWidth: 800, margin: "0 auto" }}>
      {/* Heading */}
      <div style={{ textAlign: "center", marginBottom: 40, animation: "staggerIn 0.5s cubic-bezier(0.4,0,0.2,1) both", animationDelay: "0ms" }}>
        <h1 style={{
          fontFamily: "'Instrument Serif', serif", fontStyle: "italic",
          fontSize: "clamp(2rem, 6vw, 3.5rem)", lineHeight: 1.1,
          color: C.onSurface, margin: "0 0 12px", letterSpacing: "-0.02em",
        }}>
          Comment on va travailler ensemble
        </h1>
        <p style={{ fontSize: "1rem", color: C.onSurfaceVariant, fontWeight: 300, maxWidth: 440, margin: "0 auto", lineHeight: 1.6 }}>
          Ce qui est deja la dans le produit, sans promesse de trop.
        </p>
      </div>

      {/* Bento Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 16, width: "100%" }}>

        {/* Card 1 — Écoute */}
        <div style={{
          gridColumn: "span 5",
          background: C.surfaceContainer,
          border: `1px solid rgba(69,70,85,0.2)`,
          borderRadius: 16, padding: 24,
          display: "flex", flexDirection: "column", gap: 16,
          animation: "staggerIn 0.5s cubic-bezier(0.4,0,0.2,1) both", animationDelay: "120ms",
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: C.surfaceContainerHigh,
            border: `1px solid rgba(69,70,85,0.3)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span className="material-symbols-outlined" style={{ color: C.primary, fontVariationSettings: "'FILL' 0, 'wght' 300" }}>record_voice_over</span>
          </div>
          <div>
            <h3 style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1.2rem", color: C.primary, margin: "0 0 8px" }}>
              Tu poses les choses.
            </h3>
            <p style={{ fontSize: "0.8rem", color: C.onSurfaceVariant, lineHeight: 1.6, margin: 0 }}>
              Le chat sert a clarifier ce qui t'occupe, sans te noyer dans des effets de manche ni dans une interface confuse.
            </p>
          </div>
        </div>

        {/* Card 2 — Détection */}
        <div style={{
          gridColumn: "span 7",
          background: C.surfaceContainerHigh,
          border: `1px solid rgba(189,194,255,0.1)`,
          borderRadius: 16, padding: 24,
          display: "flex", flexDirection: "column", gap: 16,
          animation: "staggerIn 0.5s cubic-bezier(0.4,0,0.2,1) both", animationDelay: "260ms",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "rgba(120,134,255,0.15)",
              border: `1px solid rgba(189,194,255,0.25)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span className="material-symbols-outlined" style={{ color: C.primary, fontVariationSettings: "'FILL' 1, 'wght' 300" }}>psychology_alt</span>
            </div>
            <span style={{
              padding: "3px 10px", borderRadius: 9999,
              background: "rgba(189,194,255,0.08)",
              border: `1px solid rgba(189,194,255,0.2)`,
              color: C.primary, fontSize: "0.6rem",
              textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700,
            }}>Analyse Active</span>
          </div>
          <div>
            <h3 style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1.2rem", color: C.primary, margin: "0 0 8px" }}>
              Les points utiles remontent.
            </h3>
            <p style={{ fontSize: "0.8rem", color: C.onSurfaceVariant, lineHeight: 1.6, margin: 0 }}>
              L'intention active, certaines contradictions et les blocages deja nommes peuvent revenir en surface pour t'aider a reprendre plus vite.
            </p>
          </div>
        </div>

        {/* Card 3 — Cartographie */}
        <div style={{
          gridColumn: "span 12",
          background: C.surfaceContainer,
          border: `1px solid rgba(69,70,85,0.2)`,
          borderRadius: 16, padding: 24,
          display: "flex", gap: 32, alignItems: "center",
          animation: "staggerIn 0.5s cubic-bezier(0.4,0,0.2,1) both", animationDelay: "400ms",
        }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: C.surfaceContainerHigh,
              border: `1px solid rgba(69,70,85,0.3)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span className="material-symbols-outlined" style={{ color: C.tertiary, fontVariationSettings: "'FILL' 0, 'wght' 300" }}>map</span>
            </div>
            <div>
            <h3 style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1.2rem", color: C.tertiary, margin: "0 0 8px" }}>
              Mapping, Journal et Aujourd'hui sont deja relies.
            </h3>
            <p style={{ fontSize: "0.8rem", color: C.onSurfaceVariant, lineHeight: 1.6, margin: 0 }}>
              Tu peux converser, retrouver ton intention du moment, puis la transformer en un pas concret dans le journal ou le rituel du jour.
            </p>
            </div>
          </div>
          {/* Mini UI preview */}
          <div style={{
            flex: "0 0 200px", height: 100, borderRadius: 12,
            background: C.surfaceContainerLowest,
            border: `1px solid rgba(69,70,85,0.15)`,
            display: "flex", alignItems: "flex-end", padding: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.tertiary, animation: "orbPulse 2s ease-in-out infinite" }} />
              <span style={{ fontSize: "0.55rem", color: C.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.15em" }}>
                Surfaces deja actives
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Slide 3 — Règles ──────────────────────────────────────────
function Slide3() {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "0 24px", justifyContent: "center", width: "100%", maxWidth: 640, margin: "0 auto" }}>
      {/* Heading */}
      <div style={{ marginBottom: 48, animation: "staggerIn 0.5s cubic-bezier(0.4,0,0.2,1) both", animationDelay: "0ms" }}>
        <h1 style={{
          fontFamily: "'Instrument Serif', serif", fontStyle: "italic",
          fontSize: "clamp(2.5rem, 7vw, 4rem)", lineHeight: 1.1,
          color: C.onSurface, margin: "0 0 12px", letterSpacing: "-0.02em",
        }}>
          Quelques choses<br />
          <span style={{ color: C.primary }}>à savoir.</span>
        </h1>
        <p style={{ fontSize: "1rem", color: C.onSurfaceVariant, fontWeight: 300, margin: 0, lineHeight: 1.6, maxWidth: 400 }}>
          Pour que notre échange soit le plus fructueux possible.
        </p>
      </div>

      {/* Rules grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 20, alignItems: "start" }}>

        {/* Règle 1 — 25 messages */}
        <div style={{
          gridColumn: "span 7",
          background: C.surfaceContainer, borderRadius: 16, padding: 24,
          position: "relative", overflow: "hidden",
          animation: "staggerIn 0.5s cubic-bezier(0.4,0,0.2,1) both", animationDelay: "150ms",
        }}>
          <span className="material-symbols-outlined" style={{
            position: "absolute", top: 12, right: 12,
            fontSize: "3rem", color: C.onSurfaceVariant, opacity: 0.08,
            fontVariationSettings: "'FILL' 0, 'wght' 400",
          }}>timer</span>
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: "0.6rem", color: C.primary, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700 }}>Engagement</span>
            <h3 style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1.15rem", color: C.onSurface, margin: 0 }}>
              25 messages par jour
            </h3>
            <p style={{ fontSize: "0.78rem", color: C.onSurfaceVariant, lineHeight: 1.6, margin: 0 }}>
              Le cadre est volontairement simple et annonce clairement. Pas de surprise : tu sais jusqu'ou va l'espace de conversation.
            </p>
          </div>
        </div>

        {/* Règle 2 — Mémoire infinie */}
        <div style={{
          gridColumn: "span 5",
          background: C.surfaceContainerLow, borderRadius: 16, padding: 20,
          marginTop: 24,
          display: "flex", flexDirection: "column", gap: 12,
          animation: "staggerIn 0.5s cubic-bezier(0.4,0,0.2,1) both", animationDelay: "300ms",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: C.surfaceContainerHigh,
            border: `1px solid rgba(69,70,85,0.3)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span className="material-symbols-outlined" style={{ color: C.primary, fontSize: "1rem", fontVariationSettings: "'FILL' 0, 'wght' 300" }}>all_inclusive</span>
          </div>
          <div>
            <h3 style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1rem", color: C.onSurface, margin: "0 0 6px" }}>
              Continuite, pas memoire illimitee
            </h3>
            <p style={{ fontSize: "0.72rem", color: C.onSurfaceVariant, lineHeight: 1.6, margin: 0 }}>
              Noema garde des reperes utiles d'une visite a l'autre, sans te promettre une memoire totale ou magique.
            </p>
          </div>
        </div>

        {/* Règle 3 — Honnêteté */}
        <div style={{
          gridColumn: "span 12",
          display: "flex", justifyContent: "flex-end",
          marginTop: -8,
          animation: "staggerIn 0.5s cubic-bezier(0.4,0,0.2,1) both", animationDelay: "450ms",
        }}>
          <div style={{
            maxWidth: 280,
            background: C.surfaceContainerHigh, borderRadius: 16, padding: 20,
            borderLeft: `2px solid rgba(255,182,138,0.3)`,
            display: "flex", gap: 14, alignItems: "flex-start",
          }}>
            <span className="material-symbols-outlined" style={{ color: C.tertiary, flexShrink: 0, fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
              visibility
            </span>
            <div>
              <h3 style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1rem", color: C.onSurface, margin: "0 0 6px" }}>
                Une promesse sobre
              </h3>
              <p style={{ fontSize: "0.72rem", color: C.onSurfaceVariant, lineHeight: 1.6, margin: 0 }}>
                Le produit dit ce qu'il fait deja : clarifier, garder le fil, et t'aider a passer a l'action avec un cadre lisible.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Slide 4 — Prêt ? ──────────────────────────────────────────
function Slide4({ onComplete, loading }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, textAlign: "center", padding: "0 24px" }}>
      {/* Orbe avec N stylisé */}
      <div style={{ position: "relative", marginBottom: 48 }}>
        {/* Halo ambiant */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%) scale(2.2)",
          width: 120, height: 120, borderRadius: "50%",
          background: "rgba(120,134,255,0.2)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }} />
        {/* Anneau orbital */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 168, height: 168, borderRadius: "50%",
          border: "1px solid rgba(69,70,85,0.25)",
          pointerEvents: "none",
        }} />
        {/* Orbe */}
        <div style={{
          width: 120, height: 120, borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryContainer} 100%)`,
          boxShadow: `0 0 60px 10px rgba(91,108,255,0.35)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", zIndex: 1,
          animation: "orbPulse 3s ease-in-out infinite",
        }}>
          <span style={{
            fontFamily: "'Instrument Serif', serif", fontStyle: "italic",
            fontSize: "3rem", fontWeight: 400,
            color: "#111318",
            lineHeight: 1, userSelect: "none",
          }}>N</span>
        </div>
      </div>

      {/* Texte */}
      <div style={{ maxWidth: 540, display: "flex", flexDirection: "column", gap: 20, marginBottom: 48 }}>
        <p style={{ fontSize: "0.7rem", color: C.primary, textTransform: "uppercase", letterSpacing: "0.3em", fontWeight: 700, margin: 0 }}>
          Prêt pour la suite
        </p>
        <h1 style={{
          fontFamily: "'Instrument Serif', serif", fontStyle: "italic",
          fontSize: "clamp(2.5rem, 7vw, 4rem)", lineHeight: 1.1,
          color: C.onSurface, margin: 0, letterSpacing: "-0.02em",
        }}>
          Ton espace est pret.
        </h1>
        <p style={{ fontSize: "1rem", color: C.onSurfaceVariant, fontWeight: 300, margin: 0, lineHeight: 1.65 }}>
          Entre dans Noema, reprends le fil si besoin, et commence par ce qui est le plus vivant aujourd'hui.
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={onComplete}
        disabled={loading}
        style={{
          display: "inline-flex", alignItems: "center", gap: 12,
          padding: "16px 36px", borderRadius: 9999,
          background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryContainer} 100%)`,
          color: "#111318", border: "none", cursor: loading ? "wait" : "pointer",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 700, fontSize: "1rem", letterSpacing: "0.05em",
          boxShadow: "0 8px 32px rgba(120,134,255,0.25)",
          transition: "transform 0.2s, opacity 0.2s",
          opacity: loading ? 0.7 : 1,
          transform: "scale(1)",
        }}
        onMouseEnter={e => !loading && (e.currentTarget.style.transform = "scale(1.04)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
        onMouseUp={e => (e.currentTarget.style.transform = "scale(1.04)")}
      >
        {loading ? "Chargement…" : "Commencer avec Noema"}
        {!loading && (
          <span className="material-symbols-outlined" style={{ fontSize: "1.1rem", fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
            arrow_forward
          </span>
        )}
      </button>
    </div>
  );
}

// ── Progress dots ──────────────────────────────────────────────
function Progress({ slide }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          height: 3, borderRadius: 9999,
          width: i === slide ? 28 : 8,
          background: i === slide
            ? `linear-gradient(90deg, ${C.primary}, ${C.primaryContainer})`
            : "rgba(69,70,85,0.5)",
          transition: "width 0.4s cubic-bezier(0.4,0,0.2,1), background 0.4s",
        }} />
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function Onboarding({ user, sb, onComplete }) {
  const [slide, setSlide]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [animDir, setAnimDir] = useState("next"); // "next" | "prev"

  function goNext() {
    if (slide < 3) { setAnimDir("next"); setSlide(s => s + 1); }
  }
  function goPrev() {
    if (slide > 0) { setAnimDir("prev"); setSlide(s => s - 1); }
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
      background: C.bg,
      display: "flex", flexDirection: "column",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      color: C.onSurface,
      overflow: "hidden",
    }}>
      {/* Keyframes */}
      <style>{`
        @keyframes orbPulse {
          0%, 100% { box-shadow: 0 0 60px 10px rgba(91,108,255,0.3); transform: scale(1); }
          50% { box-shadow: 0 0 80px 20px rgba(91,108,255,0.5); transform: scale(1.04); }
        }
        @keyframes slideInNext {
          from { opacity: 0; transform: translateX(32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInPrev {
          from { opacity: 0; transform: translateX(-32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes staggerIn {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Ambient blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: "40vw", height: "40vw", borderRadius: "50%", background: C.primary, filter: "blur(100px)", opacity: 0.08 }} />
        <div style={{ position: "absolute", bottom: "-15%", right: "-8%", width: "45vw", height: "45vw", borderRadius: "50%", background: C.primaryContainer, filter: "blur(120px)", opacity: 0.06 }} />
        <div style={{ position: "absolute", top: "30%", right: "10%", width: "30vw", height: "30vw", borderRadius: "50%", background: C.tertiary, filter: "blur(100px)", opacity: 0.05 }} />
      </div>

      {/* Header */}
      <header style={{
        position: "relative", zIndex: 10,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px 32px",
      }}>
        <span style={{
          fontFamily: "'Instrument Serif', serif", fontStyle: "italic",
          fontSize: "1.5rem", color: C.primary, letterSpacing: "-0.02em",
        }}>Noema</span>
        <span style={{
          fontSize: "0.6rem", color: C.outline,
          textTransform: "uppercase", letterSpacing: "0.15em",
        }}>
          Étape {slide + 1} sur 4
        </span>
      </header>

      {/* Slide content */}
      <div
        key={slide}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          position: "relative", zIndex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "24px 0 40px",
          animation: `${animDir === "next" ? "slideInNext" : "slideInPrev"} 0.35s cubic-bezier(0.4,0,0.2,1) both`,
        }}
      >
        {slides[slide]}
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
            color: C.onSurface, opacity: slide === 0 ? 0 : 0.6,
            cursor: slide === 0 ? "default" : "pointer",
            fontSize: "0.8rem", fontWeight: 500,
            textTransform: "uppercase", letterSpacing: "0.1em",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            pointerEvents: slide === 0 ? "none" : "auto",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={e => slide > 0 && (e.currentTarget.style.opacity = "1")}
          onMouseLeave={e => (e.currentTarget.style.opacity = slide === 0 ? "0" : "0.6")}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "1rem", fontVariationSettings: "'FILL' 0, 'wght' 300" }}>arrow_back</span>
          Précédent
        </button>

        {/* Progress */}
        <Progress slide={slide} />

        {/* Suivant (masqué slide 4, géré par Slide4) */}
        {slide < 3 ? (
          <button
            onClick={goNext}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 24px", borderRadius: 9999,
              background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryContainer} 100%)`,
              color: "#111318", border: "none", cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700, fontSize: "0.8rem",
              letterSpacing: "0.1em", textTransform: "uppercase",
              boxShadow: "0 4px 20px rgba(120,134,255,0.2)",
              transition: "transform 0.15s, opacity 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
            onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
          >
            Suivant
            <span className="material-symbols-outlined" style={{ fontSize: "1rem", fontVariationSettings: "'FILL' 0, 'wght' 300" }}>arrow_forward</span>
          </button>
        ) : (
          <div style={{ width: 120 }} /> /* spacer pour garder la progress centrée */
        )}
      </footer>
    </div>
  );
}
