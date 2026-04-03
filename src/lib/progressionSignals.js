function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function shortenText(value, max = 120) {
  const normalized = normalizeText(value);
  if (!normalized) return "";
  return normalized.length > max ? `${normalized.slice(0, max - 1).trimEnd()}…` : normalized;
}

function pushCount(map, label, value) {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) return;
  const key = normalizedValue.toLowerCase();
  const existing = map.get(key) || { label, value: normalizedValue, count: 0 };
  existing.count += 1;
  map.set(key, existing);
}

function pickTop(entries, limit = 3, minCount = 2) {
  return Array.from(entries.values())
    .filter((entry) => entry.count >= minCount)
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
    .slice(0, limit)
    .map((entry) => ({
      ...entry,
      value: shortenText(entry.value),
    }));
}

function buildStepMetrics(sessions = []) {
  const steps = sessions
    .map((session) => (typeof session?.step === "number" && !Number.isNaN(session.step) ? session.step : null))
    .filter((step) => step != null);

  const total = steps.length;
  const latest = total > 0 ? steps[0] : null;
  const previous = total > 1 ? steps[1] : null;
  const min = total > 0 ? Math.min(...steps) : null;
  const max = total > 0 ? Math.max(...steps) : null;
  const average = total > 0 ? Math.round(steps.reduce((sum, step) => sum + step, 0) / total) : null;

  return {
    total,
    latest,
    previous,
    min,
    max,
    average,
    span: min != null && max != null ? max - min : 0,
  };
}

function getStepLabel(step) {
  if (typeof step !== "number") return "";
  if (step <= 2) return "Perdu";
  if (step <= 6) return "Guide";
  return "Stratege";
}

function buildDominantThread(recurring) {
  const priority = {
    blockage: 0,
    contradiction: 1,
    force: 2,
  };

  const candidates = [
    ...recurring.recurringBlockages.map((item) => ({ ...item, source: "blockage" })),
    ...recurring.recurringContradictions.map((item) => ({ ...item, source: "contradiction" })),
    ...recurring.recurringForces.map((item) => ({ ...item, source: "force" })),
  ];

  return candidates.sort((a, b) => {
    const countDelta = b.count - a.count;
    if (countDelta !== 0) return countDelta;
    const sourceDelta = (priority[a.source] ?? 99) - (priority[b.source] ?? 99);
    if (sourceDelta !== 0) return sourceDelta;
    return a.value.localeCompare(b.value);
  })[0] || null;
}

function buildMovementSummary({ stepDelta, recurring, stepMetrics }) {
  if (stepMetrics.total <= 1) {
    return "Premiere lecture de la trajectoire: le miroir commence a se construire.";
  }

  if (stepDelta >= 3) {
    return `Acceleration nette: la progression a gagne ${stepDelta} niveau(x) depuis la session precedente.`;
  }

  if (stepDelta === 2) {
    return "Progression franche: le parcours prend visiblement de l'elan.";
  }

  if (stepDelta === 1) {
    return "Progression continue: un cran de plus s'est dessine.";
  }

  if (stepDelta === 0) {
    if (recurring.recurringBlockages.length || recurring.recurringContradictions.length) {
      return "Stabilisation active: les memes tensions reviennent, mais elles sont mieux nommees.";
    }
    return "Exploration stable: la trajectoire reste ouverte sans rupture majeure.";
  }

  return "Recalage en cours: le fil demande encore a se clarifier avant le prochain pas.";
}

function buildContinuitySummary({ recurring, openLoops, stepMetrics }) {
  const recurringCount =
    recurring.recurringBlockages.length +
    recurring.recurringContradictions.length +
    recurring.recurringForces.length;

  if (stepMetrics.total === 0) {
    return "Aucune session exploitable pour l'instant.";
  }

  const themesPart = recurringCount > 0
    ? `${recurringCount} motif(s) recurrent(s)`
    : "aucun motif recurrent net";
  const loopsPart = openLoops.length > 0
    ? `${openLoops.length} fil(s) encore ouvert(s)`
    : "aucun fil ouvert";
  const spanPart = stepMetrics.min != null && stepMetrics.max != null
    ? `sur une plage ${stepMetrics.min}/${stepMetrics.max}`
    : "";

  return [themesPart, loopsPart, spanPart].filter(Boolean).join(" · ");
}

