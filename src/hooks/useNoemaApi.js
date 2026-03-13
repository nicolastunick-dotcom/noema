// --- CODEX CHANGE START ---
// Codex modification - extract the Anthropic API call from AppShell without
// changing request construction or frontend error semantics.
import { useCallback } from "react";
import { ANTHROPIC_PROXY } from "../constants/config";
import { buildSystemPrompt } from "../lib/supabase";
import { trimHistory } from "../utils/helpers";
import { OVERLOADED_MSG, isOverloadedError } from "../utils/errors";

export function useNoemaApi({ historyRef, memoryRef }) {
  return useCallback(async () => {
    const h = trimHistory(historyRef.current);
    const systemPrompt = buildSystemPrompt(memoryRef.current);
    const headers = { "Content-Type":"application/json", "anthropic-version":"2023-06-01" };

    if (import.meta.env.DEV) {
      headers["x-api-key"] = import.meta.env.VITE_ANTHROPIC_KEY;
      headers["anthropic-dangerous-direct-browser-access"] = "true";
    }

    const res = await fetch(ANTHROPIC_PROXY, {
      method:"POST",
      headers,
      body: JSON.stringify({
        model:"claude-sonnet-4-6",
        max_tokens:1400,
        system:systemPrompt,
        messages:h,
      }),
    });

    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      const message = e?.error?.message || `HTTP ${res.status}`;
      const err = new Error(isOverloadedError(res.status, message) ? OVERLOADED_MSG : message);
      err.status = res.status;
      throw err;
    }

    return (await res.json()).content[0].text;
  }, [historyRef, memoryRef]);
}
// --- CODEX CHANGE END ---
