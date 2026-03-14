// --- CODEX CHANGE START ---
// Codex modification - centralize the UI-only session progress mappings so the
// component stays focused on rendering and lint remains clean.
export const SESSION_TITLES = {
  1: "État actuel",
  2: "Histoire personnelle",
  3: "Schémas répétitifs",
  4: "Valeurs profondes",
  5: "Forces naturelles",
  6: "Blocages racine",
  7: "Repositionnement intérieur",
  8: "Révélation de l'Ikigai",
  9: "Clarification de direction",
  10: "Plan d'action",
};

export const SESSION_SUB_STEPS = {
  1: ["état émotionnel", "tensions actuelles", "zone sensible du moment", "déclencheurs", "besoins immédiats", "premiers repères", "synthèse"],
  2: ["repères d'enfance", "figures marquantes", "événements fondateurs", "apprentissages", "blessures ou loyautés", "récit dominant", "synthèse"],
  3: ["répétitions relationnelles", "répétitions professionnelles", "stratégies d'évitement", "déclencheurs récurrents", "contradictions", "leviers de rupture", "synthèse"],
  4: ["valeurs non négociables", "valeurs héritées", "conflits internes", "aspirations profondes", "choix décisifs", "priorités réalignées", "synthèse"],
  5: ["talents spontanés", "victoires passées", "zones d'excellence", "source d'énergie", "feedback extérieur", "mise en cohérence", "synthèse"],
  6: ["blocage racine", "mécanismes de protection", "peur centrale", "coût actuel", "croyances associées", "point de bascule", "synthèse"],
  7: ["identité actuelle", "identité désirée", "permissions intérieures", "nouvelle posture", "repositionnement concret", "engagement personnel", "synthèse"],
  8: ["sources de joie", "dons naturels", "besoin du monde", "valeur échangeable", "croisement d'Ikigai", "formulation de mission", "synthèse"],
  9: ["directions possibles", "critères de choix", "renoncements utiles", "tests de réalité", "trajectoire dominante", "alignement final", "synthèse"],
  10: ["priorité centrale", "action 1", "action 2", "rythme soutenable", "obstacles prévisibles", "soutiens utiles", "synthèse"],
};

export function getSessionNumber(sessionIndex) {
  return Math.min(Math.max(sessionIndex || 1, 1), 10);
}

export function getSessionTitle(sessionIndex) {
  const normalizedSession = getSessionNumber(sessionIndex);
  return `Session ${normalizedSession} — ${SESSION_TITLES[normalizedSession]}`;
}

export function getSubSessionIndex(messagesToday) {
  if (messagesToday <= 5) return 1;
  if (messagesToday <= 10) return 2;
  if (messagesToday <= 15) return 3;
  if (messagesToday <= 20) return 4;
  if (messagesToday <= 25) return 5;
  if (messagesToday <= 30) return 6;
  return 7;
}

export function formatSessionStage(stage) {
  if (!stage) return "Exploration en cours";
  const cleanStage = stage.replace(/[_-]+/g, " ").trim();
  return cleanStage.charAt(0).toUpperCase() + cleanStage.slice(1);
}
// --- CODEX CHANGE END ---
