const APP_TAB_PATHS = {
  chat: "/app/chat",
  mapping: "/app/mapping",
  journal: "/app/journal",
  today: "/app/today",
};

const INTERNAL_PATH_TO_TAB = {
  "/app": "chat",
  "/app/chat": "chat",
  "/chat": "chat",
  "/app/mapping": "mapping",
  "/mapping": "mapping",
  "/app/journal": "journal",
  "/journal": "journal",
  "/app/today": "today",
  "/today": "today",
};

const NAV_TARGETS = {
  landing: "/",
  pricing: "/pricing",
  login: "/login",
  onboarding: "/onboarding",
  privacy: "/privacy",
  terms: "/terms",
  "ethical-ai": "/ethical-ai",
  contact: "/contact",
  success: "/success",
  app: APP_TAB_PATHS.chat,
  chat: APP_TAB_PATHS.chat,
  mapping: APP_TAB_PATHS.mapping,
  journal: APP_TAB_PATHS.journal,
  today: APP_TAB_PATHS.today,
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);
const FALLBACK_ORIGIN = "https://noema.local";

function getBaseOrigin() {
  return typeof window !== "undefined" ? window.location.origin : FALLBACK_ORIGIN;
}

export function normalizePathname(pathname = "/") {
  const clean = pathname.split("?")[0].trim() || "/";
  if (clean === "/") return "/";
  return clean.replace(/\/+$/, "") || "/";
}

export function getAppPath(tab = "chat") {
  return APP_TAB_PATHS[tab] || APP_TAB_PATHS.chat;
}

export function isPaidSubscriptionStatus(status) {
  return ACTIVE_SUBSCRIPTION_STATUSES.has(String(status || "").toLowerCase());
}

export function hasActiveSubscriptionRecord(subscription) {
  return Boolean(subscription && isPaidSubscriptionStatus(subscription.status));
}

export function parseNoemaPath(pathname = "/") {
  const normalizedPath = normalizePathname(pathname);

  if (normalizedPath === "/") {
    return { page: "landing", appTab: null, canonicalPath: "/" };
  }

  if (normalizedPath === "/pricing") {
    return { page: "pricing", appTab: null, canonicalPath: "/pricing" };
  }

  if (normalizedPath === "/login") {
    return { page: "login", appTab: null, canonicalPath: "/login" };
  }

  if (normalizedPath === "/onboarding") {
    return { page: "onboarding", appTab: null, canonicalPath: "/onboarding" };
  }

  if (normalizedPath === "/privacy") {
    return { page: "privacy", appTab: null, canonicalPath: "/privacy" };
  }

  if (normalizedPath === "/terms") {
    return { page: "terms", appTab: null, canonicalPath: "/terms" };
  }

  if (normalizedPath === "/ethical-ai") {
    return { page: "ethical-ai", appTab: null, canonicalPath: "/ethical-ai" };
  }

  if (normalizedPath === "/contact") {
    return { page: "contact", appTab: null, canonicalPath: "/contact" };
  }

  if (normalizedPath === "/success") {
    return { page: "success", appTab: null, canonicalPath: "/success" };
  }

  if (INTERNAL_PATH_TO_TAB[normalizedPath]) {
    const appTab = INTERNAL_PATH_TO_TAB[normalizedPath];
    return { page: "app", appTab, canonicalPath: getAppPath(appTab) };
  }

  return { page: "unknown", appTab: null, canonicalPath: "/" };
}

export function sanitizeNextPath(candidate) {
  if (!candidate) return null;

  try {
    const url = new URL(candidate, getBaseOrigin());
    if (url.origin !== getBaseOrigin()) return null;

    const parsed = parseNoemaPath(url.pathname);
    if (parsed.page === "app" || parsed.page === "onboarding" || parsed.page === "pricing" || parsed.page === "landing") {
      return parsed.canonicalPath;
    }

    return null;
  } catch {
    return null;
  }
}

export function buildLocation(pathname, params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      searchParams.set(key, value);
    }
  });

  const normalizedPath = normalizePathname(pathname);
  const query = searchParams.toString();
  return query ? `${normalizedPath}?${query}` : normalizedPath;
}

export function parseNoemaLocation(pathname = "/", search = "") {
  const route = parseNoemaPath(pathname);
  const searchParams = new URLSearchParams(search || "");
  const query = Object.fromEntries(searchParams.entries());

  return {
    ...route,
    pathname: normalizePathname(pathname),
    search: searchParams.toString() ? `?${searchParams.toString()}` : "",
    query,
    reason: searchParams.get("reason") || null,
    nextPath: sanitizeNextPath(searchParams.get("next")),
  };
}

export function resolveNoemaTarget(target) {
  if (!target) return "/";

  if (target.startsWith("/")) {
    const url = new URL(target, getBaseOrigin());
    const parsed = parseNoemaPath(url.pathname);
    return buildLocation(parsed.canonicalPath, Object.fromEntries(url.searchParams.entries()));
  }

  return NAV_TARGETS[target] || "/";
}
