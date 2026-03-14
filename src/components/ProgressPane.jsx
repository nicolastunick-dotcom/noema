import { memo } from "react";
import GlassCard from "./GlassCard";
import { THEMES, STEPS } from "../constants/themes";

const ProgressPane = memo(function ProgressPane({ step, mentalState, nextAction }) {
  const safeStep = Math.min(Math.max(step, 0), STEPS.length - 1);
  const pct    = Math.max(Math.round(((safeStep + 1) / STEPS.length) * 100), 8);
  const clrPct = mentalState==="clarity" ? 72 : mentalState==="exploring" ? 38 : 12;
  return (
    <>
      {/* --- CODEX CHANGE START --- */}
      <GlassCard className="pb mental-module" tone="violet">
        <div className="pl">Avancement de session</div>
        <div className="pt"><div className="pf" style={{width:`${pct}%`}}/></div>
        <div className="pm"><span>Étape {safeStep + 1}/{STEPS.length}</span><span>{pct}%</span></div>
      </GlassCard>
      <GlassCard className="pb mental-module" tone="sage">
        <div className="pl">Clarté mentale</div>
        <div className="pt"><div className="pf" style={{width:`${clrPct}%`}}/></div>
        <div className="pm"><span>État actuel</span><span style={{color:"var(--accent)"}}>{THEMES[mentalState].label}</span></div>
      </GlassCard>
      <GlassCard className="mental-module" tone="rose">
        <div className="pl" style={{marginBottom:8}}>Parcours</div>
        <div className="sl">
          {STEPS.map((s,i) => (
            <div className={`sr${i===safeStep?" on":i<safeStep?" done":""}`} key={s.name}>
              <div className="si">{i<safeStep?"✓":s.icon}</div>
              <div style={{flex:1}}><div className="sn">{s.name}</div><div className="ss">{s.sub}</div></div>
              <div className="sk">✓</div>
            </div>
          ))}
        </div>
      </GlassCard>
      {/* --- CODEX CHANGE START --- */}
      {/* Codex modification - surface the current between-session action in the
          progression panel without changing the rest of the layout. */}
      {nextAction && (
        <GlassCard className="pb mental-module mental-module--action" tone="violet">
          <div className="pl">Avant notre prochaine session</div>
          <div className="ic" style={{marginBottom:0}}>
            <div className="ic-item" style={{fontSize:".8rem", lineHeight:1.6}}>{nextAction}</div>
          </div>
        </GlassCard>
      )}
      {/* --- CODEX CHANGE END --- */}
    </>
  );
});

export default ProgressPane;
