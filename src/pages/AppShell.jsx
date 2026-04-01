import { useState, useEffect, useRef, useCallback } from "react";
import { sb, buildMemoryContext, buildSystemPrompt } from "../lib/supabase";
import { ANTHROPIC_PROXY } from "../constants/config";
import { QUOTES } from "../constants/prompt";
import { applyTheme, mapEtat } from "../constants/themes";
import { getTime, fmt, parseUI, stripUI, trimHistory } from "../utils/helpers";
import StateBadge    from "../components/StateBadge";
import InsightsPane  from "../components/InsightsPane";
import ProgressPane  from "../components/ProgressPane";
import IkigaiPane    from "../components/IkigaiPane";
import { SendSVG }   from "../components/SVGs";
import ChatPage      from "./ChatPage";
import MappingPage   from "./MappingPage";
import JournalPage   from "./JournalPage";
import TodayPage     from "./TodayPage";
import AdminPanel    from "../components/AdminPanel";

// ─────────────────────────────────────────────────────────────
// APP SHELL — Composant principal : chat + panneaux latéraux
// Sections :
//   1. STATE & REFS
//   2. OPENING MESSAGE
//   3. EFFECTS (mémoire, thème, scroll)
//   4. API (callAPI)
//   5. UI HANDLER (applyUI)
//   6. RATE LIMIT (checkRateLimit)
//   7. SEND
//   8. SAVE SESSION
//   9. ACTIONS (reset, newSession, genIkigai)
//  10. RENDER
// ─────────────────────────────────────────────────────────────
export default function AppShell({ onNav, user, initialTab = "chat", onTabChange, accessState = null }) {
  // ── 1. STATE & REFS ──────────────────────────────────────────
  const [msgs,     setMsgs]     = useState([]);
  const [input,    setInput]    = useState("");
  const [typing,   setTyping]   = useState(false);
  const [mstate,   setMstate]   = useState("exploring");
  const [step,     setStep]     = useState(0);
  const [sideTab,  setSideTab]  = useState("insights");
  const [mobTab,   setMobTab]   = useState("chat");
  const [navTab,   setNavTab]   = useState("chat");
  const [insights, setInsights] = useState({forces:[],blocages:{racine:"",entretien:"",visible:""},contradictions:[]});
  const [ikigai,   setIkigai]   = useState({aime:"",excelle:"",monde:"",paie:"",mission:""});
  const [mode,     setMode]     = useState("accueil");

  const history         = useRef([]);
  const lastSessionNote = useRef("");
  const memoryRef       = useRef(null); // toujours à jour même dans les closures async
  const msgsRef         = useRef(null);
  const taRef           = useRef(null);
  const minuteTimestamps = useRef([]);  // rate limiting local (par minute)
  const hasOpened       = useRef(false);
  const lastGreffierLog = useRef(null); // admin: dernier log Greffier
  const [greffierLogTick, setGreffierLogTick] = useState(0); // force re-render quand log maj

  // Refs miroirs pour les valeurs d'état — toujours à jour dans les closures async/événements
  const insightsRef = useRef(insights);
  const ikigaiRef   = useRef(ikigai);
  const stepRef     = useRef(step);

  useEffect(() => {
    setNavTab(initialTab || "chat");
  }, [initialTab]);

  // ── 2. OPENING MESSAGE ───────────────────────────────────────
  async function openingMessage() {
    if (hasOpened.current) return;
    hasOpened.current = true;
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    const trigger = `[SYSTÈME — ne pas afficher] Démarre la session. Ouvre avec cette citation de ${q.author} : "${q.text}" — intègre-la naturellement dans ton message d'accueil en créant un lien personnel avec l'utilisateur. Pose ensuite une première question ouverte pour commencer l'exploration.`;
    history.current.push({ role: "user", content: trigger });
    setTyping(true);
    try {
      const raw = await callAPI();
      const ui    = parseUI(raw);
      const clean = stripUI(raw);
      applyUI(ui);
      setMsgs([{ role: "noema", text: clean, time: getTime() }]);
      history.current.push({ role: "assistant", content: raw });
    } catch (e) {
      console.error("[Noema] Erreur message d'ouverture:", e);
      history.current = [];
      setMsgs([]);
      // Ne pas réinitialiser hasOpened — évite la boucle de retry sur HMR / surcharge API
    }
    setTyping(false);
  }

  // ── 3. EFFECTS ───────────────────────────────────────────────
  useEffect(() => {
    if (!sb || !user) return;
    // Sprint 1.1 : ne pas ouvrir le chat avant que l'entitlement soit résolu.
    // accessState.loading reste true pendant que useSubscriptionAccess vérifie admin/sub/invite.
    // Pour les comptes invités sessionStorage, il reste true jusqu'à la fin du linkage invites.user_id.
    // Cela garantit que claude.js trouve l'entitlement et ne retourne pas un faux 403.
    if (accessState?.loading) return;
    (async () => {
      const { data: mem, error: memErr } = await sb.from("memory").select("*").eq("user_id", user.id).maybeSingle();
      if (memErr) console.error("[Noema] Erreur chargement memory:", memErr);
      if (mem) memoryRef.current = mem;

      const { data: sessions, error: sessErr } = await sb.from("sessions")
        .select("insights,ikigai,step")
        .eq("user_id", user.id)
        .order("ended_at", { ascending: false })
        .limit(1);
      if (sessErr) console.error("[Noema] Erreur chargement sessions:", sessErr);
      const last = sessions?.[0];
      if (last) {
        if (last.insights) setInsights(i => ({ ...i, ...last.insights }));
        if (last.ikigai)   setIkigai(k => ({ ...k, ...last.ikigai }));
        if (typeof last.step === "number") setStep(last.step);
      }
      await openingMessage();
    })();
  }, [user, accessState?.loading]);

  useEffect(() => {
    if (user) return;
    openingMessage();
  }, []);

  // Sync des refs miroirs à chaque changement d'état
  useEffect(() => { insightsRef.current = insights; }, [insights]);
  useEffect(() => { ikigaiRef.current   = ikigai;   }, [ikigai]);
  useEffect(() => { stepRef.current     = step;     }, [step]);

  useEffect(() => { applyTheme(mstate); }, [mstate]);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    });
  }, [msgs, typing]);

  // ── Sauvegarde automatique ────────────────────────────────────
  // beforeunload : sauvegarde quand l'utilisateur ferme ou recharge
  // setInterval  : sauvegarde silencieuse toutes les 5 minutes
  useEffect(() => {
    const doSave = () =>
      saveSession(insightsRef.current, ikigaiRef.current, stepRef.current);

    window.addEventListener("beforeunload", doSave);
    const timer = setInterval(doSave, 5 * 60 * 1000);

    return () => {
      window.removeEventListener("beforeunload", doSave);
      clearInterval(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 4. API ───────────────────────────────────────────────────
  async function callAPI() {
    const h = trimHistory(history.current);
    const memory_context = buildMemoryContext(memoryRef.current);
    const headers = { "Content-Type":"application/json" };
    if (sb) {
      // En production : envoyer le JWT Supabase pour vérification côté serveur
      const { data: { session } } = await sb.auth.getSession();
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
    }
    const bodyPayload = { model:"claude-sonnet-4-6", max_tokens:1100, memory_context, messages:h };
    const res = await fetch(ANTHROPIC_PROXY, {
      method:"POST", headers,
      body: JSON.stringify(bodyPayload),
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(payload?.error?.message || `HTTP ${res.status}`);
    }
    if (payload?._greffier) {
      lastGreffierLog.current = payload._greffier;
      setGreffierLogTick(t => t + 1);
    }
    return typeof payload?.content === "string" ? payload.content : "";
  }

  // ── 5. UI HANDLER ────────────────────────────────────────────
  function applyUI(ui) {
    if (!ui) return;
    if (ui.session_note) lastSessionNote.current = ui.session_note;
    if (ui.etat) setMstate(mapEtat(ui.etat));
    if (ui.mode) setMode(ui.mode);
    if (typeof ui.step === "number") setStep(s => Math.max(s, ui.step));

    if (ui.forces?.length || ui.contradictions?.length) {
      setInsights(p => ({
        forces: ui.forces?.length ? [...new Set([...p.forces, ...ui.forces])].slice(0, 6) : p.forces,
        blocages: ui.blocages || p.blocages,
        contradictions: ui.contradictions?.length ? [...new Set([...p.contradictions, ...ui.contradictions])].slice(0, 4) : p.contradictions,
      }));
    }
    if (ui.blocages) {
      setInsights(p => ({
        ...p,
        blocages: {
          racine:    ui.blocages.racine    || p.blocages.racine,
          entretien: ui.blocages.entretien || p.blocages.entretien,
          visible:   ui.blocages.visible   || p.blocages.visible,
        }
      }));
    }
    if (ui.ikigai) {
      setIkigai(p => ({
        aime:    ui.ikigai.aime    || p.aime,
        excelle: ui.ikigai.excelle || p.excelle,
        monde:   ui.ikigai.monde   || p.monde,
        paie:    ui.ikigai.paie    || p.paie,
        mission: ui.ikigai.mission || p.mission,
      }));
    }
  }

  // ── 6. RATE LIMIT ────────────────────────────────────────────
  // Sprint 1 : le frontend ne lit/écrit plus rate_limits en Supabase.
  // Le quota produit (25/jour) est appliqué uniquement par claude.js côté backend.
  // Ce garde-fou local (30/minute) protège seulement contre le spam réseau immédiat.
  function checkRateLimit() {
    const now = Date.now();
    minuteTimestamps.current = minuteTimestamps.current.filter(t => now - t < 60_000);
    if (minuteTimestamps.current.length >= 30) {
      return "Tu envoies trop de messages. Attends une minute avant de continuer.";
    }
    minuteTimestamps.current.push(now);
    return null;
  }

  // ── 7. SEND ──────────────────────────────────────────────────
  const send = useCallback(async (text) => {
    const t = text.replace(/<[^>]*>/g, "").trim().slice(0, 2000);
    if (!t || typing) return;
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";

    const rateLimitMsg = checkRateLimit();
    if (rateLimitMsg) {
      setMsgs(m => [...m, {role:"noema", text:rateLimitMsg, time:getTime(), isErr:true}]);
      return;
    }

    setMsgs(m => [...m, {role:"user", text:t, time:getTime()}]);
    history.current.push({role:"user", content:t});
    setTyping(true);

    const streamTime = getTime();

    try {
      const raw = await callAPI();
      const ui    = parseUI(raw);
      const clean = stripUI(raw);
      applyUI(ui);
      const hasUpdate = ui && (
        (ui.forces?.length > 0) || (ui.ikigai && Object.values(ui.ikigai).some(v => v)) ||
        (ui.contradictions?.length > 0) || (ui.blocages?.racine)
      );
      setMsgs(m => [...m, {role:"noema", text:clean, time:streamTime, hasUpdate}]);
      history.current.push({role:"assistant", content:raw});
    } catch(e) {
      setMsgs(m => [...m, {role:"noema", text:"Une erreur est survenue. Réessaie dans un instant.", time:streamTime, isErr:true}]);
      console.error(e);
    }
    setTyping(false);
  }, [typing]);

  // ── 8. SAVE SESSION ──────────────────────────────────────────
  async function saveSession(currentInsights, currentIkigai, currentStep) {
    if (!sb || !user) return;
    if (history.current.length === 0) return;

    const sessionData = {
      user_id:      user.id,
      ended_at:     new Date().toISOString(),
      history:      history.current,
      insights:     currentInsights,
      ikigai:       currentIkigai,
      step:         currentStep,
      session_note: lastSessionNote.current,
    };
    const { error: insErr } = await sb.from("sessions").insert(sessionData);
    if (insErr) { console.error("[Noema] Erreur insert session:", insErr); return; }

    const { data: mem, error: memErr } = await sb.from("memory").select("*").eq("user_id", user.id).maybeSingle();
    if (memErr) console.error("[Noema] Erreur lecture memory:", memErr);
    const notes = [...(mem?.session_notes || []), lastSessionNote.current].filter(Boolean).slice(-10);
    const newMemory = {
      user_id:        user.id,
      updated_at:     new Date().toISOString(),
      forces:         [...new Set([...(mem?.forces || []), ...currentInsights.forces])],
      contradictions: [...new Set([...(mem?.contradictions || []), ...currentInsights.contradictions])],
      blocages:       { ...(mem?.blocages || {}), ...currentInsights.blocages },
      ikigai:         { ...(mem?.ikigai || {}), ...currentIkigai },
      session_notes:  notes,
      session_count:  (mem?.session_count || 0) + 1,
    };
    const { error: upsErr } = await sb.from("memory").upsert(newMemory, { onConflict: "user_id" });
    if (upsErr) console.error("[Noema] Erreur upsert memory:", upsErr);
    else memoryRef.current = newMemory;
    lastSessionNote.current = "";
  }

  // ── 9. ACTIONS ───────────────────────────────────────────────
  function reset() {
    history.current = [];
    setMsgs([]); setStep(0); setMstate("exploring"); setMode("accueil");
    setInsights({forces:[], blocages:{racine:"",entretien:"",visible:""}, contradictions:[]});
    setIkigai({aime:"", excelle:"", monde:"", paie:"", mission:""});
    setMobTab("chat");
  }

  async function newSession() { await saveSession(insights, ikigai, step); reset(); }
  function genIkigai() { send("Je veux voir mon Ikigai"); }

  // ── 10. ADMIN ────────────────────────────────────────────────
  function adminResetMemory() {
    memoryRef.current = null;
    lastSessionNote.current = "";
  }
  function adminForcePhase2() {
    setMstate("clarity");
    setStep(s => Math.max(s, 4));
  }
  function adminSimulateLimit() {
    setMsgs(m => [...m, {
      role: "noema",
      text: "La session du jour est terminée. Mais pas ton évolution. Reviens demain pour continuer ton ascension.",
      time: getTime(),
      isErr: true,
    }]);
  }

  // ── 11. RENDER ───────────────────────────────────────────────
  const NAV_TABS = [
    { id: "chat",    icon: "forum",         lbl: "Chat" },
    { id: "mapping", icon: "psychology_alt", lbl: "Mapping" },
    { id: "journal", icon: "auto_stories",  lbl: "Journal" },
    { id: "today",   icon: "light_mode",    lbl: "Aujourd'hui" },
  ];
  const activeTab = NAV_TABS.some((tab) => tab.id === navTab) ? navTab : "chat";

  function changeTab(nextTab) {
    setNavTab(nextTab);
    onTabChange?.(nextTab);
  }

  const renderPanel = () => {
    switch (activeTab) {
      case "mapping":
        return (
          <MappingPage
            insights={insights}
            ikigai={ikigai}
            step={step}
          />
        );
      case "journal":
        return <JournalPage />;
      case "today":
        return (
          <TodayPage
            user={user}
            onJournal={() => changeTab("journal")}
          />
        );
      default: // chat
        return (
          <ChatPage
            msgs={msgs}
            typing={typing}
            input={input}
            setInput={setInput}
            send={send}
            genIkigai={genIkigai}
            onNav={onNav}
            newSession={newSession}
            user={user}
            sb={sb}
            taRef={taRef}
          />
        );
    }
  };

  return (
    <div style={{ backgroundColor: "#111318", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AdminPanel
        user={user}
        sb={sb}
        accessState={accessState}
        history={history.current}
        lastGreffierLog={lastGreffierLog.current}
        onResetMemory={adminResetMemory}
        onForcePhase2={adminForcePhase2}
        onSimulateLimit={adminSimulateLimit}
        onShowOnboarding={() => onNav("onboarding")}
        setInsights={setInsights}
        setIkigai={setIkigai}
        setStep={setStep}
        setNavTab={changeTab}
      />
      {renderPanel()}

      {/* ── Bottom Nav ── */}
      <nav style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 72,
        backgroundColor: "#111318",
        borderTop: "1px solid rgba(69,70,85,0.2)",
        display: "flex",
        alignItems: "stretch",
        zIndex: 100,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}>
        {NAV_TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => changeTab(tab.id)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                border: "none",
                background: active ? "rgba(91,108,255,0.15)" : "none",
                cursor: "pointer",
                borderRadius: 0,
                transition: "background 0.2s",
                padding: "8px 4px",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: "1.375rem",
                  color: active ? "#bdc2ff" : "#454655",
                  fontVariationSettings: active
                    ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
                    : "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24",
                  transition: "color 0.2s",
                }}
              >{tab.icon}</span>
              <span style={{
                fontSize: "0.65rem",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: active ? 600 : 400,
                color: active ? "#bdc2ff" : "#454655",
                letterSpacing: "0.03em",
                transition: "color 0.2s",
              }}>{tab.lbl}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

const panelStyle = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "calc(100vh - 72px)",
  backgroundColor: "#111318",
};

const placeholderStyle = {
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  color: "#454655",
  fontSize: "0.9rem",
};
