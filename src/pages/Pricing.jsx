import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { sb } from "../lib/supabase";
import { buildValueSnapshot } from "../lib/productProof";
import { T } from "../design-system/tokens";

// ─────────────────────────────────────────────────────────────────────────────
// Pricing — Redesign
// ─────────────────────────────────────────────────────────────────────────────

const BG = `
  radial-gradient(ellipse 80% 50% at 20% -10%, rgba(120,134,255,0.09) 0%, transparent 60%),
  radial-gradient(ellipse 60% 40% at 85% 110%, rgba(189,194,255,0.05) 0%, transparent 55%),
  #0c0e13
`;

const accent       = T.color.accent.default;
const accentCont   = T.color.accent.container;
const accentGlow   = T.color.accent.glow;

const monthlyFeatures = [
  "Chat, Mapping, Journal et Aujourd'hui",
  "Reprise visible de ce qui était déjà en cours",
  "Blocages, forces et tensions rendus lisibles",
  "Journal guidé déjà inclus",
  "Rituel du jour déjà inclus",
  "Essai gratuit disponible avant paiement",
  "25 messages par jour",
];

const honestItems = [
  { icon: "memory_alt",  title: "Pas de mémoire magique", body: "Noema garde des repères, pas une transcription totale de vos échanges." },
  { icon: "forum",       title: "25 messages / jour", body: "C'est le cadre actuel, annoncé clairement — pas de surprise." },
  { icon: "cancel",      title: "Annulable en 1 clic", body: "Sans friction, sans email de rétention. Vous partez quand vous voulez." },
];

const whyItems = [
  { icon: "timeline",    text: "Noema conserve ce qui a été clarifié — forces, blocages, tensions — et le réintroduit à chaque session." },
  { icon: "auto_stories", text: "Le Journal reste accessible, relié à ton intention active, sans repartir de zéro." },
  { icon: "wb_sunny",    text: "Aujourd'hui reprend le fil là où tu t'es arrêté. Pas de page blanche, pas de répétition." },
  { icon: "lock_open",   text: "Rien n'est perdu entre deux sessions. Ce que tu as compris reste visible." },
];

const securityBadges = [
  { icon: "lock", fill: true, label: "Paiement sécurisé Stripe" },
  { icon: "autorenew", fill: false, label: "Annulation en 1 clic" },
  { icon: "shield_with_heart", fill: true, label: "Données chiffrées" },
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

const inView = (delay = 0) => ({
  initial:     { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, margin: "-80px" },
  transition:  { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] },
});

const PRICING = {
  monthly: {
    price: "19 €",  period: "/mois", sub: "Sans engagement",
    priceId: import.meta.env.VITE_STRIPE_PRICE_MONTHLY || "price_1TAZhkQh5xNOPliA3dUAqyqP",
  },
  annual: {
    price: "180 €", period: "/an",   sub: "soit 15 €/mois · -21%", badge: "Meilleur rapport",
    priceId: import.meta.env.VITE_STRIPE_PRICE_ANNUAL || null,
  },
};

