import { useState, useEffect, useMemo, useCallback } from "react";
import { sb } from "./lib/supabase";
import Landing       from "./pages/Landing";
import Login         from "./pages/Login";
import Onboarding    from "./pages/Onboarding";
import AppShell      from "./pages/AppShell";
import Pricing       from "./pages/Pricing";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import EthicalAI    from "./pages/EthicalAI";
import Contact      from "./pages/Contact";
import "./styles/app.css";
import { buildLocation, getAppPath, parseNoemaLocation, resolveNoemaTarget } from "./lib/access";
import { useSubscriptionAccess } from "./hooks/useSubscriptionAccess";

// ─────────────────────────────────────────────────────────────
// ROOT — Gestion navigation + auth + verrou abonnement
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(!sb);
  const [locationState, setLocationState] = useState(() => ({
    pathname: window.location.pathname,
    search: window.location.search,
  }));
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const route = useMemo(
    () => parseNoemaLocation(locationState.pathname, locationState.search),
    [locationState.pathname, locationState.search]
  );
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

    if (nextLocation !== currentLocation) {
      window.history[method]({}, "", nextLocation);
    }

    syncLocation();
  }, [syncLocation]);

  const handleNav = useCallback((target) => {
    navigate(target);
  }, [navigate]);

  const currentAppPath = route.appTab ? getAppPath(route.appTab) : getAppPath("chat");
  const requestedNextPath = route.nextPath || currentAppPath;
  const postAccessTarget = requestedNextPath.startsWith("/app")
    ? requestedNextPath
    : getAppPath("chat");

  const routeNotice = useMemo(() => {
    if (route.reason === "auth_required") {
      return "Connectez-vous pour continuer votre exploration.";
    }

    if (route.reason === "subscription_required") {
      return "Votre acces a Noema necessite un abonnement actif.";
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
    if (!user || !access.hasActiveSubscription) {
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
        .eq("user_id", user.id)
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
  }, [user?.id, access.hasActiveSubscription]);

  useEffect(() => {
    if (!authReady) return;

    if (route.page === "unknown") {
      navigate("/", { replace: true });
      return;
    }

    if (route.page === "app") {
      if (!user) {
        navigate(buildLocation("/login", { reason: "auth_required", next: currentAppPath }), { replace: true });
        return;
      }

      if (access.loading) return;

      if (!access.hasActiveSubscription) {
        navigate(buildLocation("/pricing", { reason: "subscription_required", next: currentAppPath }), { replace: true });
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
        navigate(buildLocation("/login", { reason: "auth_required", next: "/onboarding" }), { replace: true });
        return;
      }

      if (access.loading) return;

      if (!access.hasActiveSubscription) {
        navigate(buildLocation("/pricing", { reason: "subscription_required", next: "/onboarding" }), { replace: true });
        return;
      }

      if (!onboardingReady) return;

      if (!needsOnboarding) {
        navigate(postAccessTarget, { replace: true });
      }

      return;
    }

    if (route.page === "login" && user) {
      if (access.loading) return;

      if (!access.hasActiveSubscription) {
        navigate(buildLocation("/pricing", { reason: "subscription_required", next: requestedNextPath }), { replace: true });
        return;
      }

      if (!onboardingReady) return;

      navigate(needsOnboarding ? buildLocation("/onboarding", { next: postAccessTarget }) : postAccessTarget, { replace: true });
    }
  }, [
    access.hasActiveSubscription,
    access.loading,
    authReady,
    currentAppPath,
    navigate,
    needsOnboarding,
    onboardingReady,
    postAccessTarget,
    requestedNextPath,
    route.page,
    user,
  ]);

  const shouldBlockForChecks = !authReady
    || (route.page === "app" && user && access.loading)
    || (route.page === "login" && user && access.loading)
    || (route.page === "onboarding" && user && access.loading)
    || ((route.page === "app" || route.page === "login" || route.page === "onboarding") && user && access.hasActiveSubscription && !onboardingReady);

  if (shouldBlockForChecks) {
    return <LoadingScreen message="Verification de votre acces..." />;
  }

  if (route.page === "landing") {
    return <Landing onNav={handleNav} />;
  }

  if (route.page === "privacy") {
    return <PrivacyPolicy onNav={handleNav} />;
  }

  if (route.page === "terms") {
    return <TermsOfService onNav={handleNav} />;
  }

  if (route.page === "ethical-ai") {
    return <EthicalAI onNav={handleNav} />;
  }

  if (route.page === "contact") {
    return <Contact onNav={handleNav} />;
  }

  if (route.page === "pricing") {
    return <Pricing onNav={handleNav} user={user} accessState={access} notice={pricingNotice} />;
  }

  if (route.page === "login") {
    return <Login onNav={handleNav} notice={routeNotice} checkingAccess={Boolean(user && access.loading)} />;
  }

  if (route.page === "onboarding") {
    return (
        <Onboarding
          user={user}
          sb={sb}
          onComplete={() => navigate(postAccessTarget, { replace: true })}
        />
      );
  }

  if (route.page === "app") {
    return (
      <AppShell
        onNav={handleNav}
        user={user}
        initialTab={route.appTab}
        onTabChange={(tab) => navigate(getAppPath(tab))}
      />
    );
  }

  return <LoadingScreen message="Preparation de Noema..." />;
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
        fontFamily: "'Plus Jakarta Sans', sans-serif",
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
