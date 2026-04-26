import { useCallback, useEffect, useRef, useState } from "react";

const COLORS = {
  background: "#0D0F14",
  surface: "#111318",
  onBackground: "#e2e2e9",
  onSurfaceVariant: "#c5c5d8",
  primary: "#bdc2ff",
  primaryContainer: "#7886ff",
  onPrimaryContainer: "#00118c",
};

export default function Success({ onNav, user, sb }) {
  const [subStatus, setSubStatus] = useState("loading"); // "loading" | "active" | "pending"
  const [refreshing, setRefreshing] = useState(false);
  const [remainingChecks, setRemainingChecks] = useState(5);
  const pollTimeoutRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = "auto";
    return () => {
      document.body.style.overflow = "";
      if (pollTimeoutRef.current) window.clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  const checkSubscription = useCallback(async ({ manual = false } = {}) => {
    if (!user || !sb) {
      setSubStatus("pending");
      setRefreshing(false);
      return false;
    }

    if (manual) setRefreshing(true);

    const { data } = await sb.from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .catch(() => ({ data: null }));

    const s = data?.status;
    const isActive = s === "active" || s === "trialing";
    setSubStatus(isActive ? "active" : "pending");
    setRefreshing(false);
    return isActive;
  }, [sb, user]);

  useEffect(() => {
    let cancelled = false;

    async function runChecks() {
      if (pollTimeoutRef.current) window.clearTimeout(pollTimeoutRef.current);
      setRemainingChecks(5);
      const isActive = await checkSubscription();
      if (cancelled || isActive) return;

      let checks = 0;
      const scheduleNext = () => {
        if (cancelled || checks >= 5) return;
        pollTimeoutRef.current = window.setTimeout(async () => {
          checks += 1;
          setRemainingChecks(Math.max(0, 5 - checks));
          const nextActive = await checkSubscription();
          if (!nextActive) scheduleNext();
        }, 8000);
      };

      scheduleNext();
    }

    runChecks();

    return () => {
      cancelled = true;
      if (pollTimeoutRef.current) window.clearTimeout(pollTimeoutRef.current);
    };
  }, [checkSubscription]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: COLORS.background,
        color: COLORS.onBackground,
        fontFamily: "'Figtree', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(120,134,255,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 480 }}>
        {/* Checkmark icon */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "rgba(189,194,255,0.1)",
            border: "1px solid rgba(189,194,255,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 40px",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: "2.5rem",
              color: COLORS.primary,
              fontVariationSettings: "'FILL' 1, 'wght' 300",
            }}
          >
            check_circle
          </span>
        </div>

        {/* Logo */}
        <p
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: "1.1rem",
            color: "rgba(189,194,255,0.6)",
            marginBottom: 24,
          }}
        >
          Noema
        </p>

        {/* Headline */}
        <h1
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: "clamp(2rem, 5vw, 3rem)",
            lineHeight: 1.15,
            color: COLORS.onBackground,
            marginBottom: 20,
          }}
        >
          {subStatus === "active"
            ? "Ton exploration commence maintenant."
            : "Merci pour ton abonnement."}
        </h1>

        <p
          style={{
            fontSize: "1rem",
            color: COLORS.onSurfaceVariant,
            lineHeight: 1.7,
            marginBottom: 20,
          }}
        >
          {subStatus === "loading"
            ? "Vérification de ton accès en cours…"
            : subStatus === "active"
            ? "Ton abonnement est confirmé. L'accès a l'app est maintenant ouvert."
            : remainingChecks > 0
              ? "Activation en cours. Nous reverifions automatiquement ton acces pendant moins d'une minute."
              : "Activation toujours en attente. Si tu viens de payer, un nouveau controle peut suffire."}
        </p>

        {subStatus === "pending" && (
          <p style={{ margin: "0 0 28px", fontSize: "0.82rem", color: "rgba(197,197,216,0.72)", lineHeight: 1.6 }}>
            {remainingChecks > 0
              ? `${remainingChecks} verification${remainingChecks > 1 ? "s" : ""} automatique${remainingChecks > 1 ? "s" : ""} restante${remainingChecks > 1 ? "s" : ""}.`
              : "Tu peux lancer une verification manuelle ci-dessous."}
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
          {subStatus === "active" && (
            <button
              onClick={() => onNav?.("/app/chat")}
              style={{
                background: "linear-gradient(135deg, #bdc2ff 0%, #7886ff 100%)",
                color: COLORS.onPrimaryContainer,
                border: "none",
                borderRadius: 9999,
                padding: "16px 40px",
                fontSize: "1rem",
                fontWeight: 700,
                fontFamily: "'Figtree', sans-serif",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(120,134,255,0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Acceder a Noema
            </button>
          )}

          {subStatus !== "active" && (
            <button
              onClick={() => checkSubscription({ manual: true })}
              disabled={refreshing}
              style={{
                background: "rgba(189,194,255,0.08)",
                color: COLORS.primary,
                border: "1px solid rgba(189,194,255,0.2)",
                borderRadius: 9999,
                padding: "14px 28px",
                fontSize: "0.95rem",
                fontWeight: 600,
                fontFamily: "'Figtree', sans-serif",
                cursor: refreshing ? "wait" : "pointer",
                opacity: refreshing ? 0.7 : 1,
              }}
            >
              {refreshing ? "Verification..." : "Verifier a nouveau"}
            </button>
          )}

          <button
            onClick={() => onNav?.(subStatus === "active" ? "/" : "/pricing")}
            style={{
              background: "none",
              color: "rgba(226,226,233,0.72)",
              border: "none",
              padding: 0,
              fontSize: "0.85rem",
              fontFamily: "'Figtree', sans-serif",
              cursor: "pointer",
            }}
          >
            {subStatus === "active" ? "Retour a l'accueil" : "Revenir au pricing"}
          </button>
        </div>
      </div>
    </div>
  );
}
