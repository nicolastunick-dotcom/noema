import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sb } from "../lib/supabase";
import { T } from "../design-system/tokens";

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN DASHBOARD — Noema
// Accès  : user.email === VITE_ADMIN_EMAIL
// Backend: /.netlify/functions/admin-tools  (list-users, get-overview, get-all-costs)
//          /.netlify/functions/broadcast-message
//          /.netlify/functions/create-invite
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

const A  = T.color.accent.default;
const AC = T.color.accent.container;
const BG = `
  radial-gradient(ellipse 70% 40% at 15% -5%, rgba(120,134,255,0.10) 0%, transparent 55%),
  radial-gradient(ellipse 50% 35% at 88% 105%, rgba(189,194,255,0.06) 0%, transparent 50%),
  #0c0e13
`;

// ── Pages navigables (navigation libre) ──────────────────────────────────────
const ALL_PAGES = [
  { label: "Landing",        path: "/",                   icon: "home",           preview: true  },
  { label: "Login",          path: "/login",              icon: "login",          preview: true  },
  { label: "Pricing",        path: "/pricing",            icon: "payments",       preview: false },
  { label: "Onboarding",     path: "/onboarding-preview", icon: "auto_awesome",   preview: false },
  { label: "App — Chat",     path: "/app/chat",           icon: "chat",           preview: false },
  { label: "App — Mapping",  path: "/app/mapping",        icon: "hub",            preview: false },
  { label: "App — Journal",  path: "/app/journal",        icon: "menu_book",      preview: false },
  { label: "App — Today",    path: "/app/today",          icon: "wb_sunny",       preview: false },
  { label: "Privacy",        path: "/privacy",            icon: "shield",         preview: false },
  { label: "Terms",          path: "/terms",              icon: "gavel",          preview: false },
  { label: "Contact",        path: "/contact",            icon: "mail",           preview: false },
  { label: "Success",        path: "/success",            icon: "check_circle",   preview: false },
];

const TARGET_GROUPS = [
  { id: "all",    label: "Tous les utilisateurs",   icon: "group"          },
  { id: "active", label: "Abonnés actifs seulement", icon: "verified"       },
  { id: "trial",  label: "Essai gratuit seulement",  icon: "free_breakfast" },
  { id: "free",   label: "Free (sans abonnement)",   icon: "person"         },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function navTo(path) {
  const target = path.includes("?")
    ? path + "&adminpreview=1"
    : path + "?adminpreview=1";
  window.history.pushState({}, "", target);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function fmt(n) {
  if (n === null || n === undefined) return "—";
  return String(n);
}

function fmtEuros(euros) {
  if (!euros && euros !== 0) return "—";
  return `${Number(euros).toLocaleString("fr-FR")} €`;
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function phaseColor(phase) {
  if (phase === "stratege") return T.color.success;
  if (phase === "guide")    return T.color.warning;
  return T.color.textMuted;
}

// ── Icon helper ───────────────────────────────────────────────────────────────
function Icon({ name, fill = false, size = "1.1rem", color = A, style = {} }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{
        fontSize: size, color,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
        lineHeight: 1, flexShrink: 0,
        ...style,
      }}
    >
      {name}
    </span>
  );
}

// ── Pill ──────────────────────────────────────────────────────────────────────
function Pill({ label, color = A }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px", borderRadius: T.radius.full,
      background: `${color}16`, border: `1px solid ${color}33`,
      fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase",
      letterSpacing: "0.1em", color,
    }}>
      {label}
    </span>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color = A, sub, loading }) {
  return (
    <div style={{
      padding: "24px 28px", borderRadius: T.radius.xl,
      background: "rgba(26,27,33,0.7)", border: `1px solid rgba(189,194,255,0.08)`,
      backdropFilter: "blur(16px)", display: "flex", flexDirection: "column", gap: 12,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <Icon name={icon} fill size="1.4rem" color={`${color}70`} />
      </div>
      <p style={{ margin: 0, fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.16em", color: T.color.textMuted, fontWeight: 700 }}>
        {label}
      </p>
      {loading
        ? <div style={{ height: 44, width: 90, borderRadius: 8, background: "rgba(255,255,255,0.05)", animation: "pulse 1.4s ease-in-out infinite" }} />
        : <p style={{ margin: 0, fontFamily: T.font.serif, fontStyle: "italic", fontSize: "2.5rem", lineHeight: 1, color, letterSpacing: "-0.02em" }}>
            {fmt(value)}
          </p>
      }
      {sub && <p style={{ margin: 0, fontSize: "0.72rem", color: T.color.textMuted }}>{sub}</p>}
    </div>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ margin: 0, fontFamily: T.font.serif, fontStyle: "italic", fontSize: "1.6rem", color: T.color.text, letterSpacing: "-0.02em" }}>
        {title}
      </h2>
      {sub && <p style={{ margin: "6px 0 0", fontSize: "0.85rem", color: T.color.textSub }}>{sub}</p>}
    </div>
  );
}

// ── runAdminAction — helper backend ──────────────────────────────────────────
async function runAdminAction(action, extra = {}) {
  if (!sb) throw new Error("Supabase non disponible");

  const { data: { session } } = await sb.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Token admin introuvable");

  const res = await fetch("/.netlify/functions/admin-tools", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action, ...extra }),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.error || "Erreur admin-tools");
  return payload;
}

