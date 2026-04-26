import { Icon, Pill, SectionHeader } from "./AdminShared";
import { fmtDate, fmtEuros } from "./adminConstants";
import { T } from "../../design-system/tokens";

export default function RevenueTab({ revenue, loading }) {
  return (
    <div>
      <SectionHeader title="Revenus" sub="Calcule depuis subscriptions - 19 EUR/mois par abonnement actif" />

      <div
        style={{
          padding: "36px 40px",
          borderRadius: T.radius.xl,
          background: "rgba(26,27,33,0.7)",
          border: `1px solid ${T.color.accent.default}22`,
          boxShadow: "0 0 48px rgba(189,194,255,0.07)",
          marginBottom: 24,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "0.62rem",
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            color: T.color.textMuted,
            fontWeight: 700,
          }}
        >
          MRR
        </p>
        {loading ? (
          <div
            style={{
              width: 160,
              height: 56,
              borderRadius: 8,
              background: "rgba(255,255,255,0.04)",
              animation: "pulse 1.4s ease-in-out infinite",
            }}
          />
        ) : (
          <p
            style={{
              margin: 0,
              fontFamily: T.font.serif,
              fontStyle: "italic",
              fontSize: "3.5rem",
              lineHeight: 1,
              color: T.color.accent.default,
              letterSpacing: "-0.02em",
            }}
          >
            {fmtEuros(revenue.mrr)}
          </p>
        )}
        <p style={{ margin: 0, fontSize: "0.82rem", color: T.color.textSub }}>
          {loading ? "..." : `${revenue.activeSubs ?? "—"} abonnements actifs x 19 EUR`}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 40,
        }}
      >
        {[
          { label: "Ce mois-ci", value: fmtEuros(revenue.thisMonth), icon: "calendar_today" },
          { label: "Mois dernier", value: fmtEuros(revenue.lastMonth), icon: "event" },
          { label: "ARR estime", value: fmtEuros(revenue.arr), icon: "trending_up" },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              padding: "20px 24px",
              borderRadius: T.radius.xl,
              background: "rgba(26,27,33,0.5)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Icon name={card.icon} size="0.9rem" color={T.color.textMuted} />
              <span
                style={{
                  fontSize: "0.6rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  color: T.color.textMuted,
                  fontWeight: 700,
                }}
              >
                {card.label}
              </span>
            </div>
            {loading ? (
              <div style={{ height: 24, width: 80, borderRadius: 6, background: "rgba(255,255,255,0.04)" }} />
            ) : (
              <p style={{ margin: 0, fontSize: "1.4rem", fontFamily: T.font.serif, fontStyle: "italic", color: T.color.text }}>
                {card.value}
              </p>
            )}
          </div>
        ))}
      </div>

      <p
        style={{
          margin: "0 0 14px",
          fontSize: "0.62rem",
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          color: T.color.textMuted,
          fontWeight: 700,
        }}
      >
        Historique abonnements actifs
      </p>
      <div style={{ borderRadius: T.radius.xl, border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 140px 100px 120px",
            padding: "10px 20px",
            background: "rgba(255,255,255,0.02)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {["User ID", "Stripe ID", "Statut", "Cree le"].map((header) => (
            <span
              key={header}
              style={{
                fontSize: "0.6rem",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: T.color.textMuted,
                fontWeight: 700,
              }}
            >
              {header}
            </span>
          ))}
        </div>
        {loading ? (
          [1, 2, 3].map((item) => (
            <div
              key={item}
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                height: 10,
                background: "rgba(255,255,255,0.04)",
                animation: "pulse 1.4s ease-in-out infinite",
              }}
            />
          ))
        ) : !revenue.subs?.length ? (
          <div style={{ padding: "32px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "0.85rem", color: T.color.textMuted, fontStyle: "italic" }}>
              Aucun abonnement actif.
            </p>
          </div>
        ) : (
          revenue.subs.map((subscription, index) => (
            <div
              key={subscription.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 140px 100px 120px",
                padding: "14px 20px",
                borderBottom: index < revenue.subs.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "0.72rem", color: T.color.text, fontFamily: "monospace" }}>
                {subscription.user_id?.slice(0, 16)}...
              </span>
              <span style={{ fontSize: "0.68rem", color: T.color.textMuted, fontFamily: "monospace" }}>
                {subscription.stripe_subscription_id?.slice(0, 16) || "—"}
              </span>
              <Pill label={subscription.status} color={subscription.status === "active" ? T.color.success : T.color.textMuted} />
              <span style={{ fontSize: "0.75rem", color: T.color.textSub }}>{fmtDate(subscription.created_at)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
