import { useEffect, useLayoutEffect, useRef, useCallback, useState } from "react";
import { sb } from "../lib/supabase";
import { QUOTES } from "../constants/prompt";
import { applyTheme } from "../constants/themes";
import { getUpdateGlowTone, isNearBottom } from "../utils/chatEffects";
import { getTime, parseUI, stripUI } from "../utils/helpers";
import { getChatErrorMessage } from "../utils/errors";
import StateBadge    from "../components/StateBadge";
import InsightsPane  from "../components/InsightsPane";
import ProgressPane  from "../components/ProgressPane";
import IkigaiPane    from "../components/IkigaiPane";
import SessionGuide  from "../components/SessionGuide";
import SessionProgress from "../components/SessionProgress";
import { SendSVG }   from "../components/SVGs";
import RichText      from "../components/RichText";
import { useNoemaApi } from "../hooks/useNoemaApi";
import { useNoemaRateLimit } from "../hooks/useNoemaRateLimit";
import { useNoemaSession } from "../hooks/useNoemaSession";
import { useNoemaUIState } from "../hooks/useNoemaUIState";
import {
  advanceNoemaTestJourney,
  createNoemaSeededJourney,
  createNoemaSeedModeReply,
  createNoemaTestUnavailableReply,
  isNoemaTestAuthorizedUser,
  parseNoemaTestCommand,
  startNoemaTestJourney,
} from "../lib/testMode/noemaTestMode";

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
function cloneHistoryEntries(entries = []) {
  return entries.map((entry) => ({ ...entry }));
}

