// --- CODEX CHANGE START ---
// Codex modification - cover the retryability rules so transient API failures
// stay explicit and stable as the hook evolves.
import { describe, expect, it } from "vitest";
import {
  NOEMA_RETRY_DELAYS_MS,
  NOEMA_RETRY_FALLBACK_MSG,
  isRetryableNoemaApiFailure,
} from "./useNoemaApi";

describe("useNoemaApi helpers", () => {
  it("exposes the expected retry backoff schedule and fallback message", () => {
    expect(NOEMA_RETRY_DELAYS_MS).toEqual([500, 1000, 2000]);
    expect(NOEMA_RETRY_FALLBACK_MSG).toBe("Noema semble réfléchir encore.\nRéessaie dans quelques secondes.");
  });

  it("retries only temporary overload and fetch/network failures", () => {
    expect(isRetryableNoemaApiFailure({ message: "Failed to fetch" }, 500)).toBe(true);
    expect(isRetryableNoemaApiFailure({ message: "Network Error" }, 503)).toBe(true);
    expect(isRetryableNoemaApiFailure({ message: "fetch failure" }, 500)).toBe(true);
    expect(isRetryableNoemaApiFailure({ message: "Other error" }, 529)).toBe(true);
    expect(isRetryableNoemaApiFailure({ message: "Unauthorized" }, 401)).toBe(false);
  });
});
// --- CODEX CHANGE END ---
