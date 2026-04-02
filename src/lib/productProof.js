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

function shortenText(value, max = 110) {
  const compact = normalizeText(value);
  if (!compact) return "";
  return compact.length > max ? `${compact.slice(0, max - 1).trimEnd()}…` : compact;
}

function pluralize(count, singular, plural = `${singular}s`) {
  return count > 1 ? plural : singular;
}

function includesNormalized(list, value) {
  const needle = normalizeText(value);
  if (!needle) return false;
  return (Array.isArray(list) ? list : []).some((entry) => normalizeText(entry) === needle);
}

function firstMeaningful(...values) {
  for (const value of values) {
    const normalized = normalizeText(value);
    if (normalized) return normalized;
  }
  return "";
}

function getSessionNoteHeadline(sessionNote) {
  return normalizeText(String(sessionNote || "").split("|")[0]);
}

function getPrimaryForce(insights) {
  return firstMeaningful(insights?.forces?.[0]);
}

function getPrimaryContradiction(insights) {
  return firstMeaningful(insights?.contradictions?.[0]);
}

function getPrimaryBlockage(insights) {
  return firstMeaningful(insights?.blocages?.racine);
}

function getVisibleBlockage(insights) {
  return firstMeaningful(insights?.blocages?.visible, insights?.blocages?.entretien);
}

function getStepLabel(step) {
  if (typeof step !== "number" || step <= 0) return "";
  const labelIndex = Math.min(step, STEP_LABELS.length - 1);
  return STEP_LABELS[labelIndex];
}

function pushUniqueItem(items, nextItem) {
  if (!nextItem?.value) return;
  const normalizedValue = normalizeText(nextItem.value);
  if (!normalizedValue) return;
  const alreadyIncluded = items.some((item) => normalizeText(item.value) === normalizedValue);
  if (!alreadyIncluded) items.push({ ...nextItem, value: shortenText(nextItem.value, 118) });
}

export function buildProofUpdateLabel({ ui, previous } = {}) {
  if (!ui) return "";

  const previousInsights = previous?.insights || {};
  const previousNextAction = normalizeText(previous?.nextAction);
  const previousStep = typeof previous?.step === "number" ? previous.step : 0;
  const nextAction = normalizeText(ui.next_action);
  const rootBlock = normalizeText(ui.blocages?.racine);
  const contradiction = firstMeaningful(ui.contradictions?.[0]);
  const force = firstMeaningful(ui.forces?.[0]);
  const step = typeof ui.step === "number" ? ui.step : null;

  if (nextAction && nextAction !== previousNextAction) return "Intention clarifiee";

  if (rootBlock) {
    return normalizeText(previousInsights?.blocages?.racine) === rootBlock
      ? "Blocage confirme"
      : "Blocage precise";
  }

  if (contradiction) {
    return includesNormalized(previousInsights?.contradictions, contradiction)
      ? "Contradiction confirmee"
      : "Contradiction visible";
  }

  if (force) {
    return includesNormalized(previousInsights?.forces, force)
      ? "Force confirmee"
      : "Nouvelle force reperee";
  }

  if (step != null && step > previousStep) {
    return "Etape franchie";
  }

  return "";
}

export function buildReturnVisitState({
  previousSession = null,
  currentNextAction = "",
  currentSessionNote = "",
  currentInsights = null,
  currentStep = null,
} = {}) {
  if (!previousSession) {
    return {
      title: "Depuis ta derniere visite",
      hasData: false,
      items: [],
      prompt: "",
    };
  }

  const previousInsights = previousSession.insights || {};
  const effectiveInsights = currentInsights || previousInsights;
  const effectiveStep = typeof currentStep === "number" ? currentStep : previousSession.step;
  const inProgress = firstMeaningful(previousSession.next_action, currentNextAction);
  const clarified = firstMeaningful(
    getSessionNoteHeadline(previousSession.session_note),
    getSessionNoteHeadline(currentSessionNote),
    getPrimaryBlockage(previousInsights),
    getPrimaryContradiction(previousInsights),
    getPrimaryForce(previousInsights)
  );
  const openLoop = firstMeaningful(
    currentNextAction,
    previousSession.next_action,
    getVisibleBlockage(effectiveInsights),
    getPrimaryContradiction(effectiveInsights),
    getStepLabel(effectiveStep)
  );

  const items = [];
  pushUniqueItem(items, { label: "Intention en cours", value: inProgress });
  pushUniqueItem(items, { label: "Ce qui s'est precise", value: clarified });
  pushUniqueItem(items, { label: "Ce qu'on poursuit", value: openLoop });

  return {
    title: "Depuis ta derniere visite",
    hasData: items.length > 0,
    items: items.slice(0, 3),
    prompt: shortenText(firstMeaningful(currentNextAction, inProgress, openLoop), 72),
  };
}