async function runBroadcast(body) {
  if (!sb) throw new Error("Supabase non disponible");

  const { data: { session } } = await sb.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Token admin introuvable");

  const res = await fetch("/.netlify/functions/broadcast-message", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.error || "Erreur broadcast");
  return payload;
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB — Vue d'ensemble
// ─────────────────────────────────────────────────────────────────────────────
function OverviewTab({ stats, loading, costs, costsLoading }) {
  const cards = [
    { label: "Total utilisateurs",   value: stats.totalUsers,       icon: "group",          color: A },
    { label: "Abonnements actifs",   value: stats.activeSubs,       icon: "verified",       color: T.color.success },
    { label: "Revenus du mois",      value: fmtEuros(stats.monthlyRevenue), icon: "payments", color: A },
    { label: "En essai gratuit",     value: stats.trialUsers,       icon: "free_breakfast", color: "#a78bfa" },
    { label: "Utilisateurs free",    value: stats.freeUsers,        icon: "person",         color: T.color.textMuted },
    { label: "Sessions aujourd'hui", value: stats.sessionsToday,    icon: "today",          color: AC },
  ];

  return (
    <div>
      <SectionHeader title="Vue d'ensemble" sub="Données depuis Supabase via service role" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 40 }}>
        {cards.map(c => <StatCard key={c.label} loading={loading} {...c} />)}
      </div>

      {/* Coûts API */}
      <p style={{ margin: "0 0 14px", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.16em", color: T.color.textMuted, fontWeight: 700 }}>
        Coûts API cumulés
      </p>
      <div style={{ borderRadius: T.radius.xl, border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden", marginBottom: 40 }}>
        {costsLoading
          ? <div style={{ padding: "24px", display: "flex", gap: 16 }}>
              {[1,2].map(i => <div key={i} style={{ flex: 1, height: 40, borderRadius: 8, background: "rgba(255,255,255,0.04)", animation: "pulse 1.4s ease-in-out infinite" }} />)}
            </div>
          : costs?.rows?.length
            ? (
              <div>
                {costs.rows.map((r, i) => (
                  <div key={r.model} style={{
                    display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 80px",
                    padding: "14px 24px",
                    borderBottom: i < costs.rows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    alignItems: "center",
                  }}>
                    <span style={{ fontSize: "0.82rem", color: T.color.text, fontWeight: 600 }}>
                      {r.model.replace("claude-", "").replace("-20251001", "")}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: T.color.textSub }}>{r.calls} appels</span>
                    <span style={{ fontSize: "0.72rem", color: T.color.textSub }}>{(r.input / 1000).toFixed(1)}k in</span>
                    <span style={{ fontSize: "0.72rem", color: T.color.textSub }}>{(r.output / 1000).toFixed(1)}k out</span>
                    <span style={{ fontSize: "0.82rem", color: T.color.warning, fontWeight: 700 }}>${r.cost.toFixed(4)}</span>
                  </div>
                ))}
                <div style={{ padding: "12px 24px", background: "rgba(255,255,255,0.02)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.12em", color: T.color.textMuted, fontWeight: 700 }}>Total cumulé</span>
                  <span style={{ fontSize: "1rem", color: A, fontFamily: T.font.serif, fontStyle: "italic" }}>${costs.total?.toFixed(4)}</span>
                </div>
              </div>
            )
            : <div style={{ padding: "32px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "0.85rem", color: T.color.textMuted, fontStyle: "italic" }}>Aucune donnée de coût disponible.</p>
              </div>
        }
      </div>

      {/* Activité récente */}
      <p style={{ margin: "0 0 14px", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.16em", color: T.color.textMuted, fontWeight: 700 }}>
        Sessions récentes
      </p>
      <div style={{ borderRadius: T.radius.xl, border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
        {loading
          ? [1,2,3].map(i => (
              <div key={i} style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.04)", marginTop: 6 }} />
                <div style={{ flex: 1, height: 12, borderRadius: 6, background: "rgba(255,255,255,0.04)", animation: "pulse 1.4s ease-in-out infinite" }} />
              </div>
            ))
          : stats.recentSessions?.length
            ? stats.recentSessions.map((s, i) => (
                <div key={i} style={{
                  padding: "12px 20px",
                  borderBottom: i < stats.recentSessions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: A, flexShrink: 0 }} />
                  <span style={{ fontSize: "0.8rem", color: T.color.textSub, flex: 1 }}>
                    Session · étape {s.step ?? "—"} · user {(s.user_id || "").slice(0, 10)}…
                  </span>
                  <span style={{ fontSize: "0.72rem", color: T.color.textMuted }}>
                    {new Date(s.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))
            : <div style={{ padding: "28px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "0.85rem", color: T.color.textMuted, fontStyle: "italic" }}>Aucune session aujourd'hui.</p>
              </div>
        }
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB — Gestion utilisateurs
// ─────────────────────────────────────────────────────────────────────────────
function UserSessionsPanel({ userId }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!sb || !userId) { setLoading(false); return; }
    sb.from("sessions")
      .select("id, created_at, ended_at, step, next_action, session_note")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => { setSessions(data || []); setLoading(false); });
  }, [userId]);

  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(17,19,24,0.5)", padding: "16px 20px 16px 36px" }}>
      <p style={{ margin: "0 0 12px", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.14em", color: T.color.textMuted, fontWeight: 700 }}>
        Dernières sessions
      </p>
      {loading
        ? <p style={{ margin: 0, fontSize: "0.8rem", color: T.color.textMuted }}>Chargement…</p>
        : sessions.length === 0
          ? <p style={{ margin: 0, fontSize: "0.8rem", color: T.color.textMuted, fontStyle: "italic" }}>Aucune session.</p>
          : sessions.map(s => (
              <div key={s.id} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: A, marginTop: 6, flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: T.color.text, fontWeight: 500 }}>
                    {fmtDate(s.created_at)} · étape {s.step ?? "—"}
                  </p>
                  {s.next_action && (
                    <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: T.color.textSub, lineHeight: 1.5, fontStyle: "italic" }}>
                      "{s.next_action}"
                    </p>
                  )}
                </div>
              </div>
            ))
      }
    </div>
  );
}

function UsersTab({ users, loading, onGenerateCode, inviteLoading, inviteFeedback }) {
  const [search, setSearch]         = useState("");
  const [expandedUser, setExpanded] = useState(null);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (u.email || "").toLowerCase().includes(q) || (u.id || "").toLowerCase().includes(q);
  });

  const statusColor = s => {
    if (s === "active")             return T.color.success;
    if (s === "trialing" || s === "trial") return "#a78bfa";
    return T.color.textMuted;
  };

  const statusLabel = s => {
    if (s === "active")             return "Actif";
    if (s === "trialing" || s === "trial") return "Essai";
    return "Free";
  };

  return (
    <div>
      <SectionHeader title="Utilisateurs" sub={`${users.length} comptes — emails récupérés via service role`} />

      <div style={{ marginBottom: 20, position: "relative" }}>
        <Icon name="search" color={T.color.textMuted} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par email ou ID…"
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "11px 16px 11px 40px", borderRadius: T.radius.lg,
            background: "rgba(26,27,33,0.8)", border: "1px solid rgba(255,255,255,0.08)",
            color: T.color.text, fontFamily: T.font.sans, fontSize: "0.875rem", outline: "none",
          }}
        />
      </div>

      <div style={{ borderRadius: T.radius.xl, border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
        {/* Header row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 110px 100px 160px", padding: "10px 20px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          {["Email / ID", "Phase", "Inscrit le", "Statut", "Actions"].map(h => (
            <span key={h} style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.14em", color: T.color.textMuted, fontWeight: 700 }}>{h}</span>
          ))}
        </div>

        {loading
          ? [1,2,3,4,5].map(i => (
              <div key={i} style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: 16 }}>
                <div style={{ flex: 1, height: 10, borderRadius: 5, background: "rgba(255,255,255,0.04)", animation: "pulse 1.4s ease-in-out infinite" }} />
              </div>
            ))
          : filtered.length === 0
            ? <div style={{ padding: "40px", textAlign: "center" }}><p style={{ margin: 0, fontSize: "0.875rem", color: T.color.textMuted, fontStyle: "italic" }}>{search ? "Aucun résultat." : "Aucun utilisateur."}</p></div>
            : filtered.map((u, i) => (
                <div key={u.id}>
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 90px 110px 100px 160px",
                    padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)",
                    alignItems: "center",
                    background: expandedUser === u.id ? "rgba(189,194,255,0.04)" : "transparent",
                    transition: "background 0.15s",
                  }}>
                    <div>
                      <p style={{ margin: 0, fontSize: "0.82rem", color: u.isAdmin ? A : T.color.text, fontWeight: u.isAdmin ? 700 : 500 }}>
                        {u.email}
                        {u.isAdmin && <span style={{ marginLeft: 8, fontSize: "0.6rem", color: A, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>admin</span>}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: "0.65rem", color: T.color.textMuted, fontFamily: "monospace" }}>{u.id?.slice(0, 14)}…</p>
                    </div>
                    <Pill label={u.phase || "—"} color={phaseColor(u.phase)} />
                    <span style={{ fontSize: "0.78rem", color: T.color.textSub }}>{fmtDate(u.created_at)}</span>
                    <Pill label={statusLabel(u.subStatus)} color={statusColor(u.subStatus)} />
                    <div style={{ display: "flex", gap: 7 }}>
                      <button
                        onClick={() => onGenerateCode(u.id)}
                        disabled={inviteLoading}
                        style={{
                          display: "flex", alignItems: "center", gap: 4,
                          padding: "5px 10px", borderRadius: T.radius.sm,
                          background: `${A}12`, border: `1px solid ${A}28`,
                          color: A, cursor: "pointer", fontSize: "0.7rem", fontWeight: 600, fontFamily: T.font.sans,
                          opacity: inviteLoading ? 0.5 : 1,
                        }}
                      >
                        <Icon name="link" size="0.8rem" color={A} /> Code
                      </button>
                      <button
                        onClick={() => setExpanded(expandedUser === u.id ? null : u.id)}
                        style={{
                          display: "flex", alignItems: "center", gap: 4,
                          padding: "5px 10px", borderRadius: T.radius.sm,
                          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                          color: T.color.textSub, cursor: "pointer", fontSize: "0.7rem", fontWeight: 600, fontFamily: T.font.sans,
                        }}
                      >
                        <Icon name="history" size="0.8rem" color={T.color.textSub} /> Sessions
                      </button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {expandedUser === u.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
                        style={{ overflow: "hidden" }}
                      >
                        <UserSessionsPanel userId={u.id} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
        }
      </div>

      {inviteFeedback && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{
          marginTop: 16, padding: "12px 18px", borderRadius: T.radius.lg,
          background: inviteFeedback.startsWith("Erreur") ? `${T.color.error}18` : `${T.color.success}18`,
          border: `1px solid ${inviteFeedback.startsWith("Erreur") ? T.color.error : T.color.success}33`,
        }}>
          <p style={{ margin: 0, fontSize: "0.85rem", color: inviteFeedback.startsWith("Erreur") ? T.color.error : T.color.success }}>{inviteFeedback}</p>
        </motion.div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB — Revenus
// ─────────────────────────────────────────────────────────────────────────────
function RevenueTab({ revenue, loading }) {
  return (
    <div>
      <SectionHeader title="Revenus" sub="Calculé depuis subscriptions · 19 €/mois par abonnement actif" />

      <div style={{
        padding: "36px 40px", borderRadius: T.radius.xl,
        background: "rgba(26,27,33,0.7)", border: `1px solid ${A}22`,
        boxShadow: `0 0 48px rgba(189,194,255,0.07)`,
        marginBottom: 24, display: "flex", flexDirection: "column", gap: 8,
      }}>
        <p style={{ margin: 0, fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.16em", color: T.color.textMuted, fontWeight: 700 }}>MRR</p>
        {loading
          ? <div style={{ width: 160, height: 56, borderRadius: 8, background: "rgba(255,255,255,0.04)", animation: "pulse 1.4s ease-in-out infinite" }} />
          : <p style={{ margin: 0, fontFamily: T.font.serif, fontStyle: "italic", fontSize: "3.5rem", lineHeight: 1, color: A, letterSpacing: "-0.02em" }}>
              {fmtEuros(revenue.mrr)}
            </p>
        }
        <p style={{ margin: 0, fontSize: "0.82rem", color: T.color.textSub }}>
          {loading ? "…" : `${revenue.activeSubs ?? "—"} abonnements actifs × 19 €`}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 40 }}>
        {[
          { label: "Ce mois-ci",   value: fmtEuros(revenue.thisMonth), icon: "calendar_today" },
          { label: "Mois dernier", value: fmtEuros(revenue.lastMonth), icon: "event" },
          { label: "ARR estimé",   value: fmtEuros(revenue.arr),       icon: "trending_up" },
        ].map(c => (
          <div key={c.label} style={{ padding: "20px 24px", borderRadius: T.radius.xl, background: "rgba(26,27,33,0.5)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Icon name={c.icon} size="0.9rem" color={T.color.textMuted} />
              <span style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.14em", color: T.color.textMuted, fontWeight: 700 }}>{c.label}</span>
            </div>
            {loading
              ? <div style={{ height: 24, width: 80, borderRadius: 6, background: "rgba(255,255,255,0.04)" }} />
              : <p style={{ margin: 0, fontSize: "1.4rem", fontFamily: T.font.serif, fontStyle: "italic", color: T.color.text }}>{c.value}</p>
            }
          </div>
        ))}
      </div>

      <p style={{ margin: "0 0 14px", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.16em", color: T.color.textMuted, fontWeight: 700 }}>
        Historique abonnements actifs
      </p>
      <div style={{ borderRadius: T.radius.xl, border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 100px 120px", padding: "10px 20px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          {["User ID", "Stripe ID", "Statut", "Créé le"].map(h => (
            <span key={h} style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.14em", color: T.color.textMuted, fontWeight: 700 }}>{h}</span>
          ))}
        </div>
        {loading
          ? [1,2,3].map(i => <div key={i} style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", height: 10, background: "rgba(255,255,255,0.04)", animation: "pulse 1.4s ease-in-out infinite" }} />)
          : !revenue.subs?.length
            ? <div style={{ padding: "32px", textAlign: "center" }}><p style={{ margin: 0, fontSize: "0.85rem", color: T.color.textMuted, fontStyle: "italic" }}>Aucun abonnement actif.</p></div>
            : revenue.subs.map((s, i) => (
                <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1fr 140px 100px 120px", padding: "14px 20px", borderBottom: i < revenue.subs.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", alignItems: "center" }}>
                  <span style={{ fontSize: "0.72rem", color: T.color.text, fontFamily: "monospace" }}>{s.user_id?.slice(0, 16)}…</span>
                  <span style={{ fontSize: "0.68rem", color: T.color.textMuted, fontFamily: "monospace" }}>{s.stripe_subscription_id?.slice(0, 16) || "—"}</span>
                  <Pill label={s.status} color={s.status === "active" ? T.color.success : T.color.textMuted} />
                  <span style={{ fontSize: "0.75rem", color: T.color.textSub }}>{fmtDate(s.created_at)}</span>
                </div>
              ))
        }
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB — Actions rapides
// ─────────────────────────────────────────────────────────────────────────────
function ActionsTab({ onGenerateCode, inviteLoading, inviteFeedback, lastInvites, lastGreffierLog }) {
  // ── Broadcast state (self-contained) ────────────────────────
  const [subject, setSubject]               = useState("Un message de Noema");
  const [message, setMessage]               = useState("");
  const [targetGroup, setTargetGroup]       = useState("all");
  const [previewResult, setPreviewResult]   = useState(null);
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastResult, setBroadcastResult]   = useState(null);
  const [broadcastError, setBroadcastError]     = useState("");
  const [showGreffier, setShowGreffier]     = useState(false);
  const [confirmed, setConfirmed]           = useState(false);

  async function handlePreview() {
    setBroadcastLoading(true);
    setBroadcastError("");
    setPreviewResult(null);
    try {
      const r = await runBroadcast({ subject, message: message || "preview", targetGroup, previewOnly: true });
      setPreviewResult(r);
    } catch (err) {
      setBroadcastError(err.message);
    }
    setBroadcastLoading(false);
  }

  async function handleSend() {
    if (!message.trim()) { setBroadcastError("Le message est vide."); return; }
    setBroadcastLoading(true);
    setBroadcastError("");
    setBroadcastResult(null);
    setConfirmed(false);
    try {
      const r = await runBroadcast({ subject, message, targetGroup, previewOnly: false });
      setBroadcastResult(r);
      setMessage("");
      setPreviewResult(null);
    } catch (err) {
      setBroadcastError(err.message);
    }
    setBroadcastLoading(false);
  }

  return (
    <div>
      <SectionHeader title="Actions rapides" sub="Invitations · broadcast · logs système" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 }}>

        {/* ── Générer invite ── */}
        <div style={{ padding: "28px", borderRadius: T.radius.xl, background: "rgba(26,27,33,0.6)", border: `1px solid ${A}22` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: T.radius.md, background: `${A}14`, border: `1px solid ${A}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="link" fill size="1rem" color={A} />
            </div>
            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: T.color.text }}>Générer un code d'accès</h3>
          </div>
          <p style={{ margin: "0 0 20px", fontSize: "0.82rem", color: T.color.textSub, lineHeight: 1.6 }}>
            Crée un lien d'invitation beta valide à usage unique, copié automatiquement dans le presse-papier.
          </p>
          <button
            onClick={() => onGenerateCode(null)}
            disabled={inviteLoading}
            style={{
              width: "100%", padding: "12px 20px", borderRadius: T.radius.full,
              background: `linear-gradient(135deg, ${A} 0%, ${AC} 100%)`,
              border: "none", color: "#00118c",
              fontFamily: T.font.sans, fontWeight: 700, fontSize: "0.875rem",
              cursor: inviteLoading ? "wait" : "pointer",
              opacity: inviteLoading ? 0.7 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <Icon name="add_link" size="1rem" color="#00118c" />
            {inviteLoading ? "Génération…" : "Créer un lien d'invitation"}
          </button>
          {lastInvites.length > 0 && (
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {lastInvites.slice(0, 3).map(inv => (
                <div key={inv.token} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: T.radius.md, background: "rgba(17,19,24,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontSize: "0.7rem", color: A, fontFamily: "monospace" }}>{inv.token}</span>
                  <button onClick={() => navigator.clipboard.writeText(inv.link).catch(() => {})} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.7rem", color: T.color.textSub, fontFamily: T.font.sans }}>Copier</button>
                </div>
              ))}
            </div>
          )}
          {inviteFeedback && (
            <p style={{ margin: "10px 0 0", fontSize: "0.8rem", color: inviteFeedback.startsWith("Erreur") ? T.color.error : T.color.success }}>{inviteFeedback}</p>
          )}
        </div>

        {/* ── Broadcast message ── */}
        <div style={{ padding: "28px", borderRadius: T.radius.xl, background: "rgba(26,27,33,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: T.radius.md, background: `${T.color.warning}14`, border: `1px solid ${T.color.warning}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="campaign" fill size="1rem" color={T.color.warning} />
            </div>
            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: T.color.text }}>Message à tous</h3>
          </div>

          {/* Sujet */}
          <label style={{ display: "block", marginBottom: 8 }}>
            <span style={{ display: "block", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.12em", color: T.color.textMuted, fontWeight: 700, marginBottom: 6 }}>Sujet</span>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: T.radius.md,
                background: "rgba(17,19,24,0.8)", border: "1px solid rgba(255,255,255,0.07)",
                color: T.color.text, fontFamily: T.font.sans, fontSize: "0.82rem", outline: "none",
              }}
            />
          </label>

          {/* Message */}
          <label style={{ display: "block", marginBottom: 12 }}>
            <span style={{ display: "block", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.12em", color: T.color.textMuted, fontWeight: 700, marginBottom: 6 }}>Message</span>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Votre message aux utilisateurs…"
              rows={4}
              style={{
                width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: T.radius.md,
                background: "rgba(17,19,24,0.8)", border: "1px solid rgba(255,255,255,0.07)",
                color: T.color.text, fontFamily: T.font.sans, fontSize: "0.82rem", lineHeight: 1.6,
                resize: "vertical", outline: "none",
              }}
            />
          </label>

          {/* Groupe cible */}
          <div style={{ marginBottom: 16 }}>
            <span style={{ display: "block", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.12em", color: T.color.textMuted, fontWeight: 700, marginBottom: 8 }}>Destinataires</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {TARGET_GROUPS.map(g => (
                <label key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "8px 10px", borderRadius: T.radius.md, background: targetGroup === g.id ? `${A}0e` : "transparent", border: `1px solid ${targetGroup === g.id ? A + "22" : "transparent"}`, transition: "background 0.15s" }}>
                  <input type="radio" name="targetGroup" value={g.id} checked={targetGroup === g.id} onChange={() => { setTargetGroup(g.id); setPreviewResult(null); setConfirmed(false); }} style={{ display: "none" }} />
                  <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${targetGroup === g.id ? A : "rgba(255,255,255,0.2)"}`, background: targetGroup === g.id ? A : "transparent", flexShrink: 0, transition: "all 0.15s" }} />
                  <Icon name={g.icon} size="0.85rem" color={targetGroup === g.id ? A : T.color.textMuted} />
                  <span style={{ fontSize: "0.8rem", color: targetGroup === g.id ? T.color.text : T.color.textSub }}>{g.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Preview */}
          {previewResult && (
            <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: T.radius.md, background: `${A}10`, border: `1px solid ${A}22` }}>
              <p style={{ margin: 0, fontSize: "0.82rem", color: A }}>
                <strong>{previewResult.total}</strong> destinataire{previewResult.total !== 1 ? "s" : ""} pour le groupe <strong>{targetGroup}</strong>
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: T.color.textMuted }}>
                Actifs: {previewResult.breakdown?.active} · Essai: {previewResult.breakdown?.trial} · Free: {previewResult.breakdown?.free}
              </p>
              {!confirmed && (
                <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, cursor: "pointer" }}>
                  <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />
                  <span style={{ fontSize: "0.75rem", color: T.color.textSub }}>Je confirme l'envoi à {previewResult.total} utilisateur{previewResult.total !== 1 ? "s" : ""}</span>
                </label>
              )}
            </div>
          )}

          {/* Résultat envoi */}
          {broadcastResult && (
            <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: T.radius.md, background: `${T.color.success}10`, border: `1px solid ${T.color.success}28` }}>
              <p style={{ margin: 0, fontSize: "0.82rem", color: T.color.success }}>
                Envoyé à <strong>{broadcastResult.sent}</strong>/{broadcastResult.total} utilisateurs
                {broadcastResult.failed > 0 && ` · ${broadcastResult.failed} échecs`}
              </p>
            </div>
          )}

          {broadcastError && (
            <p style={{ margin: "0 0 12px", fontSize: "0.82rem", color: T.color.error }}>{broadcastError}</p>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handlePreview}
              disabled={broadcastLoading}
              style={{
                flex: 1, padding: "10px 16px", borderRadius: T.radius.full,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: T.color.textSub, fontFamily: T.font.sans, fontWeight: 600, fontSize: "0.8rem",
                cursor: broadcastLoading ? "wait" : "pointer", opacity: broadcastLoading ? 0.6 : 1,
              }}
            >
              Aperçu
            </button>
            <button
              onClick={handleSend}
              disabled={broadcastLoading || (!confirmed && previewResult !== null) || !message.trim()}
              style={{
                flex: 2, padding: "10px 16px", borderRadius: T.radius.full,
                background: confirmed || previewResult === null
                  ? `linear-gradient(135deg, ${T.color.warning}, ${T.color.warning}99)`
                  : "rgba(255,255,255,0.04)",
                border: "none", color: confirmed || previewResult === null ? "#111" : T.color.textMuted,
                fontFamily: T.font.sans, fontWeight: 700, fontSize: "0.8rem",
                cursor: (broadcastLoading || (!confirmed && previewResult !== null) || !message.trim()) ? "not-allowed" : "pointer",
                opacity: (broadcastLoading || (!confirmed && previewResult !== null)) ? 0.5 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <Icon name="send" size="0.85rem" color={confirmed || previewResult === null ? "#111" : T.color.textMuted} />
              {broadcastLoading ? "Envoi…" : "Envoyer"}
            </button>
          </div>
        </div>

        {/* ── Logs Greffier ── */}
        <div style={{ padding: "28px", borderRadius: T.radius.xl, background: "rgba(26,27,33,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: T.radius.md, background: `${T.color.success}14`, border: `1px solid ${T.color.success}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="data_object" fill size="1rem" color={T.color.success} />
            </div>
            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: T.color.text }}>Logs Greffier</h3>
          </div>
          <p style={{ margin: "0 0 16px", fontSize: "0.82rem", color: T.color.textSub, lineHeight: 1.6 }}>
            Dernier log disponible après un échange dans l'app (stocké en localStorage).
          </p>
          <button
            onClick={() => setShowGreffier(v => !v)}
            style={{
              width: "100%", padding: "11px 20px", borderRadius: T.radius.full,
              background: `${T.color.success}12`, border: `1px solid ${T.color.success}28`,
              color: T.color.success, fontFamily: T.font.sans, fontWeight: 600, fontSize: "0.875rem",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <Icon name={showGreffier ? "expand_less" : "expand_more"} size="1rem" color={T.color.success} />
            {showGreffier ? "Masquer" : "Voir les logs"}
          </button>
          <AnimatePresence>
            {showGreffier && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
                style={{ overflow: "hidden" }}
              >
                <div style={{ marginTop: 16, padding: "14px", borderRadius: T.radius.md, background: "rgba(17,19,24,0.8)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  {lastGreffierLog
                    ? <pre style={{ margin: 0, fontSize: "0.65rem", color: T.color.textSub, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                        {JSON.stringify(lastGreffierLog, null, 2)}
                      </pre>
                    : <p style={{ margin: 0, fontSize: "0.78rem", color: T.color.textMuted, fontStyle: "italic" }}>
                        Aucun log — envoie un message dans l'app d'abord.
                      </p>
                  }
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB — Navigation libre
// ─────────────────────────────────────────────────────────────────────────────
function NavigationTab() {
  const current = window.location.pathname;

  return (
    <div>
      <SectionHeader
        title="Navigation libre"
        sub="Accède à n'importe quelle page sans être bloqué par les gardes d'accès."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12 }}>
        {ALL_PAGES.map(page => {
          const isCurrent = current === (page.path === "/" ? "/" : page.path) ||
            (page.path !== "/" && current.startsWith(page.path));

          return (
            <motion.button
              key={page.path}
              onClick={() => navTo(page.path)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10,
                padding: "20px", borderRadius: T.radius.xl,
                background: isCurrent ? `${A}12` : "rgba(26,27,33,0.5)",
                border: isCurrent ? `1px solid ${A}33` : "1px solid rgba(255,255,255,0.05)",
                cursor: "pointer", textAlign: "left", fontFamily: T.font.sans,
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: T.radius.md,
                background: isCurrent ? `${A}20` : "rgba(255,255,255,0.04)",
                border: `1px solid ${isCurrent ? A + "33" : "rgba(255,255,255,0.06)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name={page.icon} size="1rem" color={isCurrent ? A : T.color.textMuted} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: isCurrent ? A : T.color.text }}>{page.label}</p>
                <p style={{ margin: "2px 0 0", fontSize: "0.65rem", color: T.color.textMuted, fontFamily: "monospace" }}>{page.path}</p>
              </div>
              {isCurrent && <Pill label="Actif" color={A} />}
            </motion.button>
          );
        })}
      </div>

      <div style={{ marginTop: 28, padding: "18px 22px", borderRadius: T.radius.xl, background: "rgba(17,19,24,0.5)", border: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Icon name="info" size="0.9rem" color={T.color.textMuted} />
          <span style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.12em", color: T.color.textMuted, fontWeight: 700 }}>Note</span>
        </div>
        <p style={{ margin: 0, fontSize: "0.82rem", color: T.color.textSub, lineHeight: 1.65 }}>
          Les pages Landing et Login redirigent normalement les utilisateurs connectés.
          Le paramètre <code style={{ background: "rgba(189,194,255,0.1)", padding: "1px 6px", borderRadius: 4, fontSize: "0.8rem" }}>?adminpreview=1</code> est ajouté automatiquement pour court-circuiter ce comportement.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TABS config
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "overview",   label: "Vue d'ensemble", icon: "dashboard"      },
  { id: "users",      label: "Utilisateurs",   icon: "group"          },
  { id: "revenue",    label: "Revenus",        icon: "payments"       },
  { id: "actions",    label: "Actions",        icon: "bolt"           },
  { id: "navigation", label: "Navigation",     icon: "travel_explore" },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminDashboard({ user, onNav }) {
  const [activeTab, setActiveTab] = useState("overview");

  // ── Data state ──────────────────────────────────────────────────────────────
  const [statsLoading, setStatsLoading]     = useState(true);
  const [stats, setStats]                   = useState({});
  const [costsLoading, setCostsLoading]     = useState(true);
  const [costs, setCosts]                   = useState(null);
  const [usersLoading, setUsersLoading]     = useState(false);
  const [users, setUsers]                   = useState([]);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [revenue, setRevenue]               = useState({});

  // ── Invite state ─────────────────────────────────────────────────────────────
  const [inviteLoading, setInviteLoading]   = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState("");
  const [lastInvites, setLastInvites]       = useState([]);

  // ── Greffier (localStorage) ──────────────────────────────────────────────────
  const lastGreffierLog = (() => {
    try { return JSON.parse(localStorage.getItem("noema_last_greffier") || "null"); }
    catch { return null; }
  })();

  // ── Auth guard ───────────────────────────────────────────────────────────────
  const isAdmin = user?.email && ADMIN_EMAIL && user.email === ADMIN_EMAIL;

  // ── Load overview ─────────────────────────────────────────────────────────────
  const loadOverview = useCallback(async () => {
    setStatsLoading(true);
    setCostsLoading(true);
    try {
      const [overviewData, costsData] = await Promise.all([
        runAdminAction("get-overview"),
        runAdminAction("get-all-costs"),
      ]);
      setStats(overviewData);
      setCosts(costsData);
    } catch (err) {
      console.error("[AdminDashboard] loadOverview:", err.message);
      // Fallback to anon client if admin-tools fails
      if (sb) {
        try {
          const today = new Date(); today.setHours(0,0,0,0);
          const [p, a, tr, s] = await Promise.all([
            sb.from("profiles").select("*", { count: "exact", head: true }),
            sb.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
            sb.from("subscriptions").select("*", { count: "exact", head: true }).in("status", ["trialing","trial"]),
            sb.from("sessions").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
          ]);
          const total = p.count ?? 0;
          const activeSubs = a.count ?? 0;
          setStats({ totalUsers: total, activeSubs, trialUsers: tr.count ?? 0, freeUsers: Math.max(0, total - activeSubs - (tr.count ?? 0)), sessionsToday: s.count ?? 0, monthlyRevenue: activeSubs * 19, recentSessions: [] });
        } catch {}
      }
    }
    setStatsLoading(false);
    setCostsLoading(false);
  }, []);

  // ── Load users ────────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    if (users.length > 0) return;
    setUsersLoading(true);
    try {
      const data = await runAdminAction("list-users");
      setUsers(data.users || []);
    } catch (err) {
      console.error("[AdminDashboard] loadUsers:", err.message);
    }
    setUsersLoading(false);
  }, [users.length]);

  // ── Load revenue ──────────────────────────────────────────────────────────────
  const loadRevenue = useCallback(async () => {
    if (revenue.subs) return;
    setRevenueLoading(true);
    try {
      if (!sb) throw new Error("Supabase non disponible");
      const { data: subs = [] } = await sb
        .from("subscriptions")
        .select("id, user_id, status, stripe_subscription_id, created_at")
        .order("created_at", { ascending: false })
        .limit(200);

      const activeSubs = subs.filter(s => s.status === "active").length;
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const thisMonthNew = subs.filter(s => new Date(s.created_at) >= thisMonthStart && s.status === "active").length;
      const lastMonthNew = subs.filter(s => {
        const d = new Date(s.created_at);
        return d >= lastMonthStart && d < thisMonthStart && s.status === "active";
      }).length;

      setRevenue({
        mrr:       activeSubs * 19,
        arr:       activeSubs * 19 * 12,
        activeSubs,
        thisMonth: thisMonthNew * 19,
        lastMonth: lastMonthNew * 19,
        subs,
      });
    } catch (err) {
      console.error("[AdminDashboard] loadRevenue:", err.message);
    }
    setRevenueLoading(false);
  }, [revenue.subs]);

  // ── Generate invite ───────────────────────────────────────────────────────────
  const handleGenerateCode = useCallback(async (userId) => {
    if (!sb) { setInviteFeedback("Erreur : Supabase non disponible"); return; }
    setInviteLoading(true);
    setInviteFeedback("");
    try {
      const { data: { session } } = await sb.auth.getSession();
      const token = session?.access_token;
      if (!token) { setInviteFeedback("Erreur : token admin introuvable"); setInviteLoading(false); return; }

      const res = await fetch("/.netlify/functions/create-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(userId ? { target_user_id: userId } : {}),
      });
      const data = await res.json();
      if (data.token) {
        const link = `${window.location.origin}/invite?token=${data.token}`;
        setLastInvites(prev => [{ token: data.token, link }, ...prev].slice(0, 5));
        await navigator.clipboard.writeText(link).catch(() => {});
        setInviteFeedback(`Lien copié — ${data.token}`);
      } else {
        setInviteFeedback(`Erreur : ${data.error || 'inconnu'}`);
      }
    } catch (err) {
      setInviteFeedback(`Erreur : ${err.message}`);
    }
    setInviteLoading(false);
    setTimeout(() => setInviteFeedback(""), 5000);
  }, []);

  // ── Effects ───────────────────────────────────────────────────────────────────
  useEffect(() => { if (isAdmin) loadOverview(); }, [isAdmin, loadOverview]);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === "users"   ) loadUsers();
    if (activeTab === "revenue" ) loadRevenue();
  }, [activeTab, isAdmin, loadUsers, loadRevenue]);

  // ── Auth guard render ─────────────────────────────────────────────────────────
  if (!user) return null;

  if (!isAdmin) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG, fontFamily: T.font.sans }}>
        <div style={{ textAlign: "center", maxWidth: 360, padding: 40 }}>
          <Icon name="lock" fill size="3rem" color={T.color.error} style={{ display: "block", margin: "0 auto 24px" }} />
          <h1 style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "2rem", color: T.color.text, margin: "0 0 12px" }}>Accès refusé</h1>
          <p style={{ color: T.color.textSub, margin: "0 0 28px", lineHeight: 1.6 }}>Ce dashboard est réservé à l'administrateur Noema.</p>
          <button onClick={() => onNav?.("/")} style={{ padding: "10px 24px", borderRadius: T.radius.full, background: `linear-gradient(135deg, ${A}, ${AC})`, border: "none", color: "#00118c", fontFamily: T.font.sans, fontWeight: 700, cursor: "pointer", fontSize: "0.875rem" }}>
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, color: T.color.text, fontFamily: T.font.sans, display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:.45} 50%{opacity:.9} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(189,194,255,0.2); border-radius: 4px; }
        input[type="radio"] { accent-color: ${A}; }
        input[type="checkbox"] { accent-color: ${A}; cursor: pointer; }
      `}</style>

      {/* ── Top nav ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(12,14,19,0.9)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={() => onNav?.("/app/chat")}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: T.radius.sm, color: T.color.textMuted }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              <Icon name="arrow_back" size="0.9rem" color={T.color.textMuted} />
              <span style={{ fontSize: "0.78rem", fontWeight: 500 }}>App</span>
            </button>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.08)" }} />
            <span style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "1.25rem", color: A, letterSpacing: "-0.02em" }}>Noema</span>
            <div style={{ padding: "3px 10px", borderRadius: T.radius.full, background: `${A}14`, border: `1px solid ${A}28` }}>
              <span style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: A }}>Admin</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={loadOverview}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: T.radius.md, padding: "6px 12px", cursor: "pointer", color: T.color.textMuted }}
              onMouseEnter={e => e.currentTarget.style.borderColor = `${A}44`}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
            >
              <Icon name="refresh" size="0.85rem" color={T.color.textMuted} />
              <span style={{ fontSize: "0.75rem" }}>Rafraîchir</span>
            </button>
            <span style={{ fontSize: "0.72rem", color: T.color.textMuted }}>{user.email}</span>
          </div>
        </div>
      </header>

      {/* ── Layout ── */}
      <div style={{ display: "flex", flex: 1, maxWidth: 1400, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>

        {/* Sidebar */}
        <aside style={{ width: 220, flexShrink: 0, padding: "32px 16px", borderRight: "1px solid rgba(255,255,255,0.04)", position: "sticky", top: 60, height: "calc(100vh - 60px)", overflowY: "auto", boxSizing: "border-box" }}>
          <p style={{ margin: "0 0 8px 10px", fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.16em", color: T.color.textOff, fontWeight: 700 }}>Dashboard</p>
          <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {TABS.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 12px", borderRadius: T.radius.md,
                    background: active ? `${A}14` : "none",
                    border: active ? `1px solid ${A}22` : "1px solid transparent",
                    cursor: "pointer", textAlign: "left",
                    fontFamily: T.font.sans, width: "100%",
                  }}
                  onMouseEnter={e => !active && (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                  onMouseLeave={e => !active && (e.currentTarget.style.background = "none")}
                >
                  <Icon name={tab.icon} size="0.95rem" color={active ? A : T.color.textMuted} />
                  <span style={{ fontSize: "0.82rem", fontWeight: active ? 600 : 400, color: active ? A : T.color.textSub }}>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main style={{ flex: 1, padding: "40px 40px 80px", minWidth: 0, overflowY: "auto" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab === "overview" && (
                <OverviewTab stats={stats} loading={statsLoading} costs={costs} costsLoading={costsLoading} />
              )}
              {activeTab === "users" && (
                <UsersTab
                  users={users} loading={usersLoading}
                  onGenerateCode={handleGenerateCode}
                  inviteLoading={inviteLoading} inviteFeedback={inviteFeedback}
                />
              )}
              {activeTab === "revenue" && (
                <RevenueTab revenue={revenue} loading={revenueLoading} />
              )}
              {activeTab === "actions" && (
                <ActionsTab
                  onGenerateCode={handleGenerateCode}
                  inviteLoading={inviteLoading} inviteFeedback={inviteFeedback}
                  lastInvites={lastInvites} lastGreffierLog={lastGreffierLog}
                />
              )}
              {activeTab === "navigation" && <NavigationTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
