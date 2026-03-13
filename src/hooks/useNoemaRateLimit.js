// --- CODEX CHANGE START ---
// Codex modification - extract the local + Supabase rate-limit logic from
// AppShell while keeping the same limits and messages.
import { useCallback } from "react";
import { sb } from "../lib/supabase";

export function useNoemaRateLimit({ user, minuteTimestampsRef }) {
  return useCallback(async () => {
    const now = Date.now();
    minuteTimestampsRef.current = minuteTimestampsRef.current.filter(t => now - t < 60_000);

    if (minuteTimestampsRef.current.length >= 30) {
      return "Tu envoies trop de messages. Attends une minute avant de continuer.";
    }

    if (sb && user) {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await sb.from("rate_limits")
        .select("count")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (error) console.error("[Noema] Erreur rate_limits lecture:", error);

      const currentCount = data?.count || 0;
      if (currentCount >= 100) {
        return "Tu as atteint ta limite pour aujourd'hui. Reviens demain pour continuer.";
      }

      await sb.from("rate_limits").upsert(
        { user_id: user.id, date: today, count: currentCount + 1 },
        { onConflict: "user_id,date" }
      );
    }

    minuteTimestampsRef.current.push(now);
    return null;
  }, [minuteTimestampsRef, user]);
}
// --- CODEX CHANGE END ---
