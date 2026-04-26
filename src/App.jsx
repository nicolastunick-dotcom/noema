import { Suspense, useState, useEffect, useMemo, useCallback } from "react";
import { sb } from "./lib/supabase";
import "./styles/app.css";
import { buildLocation, getAppPath, parseNoemaLocation, resolveNoemaTarget } from "./lib/access";
import { useSubscriptionAccess } from "./hooks/useSubscriptionAccess";
import { lazyWithPreload } from "./lib/lazyWithPreload";

const Landing = lazyWithPreload(() => import("./pages/Landing"));
const Login = lazyWithPreload(() => import("./pages/Login"));
const Onboarding = lazyWithPreload(() => import("./pages/Onboarding"));
const AppShell = lazyWithPreload(() => import("./pages/AppShell"));
const Pricing = lazyWithPreload(() => import("./pages/Pricing"));
const PrivacyPolicy = lazyWithPreload(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazyWithPreload(() => import("./pages/TermsOfService"));
const EthicalAI = lazyWithPreload(() => import("./pages/EthicalAI"));
const Contact = lazyWithPreload(() => import("./pages/Contact"));
const Success = lazyWithPreload(() => import("./pages/Success"));
const ResetPassword = lazyWithPreload(() => import("./pages/ResetPassword"));
const InvitePage = lazyWithPreload(() => import("./pages/InvitePage"));
const AdminDashboard = lazyWithPreload(() => import("./pages/AdminDashboard"));

const ROUTE_COMPONENTS = {
  landing: Landing,
  pricing: Pricing,
  login: Login,
  onboarding: Onboarding,
  privacy: PrivacyPolicy,
  terms: TermsOfService,
  "ethical-ai": EthicalAI,
  contact: Contact,
  success: Success,
  "reset-password": ResetPassword,
  invite: InvitePage,
  "onboarding-preview": Onboarding,
  app: AppShell,
  admin: AdminDashboard,
};

function preloadRouteTarget(target) {
  if (typeof window === "undefined") return;

  const resolvedLocation = resolveNoemaTarget(target);
  const nextUrl = new URL(resolvedLocation, window.location.origin);
  const nextRoute = parseNoemaLocation(nextUrl.pathname, nextUrl.search);
  ROUTE_COMPONENTS[nextRoute.page]?.preload?.();
}

// ─────────────────────────────────────────────────────────────
// ROOT — Gestion navigation + auth + verrou abonnement
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(!sb);
  const [locationState, setLocationState] = useState(() => {
    return { pathname: window.location.pathname, search: window.location.search };
  });
  const [onboardingReady, setOnboardingReady] = useState(!sb);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const route = useMemo(
    () => parseNoemaLocation(locationState.pathname, locationState.search),
    [locationState.pathname, locationState.search]
  );
  const userId = user?.id;
  const isAdminPreview = route.query?.adminpreview === "1";
  const access = useSubscriptionAccess(user);

  const syncLocation = useCallback(() => {
    setLocationState({
      pathname: window.location.pathname,
      search: window.location.search,
    });
  }, []);

  const navigate = useCallback((target, options = {}) => {
    const nextLocation = resolveNoemaTarget(target);
    const currentLocation = `${window.location.pathname}${window.location.search}`;
    const method = options.replace ? "replaceState" : "pushState";

    preloadRouteTarget(nextLocation);

    if (nextLocation !== currentLocation) {
      window.history[method]({}, "", nextLocation);
    }

    syncLocation();
  }, [syncLocation]);

  const handleNav = useCallback((target) => {
    navigate(target);
  }, [navigate]);

  const currentAppPath = route.appTab ? getAppPath(route.appTab) : getAppPath("today");
  const requestedNextPath = route.nextPath || currentAppPath;
  const postAccessTarget = requestedNextPath.startsWith("/app")
    ? requestedNextPath
    : getAppPath("today");

  const routeNotice = useMemo(() => {
    if (route.reason === "auth_required") {
      return "Connectez-vous pour continuer votre exploration.";
    }

    if (route.reason === "subscription_required") {
      return "Votre acces a Noema commence par un essai gratuit. L'abonnement sert ensuite a continuer.";
    }

    return null;
  }, [route.reason]);

  const pricingNotice = access.error && user
    ? "Nous n'avons pas pu verifier votre abonnement pour le moment."
    : routeNotice;

  useEffect(() => {
    window.addEventListener("popstate", syncLocation);
    return () => window.removeEventListener("popstate", syncLocation);
  }, [syncLocation]);

  useEffect(() => {
    if (!sb) {
      setAuthReady(true);
      return;
    }

    sb.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setAuthReady(true);
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId || !access.hasProductAccess) {
      setNeedsOnboarding(false);
      setOnboardingReady(true);
      return;
    }

    let cancelled = false;
    setOnboardingReady(false);

    if (!sb) {
      setNeedsOnboarding(false);
      setOnboardingReady(true);
      return;
    }

    (async () => {
      const { data, error } = await sb
        .from("memory")
        .select("onboarding_done")
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("[Noema] Erreur verification onboarding:", error);
        setNeedsOnboarding(false);
      } else if (data === null) {
        setNeedsOnboarding(true);
      } else {
        setNeedsOnboarding(data.onboarding_done === false);
      }

      setOnboardingReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, access.hasProductAccess]);

  useEffect(() => {
    if (!authReady) return;

    if (route.page === "unknown") {
      navigate("/", { replace: true });
      return;
    }

    if (route.page === "app") {
      if (!user) {
        navigate("/", { replace: true });
        return;
      }

      if (access.loading) return;
      if (!access.hasProductAccess) {
        navigate(buildLocation("/pricing", { reason: "subscription_required" }), { replace: true });
        return;
      }

      if (!onboardingReady) return;

      if (needsOnboarding) {
        navigate(buildLocation("/onboarding", { next: currentAppPath }), { replace: true });
      }

      return;
    }

    if (route.page === "onboarding") {
      if (!user) {
        navigate("/", { replace: true });
        return;
      }

      if (!onboardingReady) return;

      if (!needsOnboarding && !isAdminPreview) {
        navigate(postAccessTarget, { replace: true });
      }

      return;
    }

    if (route.page === "login" && user && !isAdminPreview) {
      if (!onboardingReady) return;

      navigate(needsOnboarding ? buildLocation("/onboarding", { next: postAccessTarget }) : postAccessTarget, { replace: true });
    }

    // Utilisateur connecté + abonnement actif sur la landing → redirige vers l'app
    // Sauf si l'admin prévisualise la page avec ?adminpreview=1
    if (route.page === "landing" && user && authReady && !isAdminPreview) {
      if (access.loading) return;
      if (!access.hasProductAccess) return;

      if (!onboardingReady) return;

      // Nettoie le hash Supabase si présent (cas confirmation email)
      if (window.location.hash) window.history.replaceState({}, "", window.location.pathname);

      navigate(needsOnboarding ? buildLocation("/onboarding", { next: getAppPath("today") }) : getAppPath("today"), { replace: true });
    }

    // Login bypass adminpreview
    if (route.page === "login" && user && isAdminPreview) return;

    // Onboarding bypass adminpreview
    if (route.page === "onboarding" && !needsOnboarding && isAdminPreview) return;
  }, [
    access.hasProductAccess,
    access.loading,
    authReady,
    currentAppPath,
    navigate,
    needsOnboarding,
    onboardingReady,
    postAccessTarget,
    requestedNextPath,
    isAdminPreview,
    route.page,
    user,
  ]);

  // Admin bypass : ?adminpreview=1 sur les pages qui redirigent les utilisateurs connectés

  // Sprint 1.1 : bloquer le rendu d'AppShell tant que l'entitlement n'est pas résolu (prod uniquement).
  // Sans ce garde, AppShell peut monter avec accessState.loading=true et déclencher openingMessage()
  // avant que useSubscriptionAccess ait terminé son check admin/sub/invite.
  // Exception : page admin elle-même ne doit pas bloquer.
  const shouldBlockForChecks = route.page !== "admin" && (
    !authReady
    || (route.page === "app" && user && access.loading)
    || ((route.page === "app" || route.page === "login" || route.page === "onboarding") && user && !onboardingReady)
  );

  if (shouldBlockForChecks) {
    return <LoadingScreen message="Verification de votre acces..." />;
  }

  let pageView = <LoadingScreen message="Preparation de Noema..." />;

  if (route.page === "landing") {
    pageView = <Landing onNav={handleNav} />;
  }

  if (route.page === "privacy") {
    pageView = <PrivacyPolicy onNav={handleNav} />;
  }

  if (route.page === "terms") {
    pageView = <TermsOfService onNav={handleNav} />;
  }

  if (route.page === "ethical-ai") {
    pageView = <EthicalAI onNav={handleNav} />;
  }

  if (route.page === "contact") {
    pageView = <Contact onNav={handleNav} />;
  }

  if (route.page === "success") {
    pageView = <Success onNav={handleNav} user={user} sb={sb} />;
  }

  if (route.page === "reset-password") {
    pageView = <ResetPassword onNav={handleNav} />;
  }

  if (route.page === "invite") {
    pageView = <InvitePage onNav={handleNav} route={route} />;
  }

  if (route.page === "onboarding-preview") {
    pageView = (
      <Onboarding
        user={null}
        sb={null}
        onComplete={() => navigate("/", { replace: true })}
      />
    );
  }

  if (route.page === "pricing") {
    pageView = <Pricing onNav={handleNav} user={user} accessState={access} notice={pricingNotice} />;
  }

  if (route.page === "login") {
    pageView = <Login onNav={handleNav} notice={routeNotice} checkingAccess={Boolean(user && access.loading)} />;
  }

  if (route.page === "onboarding") {
    pageView = (
      <Onboarding
        user={user}
        sb={sb}
        onComplete={() => { setNeedsOnboarding(false); navigate(postAccessTarget, { replace: true }); }}
      />
    );
  }

  if (route.page === "app") {
    pageView = (
      <AppShell
        onNav={handleNav}
        user={user}
        initialTab={route.appTab}
        onTabChange={(tab) => navigate(getAppPath(tab))}
        accessState={access}
      />
    );
  }

  if (route.page === "admin") {
    pageView = <AdminDashboard user={user} onNav={handleNav} />;
  }

  return (
    <Suspense fallback={<LoadingScreen message="Preparation de Noema..." />}>
      {pageView}
    </Suspense>
  );
}

function LoadingScreen({ message }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#111318",
        color: "#e2e2e9",
        fontFamily: "'Figtree', sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            border: "2px solid rgba(189,194,255,0.15)",
            borderTopColor: "#bdc2ff",
            animation: "noemaSpin 0.9s linear infinite",
          }}
        />
        <div style={{ fontSize: "0.9rem", color: "rgba(226,226,233,0.75)" }}>{message}</div>
        <style>{`@keyframes noemaSpin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}
