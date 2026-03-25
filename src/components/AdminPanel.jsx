import { useState } from "react";

// ─────────────────────────────────────────────────────────────
// ADMIN PANEL — visible uniquement pour nicolas.tunick278@gmail.com
// ─────────────────────────────────────────────────────────────

export const ADMIN_EMAIL = "nicolas.tunick278@gmail.com";

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
// Tarifs Anthropic ($/M tokens)
const PRICING = {
  'claude-sonnet-4-6':       { input: 3.00,  output: 15.00 },
  'claude-haiku-4-5-20251001': { input: 0.80,  output: 4.00  },
}

function calcCost(model, inputTokens, outputTokens) {
  const p = PRICING[model] || { input: 3.00, output: 15.00 }
  return (inputTokens / 1_000_000) * p.input + (outputTokens / 1_000_000) * p.output
}

export default function AdminPanel({ user, sb, history, msgs, setMsgs, lastGreffierLog, onResetMemory, onForcePhase2, onSimulateLimit, setInsights, setIkigai, setStep, setNavTab }) {
  const [open, setOpen] = useState(false);
  const [showGreffier, setShowGreffier] = useState(false);
  const [showCosts, setShowCosts] = useState(false);
  const [costs, setCosts] = useState(null);
  const [costsLoading, setCostsLoading] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);
  const [feedback, setFeedback] = useState("");

  if (!user || user.email !== ADMIN_EMAIL) return null;

  const msgCount = history ? history.filter(m => m.role === "user").length : 0;

  function flash(msg) {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 2500);
  }

  async function handleResetMemory() {
    if (!sb || !user) return flash("❌ Supabase non disponible");
    const { error } = await sb.from("memory").delete().eq("user_id", user.id);
    if (error) flash("❌ " + error.message);
    else { onResetMemory?.(); flash("✓ Mémoire réinitialisée"); }
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
    if (!sb || !user) return flash("❌ Supabase non disponible");
    setShowCosts(c => !c);
    if (costs) return; // already loaded
    setCostsLoading(true);
    const { data, error } = await sb
      .from("api_usage")
      .select("model, prompt_tokens, completion_tokens")
      .eq("user_id", user.id);
    if (error) { flash("❌ " + error.message); setCostsLoading(false); return; }
    // Group by model
    const grouped = {};
    for (const row of data || []) {
      if (!grouped[row.model]) grouped[row.model] = { input: 0, output: 0, calls: 0 };
      grouped[row.model].input  += row.prompt_tokens     || 0;
      grouped[row.model].output += row.completion_tokens || 0;
      grouped[row.model].calls  += 1;
    }
    const rows = Object.entries(grouped).map(([model, t]) => ({
      model,
      input: t.input,
      output: t.output,
      calls: t.calls,
      cost: calcCost(model, t.input, t.output),
    }));
    const total = rows.reduce((s, r) => s + r.cost, 0);
    setCosts({ rows, total });
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
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 9999, background: "rgba(189,194,255,0.06)", border: "1px solid rgba(69,70,85,0.3)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "0.75rem", color: C.outline, fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>tag</span>
              <span style={{ fontSize: "0.7rem", color: C.onSurface, fontWeight: 600 }}>{msgCount}</span>
              <span style={{ fontSize: "0.65rem", color: C.outline }}>/25</span>
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
