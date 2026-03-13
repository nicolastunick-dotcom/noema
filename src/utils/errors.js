// --- CODEX CHANGE START ---
// Codex modification - keep auth and API error messages in one tested place so
// the UI can stay small and consistent as the product grows.
export const OVERLOADED_MSG = "Noema est momentanément surchargé. Réessaie dans quelques secondes.";
export const GENERIC_CHAT_ERROR_MSG = "Une erreur est survenue. Réessaie dans un instant.";

export function mapAuthErrorMessage(message) {
  if (!message) return "Une erreur est survenue.";
  if (message.includes("Invalid login")) return "Email ou mot de passe incorrect.";
  if (message.includes("already registered")) return "Cet email est déjà utilisé.";
  if (message.includes("Password")) return "Mot de passe trop court (8 caractères min).";
  if (message.includes("rate limit")) return "Trop de tentatives — attends quelques minutes.";
  return message;
}

export function isOverloadedError(status, message) {
  return status === 529 || /overloaded/i.test(message || "");
}

export function getChatErrorMessage(error) {
  return isOverloadedError(error?.status, error?.message)
    ? OVERLOADED_MSG
    : GENERIC_CHAT_ERROR_MSG;
}
// --- CODEX CHANGE END ---
