import { useEffect, useState } from "react";

const C = {
  bg: "#111318", surface: "#111318",
  surfaceContainer: "#1e1f25", surfaceContainerHigh: "#282a2f",
  outlineVariant: "#454655", outline: "#8f8fa1",
  onBackground: "#e2e2e9", onSurfaceVariant: "#c5c5d8",
  primary: "#bdc2ff", primaryContainer: "#7886ff", onPrimaryContainer: "#00118c",
  tertiary: "#ffb68a",
};

export default function Contact({ onNav }) {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/.netlify/functions/send-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur inconnue");
      }

      setSent(true);
    } catch (err) {
      setError("L'envoi a échoué. Réessayez ou écrivez directement à noema.app.support@gmail.com");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ backgroundColor: C.bg, color: C.onBackground, fontFamily: "'Figtree', sans-serif", minHeight: "100vh" }}>
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "rgba(17,19,24,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: "1px solid rgba(69,70,85,0.1)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => onNav?.("landing")} style={{ background: "none", border: "none", fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1.5rem", color: C.onBackground, cursor: "pointer", padding: 0 }}>Noema</button>
          <button onClick={() => onNav?.("landing")} style={{ background: "none", border: "1px solid rgba(69,70,85,0.3)", borderRadius: 9999, color: C.onSurfaceVariant, fontFamily: "'Figtree', sans-serif", fontSize: "0.8rem", padding: "8px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>arrow_back</span>
            Retour
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "120px 24px 96px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }}>

          {/* Left — info */}
          <div>
            <p style={{ color: C.primary, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 600, marginBottom: 16 }}>Nous écrire</p>
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "clamp(2.5rem,5vw,3.5rem)", color: C.onBackground, lineHeight: 1.1, margin: "0 0 24px" }}>Contact</h1>
            <p style={{ color: C.onSurfaceVariant, lineHeight: 1.8, fontSize: "1rem", marginBottom: 48 }}>
              Une question, un retour, un bug ? On lit tous les messages et on répond dans les 48h.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(189,194,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ color: C.primary, fontSize: "1.25rem", fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>mail</span>
              </div>
              <div>
                <p style={{ color: C.onSurfaceVariant, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 2px" }}>Email</p>
                <p style={{ color: C.onBackground, fontSize: "0.9rem", margin: 0 }}>noema.app.support@gmail.com</p>
              </div>
            </div>
          </div>

          {/* Right — form */}
          <div style={{ background: "rgba(30,31,37,0.4)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(69,70,85,0.15)", borderRadius: 16, padding: 40 }}>
            {sent ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <span className="material-symbols-outlined" style={{ color: C.primary, fontSize: "3rem", display: "block", marginBottom: 16, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>check_circle</span>
                <h2 style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1.75rem", color: C.onBackground, marginBottom: 12 }}>Message envoyé</h2>
                <p style={{ color: C.onSurfaceVariant, fontSize: "0.9rem", lineHeight: 1.7 }}>On vous répond dans les 48h. Merci.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {[
                  { key: "name", label: "Prénom", type: "text", placeholder: "Votre prénom" },
                  { key: "email", label: "Email", type: "email", placeholder: "nom@exemple.com" },
                  { key: "subject", label: "Sujet", type: "text", placeholder: "De quoi s'agit-il ?" },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key}>
                    <label style={{ display: "block", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(197,197,216,0.7)", marginBottom: 8 }}>{label}</label>
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={form[key]}
                      onChange={e => upd(key, e.target.value)}
                      required
                      style={{ width: "100%", background: "rgba(51,53,58,0.5)", border: "none", borderRadius: 10, padding: "12px 16px", color: C.onBackground, fontFamily: "'Figtree', sans-serif", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ display: "block", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(197,197,216,0.7)", marginBottom: 8 }}>Message</label>
                  <textarea
                    placeholder="Votre message..."
                    value={form.message}
                    onChange={e => upd("message", e.target.value)}
                    required
                    rows={5}
                    style={{ width: "100%", background: "rgba(51,53,58,0.5)", border: "none", borderRadius: 10, padding: "12px 16px", color: C.onBackground, fontFamily: "'Figtree', sans-serif", fontSize: "0.9rem", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                  />
                </div>
                {error && (
                  <p style={{ color: "#ffb68a", fontSize: "0.85rem", margin: 0, textAlign: "center" }}>{error}</p>
                )}
                <button
                  type="submit"
                  disabled={sending}
                  style={{ width: "100%", background: sending ? "rgba(189,194,255,0.3)" : "linear-gradient(135deg, #bdc2ff 0%, #7886ff 100%)", color: C.onPrimaryContainer, border: "none", borderRadius: 9999, padding: "14px", fontFamily: "'Figtree', sans-serif", fontWeight: 700, fontSize: "1rem", cursor: sending ? "not-allowed" : "pointer", transition: "background 0.2s" }}
                >
                  {sending ? "Envoi en cours…" : "Envoyer"}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer onNav={onNav} />
    </div>
  );
}

function Footer({ onNav }) {
  const links = [
    { label: "Privacy Policy", target: "privacy" },
    { label: "Terms of Service", target: "terms" },
    { label: "Ethical AI", target: "ethical-ai" },
    { label: "Contact", target: "contact" },
  ];
  return (
    <footer style={{ borderTop: "1px solid rgba(69,70,85,0.15)", backgroundColor: C.surface, padding: "40px 32px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 24 }}>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1.125rem", color: C.onBackground }}>Noema</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
          {links.map(({ label, target }) => (
            <button key={label} onClick={() => onNav?.(target)} style={{ background: "none", border: "none", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: C.outlineVariant, cursor: "pointer", fontFamily: "'Figtree', sans-serif", transition: "color 0.2s", padding: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = C.primary}
              onMouseLeave={e => e.currentTarget.style.color = C.outlineVariant}
            >{label}</button>
          ))}
        </div>
      </div>
    </footer>
  );
}
