import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { sb, buildMemoryContext } from "../lib/supabase";
import { ANTHROPIC_PROXY } from "../constants/config";
import { QUOTES } from "../constants/prompt";
import { applyTheme, mapEtat } from "../constants/themes";
import { getTime, parseUI, stripUI, trimHistory } from "../utils/helpers";
import { buildProofState, buildProofUpdateLabel } from "../lib/productProof";
import { getPhaseState } from "../lib/phaseState";
import { buildProgressSignals } from "../lib/progressionSignals";
import { NoemaContext } from "../context/NoemaContext";
import { useNoemaSession } from "../hooks/useNoemaSession";
import ShellV2   from "./v2/ShellV2";
import AdminPanel from "../components/AdminPanel";

// ─────────────────────────────────────────────────────────────
// APP SHELL — Composant principal : chat + panneaux latéraux
// Sections :
//   1. STATE & REFS
//   2. OPENING MESSAGE
//   3. EFFECTS (miroirs, thème, scroll)
//   4. API (callAPI)
//   5. UI HANDLER (applyUI)
//   6. RATE LIMIT (checkRateLimit)
//   7. SEND
//   8. ACTIONS (reset, newSession, genIkigai)
//   9. RENDER
// Session persistence → useNoemaSession hook
// ─────────────────────────────────────────────────────────────
export default function AppShell({ onNav, user, initialTab = "today", onTabChange, accessState = null }) {
  const NAV_HEIGHT = 88;
  // ── 1. STATE & REFS ──────────────────────────────────────────
  const [msgs,     setMsgs]     = useState([]);
  const [input,    setInput]    = useState("");
  const [typing,   setTyping]   = useState(false);
  const [mstate,   setMstate]   = useState("exploring");
  const [step,     setStep]     = useState(0);
  const [navTab,   setNavTab]   = useState("chat");
  const [insights, setInsights] = useState({forces:[],blocages:{racine:"",entretien:"",visible:""},contradictions:[]});
  const [ikigai,      setIkigai]      = useState({aime:"",excelle:"",monde:"",paie:"",mission:""});
  const [nextAction,  setNextAction]  = useState("");
  const [sessionNote, setSessionNote] = useState("");
  const [quotaState, setQuotaState] = useState(() => accessState?.quota || null);

  const history          = useRef([]);
  const msgsRef          = useRef(null);
  const taRef            = useRef(null);
  const minuteTimestamps = useRef([]);
  const hasOpened        = useRef(false);
  const lastGreffierLog  = useRef(null);
  const [greffierLogTick, setGreffierLogTick] = useState(0);

  // Mirror refs — always up-to-date in async closures and events
  const insightsRef   = useRef(insights);
  const ikigaiRef     = useRef(ikigai);
  const stepRef       = useRef(step);
  const nextActionRef = useRef(nextAction);

  // ── Session hook ────────────────────────────────────────────────────────────
  const {
    sessionIdRef,
    recentSessions,
    lastSessionSnapshot,
    memoryRef,
    lastSessionNote,
    saveSession,
    resetSessionState,
    chatContinuity,
  } = useNoemaSession({
    user,
    accessState,
    insights, ikigai, step, nextAction, sessionNote,
    setInsights, setIkigai, setStep, setNextAction,
    insightsRef, ikigaiRef, stepRef, nextActionRef,
    historyRef: history,
    onNeedsOpeningMessage: (openingContext) => openingMessage(openingContext),
  });

  useEffect(() => {
    setNavTab(initialTab || "today");
  }, [initialTab]);

  useEffect(() => {
    if (accessState?.quota) {
      setQuotaState(accessState.quota);
    }
  }, [accessState?.quota]);

  const proofState = useMemo(
    () => buildProofState({ insights, nextAction, step, previous: lastSessionSnapshot }),
    [insights, lastSessionSnapshot, nextAction, step]
  );

  const phaseContext = useMemo(() => getPhaseState(step), [step]);
  const progressSignals = useMemo(
    () => buildProgressSignals({
      sessions: recentSessions,
      current: {
        insights,
        next_action: nextAction,
        session_note: sessionNote,
        step,
      },
    }),
    [insights, nextAction, recentSessions, sessionNote, step]
  );

  // ── 2. OPENING MESSAGE ───────────────────────────────────────
  // Fonction normale (non-useCallback) : appelée une seule fois par session depuis un effect,
  // jamais depuis le render — useCallback n'apporterait rien et créerait une TDZ avec applyUI.
  async function openingMessage(openingContext = {}) {
    if (!user?.id) return;
    if (hasOpened.current) return;
    hasOpened.current = true;
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    const previousNextAction = openingContext.previousNextAction || lastSessionSnapshot?.next_action || nextActionRef.current || "";
    const accountability = previousNextAction
      ? `Reprends d'abord le fil de la dernière action concrète : "${previousNextAction}". Demande avec douceur si elle a été faite, sans culpabiliser, puis ouvre la suite.`
      : "Pose ensuite une première question ouverte pour commencer l'exploration.";
    const trigger = `[SYSTÈME — ne pas afficher] Démarre la session. Ouvre avec cette citation de ${q.author} : "${q.text}" — intègre-la naturellement dans ton message d'accueil en créant un lien personnel avec l'utilisateur. ${accountability}`;
    history.current.push({ role: "user", content: trigger });
    setTyping(true);
    try {
      const { content: raw } = await callAPI({ consumeQuota: false });
      const ui    = parseUI(raw);
      const clean = stripUI(raw);
      applyUI(ui);
      updateMemoryRef(ui);
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
  // Sync des refs miroirs à chaque changement d'état
  useEffect(() => { insightsRef.current   = insights;    }, [insights]);
  useEffect(() => { ikigaiRef.current     = ikigai;      }, [ikigai]);
  useEffect(() => { stepRef.current       = step;        }, [step]);
  useEffect(() => { nextActionRef.current = nextAction;  }, [nextAction]);

  useEffect(() => { applyTheme(mstate); }, [mstate]);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    });
  }, [msgs, typing]);

  // ── 4. API ───────────────────────────────────────────────────
  const callAPI = useCallback(async (options = {}) => {
    if (!user?.id) {
      throw new Error("AUTH_REQUIRED");
    }

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
    const bodyPayload = {
      model:"claude-sonnet-4-6",
      max_tokens:1100,
      memory_context,
      messages:h,
      session_id:sessionIdRef.current,
      consume_quota: options.consumeQuota !== false,
    };
    const res = await fetch(ANTHROPIC_PROXY, {
      method:"POST", headers,
      body: JSON.stringify(bodyPayload),
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(payload?.error?.message || `HTTP ${res.status}`);
    }
    // Détecte une réponse non-JSON (HTML, texte brut, réponse vide).
    // Cause typique : fonction Netlify non démarrée ou endpoint introuvable.
    if (payload === null || typeof payload !== "object") {
      throw new Error("Réponse invalide du serveur. Vérifie que netlify dev tourne bien sur :8888.");
    }
    if (payload?._greffier) {
      lastGreffierLog.current = payload._greffier;
      setGreffierLogTick(t => t + 1);
    }
    if (payload?._quota) {
      setQuotaState(payload._quota);
    }
    return {
      content: typeof payload?.content === "string" ? payload.content : "",
      quota: payload?._quota || null,
      access: payload?._access || null,
      sessionLimit: Boolean(payload?._session_limit),
    };
  }, [memoryRef, sessionIdRef, user?.id]);

  // ── 5. UI HANDLER ────────────────────────────────────────────
  // Sprint 3 : met à jour memoryRef.current en live après chaque réponse _ui.
  // Permet à buildMemoryContext() d'envoyer un contexte enrichi dès le message suivant
  // dans la même session, sans attendre saveSession() (5 min / beforeunload).
  const updateMemoryRef = useCallback((ui) => {
    if (!ui) return;
    const prev = memoryRef.current || {};
    memoryRef.current = {
      ...prev,
      forces: [...new Set([...(prev.forces || []), ...(ui.forces || [])])].slice(0, 10),
      contradictions: [...new Set([...(prev.contradictions || []), ...(ui.contradictions || [])])].slice(0, 6),
      blocages: ui.blocages
        ? {
            racine:    ui.blocages.racine    || prev.blocages?.racine    || "",
            entretien: ui.blocages.entretien || prev.blocages?.entretien || "",
            visible:   ui.blocages.visible   || prev.blocages?.visible   || "",
          }
        : (prev.blocages || {}),
      ikigai: ui.ikigai
        ? {
            aime:    ui.ikigai.aime    || prev.ikigai?.aime    || "",
            excelle: ui.ikigai.excelle || prev.ikigai?.excelle || "",
            monde:   ui.ikigai.monde   || prev.ikigai?.monde   || "",
            paie:    ui.ikigai.paie    || prev.ikigai?.paie    || "",
            mission: ui.ikigai.mission || prev.ikigai?.mission || "",
          }
        : (prev.ikigai || {}),
      step: typeof ui.step === "number" ? Math.max(prev.step || 0, ui.step) : (prev.step || 0),
    };
  }, [memoryRef]);

  const applyUI = useCallback((ui) => {
    if (!ui) return;
    if (ui.session_note) {
      lastSessionNote.current = ui.session_note;
      setSessionNote(ui.session_note);
    }
    if (ui.etat) setMstate(mapEtat(ui.etat));
    if (typeof ui.step === "number") setStep(s => Math.max(s, ui.step));
    if (ui.next_action) setNextAction(ui.next_action);

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
  }, [lastSessionNote]);

  // ── 6. RATE LIMIT ────────────────────────────────────────────
  // Sprint 1 : le frontend ne lit/écrit plus rate_limits en Supabase.
  // Le quota produit (25/jour) est appliqué uniquement par claude.js côté backend.
  // Ce garde-fou local (30/minute) protège seulement contre le spam réseau immédiat.
  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    minuteTimestamps.current = minuteTimestamps.current.filter(t => now - t < 60_000);
    if (minuteTimestamps.current.length >= 30) {
      return "Tu envoies trop de messages. Attends une minute avant de continuer.";
    }
    minuteTimestamps.current.push(now);
    return null;
  }, []);

  // ── 7. SEND ──────────────────────────────────────────────────
  const send = useCallback(async (text) => {
    if (!user?.id) return;
    const t = text.replace(/<[^>]*>/g, "").trim().slice(0, 2000);
    if (!t || typing) return;
    if (quotaState?.exhausted) {
      setMsgs(m => [...m, { role:"noema", text:quotaState.exhaustedMessage, time:getTime(), isErr:true }]);
      return;
    }
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
      const previousState = {
        insights: insightsRef.current,
        nextAction: nextActionRef.current,
        step: stepRef.current,
      };
      const { content: raw, access, sessionLimit } = await callAPI();
      const ui    = parseUI(raw);
      const clean = stripUI(raw);
      const updateLabel = buildProofUpdateLabel({ ui, previous: previousState });
      applyUI(ui);
      updateMemoryRef(ui);
      const hasUpdate = ui && (
        (ui.forces?.length > 0) || (ui.ikigai && Object.values(ui.ikigai).some(v => v)) ||
        (ui.contradictions?.length > 0) || (ui.blocages?.racine)
      );
      setMsgs(m => [...m, {
        role:"noema",
        text:clean,
        time:streamTime,
        hasUpdate,
        updateLabel,
        isErr: sessionLimit,
        accessTier: access?.tier || null,
      }]);
      history.current.push({role:"assistant", content:raw});
    } catch(e) {
      setMsgs(m => [...m, {role:"noema", text:"Une erreur est survenue. Réessaie dans un instant.", time:streamTime, isErr:true}]);
      console.error(e);
    }
    setTyping(false);
  }, [applyUI, callAPI, quotaState, typing, updateMemoryRef, user?.id]);

  // ── 9. ACTIONS ───────────────────────────────────────────────
  function reset() {
    history.current = [];
    resetSessionState(); // resets sessionId, flags, continuityMode in the hook
    setMsgs([]); setStep(0); setMstate("exploring"); setNextAction(""); setSessionNote("");
    setInsights({forces:[], blocages:{racine:"",entretien:"",visible:""}, contradictions:[]});
    setIkigai({aime:"", excelle:"", monde:"", paie:"", mission:""});
  }

  async function newSession() { await saveSession(insights, ikigai, step); reset(); }
  function genIkigai() { send("Je veux voir mon Ikigai"); }

  async function handleLogout() {
    sessionStorage.removeItem("noema_invite");

    if (!sb) {
      onNav("/");
      return;
    }

    try {
      await sb.auth.signOut();
    } catch (error) {
      console.error("[Noema] Erreur logout:", error);
    } finally {
      onNav("/");
    }
  }

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

  // ── Runtime context — adapter stable pour les pages et composants UI ──────
  // Expose l'état et les actions dont l'UI a besoin, sans fuiter la logique interne.
  // Les pages peuvent utiliser useNoemaRuntime() au lieu de recevoir des props.
  // Aucune logique métier ici — uniquement des références à ce qui existe déjà.
  const runtimeValue = useMemo(() => ({
    // State conversationnel
    msgs,
    typing,
    input,
    setInput,
    // State sémantique
    step,
    etat: mstate,
    insights,
    ikigai,
    nextAction,
    sessionNote,
    // Phase & progression
    phaseContext,
    progressSignals,
    proofState,
    chatContinuity,
    lastSessionSnapshot,
    recentSessions,
    // Quota & accès
    quotaState,
    accessState,
    // Actions
    send,
    newSession,
    genIkigai,
    handleLogout,
    changeTab,
    // Navigation
    navTab,
    onNav,
    onPricing: () => onNav("pricing"),
    // Refs DOM
    taRef,
    msgsRef,
    // Données utilisateur
    user,
    sb,
    sessionId: sessionIdRef.current,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [
    msgs, typing, input, step, mstate, insights, ikigai,
    nextAction, sessionNote, phaseContext, progressSignals,
    proofState, chatContinuity, lastSessionSnapshot, recentSessions,
    quotaState, accessState, send, newSession, user,
  ]);

  function changeTab(nextTab) {
    setNavTab(nextTab);
    onTabChange?.(nextTab);
  }

  // ── 11. RENDER ───────────────────────────────────────────────
  // AppShell = logique pure. ShellV2 possède le layout, la nav, les transitions.
  return (
    <NoemaContext.Provider value={runtimeValue}>
      <ShellV2
        adminSlot={
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
        }
      />
    </NoemaContext.Provider>
  );
}
