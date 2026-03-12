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
  const m = raw.match(/<_ui>([\s\S]*?)<\/_ui>/);
  if (!m) return null;
  try { return JSON.parse(m[1].trim()); } catch { return null; }
}

export function stripUI(raw) {
  return raw.replace(/<_ui>[\s\S]*?<\/_ui>/g, "").trim();
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