function buildRecurringThemes(sessions = []) {
  const forceMap = new Map();
  const contradictionMap = new Map();
  const blockageMap = new Map();

  for (const session of sessions) {
    const insights = session?.insights || {};
    for (const force of insights.forces || []) pushCount(forceMap, "Force qui revient", force);
    for (const contradiction of insights.contradictions || []) pushCount(contradictionMap, "Tension recurrente", contradiction);
    if (insights.blocages?.racine) pushCount(blockageMap, "Blocage recurrent", insights.blocages.racine);
  }

  return {
    recurringForces: pickTop(forceMap),
    recurringContradictions: pickTop(contradictionMap),
    recurringBlockages: pickTop(blockageMap),
  };
}

function buildOpenLoops(sessions = []) {
  return sessions
    .map((session) => normalizeText(session?.next_action))
    .filter(Boolean)
    .slice(0, 3)
    .map((value) => ({
      label: "Fil en cours",
      value: shortenText(value),
    }));
}

function buildSessionShift(currentSession, previousSession) {
  const currentStep = typeof currentSession?.step === "number" ? currentSession.step : null;
  const previousStep = typeof previousSession?.step === "number" ? previousSession.step : null;
  const currentNote = normalizeText(currentSession?.session_note);
  const previousNote = normalizeText(previousSession?.session_note);

  return {
    latestStepLabel: getStepLabel(currentStep),
    stepDelta:
      currentStep != null && previousStep != null && currentStep > previousStep
        ? currentStep - previousStep
        : 0,
    latestNote: shortenText(currentNote || previousNote, 140),
  };
}

export function buildProgressSignals({ sessions = [], current = null } = {}) {
  const safeSessions = (Array.isArray(sessions) ? sessions : []).filter(Boolean);
  const currentSession = current || safeSessions[0] || null;
  const previousSession = safeSessions[1] || null;
  const recurring = buildRecurringThemes(safeSessions);
  const openLoops = buildOpenLoops(safeSessions);
  const shift = buildSessionShift(currentSession, previousSession);
  const stepMetrics = buildStepMetrics(safeSessions);
  const dominantThread = buildDominantThread(recurring);
  const continuitySummary = buildContinuitySummary({ recurring, openLoops, stepMetrics });
  const movementSummary = buildMovementSummary({ stepDelta: shift.stepDelta, recurring, stepMetrics });

  return {
    ...recurring,
    openLoops,
    latestStepLabel: shift.latestStepLabel,
    stepDelta: shift.stepDelta,
    latestNote: shift.latestNote,
    stepMetrics,
    dominantThread,
    continuitySummary,
    movementSummary,
    trajectoryLabel:
      stepMetrics.latest != null
        ? `${getStepLabel(stepMetrics.latest)} · ${shift.latestStepLabel || "en cours"}`
        : "Trajectoire en construction",
    hasRecurringThemes:
      recurring.recurringForces.length > 0 ||
      recurring.recurringContradictions.length > 0 ||
      recurring.recurringBlockages.length > 0,
  };
}

