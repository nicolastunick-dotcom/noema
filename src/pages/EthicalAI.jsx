import { useEffect } from "react";

const C = {
  bg: "#111318", surface: "#111318",
  outlineVariant: "#454655",
  onBackground: "#e2e2e9", onSurfaceVariant: "#c5c5d8",
  primary: "#bdc2ff", tertiary: "#ffb68a",
  primaryContainer: "#7886ff",
};

const principles = [
  {
    icon: "psychology",
    title: "Transparence totale",
    body: "Noema ne se fait jamais passer pour un humain. Vous savez à tout moment que vous interagissez avec une intelligence artificielle. Ses limites et ses biais sont reconnus et communiqués ouvertement.",
    color: "#bdc2ff",
  },
  {
    icon: "favorite",
    title: "Bien-être avant tout",
    body: "Noema est conçu pour votre épanouissement psychologique, jamais pour créer de dépendance. Si une préoccupation dépasse le cadre du coaching IA, Noema vous oriente vers des professionnels humains.",
    color: "#ffb68a",
  },
  {
    icon: "lock",
    title: "Confidentialité radicale",
    body: "Vos conversations sont strictement privées. Elles ne servent pas à entraîner des modèles d'IA tiers, ne sont jamais vendues, et restent sous votre contrôle exclusif.",
    color: "#bdc2ff",
  },
  {
    icon: "balance",
    title: "Pas de manipulation",
    body: "Noema ne cherche jamais à influencer vos opinions politiques, religieuses ou personnelles. Il pose des questions, il n'impose pas de réponses. Votre autonomie de pensée est sacrée.",
    color: "#ffb68a",
  },
  {
    icon: "block",
    title: "Limites claires",
    body: "Noema refuse d'engager des conversations susceptibles de nuire à votre santé mentale ou à celle d'autrui. Il ne remplace pas une thérapie clinique et ne le prétend jamais.",
    color: "#bdc2ff",
  },
  {
    icon: "groups",
    title: "Inclusion et respect",
    body: "Noema est conçu pour être accessible et respectueux, quelles que soient votre origine, identité ou croyance. Toute forme de discrimination est contraire à ses valeurs fondamentales.",
    color: "#ffb68a",
  },
];

export default function EthicalAI({ onNav }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div style={{ backgroundColor: C.bg, color: C.onBackground, fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: "100vh" }}>
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "rgba(17,19,24,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: "1px solid rgba(69,70,85,0.1)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => onNav?.("landing")} style={{ background: "none", border: "none", fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1.5rem", color: C.onBackground, cursor: "pointer", padding: 0 }}>Noema</button>
          <button onClick={() => onNav?.("landing")} style={{ background: "none", border: "1px solid rgba(69,70,85,0.3)", borderRadius: 9999, color: C.onSurfaceVariant, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.8rem", padding: "8px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>arrow_back</span>
            Retour
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "120px 24px 96px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 80 }}>
          <p style={{ color: C.primary, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 600, marginBottom: 16 }}>Nos engagements</p>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "clamp(2.5rem,6vw,4.5rem)", color: C.onBackground, lineHeight: 1.1, margin: "0 0 24px" }}>IA Éthique</h1>
          <p style={{ color: C.onSurfaceVariant, fontSize: "1.1rem", maxWidth: 560, margin: "0 auto", lineHeight: 1.7, fontWeight: 300 }}>
            L'intelligence artificielle doit servir l'humain — jamais le contraire. Voici les principes qui guident chaque ligne de code de Noema.
          </p>
        </div>

        {/* Principles grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {principles.map(({ icon, title, body, color }) => (
            <div key={title} style={{ background: "rgba(30,31,37,0.4)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(69,70,85,0.15)", borderRadius: 16, padding: 32 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <span className="material-symbols-outlined" style={{ color, fontSize: "1.5rem", fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>{icon}</span>
              </div>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1.25rem", color: C.onBackground, marginBottom: 12 }}>{title}</h2>
              <p style={{ color: C.onSurfaceVariant, lineHeight: 1.7, fontSize: "0.9rem", margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <div style={{ marginTop: 80, padding: 40, background: "rgba(189,194,255,0.04)", border: "1px solid rgba(189,194,255,0.12)", borderRadius: 16, textAlign: "center" }}>
          <p style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1.5rem", color: C.onBackground, margin: "0 0 16px" }}>
            "La technologie la plus éthique est celle qui augmente l'humain sans jamais le remplacer."
          </p>
          <p style={{ color: C.onSurfaceVariant, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.2em", margin: 0 }}>Noema Labs</p>
        </div>
      </main>

      <Footer onNav={onNav} />
    </div>
  );
}

function Footer({ onNav }) {
  const links = [
    { label: "Privacy Policy", target: "privacy" },
    { label: "Terms of Service", target: "terms" },
    { label: "Ethical AI", target: "ethical-ai" },
    { label: "Contact", target: "contact" },
  ];
  return (
    <footer style={{ borderTop: "1px solid rgba(69,70,85,0.15)", backgroundColor: C.surface, padding: "40px 32px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 24 }}>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1.125rem", color: C.onBackground }}>Noema</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
          {links.map(({ label, target }) => (
            <button key={label} onClick={() => onNav?.(target)} style={{ background: "none", border: "none", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: C.outlineVariant, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "color 0.2s", padding: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = C.primary}
              onMouseLeave={e => e.currentTarget.style.color = C.outlineVariant}
            >{label}</button>
          ))}
        </div>
      </div>
    </footer>
  );
}
