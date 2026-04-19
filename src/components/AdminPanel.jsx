import { useState } from "react";

// ─────────────────────────────────────────────────────────────
// ADMIN PANEL — visible pour les admins Supabase
// ─────────────────────────────────────────────────────────────

const C = {
  bg: "#0c0e13",
  surface: "#1a1b21",
  border: "rgba(189,194,255,0.15)",
  primary: "#bdc2ff",
  outline: "#8f8fa1",
  onSurface: "#e2e2e9",
  onSurfaceVariant: "#c5c5d8",
  error: "#ffb4ab",
  success: "#a8d5a2",
  tertiary: "#ffb68a",
};

// ── Scénarios de simulation ───────────────────────────────────
const SCENARIOS = [
  {
    id: "step1",
    label: "Étape 1 — Exploration",
    icon: "explore",
    color: "#8f8fa1",
    step: 1,
    insights: {
      forces: [],
      blocages: { racine: "", entretien: "", visible: "" },
      contradictions: [],
    },
    ikigai: { aime: "", excelle: "", monde: "", paie: "", mission: "" },
  },
  {
    id: "step2",
    label: "Étape 2 — Forces émergentes",
    icon: "bolt",
    color: "#bdc2ff",
    step: 2,
    insights: {
      forces: ["Intuition analytique", "Résilience cognitive", "Empathie structurée"],
      blocages: { racine: "", entretien: "", visible: "" },
      contradictions: [],
    },
    ikigai: { aime: "Explorer les systèmes complexes", excelle: "", monde: "", paie: "", mission: "" },
  },
  {
    id: "step3",
    label: "Étape 3 — Blocages identifiés",
    icon: "lock_open",
    color: "#ffb4ab",
    step: 3,
    insights: {
      forces: ["Intuition analytique", "Résilience cognitive", "Empathie structurée", "Vision long terme"],
      blocages: {
        racine: "Peur profonde du jugement extérieur",
        entretien: "Perfectionnisme qui paralyse l'action",
        visible: "Procrastination chronique sur les projets ambitieux",
      },
      contradictions: [],
    },
    ikigai: { aime: "Explorer les systèmes complexes", excelle: "Synthétiser des idées abstraites", monde: "", paie: "", mission: "" },
  },
  {
    id: "step4",
    label: "Étape 4 — Contradictions visibles",
    icon: "compare_arrows",
    color: "#ffb68a",
    step: 4,
    insights: {
      forces: ["Intuition analytique", "Résilience cognitive", "Empathie structurée", "Vision long terme", "Leadership naturel"],
      blocages: {
        racine: "Peur profonde du jugement extérieur",
        entretien: "Perfectionnisme qui paralyse l'action",
        visible: "Procrastination chronique sur les projets ambitieux",
      },
      contradictions: [
        "Veut l'autonomie mais cherche la validation constante",
        "Ambition élevée mais évite les risques visibles",
        "Parle de changer mais reproduit les mêmes schémas",
      ],
    },
    ikigai: { aime: "Explorer les systèmes complexes", excelle: "Synthétiser des idées abstraites", monde: "Rendre la complexité accessible", paie: "", mission: "" },
  },
  {
    id: "step5",
    label: "Étape 5 — Ikigai complet",
    icon: "self_improvement",
    color: "#a8d5a2",
    step: 5,
    insights: {
      forces: ["Intuition analytique", "Résilience cognitive", "Empathie structurée", "Vision long terme", "Leadership naturel", "Créativité systémique"],
      blocages: {
        racine: "Peur profonde du jugement extérieur",
        entretien: "Perfectionnisme qui paralyse l'action",
        visible: "Procrastination chronique sur les projets ambitieux",
      },
      contradictions: [
        "Veut l'autonomie mais cherche la validation constante",
        "Ambition élevée mais évite les risques visibles",
        "Parle de changer mais reproduit les mêmes schémas",
        "Se dit prêt à agir mais attend le moment parfait",
      ],
    },
    ikigai: {
      aime: "Explorer les systèmes complexes",
      excelle: "Synthétiser des idées abstraites en solutions concrètes",
      monde: "Rendre la complexité accessible au plus grand nombre",
      paie: "Conseil stratégique et accompagnement en transformation",
      mission: "Simplifier ce qui paraît impossible",
    },
  },
];

