export const TRIAL_DAILY_LIMIT = 15;
export const FULL_DAILY_LIMIT = 25;

export function resolveAccessTier({
  isAuthenticated = false,
  isAdmin = false,
  hasInvite = false,
  hasSubscription = false,
} = {}) {
  if (isAdmin) return "admin";
  if (hasSubscription) return "subscriber";
  if (hasInvite) return "invite";
  if (isAuthenticated) return "trial";
  return "anonymous";
}

export function hasProductAccessForTier(tier) {
  return tier !== "anonymous";
}

export function isTrialTier(tier) {
  return tier === "trial";
}

export function isFullAccessTier(tier) {
  return tier === "admin" || tier === "invite" || tier === "subscriber";
}

export function getDailyLimitForTier(tier) {
  if (tier === "admin") return null;
  if (tier === "trial") return TRIAL_DAILY_LIMIT;
  if (tier === "invite" || tier === "subscriber") return FULL_DAILY_LIMIT;
  return 0;
}

function getTierLabel(tier) {
  switch (tier) {
    case "admin":
      return "Acces admin";
    case "invite":
      return "Acces invite";
    case "subscriber":
      return "Abonnement actif";
    case "trial":
      return "Essai gratuit";
    default:
      return "Acces";
  }
}

function pluralize(count, singular, plural = `${singular}s`) {
  return count > 1 ? plural : singular;
}

export function buildQuotaState({ tier = "anonymous", used = 0 } = {}) {
  const safeUsed = Math.max(0, Number(used) || 0);
  const dailyLimit = getDailyLimitForTier(tier);
  const remaining = dailyLimit == null ? null : Math.max(0, dailyLimit - safeUsed);
  const exhausted = dailyLimit == null ? false : remaining === 0;

  return {
    tier,
    label: getTierLabel(tier),
    dailyLimit,
    used: safeUsed,
    remaining,
    exhausted,
    isTrial: isTrialTier(tier),
    isUnlimited: dailyLimit == null,
    remainingLabel: dailyLimit == null
      ? "Acces sans limite quotidienne"
      : `${remaining} ${pluralize(remaining, "message")} restant${remaining > 1 ? "s" : ""} aujourd'hui`,
    usageLabel: dailyLimit == null
      ? "Quota admin non limite"
      : `${safeUsed}/${dailyLimit} ${pluralize(dailyLimit, "message")} utilises aujourd'hui`,
    exhaustedMessage: tier === "trial"
      ? "Ton essai gratuit du jour est termine. Tu peux continuer avec Noema des maintenant, ou revenir demain."
      : "La limite du jour est atteinte. Reviens demain pour continuer.",
  };
}
