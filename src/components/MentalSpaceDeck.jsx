// --- CODEX CHANGE START ---
// Codex modification - centralize the switchable mental-space carousel used by
// the desktop side rail and the mobile modal so the experience stays coherent.
import { memo } from "react";

const MentalSpaceDeck = memo(function MentalSpaceDeck({
  tabs,
  activeTab,
  onTabChange,
  panels,
  mobile = false,
}) {
  const activeIndex = Math.max(tabs.findIndex((tab) => tab.id === activeTab), 0);

  return (
    <div className={`mental-space${mobile ? " mobile" : ""}`}>
      <div className="mental-space-copy">
        <div className="mental-space-eyebrow">Espace mental</div>
        <h3 className="mental-space-title">Une cartographie vivante de ce qui se clarifie.</h3>
        <p className="mental-space-subtitle">
          Chat pour explorer. Panneaux pour comprendre, relier et faire émerger une direction plus nette.
        </p>
      </div>

      <div className="mental-switch" role="tablist" aria-label="Panneaux Noema">
        <div
          className="mental-switch-glider"
          style={{
            width: `${100 / tabs.length}%`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`mental-tab-${tab.id}${mobile ? "-mobile" : ""}`}
            role="tab"
            type="button"
            aria-controls={`mental-panel-${tab.id}${mobile ? "-mobile" : ""}`}
            aria-selected={activeTab === tab.id}
            className={`mental-switch-btn${activeTab === tab.id ? " on" : ""}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="mental-switch-icon" aria-hidden="true">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="mental-stage">
        <div
          className="mental-track"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {tabs.map((tab) => (
            <section
              key={tab.id}
              id={`mental-panel-${tab.id}${mobile ? "-mobile" : ""}`}
              role="tabpanel"
              aria-labelledby={`mental-tab-${tab.id}${mobile ? "-mobile" : ""}`}
              className="mental-slide"
            >
              <div className="mental-panel-stack">
                {panels[tab.id]}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
});

export default MentalSpaceDeck;
// --- CODEX CHANGE END ---
