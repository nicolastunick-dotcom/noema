import { useState, useEffect } from "react";
import { sb } from "../lib/supabase";
import { GoogleSVG } from "../components/SVGs";

const C = {
  bg: "#111318",
  surface: "#111318",
  surfaceContainer: "#1e1f25",
  surfaceContainerHigh: "#282a2f",
  surfaceContainerHighest: "#33353a",
  surfaceContainerLow: "#1a1b21",
  outlineVariant: "#454655",
  outline: "#8f8fa1",
  onBackground: "#e2e2e9",
  onSurface: "#e2e2e9",
  onSurfaceVariant: "#c5c5d8",
  primary: "#bdc2ff",
  primaryContainer: "#7886ff",
  onPrimaryContainer: "#00118c",
  error: "#ffb4ab",
};

const TAB_TITLES = {
  login:  { h: "Bon retour",      sub: "Reconnectez-vous à votre espace de pensée." },
  signup: { h: "Créer un compte", sub: "Rejoignez Noema et commencez votre exploration." },
  code:   { h: "Code d'accès",    sub: "Entrez votre code pour accéder à Noema." },
};

export default function Login({ onNav, notice = null, checkingAccess = false }) {
  const [tab,       setTab]       = useState("login");
  const [f,         setF]         = useState({ name: "", email: "", password: "" });
  const [show,      setShow]      = useState(false);
  const [load,      setLoad]      = useState(false);
  const [msg,       setMsg]       = useState(null);
  const [code,      setCode]      = useState("");
  const [generated, setGenerated] = useState(null);
  const [copied,    setCopied]    = useState(false);

  // Scroll autorisé sur cette page
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const upd = (k, v) => setF(p => ({ ...p, [k]: v }));
  const sw  = t => { setTab(t); setMsg(null); setGenerated(null); };

  const errMsg = m => {
    if (!m) return "Une erreur est survenue.";
    if (m.includes("Invalid login"))      return "Email ou mot de passe incorrect.";
    if (m.includes("already registered")) return "Cet email est déjà utilisé.";
    if (m.includes("Password"))           return "Mot de passe trop court (8 caractères min).";
    if (m.includes("rate limit"))         return "Trop de tentatives — attends quelques minutes.";
    return m;
  };

  async function handleForgotPassword() {
    if (!f.email) { setMsg({ t: "Entre ton email d'abord.", e: true }); return; }
    setLoad(true); setMsg(null);
    const { error } = await sb.auth.resetPasswordForEmail(f.email, {
      redirectTo: "https://noemaapp.netlify.app/reset-password",
    });
    setLoad(false);
    if (error) { setMsg({ t: errMsg(error.message), e: true }); }
    else { setMsg({ t: "Un lien a été envoyé à ton adresse email.", e: false }); }
  }

  async function doLogin() {
    if (!f.email || !f.password) { setMsg({ t: "Remplis tous les champs.", e: true }); return; }
    setLoad(true); setMsg(null);
    if (!sb) { setLoad(false); setMsg({ t: "Connexion indisponible pour le moment.", e: true }); return; }
    try {
      const { error } = await sb.auth.signInWithPassword({ email: f.email, password: f.password });
      if (error) throw error;
      setLoad(false);
      setMsg({ t: "Connexion reussie. Verification de votre abonnement...", e: false });
    } catch (e) { setLoad(false); setMsg({ t: errMsg(e.message), e: true }); }
  }

  async function doSignup() {
    if (!f.name || !f.email || !f.password) { setMsg({ t: "Remplis tous les champs.", e: true }); return; }
    if (f.password.length < 8) { setMsg({ t: "8 caractères minimum.", e: true }); return; }
    setLoad(true); setMsg(null);
    if (!sb) { setLoad(false); setMsg({ t: "Inscription indisponible pour le moment.", e: true }); return; }
    try {
      const { error } = await sb.auth.signUp({ email: f.email, password: f.password, options: { data: { full_name: f.name } } });
      if (error) throw error;
      setLoad(false); setMsg({ t: "Vérifie ta boîte mail pour confirmer.", e: false });
    } catch (e) { setLoad(false); setMsg({ t: errMsg(e.message), e: true }); }
  }

  async function doCode() {
    const raw   = code.trim().toUpperCase().replace(/^NOEMA-/, "");
    const input = raw ? "NOEMA-" + raw : "";
    if (!input) { setMsg({ t: "Entre un code d'accès.", e: true }); return; }
    setLoad(true); setMsg(null);

    // Vérification admin côté serveur (ADMIN_CODES n'est plus dans le bundle client)
    try {
      const verifyRes = await fetch("/.netlify/functions/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: input }),
      });
      const payload = await verifyRes.json().catch(() => null);
      if (payload?.isAdmin && payload.generatedCode) {
        setGenerated(payload.generatedCode);
        setLoad(false);
        return;
      }
      if (payload?.isAdmin) {
        setLoad(false);
        setMsg({ t: payload.error || "Configuration admin incomplète. Impossible de générer un code.", e: true });
        return;
      }
    } catch {
      // Si la fonction n'est pas disponible (ex: dev local), on continue vers la vérification normale
    }

    if (!sb) { setLoad(false); setMsg({ t: "Supabase non configuré.", e: true }); return; }
    await new Promise(r => setTimeout(r, 500));
    const now = new Date().toISOString();
    const { data, error } = await sb.from("access_codes")
      .select("id, code, expires_at, max_uses, use_count")
      .eq("code", input)
      .gt("expires_at", now)
      .maybeSingle();

    if (error || !data) { setLoad(false); setMsg({ t: "Code invalide ou expiré.", e: true }); return; }
    if (data.use_count >= data.max_uses) { setLoad(false); setMsg({ t: "Ce code a déjà été utilisé.", e: true }); return; }

    const { data: authData, error: authErr } = await sb.auth.signInAnonymously();
    if (authErr) { setLoad(false); setMsg({ t: "Erreur connexion : " + authErr.message, e: true }); return; }

    await sb.from("access_codes").update({
      use_count: data.use_count + 1,
      used_by: authData.user.id,
    }).eq("id", data.id);
  }

  const codeReady = code.replace(/^NOEMA-/i, "").length === 5;

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

  const googleLogin = async () => {
    if (!sb) { setMsg({ t: "Connexion Google indisponible pour le moment.", e: true }); return; }
    setMsg({ t: "Connexion Google en cours...", e: false });
    await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
  };

  const { h, sub } = TAB_TITLES[tab];

  return (
    <div style={{
      backgroundColor: C.bg,
      color: C.onBackground,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* ── Nav ── */}
      <nav style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 32px",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        zIndex: 50,
      }}>
        <button
          onClick={() => onNav("landing")}
          style={{
            background: "none",
            border: "none",
            fontFamily: "'Newsreader', serif",
            fontSize: "1.5rem",
            fontWeight: 700,
            color: C.onBackground,
            letterSpacing: "-0.05em",
            cursor: "pointer",
            padding: 0,
          }}
        >Noema</button>
        <button
          onClick={() => onNav("pricing")}
          style={{
            background: "none",
            border: "1px solid rgba(189,194,255,0.18)",
            borderRadius: 9999,
            color: C.primary,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "10px 16px",
            cursor: "pointer",
          }}
        >
          Voir les offres
        </button>
      </nav>

      {/* ── Main ── */}
      <main style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "96px 24px 48px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Ambient glows */}
        <div style={{
          position: "absolute", top: "-10%", left: "-10%",
          width: "40%", height: "40%", borderRadius: "50%",
          background: "radial-gradient(circle at 50% 50%, rgba(120,134,255,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "-5%", right: "-5%",
          width: "35%", height: "35%", borderRadius: "50%",
          background: "radial-gradient(circle at 50% 50%, rgba(120,134,255,0.15) 0%, transparent 70%)",
          opacity: 0.5, pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 448 }}>
          {/* Glass card */}
          <div style={{
            background: "rgba(30,31,37,0.4)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: `1px solid rgba(69,70,85,0.15)`,
            borderRadius: 16,
            padding: "40px",
            boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
          }}>
            {/* Header */}
            <header style={{ marginBottom: 32, textAlign: "center" }}>
              <h1 style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "3rem",
                fontStyle: "italic",
                color: C.primary,
                lineHeight: 1.1,
                marginBottom: 8,
              }}>{h}</h1>
              <p style={{
                color: C.onSurfaceVariant,
                fontWeight: 300,
                letterSpacing: "0.02em",
                fontSize: "0.875rem",
              }}>{sub}</p>
            </header>

            {(notice || checkingAccess) && (
              <div style={{
                marginBottom: 20,
                padding: "12px 16px",
                borderRadius: 10,
                background: "rgba(189,194,255,0.1)",
                border: "1px solid rgba(189,194,255,0.2)",
                color: C.primary,
                fontSize: "0.85rem",
                lineHeight: 1.5,
              }}>
                {checkingAccess ? "Connexion reussie. Verification de votre abonnement..." : notice}
              </div>
            )}

            {/* Tabs */}
            <div style={{
              display: "flex",
              gap: 4,
              background: C.surfaceContainerHigh,
              borderRadius: 12,
              padding: 4,
              marginBottom: 28,
            }}>
              {[
                { id: "login",  label: "Connexion" },
                { id: "signup", label: "Inscription" },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => sw(t.id)}
                  style={{
                    flex: 1,
                    padding: "8px 4px",
                    border: "none",
                    borderRadius: 9,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: "0.8rem",
                    fontWeight: tab === t.id ? 600 : 400,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    background: tab === t.id ? C.surfaceContainer : "none",
                    color: tab === t.id ? C.primary : C.onSurfaceVariant,
                    boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,0.3)" : "none",
                  }}
                >{t.label}</button>
              ))}
            </div>

            {/* ── Login / Signup fields ── */}
            {(tab === "login" || tab === "signup") && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {tab === "signup" && (
                  <Field label="Prénom" icon="person">
                    <input
                      type="text"
                      placeholder="Ton prénom"
                      value={f.name}
                      onChange={e => upd("name", e.target.value)}
                      onKeyDown={onEnter}
                      style={inputStyle}
                    />
                  </Field>
                )}

                <Field label="Email" icon="mail">
                  <input
                    type="email"
                    placeholder="nom@exemple.com"
                    value={f.email}
                    onChange={e => upd("email", e.target.value)}
                    onKeyDown={onEnter}
                    style={inputStyle}
                  />
                </Field>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <FieldLabel>Mot de passe</FieldLabel>
                    {tab === "login" && (
                      <button style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: "0.625rem", textTransform: "uppercase",
                        letterSpacing: "0.1em", color: `rgba(189,194,255,0.7)`,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }} onClick={handleForgotPassword}>Oublié ?</button>
                    )}
                  </div>
                  <div style={{ position: "relative" }}>
                    <span className="material-symbols-outlined" style={iconStyle}>lock</span>
                    <input
                      type={show ? "text" : "password"}
                      placeholder="••••••••"
                      value={f.password}
                      onChange={e => upd("password", e.target.value)}
                      onKeyDown={onEnter}
                      autoComplete={tab === "signup" ? "new-password" : "current-password"}
                      style={{ ...inputStyle, paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShow(v => !v)}
                      style={{
                        position: "absolute", right: 14, top: "50%",
                        transform: "translateY(-50%)", background: "none",
                        border: "none", cursor: "pointer", padding: 0,
                        color: C.outline, fontSize: "1.1rem",
                      }}
                    >{show ? "🙈" : "👁"}</button>
                  </div>
                </div>

                <button
                  onClick={tab === "login" ? doLogin : doSignup}
                  disabled={load}
                  style={btnPrimaryStyle(load)}
                >
                  {load ? <Loader /> : tab === "login" ? "Se connecter" : "Créer mon espace →"}
                </button>

                <Divider />

                <button
                  onClick={googleLogin}
                  style={btnGoogleStyle}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(40,42,47,0.8)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(26,27,33,0.5)"}
                >
                  <GoogleSVG />
                  <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Continuer avec Google</span>
                </button>
              </div>
            )}


            {/* Message */}
            {msg && (
              <div style={{
                marginTop: 16,
                padding: "12px 16px",
                borderRadius: 10,
                fontSize: "0.85rem",
                background: msg.e ? "rgba(255,180,171,0.1)" : "rgba(189,194,255,0.1)",
                border: `1px solid ${msg.e ? "rgba(255,180,171,0.25)" : "rgba(189,194,255,0.25)"}`,
                color: msg.e ? "#ffb4ab" : C.primary,
                lineHeight: 1.5,
              }}>{msg.t}</div>
            )}

            {/* Security footer */}
            <div style={{
              marginTop: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              color: `rgba(143,143,161,0.4)`,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: "0.875rem" }}>verified_user</span>
              <span style={{ fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.2em" }}>Données confidentielles et sécurisées</span>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
        borderTop: "1px solid rgba(69,70,85,0.15)",
        backgroundColor: C.surface,
        padding: "40px 32px",
      }}>
        <div style={{
          fontFamily: "'Newsreader', serif",
          fontSize: "1.125rem",
          color: C.onBackground,
          fontWeight: 700,
        }}>Noema</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
          {[
            { label: "Privacy Policy", target: "privacy" },
            { label: "Terms of Service", target: "terms" },
            { label: "Ethical AI", target: "ethical-ai" },
            { label: "Contact", target: "contact" },
          ].map(({ label, target }) => (
            <button key={label} onClick={() => onNav?.(target)} style={{
              background: "none",
              border: "none",
              padding: 0,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#454655",
              cursor: "pointer",
              transition: "color 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.color = C.primary}
              onMouseLeave={e => e.currentTarget.style.color = "#454655"}
            >{label}</button>
          ))}
        </div>
        <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#454655" }}>
          © 2024 Noema. Conversation introspective continue.
        </div>
      </footer>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────────

function FieldLabel({ children }) {
  return (
    <span style={{
      fontSize: "0.7rem",
      textTransform: "uppercase",
      letterSpacing: "0.15em",
      color: "rgba(197,197,216,0.8)",
      marginLeft: 4,
      display: "block",
      marginBottom: 6,
    }}>{children}</span>
  );
}

function Field({ label, icon, children }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ position: "relative" }}>
        <span className="material-symbols-outlined" style={iconStyle}>{icon}</span>
        {children}
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1, height: 1, background: "rgba(69,70,85,0.2)" }} />
      <span style={{ fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(143,143,161,0.5)" }}>ou</span>
      <div style={{ flex: 1, height: 1, background: "rgba(69,70,85,0.2)" }} />
    </div>
  );
}

