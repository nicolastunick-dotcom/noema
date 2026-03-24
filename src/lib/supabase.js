import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../constants/config";
import { NOEMA_SYSTEM } from "../constants/prompt";

function createSB() {
  if (!SUPABASE_URL || SUPABASE_URL === "YOUR_SUPABASE_URL") {
    console.warn("[Noema] Supabase non configuré — variables manquantes");
    return null;
  }
  try {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("[Noema] Supabase client créé ✓", SUPABASE_URL);
    return client;
  } catch (e) {
    console.error("[Noema] Erreur création client Supabase:", e);
    return null;
  }
}

export const sb = createSB();

export function buildMemoryContext(memory) {
  if (!memory || !memory.session_count) return "";
  const notes  = (memory.session_notes || []).slice(-6).map(n => `- ${n}`).join("\n");
  const forces = (memory.forces || []).join(", ");
  const ikigai = memory.ikigai || {};
  return [
    `\n\n---\nMÉMOIRE INTER-SESSIONS (${memory.session_count} session${memory.session_count > 1 ? "s" : ""} précédente${memory.session_count > 1 ? "s" : ""}) :`,
    notes  ? `Notes des dernières sessions :\n${notes}` : "",
    forces ? `Forces identifiées jusqu'ici : ${forces}` : "",
    ikigai.aime    ? `Ikigai — ce qu'il aime : ${ikigai.aime}`                   : "",
    ikigai.excelle ? `Ikigai — ce en quoi il excelle : ${ikigai.excelle}`         : "",
    ikigai.monde   ? `Ikigai — besoin du monde : ${ikigai.monde}`                 : "",
    ikigai.paie    ? `Ikigai — ce pour quoi il peut être payé : ${ikigai.paie}`   : "",
    ikigai.mission ? `Ikigai — mission : ${ikigai.mission}`                       : "",
    "---",
    "Appuie-toi sur ces données pour assurer la continuité. Rappelle l'évolution par rapport aux sessions précédentes quand c'est pertinent.",
  ].filter(Boolean).join("\n");
}

export function buildSystemPrompt(memory) {
  return NOEMA_SYSTEM + buildMemoryContext(memory);
}
