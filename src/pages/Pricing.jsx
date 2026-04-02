import { useEffect, useMemo, useState } from "react";

const COLORS = {
  surfaceTint: "#bdc2ff",
  primaryContainer: "#7886ff",
  onPrimaryContainer: "#00118c",
  surfaceContainerLow: "#1a1b21",
  surfaceContainer: "#1e1f25",
  surfaceContainerHigh: "#282a2f",
  surfaceContainerHighest: "#33353a",
  outlineVariant: "#454655",
  outline: "#8f8fa1",
  onBackground: "#e2e2e9",
  onSurface: "#e2e2e9",
  onSurfaceVariant: "#c5c5d8",
  primary: "#bdc2ff",
  tertiary: "#ffb68a",
  tertiaryContainer: "#e0731c",
  background: "#111318",
  surface: "#111318",
};

const monthlyFeatures = [
  "Chat, Mapping, Journal et Aujourd'hui",
  "Continuite visible d'une session a l'autre",
  "Mapping mis a jour au fil des echanges",
  "Journal guide deja inclus",
  "Rituel du jour deja inclus",
  "25 messages par jour",
];

const proFeatures = [
  "Un abonnement actif est requis pour entrer dans l'app",
  "Le quota actuel est simple et annonce clairement",
  "Aucune promesse de memoire illimitee",
  "Pas de date annoncee pour un plan superieur",
  "Annulable a tout moment",
];

const securityBadges = [
  { icon: "lock", fill: true, label: "Paiement securise Stripe" },
  { icon: "autorenew", fill: false, label: "Annulation en 1 clic" },
  { icon: "shield_with_heart", fill: true, label: "Donnees chiffrees" },
];

