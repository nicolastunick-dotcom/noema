/* eslint-disable */
// ─── Google Fonts ──────────────────────────────────────────────────────────────
import { useEffect } from "react";
import NoemaOrb from "../components/NoemaOrb";

const COLORS = {
  background: "#0D0F14",
  surface: "#111318",
  surfaceContainerLow: "#1a1b21",
  surfaceContainer: "#1e1f25",
  surfaceContainerHigh: "#282a2f",
  surfaceContainerHighest: "#33353a",
  surfaceContainerLowest: "#0c0e13",
  outlineVariant: "#454655",
  outline: "#8f8fa1",
  onBackground: "#e2e2e9",
  onSurface: "#e2e2e9",
  onSurfaceVariant: "#c5c5d8",
  primary: "#bdc2ff",
  primaryContainer: "#7886ff",
  onPrimaryContainer: "#00118c",
  primaryFixedDim: "#bdc2ff",
  tertiary: "#ffb68a",
  tertiaryContainer: "#e0731c",
};

const styles = {
  // ── Layout
  body: {
    backgroundColor: COLORS.background,
    color: COLORS.onBackground,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    margin: 0,
    minHeight: "100vh",
    overflowX: "hidden",
  },

  // ── Nav
  nav: {
    position: "fixed",
    top: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: 1280,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 32px",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    zIndex: 50,
    boxSizing: "border-box",
  },
  navLogo: {
    fontSize: "1.5rem",
    fontFamily: "'Instrument Serif', serif",
    fontWeight: 700,
    color: COLORS.onBackground,
    letterSpacing: "-0.05em",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: 40,
  },
  navLink: {
    color: "rgba(226,226,233,0.7)",
    fontFamily: "'Newsreader', serif",
    fontStyle: "italic",
    fontSize: "1.125rem",
    letterSpacing: "-0.02em",
    textDecoration: "none",
    transition: "color 0.3s",
  },
  navLinkActive: {
    color: COLORS.primary,
    fontFamily: "'Newsreader', serif",
    fontStyle: "italic",
    fontSize: "1.125rem",
    letterSpacing: "-0.02em",
    textDecoration: "none",
    borderBottom: `1px solid rgba(189,194,255,0.3)`,
    fontWeight: 600,
  },
  navActions: {
    display: "flex",
    alignItems: "center",
    gap: 24,
  },
  btnLogin: {
    background: "none",
    border: "none",
    color: "rgba(226,226,233,0.7)",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 500,
    fontSize: "1rem",
    cursor: "pointer",
    transition: "color 0.2s",
  },
  btnGetStarted: {
    background: "linear-gradient(135deg, #bdc2ff 0%, #7886ff 100%)",
    color: COLORS.onPrimaryContainer,
    border: "none",
    borderRadius: 9999,
    padding: "10px 24px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 600,
    fontSize: "1rem",
    cursor: "pointer",
    transition: "transform 0.15s",
  },

  // ── Ambient decoratives
  ambientPurple: {
    position: "absolute",
    top: "-10%",
    left: "-10%",
    width: "60%",
    height: "60%",
    background: "radial-gradient(circle at 50% 50%, rgba(120,134,255,0.15) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  ambientAmber: {
    position: "absolute",
    top: "20%",
    right: "-10%",
    width: "50%",
    height: "50%",
    background: "radial-gradient(circle at 50% 50%, rgba(255,182,138,0.1) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  ambientBlue: {
    position: "absolute",
    bottom: "-10%",
    left: "20%",
    width: "70%",
    height: "70%",
    background: "radial-gradient(circle at 50% 50%, rgba(189,194,255,0.1) 0%, transparent 70%)",
    pointerEvents: "none",
  },

  // ── Hero
  heroSection: {
    position: "relative",
    paddingTop: 20,
    paddingBottom: 128,
    paddingLeft: 24,
    paddingRight: 24,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    maxWidth: 1024,
    margin: "0 auto",
  },
  heroTopCta: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "12px 28px",
    borderRadius: 9999,
    border: "1px solid rgba(189,194,255,0.22)",
    background: "rgba(30,31,37,0.55)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    color: COLORS.primary,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 600,
    fontSize: "0.95rem",
    cursor: "pointer",
    marginBottom: 28,
    boxShadow: "0 18px 45px rgba(0,0,0,0.18)",
    transition: "transform 0.2s, border-color 0.2s",
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "4px 16px",
    borderRadius: 9999,
    background: COLORS.surfaceContainerLow,
    border: `1px solid rgba(69,70,85,0.1)`,
    marginBottom: 32,
  },
  heroBadgeIcon: {
    color: COLORS.primary,
    fontSize: "0.875rem",
    fontFamily: "'Material Symbols Outlined'",
    fontWeight: 300,
    fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24",
  },
  heroBadgeText: {
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.15em",
    color: COLORS.onSurfaceVariant,
    fontWeight: 600,
  },
  heroH1: {
    fontFamily: "'Instrument Serif', serif",
    fontSize: "clamp(3rem, 8vw, 7rem)",
    lineHeight: 0.9,
    letterSpacing: "-0.05em",
    color: COLORS.onBackground,
    marginBottom: 40,
    maxWidth: 900,
    fontStyle: "italic",
  },
  heroH1Gradient: {
    background: "linear-gradient(135deg, #bdc2ff 0%, #7886ff 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  heroSub: {
    color: COLORS.onSurfaceVariant,
    fontSize: "1.125rem",
    maxWidth: 640,
    marginBottom: 48,
    fontWeight: 300,
    lineHeight: 1.7,
  },
  heroBtns: {
    display: "flex",
    flexWrap: "wrap",
    gap: 24,
    justifyContent: "center",
  },
  btnPrimary: {
    background: "linear-gradient(135deg, #bdc2ff 0%, #7886ff 100%)",
    color: COLORS.onPrimaryContainer,
    border: "none",
    borderRadius: 9999,
    padding: "20px 40px",
    fontSize: "1.125rem",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 20px 40px rgba(189,194,255,0.1)",
    transition: "transform 0.2s",
  },
  btnSecondary: {
    background: "none",
    border: `1px solid rgba(69,70,85,0.2)`,
    borderRadius: 9999,
    padding: "20px 40px",
    fontSize: "1.125rem",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 600,
    color: COLORS.onSurface,
    cursor: "pointer",
    transition: "background 0.2s",
  },

  // ── Glass card
  glassCard: {
    background: "rgba(30,31,37,0.4)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1px solid rgba(69,70,85,0.15)",
  },

  // ── Footer
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
    borderTop: `1px solid rgba(69,70,85,0.15)`,
    backgroundColor: COLORS.surface,
    padding: "48px 32px",
  },
};

