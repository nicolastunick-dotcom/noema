// --- CODEX CHANGE START ---
// Codex modification - extract session hydration and persistence from AppShell
// while keeping the same Supabase queries, refs, and state updates.
import { useCallback, useEffect } from "react";
import { sb } from "../lib/supabase";

export function useNoemaSession({
  user,
  historyRef,
  lastSessionNoteRef,
  memoryRef,
  setInsights,
  setIkigai,
  setNextAction,
  setSessionNote,
  setWeeklyMemory,
  setStep,
  openingMessage,
}) {
  useEffect(() => {
    if (!sb || !user) return;

    (async () => {
      const { data: mem, error: memErr } = await sb.from("memory").select("*").eq("user_id", user.id).maybeSingle();
      if (memErr) console.error("[Noema] Erreur chargement memory:", memErr);
      if (mem) memoryRef.current = mem;

      const { data: sessions, error: sessErr } = await sb.from("sessions")
        .select("insights,ikigai,step,session_note")
        .eq("user_id", user.id)
        .order("ended_at", { ascending: false })
        .limit(1);
      if (sessErr) console.error("[Noema] Erreur chargement sessions:", sessErr);

      const last = sessions?.[0];
      if (last) {
        if (last.insights) setInsights(i => ({ ...i, ...last.insights }));
        if (typeof last.insights?.next_action === "string") setNextAction(last.insights.next_action);
        if (typeof last.insights?.weekly_memory === "string") setWeeklyMemory(last.insights.weekly_memory);
        if (last.ikigai) setIkigai(k => ({ ...k, ...last.ikigai }));
        if (typeof last.session_note === "string") {
          lastSessionNoteRef.current = last.session_note;
          setSessionNote(last.session_note);
        }
        if (typeof last.step === "number") setStep(last.step);
      }

      await openingMessage();
    })();
  // --- CODEX CHANGE START ---
  // Codex modification - keep effect dependencies explicit now that AppShell
  // passes a stable opening callback into the session hook.
  }, [
    historyRef,
    lastSessionNoteRef,
    memoryRef,
    openingMessage,
    setIkigai,
    setInsights,
    setNextAction,
    setSessionNote,
    setStep,
    setWeeklyMemory,
    user,
  ]);
  // --- CODEX CHANGE END ---

  return useCallback(async (currentInsights, currentIkigai, currentStep) => {
    if (!sb || !user) return;
    if (historyRef.current.length === 0) return;

    const sessionData = {
      user_id: user.id,
      ended_at: new Date().toISOString(),
      history: historyRef.current,
      insights: currentInsights,
      ikigai: currentIkigai,
      step: currentStep,
      session_note: lastSessionNoteRef.current,
    };

    const { error: insErr } = await sb.from("sessions").insert(sessionData);
    if (insErr) {
      console.error("[Noema] Erreur insert session:", insErr);
      return;
    }

    const { data: mem, error: memErr } = await sb.from("memory").select("*").eq("user_id", user.id).maybeSingle();
    if (memErr) console.error("[Noema] Erreur lecture memory:", memErr);

    const notes = [...(mem?.session_notes || []), lastSessionNoteRef.current].filter(Boolean).slice(-10);
    const newMemory = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
      forces: [...new Set([...(mem?.forces || []), ...currentInsights.forces])],
      contradictions: [...new Set([...(mem?.contradictions || []), ...currentInsights.contradictions])],
      blocages: { ...(mem?.blocages || {}), ...currentInsights.blocages },
      ikigai: { ...(mem?.ikigai || {}), ...currentIkigai },
      session_notes: notes,
      session_count: (mem?.session_count || 0) + 1,
    };

    const { error: upsErr } = await sb.from("memory").upsert(newMemory, { onConflict: "user_id" });
    if (upsErr) console.error("[Noema] Erreur upsert memory:", upsErr);
    else memoryRef.current = newMemory;

    lastSessionNoteRef.current = "";
  }, [historyRef, lastSessionNoteRef, memoryRef, user]);
}
// --- CODEX CHANGE END ---
