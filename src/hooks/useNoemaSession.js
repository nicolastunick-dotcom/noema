import { useState, useEffect, useRef, useMemo } from "react";
import { sb } from "../lib/supabase";
import { buildReturnVisitState } from "../lib/productProof";

// ─── Pure helpers ────────────────────────────────────────────────────────────

function buildWelcomeContinuity() {
  return { mode: "welcome", title: "", items: [], detail: "", meta: "", prompt: "" };
}

function buildRestartContinuity() {
  return {
    mode: "restart",
    title: "On repart d'ici",
    items: [],
    detail: "Un nouveau fil, sans perdre ce que Noema a deja compris.",
    meta: "Tu peux ouvrir un sujet neuf ou reprendre ce qui insiste.",
    prompt: "",
  };
}

function mergeRecentSessions(previous, nextSession) {
  const existing = Array.isArray(previous) ? previous : [];
  return [nextSession, ...existing.filter((s) => s?.id !== nextSession.id)].slice(0, 5);
}

// ─── useNoemaSession ─────────────────────────────────────────────────────────
// Owns: session identity, Supabase hydration, saveSession, autosave, chatContinuity.
// Does NOT own: conversational state (msgs, insights, ikigai…) — AppShell keeps those.

export function useNoemaSession({
  user,
  accessState,
  // AppShell state values (read for saveSession + chatContinuity)
  insights,
  ikigai,
  step,
  nextAction,
  sessionNote,
  // AppShell state setters (called during Supabase hydration)
  setInsights,
  setIkigai,
  setStep,
  setNextAction,
  // Mirror refs (read by autosave closures)
  insightsRef,
  ikigaiRef,
  stepRef,
  nextActionRef,
  // historyRef: session history managed by AppShell — read by saveSession
  historyRef,
  // Called when there is no prior session and the opening message should fire
  onNeedsOpeningMessage,
}) {
  const [recentSessions,      setRecentSessions]      = useState([]);
  const [lastSessionSnapshot, setLastSessionSnapshot] = useState(null);
  const [continuityMode,      setContinuityMode]      = useState("welcome");

  const sessionIdRef            = useRef(crypto.randomUUID());
  const lastSessionNote         = useRef("");
  const hasCountedSessionSaveRef = useRef(false);
  const memoryRef               = useRef(null);

  // ── Supabase hydration ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!sb || !user?.id) return;
    if (accessState?.loading) return;

    (async () => {
      const { data: mem, error: memErr } = await sb
        .from("memory")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (memErr) console.error("[Noema] Erreur chargement memory:", memErr);
      if (mem) memoryRef.current = mem;

      const { data: sessions, error: sessErr } = await sb
        .from("sessions")
        .select("insights,ikigai,step,next_action,session_note,ended_at")
        .eq("user_id", user.id)
        .order("ended_at", { ascending: false })
        .limit(5);
      if (sessErr) console.error("[Noema] Erreur chargement sessions:", sessErr);

      const last = sessions?.[0];
      setRecentSessions(Array.isArray(sessions) ? sessions : []);

      if (last) {
        if (last.insights) setInsights((i) => ({ ...i, ...last.insights }));
        if (last.ikigai)   setIkigai((k)   => ({ ...k, ...last.ikigai }));
        if (typeof last.step === "number") {
          setStep(last.step);
          // Sprint 3: inject step into memoryRef so buildMemoryContext() includes it immediately
          if (memoryRef.current) memoryRef.current = { ...memoryRef.current, step: last.step };
        }
        // Sprint 5.1: restore next_action so Today/Journal find the intent after refresh
        if (last.next_action) setNextAction(last.next_action);
        setLastSessionSnapshot(last);
        setContinuityMode("resume");
      } else {
        setLastSessionSnapshot(null);
        setContinuityMode("welcome");
        if (!accessState?.quota?.exhausted) onNeedsOpeningMessage?.();
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, accessState?.loading, accessState?.quota?.exhausted]);

  // ── Autosave ───────────────────────────────────────────────────────────────
  // beforeunload: save when user closes/refreshes
  // setInterval:  silent save every 2 minutes
  useEffect(() => {
    const doSave = () =>
      saveSession(insightsRef.current, ikigaiRef.current, stepRef.current);

    window.addEventListener("beforeunload", doSave);
    const timer = setInterval(doSave, 2 * 60 * 1000);
    return () => {
      window.removeEventListener("beforeunload", doSave);
      clearInterval(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── saveSession ────────────────────────────────────────────────────────────
  async function saveSession(currentInsights, currentIkigai, currentStep) {
    if (!sb || !user?.id) return;
    if (!historyRef.current || historyRef.current.length === 0) return;

    const sessionData = {
      id:           sessionIdRef.current, // Sprint 4: stable ID — upsert on this identifier
      user_id:      user.id,
      ended_at:     new Date().toISOString(),
      history:      historyRef.current,
      insights:     currentInsights,
      ikigai:       currentIkigai,
      step:         currentStep,
      session_note: lastSessionNote.current,
      next_action:  nextActionRef.current, // Sprint 5: persist so Today can read it
    };

    // Sprint 4: upsert on id — all autosaves update the same active session row
    const { error: insErr } = await sb.from("sessions").upsert(sessionData, { onConflict: "id" });
    if (insErr) { console.error("[Noema] Erreur upsert session:", insErr); return; }
    setRecentSessions((prev) => mergeRecentSessions(prev, sessionData));

    const { data: mem, error: memErr } = await sb
      .from("memory")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (memErr) console.error("[Noema] Erreur lecture memory:", memErr);

    const notes = [...(mem?.session_notes || []), lastSessionNote.current]
      .filter(Boolean)
      .slice(-10);
    const previousSessionCount = mem?.session_count || 0;
    const newMemory = {
      user_id:        user.id,
      updated_at:     new Date().toISOString(),
      forces:         [...new Set([...(mem?.forces || []), ...currentInsights.forces])],
      contradictions: [...new Set([...(mem?.contradictions || []), ...currentInsights.contradictions])],
      blocages:       { ...(mem?.blocages || {}), ...currentInsights.blocages },
      ikigai:         { ...(mem?.ikigai || {}), ...currentIkigai },
      session_notes:  notes,
      // Count only once per live session, not on every autosave
      session_count: hasCountedSessionSaveRef.current
        ? previousSessionCount
        : previousSessionCount + 1,
    };
    const { error: upsErr } = await sb
      .from("memory")
      .upsert(newMemory, { onConflict: "user_id" });
    if (upsErr) console.error("[Noema] Erreur upsert memory:", upsErr);
    else {
      memoryRef.current = newMemory;
      hasCountedSessionSaveRef.current = true;
    }
    lastSessionNote.current = "";
  }

  // ── resetSessionState ──────────────────────────────────────────────────────
  // Called by AppShell reset() — resets the session-owned state only
  function resetSessionState() {
    sessionIdRef.current = crypto.randomUUID(); // Sprint 4: new session = new identifier
    hasCountedSessionSaveRef.current = false;
    lastSessionNote.current = "";
    setContinuityMode("restart");
  }

  // ── chatContinuity ─────────────────────────────────────────────────────────
  const chatContinuity = useMemo(() => {
    if (continuityMode === "restart") return buildRestartContinuity();
    if (continuityMode !== "resume")  return buildWelcomeContinuity();

    const continuity = buildReturnVisitState({
      previousSession:    lastSessionSnapshot,
      currentNextAction:  nextAction,
      currentSessionNote: sessionNote,
      currentInsights:    insights,
      currentStep:        step,
    });

    return continuity.hasData
      ? { mode: "resume", detail: "", meta: "", ...continuity }
      : buildWelcomeContinuity();
  }, [continuityMode, insights, lastSessionSnapshot, nextAction, sessionNote, step]);

  return {
    sessionIdRef,
    recentSessions,
    lastSessionSnapshot,
    continuityMode,
    memoryRef,
    lastSessionNote,
    hasCountedSessionSaveRef,
    saveSession,
    resetSessionState,
    chatContinuity,
  };
}