export default function AppShell({ onNav, user }) {
  // ── 1. STATE & REFS ──────────────────────────────────────────
  const history         = useRef([]);
  const lastSessionNote = useRef("");
  const memoryRef       = useRef(null); // toujours à jour même dans les closures async
  const msgsRef         = useRef(null);
  const taRef           = useRef(null);
  const minuteTimestamps = useRef([]);  // rate limiting local (par minute)
  const hasOpened       = useRef(false);
  const updateGlowIndex = useRef(0);
  const stickToBottomRef = useRef(true);
  const testModeSnapshotRef = useRef(null);
  // --- CODEX CHANGE START ---
  // Codex modification - control the session journey guide from the header
  // without altering the existing shell/tab structure.
  const [showSessionGuide, setShowSessionGuide] = useState(false);
  // --- CODEX CHANGE END ---

  // --- CODEX CHANGE START ---
  // Codex modification - extract the AppShell UI state into a dedicated hook
  // while keeping all rendering and orchestration behavior identical.
  const {
    msgs,
    setMsgs,
    input,
    setInput,
    typing,
    setTyping,
    mstate,
    sessionIndex,
    sessionStage,
    messagesToday,
    messagesRemaining,
    step,
    setStep,
    sideTab,
    setSideTab,
    mobTab,
    setMobTab,
    insights,
    setInsights,
    subSessionSummary,
    weeklyMemory,
    setWeeklyMemory,
    nextAction,
    setNextAction,
    ikigai,
    setIkigai,
    mode,
    isTestMode,
    isSeedMode,
    testMessageCount,
    setTestModeState,
    resetTestModeState,
    getUIStateSnapshot,
    restoreUIState,
    setSessionNote,
    applyUI,
    resetUIState,
  } = useNoemaUIState({ lastSessionNoteRef: lastSessionNote });
  // --- CODEX CHANGE END ---

  // --- CODEX CHANGE START ---
  // Codex modification - Phase 1 extraction keeps API and rate-limit logic in
  // dedicated hooks while preserving AppShell state flow and visible behavior.
  const callAPI = useNoemaApi({ historyRef: history, memoryRef });
  const checkRateLimit = useNoemaRateLimit({ user, minuteTimestampsRef: minuteTimestamps });
  // --- CODEX CHANGE END ---

  // ── 2. OPENING MESSAGE ───────────────────────────────────────
  const openingMessage = useCallback(async () => {
    if (hasOpened.current) return;
    hasOpened.current = true;
    stickToBottomRef.current = true;
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    const trigger = `[SYSTÈME — ne pas afficher] Démarre la session. Ouvre avec cette citation de ${q.author} : "${q.text}" — intègre-la naturellement dans ton message d'accueil en créant un lien personnel avec l'utilisateur. Pose ensuite une première question ouverte pour commencer l'exploration.`;
    history.current.push({ role: "user", content: trigger });
    setTyping(true);
    try {
      const raw   = await callAPI();
      const ui    = parseUI(raw);
      const clean = stripUI(raw);
      applyUI(ui);
      setMsgs([{ role: "noema", text: clean, time: getTime() }]);
      history.current.push({ role: "assistant", content: raw });
    } catch (e) {
      console.error("[Noema] Erreur message d'ouverture:", e);
      history.current = [];
      hasOpened.current = false;
    }
    setTyping(false);
  }, [applyUI, callAPI, setMsgs, setTyping]);

  // --- CODEX CHANGE START ---
  // Codex modification - Phase 1 session extraction moves Supabase session
  // hydration and persistence into a dedicated hook without changing flow.
  const saveSession = useNoemaSession({
    user,
    historyRef: history,
    lastSessionNoteRef: lastSessionNote,
    memoryRef,
    setInsights,
    setIkigai,
    setNextAction,
    setSessionNote,
    setWeeklyMemory,
    setStep,
    openingMessage,
  });
  // --- CODEX CHANGE END ---

  useEffect(() => {
    if (user) return;
    openingMessage();
  }, [openingMessage, user]);

  useEffect(() => { applyTheme(mstate); }, [mstate]);

  const scrollToBottom = useCallback(() => {
    const node = msgsRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, []);

  useLayoutEffect(() => {
    if (!stickToBottomRef.current) return;
    scrollToBottom();
  }, [msgs, scrollToBottom, typing]);

  const pinToLatest = useCallback(({ force = false } = {}) => {
    if (!force && !stickToBottomRef.current) return;
    requestAnimationFrame(() => {
      scrollToBottom();
      stickToBottomRef.current = true;
    });
  }, [scrollToBottom]);

  const handleMessagesScroll = useCallback(() => {
    stickToBottomRef.current = isNearBottom(msgsRef.current);
  }, []);

  const syncTextareaHeight = useCallback((node) => {
    if (!node) return false;
    const previousHeight = node.offsetHeight;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 120)}px`;
    return Math.abs(node.offsetHeight - previousHeight) > 1;
  }, []);

  const handleInputFocus = useCallback(() => {
    if (!stickToBottomRef.current) return;
    pinToLatest({ force: true });
  }, [pinToLatest]);

  const handleInputChange = useCallback((event) => {
    setInput(event.target.value);
    const heightChanged = syncTextareaHeight(event.target);
    if (heightChanged && stickToBottomRef.current) {
      pinToLatest({ force: true });
    }
  }, [pinToLatest, setInput, syncTextareaHeight]);

  const createNoemaChatMessage = useCallback(({ text, hasUpdate = false, isErr = false, time = getTime() }) => {
    const message = { role: "noema", text, time, isErr };
    if (!hasUpdate) return message;

    const updateTone = getUpdateGlowTone(updateGlowIndex.current);
    updateGlowIndex.current += 1;
    return { ...message, hasUpdate: true, updateTone };
  }, []);

  const hasVisibleUIUpdate = useCallback((ui) => Boolean(
    ui && (
      (ui.forces?.length > 0) ||
      (ui.ikigai && Object.values(ui.ikigai).some(Boolean)) ||
      (ui.contradictions?.length > 0) ||
      (ui.blocages && Object.values(ui.blocages).some(Boolean))
    )
  ), []);

  const buildNoemaMessageFromRaw = useCallback((raw) => {
    const ui = parseUI(raw);
    return {
      raw,
      ui,
      message: createNoemaChatMessage({
        text: stripUI(raw),
        hasUpdate: hasVisibleUIUpdate(ui),
      }),
    };
  }, [createNoemaChatMessage, hasVisibleUIUpdate]);

  const ensureTestModeSnapshot = useCallback(() => {
    if (testModeSnapshotRef.current) return;

    testModeSnapshotRef.current = {
      history: cloneHistoryEntries(history.current),
      uiState: { ...getUIStateSnapshot(), input: "" },
      updateGlowIndex: updateGlowIndex.current,
    };
  }, [getUIStateSnapshot]);

  const activateNoemaTestMode = useCallback((response, { isSeed = false } = {}) => {
    ensureTestModeSnapshot();

    const { ui, message } = buildNoemaMessageFromRaw(response.raw);
    updateGlowIndex.current = 0;
    history.current = [{ role: "assistant", content: response.raw }];
    resetUIState();
    if (ui) applyUI(ui);
    setMsgs([message]);
    setTestModeState({
      isTestMode: true,
      isSeedMode: isSeed,
      testStep: response.stageIndex,
      testMessageCount: response.messageCount,
    });
    stickToBottomRef.current = true;
    pinToLatest({ force: true });
  }, [
    applyUI,
    buildNoemaMessageFromRaw,
    ensureTestModeSnapshot,
    pinToLatest,
    resetUIState,
    setMsgs,
    setTestModeState,
  ]);

  const stopNoemaTestMode = useCallback(() => {
    const snapshot = testModeSnapshotRef.current;

    testModeSnapshotRef.current = null;
    resetTestModeState();
    history.current = cloneHistoryEntries(snapshot?.history || []);
    updateGlowIndex.current = typeof snapshot?.updateGlowIndex === "number"
      ? snapshot.updateGlowIndex
      : 0;
    restoreUIState(snapshot?.uiState || null);
    stickToBottomRef.current = true;
    pinToLatest({ force: true });
  }, [pinToLatest, resetTestModeState, restoreUIState]);

  const advanceLocalNoemaTestJourney = useCallback((userText) => {
    const response = isSeedMode
      ? createNoemaSeedModeReply()
      : advanceNoemaTestJourney({ testMessageCount });
    const { ui, message } = buildNoemaMessageFromRaw(response.raw);

    if (ui) applyUI(ui);
    setMsgs((current) => [
      ...current,
      { role: "user", text: userText, time: getTime() },
      message,
    ]);
    history.current.push({ role: "user", content: userText });
    history.current.push({ role: "assistant", content: response.raw });
    setTestModeState({
      isTestMode: true,
      isSeedMode,
      testStep: response.stageIndex,
      testMessageCount: response.messageCount,
    });
    stickToBottomRef.current = true;
    pinToLatest({ force: true });
  }, [
    applyUI,
    buildNoemaMessageFromRaw,
    isSeedMode,
    pinToLatest,
    setMsgs,
    setTestModeState,
    testMessageCount,
  ]);

  // ── 4. SEND ──────────────────────────────────────────────────
  const send = useCallback(async (text) => {
    const t = text.replace(/<[^>]*>/g, "").trim().slice(0, 2000);
    if (!t || typing) return;
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
    stickToBottomRef.current = true;
    pinToLatest({ force: true });

    const testCommand = parseNoemaTestCommand(t);
    if (testCommand) {
      if (testCommand.type === "stop") {
        if (isTestMode) stopNoemaTestMode();
        return;
      }

      if (!isNoemaTestAuthorizedUser(user)) {
        setMsgs((current) => [
          ...current,
          createNoemaChatMessage({
            text: createNoemaTestUnavailableReply(),
            isErr: true,
          }),
        ]);
        return;
      }

      if (testCommand.type === "start") {
        activateNoemaTestMode(startNoemaTestJourney());
        return;
      }

      if (testCommand.type === "seed") {
        activateNoemaTestMode(createNoemaSeededJourney(), { isSeed: true });
        return;
      }
    }

    if (isTestMode) {
      advanceLocalNoemaTestJourney(t);
      return;
    }

    const rateLimitMsg = await checkRateLimit();
    if (rateLimitMsg) {
      setMsgs((current) => [...current, createNoemaChatMessage({ text: rateLimitMsg, isErr: true })]);
      return;
    }

    setMsgs(m => [...m, {role:"user", text:t, time:getTime()}]);
    history.current.push({role:"user", content:t});
    setTyping(true);
    try {
      const raw   = await callAPI();
      const ui    = parseUI(raw);
      const clean = stripUI(raw);
      applyUI(ui);
      const hasUpdate = hasVisibleUIUpdate(ui);
      setMsgs((current) => [...current, createNoemaChatMessage({ text: clean, hasUpdate })]);
      history.current.push({role:"assistant", content:raw});
    } catch(e) {
      // --- CODEX CHANGE START ---
      // Codex modification - show a dedicated overload message when the backend
      // reports Anthropic saturation, otherwise preserve the generic fallback.
      const errorText = getChatErrorMessage(e);
      setMsgs((current) => [...current, createNoemaChatMessage({ text: errorText, isErr: true })]);
      // --- CODEX CHANGE END ---
      console.error(e);
    }
    setTyping(false);
  }, [
    applyUI,
    activateNoemaTestMode,
    advanceLocalNoemaTestJourney,
    callAPI,
    checkRateLimit,
    createNoemaChatMessage,
    hasVisibleUIUpdate,
    isTestMode,
    pinToLatest,
    setInput,
    setMsgs,
    setTyping,
    stopNoemaTestMode,
    typing,
    user,
  ]);

  // ── 5. ACTIONS ───────────────────────────────────────────────
  function reset() {
    history.current = [];
    updateGlowIndex.current = 0;
    testModeSnapshotRef.current = null;
    stickToBottomRef.current = true;
    resetTestModeState();
    resetUIState();
  }

  // --- CODEX CHANGE START ---
  // Codex modification - persist the current session-ending action inside the
  // existing session insights payload to avoid a schema migration for V1.
  async function newSession() {
    await saveSession(
      { ...insights, next_action: nextAction, weekly_memory: weeklyMemory },
      ikigai,
      step,
      { isTestSession: isTestMode }
    );
    reset();
  }
  // --- CODEX CHANGE END ---
  function genIkigai() { send("Je veux voir mon Ikigai"); }

  // --- CODEX CHANGE START ---
  if (showSessionGuide) {
    return (
      <div className="app">
        <div className="modal">
          <div className="mh">
            <button className="mb-btn" onClick={() => setShowSessionGuide(false)}>←</button>
            <h2 className="mt">Parcours Noema</h2>
          </div>
          <div className="mbody">
            <SessionGuide/>
          </div>
        </div>
      </div>
    );
  }
  // --- CODEX CHANGE END ---

  // ── 6. RENDER ────────────────────────────────────────────────
  if (mobTab !== "chat") {
    const PANEL = {
      insights: <InsightsPane insights={insights}/>,
      // --- CODEX CHANGE START ---
      // Codex modification - add the UI-only current session and sub-session
      // tracker beneath the existing progression panel for desktop and mobile.
      progress: (
        <>
          <ProgressPane step={step} mentalState={mstate} nextAction={nextAction}/>
          <SessionProgress
            sessionIndex={sessionIndex}
            sessionStage={sessionStage}
            messagesToday={messagesToday}
            messagesRemaining={messagesRemaining}
            subSessionSummary={subSessionSummary}
          />
        </>
      ),
      // --- CODEX CHANGE END ---
      ikigai:   <IkigaiPane ikigai={ikigai} sessionIndex={sessionIndex} onGen={()=>{ genIkigai(); setMobTab("chat"); }}/>,
    };
    const TITLES = {insights:"Insights",progress:"Progression",ikigai:"Ikigai"};
    return (
      <div className="app">
        <div className="modal">
          <div className="mh">
            <button className="mb-btn" onClick={()=>setMobTab("chat")}>←</button>
            <h2 className="mt">{TITLES[mobTab]}</h2>
          </div>
          <div className="mbody">{PANEL[mobTab]}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="topbar">
        <button className="tb-logo" onClick={()=>onNav("landing")}>Noema<span>.</span></button>
        <div className="tb-status">
          <StateBadge state={mstate} mode={mode}/>
          {isTestMode && (
            <span className="test-mode-badge">
              {isSeedMode ? "Mode test · seed" : "Mode test"}
            </span>
          )}
        </div>
        <div className="tb-right">
          {/* --- CODEX CHANGE START --- */}
          {/* Codex modification - add a non-disruptive entry point for the
              guided session overview directly from the AppShell header. */}
          <button className="btn-sm" onClick={() => setShowSessionGuide(true)}>Voir le parcours</button>
          {/* --- CODEX CHANGE END --- */}
          <button className="btn-sm" onClick={newSession}>Nouvelle session</button>
          {/* --- CODEX CHANGE START --- */}
          {/* Codex modification - hide logout in demo mode so the auth UI stays
              coherent when no authenticated user session exists. */}
          {user&&sb&&<button className="btn-sm" onClick={()=>sb.auth.signOut()}>Déconnexion</button>}
          {/* --- CODEX CHANGE END --- */}
        </div>
      </div>

      <div className="main">
        <div className="chat">
          <div className="msgs" ref={msgsRef} onScroll={handleMessagesScroll}>
            {msgs.length===0&&!typing&&(
              <div className="welcome">
                <div className="w-orb">◎</div>
                <h2 className="w-title">Bonjour.<br/>Je suis Noema.</h2>
                <p className="w-sub">Dis-moi ce qui t'occupe l'esprit en ce moment.</p>
                <div className="starters">
                  {["Je me sens bloqué sans savoir pourquoi","J'ai du mal à prendre une décision importante","Je veux mieux comprendre ce que je veux vraiment"].map(p=>(
                    <button key={p} className="starter" onClick={()=>send(p)}>{p}</button>
                  ))}
                </div>
              </div>
            )}

            {msgs.map((m,i) => (
              <div className="mg" key={i}>
                <div className={`mr ${m.role}`}>
                  <div className="mav">{m.role==="noema"?"N":"T"}</div>
                  <div className="mb">
                    <div className="mmeta">{m.role==="noema"?"Noema":"Toi"} · {m.time}</div>
                    {/* --- CODEX CHANGE START --- */}
                    {/* Codex modification - render chat text through a controlled
                        React formatter instead of injecting raw HTML strings. */}
                    <div
                      className={[
                        "bubble",
                        m.isErr ? "err" : "",
                        m.hasUpdate ? "has-update" : "",
                        m.updateTone ? `update-glow-${m.updateTone}` : "",
                      ].filter(Boolean).join(" ")}
                    >
                      <RichText text={m.text}/>
                    </div>
                    {/* --- CODEX CHANGE END --- */}
                  </div>
                </div>
              </div>
            ))}

            {typing&&(
              <div className="typ">
                <div className="mav" style={{width:30,height:30,borderRadius:9,background:"var(--accent-soft)",border:"1px solid var(--accent-border)",color:"var(--accent)",fontSize:".7rem",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>N</div>
                <div className="typ-b"><div className="td"/><div className="td"/><div className="td"/></div>
              </div>
            )}
          </div>

          <div className="inp-area">
            <div className="qrow">
              <button className="qc" disabled={typing} onClick={()=>send("Je suis prêt à commencer")}>Commencer →</button>
              <button className="qc" disabled={typing} onClick={()=>send("Approfondir ce point")}>Approfondir</button>
              <button className="qc" disabled={typing} onClick={()=>send("Fais une pause et résume-moi où j'en suis")}>Résumé</button>
              <button className="qc sp" disabled={typing} onClick={genIkigai}>✨ Ikigai</button>
            </div>
            <div className="irow">
              <textarea
                ref={taRef} rows={1}
                placeholder="Écris ici… (Entrée pour envoyer)"
                value={input} disabled={typing}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send(input);}}}
                maxLength={2000}
              />
              <button className={`send${input.trim()?" on":""}`} onClick={()=>send(input)} disabled={!input.trim()||typing}>
                <SendSVG/>
              </button>
            </div>
          </div>
        </div>

        <div className="side">
          <div className="stabs">
            {[["insights","Insights"],["ikigai","Ikigai"],["progress","Progression"]].map(([k,l])=>(
              <button key={k} className={`stab${sideTab===k?" on":""}`} onClick={()=>setSideTab(k)}>{l}</button>
            ))}
          </div>
          <div className="sc">
            {sideTab==="insights" && <InsightsPane insights={insights}/>}
            {/* --- CODEX CHANGE START --- */}
            {sideTab==="progress" && (
              <>
                <ProgressPane step={step} mentalState={mstate} nextAction={nextAction}/>
                <SessionProgress
                  sessionIndex={sessionIndex}
                  sessionStage={sessionStage}
                  messagesToday={messagesToday}
                  messagesRemaining={messagesRemaining}
                  subSessionSummary={subSessionSummary}
                />
              </>
            )}
            {/* --- CODEX CHANGE END --- */}
            {sideTab==="ikigai"   && <IkigaiPane ikigai={ikigai} sessionIndex={sessionIndex} onGen={genIkigai}/>}
          </div>
        </div>
      </div>

      <div className="bnav">
        {[{id:"chat",icon:"💬",lbl:"Chat"},{id:"insights",icon:"🔍",lbl:"Insights"},{id:"ikigai",icon:"🌟",lbl:"Ikigai"},{id:"progress",icon:"📈",lbl:"Progression"}].map(n=>(
          <button key={n.id} className={`bni${mobTab===n.id?" on":""}`} onClick={()=>setMobTab(n.id)}>
            <span className="bni-i">{n.icon}</span>
            <span className="bni-l">{n.lbl}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
