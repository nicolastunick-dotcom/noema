import { startTransition, useState } from "react";
import GlassCard from "../components/GlassCard";
import DemoBubble from "../components/DemoBubble";
import { DEMO_FLOW_STEPS, DEMO_FLOW_TOTAL } from "../constants/demoFlow";

export default function DemoPage({ onNav, user }) {
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = DEMO_FLOW_STEPS[stepIndex];
  const isFinalStep = currentStep.kind === "final";
  const progressLabel = `${stepIndex + 1}/${DEMO_FLOW_TOTAL}`;

  function goToNextStep() {
    startTransition(() => {
      setStepIndex((currentIndex) => Math.min(currentIndex + 1, DEMO_FLOW_TOTAL - 1));
    });
  }

  function enterNoema() {
    onNav(user ? "app" : "login");
  }

  return (
    <div className="demo-page">
      <div className="demo-ambient demo-ambient--top"/>
      <div className="demo-ambient demo-ambient--side"/>
      <div className="demo-ambient demo-ambient--bottom"/>

      <div className="demo-shell">
        <header className="demo-header">
          <button className="demo-logo" onClick={() => onNav("landing")}>
            Noema<span>.</span>
          </button>
          <div className="demo-header-meta">
            <button className="demo-back" onClick={() => onNav("landing")}>
              Retour
            </button>
            <div className="demo-progress-pill">{progressLabel}</div>
          </div>
        </header>

        <main className="demo-main">
          <div className="demo-intro">
            <div className="demo-kicker">Experience guidee</div>
            <h1 className="demo-title">Decouvrir Noema avant d'y entrer</h1>
            <p className="demo-subtitle">
              Un parcours court, calme et progressif pour comprendre ce que l'experience cherche a reveler.
            </p>
          </div>

          <div className="demo-stage" key={currentStep.id}>
            {isFinalStep ? (
              <GlassCard className="demo-finale-card" tone="violet">
                <div className="demo-finale-copy">
                  <div className="demo-finale-eyebrow">{currentStep.eyebrow}</div>
                  <h2 className="demo-finale-title">{currentStep.title}</h2>
                  <p className="demo-finale-intro">{currentStep.intro}</p>
                </div>

                <div className="demo-video-frame" role="img" aria-label={currentStep.videoLabel}>
                  <div className="demo-video-play">
                    <span className="demo-video-play-triangle"/>
                  </div>
                  <div className="demo-video-label">{currentStep.videoLabel}</div>
                  <div className="demo-video-hint">{currentStep.videoHint}</div>
                </div>

                <p className="demo-finale-note">{currentStep.copy}</p>

                <div className="demo-finale-actions">
                  <button className="demo-cta" onClick={enterNoema}>
                    {currentStep.ctaLabel}
                  </button>
                </div>
              </GlassCard>
            ) : (
              <>
                <DemoBubble eyebrow={currentStep.eyebrow} text={currentStep.text}/>
                <div className="demo-actions">
                  <button className="demo-next" onClick={goToNextStep}>
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
