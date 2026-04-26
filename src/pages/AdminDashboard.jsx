import { Suspense, useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { sb } from "../lib/supabase";
import { T } from "../design-system/tokens";
import { lazyWithPreload } from "../lib/lazyWithPreload";
import { fetchFunction } from "../lib/functionFetch";
import { Icon } from "./admin/AdminShared";
import { A, AC, BG } from "./admin/adminConstants";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

const OverviewTab = lazyWithPreload(() => import("./admin/OverviewTab"));
const UsersTab = lazyWithPreload(() => import("./admin/UsersTab"));
const RevenueTab = lazyWithPreload(() => import("./admin/RevenueTab"));
const ActionsTab = lazyWithPreload(() => import("./admin/ActionsTab"));
const NavigationTab = lazyWithPreload(() => import("./admin/NavigationTab"));

const TAB_COMPONENTS = {
  overview: OverviewTab,
  users: UsersTab,
  revenue: RevenueTab,
  actions: ActionsTab,
  navigation: NavigationTab,
};

const TABS = [
  { id: "overview", label: "Vue d'ensemble", icon: "dashboard" },
  { id: "users", label: "Utilisateurs", icon: "group" },
  { id: "revenue", label: "Revenus", icon: "payments" },
  { id: "actions", label: "Actions", icon: "bolt" },
  { id: "navigation", label: "Navigation", icon: "travel_explore" },
];

async function runAdminAction(action, extra = {}) {
  if (!sb) throw new Error("Supabase non disponible");

  const { data: { session } } = await sb.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Token admin introuvable");

  const response = await fetchFunction("/.netlify/functions/admin-tools", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, ...extra }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Erreur admin-tools");
  return payload;
}

async function runBroadcast(body) {
  if (!sb) throw new Error("Supabase non disponible");

  const { data: { session } } = await sb.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Token admin introuvable");

  const response = await fetchFunction("/.netlify/functions/broadcast-message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Erreur broadcast");
  return payload;
}

function AdminTabFallback() {
  return (
    <div
      style={{
        minHeight: 320,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(226,226,233,0.72)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            border: "2px solid rgba(189,194,255,0.15)",
            borderTopColor: A,
            animation: "adminTabSpin 0.9s linear infinite",
          }}
        />
        <div style={{ fontSize: "0.86rem" }}>Preparation du dashboard...</div>
        <style>{`@keyframes adminTabSpin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

export default function AdminDashboard({ user, onNav }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [costsLoading, setCostsLoading] = useState(true);
  const [costs, setCosts] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [revenue, setRevenue] = useState({});
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState("");
  const [lastInvites, setLastInvites] = useState([]);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetFeedback, setResetFeedback] = useState("");
  const [resetTick, setResetTick] = useState(0);

  const isAdmin = user?.email && ADMIN_EMAIL && user.email === ADMIN_EMAIL;
  const ActiveTab = TAB_COMPONENTS[activeTab] ?? TAB_COMPONENTS.overview;

  const preloadTab = useCallback((tabId) => {
    TAB_COMPONENTS[tabId]?.preload?.();
  }, []);

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
    } catch (error) {
      console.error("[AdminDashboard] loadOverview:", error.message);
      if (sb) {
        try {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const [profiles, activeSubscriptions, trialSubscriptions, sessionsToday] = await Promise.all([
            sb.from("profiles").select("*", { count: "exact", head: true }),
            sb.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
            sb.from("subscriptions").select("*", { count: "exact", head: true }).in("status", ["trialing", "trial"]),
            sb.from("sessions").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
          ]);
          const totalUsers = profiles.count ?? 0;
          const activeSubs = activeSubscriptions.count ?? 0;
          setStats({
            totalUsers,
            activeSubs,
            trialUsers: trialSubscriptions.count ?? 0,
            freeUsers: Math.max(0, totalUsers - activeSubs - (trialSubscriptions.count ?? 0)),
            sessionsToday: sessionsToday.count ?? 0,
            monthlyRevenue: activeSubs * 19,
            recentSessions: [],
          });
        } catch (fallbackError) {
          console.warn("[AdminDashboard] Stat loading failed:", fallbackError?.message || fallbackError);
        }
      }
    }
    setStatsLoading(false);
    setCostsLoading(false);
  }, []);

  const loadUsers = useCallback(async (force = false) => {
    if (users.length > 0 && !force) return;
    setUsersLoading(true);
    try {
      const data = await runAdminAction("list-users");
      setUsers(data.users || []);
    } catch (error) {
      console.error("[AdminDashboard] loadUsers:", error.message);
    }
    setUsersLoading(false);
  }, [users.length]);

  const loadRevenue = useCallback(async () => {
    if (revenue.subs) return;
    setRevenueLoading(true);
    try {
      if (!sb) throw new Error("Supabase non disponible");
      const { data: subscriptions = [] } = await sb
        .from("subscriptions")
        .select("id, user_id, status, stripe_subscription_id, created_at")
        .order("created_at", { ascending: false })
        .limit(200);

      const activeSubs = subscriptions.filter((subscription) => subscription.status === "active").length;
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const thisMonthNew = subscriptions.filter((subscription) => new Date(subscription.created_at) >= thisMonthStart && subscription.status === "active").length;
      const lastMonthNew = subscriptions.filter((subscription) => {
        const createdAt = new Date(subscription.created_at);
        return createdAt >= lastMonthStart && createdAt < thisMonthStart && subscription.status === "active";
      }).length;

      setRevenue({
        mrr: activeSubs * 19,
        arr: activeSubs * 19 * 12,
        activeSubs,
        thisMonth: thisMonthNew * 19,
        lastMonth: lastMonthNew * 19,
        subs: subscriptions,
      });
    } catch (error) {
      console.error("[AdminDashboard] loadRevenue:", error.message);
    }
    setRevenueLoading(false);
  }, [revenue.subs]);

  const handleGenerateCode = useCallback(async (userId) => {
    if (!sb) {
      setInviteFeedback("Erreur : Supabase non disponible");
      return;
    }

    setInviteLoading(true);
    setInviteFeedback("");
    try {
      const { data: { session } } = await sb.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setInviteFeedback("Erreur : token admin introuvable");
        setInviteLoading(false);
        return;
      }

      const response = await fetchFunction("/.netlify/functions/create-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userId ? { target_user_id: userId } : {}),
      });

      const data = await response.json();
      if (data.token) {
        const link = `${window.location.origin}/invite?token=${data.token}`;
        setLastInvites((previous) => [{ token: data.token, link }, ...previous].slice(0, 5));
        await navigator.clipboard.writeText(link).catch(() => {});
        setInviteFeedback(`Lien copie - ${data.token}`);
      } else {
        setInviteFeedback(`Erreur : ${data.error || "inconnu"}`);
      }
    } catch (error) {
      setInviteFeedback(`Erreur : ${error.message}`);
    }
    setInviteLoading(false);
    setTimeout(() => setInviteFeedback(""), 5000);
  }, []);

  const handleResetAdmin = useCallback(async () => {
    if (!user?.id) return;

    const label = user.email || user.id;
    const confirmed = window.confirm(
      `Remettre Noema a zero pour ${label} ?\n\nCela effacera les sessions, la memoire, le journal, la memoire semantique et le quota du jour. L'acces et l'abonnement restent inchanges.`
    );

    if (!confirmed) return;

    setResetLoading(true);
    setResetFeedback("");

    try {
      await runAdminAction("reset-admin-self");
      setUsers((previous) =>
        previous.map((entry) =>
          entry.id === user.id
            ? { ...entry, phase: "perdu", lastStep: null, lastSession: null }
            : entry
        )
      );
      setResetTick((value) => value + 1);
      setResetFeedback(`Noema reinitialise pour ${label}.`);
      await Promise.all([loadOverview(), loadUsers(true)]);
    } catch (error) {
      setResetFeedback(`Erreur reset pour ${label} : ${error.message}`);
    }

    setResetLoading(false);
    setTimeout(() => setResetFeedback(""), 6000);
  }, [loadOverview, loadUsers, user]);

  useEffect(() => {
    if (isAdmin) loadOverview();
  }, [isAdmin, loadOverview]);

  useEffect(() => {
    preloadTab(activeTab);
  }, [activeTab, preloadTab]);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === "users") loadUsers();
    if (activeTab === "revenue") loadRevenue();
  }, [activeTab, isAdmin, loadUsers, loadRevenue]);

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BG,
          fontFamily: T.font.sans,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 360, padding: 40 }}>
          <Icon name="lock" fill size="3rem" color={T.color.error} style={{ display: "block", margin: "0 auto 24px" }} />
          <h1 style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "2rem", color: T.color.text, margin: "0 0 12px" }}>
            Acces refuse
          </h1>
          <p style={{ color: T.color.textSub, margin: "0 0 28px", lineHeight: 1.6 }}>
            Ce dashboard est reserve a l'administrateur Noema.
          </p>
          <button
            onClick={() => onNav?.("/")}
            style={{
              padding: "10px 24px",
              borderRadius: T.radius.full,
              background: `linear-gradient(135deg, ${A}, ${AC})`,
              border: "none",
              color: "#00118c",
              fontFamily: T.font.sans,
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Retour a l'accueil
          </button>
        </div>
      </div>
    );
  }

  const lastGreffierLog = (() => {
    try {
      return JSON.parse(localStorage.getItem("noema_last_greffier") || "null");
    } catch {
      return null;
    }
  })();
  const activeTabProps = {
    overview: {
      stats,
      loading: statsLoading,
      costs,
      costsLoading,
    },
    users: {
      users,
      loading: usersLoading,
      onGenerateCode: handleGenerateCode,
      inviteLoading,
      inviteFeedback,
      resetTick,
    },
    revenue: {
      revenue,
      loading: revenueLoading,
    },
    actions: {
      onGenerateCode: handleGenerateCode,
      inviteLoading,
      inviteFeedback,
      lastInvites,
      lastGreffierLog,
      runBroadcast,
      onResetAdmin: handleResetAdmin,
      currentUser: user,
      resetLoading,
      resetFeedback,
    },
    navigation: {},
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        color: T.color.text,
        fontFamily: T.font.sans,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @keyframes pulse { 0%,100%{opacity:.45} 50%{opacity:.9} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(189,194,255,0.2); border-radius: 4px; }
        input[type="radio"] { accent-color: ${A}; }
        input[type="checkbox"] { accent-color: ${A}; cursor: pointer; }
      `}</style>

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(12,14,19,0.9)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            padding: "0 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 60,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={() => onNav?.("/app/chat")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: T.radius.sm,
                color: T.color.textMuted,
              }}
              onMouseEnter={(event) => { event.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={(event) => { event.currentTarget.style.background = "none"; }}
            >
              <Icon name="arrow_back" size="0.9rem" color={T.color.textMuted} />
              <span style={{ fontSize: "0.78rem", fontWeight: 500 }}>App</span>
            </button>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.08)" }} />
            <span style={{ fontFamily: T.font.serif, fontStyle: "italic", fontSize: "1.25rem", color: A, letterSpacing: "-0.02em" }}>Noema</span>
            <div style={{ padding: "3px 10px", borderRadius: T.radius.full, background: `${A}14`, border: `1px solid ${A}28` }}>
              <span style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: A }}>
                Admin
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={loadOverview}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: T.radius.md,
                padding: "6px 12px",
                cursor: "pointer",
                color: T.color.textMuted,
              }}
              onMouseEnter={(event) => { event.currentTarget.style.borderColor = `${A}44`; }}
              onMouseLeave={(event) => { event.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
            >
              <Icon name="refresh" size="0.85rem" color={T.color.textMuted} />
              <span style={{ fontSize: "0.75rem" }}>Rafraichir</span>
            </button>
            <span style={{ fontSize: "0.72rem", color: T.color.textMuted }}>{user.email}</span>
          </div>
        </div>
      </header>

      <div
        style={{
          display: "flex",
          flex: 1,
          maxWidth: 1400,
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <aside
          style={{
            width: 220,
            flexShrink: 0,
            padding: "32px 16px",
            borderRight: "1px solid rgba(255,255,255,0.04)",
            position: "sticky",
            top: 60,
            height: "calc(100vh - 60px)",
            overflowY: "auto",
            boxSizing: "border-box",
          }}
        >
          <p
            style={{
              margin: "0 0 8px 10px",
              fontSize: "0.55rem",
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              color: T.color.textOff,
              fontWeight: 700,
            }}
          >
            Dashboard
          </p>
          <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onMouseEnter={() => preloadTab(tab.id)}
                  onFocus={() => preloadTab(tab.id)}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: T.radius.md,
                    background: isActive ? `${A}14` : "none",
                    border: isActive ? `1px solid ${A}22` : "1px solid transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: T.font.sans,
                    width: "100%",
                  }}
                  onMouseOver={(event) => {
                    if (!isActive) event.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  }}
                  onMouseLeave={(event) => {
                    if (!isActive) event.currentTarget.style.background = "none";
                  }}
                >
                  <Icon name={tab.icon} size="0.95rem" color={isActive ? A : T.color.textMuted} />
                  <span style={{ fontSize: "0.82rem", fontWeight: isActive ? 600 : 400, color: isActive ? A : T.color.textSub }}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main style={{ flex: 1, padding: "40px 40px 80px", minWidth: 0, overflowY: "auto" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <Suspense fallback={<AdminTabFallback />}>
                <ActiveTab
                  {...(activeTabProps[activeTab] || {})}
                />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
