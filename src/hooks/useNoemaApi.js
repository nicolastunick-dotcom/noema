// --- CODEX CHANGE START ---
// Codex modification - extract the Anthropic API call from AppShell without
// changing request construction or frontend error semantics.
import { useCallback } from "react";
import { ANTHROPIC_PROXY } from "../constants/config";
import { buildSystemPrompt } from "../lib/supabase";
import { trimHistory } from "../utils/helpers";
import { OVERLOADED_MSG, isOverloadedError } from "../utils/errors";

// --- CODEX CHANGE START ---
// Codex modification - retry transient API failures with a short backoff so
// temporary Anthropic/Netlify saturation does not surface as a hard stop.
export const NOEMA_RETRY_DELAYS_MS = [500, 1000, 2000];
export const NOEMA_RETRY_FALLBACK_MSG = "Noema semble réfléchir encore.\nRéessaie dans quelques secondes.";

function wait(ms) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

export function isRetryableNoemaApiFailure(error, status) {
  if (status === 529) return true;
  const message = error?.message || "";
  return /network error|failed to fetch|fetch failure/i.test(message);
}
// --- CODEX CHANGE END ---

export function useNoemaApi({ historyRef, memoryRef }) {
  return useCallback(async () => {
    const h = trimHistory(historyRef.current);
    const systemPrompt = buildSystemPrompt(memoryRef.current);
    const headers = { "Content-Type":"application/json", "anthropic-version":"2023-06-01" };

    if (import.meta.env.DEV) {
      headers["x-api-key"] = import.meta.env.VITE_ANTHROPIC_KEY;
      headers["anthropic-dangerous-direct-browser-access"] = "true";
    }

    // --- CODEX CHANGE START ---
    for (let attempt = 0; attempt <= NOEMA_RETRY_DELAYS_MS.length; attempt += 1) {
      try {
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
      } catch (error) {
        const shouldRetry = isRetryableNoemaApiFailure(error, error?.status);

        if (shouldRetry && attempt < NOEMA_RETRY_DELAYS_MS.length) {
          await wait(NOEMA_RETRY_DELAYS_MS[attempt]);
          continue;
        }

        if (shouldRetry) {
          return NOEMA_RETRY_FALLBACK_MSG;
        }

        throw error;
      }
    }

    return NOEMA_RETRY_FALLBACK_MSG;
    // --- CODEX CHANGE END ---
  }, [historyRef, memoryRef]);
}
// --- CODEX CHANGE END ---
