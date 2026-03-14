// --- CODEX CHANGE START ---
// Codex modification - add targeted tests for helper behavior that the chat UI
// depends on for hidden UI payload parsing and history trimming.
import { describe, expect, it } from "vitest";
import { parseUI, stripUI, trimHistory } from "./helpers";

describe("helpers", () => {
  it("parseUI extracts the hidden JSON payload", () => {
    const raw = 'Bonjour<_ui>{"step":2,"forces":["clarte"]}</_ui>';
    expect(parseUI(raw)).toEqual({ step: 2, forces: ["clarte"] });
  });

  it("parseUI returns null safely when the UI payload is invalid", () => {
    expect(parseUI('Bonjour<_ui>{invalid}</_ui>')).toBeNull();
    expect(parseUI(null)).toBeNull();
  });

  it("stripUI removes the hidden UI payload from the visible message", () => {
    const raw = "Salut\n<_ui>{\"step\":1}</_ui>";
    expect(stripUI(raw)).toBe("Salut");
  });

  it("trimHistory keeps the first message and the most recent tail", () => {
    const history = Array.from({ length: 30 }, (_, index) => ({ role: "user", content: `m-${index}` }));
    const trimmed = trimHistory(history);
    expect(trimmed).toHaveLength(24);
    expect(trimmed[0]).toEqual(history[0]);
    expect(trimmed.at(-1)).toEqual(history.at(-1));
  });
});
// --- CODEX CHANGE END ---
