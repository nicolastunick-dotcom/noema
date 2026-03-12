import { memo } from "react";

const ITEMS = [
  { icon:"❤️", label:"Ce que tu aimes",           k:"aime" },
  { icon:"💡", label:"Ce en quoi tu excelles",    k:"excelle" },
  { icon:"🌍", label:"Ce dont le monde a besoin", k:"monde" },
  { icon:"💰", label:"Ce pour quoi on te paie",   k:"paie" },
];

const IkigaiPane = memo(function IkigaiPane({ ikigai, onGen }) {
  return (
    <>
      <div className="ikg">
        {ITEMS.map(({icon,label,k}) => (
          <div className="ikc" key={k}>
            <div className="iki">{icon}</div>
            <div className="ikl">{label}</div>
            <div className="ikv">{ikigai[k] || <span className="ike">À découvrir</span>}</div>
          </div>
        ))}
      </div>
      {ikigai.mission && (
        <div style={{padding:"13px",background:"var(--accent-soft)",border:"1px solid var(--accent-border)",borderRadius:"var(--rs)",marginBottom:14}}>
          <div style={{fontSize:".62rem",fontWeight:700,letterSpacing:".09em",textTransform:"uppercase",color:"var(--accent)",marginBottom:6}}>🌟 Mission de vie</div>
          <div style={{fontSize:".82rem",color:"var(--text2)",lineHeight:1.65,fontStyle:"italic"}}>{ikigai.mission}</div>
        </div>
      )}
      <button className="btn-ikg" onClick={onGen}>✨ Générer mon Ikigai maintenant</button>
    </>
  );
});

export default IkigaiPane;
