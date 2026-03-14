// --- CODEX CHANGE START ---
// Codex modification - verify the UI-only mapping logic that powers the
// session and sub-session progress panel.
import { describe, expect, it } from "vitest";
import {
  getSessionNumber,
  getSessionTitle,
  getSubSessionIndex,
} from "../utils/sessionProgress";

describe("SessionProgress helpers", () => {
  it("normalizes the current session into the supported 1-10 range", () => {
    expect(getSessionNumber(0)).toBe(1);
    expect(getSessionNumber(4)).toBe(4);
    expect(getSessionNumber(12)).toBe(10);
  });

  it("returns the expected Noema session title", () => {
    expect(getSessionTitle(1)).toBe("Session 1 — État actuel");
    expect(getSessionTitle(8)).toBe("Session 8 — Révélation de l'Ikigai");
  });

  it("maps messages_today into the correct sub-session bucket", () => {
    expect(getSubSessionIndex(0)).toBe(1);
    expect(getSubSessionIndex(5)).toBe(1);
    expect(getSubSessionIndex(6)).toBe(2);
    expect(getSubSessionIndex(15)).toBe(3);
    expect(getSubSessionIndex(21)).toBe(5);
    expect(getSubSessionIndex(30)).toBe(6);
    expect(getSubSessionIndex(40)).toBe(7);
    expect(getSubSessionIndex(52)).toBe(7);
  });
});
// --- CODEX CHANGE END ---