export default function Landing({ onNav }) {
  // Autoriser le scroll sur la landing (app.css met overflow:hidden sur body)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Inject Google Fonts
  useEffect(() => {
    const fonts = [
      "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Newsreader:ital,wght@0,400;0,700;1,400;1,700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap",
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

  const handleNavHover = (e, active) => {
    e.currentTarget.style.color = active ? COLORS.onBackground : "rgba(226,226,233,0.7)";
  };

  return (
    <div style={styles.body}>
      {/* ── TopNavBar ─────────────────────────────────────────────────────────── */}
      <nav style={styles.nav}>
        <div style={styles.navLogo}>Noema</div>
        <div />
        <div style={styles.navActions}>
          <button
            style={{
              background: "none",
              border: "1px solid rgba(189,194,255,0.22)",
              borderRadius: 9999,
              padding: "8px 20px",
              color: COLORS.primary,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "border-color 0.2s, background 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(189,194,255,0.45)";
              e.currentTarget.style.background = "rgba(189,194,255,0.07)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(189,194,255,0.22)";
              e.currentTarget.style.background = "none";
            }}
            onClick={() => onNav?.("pricing")}
          >
            Découvrir l'abonnement
            <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>arrow_forward</span>
          </button>
          <button
            style={styles.btnLogin}
            onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.onBackground)}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(226,226,233,0.7)")}
            onClick={() => onNav?.("login")}
          >
            Se connecter
          </button>
          <button
            style={styles.btnGetStarted}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onClick={() => onNav?.("login")}
          >
            Entrer dans Noema
          </button>
        </div>
      </nav>

      {/* ── Main ──────────────────────────────────────────────────────────────── */}
      <main style={{ position: "relative", overflow: "hidden" }}>
        {/* Ambient decoratives */}
        <div style={styles.ambientPurple} />
        <div style={styles.ambientAmber} />
        <div style={styles.ambientBlue} />

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section style={styles.heroSection}>
          {/* Orbe 3D animée */}
          <div style={{ marginBottom: -48 }}>
            <NoemaOrb size={600} showText={false} />
          </div>

          <div style={styles.heroBadge}>
            <span
              style={styles.heroBadgeIcon}
              className="material-symbols-outlined"
            >
              timeline
            </span>
            <span style={styles.heroBadgeText}>Conversation continue, cadre clair, essai gratuit disponible</span>
          </div>

          <h1 style={styles.heroH1}>
            Un espace pour penser plus clair,{" "}
            <span style={styles.heroH1Gradient}>sans perdre le fil.</span>
          </h1>

          <p style={styles.heroSub}>
            Noema t'aide a reprendre une conversation, faire ressortir les points qui
            comptent, et transformer une intention en action concrete. Pas de promesse
            magique : un chat, un mapping, un journal et un rituel du jour deja relies.
            L'essai gratuit est la pour te laisser vivre cela avant de payer.
          </p>

          <div style={styles.heroBtns}>
            <button
              style={styles.btnPrimary}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onClick={() => onNav?.("login")}
            >
              Commencer
            </button>
            <button
              style={styles.btnSecondary}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = COLORS.surfaceContainerLow)
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              onClick={() => onNav?.("onboarding-preview")}
            >
              Comment ça marche ?
            </button>
          </div>
        </section>

        {/* ── Feature Bento Grid ──────────────────────────────────────────────── */}
        <section
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "96px 24px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, 1fr)",
              gap: 24,
            }}
          >
            {/* Chat Feature — col-span-8 */}
            <div
              style={{
                ...styles.glassCard,
                gridColumn: "span 8",
                borderRadius: 24,
                padding: 40,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 500,
                overflow: "hidden",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow = "0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(189,194,255,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ position: "relative", zIndex: 1 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    background: "rgba(189,194,255,0.1)",
                    borderRadius: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 24,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      color: COLORS.primary,
                      fontSize: "1.875rem",
                      fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24",
                    }}
                  >
                    psychology
                  </span>
                </div>
                <h3
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: "2.25rem",
                    fontStyle: "italic",
                    color: COLORS.onBackground,
                    marginBottom: 16,
                  }}
                >
                  Le chat garde le fil
                </h3>
                <p
                  style={{
                    color: COLORS.onSurfaceVariant,
                    maxWidth: 448,
                    lineHeight: 1.7,
                    fontSize: "1.125rem",
                  }}
                >
                  Noema remet en surface l'intention active, le dernier point travaille
                  et le contexte utile deja present. Quand tu reviens, la conversation ne
                  fait plus semblant de repartir de zero.
                </p>
              </div>

              {/* Chat preview */}
              <div
                style={{
                  marginTop: 32,
                  height: 192,
                  borderRadius: 12,
                  background: "rgba(12,14,19,0.5)",
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  border: `1px solid rgba(69,70,85,0.1)`,
                }}
              >
                <div
                  style={{
                    alignSelf: "flex-start",
                    background: COLORS.surfaceContainer,
                    padding: "8px 16px",
                    borderRadius: "16px 16px 16px 4px",
                    maxWidth: "80%",
                    fontSize: "0.875rem",
                    fontFamily: "'Instrument Serif', serif",
                    fontStyle: "italic",
                    color: COLORS.primary,
                  }}
                >
                  On reprend • Intention active : clarifier ce que tu evites depuis hier
                </div>
                <div
                  style={{
                    alignSelf: "flex-end",
                    background: "rgba(120,134,255,0.2)",
                    padding: "8px 16px",
                    borderRadius: "16px 16px 4px 16px",
                    maxWidth: "80%",
                    fontSize: "0.875rem",
                    lineHeight: 1.6,
                    color: COLORS.onSurface,
                  }}
                >
                  Repars de ce qui est encore vivant aujourd'hui. Nous pouvons reprendre
                  ce point ou ouvrir un angle plus net.
                </div>
              </div>
            </div>

            {/* Journal Guidé — col-span-4 */}
            <div
              style={{
                ...styles.glassCard,
                gridColumn: "span 4",
                borderRadius: 24,
                padding: 40,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow = "0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(255,182,138,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  marginBottom: 32,
                  padding: 16,
                  background: "rgba(255,182,138,0.1)",
                  borderRadius: 9999,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    color: COLORS.tertiary,
                    fontSize: "2.5rem",
                    fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24",
                  }}
                >
                  draw
                </span>
              </div>
              <h3
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: "1.875rem",
                  fontStyle: "italic",
                  color: COLORS.onBackground,
                  marginBottom: 16,
                }}
              >
                Journal guide
              </h3>
              <p
                style={{
                  color: COLORS.onSurfaceVariant,
                  fontSize: "0.875rem",
                  lineHeight: 1.7,
                }}
              >
                Un espace deja present dans l'app pour ecrire, garder une trace et
                transformer l'intention du moment en un pas concret.
              </p>
            </div>

            {/* Cartographie — col-span-4 */}
            <div
              style={{
                ...styles.glassCard,
                gridColumn: "span 4",
                borderRadius: 24,
                padding: 40,
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow = "0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(189,194,255,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ marginBottom: 24 }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    color: COLORS.primary,
                    fontSize: "1.875rem",
                    fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24",
                  }}
                >
                  hub
                </span>
              </div>
              <h3
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: "1.875rem",
                  fontStyle: "italic",
                  color: COLORS.onBackground,
                  marginBottom: 16,
                }}
              >
                Mapping vivant
              </h3>
              <p
                style={{
                  color: COLORS.onSurfaceVariant,
                  fontSize: "0.875rem",
                  lineHeight: 1.7,
                  marginBottom: 32,
                }}
              >
                Les forces, contradictions et blocages visibles se mettent a jour au fil
                des echanges. Le but n'est pas d'impressionner, mais de rendre la
                continuite lisible.
              </p>

              {/* Bar chart */}
              <div
                style={{
                  marginTop: "auto",
                  height: 128,
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 8,
                }}
              >
                {[
                  { opacity: 0.2, height: "40%" },
                  { opacity: 0.4, height: "70%" },
                  { opacity: 0.2, height: "50%" },
                  { opacity: 0.6, height: "85%" },
                  { opacity: 0.3, height: "45%" },
                ].map((bar, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      background: `rgba(189,194,255,${bar.opacity})`,
                      borderRadius: "4px 4px 0 0",
                      height: bar.height,
                      transition: "height 0.2s",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Product surface — col-span-8 */}
            <div
              style={{
                ...styles.glassCard,
                gridColumn: "span 8",
                borderRadius: 24,
                padding: 32,
                display: "flex",
                flexDirection: "column",
                gap: 24,
              }}
            >
              <div>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 12px",
                  borderRadius: 9999,
                  background: "rgba(189,194,255,0.08)",
                  border: "1px solid rgba(189,194,255,0.12)",
                  color: COLORS.primary,
                  fontSize: "0.72rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  fontWeight: 700,
                }}>
                  Ce que tu verras vraiment
                </span>
                <h3 style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: "2rem",
                  fontStyle: "italic",
                  color: COLORS.onBackground,
                  margin: "18px 0 12px",
                }}>
                  Des surfaces deja actives, pas des promesses floues.
                </h3>
                <p style={{
                  color: COLORS.onSurfaceVariant,
                  fontSize: "1rem",
                  lineHeight: 1.7,
                  maxWidth: 560,
                  margin: 0,
                }}>
                  Aujourd'hui, Journal et Mapping sont deja presents dans le produit. Le
                  cadre reste simple : 25 messages par jour, une conversation continue,
                  et des reperes visibles quand tu reviens.
                </p>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 16,
              }}>
                {[
                  { label: "Chat", value: "On reprend", body: "Intention active visible" },
                  { label: "Aujourd'hui", value: "1 intention", body: "Un pas concret pour la journee" },
                  { label: "Journal", value: "1 entree / jour", body: "Relire, ecrire, garder trace" },
                ].map((card) => (
                  <div
                    key={card.label}
                    style={{
                      borderRadius: 18,
                      padding: 20,
                      background: "rgba(12,14,19,0.45)",
                      border: "1px solid rgba(69,70,85,0.16)",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: "0.68rem", letterSpacing: "0.16em", textTransform: "uppercase", color: COLORS.outline }}>
                      {card.label}
                    </p>
                    <p style={{ margin: "14px 0 8px", fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1.45rem", color: COLORS.onBackground }}>
                      {card.value}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: COLORS.onSurfaceVariant, lineHeight: 1.6 }}>
                      {card.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Truth Section ─────────────────────────────────────────────────────── */}
        <section
          style={{
            padding: "128px 24px",
            maxWidth: 1024,
            margin: "0 auto",
          }}
        >
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 20,
          }}>
            {[
              {
                title: "Continuite visible",
                body: "Quand tu reviens, Noema remet en surface l'intention active ou le dernier point travaille au lieu de faire semblant de redemarrer.",
              },
              {
                title: "Quota explicite",
                body: "Le cadre du produit est annonce simplement : 25 messages par jour, sans surprise cachee dans l'experience.",
              },
              {
                title: "Promesse sobre",
                body: "Landing, pricing et onboarding parlent de ce qui existe deja, pas d'une version futuriste encore non branchee.",
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  ...styles.glassCard,
                  borderRadius: 20,
                  padding: 24,
                }}
              >
                <h4 style={{
                  margin: "0 0 12px",
                  fontFamily: "'Instrument Serif', serif",
                  fontStyle: "italic",
                  fontSize: "1.45rem",
                  color: COLORS.onBackground,
                }}>
                  {item.title}
                </h4>
                <p style={{
                  margin: 0,
                  fontSize: "0.92rem",
                  lineHeight: 1.7,
                  color: COLORS.onSurfaceVariant,
                }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer style={styles.footer}>
        <div style={{ marginBottom: 0 }}>
          <div
            style={{
              fontFamily: "'Newsreader', serif",
              fontSize: "1.125rem",
              color: COLORS.onBackground,
              fontWeight: 700,
              fontStyle: "italic",
              marginBottom: 8,
            }}
          >
            Noema
          </div>
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: COLORS.outlineVariant,
            }}
          >
            © 2024 Noema. Conversation introspective continue.
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 32 }}>
          {[
            { label: "Privacy Policy", target: "privacy" },
            { label: "Terms of Service", target: "terms" },
            { label: "Ethical AI", target: "ethical-ai" },
            { label: "Contact", target: "contact" },
          ].map(({ label, target }) => (
            <button
              key={label}
              onClick={() => onNav?.(target)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: COLORS.outlineVariant,
                cursor: "pointer",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.primary)}
              onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.outlineVariant)}
            >
              {label}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
