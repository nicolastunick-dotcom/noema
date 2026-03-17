// netlify/functions/greffier.js
const HAIKU_MODEL = "claude-haiku-4-5-20251001";
let createClientLoader = null

const GREFFIER_SYSTEM = `Tu es l'Agent Greffier de Noema. Ton rôle est d'analyser silencieusement la conversation en cours pour extraire les "Insights" (forces, blocages, contradictions) et construire l'Ikigai de l'utilisateur.

Tu reçois l'historique de la conversation, ainsi que l'état actuel de la mémoire de l'utilisateur.
Ta mission est d'identifier si DE NOUVELLES informations importantes (Forces, Blocages, Contradictions, ou éléments d'Ikigai) ont émergé dans le TOUT DERNIER échange.

Tu dois répondre UNIQUEMENT avec un objet JSON strictement valide, qui sera utilisé pour mettre à jour l'interface en temps réel.

FORMAT JSON ATTENDU :
{
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
  "ui_insight_type": "red" | "orange" | "violet" | null
}

RÈGLES POUR 'ui_insight_type' (Feedback Visuel Bloom) :
- "red" : un nouveau BLOCAGE très profond, une peur racine, ou un trauma vient d'être identifié.
- "orange" : une nouvelle CONTRADICTION forte ou un schéma de maintien est mis en évidence.
- "violet" : une nouvelle FORCE majeure, un talent, ou un pilier très clair de l'IKIGAI vient d'apparaître.
- null : s'il n'y a pas d'insight majeur NOUVEAU dans le dernier message.

Si la mémoire actuelle contient déjà ces informations, NE RE-DÉCLENCHE PAS le ui_insight_type (mets null).
Ne renvoie ABSOLUMENT RIEN d'autre que l'objet JSON valide.`;

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

    const payload = {
      model: HAIKU_MODEL,
      max_tokens: 1000,
      temperature: 0,
      system: fullSystem,
      messages: recentHistory.filter(m => m.role === 'user' || m.role === 'assistant'),
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn("Greffier Haiku call failed:", response.status);
      return null;
    }

    const data = await response.json();
    let text = data.content?.[0]?.text || "";

    if (sb && userId && data.usage) {
      await sb.from('api_usage').insert({
        user_id: userId,
        model: HAIKU_MODEL,
        prompt_tokens: data.usage.input_tokens,
        completion_tokens: data.usage.output_tokens,
        session_id: sessionId
      }).catch(e => console.warn("Failed to log Greffier usage", e));
    }

    // Parse JSON safely
    text = text.trim();
    if (text.startsWith("```json")) text = text.replace("```json", "");
    if (text.startsWith("```")) text = text.replace("```", "");
    if (text.endsWith("```")) text = text.replace(/```$/, "");
    
    const parsed = JSON.parse(text.trim());

    // Update Silent Database Tables (memory / user_insights)
    // As requested: "Met à jour silencieusement les tables user_insights et ikigai_state."
    // In our schema, it's the `memory` table that holds forces, blocages, ikigai.
    if (sb && userId) {
      await sb.from('memory').upsert({
        user_id: userId,
        forces: parsed.forces || safeUserMemory.forces,
        contradictions: parsed.contradictions || safeUserMemory.contradictions,
        blocages: parsed.blocages || safeUserMemory.blocages,
        ikigai: parsed.ikigai || safeUserMemory.ikigai,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });
      
      // Also update the current session's snapshot
      if (sessionId) {
        await sb.from('sessions').update({
          insights: { forces: parsed.forces, blocages: parsed.blocages, contradictions: parsed.contradictions },
          ikigai: parsed.ikigai
        }).eq('id', sessionId);
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
