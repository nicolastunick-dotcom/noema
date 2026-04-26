import { Suspense, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNoemaRuntime } from "../../context/NoemaContext";
import { lazyWithPreload, preloadWhenIdle } from "../../lib/lazyWithPreload";

// ─────────────────────────────────────────────────────────────────────────────
// ShellV2 — Layout shell V2 avec Framer Motion
//
// Responsabilités :
//   - Bottom nav avec tab indicator animé (layoutId)
//   - Transitions de page avec AnimatePresence
//   - Routage vers les pages existantes avec les bonnes props
//   - Aucune logique métier — tout vient de useNoemaRuntime()
//
// Props :
//   adminSlot {ReactNode} Slot réservé à AdminPanel (injecté depuis AppShell)
//
// Contrat :
//   → Ne jamais importer callAPI, applyUI, saveSession
//   → Ne jamais modifier le contrat _ui
//   → Peut être swappé sans toucher AppShell (sauf le render final)
// ─────────────────────────────────────────────────────────────────────────────

const NAV_HEIGHT = 88;

const NAV_TABS = [
  { id: "today",   icon: "light_mode",     lbl: "Aujourd'hui" },
  { id: "chat",    icon: "forum",          lbl: "Chat" },
  { id: "mapping", icon: "psychology_alt", lbl: "Mapping" },
  { id: "journal", icon: "auto_stories",   lbl: "Journal" },
];

const TAB_COMPONENTS = {
  today: lazyWithPreload(() => import("./TodayV2")),
  chat: lazyWithPreload(() => import("./ChatV2")),
  mapping: lazyWithPreload(() => import("./MappingV2")),
  journal: lazyWithPreload(() => import("./JournalV2")),
};

// Variants pour les transitions de page
const PAGE_VARIANTS = {
  initial: { opacity: 0, x: 12, filter: "blur(2px)" },
  animate: { opacity: 1, x: 0,  filter: "blur(0px)" },
  exit:    { opacity: 0, x: -8, filter: "blur(1px)" },
};

// Labels de phase lisibles pour l'utilisateur
const PHASE_DISPLAY = {
  perdu:    "Exploration · Phase 1",
  guide:    "Développement · Phase 2",
  stratege: "Stratégie · Phase 3",
};

// Couleur de fond par phase
const PHASE_BG = {
  perdu:    "#111318",
  guide:    "#13100c",
  stratege: "#0c1312",
};

// ─────────────────────────────────────────────────────────────────────────────
// PhaseTransitionOverlay — Halo radial animé lors d'un changement de phase
// ─────────────────────────────────────────────────────────────────────────────
function PhaseTransitionOverlay({ phaseId, accent, glow, trigger }) {
  return (
    <motion.div
      key={trigger}
      initial={{ opacity: 0, scale: 0.2 }}
      animate={{
        opacity: [0, 0.65, 0.45, 0],
        scale:   [0.2, 1.8, 2.8, 4.0],
      }}
      transition={{ duration: 2.8, ease: "easeOut" }}
      style={{
        position:      "fixed",
        inset:         0,
        zIndex:        200,
        pointerEvents: "none",
        background:    `radial-gradient(circle at 50% 48%, ${glow} 0%, transparent 65%)`,
      }}
    />
  );
}