// ── Composants internes ───────────────────────────────────────
function Divider({ label }) {
  return (
    <div style={{ padding: "6px 14px 2px", display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: C.outline }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "rgba(69,70,85,0.3)" }} />
    </div>
  );
}

function Row({ icon, label, onClick, color, disabled, sublabel }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", textAlign: "left",
        display: "flex", alignItems: "center", gap: 10,
        padding: "9px 14px", borderRadius: 10,
        background: "none", border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "background 0.15s",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
      onMouseLeave={e => (e.currentTarget.style.background = "none")}
    >
      <span className="material-symbols-outlined" style={{
        fontSize: "0.95rem", color: color || C.primary, flexShrink: 0,
        fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24",
      }}>{icon}</span>
      <div>
        <span style={{ fontSize: "0.78rem", color: C.onSurface, display: "block" }}>{label}</span>
        {sublabel && <span style={{ fontSize: "0.65rem", color: C.outline }}>{sublabel}</span>}
      </div>
    </button>
  );
}

// ── Composant principal ───────────────────────────────────────
export default function AdminPanel({ user, sb, accessState, history, lastGreffierLog, onResetMemory, onForcePhase2, onSimulateLimit, onShowOnboarding, setInsights, setIkigai, setStep, setNavTab }) {
  const [open, setOpen] = useState(false);
  const [showGreffier, setShowGreffier] = useState(false);
  const [showCosts, setShowCosts] = useState(false);
  const [costs, setCosts] = useState(null);
  const [costsLoading, setCostsLoading] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [invites, setInvites] = useState([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const isAdmin = Boolean(accessState?.isAdmin);
  const adminSource = accessState?.adminSource || null;

  if (!user || !isAdmin) return null;

  const msgCount = history ? history.filter(m => m.role === "user").length : 0;

  function flash(msg) {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 2500);
  }

  async function createInvite() {
    if (!sb || !user) { flash("❌ Session admin indisponible"); return; }
    setInviteLoading(true);
    const { data: { session } } = await sb.auth.getSession();
    const token = session?.access_token;
    if (!token) { flash("❌ Token introuvable"); setInviteLoading(false); return; }

    try {
      const res = await fetch("/.netlify/functions/create-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.token) {
        const link = `${window.location.origin}/invite?token=${data.token}`;
        setInvites(prev => [{ token: data.token, link }, ...prev]);
        await navigator.clipboard.writeText(link).catch(() => {});
        flash(`✅ Lien copié : ${data.token}`);
      } else {
        flash(`❌ ${data.error || "Erreur"}`);
      }
    } catch (err) {
      flash(`❌ ${err.message}`);
    }
    setInviteLoading(false);
  }

  async function runAdminAction(action) {
    if (!sb || !user) {
      flash("❌ Session admin indisponible");
      return null;
    }

    const { data: { session } } = await sb.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      flash("❌ Session admin introuvable");
      return null;
    }

    const response = await fetch("/api/admin-tools", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      flash("❌ " + (payload.error || "Action admin impossible"));
      return null;
    }

    return payload;
  }

  async function handleResetMemory() {
    const payload = await runAdminAction("reset-memory");
    if (!payload) return;
    onResetMemory?.();
    flash("✓ Mémoire réinitialisée");
  }

  function handleSimulateLimit() {
    onSimulateLimit?.();
    flash("✓ Limite simulée");
    setOpen(false);
  }

  function handleForcePhase2() {
    onForcePhase2?.();
    flash("✓ Phase 2 forcée");
  }

  function handleScenario(scenario) {
    setInsights?.(scenario.insights);
    setIkigai?.(scenario.ikigai);
    setStep?.(scenario.step);
    setActiveScenario(scenario.id);
    setNavTab?.("mapping");
    flash(`✓ ${scenario.label}`);
  }

  async function handleShowCosts() {
    setShowCosts(c => !c);
    if (costs) return; // already loaded
    setCostsLoading(true);
    const payload = await runAdminAction("get-costs");
    if (!payload) {
      setCostsLoading(false);
      return;
    }
    setCosts({ rows: payload.rows || [], total: payload.total || 0 });
    setCostsLoading(false);
  }

  function handleResetScenario() {
    setInsights?.({ forces: [], blocages: { racine: "", entretien: "", visible: "" }, contradictions: [] });
    setIkigai?.({ aime: "", excelle: "", monde: "", paie: "", mission: "" });
    setStep?.(0);
    setActiveScenario(null);
    flash("✓ Mapping réinitialisé");
  }

  return (
    <>
      {/* Badge */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 200,
          padding: "3px 10px", borderRadius: 9999,
          background: open ? "rgba(189,194,255,0.2)" : "rgba(189,194,255,0.08)",
          border: "1px solid rgba(189,194,255,0.2)",
          color: C.primary, fontSize: "0.6rem", fontWeight: 700,
          letterSpacing: "0.12em", textTransform: "uppercase",
          cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
          transition: "background 0.2s",
        }}
      >Admin{activeScenario ? ` · ${SCENARIOS.find(s => s.id === activeScenario)?.label.split("—")[0].trim()}` : ""}</button>

      {/* Panel */}
      {open && (
        <div style={{
          position: "fixed", top: 48, left: "50%", transform: "translateX(-50%)", zIndex: 199,
          width: 300,
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          boxShadow: "0 24px 48px rgba(0,0,0,0.6)",
          overflow: "hidden",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          maxHeight: "80vh",
          overflowY: "auto",
        }}>

          {/* Header */}
          <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid rgba(69,70,85,0.3)`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: C.primary, margin: 0 }}>Panneau Admin</p>
              <p style={{ fontSize: "0.65rem", color: C.outline, margin: "3px 0 0" }}>{user.email}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Dashboard link */}
              <button
                onClick={() => {
                  window.history.pushState({}, "", "/admin");
                  window.dispatchEvent(new PopStateEvent("popstate"));
                  setOpen(false);
                }}
                title="Ouvrir le Dashboard Admin"
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "4px 10px", borderRadius: 9999,
                  background: "rgba(189,194,255,0.12)", border: "1px solid rgba(189,194,255,0.25)",
                  color: C.primary, cursor: "pointer", fontSize: "0.65rem", fontWeight: 700,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  textTransform: "uppercase", letterSpacing: "0.1em",
                }}
              >
                Dashboard
                <span className="material-symbols-outlined" style={{ fontSize: "0.7rem", fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
                  open_in_new
                </span>
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 9999, background: "rgba(189,194,255,0.06)", border: "1px solid rgba(69,70,85,0.3)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "0.75rem", color: C.outline, fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>tag</span>
                <span style={{ fontSize: "0.7rem", color: C.onSurface, fontWeight: 600 }}>{msgCount}</span>
                <span style={{ fontSize: "0.65rem", color: C.outline }}>/25</span>
              </div>
            </div>
          </div>

          {/* ── Simulation Mapping ── */}
          <Divider label="Simuler une phase — Mapping" />
          <div style={{ padding: "4px 4px" }}>
            {SCENARIOS.map(s => (
              <Row
                key={s.id}
                icon={s.icon}
                label={s.label}
                sublabel={s.step === 5 ? "Ikigai complet · Forces · Blocages · Contradictions" : undefined}
                color={activeScenario === s.id ? C.success : s.color}
                onClick={() => handleScenario(s)}
              />
            ))}
            <Row icon="refresh" label="Réinitialiser le Mapping" color={C.outline} onClick={handleResetScenario} />
          </div>

          {/* ── Actions session ── */}
          <Divider label="Session" />
          <div style={{ padding: "4px 4px" }}>
            <Row icon="data_object"   label="Logs dernier appel Greffier"     color={C.primary}  onClick={() => setShowGreffier(g => !g)} />
            <Row icon="paid"          label={costsLoading ? "Chargement…" : "Coûts API totaux"} color={C.tertiary} onClick={handleShowCosts} disabled={costsLoading} />
            <Row icon="speed"         label="Simuler limite 25 messages"      color={C.tertiary} onClick={handleSimulateLimit} />
            <Row icon="bolt"          label="Forcer basculement Phase 2"      color={C.success}  onClick={handleForcePhase2} />
          </div>

          {/* Costs breakdown */}
          {showCosts && costs && (
            <div style={{ borderTop: `1px solid rgba(69,70,85,0.3)`, padding: "12px 14px" }}>
              <p style={{ fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: C.outline, marginBottom: 8 }}>Coûts API cumulés</p>
              {costs.rows.map(r => (
                <div key={r.model} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                    <span style={{ fontSize: "0.68rem", color: C.onSurface, fontWeight: 600 }}>{r.model.replace("claude-", "").replace("-20251001", "")}</span>
                    <span style={{ fontSize: "0.72rem", color: C.tertiary, fontWeight: 700 }}>${r.cost.toFixed(4)}</span>
                  </div>
                  <span style={{ fontSize: "0.6rem", color: C.outline }}>
                    {r.calls} appels · {(r.input / 1000).toFixed(1)}k in · {(r.output / 1000).toFixed(1)}k out
                  </span>
                </div>
              ))}
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(69,70,85,0.3)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.65rem", color: C.outline, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Total</span>
                <span style={{ fontSize: "0.8rem", color: C.primary, fontWeight: 700 }}>${costs.total.toFixed(4)}</span>
              </div>
            </div>
          )}

          {/* ── Liens d'invitation ── */}
          <Divider label="Liens d'invitation beta" />
          <div style={{ padding: "4px 4px 8px" }}>
            <Row
              icon="link"
              label={inviteLoading ? "Génération…" : "Créer un lien d'invitation"}
              color={C.tertiary}
              onClick={createInvite}
            />
            {invites.length > 0 && (
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                {invites.map(inv => (
                  <div key={inv.token} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: "0.72rem", color: C.primary, fontFamily: "monospace", letterSpacing: "0.08em" }}>{inv.token}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(inv.link).then(() => flash("✅ Lien copié !"))}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.7rem", color: C.onSurfaceVariant, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      Copier
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Onboarding ── */}
          <Divider label="Onboarding" />
          <div style={{ padding: "4px 4px" }}>
            <Row icon="auto_awesome" label="Afficher l'onboarding" color={C.primary} onClick={() => { onShowOnboarding?.(); setOpen(false); }} />
          </div>

          {/* ── Mémoire ── */}
          <Divider label="Mémoire Supabase" />
          <div style={{ padding: "4px 4px 8px" }}>
            <Row icon="restart_alt" label="Réinitialiser ma mémoire" color={C.error} onClick={handleResetMemory} />
          </div>

          {/* Greffier JSON */}
          {showGreffier && (
            <div style={{ borderTop: `1px solid rgba(69,70,85,0.3)`, padding: "12px 14px" }}>
              <p style={{ fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: C.outline, marginBottom: 8 }}>Dernier log Greffier</p>
              {lastGreffierLog ? (
                <pre style={{ fontSize: "0.65rem", color: C.onSurfaceVariant, lineHeight: 1.5, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all", background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 10 }}>
                  {JSON.stringify(lastGreffierLog, null, 2)}
                </pre>
              ) : (
                <p style={{ fontSize: "0.75rem", color: C.outline, fontStyle: "italic", margin: 0 }}>Aucun log — envoie un message d'abord.</p>
              )}
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div style={{ padding: "8px 14px", borderTop: `1px solid rgba(69,70,85,0.2)` }}>
              <p style={{ fontSize: "0.75rem", color: feedback.startsWith("❌") ? C.error : C.success, margin: 0 }}>{feedback}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
