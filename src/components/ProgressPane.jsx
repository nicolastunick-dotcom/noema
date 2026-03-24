import { memo } from "react";
import { THEMES, STEPS } from "../constants/themes";

const ProgressPane = memo(function ProgressPane({ step, mentalState }) {
  const pct    = Math.max(Math.round(((step+1)/6)*100), 8);
  const clrPct = mentalState==="clarity" ? 72 : mentalState==="exploring" ? 38 : 12;
  return (
    <>
      <div className="pb">
        <div className="pl">Avancement de session</div>
        <div className="pt"><div className="pf" style={{width:`${pct}%`}}/></div>
        <div className="pm"><span>Étape {step+1}/6</span><span>{pct}%</span></div>
      </div>
      <div className="pb">
        <div className="pl">Clarté mentale</div>
        <div className="pt"><div className="pf" style={{width:`${clrPct}%`}}/></div>
        <div className="pm"><span>État actuel</span><span style={{color:"var(--accent)"}}>{THEMES[mentalState].label}</span></div>
      </div>
      <div className="pl" style={{marginBottom:8}}>Parcours</div>
      <div className="sl">
        {STEPS.map((s,i) => (
          <div className={`sr${i===step?" on":i<step?" done":""}`} key={s.name}>
            <div className="si">{i<step?"✓":s.icon}</div>
            <div style={{flex:1}}><div className="sn">{s.name}</div><div className="ss">{s.sub}</div></div>
            <div className="sk">✓</div>
          </div>
        ))}
      </div>
    </>
  );
});

export default ProgressPane;