function Loader() {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "currentColor", opacity: 0.8,
          animation: `ldot 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
      <style>{`@keyframes ldot{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}`}</style>
    </span>
  );
}

// ── Shared styles ───────────────────────────────────────────────────────────────

const inputStyle = {
  width: "100%",
  background: "rgba(51,53,58,0.5)",
  border: "none",
  borderRadius: 12,
  padding: "14px 14px 14px 44px",
  color: "#e2e2e9",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: "0.9rem",
  outline: "none",
  boxSizing: "border-box",
  transition: "box-shadow 0.2s",
};

const iconStyle = {
  position: "absolute",
  left: 14,
  top: "50%",
  transform: "translateY(-50%)",
  color: "#8f8fa1",
  fontSize: "1.125rem",
  pointerEvents: "none",
  fontFamily: "'Material Symbols Outlined'",
  fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24",
};

const btnPrimaryStyle = (disabled) => ({
  width: "100%",
  background: disabled
    ? "rgba(189,194,255,0.2)"
    : "linear-gradient(135deg, #bdc2ff 0%, #7886ff 100%)",
  color: disabled ? "rgba(189,194,255,0.4)" : "#00118c",
  border: "none",
  borderRadius: 9999,
  padding: "16px",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontWeight: 600,
  fontSize: "1rem",
  cursor: disabled ? "not-allowed" : "pointer",
  transition: "all 0.2s",
  boxShadow: disabled ? "none" : "0 8px 24px rgba(189,194,255,0.1)",
});

const btnGoogleStyle = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  background: "rgba(26,27,33,0.5)",
  border: "1px solid rgba(69,70,85,0.1)",
  borderRadius: 9999,
  padding: "14px",
  color: "#e2e2e9",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  cursor: "pointer",
  transition: "background 0.2s",
};
