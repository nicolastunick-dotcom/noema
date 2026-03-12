import { useState } from "react";
import { sb } from "../lib/supabase";
import { ADMIN_CODES } from "../constants/config";
import { genCode } from "../utils/helpers";
import { GoogleSVG } from "../components/SVGs";

export default function Login({ onNav }) {
  const [tab,       setTab]       = useState("login");
  const [f,         setF]         = useState({name:"",email:"",password:""});
  const [show,      setShow]      = useState(false);
  const [load,      setLoad]      = useState(false);
  const [msg,       setMsg]       = useState(null);
  const [code,      setCode]      = useState("");
  const [generated, setGenerated] = useState(null);
  const [copied,    setCopied]    = useState(false);

  const upd = (k,v) => setF(p=>({...p,[k]:v}));
  const sw  = t => { setTab(t); setMsg(null); setGenerated(null); };

  const errMsg = m => {
    if (!m) return "Une erreur est survenue.";
    if (m.includes("Invalid login"))      return "Email ou mot de passe incorrect.";
    if (m.includes("already registered")) return "Cet email est déjà utilisé.";
    if (m.includes("Password"))           return "Mot de passe trop court (8 caractères min).";
    if (m.includes("rate limit"))         return "Trop de tentatives — attends quelques minutes.";
    return m;
  };

  async function doLogin() {
    if (!f.email||!f.password) { setMsg({t:"Remplis tous les champs.",e:true}); return; }
    setLoad(true); setMsg(null);
    if (!sb) { setTimeout(()=>onNav("app"),800); return; }
    try {
      const {error} = await sb.auth.signInWithPassword({email:f.email,password:f.password});
      if (error) throw error; onNav("app");
    } catch(e) { setLoad(false); setMsg({t:errMsg(e.message),e:true}); }
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
    } catch(e) { setLoad(false); setMsg({t:errMsg(e.message),e:true}); }
  }

  async function doCode() {
    const raw   = code.trim().toUpperCase().replace(/^NOEMA-/,"");
    const input = raw ? "NOEMA-" + raw : "";
    if (!input) { setMsg({t:"Entre un code d'accès.",e:true}); return; }
    setLoad(true); setMsg(null);

    if (ADMIN_CODES.includes(input)) {
      const newCode = genCode();
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      if (sb) {
        const {error} = await sb.from("access_codes").insert({ code: newCode, expires_at: expires, max_uses: 1 });
        if (error) { setLoad(false); setMsg({t:"Erreur création code : "+error.message, e:true}); return; }
      }
      setGenerated(newCode);
      setLoad(false);
      return;
    }

    if (!sb) { setLoad(false); setMsg({t:"Supabase non configuré.",e:true}); return; }
    await new Promise(r => setTimeout(r, 500));
    const now = new Date().toISOString();
    const {data, error} = await sb.from("access_codes")
      .select("id, code, expires_at, max_uses, use_count")
      .eq("code", input)
      .gt("expires_at", now)
      .maybeSingle();

    if (error || !data) { setLoad(false); setMsg({t:"Code invalide ou expiré.",e:true}); return; }
    if (data.use_count >= data.max_uses) { setLoad(false); setMsg({t:"Ce code a déjà été utilisé.",e:true}); return; }

    const {data: authData, error: authErr} = await sb.auth.signInAnonymously();
    if (authErr) { setLoad(false); setMsg({t:"Erreur connexion : "+authErr.message,e:true}); return; }

    await sb.from("access_codes").update({
      use_count: data.use_count + 1,
      used_by:   authData.user.id,
    }).eq("id", data.id);
  }

  const codeReady = code.replace(/^NOEMA-/i,"").length === 5;

  const onEnter = e => {
    if (e.key !== "Enter") return;
    if (tab === "login") doLogin();
    else if (tab === "signup") doSignup();
    else if (tab === "code" && codeReady) doCode();
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="lw">
      <div className="lc">
        <div className="ll">Noema<span>.</span></div>
        <div className="lt">Ton guide d'introspection</div>
        <div className="ltabs">
          <button className={`ltab${tab==="login"?" on":""}`}  onClick={()=>sw("login")}>Connexion</button>
          <button className={`ltab${tab==="signup"?" on":""}`} onClick={()=>sw("signup")}>Inscription</button>
          <button className={`ltab${tab==="code"?" on":""}`}   onClick={()=>sw("code")}>Code d'accès</button>
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

        {tab==="code" && <>
          <div className="fld">
            <label>Code d'accès</label>
            <div className="code-input-wrap">
              <span className="code-prefix">NOEMA-</span>
              <input
                className="code-input"
                type="text"
                placeholder="X7K2P"
                maxLength={5}
                value={code.replace(/^NOEMA-/i,"")}
                onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""))}
                onKeyDown={onEnter}
                autoComplete="off"
              />
            </div>
          </div>
          <button className="btn-auth" onClick={doCode} disabled={load||!codeReady}>
            {load?<span className="ld"><span/><span/><span/></span>:"Accéder →"}
          </button>
          {generated && (
            <div>
              <div className="code-generated">
                <span>{generated}</span>
                <button className="code-copy" onClick={copyCode}>{copied?"Copié !":"Copier"}</button>
              </div>
              <p className="code-hint">Code valable 7 jours · 1 utilisation</p>
            </div>
          )}
          <p className="code-hint" style={{marginTop:12}}>Tu as reçu un code d'accès ? Entre les 5 derniers caractères ci-dessus.</p>
        </>}

        {msg&&<div className={`amsg ${msg.e?"err":"ok"}`}>{msg.t}</div>}
        <button className="lback" onClick={()=>onNav("landing")}>← Retour à l'accueil</button>
      </div>
    </div>
  );
}
