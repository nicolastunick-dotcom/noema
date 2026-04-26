import { SectionHeader, StatCard } from "./AdminShared";
import { A, fmtEuros } from "./adminConstants";
import { T } from "../../design-system/tokens";

export default function OverviewTab({ stats, loading, costs, costsLoading }) {
  const cards = [
    { label: "Total utilisateurs", value: stats.totalUsers, icon: "group", color: A },
    { label: "Abonnements actifs", value: stats.activeSubs, icon: "verified", color: T.color.success },
    { label: "Revenus du mois", value: fmtEuros(stats.monthlyRevenue), icon: "payments", color: A },
    { label: "En essai gratuit", value: stats.trialUsers, icon: "free_breakfast", color: "#a78bfa" },
    { label: "Utilisateurs free", value: stats.freeUsers, icon: "person", color: T.color.textMuted },
    { label: "Sessions aujourd'hui", value: stats.sessionsToday, icon: "today", color: A },
  ];

  return (
    <div>
      <SectionHeader title="Vue d'ensemble" sub="Donnees depuis Supabase via service role" />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 40,
        }}
      >
        {cards.map((card) => (
          <StatCard key={card.label} loading={loading} {...card} />
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
        Couts API cumules
      </p>
      <div
        style={{
          borderRadius: T.radius.xl,
          border: "1px solid rgba(255,255,255,0.05)",
          overflow: "hidden",
          marginBottom: 40,
        }}
      >
        {costsLoading ? (
          <div style={{ padding: "24px", display: "flex", gap: 16 }}>
            {[1, 2].map((item) => (
              <div
                key={item}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.04)",
                  animation: "pulse 1.4s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        ) : costs?.rows?.length ? (
          <div>
            {costs.rows.map((row, index) => (
              <div
                key={row.model}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 80px 80px 80px 80px",
                  padding: "14px 24px",
                  borderBottom: index < costs.rows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "0.82rem", color: T.color.text, fontWeight: 600 }}>
                  {row.model.replace("claude-", "").replace("-20251001", "")}
                </span>
                <span style={{ fontSize: "0.72rem", color: T.color.textSub }}>{row.calls} appels</span>
                <span style={{ fontSize: "0.72rem", color: T.color.textSub }}>{(row.input / 1000).toFixed(1)}k in</span>
                <span style={{ fontSize: "0.72rem", color: T.color.textSub }}>{(row.output / 1000).toFixed(1)}k out</span>
                <span style={{ fontSize: "0.82rem", color: T.color.warning, fontWeight: 700 }}>${row.cost.toFixed(4)}</span>
              </div>
            ))}
            <div
              style={{
                padding: "12px 24px",
                background: "rgba(255,255,255,0.02)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "0.65rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: T.color.textMuted,
                  fontWeight: 700,
                }}
              >
                Total cumule
              </span>
              <span style={{ fontSize: "1rem", color: A, fontFamily: T.font.serif, fontStyle: "italic" }}>
                ${costs.total?.toFixed(4)}
              </span>
            </div>
          </div>
        ) : (
          <div style={{ padding: "32px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "0.85rem", color: T.color.textMuted, fontStyle: "italic" }}>
              Aucune donnee de cout disponible.
            </p>
          </div>
        )}
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
        Sessions recentes
      </p>
      <div style={{ borderRadius: T.radius.xl, border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
        {loading ? (
          [1, 2, 3].map((item) => (
            <div
              key={item}
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                display: "flex",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.04)",
                  marginTop: 6,
                }}
              />
              <div
                style={{
                  flex: 1,
                  height: 12,
                  borderRadius: 6,
                  background: "rgba(255,255,255,0.04)",
                  animation: "pulse 1.4s ease-in-out infinite",
                }}
              />
            </div>
          ))
        ) : stats.recentSessions?.length ? (
          stats.recentSessions.map((session, index) => (
            <div
              key={`${session.user_id}-${session.created_at}`}
              style={{
                padding: "12px 20px",
                borderBottom: index < stats.recentSessions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: A, flexShrink: 0 }} />
              <span style={{ fontSize: "0.8rem", color: T.color.textSub, flex: 1 }}>
                Session - etape {session.step ?? "—"} - user {(session.user_id || "").slice(0, 10)}...
              </span>
              <span style={{ fontSize: "0.72rem", color: T.color.textMuted }}>
                {new Date(session.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))
        ) : (
          <div style={{ padding: "28px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "0.85rem", color: T.color.textMuted, fontStyle: "italic" }}>
              Aucune session aujourd'hui.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