function SymbolIcon({ children, fill = false, style }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 500, 'GRAD' 0, 'opsz' 24`,
        lineHeight: 1,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export default function Pricing({ onNav, user, accessState, notice = null }) {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const fonts = [
      "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap",
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap",
    ];
    fonts.forEach((href) => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
      }
    });
  }, []);

  const isCheckingAccess = Boolean(user && accessState?.loading);
  const hasActiveSubscription = Boolean(accessState?.hasActiveSubscription);

  const handleCheckoutClick = async () => {
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const { sb } = await import("../lib/supabase");
      const { data: { session } } = await sb.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/.netlify/functions/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ priceId: "price_1TAZhkQh5xNOPliA3dUAqyqP" }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Erreur checkout");
      window.location.href = data.url;
    } catch (err) {
      setCheckoutError("Une erreur est survenue. Réessaie dans un instant.");
      setCheckoutLoading(false);
    }
  };

  const helperText = useMemo(() => {
    if (notice) return notice;
    if (isCheckingAccess) return "Verification de votre acces en cours.";
    if (hasActiveSubscription) return "Votre abonnement est actif. Vous pouvez entrer dans Noema.";
    if (user) return "Votre acces a Noema necessite un abonnement actif.";
    return "Connectez-vous pour associer l'abonnement a votre espace Noema et verifier votre acces.";
  }, [hasActiveSubscription, isCheckingAccess, notice, user]);

  const topAction = hasActiveSubscription
    ? { label: "Acceder a Noema", onClick: () => onNav?.("/app/chat") }
    : { label: "Accueil", onClick: () => onNav?.("/") };

  const primaryAction = hasActiveSubscription
    ? { label: "Commencer votre introspection", onClick: () => onNav?.("/app/chat"), disabled: false }
    : !user
      ? { label: "Se connecter pour continuer", onClick: () => onNav?.("/login"), disabled: false }
      : checkoutLoading
        ? { label: "Redirection...", onClick: undefined, disabled: true }
        : { label: "Commencer maintenant", onClick: handleCheckoutClick, disabled: false };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: COLORS.background,
        color: COLORS.onSurface,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        overflowX: "hidden",
      }}
    >
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: "rgba(26, 27, 33, 0.8)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1280,
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxSizing: "border-box",
            gap: 16,
          }}
        >
          <button
            onClick={() => onNav?.("landing")}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontSize: "1.5rem",
              fontFamily: "'Instrument Serif', serif",
              fontStyle: "italic",
              color: COLORS.onBackground,
            }}
          >
            Noema
          </button>

          <button
            onClick={topAction.onClick}
            style={{
              background: "linear-gradient(135deg, #bdc2ff 0%, #7886ff 100%)",
              color: COLORS.onPrimaryContainer,
              border: "none",
              borderRadius: 9999,
              padding: "10px 24px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {topAction.label}
          </button>
        </div>
      </nav>

      <main
        style={{
          position: "relative",
          minHeight: "100vh",
          padding: "128px 24px 96px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "-10%",
            width: "50%",
            height: "50%",
            borderRadius: "50%",
            background: "rgba(120, 134, 255, 0.1)",
            filter: "blur(120px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            right: "-5%",
            width: "40%",
            height: "40%",
            borderRadius: "50%",
            background: "rgba(255, 182, 138, 0.05)",
            filter: "blur(100px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "20%",
            right: "10%",
            width: "30%",
            height: "30%",
            borderRadius: "50%",
            background: "rgba(189, 194, 255, 0.1)",
            filter: "blur(120px)",
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: 1120, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h1
              style={{
                fontSize: "clamp(3rem, 8vw, 4.5rem)",
                fontFamily: "'Instrument Serif', serif",
                fontStyle: "italic",
                color: COLORS.onSurface,
                margin: "0 0 24px",
                lineHeight: 1.05,
              }}
            >
              Commence ton exploration.
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "1.125rem",
                color: COLORS.onSurfaceVariant,
                fontWeight: 300,
                letterSpacing: "0.02em",
              }}
            >
              Acces simple, cadre explicite, annulation a tout moment.
            </p>
            <p
              style={{
                margin: "18px auto 0",
                maxWidth: 560,
                fontSize: "0.95rem",
                lineHeight: 1.6,
                color: notice ? COLORS.primary : "rgba(197, 197, 216, 0.8)",
              }}
            >
              {helperText}
            </p>
          </div>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 32,
              alignItems: "stretch",
            }}
          >
            <article
              style={{
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                padding: 32,
                borderRadius: 16,
                background: "rgba(30, 31, 37, 0.4)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: `1px solid rgba(69, 70, 85, 0.15)`,
                boxShadow: "inset 0 0 0 1px rgba(189, 194, 255, 0.2)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  padding: "8px 16px",
                  background: "linear-gradient(135deg, #bdc2ff 0%, #7886ff 100%)",
                  color: COLORS.onPrimaryContainer,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  borderBottomLeftRadius: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                }}
              >
                Le plus populaire
              </div>

              <div style={{ marginBottom: 32 }}>
                <h3
                  style={{
                    margin: "0 0 8px",
                    color: COLORS.onSurfaceVariant,
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.18em",
                  }}
                >
                  Acces Mensuel
                </h3>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span
                    style={{
                      fontSize: "3.25rem",
                      fontFamily: "'Instrument Serif', serif",
                      fontStyle: "italic",
                      color: COLORS.primary,
                      lineHeight: 1,
                    }}
                  >
                    19EUR
                  </span>
                  <span style={{ color: COLORS.onSurfaceVariant, fontSize: "1.125rem" }}>
                    /mois
                  </span>
                </div>
              </div>

              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "0 0 40px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                  flexGrow: 1,
                }}
              >
                {monthlyFeatures.map((feature) => (
                  <li
                    key={feature}
                    style={{ display: "flex", alignItems: "center", gap: 12, color: COLORS.onSurface }}
                  >
                    <SymbolIcon fill style={{ color: COLORS.primary, fontSize: "1.25rem" }}>
                      check_circle
                    </SymbolIcon>
                    <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled}
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: 9999,
                  padding: "16px 24px",
                  background: "linear-gradient(135deg, #bdc2ff 0%, #7886ff 100%)",
                  color: COLORS.onPrimaryContainer,
                  fontWeight: 700,
                  fontSize: "1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  cursor: primaryAction.disabled ? "wait" : "pointer",
                  opacity: primaryAction.disabled ? 0.7 : 1,
                }}
              >
                {primaryAction.label}
                <SymbolIcon style={{ fontSize: "1.25rem" }}>arrow_forward</SymbolIcon>
              </button>
              {checkoutError && (
                <p style={{ marginTop: 12, textAlign: "center", fontSize: "0.85rem", color: "#ff8a8a" }}>
                  {checkoutError}
                </p>
              )}
            </article>

            <article
              style={{
                display: "flex",
                flexDirection: "column",
                padding: 32,
                borderRadius: 16,
                background: "rgba(30, 31, 37, 0.4)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: `1px solid rgba(69, 70, 85, 0.1)`,
                opacity: 0.6,
                filter: "grayscale(0.5)",
              }}
            >
              <div style={{ marginBottom: 32 }}>
                <div
                  style={{
                    display: "inline-block",
                    marginBottom: 16,
                    padding: "6px 12px",
                    borderRadius: 9999,
                    background: "rgba(224, 115, 28, 0.2)",
                    color: COLORS.tertiary,
                    border: `1px solid rgba(255, 182, 138, 0.3)`,
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                    Lecture honnete
                </div>
                <h3
                  style={{
                    margin: "0 0 8px",
                    color: COLORS.onSurfaceVariant,
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.18em",
                  }}
                >
                  Cadre actuel
                </h3>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span
                    style={{
                      fontSize: "1.6rem",
                      fontFamily: "'Instrument Serif', serif",
                      fontStyle: "italic",
                      color: COLORS.onSurfaceVariant,
                      lineHeight: 1,
                    }}
                  >
                    Clair et stable
                  </span>
                </div>
              </div>

              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "0 0 40px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                  flexGrow: 1,
                  color: "rgba(226, 226, 233, 0.7)",
                }}
              >
                {proFeatures.map((feature) => (
                  <li key={feature} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <SymbolIcon style={{ color: COLORS.outline, fontSize: "1.25rem" }}>
                      lock
                    </SymbolIcon>
                    <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled
                style={{
                  width: "100%",
                  borderRadius: 9999,
                  padding: "16px 24px",
                  background: COLORS.surfaceContainerHighest,
                  color: "rgba(197, 197, 216, 0.5)",
                  border: `1px solid rgba(69, 70, 85, 0.2)`,
                  fontWeight: 700,
                  fontSize: "1rem",
                  cursor: "not-allowed",
                }}
              >
                Rien de plus a debloquer pour l'instant
              </button>
            </article>
          </section>

          <section
            style={{
              marginTop: 40,
              padding: 24,
              borderRadius: 18,
              background: "rgba(30, 31, 37, 0.4)",
              border: `1px solid rgba(69, 70, 85, 0.15)`,
            }}
          >
            <p style={{ margin: "0 0 8px", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.18em", color: COLORS.primary, fontWeight: 700 }}>
              Ce qui est vrai aujourd'hui
            </p>
            <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.7, color: COLORS.onSurfaceVariant }}>
              La continuite existe deja dans le produit, mais elle reste cadre par un quota simple.
              Journal et Aujourd'hui sont deja disponibles dans l'application. Rien ici ne promet
              une memoire illimitee ou des fonctions fantomes.
            </p>
          </section>

          <section
            style={{
              marginTop: 80,
              padding: "0 16px",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 32,
              alignItems: "center",
            }}
          >
            {securityBadges.map(({ icon, fill, label }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  color: "rgba(197, 197, 216, 0.8)",
                }}
              >
                <SymbolIcon fill={fill} style={{ color: COLORS.primary, fontSize: "1.25rem" }}>
                  {icon}
                </SymbolIcon>
                <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </section>
        </div>
      </main>

      <footer
        style={{
          borderTop: `1px solid rgba(69, 70, 85, 0.15)`,
          backgroundColor: COLORS.surface,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1280,
            margin: "0 auto",
            padding: "48px 32px",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 24,
            boxSizing: "border-box",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "1.125rem",
                fontFamily: "'Instrument Serif', serif",
                fontStyle: "italic",
                color: COLORS.onBackground,
                marginBottom: 8,
              }}
            >
              Noema
            </div>
            <div style={{ fontSize: "0.875rem", color: "rgba(226, 226, 233, 0.6)" }}>
              © 2024 Noema Psychological Coaching. All rights reserved.
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 24 }}>
            {[
              { label: "Privacy Policy", target: "privacy" },
              { label: "Terms of Service", target: "terms" },
              { label: "Ethical AI", target: "ethical-ai" },
              { label: "Contact Support", target: "contact" },
            ].map(({ label, target }) => (
              <button
                key={label}
                onClick={() => onNav?.(target)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  fontSize: "0.875rem",
                  color: "rgba(226, 226, 233, 0.5)",
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
