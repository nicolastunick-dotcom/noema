import { useEffect } from "react";

const C = {
  bg: "#111318", surface: "#111318",
  surfaceContainer: "#1e1f25", surfaceContainerHigh: "#282a2f",
  outlineVariant: "#454655", outline: "#8f8fa1",
  onBackground: "#e2e2e9", onSurfaceVariant: "#c5c5d8",
  primary: "#bdc2ff", primaryContainer: "#7886ff", onPrimaryContainer: "#00118c",
};

export default function PrivacyPolicy({ onNav }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div style={{ backgroundColor: C.bg, color: C.onBackground, fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: "100vh" }}>
      {/* Nav */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "rgba(17,19,24,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: "1px solid rgba(69,70,85,0.1)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => onNav?.("landing")} style={{ background: "none", border: "none", fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1.5rem", color: C.onBackground, cursor: "pointer", padding: 0 }}>Noema</button>
          <button onClick={() => onNav?.("landing")} style={{ background: "none", border: "1px solid rgba(69,70,85,0.3)", borderRadius: 9999, color: C.onSurfaceVariant, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.8rem", padding: "8px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>arrow_back</span>
            Retour
          </button>
        </div>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "120px 24px 96px" }}>
        <div style={{ marginBottom: 48 }}>
          <p style={{ color: C.primary, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 600, marginBottom: 16 }}>Légal</p>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "clamp(2.5rem,6vw,4rem)", color: C.onBackground, lineHeight: 1.1, margin: "0 0 16px" }}>Politique de confidentialité</h1>
          <p style={{ color: C.onSurfaceVariant, fontSize: "0.875rem" }}>Dernière mise à jour : 25 mars 2026</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {[
            {
              title: "1. Données collectées",
              body: "Noema collecte les données que vous fournissez lors de la création de votre compte (email, prénom), ainsi que les contenus de vos conversations avec l'IA. Ces données sont nécessaires au fonctionnement du service de cartographie psychologique."
            },
            {
              title: "2. Utilisation des données",
              body: "Vos données sont utilisées exclusivement pour améliorer votre expérience personnelle sur Noema, construire votre mémoire inter-sessions, et générer votre cartographie psychologique. Vos conversations ne sont jamais vendues ni partagées avec des tiers à des fins publicitaires."
            },
            {
              title: "3. Stockage et sécurité",
              body: "Vos données sont stockées sur Supabase (infrastructure hébergée en Europe). Les échanges sont chiffrés en transit (TLS) et au repos. Seul vous pouvez accéder à votre historique de conversation."
            },
            {
              title: "4. IA et Anthropic",
              body: "Les conversations transitent par l'API Anthropic (Claude) pour générer les réponses. Anthropic dispose de sa propre politique de confidentialité. Nous n'envoyons jamais vos données personnelles identifiables à Anthropic — seul le contenu de la conversation est transmis."
            },
            {
              title: "5. Vos droits",
              body: "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement et de portabilité de vos données. Pour exercer ces droits, contactez-nous à privacy@noema.app."
            },
            {
              title: "6. Cookies",
              body: "Noema utilise des cookies strictement nécessaires à l'authentification (session Supabase). Aucun cookie publicitaire ou de tracking tiers n'est utilisé."
            },
            {
              title: "7. Contact",
              body: "Pour toute question relative à vos données personnelles : privacy@noema.app"
            },
          ].map(({ title, body }) => (
            <div key={title} style={{ borderLeft: "2px solid rgba(189,194,255,0.2)", paddingLeft: 24 }}>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1.375rem", color: C.primary, marginBottom: 12 }}>{title}</h2>
              <p style={{ color: C.onSurfaceVariant, lineHeight: 1.8, fontSize: "0.95rem", margin: 0 }}>{body}</p>
            </div>
          ))}
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
