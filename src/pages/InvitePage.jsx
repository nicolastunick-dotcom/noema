import { useEffect, useState } from "react";

const C = {
  bg: "#111318",
  surface: "#1e1f25",
  border: "rgba(189,194,255,0.15)",
  primary: "#bdc2ff",
  primaryContainer: "#7886ff",
  onBackground: "#e2e2e9",
  onSurfaceVariant: "#c5c5d8",
  error: "#ffb4ab",
};

export default function InvitePage({ onNav, route }) {
  const [status, setStatus] = useState("checking"); // checking | valid | invalid

  useEffect(() => {
    const token = route?.query?.token;
    if (!token) { setStatus("invalid"); return; }

    fetch("/.netlify/functions/validate-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          sessionStorage.setItem("noema_invite", token.trim().toUpperCase());
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      })
      .catch(() => setStatus("invalid"));
  }, [route?.query?.token]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, fontFamily: "'Figtree', sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 380, padding: "0 24px" }}>
        {status === "checking" && (
          <>
            <div style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid rgba(189,194,255,0.15)", borderTopColor: C.primary, animation: "spin 0.9s linear infinite", margin: "0 auto 20px" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <p style={{ color: C.onSurfaceVariant, fontSize: "0.9rem" }}>Vérification de ton invitation…</p>
          </>
        )}

        {status === "valid" && (
          <>
            <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: "2rem", color: C.onBackground, marginBottom: 12 }}>
              Tu es invité·e.
            </p>
            <p style={{ color: C.onSurfaceVariant, fontSize: "0.875rem", lineHeight: 1.7, marginBottom: 32 }}>
              Crée ton compte ou connecte-toi pour accéder à Noema.
            </p>
            <button
              onClick={() => onNav?.("/login")}
              style={{ padding: "13px 32px", background: C.primaryContainer, color: "#fff", border: "none", borderRadius: 999, fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Figtree', sans-serif" }}
            >
              Commencer l'exploration
            </button>
          </>
        )}

        {status === "invalid" && (
          <>
            <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.8rem", color: C.onBackground, marginBottom: 12 }}>
              Lien invalide.
            </p>
            <p style={{ color: C.onSurfaceVariant, fontSize: "0.875rem", lineHeight: 1.7, marginBottom: 32 }}>
              Ce lien d'invitation n'existe pas ou a expiré.
            </p>
            <button
              onClick={() => onNav?.("/")}
              style={{ padding: "11px 28px", background: "none", border: `1px solid ${C.border}`, borderRadius: 999, fontSize: "0.875rem", color: C.onSurfaceVariant, cursor: "pointer", fontFamily: "'Figtree', sans-serif" }}
            >
              Retour à l'accueil
            </button>
          </>
        )}
      </div>
    </div>
  );
}
