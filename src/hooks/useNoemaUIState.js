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
  const [step, setStep] = useState(0);
  const [sideTab, setSideTab] = useState("insights");
  const [mobTab, setMobTab] = useState("chat");
  const [insights, setInsights] = useState(EMPTY_INSIGHTS);
  // --- CODEX CHANGE START ---
  // Codex modification - keep the session-ending action as dedicated UI state
  // while allowing it to be hydrated/persisted through the existing session data.
  const [nextAction, setNextAction] = useState("");
  // --- CODEX CHANGE END ---
  const [ikigai, setIkigai] = useState(EMPTY_IKIGAI);
  const [mode, setMode] = useState("accueil");

  function applyUI(ui) {
    if (!ui) return;
    if (ui.session_note) lastSessionNoteRef.current = ui.session_note;
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
    setInsights(EMPTY_INSIGHTS);
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
    step,
    setStep,
    sideTab,
    setSideTab,
    mobTab,
    setMobTab,
    insights,
    setInsights,
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
