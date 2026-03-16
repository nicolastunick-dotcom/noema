import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sb } from "../../lib/supabase";
import { GoogleSVG } from "../../components/SVGs";
import { mapAuthErrorMessage } from "../../utils/errors";
import NavbarV2 from "../components/NavbarV2";
import "../styles/v2-app.css";

export default function LoginV2({ onNav }) {
  const [tab, setTab] = useState("login");
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [show, setShow] = useState(false);
  const [load, setLoad] = useState(false);
  const [msg, setMsg] = useState(null);

  const upd = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const sw = (t) => { setTab(t); setMsg(null); };

  async function doLogin() {
    if (!f.email || !f.password) { setMsg({ t: "Remplis tous les champs.", e: true }); return; }
    setLoad(true); setMsg(null);
    if (!sb) { setTimeout(() => onNav("app"), 800); return; }
    try {
      const { error } = await sb.auth.signInWithPassword({ email: f.email, password: f.password });
      if (error) throw error; 
      onNav("app");
    } catch (e) { 
      setLoad(false); 
      setMsg({ t: mapAuthErrorMessage(e.message), e: true }); 
    }
  }

  async function doSignup() {
    if (!f.name || !f.email || !f.password) { setMsg({ t: "Remplis tous les champs.", e: true }); return; }
    if (f.password.length < 8) { setMsg({ t: "8 caractères minimum.", e: true }); return; }
    setLoad(true); setMsg(null);
    if (!sb) { setTimeout(() => onNav("app"), 800); return; }
    try {
      const { error } = await sb.auth.signUp({ email: f.email, password: f.password, options: { data: { full_name: f.name } } });
      if (error) throw error;
      setLoad(false); 
      setMsg({ t: "Vérifie ta boîte mail pour confirmer.", e: false });
    } catch (e) { 
      setLoad(false); 
      setMsg({ t: mapAuthErrorMessage(e.message), e: true }); 
    }
  }

  const onEnter = (e) => {
    if (e.key !== "Enter") return;
    if (tab === "login") doLogin();
    else if (tab === "signup") doSignup();
  };

  return (
    <div className="v2-root-body" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="v2-ambient-mesh" />

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "1.5rem 2rem", zIndex: 10, maxWidth: "1200px", margin: "0 auto" }}>
        <NavbarV2 
          onNav={onNav}
          rightControls={
            <button 
              onClick={() => onNav("landing")}
              style={{ background: "transparent", border: "none", color: "var(--color-text-secondary)", cursor: "pointer", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-sans)" }}
            >
              <span>←</span> Retour à l'accueil
            </button>
          }
        />
      </div>

      <motion.div 
        className="v2-glass-card"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        style={{ width: "100%", maxWidth: "420px", padding: "2.5rem" }}
      >
        <div style={{ textAlign: "center", color: "var(--color-text-secondary)", fontSize: "0.95rem", marginBottom: "2rem" }}>Ton guide d'introspection</div>

        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "1px solid rgba(0,0,0,0.1)", paddingBottom: "1rem" }}>
          <button 
            style={{ flex: 1, background: "transparent", border: "none", color: tab === "login" ? "var(--color-text-primary)" : "var(--color-text-muted)", fontSize: "1rem", cursor: "pointer", transition: "color 0.3s" }} 
            onClick={() => sw("login")}
          >
            Connexion
          </button>
          <button 
            style={{ flex: 1, background: "transparent", border: "none", color: tab === "signup" ? "var(--color-text-primary)" : "var(--color-text-muted)", fontSize: "1rem", cursor: "pointer", transition: "color 0.3s" }} 
            onClick={() => sw("signup")}
          >
            Inscription
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={tab}
            initial={{ opacity: 0, x: tab === "login" ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: tab === "login" ? 10 : -10 }}
            transition={{ duration: 0.2 }}
            style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}
          >
            {tab === "signup" && (
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--color-text-secondary)", marginBottom: "6px" }}>Prénom</label>
                <input className="v2-input-area" style={{ width: "100%", padding: "12px", paddingLeft: "16px" }} type="text" placeholder="Ton prénom" value={f.name} onChange={e => upd("name", e.target.value)} onKeyDown={onEnter}/>
              </div>
            )}
            
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--color-text-secondary)", marginBottom: "6px" }}>Email</label>
              <input className="v2-input-area" style={{ width: "100%", padding: "12px", paddingLeft: "16px" }} type="email" placeholder="ton@email.com" value={f.email} onChange={e => upd("email", e.target.value)} onKeyDown={onEnter}/>
            </div>
            
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--color-text-secondary)", marginBottom: "6px" }}>Mot de passe</label>
              <div style={{ position: "relative" }}>
                <input className="v2-input-area" style={{ width: "100%", padding: "12px", paddingLeft: "16px", paddingRight: "40px" }} type={show ? "text" : "password"} placeholder={tab === "signup" ? "8 caractères minimum" : "········"} value={f.password} onChange={e => upd("password", e.target.value)} onKeyDown={onEnter} autoComplete={tab === "signup" ? "new-password" : "current-password"}/>
                <button type="button" onClick={() => setShow(v => !v)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}>
                  {show ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <button 
              onClick={tab === "login" ? doLogin : doSignup} 
              disabled={load}
              style={{ background: "var(--color-text-primary)", color: "var(--color-bg-base)", border: "none", padding: "14px", borderRadius: "12px", fontSize: "1rem", fontWeight: 500, cursor: load ? "not-allowed" : "pointer", marginTop: "0.5rem", transition: "opacity 0.3s" }}
            >
              {load ? "Chargement..." : tab === "login" ? "Continuer →" : "Créer mon espace →"}
            </button>
            
            <div style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.85rem", margin: "0.5rem 0" }}>ou</div>
            
            <button 
              onClick={async () => {
                if (!sb) { onNav("app"); return; }
                await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
              }}
              style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.1)", color: "var(--color-text-primary)", padding: "12px", borderRadius: "12px", fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", transition: "background 0.3s" }}
            >
              <GoogleSVG /> Continuer avec Google
            </button>
          </motion.div>
        </AnimatePresence>

        {msg && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: "1.5rem", padding: "12px", borderRadius: "8px", fontSize: "0.9rem", textAlign: "center", background: msg.e ? "rgba(255, 60, 60, 0.1)" : "rgba(60, 255, 100, 0.1)", color: msg.e ? "#ff6b6b" : "#69db7c", border: `1px solid ${msg.e ? "rgba(255,60,60,0.2)" : "rgba(60,255,100,0.2)"}` }}
          >
            {msg.t}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
