// netlify/functions/greffier.js
const HAIKU_MODEL = "claude-haiku-4-5-20251001";
const GREFFIER_TIMEOUT_MS = 6000;
let createClientLoader = null

const GREFFIER_SYSTEM = `Tu es l'Agent Greffier de Noema. Ton rôle est d'analyser silencieusement la conversation en cours pour extraire les "Insights" (forces, blocages, contradictions) et construire l'Ikigai de l'utilisateur.

Tu reçois l'historique de la conversation, ainsi que l'état actuel de la mémoire de l'utilisateur.
Ta mission est d'identifier si DE NOUVELLES informations importantes (Forces, Blocages, Contradictions, ou éléments d'Ikigai) ont émergé dans le TOUT DERNIER échange.

Tu dois répondre UNIQUEMENT avec un objet JSON strictement valide, qui sera utilisé pour mettre à jour l'interface en temps réel.

FORMAT JSON ATTENDU :
{
  "phase": "Immersion" | "Reflet" | "Analyse Profonde" | "Percée",
  "progression": 0,
  "conscience": {
    "racine": "...",
    "entretien": "...",
    "visible": "...",
    "contradictions": ["Contradiction 1", "Contradiction 2"]
  },
  "forces": ["Force 1", "Force 2"...], // Conserve les forces précédentes et ajoute les nouvelles (max 6)
  "blocages": {
    "racine": "...", // Mets à jour si découvert
    "entretien": "...",
    "visible": "..."
  },
  "contradictions": ["Contradiction 1"...], // Conserve les précédentes et ajoute les nouvelles
  "ikigai": {
    "aime": "...",
    "excelle": "...",
    "monde": "...",
    "paie": "...",
    "mission": "..."
  },
  "ui_insight_type": "bloom-red-intense" | "bloom-violet-shift" | "bloom-gold-awakening" | null,
  "etat": "blocked" | "exploring" | "clarity",
  "step": 1,
  "session_note": "...",
  "next_action": "..."
}

RÈGLES POUR 'phase' :
- "Immersion" : l'utilisateur dépose la matière, les signaux sont encore émergents
- "Reflet" : des schémas commencent à se dessiner
- "Analyse Profonde" : un blocage racine, un blocage d'entretien ou des contradictions deviennent lisibles
- "Percée" : une prise de conscience forte, une bascule intérieure ou une nouvelle clarté apparaît

RÈGLES POUR 'progression' :
- nombre de 0 à 100
- 0-25 = immersion
- 26-55 = reflet
- 56-80 = analyse profonde
- 81-100 = percée

RÈGLES POUR 'ui_insight_type' (Feedback Visuel Bloom) :
- "bloom-red-intense" : un nouveau BLOCAGE racine, un trauma, ou un nœud profond est identifié.
- "bloom-violet-shift" : une nouvelle CONTRADICTION forte ou un schéma de maintien devient visible.
- "bloom-gold-awakening" : une PERCÉE de conscience, un déclic, ou une clarté importante émerge.
- null : s'il n'y a pas d'insight majeur NOUVEAU dans le dernier message.

Si la mémoire actuelle contient déjà ces informations, NE RE-DÉCLENCHE PAS le ui_insight_type (mets null).

RÈGLES POUR 'etat' :
- "blocked" : l'utilisateur exprime un blocage fort, une résistance, ou une détresse émotionnelle
- "clarity" : une clarté, une percée ou un déclic vient d'émerger
- "exploring" : conversation normale d'exploration (par défaut)

RÈGLES POUR 'step' (entier de 1 à 6) :
1 = Exploration (qui tu es vraiment — début de conversation)
2 = Forces (au moins une force identifiée)
3 = Blocages (blocage racine ou d'entretien nommé)
4 = Contradictions (au moins un schéma contradictoire visible)
5 = Ikigai (construit ou en cours de construction)
6 = Action (premières étapes concrètes définies)
Déduis le step à partir de ce qui a été accompli dans la conversation.

RÈGLES POUR 'session_note' :
Résumé ultra-court (1 phrase max) de ce qui s'est passé dans cette session.
Exemple : "A exprimé une peur du rejet liée à son rapport au jugement."
Si la session est trop courte pour en tirer quelque chose, mets null.

RÈGLES POUR 'next_action' :
Tâche concrète et simple que l'utilisateur peut faire avant la prochaine session.
Exemple : "Écrire 3 moments où il s'est senti pleinement lui-même."
Si rien de concret n'a encore émergé dans la conversation, mets null.

Ne renvoie ABSOLUMENT RIEN d'autre que l'objet JSON valide.`;

