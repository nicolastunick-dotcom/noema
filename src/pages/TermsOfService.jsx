import { useEffect } from "react";

const C = {
  bg: "#111318", surface: "#111318",
  outlineVariant: "#454655",
  onBackground: "#e2e2e9", onSurfaceVariant: "#c5c5d8",
  primary: "#bdc2ff", tertiary: "#ffb68a",
};

export default function TermsOfService({ onNav }) {
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

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "120px 24px 96px" }}>
        <div style={{ marginBottom: 48 }}>
          <p style={{ color: C.primary, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 600, marginBottom: 16 }}>Légal</p>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "clamp(2.5rem,6vw,4rem)", color: C.onBackground, lineHeight: 1.1, margin: "0 0 16px" }}>Conditions d'utilisation</h1>
          <p style={{ color: C.onSurfaceVariant, fontSize: "0.875rem" }}>Dernière mise à jour : 25 mars 2026</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {[
            { title: "1. Acceptation des conditions", body: "En accédant à Noema, vous acceptez les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser le service." },
            { title: "2. Description du service", body: "Noema est une application de coaching psychologique assisté par intelligence artificielle. Elle propose un espace d'introspection guidé, une cartographie psychologique personnalisée et un journal de développement personnel." },
            { title: "3. Compte utilisateur", body: "Vous êtes responsable de la confidentialité de vos identifiants. Vous vous engagez à ne pas partager votre compte et à nous notifier immédiatement de toute utilisation non autorisée." },
            { title: "4. Abonnement et paiement", body: "L'accès à Noema est soumis à un abonnement mensuel. Les paiements sont traités par Stripe. Vous pouvez annuler votre abonnement à tout moment depuis votre espace personnel, sans frais supplémentaires." },
            { title: "5. Limites du service", body: "Noema est un outil d'introspection et de développement personnel. Il ne constitue pas un substitut à un suivi médical, psychiatrique ou psychothérapeutique professionnel. En cas de détresse psychologique sévère, consultez un professionnel de santé." },
            { title: "6. Propriété intellectuelle", body: "Le contenu, le design et les algorithmes de Noema sont la propriété exclusive de Noema Labs. Vos données personnelles et le contenu de vos conversations vous appartiennent." },
            { title: "7. Résiliation", body: "Noema se réserve le droit de suspendre ou de résilier votre accès en cas de violation des présentes conditions, sans préavis ni remboursement." },
            { title: "8. Droit applicable", body: "Les présentes conditions sont régies par le droit français. Tout litige sera soumis à la compétence exclusive des tribunaux de Paris." },
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
