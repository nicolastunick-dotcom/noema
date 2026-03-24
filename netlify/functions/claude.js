// netlify/functions/claude.js
// Proxy sécurisé — la clé API Anthropic ne passe jamais côté client
import { NOEMA_SYSTEM } from '../../src/constants/prompt.js'
import { runGreffier } from './greffier.js'
import { createClient } from '@supabase/supabase-js'

const SESSION_LIMIT = 25
const SESSION_LIMIT_MSG = "La session du jour est terminée. Mais pas ton évolution. Reviens demain pour continuer ton ascension."

function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return null
  try { return createClient(url, key) } catch { return null }
}

export default async (request) => {
  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders()
    })
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: { message: 'ANTHROPIC_API_KEY non configurée.' } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body = await request.json()

    // ── Limite de session (25 messages par user par jour) ────────
    const userId = body.user_id || null
    if (userId) {
      const sbAdmin = getSupabaseAdmin()
      if (sbAdmin) {
        const today = new Date().toISOString().slice(0, 10)
        const { data: rl } = await sbAdmin
          .from('rate_limits')
          .select('count')
          .eq('user_id', userId)
          .eq('date', today)
          .maybeSingle()
        const count = rl?.count || 0
        if (count >= SESSION_LIMIT) {
          return new Response(
            JSON.stringify({ content: [{ text: SESSION_LIMIT_MSG }], _session_limit: true }),
            { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
          )
        }
        // Incrément
        await sbAdmin.from('rate_limits').upsert(
          { user_id: userId, date: today, count: count + 1 },
          { onConflict: 'user_id,date' }
        )
      }
    }

    // Whitelist des champs autorisés — ne jamais forwarder le body brut
    // Le system prompt est toujours NOEMA_SYSTEM (serveur) + memory_context optionnel (client)
    const memoryContext = typeof body.memory_context === 'string' ? body.memory_context : ''
    const allowed = {
      model:      body.model      || 'claude-sonnet-4-6',
      max_tokens: Math.min(body.max_tokens || 1400, 4096),
      system:     NOEMA_SYSTEM + memoryContext,
      messages:   Array.isArray(body.messages) ? body.messages : [],
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(allowed),
    })

    const data = await response.json()

    // ── Greffier — analyse silencieuse ──────────────────────────
    // Déclenche tous les 3 messages ou si le dernier message user > 40 chars
    const messages      = allowed.messages
    const msgCount      = messages.filter(m => m.role === 'user').length
    const lastUserMsg   = [...messages].reverse().find(m => m.role === 'user')
    const lastUserLen   = typeof lastUserMsg?.content === 'string' ? lastUserMsg.content.length : 0
    const shouldRunGreffier = (msgCount % 3 === 0) || (lastUserLen > 40)

    let greffierPromise = Promise.resolve(null)
    if (shouldRunGreffier) {
      const userId    = body.user_id    || null
      const sessionId = body.session_id || null
      const userMemory = body.user_memory && typeof body.user_memory === 'object' ? body.user_memory : {}
      greffierPromise = runGreffier({ apiKey, sb: null, userId, sessionId, history: messages, userMemory })
        .catch(e => { console.warn('[Greffier] échec silencieux:', e.message); return null })
    }

    const [greffierResult] = await Promise.all([greffierPromise])

    return new Response(JSON.stringify({ ...data, _greffier: greffierResult }), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders()
      }
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: { message: err.message } }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
    )
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export const config = {
  path: '/.netlify/functions/claude'
}
