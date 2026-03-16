import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../../styles/v2-app.css";

const PHASES = [
  { id: 1, name: "L'Observateur", desc: "Diagnostic & Schémas mentaux", range: [1, 3] },
  { id: 2, name: "Le Guérisseur", desc: "Libération des blocages & Soin du mental", range: [4, 7] },
  { id: 3, name: "Le Coach", desc: "Ikigai, Ambition & Action", range: [8, 999] }
];

const ConscienceSidebarV2 = memo(function ConscienceSidebarV2({ insights, sessionIndex = 1 }) {
  const { forces = [], blocages = {} } = insights || {};
  const activeBlocages = Object.entries(blocages).filter(([_, v]) => v).map(([k, v]) => ({ type: k, text: v }));

  const currentPhaseIndex = PHASES.findIndex(p => sessionIndex >= p.range[0] && sessionIndex <= p.range[1]);

  return (
    <div className="v2-glass-card conscience-sidebar" style={{ 
      height: "100%", 
      display: "flex", 
      flexDirection: "column", 
      padding: "2.5rem 2rem",
      backdropFilter: "blur(32px) saturate(180%)",
      background: "rgba(255, 255, 255, 0.7)",
      border: "1px solid rgba(255, 255, 255, 0.9)",
      boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.05)"
    }}>
      <h2 className="serif-font" style={{ fontSize: "1.8rem", color: "var(--color-text-primary)", marginBottom: "2.5rem", textAlign: "center" }}>
        Miroir de Conscience
      </h2>

      {/* Roadmap */}
      <div style={{ position: "relative", marginBottom: "3rem", paddingLeft: "1rem" }}>
        {/* Vertical Line */}
        <div style={{ position: "absolute", left: "1.65rem", top: "1rem", bottom: "1rem", width: "2px", background: "rgba(0,0,0,0.08)", zIndex: 0 }} />
        
        {PHASES.map((phase, i) => {
          const isActive = i === currentPhaseIndex;
          const isPast = i < currentPhaseIndex;
          
          return (
            <div key={phase.id} style={{ display: "flex", gap: "1.5rem", marginBottom: i !== PHASES.length -1 ? "2rem" : 0, position: "relative", zIndex: 1 }}>
              {/* Stepper */}
              <div style={{ 
                width: "24px", height: "24px", borderRadius: "50%", 
                background: isActive ? "var(--color-bg-base)" : isPast ? "var(--color-text-primary)" : "rgba(0,0,0,0.05)",
                border: isActive ? "2px solid var(--color-text-primary)" : "2px solid transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: isActive ? "0 0 15px rgba(0,0,0,0.15)" : "none",
                marginTop: "4px",
                position: "relative"
              }}>
                {isActive && (
                  <motion.div 
                    animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                    style={{ position: "absolute", width: "100%", height: "100%", borderRadius: "50%", background: "var(--color-text-primary)" }}
                  />
                )}
                {isActive && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-text-primary)" }} />}
                {isPast && <div style={{ color: "var(--color-bg-base)", fontSize: "10px", fontWeight: "bold" }}>✓</div>}
              </div>
              
              {/* Text */}
              <div style={{ opacity: isActive || isPast ? 1 : 0.4, transition: "opacity 0.3s" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                  Phase {phase.id}
                </div>
                <div className="serif-font" style={{ fontSize: "1.35rem", color: "var(--color-text-primary)", marginBottom: "6px", letterSpacing: "-0.01em" }}>
                  {phase.name}
                </div>
                <div style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
                  {phase.desc}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Insights Mirror */}
      <div style={{ flex: 1, overflowY: "auto", borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: "2rem" }}>
        {/* Header removed from scrollable area to make it stick if desired, but here it scrolls naturally */}
        <h3 style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1.5rem" }}>
          Reflets Actuels
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <AnimatePresence>
            {forces.map((force, i) => (
              <motion.div 
                key={`force-${i}-${force}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  padding: "1rem 1.25rem", borderRadius: "14px",
                  background: "rgba(16, 185, 129, 0.06)", // Light Emerald
                  border: "1px solid rgba(16, 185, 129, 0.15)",
                }}
              >
                <div style={{ fontSize: "0.7rem", color: "#059669", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Force</div>
                <div style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>{force}</div>
              </motion.div>
            ))}

            {activeBlocages.map((blocage, i) => (
              <motion.div 
                key={`blocage-${blocage.type}-${blocage.text}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: (forces.length + i) * 0.1, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  padding: "1rem 1.25rem", borderRadius: "14px",
                  background: "rgba(245, 158, 11, 0.06)", // Light Amber / Gold
                  border: "1px solid rgba(245, 158, 11, 0.15)",
                }}
              >
                <div style={{ fontSize: "0.7rem", color: "#d97706", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Blocage • {blocage.type}</div>
                <div style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>{blocage.text}</div>
              </motion.div>
            ))}

            {forces.length === 0 && activeBlocages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ textAlign: "center", color: "var(--color-text-muted)", fontStyle: "italic", fontSize: "0.95rem", padding: "3rem 0" }}
              >
                Ton miroir est vide.<br/><br/>Parle-moi simplement,<br/>je t'écoute.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});

export default ConscienceSidebarV2;