export function buildValueSnapshot({
  latestSession = null,
  journalDays = 0,
  clarifiedIntentions = 0,
  sessionCount = 0,
} = {}) {
  const latestInsights = latestSession?.insights || {};
  const activeThread = normalizeText(latestSession?.next_action);
  const namedBlockage = getPrimaryBlockage(latestInsights);
  const visibleTension = getPrimaryContradiction(latestInsights);
  const visibleForce = getPrimaryForce(latestInsights);

  const stats = [];

  if (journalDays > 0) {
    stats.push({
      value: journalDays,
      label: `${journalDays} ${pluralize(journalDays, "jour")} de suivi`,
    });
  }

  if (activeThread) {
    stats.push({
      value: 1,
      label: "1 fil en cours",
    });
  } else if (clarifiedIntentions > 0) {
    stats.push({
      value: clarifiedIntentions,
      label: `${clarifiedIntentions} intention${clarifiedIntentions > 1 ? "s" : ""} clarifiee${clarifiedIntentions > 1 ? "s" : ""}`,
    });
  }

  if (namedBlockage) {
    stats.push({ value: 1, label: "1 blocage nomme" });
  } else if (visibleForce) {
    stats.push({ value: 1, label: "1 force reperee" });
  } else if (visibleTension) {
    stats.push({ value: 1, label: "1 tension visible" });
  } else if (sessionCount > 0) {
    stats.push({
      value: sessionCount,
      label: `${sessionCount} ${pluralize(sessionCount, "session")} tenue${sessionCount > 1 ? "s" : ""}`,
    });
  }

  const highlight = shortenText(firstMeaningful(
    activeThread,
    getSessionNoteHeadline(latestSession?.session_note),
    namedBlockage,
    visibleTension,
    visibleForce
  ), 132);

  return {
    title: "Ce que tu as deja construit ici",
    hasData: stats.length > 0 || Boolean(highlight),
    stats: stats.slice(0, 3),
    highlight,
    highlightLabel: activeThread ? "Dernier fil actif" : "Dernier point travaille",
    continuation: activeThread
      ? "En continuant, tu gardes ce fil visible et tu peux reprendre sans repartir de zero."
      : "En continuant, tu gardes visible ce qui s'est deja precise au lieu de repartir de zero.",
  };
}

export function buildProofState({ insights, nextAction, step, previous = null } = {}) {
  const safeInsights = insights || {};
  const safeBlocages = safeInsights.blocages || {};
  const normalizedNextAction = normalizeText(nextAction);
  const normalizedRootBlock = normalizeText(safeBlocages.racine);
  const currentForce = getPrimaryForce(safeInsights);
  const currentContradiction = getPrimaryContradiction(safeInsights);
  const previousInsights = previous?.insights || {};
  const previousStep = typeof previous?.step === "number" ? previous.step : 0;

  const items = [];

  if (normalizedNextAction) {
    pushUniqueItem(items, {
      tag: "A poursuivre",
      label: "Fil actif",
      value: normalizedNextAction,
    });
  }

  if (normalizedRootBlock) {
    pushUniqueItem(items, {
      tag: normalizeText(previousInsights?.blocages?.racine) === normalizedRootBlock ? "Revient" : "Nouveau",
      label: "Blocage nomme",
      value: normalizedRootBlock,
    });
  } else if (currentContradiction) {
    pushUniqueItem(items, {
      tag: includesNormalized(previousInsights?.contradictions, currentContradiction) ? "Revient" : "Nouveau",
      label: "Tension visible",
      value: currentContradiction,
    });
  }

  if (currentForce) {
    pushUniqueItem(items, {
      tag: includesNormalized(previousInsights?.forces, currentForce) ? "Confirme" : "Nouveau",
      label: "Force reperee",
      value: currentForce,
    });
  }

  if (typeof step === "number" && step > previousStep) {
    pushUniqueItem(items, {
      tag: "Nouveau",
      label: "Etape franchie",
      value: getStepLabel(step),
    });
  } else if (items.length === 0 && typeof step === "number" && step > 0) {
    pushUniqueItem(items, {
      tag: "A poursuivre",
      label: "Etape active",
      value: getStepLabel(step),
    });
  }

  return {
    title: "Ce qui evolue en ce moment",
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
