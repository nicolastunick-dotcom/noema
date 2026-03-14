import { MAX_HISTORY } from "../constants/config";

export const getTime = () => {
  const d = new Date();
  return d.getHours().toString().padStart(2,"0") + ":" + d.getMinutes().toString().padStart(2,"0");
};

export function fmt(text) {
  return text.split(/\n\n+/).filter(Boolean).map(p =>
    "<p>" + p
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br/>") +
    "</p>"
  ).join("");
}

export function parseUI(raw) {
  // --- CODEX CHANGE START ---
  // Codex modification - safely parse the optional UI metadata block without
  // assuming the model response is always a valid string/object payload.
  const source = typeof raw === "string" ? raw : "";
  const m = source.match(/<_ui>([\s\S]*?)<\/_ui>/);
  if (!m) return null;
  try {
    const parsed = JSON.parse(m[1].trim());
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
  // --- CODEX CHANGE END ---
}

export function stripUI(raw) {
  // --- CODEX CHANGE START ---
  // Codex modification - safely remove UI metadata even when the model output
  // is empty or malformed.
  return (typeof raw === "string" ? raw : "").replace(/<_ui>[\s\S]*?<\/_ui>/g, "").trim();
  // --- CODEX CHANGE END ---
}

export function trimHistory(h) {
  if (h.length <= MAX_HISTORY) return h;
  return [h[0], ...h.slice(-(MAX_HISTORY - 1))];
}

// Charset lisible sans ambiguïtés visuelles (0/O, 1/I/L)
const CODE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export function genCode() {
  let s = "";
  for (let i = 0; i < 5; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return "NOEMA-" + s;
}
