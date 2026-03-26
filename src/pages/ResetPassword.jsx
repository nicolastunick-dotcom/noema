import { useState } from "react";
import { sb } from "../lib/supabase";

const C = {
  bg: "#111318",
  surfaceContainer: "#1e1f25",
  surfaceContainerHigh: "#282a2f",
  outlineVariant: "#454655",
  onBackground: "#e2e2e9",
  onSurfaceVariant: "#c5c5d8",
  primary: "#bdc2ff",
  primaryContainer: "#7886ff",
  error: "#ffb4ab",
};

const inputStyle = {
  width: "100%",
  padding: "12px 16px 12px 42px",
  background: C.surfaceContainer,
  border: `1px solid ${C.outlineVariant}`,
  borderRadius: 12,
  color: C.onBackground,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: "0.875rem",
  outline: "none",
  boxSizing: "border-box",
};

export default function ResetPassword({ onNav }) {
  const [password,   setPassword]   = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [load,       setLoad]       = useState(false);
  const [msg,        setMsg]        = useState(null);
  const [done,       setDone]       = useState(false);

  async function handleSubmit() {
    if (!password || !confirm) { setMsg({ t: "Remplis les deux champs.", e: true }); return; }
    if (password !== confirm)  { setMsg({ t: "Les mots de passe ne correspondent pas.", e: true }); return; }
    if (password.length < 8)   { setMsg({ t: "Mot de passe trop court (8 caractères min).", e: true }); return; }
    setLoad(true); setMsg(null);
    const { error } = await sb.auth.updateUser({ password });
    setLoad(false);
    if (error) { setMsg({ t: error.message, e: true }); }
    else { setDone(true); }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400, background: C.surfaceContainer, borderRadius: 20, padding: "36px 30px", border: `1px solid ${C.outlineVariant}` }}>
        <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.5rem", color: C.onBackground, textAlign: "center", marginBottom: 6 }}>
          Nouveau mot de passe
        </p>
        <p style={{ fontSize: "0.78rem", color: C.onSurfaceVariant, textAlign: "center", marginBottom: 28 }}>
          Choisis un mot de passe sécurisé pour ton compte.
        </p>

        {done ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#a6f4a6", fontSize: "0.85rem", marginBottom: 24 }}>
              Mot de passe mis à jour avec succès.
            </p>
            <button
              onClick={() => onNav?.("/login")}
              style={{ padding: "12px 28px", background: C.primaryContainer, color: "#fff", border: "none", borderRadius: 12, fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Se connecter
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.onSurfaceVariant, marginBottom: 6 }}>
                Nouveau mot de passe
              </label>
              <div style={{ position: "relative" }}>
                <span className="material-symbols-outlined" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: "1rem", color: C.onSurfaceVariant, pointerEvents: "none" }}>lock</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.onSurfaceVariant, marginBottom: 6 }}>
                Confirmer le mot de passe
              </label>
              <div style={{ position: "relative" }}>
                <span className="material-symbols-outlined" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: "1rem", color: C.onSurfaceVariant, pointerEvents: "none" }}>lock</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  style={inputStyle}
                />
              </div>
            </div>

            {msg && (
              <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 14, fontSize: "0.8rem", background: msg.e ? "rgba(255,180,171,0.1)" : "rgba(166,244,166,0.1)", border: `1px solid ${msg.e ? "rgba(255,180,171,0.3)" : "rgba(166,244,166,0.3)"}`, color: msg.e ? C.error : "#a6f4a6" }}>
                {msg.t}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={load}
              style={{ width: "100%", padding: "12px", background: C.primaryContainer, color: "#fff", border: "none", borderRadius: 12, fontSize: "0.875rem", fontWeight: 600, cursor: load ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", opacity: load ? 0.6 : 1 }}
            >
              {load ? "Mise à jour..." : "Mettre à jour le mot de passe"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
