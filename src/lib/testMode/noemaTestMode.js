const EMPTY_BLOCAGES = {
  racine: "",
  entretien: "",
  visible: "",
};

const EMPTY_IKIGAI = {
  aime: "",
  excelle: "",
  monde: "",
  paie: "",
  mission: "",
};

export const NOEMA_TEST_COMMANDS = Object.freeze({
  start: "/noema-test",
  seed: "/noema-seed",
  stop: "/noema-test-off",
});

export const NOEMA_TEST_STAGE_COUNT = 10;
export const NOEMA_TEST_MAX_MESSAGES = 9;

const NOEMA_TEST_PROFILE = Object.freeze({
  forces: [
    "lucidite",
    "intuition strategique",
    "sens de l'analyse",
    "ambition",
  ],
  blocages: {
    racine: "peur du jugement",
    entretien: "evitement de l'exposition",
    visible: "difficulte a passer a l'action",
  },
  contradictions: [
    "veut construire mais evite d'etre vu",
    "cherche la clarte mais se disperse",
  ],
  ikigai: {
    aime: "comprendre, transmettre, construire",
    excelle: "analyser, relier les idees, voir les angles morts",
    monde: "besoin de clarte, de guidance, de verite",
    paie: "accompagnement, strategie, pedagogie",
    mission: "aider les autres a retrouver de la clarte et de la direction grace a une lecture lucide de leurs blocages et de leurs forces",
  },
  nextAction: "Choisis une idee que tu retiens depuis trop longtemps et expose-la publiquement dans une version volontairement imparfaite. Le but n'est pas de convaincre. Le but est de desserrer le reflexe de protection.",
  weeklyMemory: "Simulation acceleree: fatigue sous controle, ambition intacte, peur du jugement au centre, exposition evitee, mission de clarte deja coherent.",
});

const IKIGAI_FIELDS = ["aime", "excelle", "monde", "paie"];

