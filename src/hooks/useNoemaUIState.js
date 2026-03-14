// --- CODEX CHANGE START ---
// Codex modification - extract AppShell UI state and UI-only reducers without
// changing orchestration, API flow, or visible rendering behavior.
import { useState } from "react";
import { mapEtat } from "../constants/themes";

const EMPTY_INSIGHTS = {
  forces: [],
  blocages: { racine: "", entretien: "", visible: "" },
  contradictions: [],
};

const EMPTY_IKIGAI = {
  aime: "",
  excelle: "",
  monde: "",
  paie: "",
  mission: "",
};

export function useNoemaUIState({ lastSessionNoteRef }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [mstate, setMstate] = useState("exploring");
  // --- CODEX CHANGE START ---
  // Codex modification - support the expanded Noema UI metadata block with
  // safe defaults so missing fields never break the current rendering.
  const [sessionIndex, setSessionIndex] = useState(0);
  const [sessionStage, setSessionStage] = useState("");
  const [messagesToday, setMessagesToday] = useState(0);
  const [messagesRemaining, setMessagesRemaining] = useState(0);
  const [step, setStep] = useState(0);
  const [ikigaiRevealed, setIkigaiRevealed] = useState(false);
  const [sideTab, setSideTab] = useState("insights");
  const [mobTab, setMobTab] = useState("chat");
  const [insights, setInsights] = useState(EMPTY_INSIGHTS);
  const [subSessionSummary, setSubSessionSummary] = useState("");
  const [weeklyMemory, setWeeklyMemory] = useState("");
  const [sessionNote, setSessionNote] = useState("");
  const [nextAction, setNextAction] = useState("");
  // --- CODEX CHANGE END ---
  const [ikigai, setIkigai] = useState(EMPTY_IKIGAI);
  const [mode, setMode] = useState("accueil");

  function applyUI(ui) {
    if (!ui) return;
    if (typeof ui.session_note === "string") {
      lastSessionNoteRef.current = ui.session_note;
      setSessionNote(ui.session_note);
    }
    if (ui.etat) setMstate(mapEtat(ui.etat));
    if (ui.mode) setMode(ui.mode);
    if (typeof ui.session_index === "number") setSessionIndex(ui.session_index);
    if (typeof ui.session_stage === "string") setSessionStage(ui.session_stage);
    if (typeof ui.messages_today === "number") setMessagesToday(ui.messages_today);
    if (typeof ui.messages_remaining === "number") setMessagesRemaining(ui.messages_remaining);
    if (typeof ui.step === "number") setStep(s => Math.max(s, ui.step));
    if (typeof ui.ikigai_revealed === "boolean") setIkigaiRevealed(ui.ikigai_revealed);
    if (typeof ui.sub_session_summary === "string") setSubSessionSummary(ui.sub_session_summary);
    if (typeof ui.weekly_memory === "string") setWeeklyMemory(ui.weekly_memory);

    if (ui.forces?.length || ui.contradictions?.length) {
      setInsights(p => ({
        forces: ui.forces?.length ? [...new Set([...p.forces, ...ui.forces])].slice(0, 6) : p.forces,
        blocages: ui.blocages || p.blocages,
        contradictions: ui.contradictions?.length ? [...new Set([...p.contradictions, ...ui.contradictions])].slice(0, 4) : p.contradictions,
      }));
    }

    if (typeof ui.next_action === "string") {
      setNextAction(ui.next_action);
    }

    if (ui.blocages) {
      setInsights(p => ({
        ...p,
        blocages: {
          racine: ui.blocages.racine || p.blocages.racine,
          entretien: ui.blocages.entretien || p.blocages.entretien,
          visible: ui.blocages.visible || p.blocages.visible,
        },
      }));
    }

    if (ui.ikigai) {
      setIkigai(p => ({
        aime: ui.ikigai.aime || p.aime,
        excelle: ui.ikigai.excelle || p.excelle,
        monde: ui.ikigai.monde || p.monde,
        paie: ui.ikigai.paie || p.paie,
        mission: ui.ikigai.mission || p.mission,
      }));
    }
  }

  function resetUIState() {
    setMsgs([]);
    setStep(0);
    setMstate("exploring");
    setMode("accueil");
    setSessionIndex(0);
    setSessionStage("");
    setMessagesToday(0);
    setMessagesRemaining(0);
    setIkigaiRevealed(false);
    setInsights(EMPTY_INSIGHTS);
    setSubSessionSummary("");
    setWeeklyMemory("");
    setSessionNote("");
    setNextAction("");
    setIkigai(EMPTY_IKIGAI);
    setMobTab("chat");
  }

  return {
    msgs,
    setMsgs,
    input,
    setInput,
    typing,
    setTyping,
    mstate,
    setMstate,
    sessionIndex,
    setSessionIndex,
    sessionStage,
    setSessionStage,
    messagesToday,
    setMessagesToday,
    messagesRemaining,
    setMessagesRemaining,
    step,
    setStep,
    ikigaiRevealed,
    setIkigaiRevealed,
    sideTab,
    setSideTab,
    mobTab,
    setMobTab,
    insights,
    setInsights,
    subSessionSummary,
    setSubSessionSummary,
    weeklyMemory,
    setWeeklyMemory,
    sessionNote,
    setSessionNote,
    nextAction,
    setNextAction,
    ikigai,
    setIkigai,
    mode,
    setMode,
    applyUI,
    resetUIState,
  };
}
// --- CODEX CHANGE END ---