function ShellPageFallback({ phaseContext }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(226,226,233,0.74)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: `2px solid ${phaseContext?.border ?? "rgba(189,194,255,0.18)"}`,
            borderTopColor: phaseContext?.accent ?? "#bdc2ff",
            animation: "noemaShellSpin 0.9s linear infinite",
          }}
        />
        <div style={{ fontSize: "0.88rem" }}>Preparation de votre espace...</div>
        <style>{`@keyframes noemaShellSpin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

export default function ShellV2({ adminSlot }) {
  const { navTab, phaseContext, changeTab } = useNoemaRuntime();

  // navTab est géré par AppShell, exposé via NoemaContext
  const activeTab = NAV_TABS.some((t) => t.id === navTab) ? navTab : "today";

  // ── Phase transition tracking ──
  const prevPhaseRef = useRef(phaseContext?.id);
  const [transitionTrigger, setTransitionTrigger] = useState(0);
  const [transitionData, setTransitionData] = useState(null);

  useEffect(() => {
    if (!phaseContext?.id) return;
    if (prevPhaseRef.current && prevPhaseRef.current !== phaseContext.id) {
      setTransitionData({ phaseId: phaseContext.id, accent: phaseContext.accent, glow: phaseContext.glow });
      setTransitionTrigger(t => t + 1);
    }
    prevPhaseRef.current = phaseContext.id;
  }, [phaseContext?.accent, phaseContext?.glow, phaseContext?.id]);

  // Couleur de fond phase-aware
  const backgroundColor = PHASE_BG[phaseContext?.id] ?? "#111318";
  const ActivePage = TAB_COMPONENTS[activeTab] ?? TAB_COMPONENTS.today;

  // Précharge Today + Chat au boot (idle) — les deux onglets les plus fréquents.
  // Les autres onglets se préchargent au survol/focus du bouton nav.
  useEffect(() => {
    preloadWhenIdle([TAB_COMPONENTS.today, TAB_COMPONENTS.chat]);
  }, []);

  const preloadTab = (tabId) => {
    TAB_COMPONENTS[tabId]?.preload?.();
  };

  return (
    <motion.div
      animate={{ backgroundColor }}
      transition={{ duration: 2.0, ease: "easeInOut" }}
      style={{
        minHeight:     "100vh",
        display:       "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Ambient gradient phase-aware ── */}
      <motion.div
        key={phaseContext?.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.8 }}
        style={{
          position:      "fixed",
          inset:         0,
          zIndex:        0,
          pointerEvents: "none",
          background:    `radial-gradient(ellipse 60% 50% at 15% 5%, ${phaseContext?.glow ?? "rgba(189,194,255,0.22)"} 0%, transparent 60%)`,
        }}
      />

      {/* ── Admin slot (AdminPanel injecté depuis AppShell) ── */}
      {adminSlot}

      {/* ── Zone de contenu principale avec transitions de page ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={PAGE_VARIANTS}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          style={{ flex: 1 }}
        >
          <Suspense fallback={<ShellPageFallback phaseContext={phaseContext} />}>
            <ActivePage />
          </Suspense>
        </motion.div>
      </AnimatePresence>

      {/* ── Bottom Nav V2 ── */}
      <nav style={{
        position:        "fixed",
        bottom:          0,
        left:            0,
        right:           0,
        height:          NAV_HEIGHT,
        backgroundColor: "#111318",
        borderTop:       `1px solid ${phaseContext?.border ?? "rgba(189,194,255,0.18)"}`,
        display:         "flex",
        flexDirection:   "column",
        zIndex:          100,
        backdropFilter:  "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: `0 -12px 32px rgba(0,0,0,0.24), inset 0 1px 0 ${phaseContext?.accentSoft ?? "rgba(189,194,255,0.06)"}`,
      }}>

        {/* Phase label */}
        <div style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          gap:            12,
          padding:        "8px 16px 4px",
          borderBottom:   "1px solid rgba(255,255,255,0.04)",
        }}>
          <span style={{
            fontSize:       "0.58rem",
            letterSpacing:  "0.16em",
            textTransform:  "uppercase",
            color:          phaseContext?.accent ?? "#bdc2ff",
            fontWeight:     700,
          }}>
            {PHASE_DISPLAY[phaseContext?.id] ?? "Exploration · Phase 1"}
          </span>
          <span style={{
            fontSize: "0.62rem",
            color:    "#c5c5d8",
          }}>
            {phaseContext?.paceLabel ?? ""}
          </span>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", alignItems: "stretch", flex: 1 }}>
          {NAV_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onMouseEnter={() => preloadTab(tab.id)}
                onFocus={() => preloadTab(tab.id)}
                onClick={() => {
                  preloadTab(tab.id);
                  changeTab(tab.id);
                }}
                style={{
                  flex:           1,
                  display:        "flex",
                  flexDirection:  "column",
                  alignItems:     "center",
                  justifyContent: "center",
                  gap:            4,
                  border:         "none",
                  background:     "none",
                  cursor:         "pointer",
                  borderRadius:   0,
                  padding:        "8px 4px",
                  position:       "relative",
                  overflow:       "hidden",
                }}
              >
                {/* Tab indicator animé — glisse entre les onglets */}
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    style={{
                      position:     "absolute",
                      inset:        0,
                      background:   phaseContext?.accentSoft ?? "rgba(189,194,255,0.09)",
                      borderRadius: 6,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}

                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: "1.375rem",
                    color:    isActive ? (phaseContext?.accent ?? "#bdc2ff") : "#454655",
                    fontVariationSettings: isActive
                      ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
                      : "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24",
                    transition:   "color 0.2s",
                    position:     "relative", // au-dessus du tab indicator
                  }}
                >{tab.icon}</span>

                <span style={{
                  fontSize:     "0.65rem",
                  fontFamily:   "'Plus Jakarta Sans', sans-serif",
                  fontWeight:   isActive ? 600 : 400,
                  color:        isActive ? (phaseContext?.accent ?? "#bdc2ff") : "#454655",
                  letterSpacing: "0.03em",
                  transition:   "color 0.2s",
                  position:     "relative",
                }}>{tab.lbl}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Phase transition overlay ── */}
      {transitionData && (
        <PhaseTransitionOverlay
          key={transitionTrigger}
          phaseId={transitionData.phaseId}
          accent={transitionData.accent}
          glow={transitionData.glow}
          trigger={transitionTrigger}
        />
      )}
    </motion.div>
  );
}
