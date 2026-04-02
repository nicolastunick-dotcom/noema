import { useRef, useEffect } from "react";
import DOMPurify from "dompurify";
import { fmt } from "../utils/helpers";
import NoemaOrb from "../components/NoemaOrb";

// ─────────────────────────────────────────────────────────────
// CHAT PAGE — Design Stitch, logique passée en props par AppShell
// Props : msgs, typing, input, setInput, send, genIkigai,
//         onNav, newSession, user, sb, taRef
// ─────────────────────────────────────────────────────────────

const C = {
  bg: "#111318",
  surface: "#111318",
  surfaceContainer: "#1e1f25",
  surfaceContainerHigh: "#282a2f",
  surfaceContainerHighest: "#33353a",
  surfaceContainerLow: "#1a1b21",
  surfaceContainerLowest: "#0c0e13",
  outlineVariant: "#454655",
  outline: "#8f8fa1",
  onBackground: "#e2e2e9",
  onSurface: "#e2e2e9",
  onSurfaceVariant: "#c5c5d8",
  primary: "#bdc2ff",
  primaryContainer: "#7886ff",
};

const TODAY = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

const DEFAULT_PROMPTS = [
  "Je me sens bloque sans savoir pourquoi",
  "J'ai du mal a prendre une decision importante",
  "Je veux mieux comprendre ce que je veux vraiment",
];

