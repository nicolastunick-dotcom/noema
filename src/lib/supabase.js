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
  // Retourne vide seulement si l'objet est absent — session_count à 0 ou null est acceptable
  if (!memory) return "";

  const count         = memory.session_count || 0;
  const notes         = (memory.session_notes || []).slice(-5).map(n => `- ${n}`).join("\n");
  const forces        = (memory.forces || []).join(", ");
  const contradictions = (memory.contradictions || []).join(", ");
  const ikigai        = memory.ikigai   || {};
  const blocages      = memory.blocages || {};
  const step          = typeof memory.step === "number" ? memory.step : null;

  // Vérifie qu'il y a au moins une donnée exploitable avant de construire le contexte
  const hasData = count > 0 || notes || forces || contradictions ||
    Object.values(ikigai).some(v => v) || Object.values(blocages).some(v => v);
  if (!hasData) return "";

  const sessionLabel = count > 0
    ? `${count} session${count > 1 ? "s" : ""} précédente${count > 1 ? "s" : ""}`
    : "première session";

  return [
    `\n\n---\nMÉMOIRE INTER-SESSIONS (${sessionLabel}) :`,
    notes         ? `Notes des dernières sessions :\n${notes}` : "",
    forces        ? `Forces identifiées : ${forces}` : "",
    contradictions ? `Contradictions repérées : ${contradictions}` : "",
    blocages.racine    ? `Blocage racine : ${blocages.racine}` : "",
    blocages.entretien ? `Ce qui l'entretient : ${blocages.entretien}` : "",
    blocages.visible   ? `Manifestation visible : ${blocages.visible}` : "",
    ikigai.aime    ? `Ikigai — ce qu\'il aime : ${ikigai.aime}` : "",
    ikigai.excelle ? `Ikigai — ce en quoi il excelle : ${ikigai.excelle}` : "",
    ikigai.monde   ? `Ikigai — besoin du monde : ${ikigai.monde}` : "",
    ikigai.paie    ? `Ikigai — ce pour quoi il peut être payé : ${ikigai.paie}` : "",
    ikigai.mission ? `Ikigai — mission : ${ikigai.mission}` : "",
    step !== null  ? `Progression actuelle : étape ${step}/10` : "",
    "---",
    "Appuie-toi sur ces données pour assurer la continuité. Rappelle l\'évolution par rapport aux sessions précédentes quand c\'est pertinent.",
  ].filter(Boolean).join("\n");
}

export function buildSystemPrompt(memory) {
  return NOEMA_SYSTEM + buildMemoryContext(memory);
}
