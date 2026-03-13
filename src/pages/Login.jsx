import { useState } from "react";
import { sb } from "../lib/supabase";
import { GoogleSVG } from "../components/SVGs";
import { mapAuthErrorMessage } from "../utils/errors";

export default function Login({ onNav }) {
  const [tab,       setTab]       = useState("login");
  const [f,         setF]         = useState({name:"",email:"",password:""});
  const [show,      setShow]      = useState(false);
  const [load,      setLoad]      = useState(false);
  const [msg,       setMsg]       = useState(null);

  const upd = (k,v) => setF(p=>({...p,[k]:v}));
  // --- CODEX CHANGE START ---
  // Codex modification - simplify auth tabs after removing the tester
  // access-code product flow.
  const sw  = t => { setTab(t); setMsg(null); };
  // --- CODEX CHANGE END ---

  async function doLogin() {
    if (!f.email||!f.password) { setMsg({t:"Remplis tous les champs.",e:true}); return; }
    setLoad(true); setMsg(null);
    if (!sb) { setTimeout(()=>onNav("app"),800); return; }
    try {
      const {error} = await sb.auth.signInWithPassword({email:f.email,password:f.password});
      if (error) throw error; onNav("app");
    } catch(e) { setLoad(false); setMsg({t:mapAuthErrorMessage(e.message),e:true}); }
  }

  async function doSignup() {
    if (!f.name||!f.email||!f.password) { setMsg({t:"Remplis tous les champs.",e:true}); return; }
    if (f.password.length<8) { setMsg({t:"8 caractères minimum.",e:true}); return; }
    setLoad(true); setMsg(null);
    if (!sb) { setTimeout(()=>onNav("app"),800); return; }
    try {
      const {error} = await sb.auth.signUp({email:f.email,password:f.password,options:{data:{full_name:f.name}}});
      if (error) throw error;
      setLoad(false); setMsg({t:"Vérifie ta boîte mail pour confirmer.",e:false});
    } catch(e) { setLoad(false); setMsg({t:mapAuthErrorMessage(e.message),e:true}); }
  }

  const onEnter = e => {
    if (e.key !== "Enter") return;
    if (tab === "login") doLogin();
    else if (tab === "signup") doSignup();
  };

  return (
    <div className="lw">
      <div className="lc">
        <div className="ll">Noema<span>.</span></div>
        <div className="lt">Ton guide d'introspection</div>
        <div className="ltabs">
          <button className={`ltab${tab==="login"?" on":""}`}  onClick={()=>sw("login")}>Connexion</button>
          <button className={`ltab${tab==="signup"?" on":""}`} onClick={()=>sw("signup")}>Inscription</button>
        </div>

        {(tab==="login"||tab==="signup") && <>
          {tab==="signup"&&<div className="fld"><label>Prénom</label><input className="fi-input" type="text" placeholder="Ton prénom" value={f.name} onChange={e=>upd("name",e.target.value)} onKeyDown={onEnter}/></div>}
          <div className="fld"><label>Email</label><input className="fi-input" type="email" placeholder="ton@email.com" value={f.email} onChange={e=>upd("email",e.target.value)} onKeyDown={onEnter}/></div>
          <div className="fld"><label>Mot de passe</label>
            <div className="pw">
              <input className="fi-input" type={show?"text":"password"} placeholder={tab==="signup"?"8 caractères minimum":"········"} value={f.password} onChange={e=>upd("password",e.target.value)} onKeyDown={onEnter} autoComplete={tab==="signup"?"new-password":"current-password"}/>
              <button className="peye" type="button" onClick={()=>setShow(v=>!v)}>{show?"🙈":"👁"}</button>
            </div>
          </div>
          {tab==="login"&&<div className="fr"><button className="fbtn">Mot de passe oublié ?</button></div>}
          {tab==="signup"&&<div style={{marginBottom:14}}/>}
          <button className="btn-auth" onClick={tab==="login"?doLogin:doSignup} disabled={load}>
            {load?<span className="ld"><span/><span/><span/></span>:tab==="login"?"Continuer →":"Créer mon espace →"}
          </button>
          <div className="adiv">ou</div>
          <button className="btn-g" onClick={async()=>{
            if(!sb){onNav("app");return;}
            await sb.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.origin}});
          }}><GoogleSVG/> Continuer avec Google</button>
        </>}

        {msg&&<div className={`amsg ${msg.e?"err":"ok"}`}>{msg.t}</div>}
        <button className="lback" onClick={()=>onNav("landing")}>← Retour à l'accueil</button>
      </div>
    </div>
  );
}