function withTimeout(promise, ms, label) {
  let timer = null

  return Promise.race([
    promise.finally(() => {
      if (timer) clearTimeout(timer)
    }),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    }),
  ])
}

function clampProgression(value) {
  if (!Number.isFinite(value)) return null
  return Math.max(0, Math.min(100, Math.round(value)))
}

function inferPhase(conscience = {}, ikigai = {}) {
  if (ikigai?.mission) return "Percée"
  if (conscience.racine || (conscience.contradictions || []).length > 0) return "Analyse Profonde"
  if (conscience.entretien || conscience.visible) return "Reflet"
  return "Immersion"
}

function inferProgression(phase) {
  switch (phase) {
    case "Percée":
      return 85
    case "Analyse Profonde":
      return 45
    case "Reflet":
      return 30
    default:
      return 15
  }
}

function normalizeBloom(value, conscience, phase) {
  if (["bloom-red-intense", "bloom-violet-shift", "bloom-gold-awakening"].includes(value)) {
    return value
  }

  if (phase === "Percée") return "bloom-gold-awakening"
  if (conscience.racine) return "bloom-red-intense"
  if ((conscience.contradictions || []).length > 0) return "bloom-violet-shift"
  return null
}

function normalizeGreffierPayload(parsed, safeUserMemory = {}) {
  const memoryBlocages = safeUserMemory.blocages || {}
  const rawConscience = parsed?.conscience || {}
  const conscience = {
    racine: rawConscience.racine || parsed?.blocages?.racine || memoryBlocages.racine || "",
    entretien: rawConscience.entretien || parsed?.blocages?.entretien || memoryBlocages.entretien || "",
    visible: rawConscience.visible || parsed?.blocages?.visible || memoryBlocages.visible || "",
    contradictions: Array.isArray(rawConscience.contradictions)
      ? rawConscience.contradictions
      : Array.isArray(parsed?.contradictions)
        ? parsed.contradictions
        : Array.isArray(safeUserMemory.contradictions)
          ? safeUserMemory.contradictions
          : [],
  }

  const phase = typeof parsed?.phase === "string" && parsed.phase.trim()
    ? parsed.phase.trim()
    : inferPhase(conscience, parsed?.ikigai || safeUserMemory.ikigai || {})

  const progression = clampProgression(parsed?.progression) ?? inferProgression(phase)
  const forces = Array.isArray(parsed?.forces) ? parsed.forces : (safeUserMemory.forces || [])
  const ikigai = parsed?.ikigai && typeof parsed.ikigai === "object"
    ? parsed.ikigai
    : (safeUserMemory.ikigai || {})

  return {
    phase,
    progression,
    conscience,
    forces,
    blocages: {
      racine: conscience.racine,
      entretien: conscience.entretien,
      visible: conscience.visible,
    },
    contradictions: conscience.contradictions,
    ikigai,
    ui_insight_type: normalizeBloom(parsed?.ui_insight_type, conscience, phase),
    etat: typeof parsed?.etat === "string" ? parsed.etat : "exploring",
    step: typeof parsed?.step === "number" && parsed.step >= 1 && parsed.step <= 6 ? parsed.step : null,
    session_note: typeof parsed?.session_note === "string" && parsed.session_note ? parsed.session_note : null,
    next_action: typeof parsed?.next_action === "string" && parsed.next_action ? parsed.next_action : null,
  }
}