export default function ChatPage({ msgs, typing, input, setInput, send, genIkigai, onNav, newSession, user, sb, taRef, continuity }) {
  const msgsRef = useRef(null);
  const continuityMode = continuity?.mode || "welcome";
  const continuityPrompts = continuityMode === "resume" && continuity?.prompt
    ? [`Reprenons: ${continuity.prompt}`, ...DEFAULT_PROMPTS.slice(1)]
    : continuityMode === "restart"
      ? [
          "Je veux repartir sur ce qui compte aujourd'hui",
          "J'ai besoin d'y voir plus clair sur une decision",
          DEFAULT_PROMPTS[2],
        ]
      : DEFAULT_PROMPTS;

  // Scroll to bottom on new messages
  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [msgs, typing]);

  const handleInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div style={{
      backgroundColor: C.bg,
      height: "100vh",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      color: C.onSurface,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* ── Ambient Blobs ── */}
      <div style={{ position: "fixed", width: 500, height: 500, borderRadius: "50%", background: "#7886ff", filter: "blur(100px)", opacity: 0.15, top: -100, right: -100, zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "fixed", width: 400, height: 400, borderRadius: "50%", background: "#ffb68a", filter: "blur(100px)", opacity: 0.10, bottom: "15%", left: -50, zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "fixed", width: 600, height: 600, borderRadius: "50%", background: "#3a4bdf", filter: "blur(100px)", opacity: 0.08, top: "30%", right: -150, zIndex: 0, pointerEvents: "none" }} />

      {/* ── Top Header ── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0,
        background: "rgba(17,19,24,0.8)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(69,70,85,0.05)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px",
        zIndex: 50,
      }}>
        <button
          onClick={() => onNav("landing")}
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: "1.5rem",
            color: C.primary,
            letterSpacing: "-0.02em",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >Noema</button>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={newSession}
            style={{
              background: "none", border: "none",
              color: C.outline, cursor: "pointer",
              fontSize: "0.75rem",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              padding: "6px 12px",
              borderRadius: 9999,
              transition: "color 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = C.primary}
            onMouseLeave={e => e.currentTarget.style.color = C.outline}
          >Nouvelle session</button>
          {sb && (
            <button
              onClick={() => { sessionStorage.removeItem("noema_invite"); sb.auth.signOut(); }}
              style={{
                background: "none", border: "none",
                color: C.outline, cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "0.75rem",
                padding: "6px 12px",
                borderRadius: 9999,
                transition: "color 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.color = C.primary}
              onMouseLeave={e => e.currentTarget.style.color = C.outline}
            >Déconnexion</button>
          )}
        </div>
      </header>

      {/* ── Messages Area ── */}
      <main
        ref={msgsRef}
        style={{
          position: "absolute",
          top: 64,
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <div style={{
          maxWidth: 768,
          margin: "0 auto",
          padding: "24px 24px 170px",
          display: "flex",
          flexDirection: "column",
          gap: 32,
        }}>
        {/* Date anchor */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <span style={{
            fontSize: "0.625rem",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: C.outline,
            padding: "4px 16px",
            borderRadius: 9999,
            background: "rgba(26,27,33,0.5)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(69,70,85,0.1)",
          }}>{TODAY}</span>
        </div>

        {continuityMode !== "welcome" && (
          <div style={{
            alignSelf: "stretch",
            padding: "16px 18px",
            borderRadius: 18,
            background: "rgba(30,31,37,0.72)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            border: "1px solid rgba(189,194,255,0.12)",
            boxShadow: "0 16px 36px rgba(0,0,0,0.18)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{
                fontSize: "0.6rem",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: C.primary,
                fontWeight: 700,
              }}>
                {continuity.title}
              </span>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(189,194,255,0.45)" }} />
              <span style={{ fontSize: "0.65rem", color: C.outline, letterSpacing: "0.05em" }}>
                Continuite visible
              </span>
            </div>
            {continuity.detail && (
              <p style={{
                margin: 0,
                fontSize: "0.86rem",
                lineHeight: 1.65,
                color: C.onSurface,
              }}>
                {continuity.detail}
              </p>
            )}
            {continuity.meta && (
              <p style={{
                margin: "8px 0 0",
                fontSize: "0.74rem",
                lineHeight: 1.6,
                color: C.onSurfaceVariant,
              }}>
                {continuity.meta}
              </p>
            )}
          </div>
        )}

        {/* Welcome state */}
        {msgs.length === 0 && !typing && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 20, padding: "48px 0", textAlign: "center" }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: "rgba(120,134,255,0.1)",
              border: "1px solid rgba(189,194,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.25rem", color: C.primary,
              fontFamily: "'Instrument Serif', serif", fontStyle: "italic",
            }}>N</div>
            <div>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1.75rem", color: C.onSurface, marginBottom: 8 }}>
                {continuityMode === "resume" ? "On reprend." : continuityMode === "restart" ? "On repart." : "Bonjour."}
              </h2>
              <p style={{ color: C.onSurfaceVariant, fontSize: "0.875rem", maxWidth: 420 }}>
                {continuityMode === "resume"
                  ? "Le fil precedent reste visible. Repars d'ou tu t'etais arrete ou ouvre ce qui revient maintenant."
                  : continuityMode === "restart"
                    ? "Un nouveau fil commence ici. Garde seulement ce qui est vivant aujourd'hui."
                    : "Dis-moi ce qui t'occupe l'esprit."}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 360 }}>
              {continuityPrompts.map((p) => (
                <button key={p} onClick={() => send(p)} style={{
                  padding: "12px 16px",
                  background: "rgba(30,31,37,0.6)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 12,
                  color: C.onSurfaceVariant,
                  fontSize: "0.8rem",
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  transition: "all 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(189,194,255,0.2)"; e.currentTarget.style.color = C.onSurface; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = C.onSurfaceVariant; }}
                >{p}</button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: "85%", alignSelf: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.role === "noema" ? (
              <div style={{
                background: "rgba(30,31,37,0.6)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.05)",
                padding: "24px",
                borderRadius: "24px 24px 24px 4px",
                position: "relative",
                overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: -40, left: -40, width: 128, height: 128, background: "rgba(120,134,255,0.08)", filter: "blur(40px)", borderRadius: "50%", pointerEvents: "none" }} />
                <div
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontStyle: "italic",
                    fontSize: m.isErr ? "0.9rem" : "1.2rem",
                    lineHeight: 1.65,
                    color: m.isErr ? "#ffb4ab" : C.onSurfaceVariant,
                    position: "relative",
                  }}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(fmt(m.text)) }}
                />
                {m.hasUpdate && (
                  <div style={{
                    marginTop: 16,
                    padding: "10px 14px",
                    background: "rgba(120,134,255,0.08)",
                    border: "1px solid rgba(189,194,255,0.15)",
                    borderRadius: 10,
                    fontSize: "0.75rem",
                    color: C.primary,
                  }}>✦ Mapping mis à jour</div>
                )}
              </div>
            ) : (
              <div style={{
                background: "rgba(51,53,58,0.6)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(69,70,85,0.1)",
                padding: "16px 20px",
                borderRadius: "24px 24px 4px 24px",
              }}>
                <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: C.onSurface }}>{m.text}</p>
              </div>
            )}
            <span style={{
              fontSize: "0.625rem",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: C.outline,
              fontWeight: 500,
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              marginLeft: m.role === "noema" ? 8 : 0,
              marginRight: m.role === "user" ? 8 : 0,
            }}>
              {m.role === "noema" ? "NOEMA" : "VOUS"} • {m.time}
            </span>
          </div>
        ))}

        {/* Typing indicator pendant l'attente de la réponse complète */}
        {typing && (
          <div style={{ alignSelf: "flex-start", padding: "4px 0 4px 4px" }}>
            <NoemaOrb size={50} showText={false} />
          </div>
        )}
        </div>
      </main>

      {/* ── Bottom Input Shell ── */}
      <div style={{
        position: "fixed",
        bottom: 72, // above the bottom nav
        left: 0, right: 0,
        zIndex: 40,
        background: "linear-gradient(to top, #111318 60%, transparent)",
        paddingTop: 48,
        paddingBottom: 12,
      }}>
        <div style={{ maxWidth: 768, margin: "0 auto", padding: "0 24px" }}>
          {/* Input box */}
          <div style={{ position: "relative" }}>
            <div style={{
              background: "rgba(51,53,58,0.8)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderRadius: 16,
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
              padding: 8,
              border: "1px solid rgba(255,255,255,0.05)",
              boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
            }}>
              <textarea
                ref={taRef}
                rows={1}
                placeholder="Partagez vos pensées…"
                value={input}
                disabled={typing}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                maxLength={2000}
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  color: C.onSurface,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "0.875rem",
                  fontWeight: 300,
                  lineHeight: 1.6,
                  padding: "8px 8px 8px 12px",
                  maxHeight: 120,
                  overflowY: "auto",
                }}
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || typing}
                style={{
                  width: 40, height: 40, flexShrink: 0,
                  borderRadius: 10,
                  background: input.trim() && !typing
                    ? "linear-gradient(135deg, #bdc2ff 0%, #7886ff 100%)"
                    : "rgba(69,70,85,0.3)",
                  border: "none",
                  cursor: input.trim() && !typing ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                  transform: "scale(1)",
                }}
                onMouseEnter={e => input.trim() && !typing && (e.currentTarget.style.transform = "scale(0.95)")}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              >
                <span className="material-symbols-outlined" style={{
                  fontSize: "1.125rem",
                  color: input.trim() && !typing ? "#00118c" : C.outline,
                  fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                }}>arrow_upward</span>
              </button>
            </div>
          </div>
          <p style={{
            margin: "10px 4px 0",
            fontSize: "0.68rem",
            lineHeight: 1.5,
            color: C.outline,
            textAlign: "center",
            letterSpacing: "0.03em",
          }}>
            Cadre du moment: 25 messages par jour. La continuite reste visible d'une session a l'autre.
          </p>
        </div>
      </div>
    </div>
  );
}