const TEST_JOURNEY = [
  {
    id: "ack",
    etat: "exploring",
    mode: "analyse",
    step: 0,
    sessionIndex: 2,
    sessionStage: "simulation interne",
    forceCount: 0,
    contradictionCount: 0,
    blocageKeys: [],
    ikigaiFieldCount: 0,
    revealMission: false,
    includeNextAction: false,
    includeWeeklyMemory: false,
    subSessionSummary: "Simulation interne activee pour valider le parcours accelere.",
    sessionNote: "Simulation interne acceleree - ton direct, messages courts.",
    text: [
      "Mode test active.",
      "Je vais condenser plusieurs semaines d'accompagnement en une dizaine d'echanges pour te laisser valider le flow, les panneaux et les etats UI sans longue conversation.",
      "Rien de ce qui suit n'alimentera ta memoire reelle. Envoie simplement un message, et j'avancerai d'une etape a chaque tour.",
    ].join("\n\n"),
  },
  {
    id: "state",
    etat: "blocked",
    mode: "analyse",
    step: 0,
    sessionIndex: 2,
    sessionStage: "etat actuel",
    forceCount: 0,
    contradictionCount: 0,
    blocageKeys: [],
    ikigaiFieldCount: 0,
    revealMission: false,
    includeNextAction: false,
    includeWeeklyMemory: false,
    subSessionSummary: "Fatigue sous controle, tension interne nette, ambition encore presente.",
    sessionNote: "Etat actuel compresse - tension haute, ton lucide, rythme rapide.",
    text: "Ce qui ressort d'abord, c'est une fatigue sous controle. Tu continues de penser juste, mais ton systeme retient deja beaucoup d'energie. Quand quelqu'un en est la, le probleme n'est pas l'absence de capacite. C'est l'energie mentale mobilisee a se contenir.",
  },
  {
    id: "tension",
    etat: "blocked",
    mode: "analyse",
    step: 1,
    sessionIndex: 3,
    sessionStage: "tension recurrente",
    forceCount: 0,
    contradictionCount: 0,
    blocageKeys: [],
    ikigaiFieldCount: 0,
    revealMission: false,
    includeNextAction: false,
    includeWeeklyMemory: false,
    subSessionSummary: "Ambition forte, exposition repoussee, friction entre elan et retrait.",
    sessionNote: "Schema recurrent identifie - ambition forte, retenue persistante.",
    text: "Le fil qui revient, c'est celui-ci: tu veux batir quelque chose de solide, mais tu differes des qu'il faut t'exposer vraiment. Ca cree une friction constante entre ambition et retrait.",
  },
  {
    id: "forces",
    etat: "exploring",
    mode: "analyse",
    step: 2,
    sessionIndex: 4,
    sessionStage: "forces emergentes",
    forceCount: 2,
    contradictionCount: 0,
    blocageKeys: [],
    ikigaiFieldCount: 0,
    revealMission: false,
    includeNextAction: false,
    includeWeeklyMemory: false,
    subSessionSummary: "Lucidite nette et intuition strategique deja visibles.",
    sessionNote: "Forces initiales visibles - lecture rapide, ton analytique.",
    text: "Premiere force claire: tu vois vite ce qui ne tient pas. Il y a chez toi de la lucidite, de l'intuition strategique, et un vrai sens du discernement. Ce n'est pas rien. Le risque, c'est que cette lucidite devienne parfois une machine a retarder l'action.",
  },
  {
    id: "visible-blocage",
    etat: "blocked",
    mode: "analyse",
    step: 3,
    sessionIndex: 5,
    sessionStage: "blocage visible",
    forceCount: 3,
    contradictionCount: 0,
    blocageKeys: ["visible"],
    ikigaiFieldCount: 0,
    revealMission: false,
    includeNextAction: false,
    includeWeeklyMemory: false,
    subSessionSummary: "Blocage visible nomme: passage a l'action freine des que l'enjeu monte.",
    sessionNote: "Blocage visible pose - preparation excessive, passage a l'action freine.",
    text: "Le blocage visible est simple a nommer: difficulte a passer a l'action quand l'enjeu compte vraiment. Tu peux preparer, clarifier, affiner. Mais quand il faut publier, decider ou te montrer, quelque chose serre le frein.",
  },
  {
    id: "contradiction",
    etat: "blocked",
    mode: "analyse",
    step: 3,
    sessionIndex: 5,
    sessionStage: "contradictions",
    forceCount: 3,
    contradictionCount: 2,
    blocageKeys: ["visible"],
    ikigaiFieldCount: 0,
    revealMission: false,
    includeNextAction: false,
    includeWeeklyMemory: false,
    subSessionSummary: "Deux contradictions stables apparaissent entre ambition, clarte et dispersion.",
    sessionNote: "Contradictions nommees - bienveillance ferme, ton direct.",
    text: "Je remarque une contradiction. Tu veux construire quelque chose d'important, mais tu evites d'etre vu au moment meme ou cette construction exigerait de l'exposition. Et tu cherches la clarte, tout en te dispersant des qu'une decision pourrait devenir irreversible.",
  },
  {
    id: "racine",
    etat: "blocked",
    mode: "analyse",
    step: 3,
    sessionIndex: 6,
    sessionStage: "blocage racine",
    forceCount: 4,
    contradictionCount: 2,
    blocageKeys: ["visible", "entretien", "racine"],
    ikigaiFieldCount: 0,
    revealMission: false,
    includeNextAction: false,
    includeWeeklyMemory: false,
    subSessionSummary: "Racine, entretien et symptome visibles se tiennent dans un meme schema.",
    sessionNote: "Blocage racine clarifie - peur du jugement, evitement d'exposition.",
    text: "Si j'ordonne le tableau, le blocage racine ressemble a une peur du jugement. Le mecanisme d'entretien, c'est l'evitement de l'exposition. Le symptome visible, lui, reste cette difficulte a passer a l'action. Autrement dit: tu ne manques pas de vision; tu proteges ton image avant de proteger ton elan.",
  },
  {
    id: "ikigai-build",
    etat: "exploring",
    mode: "auteur",
    step: 4,
    sessionIndex: 6,
    sessionStage: "ikigai en convergence",
    forceCount: 4,
    contradictionCount: 2,
    blocageKeys: ["visible", "entretien", "racine"],
    ikigaiFieldCount: 4,
    revealMission: false,
    includeNextAction: false,
    includeWeeklyMemory: false,
    subSessionSummary: "Les quatre dimensions de l'ikigai deviennent suffisamment lisibles.",
    sessionNote: "Ikigai en construction - lecture convergente, ton plus clair.",
    text: "A partir de la, l'Ikigai commence a se dessiner sans question supplementaire. Ce que tu aimes: comprendre, transmettre, construire. Ce en quoi tu excelles: analyser, relier les idees, voir les angles morts. Ce dont le monde a besoin et ce pour quoi tu peux etre paye pointent deja vers de la clarte, de la guidance, de la strategie et de la pedagogie.",
  },
  {
    id: "mission",
    etat: "clarity",
    mode: "auteur",
    step: 4,
    sessionIndex: 6,
    sessionStage: "mission revelee",
    forceCount: 4,
    contradictionCount: 2,
    blocageKeys: ["visible", "entretien", "racine"],
    ikigaiFieldCount: 4,
    revealMission: true,
    includeNextAction: false,
    includeWeeklyMemory: false,
    subSessionSummary: "Mission formulee plus tot que d'habitude pour validation interne du produit.",
    sessionNote: "Mission revelee en mode test - clarte haute, formulation stable.",
    text: "Le noyau devient suffisamment lisible pour formuler une mission, meme en version acceleree. Ta trajectoire naturelle, c'est d'aider les autres a retrouver de la clarte et de la direction grace a une lecture lucide de leurs blocages et de leurs forces. Ce n'est pas une mission inventee: c'est la synthese logique de tout ce qui a emerge.",
  },
  {
    id: "action",
    etat: "clarity",
    mode: "coach",
    step: 5,
    sessionIndex: 7,
    sessionStage: "synthese et action",
    forceCount: 4,
    contradictionCount: 2,
    blocageKeys: ["visible", "entretien", "racine"],
    ikigaiFieldCount: 4,
    revealMission: true,
    includeNextAction: true,
    includeWeeklyMemory: true,
    subSessionSummary: "Synthese finale livree, action concrete posee pour la prochaine session.",
    sessionNote: "Synthese finale de simulation - clarte stable, action concrete proposee.",
    text: [
      "Je te fais la synthese courte.",
      "Forces: lucidite, intuition strategique, sens de l'analyse, ambition. Racine: peur du jugement. Entretien: evitement de l'exposition. Visible: difficulte a passer a l'action. Contradictions: tu veux construire mais tu evites d'etre vu; tu cherches la clarte mais tu te disperses.",
      "Avant la prochaine session, prends une idee que tu retiens depuis trop longtemps et expose-la publiquement dans une version volontairement imparfaite. Le but n'est pas de convaincre. Le but est de desserrer le reflexe de protection.",
      "La simulation acceleree est complete. Tu peux taper /noema-test-off pour revenir au flux normal, ou /noema-seed pour remplir directement l'interface avec des donnees de demonstration.",
    ].join("\n\n"),
  },
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function cloneList(items) {
  return Array.isArray(items) ? [...items] : [];
}

function buildBlocages(keys = []) {
  return keys.reduce((acc, key) => {
    if (NOEMA_TEST_PROFILE.blocages[key]) acc[key] = NOEMA_TEST_PROFILE.blocages[key];
    return acc;
  }, { ...EMPTY_BLOCAGES });
}

function buildIkigai(fieldCount, revealMission) {
  const visibleFieldCount = clamp(fieldCount, 0, IKIGAI_FIELDS.length);
  const partialIkigai = IKIGAI_FIELDS.slice(0, visibleFieldCount).reduce((acc, key) => {
    acc[key] = NOEMA_TEST_PROFILE.ikigai[key];
    return acc;
  }, { ...EMPTY_IKIGAI });

  if (revealMission) {
    partialIkigai.mission = NOEMA_TEST_PROFILE.ikigai.mission;
  }

  return partialIkigai;
}

function createNoemaRawResponse(text, ui) {
  return `${String(text || "").trim()}\n\n<_ui>\n${JSON.stringify(ui, null, 2)}\n</_ui>`;
}

export function createNoemaTestUI({
  etat = "exploring",
  mode = "analyse",
  step = 0,
  sessionIndex = 1,
  sessionStage = "",
  messagesToday = 0,
  messagesRemaining = 40,
  ikigaiRevealed = false,
  forces = [],
  blocages = EMPTY_BLOCAGES,
  contradictions = [],
  subSessionSummary = "",
  weeklyMemory = "",
  nextAction = "",
  ikigai = EMPTY_IKIGAI,
  sessionNote = "",
} = {}) {
  return {
    etat,
    mode,
    step,
    session_index: sessionIndex,
    session_stage: sessionStage,
    messages_today: messagesToday,
    messages_remaining: messagesRemaining,
    ikigai_revealed: ikigaiRevealed,
    forces: cloneList(forces),
    blocages: { ...EMPTY_BLOCAGES, ...(blocages || {}) },
    contradictions: cloneList(contradictions),
    sub_session_summary: subSessionSummary,
    weekly_memory: weeklyMemory,
    next_action: nextAction,
    ikigai: { ...EMPTY_IKIGAI, ...(ikigai || {}) },
    session_note: sessionNote,
  };
}

function buildJourneyResponse(stageIndex, userMessageCount) {
  const safeStageIndex = clamp(stageIndex, 0, TEST_JOURNEY.length - 1);
  const stage = TEST_JOURNEY[safeStageIndex];
  const messagesToday = clamp(userMessageCount, 0, NOEMA_TEST_MAX_MESSAGES);
  const messagesRemaining = clamp(NOEMA_TEST_MAX_MESSAGES - messagesToday, 0, NOEMA_TEST_MAX_MESSAGES);
  const ui = createNoemaTestUI({
    etat: stage.etat,
    mode: stage.mode,
    step: stage.step,
    sessionIndex: stage.sessionIndex,
    sessionStage: stage.sessionStage,
    messagesToday,
    messagesRemaining,
    ikigaiRevealed: stage.revealMission,
    forces: NOEMA_TEST_PROFILE.forces.slice(0, stage.forceCount),
    blocages: buildBlocages(stage.blocageKeys),
    contradictions: NOEMA_TEST_PROFILE.contradictions.slice(0, stage.contradictionCount),
    subSessionSummary: stage.subSessionSummary,
    weeklyMemory: stage.includeWeeklyMemory ? NOEMA_TEST_PROFILE.weeklyMemory : "",
    nextAction: stage.includeNextAction ? NOEMA_TEST_PROFILE.nextAction : "",
    ikigai: buildIkigai(stage.ikigaiFieldCount, stage.revealMission),
    sessionNote: stage.sessionNote,
  });

  return {
    stageIndex: safeStageIndex,
    messageCount: messagesToday,
    isComplete: safeStageIndex === TEST_JOURNEY.length - 1,
    raw: createNoemaRawResponse(stage.text, ui),
    ui,
  };
}

export function parseAllowedNoemaTestEmails(value) {
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function isNoemaTestAuthorized({
  email = "",
  isDev = import.meta.env.DEV,
  allowedEmails = parseAllowedNoemaTestEmails(import.meta.env.VITE_NOEMA_TEST_EMAILS),
} = {}) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  return Boolean(isDev || (normalizedEmail && allowedEmails.includes(normalizedEmail)));
}

export function isNoemaTestAuthorizedUser(user, options) {
  return isNoemaTestAuthorized({ email: user?.email, ...options });
}

export function parseNoemaTestCommand(text) {
  const normalized = normalizeText(text);
  if (!normalized.startsWith("/noema-")) return null;

  if (normalized === NOEMA_TEST_COMMANDS.start) {
    return { type: "start", command: NOEMA_TEST_COMMANDS.start };
  }

  if (normalized === NOEMA_TEST_COMMANDS.seed) {
    return { type: "seed", command: NOEMA_TEST_COMMANDS.seed };
  }

  if (normalized === NOEMA_TEST_COMMANDS.stop) {
    return { type: "stop", command: NOEMA_TEST_COMMANDS.stop };
  }

  return null;
}

export function startNoemaTestJourney() {
  return buildJourneyResponse(0, 0);
}

export function advanceNoemaTestJourney({ testMessageCount = 0 } = {}) {
  const nextMessageCount = clamp(testMessageCount + 1, 1, NOEMA_TEST_MAX_MESSAGES);
  const nextStageIndex = clamp(testMessageCount + 1, 1, TEST_JOURNEY.length - 1);
  return buildJourneyResponse(nextStageIndex, nextMessageCount);
}

export function createNoemaSeededJourney() {
  const ui = createNoemaTestUI({
    etat: "clarity",
    mode: "coach",
    step: 5,
    sessionIndex: 8,
    sessionStage: "seed design complet",
    messagesToday: 9,
    messagesRemaining: 1,
    ikigaiRevealed: true,
    forces: NOEMA_TEST_PROFILE.forces,
    blocages: NOEMA_TEST_PROFILE.blocages,
    contradictions: NOEMA_TEST_PROFILE.contradictions,
    subSessionSummary: "Seed interne charge: tous les panneaux disposent d'un jeu de donnees coherent.",
    weeklyMemory: NOEMA_TEST_PROFILE.weeklyMemory,
    nextAction: NOEMA_TEST_PROFILE.nextAction,
    ikigai: NOEMA_TEST_PROFILE.ikigai,
    sessionNote: "Seed interne complet - donnees fictives coherentes pour validation UI.",
  });

  return {
    stageIndex: TEST_JOURNEY.length - 1,
    messageCount: 0,
    isComplete: true,
    raw: createNoemaRawResponse(
      [
        "Simulation interne seedee.",
        "J'ai rempli les panneaux avec un jeu de donnees coherent pour tester les etats visuels, les transitions et la revelation de mission sans conversation reelle.",
        "Ces donnees sont fictives et ne seront pas persistees. Utilise /noema-test pour rejouer la progression acceleree, ou /noema-test-off pour revenir au flux normal.",
      ].join("\n\n"),
      ui
    ),
    ui,
  };
}

export function createNoemaSeedModeReply() {
  const seeded = createNoemaSeededJourney();
  return {
    ...seeded,
    raw: createNoemaRawResponse(
      "Le seed remplit deja toute l'interface. Utilise /noema-test pour une progression par etapes, ou /noema-test-off pour revenir a la conversation normale.",
      seeded.ui
    ),
  };
}

export function createNoemaTestUnavailableReply() {
  return "Commande interne indisponible dans ce contexte.";
}
