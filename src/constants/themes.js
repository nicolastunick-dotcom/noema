export const THEMES = {
  blocked:   { accent:"#F59E0B", soft:"rgba(245,158,11,0.09)",  border:"rgba(245,158,11,0.20)",  glow:"rgba(245,158,11,0.18)",  label:"Bloqué" },
  exploring: { accent:"#8A7CFF", soft:"rgba(138,124,255,0.09)", border:"rgba(138,124,255,0.20)", glow:"rgba(138,124,255,0.18)", label:"En exploration" },
  clarity:   { accent:"#5B6CFF", soft:"rgba(91,108,255,0.09)",  border:"rgba(91,108,255,0.20)",  glow:"rgba(91,108,255,0.18)",  label:"Clarté" },
};

export const STEPS = [
  { icon:"🌱", name:"Exploration",    sub:"Qui tu es vraiment" },
  { icon:"💪", name:"Forces",         sub:"Classées par puissance" },
  { icon:"🔓", name:"Blocages",       sub:"Racine et entretien" },
  { icon:"⚡", name:"Contradictions", sub:"Ce qui freine" },
  { icon:"🌟", name:"Ikigai",         sub:"Ta raison d'être" },
  { icon:"🚀", name:"Action",         sub:"Les premiers pas" },
];

export const MODE_LABELS = {
  accueil:    "Accueil",
  analyse:    "Analyse",
  auteur:     "Auteur",
  coach:      "Coach",
  regulation: "Régulation",
};

export function applyTheme(state) {
  const t = THEMES[state], r = document.documentElement;
  r.style.setProperty("--accent",        t.accent);
  r.style.setProperty("--accent-soft",   t.soft);
  r.style.setProperty("--accent-border", t.border);
  r.style.setProperty("--glow",          t.glow);
}

export function mapEtat(etat) {
  if (etat === "blocked" || etat === "regulation") return "blocked";
  if (etat === "clarity") return "clarity";
  return "exploring";
}