export default function Pricing({ onNav, user, accessState, notice = null }) {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError]     = useState(null);
  const [pricingValue, setPricingValue]       = useState(() => buildValueSnapshot());
  const [billing, setBilling]                 = useState("monthly"); // "monthly" | "annual"

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

  useEffect(() => {
    if (!sb || !user?.id) {
      setPricingValue(buildValueSnapshot());
      return;
    }

    let cancelled = false;

    (async () => {
      const [latestSessionResult, journalDaysResult, sessionCountResult, intentionCountResult] = await Promise.all([
        sb.from("sessions")
          .select("next_action, session_note, insights, step")
          .eq("user_id", user.id)
          .order("ended_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        sb.from("journal_entries")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        sb.from("sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        sb.from("sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .not("next_action", "is", null)
          .neq("next_action", ""),
      ]);

      if (cancelled) return;

      if (latestSessionResult.error) console.error("[Pricing] Erreur chargement session:", latestSessionResult.error);

      setPricingValue(buildValueSnapshot({
        latestSession:      latestSessionResult.data || null,
        journalDays:        journalDaysResult.count || 0,
        clarifiedIntentions: intentionCountResult.count || 0,
        sessionCount:       sessionCountResult.count || 0,
      }));
    })();

    return () => { cancelled = true; };
  }, [user?.id]);

  const isCheckingAccess      = Boolean(user && accessState?.loading);
  const hasActiveSubscription = Boolean(accessState?.hasActiveSubscription);
  const hasProductAccess      = Boolean(accessState?.hasProductAccess);
  const accessTier            = accessState?.accessTier || "anonymous";

  const handleCheckoutClick = async () => {
    const selectedPlan = PRICING[billing];
    if (!selectedPlan.priceId) {
      setCheckoutError("L'offre annuelle n'est pas encore disponible. Choisissez l'offre mensuelle.");
      return;
    }
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const { data: { session } } = await sb.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/.netlify/functions/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ plan: billing }),
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
    if (accessTier === "trial" && user && pricingValue.hasData) {
      return "Tu as déjà commencé ici. L'abonnement sert à garder ce fil visible et à reprendre sans repartir de zéro.";
    }
    if (accessTier === "trial" && user) return "Votre essai gratuit est déjà actif. L'abonnement sert à continuer quand vous êtes prêt.";
    if (hasProductAccess) return "Votre accès à Noema est déjà ouvert.";
    if (user) return "Votre essai gratuit est disponible maintenant. L'abonnement sert à continuer ensuite.";
    return "Connectez-vous pour associer l'abonnement à votre espace Noema et vérifier votre accès.";
  }, [accessTier, hasActiveSubscription, hasProductAccess, isCheckingAccess, notice, pricingValue.hasData, user]);

  const topAction = hasProductAccess
    ? { label: "Accéder à Noema", onClick: () => onNav?.("/app/chat") }
    : { label: "Accueil",          onClick: () => onNav?.("/") };

  const primaryAction = hasActiveSubscription
    ? { label: "Accéder à Noema", onClick: () => onNav?.("/app/chat"), disabled: false }
    : !user
      ? { label: "Se connecter pour continuer", onClick: () => onNav?.("/login"), disabled: false }
      : checkoutLoading
        ? { label: "Redirection...", onClick: undefined, disabled: true }
        : {
            label:    pricingValue.hasData ? "Garder ce fil vivant" : "Continuer après l'essai",
            onClick:  handleCheckoutClick,
            disabled: false,
          };

  return (
    <div style={{ minHeight: "100vh", background: BG, color: T.color.text, fontFamily: T.font.sans, overflowX: "hidden" }}>

      {/* ── Nav ── */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(12,14,19,0.85)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        <nav style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", boxSizing: "border-box" }}>
          <button
            onClick={() => onNav?.("landing")}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: T.font.serif, fontStyle: "italic", fontSize: "1.5rem", color: accent, letterSpacing: "-0.03em" }}
          >
            Noema
          </button>
          <button
            onClick={topAction.onClick}
            style={{
              background: `linear-gradient(135deg, ${accent} 0%, ${accentCont} 100%)`,
              color: "#00118c", border: "none", borderRadius: T.radius.full,
              padding: "10px 24px", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem",
            }}
          >
            {topAction.label}
          </button>
        </nav>
      </div>

      {/* ── Main ── */}
      <main style={{ position: "relative", minHeight: "100vh", padding: "128px 24px 96px", boxSizing: "border-box" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>

          {/* ── Header ── */}
          <motion.div {...inView(0)} style={{ textAlign: "center", marginBottom: 64 }}>
            {/* ── Toggle Mensuel / Annuel ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 24 }}>
              <button
                onClick={() => setBilling("monthly")}
                style={{
                  padding: "7px 18px",
                  borderRadius: 9999,
                  border: `1px solid ${billing === "monthly" ? accent : T.color.textOff}`,
                  background: billing === "monthly" ? T.color.accent.soft : "transparent",
                  color: billing === "monthly" ? accent : T.color.textMuted,
                  fontSize: "0.8rem",
                  fontWeight: billing === "monthly" ? 600 : 400,
                  cursor: "pointer",
                  fontFamily: T.font.sans,
                  transition: "all 0.2s",
                }}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBilling("annual")}
                style={{
                  padding: "7px 18px",
                  borderRadius: 9999,
                  border: `1px solid ${billing === "annual" ? accent : T.color.textOff}`,
                  background: billing === "annual" ? T.color.accent.soft : "transparent",
                  color: billing === "annual" ? accent : T.color.textMuted,
                  fontSize: "0.8rem",
                  fontWeight: billing === "annual" ? 600 : 400,
                  cursor: "pointer",
                  fontFamily: T.font.sans,
                  transition: "all 0.2s",
                }}
              >
                Annuel
                {billing !== "annual" && (
                  <span style={{ marginLeft: 6, fontSize: "0.65rem", color: T.color.success, fontWeight: 700 }}>-21%</span>
                )}
              </button>
            </div>

            <p style={{
              fontFamily: T.font.serif, fontStyle: "italic",
              fontSize: "clamp(3rem, 8vw, 5rem)", lineHeight: 1,
              letterSpacing: "-0.04em", color: accent,
              margin: "0 0 8px",
            }}>
              {PRICING[billing].price}
              <span style={{ fontSize: "clamp(1.2rem, 3vw, 1.8rem)", letterSpacing: "-0.02em" }}>{PRICING[billing].period}</span>
            </p>
            <p style={{ margin: "0 0 4px", fontSize: "0.9rem", color: T.color.textMuted, fontWeight: 400 }}>
              {PRICING[billing].sub}
            </p>
            {billing === "annual" && (
              <div style={{
                display: "inline-flex", alignItems: "center",
                padding: "4px 14px", borderRadius: 9999,
                background: `${accent}18`, border: `1px solid ${accent}44`,
                marginBottom: 8,
              }}>
                <span style={{ fontSize: "0.75rem", color: accent, fontWeight: 700, letterSpacing: "0.06em" }}>
                  {PRICING.annual.badge}
                </span>
              </div>
            )}
            <p style={{ fontSize: "1.125rem", color: T.color.textSub, fontWeight: 300, letterSpacing: "0.02em", margin: "16px 0 24px" }}>
              Pour continuer ce que tu as commencé.
            </p>
            {notice && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "8px 20px", borderRadius: T.radius.full,
                background: `${accent}14`, border: `1px solid ${accent}33`,
              }}>
                <span style={{ fontSize: "0.85rem", color: accent, fontWeight: 500 }}>{helperText}</span>
              </div>
            )}
            {!notice && (
              <p style={{ margin: "0 auto", maxWidth: 560, fontSize: "0.95rem", lineHeight: 1.6, color: "rgba(197,197,216,0.8)" }}>
                {helperText}
              </p>
            )}
          </motion.div>

          {/* ── Personal value card ── */}
          {user && pricingValue.hasData && (
            <motion.section {...inView(0.1)} style={{
              marginBottom: 48, padding: 32,
              borderRadius: T.radius.xl,
              background: "rgba(30,31,37,0.5)",
              border: `1px solid ${accent}22`,
              boxShadow: `inset 0 0 0 1px ${accent}11`,
            }}>
              <p style={{ margin: "0 0 8px", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.18em", color: accent, fontWeight: 700 }}>
                {pricingValue.title}
              </p>
              <p style={{ margin: "0 0 24px", fontSize: "0.95rem", lineHeight: 1.7, color: T.color.textSub }}>
                {pricingValue.continuation}
              </p>
              {pricingValue.stats.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 }}>
                  {pricingValue.stats.map((stat) => (
                    <div key={stat.label} style={{
                      borderRadius: T.radius.lg, padding: "20px 16px",
                      background: "rgba(17,19,24,0.5)", border: "1px solid rgba(255,255,255,0.05)",
                      textAlign: "center",
                    }}>
                      <p style={{ margin: 0, fontFamily: T.font.serif, fontStyle: "italic", fontSize: "2rem", lineHeight: 1, color: accent }}>
                        {stat.value}
                      </p>
                      <p style={{ margin: "8px 0 0", fontSize: "0.82rem", lineHeight: 1.55, color: T.color.text }}>
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {pricingValue.highlight && (
                <div style={{
                  borderRadius: T.radius.lg, padding: "16px 18px",
                  background: "rgba(17,19,24,0.42)", border: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <p style={{ margin: 0, fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.16em", color: T.color.textSub, fontWeight: 700 }}>
                    {pricingValue.highlightLabel}
                  </p>
                  <p style={{ margin: "8px 0 0", fontSize: "0.9rem", lineHeight: 1.65, color: T.color.text }}>
                    {pricingValue.highlight}
                  </p>
                </div>
              )}
              <p style={{ margin: "20px 0 0", fontSize: "0.875rem", color: T.color.textSub, lineHeight: 1.65, fontStyle: "italic" }}>
                Voilà ce que tu as déjà construit. L'abonnement sert à ne pas le perdre.
              </p>
            </motion.section>
          )}

          {/* ── Two cards ── */}
          <motion.section {...inView(0.15)} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 28, alignItems: "stretch", marginBottom: 48 }}>

            {/* Card 1 — Accès mensuel */}
            <article style={{
              position: "relative", overflow: "hidden",
              display: "flex", flexDirection: "column",
              padding: 36, borderRadius: T.radius.xl,
              background: "rgba(30,31,37,0.5)",
              backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
              border: `1px solid ${accent}33`,
              boxShadow: `0 0 40px ${accentGlow}, inset 0 0 0 1px ${accent}18`,
            }}>
              {/* Badge */}
              <div style={{
                position: "absolute", top: 0, right: 0,
                padding: "8px 18px",
                background: `linear-gradient(135deg, ${accent} 0%, ${accentCont} 100%)`,
                color: "#00118c", fontSize: "0.7rem", fontWeight: 700,
                borderBottomLeftRadius: T.radius.md, textTransform: "uppercase", letterSpacing: "0.12em",
              }}>
                Le plus courant
              </div>

              <div style={{ marginBottom: 32 }}>
                <h3 style={{ margin: "0 0 16px", color: T.color.textSub, fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em" }}>
                  {billing === "annual" ? "Accès Annuel" : "Accès Mensuel"}
                </h3>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "3.25rem", color: accent, lineHeight: 1 }}>{PRICING[billing].price}</span>
                  <span style={{ color: T.color.textSub, fontSize: "1.125rem" }}>{PRICING[billing].period}</span>
                </div>
                <p style={{ margin: "6px 0 0", fontSize: "0.8rem", color: T.color.textMuted }}>{PRICING[billing].sub}</p>
                {billing === "annual" && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", marginTop: 8,
                    padding: "3px 12px", borderRadius: 9999,
                    background: `${accent}18`, border: `1px solid ${accent}44`,
                  }}>
                    <span style={{ fontSize: "0.7rem", color: accent, fontWeight: 700, letterSpacing: "0.06em" }}>{PRICING.annual.badge}</span>
                  </div>
                )}
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 40px", display: "flex", flexDirection: "column", gap: 18, flexGrow: 1 }}>
                {monthlyFeatures.map((feature) => (
                  <li key={feature} style={{ display: "flex", alignItems: "center", gap: 12, color: T.color.text }}>
                    <SymbolIcon fill style={{ color: accent, fontSize: "1.25rem" }}>check_circle</SymbolIcon>
                    <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled}
                style={{
                  width: "100%", border: "none", borderRadius: T.radius.full,
                  padding: "16px 24px",
                  background: `linear-gradient(135deg, ${accent} 0%, ${accentCont} 100%)`,
                  color: "#00118c", fontWeight: 700, fontSize: "1rem",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  cursor: primaryAction.disabled ? "wait" : "pointer",
                  opacity: primaryAction.disabled ? 0.7 : 1,
                  boxShadow: `0 8px 32px ${accentGlow}`,
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

            {/* Card 2 — Lecture honnête */}
            <article style={{
              display: "flex", flexDirection: "column",
              padding: 36, borderRadius: T.radius.xl,
              background: "rgba(30,31,37,0.3)",
              backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
              border: `1px solid rgba(69,70,85,0.12)`,
            }}>
              <div style={{ marginBottom: 32 }}>
                <div style={{
                  display: "inline-block", marginBottom: 16,
                  padding: "6px 14px", borderRadius: T.radius.full,
                  background: "rgba(224,115,28,0.15)", color: T.color.warning,
                  border: `1px solid rgba(255,182,138,0.25)`,
                  fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
                }}>
                  Lecture honnête
                </div>
                <h3 style={{ margin: 0, fontFamily: T.font.serif, fontStyle: "italic", fontSize: "1.5rem", color: T.color.text, lineHeight: 1.2 }}>
                  Ce qu'on ne te promet pas
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 24, flexGrow: 1 }}>
                {honestItems.map((item) => (
                  <div key={item.title} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(69,70,85,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <SymbolIcon style={{ color: T.color.textMuted, fontSize: "1rem" }}>{item.icon}</SymbolIcon>
                    </div>
                    <div>
                      <p style={{ margin: "0 0 4px", fontSize: "0.9rem", fontWeight: 600, color: T.color.text }}>{item.title}</p>
                      <p style={{ margin: 0, fontSize: "0.82rem", lineHeight: 1.65, color: T.color.textSub }}>{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </motion.section>

          {/* ── Pourquoi 19€ — row of 4 cards ── */}
          <motion.section {...inView(0.2)} style={{
            padding: 32, borderRadius: T.radius.xl,
            background: "rgba(30,31,37,0.4)", border: `1px solid rgba(69,70,85,0.12)`,
            marginBottom: 64,
          }}>
            <p style={{ margin: "0 0 24px", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.18em", color: accent, fontWeight: 700 }}>
              Pourquoi 19€ ?
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              {whyItems.map(({ icon, text }) => (
                <div key={icon} style={{
                  padding: "20px 18px", borderRadius: T.radius.lg,
                  background: "rgba(17,19,24,0.4)", border: "1px solid rgba(255,255,255,0.04)",
                  display: "flex", flexDirection: "column", gap: 12,
                }}>
                  <SymbolIcon fill style={{ color: accent, fontSize: "1.25rem", flexShrink: 0 }}>{icon}</SymbolIcon>
                  <span style={{ fontSize: "0.875rem", lineHeight: 1.65, color: T.color.textSub }}>{text}</span>
                </div>
              ))}
            </div>
          </motion.section>

          {/* ── Security badges ── */}
          <motion.section {...inView(0.25)} style={{
            padding: "0 16px 80px",
            display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 40, alignItems: "center",
          }}>
            {securityBadges.map(({ icon, fill, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, color: T.color.textSub }}>
                <SymbolIcon fill={fill} style={{ color: accent, fontSize: "1.5rem" }}>{icon}</SymbolIcon>
                <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </motion.section>

        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `1px solid rgba(69,70,85,0.15)`, backgroundColor: T.color.surface }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto", padding: "48px 32px",
          display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center",
          gap: 24, boxSizing: "border-box",
        }}>
          <div>
            <div style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "1.125rem", color: T.color.text, marginBottom: 8 }}>Noema</div>
            <div style={{ fontSize: "0.875rem", color: "rgba(226,226,233,0.6)" }}>© 2025 Noema Psychological Coaching.</div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 24 }}>
            {[
              { label: "Privacy Policy",   target: "privacy" },
              { label: "Terms of Service", target: "terms" },
              { label: "Ethical AI",       target: "ethical-ai" },
              { label: "Contact Support",  target: "contact" },
            ].map(({ label, target }) => (
              <button
                key={label}
                onClick={() => onNav?.(target)}
                style={{ background: "none", border: "none", padding: 0, fontSize: "0.875rem", color: "rgba(226,226,233,0.5)", cursor: "pointer" }}
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
