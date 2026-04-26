import { T } from "../../design-system/tokens";

export const A = T.color.accent.default;
export const AC = T.color.accent.container;
export const BG = `
  radial-gradient(ellipse 70% 40% at 15% -5%, rgba(120,134,255,0.10) 0%, transparent 55%),
  radial-gradient(ellipse 50% 35% at 88% 105%, rgba(189,194,255,0.06) 0%, transparent 50%),
  #0c0e13
`;

export const ALL_PAGES = [
  { label: "Landing", path: "/", icon: "home", preview: true },
  { label: "Login", path: "/login", icon: "login", preview: true },
  { label: "Pricing", path: "/pricing", icon: "payments", preview: false },
  { label: "Onboarding", path: "/onboarding-preview", icon: "auto_awesome", preview: false },
  { label: "App - Chat", path: "/app/chat", icon: "chat", preview: false },
  { label: "App - Mapping", path: "/app/mapping", icon: "hub", preview: false },
  { label: "App - Journal", path: "/app/journal", icon: "menu_book", preview: false },
  { label: "App - Today", path: "/app/today", icon: "wb_sunny", preview: false },
  { label: "Privacy", path: "/privacy", icon: "shield", preview: false },
  { label: "Terms", path: "/terms", icon: "gavel", preview: false },
  { label: "Contact", path: "/contact", icon: "mail", preview: false },
  { label: "Success", path: "/success", icon: "check_circle", preview: false },
];

export const TARGET_GROUPS = [
  { id: "all", label: "Tous les utilisateurs", icon: "group" },
  { id: "active", label: "Abonnes actifs seulement", icon: "verified" },
  { id: "trial", label: "Essai gratuit seulement", icon: "free_breakfast" },
  { id: "free", label: "Free (sans abonnement)", icon: "person" },
];

export function navTo(path) {
  const target = path.includes("?")
    ? `${path}&adminpreview=1`
    : `${path}?adminpreview=1`;
  window.history.pushState({}, "", target);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function fmt(value) {
  if (value === null || value === undefined) return "—";
  return String(value);
}

export function fmtEuros(euros) {
  if (!euros && euros !== 0) return "—";
  return `${Number(euros).toLocaleString("fr-FR")} €`;
}

export function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function phaseColor(phase) {
  if (phase === "stratege") return T.color.success;
  if (phase === "guide") return T.color.warning;
  return T.color.textMuted;
}