export function buildProgressPromptContext({ sessions = [], journalEntry = null } = {}) {
  const signals = buildProgressSignals({ sessions });
  const lines = [];

  if (signals.movementSummary) {
    lines.push(`Trajectoire: ${signals.movementSummary}`);
  }

  if (signals.dominantThread?.value) {
    const dominantPrefix =
      signals.dominantThread.source === "blockage"
        ? "Point de friction dominant"
        : signals.dominantThread.source === "contradiction"
          ? "Tension dominante"
          : "Force dominante";
    lines.push(`${dominantPrefix} (${signals.dominantThread.count} sessions) : ${signals.dominantThread.value}`);
  }

  for (const item of signals.recurringBlockages) {
    lines.push(`Blocage recurrent (${item.count} sessions) : ${item.value}`);
  }
  for (const item of signals.recurringContradictions) {
    lines.push(`Contradiction recurrente (${item.count} sessions) : ${item.value}`);
  }
  for (const item of signals.recurringForces) {
    lines.push(`Force stable (${item.count} sessions) : ${item.value}`);
  }

  if (signals.openLoops[0]?.value) {
    lines.push(`Fil encore actif : ${signals.openLoops[0].value}`);
  }

  if (signals.latestNote) {
    lines.push(`Dernier point clarifie : ${signals.latestNote}`);
  }

  if (journalEntry?.content) {
    lines.push(`Derniere entree journal (${journalEntry.entry_date || "recente"}) : ${shortenText(journalEntry.content, 220)}`);
  }

  if (lines.length === 0) return "";

  return [
    "",
    "---",
    "SIGNAUX CROSS-SESSIONS :",
    ...lines,
    "Quand c'est juste, reviens sur ces motifs de facon naturelle, concise et reliee a la trajectoire.",
    "---",
  ].join("\n");
}

export function buildZenRitual({ phaseContext, progressSignals, intention, journalEntry } = {}) {
  const primaryThread =
    progressSignals?.openLoops?.[0]?.value ||
    normalizeText(intention) ||
    normalizeText(journalEntry?.next_action) ||
    progressSignals?.dominantThread?.value ||
    progressSignals?.recurringBlockages?.[0]?.value ||
    progressSignals?.recurringContradictions?.[0]?.value ||
    progressSignals?.recurringForces?.[0]?.value;

  const phaseName = phaseContext?.name || "Perdu";
  const movementHint = progressSignals?.movementSummary || "";

  if (phaseName === "Perdu") {
    return {
      title: "Rituel de recentrage",
      intro: movementHint || "Ne cherche pas a tout regler aujourd'hui. Reviens d'abord a ce qui compte vraiment.",
      prompt: primaryThread
        ? `Assieds-toi deux minutes et termine cette phrase : "Ce que je n'ai plus envie d'eviter autour de ${primaryThread}, c'est..."`
        : 'Assieds-toi deux minutes et termine cette phrase : "Ce que je n\'ai plus envie d\'eviter aujourd\'hui, c\'est..."',
      close: "Le but n'est pas de performer. Le but est de regarder en face avec douceur.",
    };
  }

  if (phaseName === "Guide") {
    return {
      title: "Exercice de clarification",
      intro: movementHint || "Observe ce qui revient. La repetition est souvent le vrai signal.",
      prompt: primaryThread
        ? `Ecris trois lignes : 1) ce qui revient autour de ${primaryThread}, 2) ce que tu comprends mieux, 3) ce que tu veux tester concretement aujourd'hui.`
        : "Ecris trois lignes : 1) ce qui revient, 2) ce que tu comprends mieux, 3) ce que tu veux tester concretement aujourd'hui.",
      close: "Un petit mouvement juste vaut mieux qu'une resolution abstraite.",
    };
  }

  return {
    title: "Alignement du jour",
    intro: movementHint || "Tu n'es plus seulement dans l'exploration. Il s'agit maintenant de choisir avec clarte.",
    prompt: primaryThread
      ? `Choisis une action simple et alignee autour de ${primaryThread}. Demande-toi : "Qu'est-ce qui ferait avancer ce fil sans me trahir ?" puis note ton engagement en une phrase.`
      : 'Choisis une action simple et alignee. Demande-toi : "Qu\'est-ce qui ferait avancer ce fil sans me trahir ?" puis note ton engagement en une phrase.',
    close: "L'alignement se mesure moins a l'intensite qu'a la coherence.",
  };
}
