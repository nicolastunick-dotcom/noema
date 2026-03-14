export const DEMO_FLOW_STEPS = Object.freeze([
  {
    id: "intro",
    kind: "bubble",
    eyebrow: "Parcours guide",
    text: "Avant de commencer, voila comment Noema fonctionne.",
  },
  {
    id: "conversation",
    kind: "bubble",
    eyebrow: "Etape 2",
    text: "Noema ne te fait pas remplir un formulaire froid. Il avance avec toi par conversation.",
  },
  {
    id: "insights",
    kind: "bubble",
    eyebrow: "Etape 3",
    text: "Au fil de l'echange, Noema detecte tes forces naturelles, tes tensions internes et tes blocages racines.",
  },
  {
    id: "clarity",
    kind: "bubble",
    eyebrow: "Etape 4",
    text: "Le but n'est pas de te divertir. Le but est de t'aider a voir plus clair, avec honnetete.",
  },
  {
    id: "direction",
    kind: "bubble",
    eyebrow: "Etape 5",
    text: "A la fin, tu repars avec une comprehension plus nette de toi-meme et une direction plus solide.",
  },
  {
    id: "finale",
    kind: "final",
    eyebrow: "Derniere etape",
    intro: "Voici l'espace de presentation qui introduira Noema avant l'entree dans l'experience principale.",
    title: "Voir l'experience Noema prendre forme",
    copy: "Tu pourras integrer ici une video locale ou un embed pour montrer le ton, le rythme et la profondeur de l'accompagnement.",
    videoLabel: "Emplacement video",
    videoHint: "Zone prevue pour un fichier local, un embed Loom, Vimeo ou YouTube.",
    ctaLabel: "Entrer dans Noema",
  },
]);

export const DEMO_FLOW_TOTAL = DEMO_FLOW_STEPS.length;
