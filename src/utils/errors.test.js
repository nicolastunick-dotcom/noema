// --- CODEX CHANGE START ---
// Codex modification - add focused tests for auth messaging and Anthropic
// overload handling so UI error behavior remains predictable.
import { describe, expect, it } from "vitest";
import {
  GENERIC_CHAT_ERROR_MSG,
  OVERLOADED_MSG,
  getChatErrorMessage,
  isOverloadedError,
  mapAuthErrorMessage,
} from "./errors";

describe("errors", () => {
  it("maps known auth failures to friendly French messages", () => {
    expect(mapAuthErrorMessage("Invalid login credentials")).toBe("Email ou mot de passe incorrect.");
    expect(mapAuthErrorMessage("User already registered")).toBe("Cet email est déjà utilisé.");
  });

  it("detects overloaded API failures by status or message", () => {
    expect(isOverloadedError(529, "HTTP 529")).toBe(true);
    expect(isOverloadedError(500, "Overloaded service")).toBe(true);
    expect(isOverloadedError(500, "Other error")).toBe(false);
  });

  it("returns the dedicated overload message when the backend is saturated", () => {
    expect(getChatErrorMessage({ status: 529, message: "HTTP 529" })).toBe(OVERLOADED_MSG);
    expect(getChatErrorMessage({ status: 500, message: "Other error" })).toBe(GENERIC_CHAT_ERROR_MSG);
  });
});
// --- CODEX CHANGE END ---
