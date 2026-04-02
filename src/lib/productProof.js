const STEP_LABELS = [
  "Point de depart",
  "Exploration ouverte",
  "Forces qui emergent",
  "Blocage qui se precise",
  "Contradiction rendue visible",
  "Direction qui se clarifie",
  "Passage a l'action",
];

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function pluralize(count, singular, plural = `${singular}s`) {
  return count > 1 ? plural : singular;
}

export function buildProofState({ insights, nextAction, step } = {}) {
  const safeInsights = insights || {};
  const safeBlocages = safeInsights.blocages || {};
  const forces = Array.isArray(safeInsights.forces) ? safeInsights.forces.filter(Boolean) : [];
  const contradictions = Array.isArray(safeInsights.contradictions) ? safeInsights.contradictions.filter(Boolean) : [];
  const normalizedNextAction = normalizeText(nextAction);
  const normalizedRootBlock = normalizeText(safeBlocages.racine);

  const items = [];

  if (normalizedNextAction) {
    items.push({ label: "Prochain pas deja clarifie", value: normalizedNextAction });
  }

  if (normalizedRootBlock) {
    items.push({ label: "Blocage devenu visible", value: normalizedRootBlock });
  } else if (contradictions[0]) {
    items.push({ label: "Tension qui revient", value: normalizeText(contradictions[0]) });
  }

  if (forces[0]) {
    items.push({ label: "Force qui apparait", value: normalizeText(forces[0]) });
  }

  if (typeof step === "number" && step > 0) {
    const labelIndex = Math.min(step, STEP_LABELS.length - 1);
    items.push({ label: "Etape actuelle", value: STEP_LABELS[labelIndex] });
  }

  return {
    title: "Ce que Noema comprend de toi",
    hasData: items.length > 0,
    items: items.slice(0, 3),
  };
}

export function buildImpactStats({
  journalDays = 0,
  clarifiedIntentions = 0,
  hasActiveThread = false,
  sessionCount = 0,
} = {}) {
  const stats = [];

  if (journalDays > 0) {
    stats.push({
      value: journalDays,
      label: `${journalDays} ${pluralize(journalDays, "jour")} de suivi`,
    });
  }

  if (clarifiedIntentions > 0) {
    stats.push({
      value: clarifiedIntentions,
      label: `${clarifiedIntentions} intention${clarifiedIntentions > 1 ? "s" : ""} clarifiee${clarifiedIntentions > 1 ? "s" : ""}`,
    });
  }

  if (hasActiveThread) {
    stats.push({
      value: 1,
      label: "1 fil en cours",
    });
  } else if (sessionCount > 0) {
    stats.push({
      value: sessionCount,
      label: `${sessionCount} ${pluralize(sessionCount, "session")} tenue${sessionCount > 1 ? "s" : ""}`,
    });
  }

  return stats.slice(0, 3);
}