export async function runGreffier({ apiKey, sb, userId, sessionId, history, userMemory = {} }) {
  try {
    // Prevent sending the whole history if it's too long (Haiku contextualizes quickly)
    // Send the last 6 messages to get context of the recent exchange
    const recentHistory = Array.isArray(history) ? history.slice(-6) : [];
    const safeUserMemory = userMemory && typeof userMemory === 'object' ? userMemory : {};

    const memoryContext = `
ÉTAT ACTUEL DE LA MÉMOIRE (User ID: ${userId}) :
Forces connues : ${JSON.stringify(safeUserMemory.forces || [])}
Contradictions connues : ${JSON.stringify(safeUserMemory.contradictions || [])}
Blocages connus : ${JSON.stringify(safeUserMemory.blocages || {})}
Ikigai actuel : ${JSON.stringify(safeUserMemory.ikigai || {})}

Analyse les derniers messages et fournis le JSON mis à jour. S'il y a un nouvel insight fort, ajoute le flag ui_insight_type.
`;

    // Append memory context as a system/developer prompt equivalent, or just prepend to history
    // We'll put it in the system prompt for Haiku
    const fullSystem = `${GREFFIER_SYSTEM}\n\n${memoryContext}`;

    const filteredHistory = recentHistory.filter(m => m.role === 'user' || m.role === 'assistant');
    // Prefill forces Haiku to start directly with JSON, never with conversational text
    const messagesWithPrefill = [...filteredHistory, { role: 'assistant', content: '{' }];

    const payload = {
      model: HAIKU_MODEL,
      max_tokens: 1000,
      temperature: 0,
      system: fullSystem,
      messages: messagesWithPrefill,
    };

    const response = await withTimeout(fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    }), GREFFIER_TIMEOUT_MS, 'Greffier Anthropic fetch');

    if (!response.ok) {
      const errorBody = await response.clone().text().catch(() => "");
      console.warn("Greffier Haiku call failed:", {
        status: response.status,
        statusText: response.statusText,
        model: HAIKU_MODEL,
        body: errorBody,
      });
      return null;
    }

    const data = await response.json();
    let text = data.content?.[0]?.text || "";

    if (sb && userId && data.usage) {
      try {
        await sb.from('api_usage').insert({
          user_id: userId,
          model: HAIKU_MODEL,
          prompt_tokens: data.usage.input_tokens,
          completion_tokens: data.usage.output_tokens,
          session_id: sessionId
        });
      } catch (e) {
        console.warn("Failed to log Greffier usage", e);
      }
    }

    // Parse JSON safely — prepend "{" because we used it as a prefill
    text = "{" + text.trim();
    if (text.startsWith("{```json")) text = text.replace("{```json", "{");
    if (text.endsWith("```")) text = text.replace(/```$/, "");

    const parsed = normalizeGreffierPayload(JSON.parse(text.trim()), safeUserMemory);

    // Update Silent Database Tables (memory / user_insights)
    // As requested: "Met à jour silencieusement les tables user_insights et ikigai_state."
    // In our schema, it's the `memory` table that holds forces, blocages, ikigai.
    if (sb && userId) {
      try {
        await sb.from('memory').upsert({
          user_id: userId,
          forces: parsed.forces || safeUserMemory.forces,
          contradictions: parsed.contradictions || safeUserMemory.contradictions,
          blocages: parsed.blocages || safeUserMemory.blocages,
          ikigai: parsed.ikigai || safeUserMemory.ikigai,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });
      } catch (err) {
        console.warn("Greffier memory upsert failed:", err);
      }
      
      if (sessionId) {
        try {
          await sb.from('sessions').update({
            insights: {
              forces: parsed.forces,
              blocages: parsed.blocages,
              contradictions: parsed.contradictions,
              conscience: parsed.conscience,
              phase: parsed.phase,
              progression: parsed.progression,
              ui_insight_type: parsed.ui_insight_type,
            },
            ikigai: parsed.ikigai
          }).eq('id', sessionId);
        } catch (err) {
          console.warn("Greffier session update failed:", err);
        }
      }
    }

    return parsed;

  } catch (err) {
    console.warn("Greffier execution failed:", err);
    return null;
  }
}

// Export HTTP Handler pour appeler le Greffier via requêtes internes
export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let parsedBody
  try {
    parsedBody = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON body" })
    };
  }

  try {
    const { apiKey, token, userId, sessionId, history, userMemory } = parsedBody;

    if (!apiKey || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields: apiKey, userId" })
      };
    }

    const sb = await createSupabaseClientSafely(token);

    const parsed = await runGreffier({ apiKey, sb, userId, sessionId, history, userMemory });

    return {
      statusCode: 200,
      body: JSON.stringify(parsed || {})
    };
  } catch (err) {
    console.warn("Greffier HTTP Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

async function createSupabaseClientSafely(token) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

  if (!token || !supabaseUrl || !supabaseAnonKey) {
    return null
  }

  try {
    const createClient = await loadCreateClient()
    if (!createClient) return null

    return createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )
  } catch (err) {
    console.warn("Greffier Supabase client init failed:", err)
    return null
  }
}

async function loadCreateClient() {
  if (!createClientLoader) {
    createClientLoader = import('@supabase/supabase-js')
      .then(mod => typeof mod.createClient === 'function' ? mod.createClient : null)
      .catch(err => {
        console.warn("Greffier Supabase import failed:", err)
        return null
      })
  }

  return createClientLoader
}
