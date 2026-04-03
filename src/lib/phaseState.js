function clampStep(step) {
  if (typeof step !== "number" || Number.isNaN(step)) return 0;
  return Math.max(0, Math.min(10, step));
}

const PHASES = [
  {
    id: "perdu",
    index: 1,
    name: "Perdu",
    accent: "#bdc2ff",
    accentSoft: "rgba(189,194,255,0.10)",
    accentStrong: "rgba(189,194,255,0.18)",
    border: "rgba(189,194,255,0.18)",
    glow: "rgba(189,194,255,0.22)",
    summary: "Noema accueille ce qui est encore flou et eclaire sans brusquer.",
    paceLabel: "Espace safe",
    horizon: "Prochaine bascule : Guide",
    from: 0,
    to: 2,
  },
  {
    id: "guide",
    index: 2,
    name: "Guide",
    accent: "#ffb68a",
    accentSoft: "rgba(255,182,138,0.10)",
    accentStrong: "rgba(255,182,138,0.20)",
    border: "rgba(255,182,138,0.20)",
    glow: "rgba(255,182,138,0.24)",
    summary: "Noema relie les signes, nomme les schemas et confronte doucement.",
    paceLabel: "Exploration profonde",
    horizon: "Prochaine bascule : Stratege",
    from: 3,
    to: 6,
  },
  {
    id: "stratege",
    index: 3,
    name: "Stratege",
    accent: "#9adfc8",
    accentSoft: "rgba(154,223,200,0.10)",
    accentStrong: "rgba(154,223,200,0.22)",
    border: "rgba(154,223,200,0.22)",
    glow: "rgba(154,223,200,0.26)",
    summary: "Noema transforme la clarte en direction, choix et action alignee.",
    paceLabel: "Construction alignee",
    horizon: "Phase durable",
    from: 7,
    to: 10,
  },
];

export function getPhaseState(step) {
  const normalizedStep = clampStep(step);
  const phase =
    normalizedStep <= 2 ? PHASES[0]
    : normalizedStep <= 6 ? PHASES[1]
    : PHASES[2];

  const span = Math.max(1, phase.to - phase.from + 1);
  const rawPhaseProgress = ((normalizedStep - phase.from + 1) / span) * 100;

  return {
    ...phase,
    step: normalizedStep,
    overallProgress: Math.round((normalizedStep / 10) * 100),
    phaseProgress: Math.max(0, Math.min(100, Math.round(rawPhaseProgress))),
    navLabel: `Phase ${phase.index} - ${phase.name}`,
    stepLabel: `Etape ${normalizedStep}/10`,
  };
}
