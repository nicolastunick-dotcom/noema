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

  console.log('[claude] requête reçue:', request.method)

  // ── Vérification JWT Supabase ─────────────────────────────────
  const authHeader = request.headers.get('Authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return new Response(
      JSON.stringify({ error: { message: 'Non autorisé.' } }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
    )
  }
  const sbAdmin = getSupabaseAdmin()
  if (!sbAdmin) {
    return new Response(
      JSON.stringify({ error: { message: 'Configuration serveur manquante.' } }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
    )
  }
  const { data: { user: verifiedUser }, error: authError } = await sbAdmin.auth.getUser(token)
  if (authError || !verifiedUser) {
    return new Response(
      JSON.stringify({ error: { message: 'Session invalide ou expirée.' } }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
    )
  }
  const userId = verifiedUser.id

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('[claude] ANTHROPIC_API_KEY manquante dans process.env')
    return new Response(
      JSON.stringify({ error: { message: 'ANTHROPIC_API_KEY non configurée.' } }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
    )
  }

  try {
    const body = await request.json()

    // ── Limite de session (25 messages par user par jour) ────────
    // userId est déjà extrait du JWT vérifié — on n'utilise plus body.user_id
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

    // ── Log usage Sonnet dans api_usage ──────────────────────────
    if (userId && data.usage) {
      const sbAdmin = getSupabaseAdmin()
      if (sbAdmin) {
        sbAdmin.from('api_usage').insert({
          user_id:           userId,
          model:             allowed.model,
          prompt_tokens:     data.usage.input_tokens,
          completion_tokens: data.usage.output_tokens,
        }).catch(e => console.log('[Usage] log failed:', e.message))
      }
    }

    // ── Greffier — analyse silencieuse (chaque message) ─────────
    const messages   = allowed.messages
    const sessionId  = body.session_id || null
    const userMemory = body.user_memory && typeof body.user_memory === 'object' ? body.user_memory : {}
    console.log('[Greffier] déclenchement, msgs:', messages.length, 'userId:', userId)
    const greffierPromise = runGreffier({ apiKey, sb: null, userId, sessionId, history: messages, userMemory })
      .then(r  => { console.log('[Greffier] succès:', JSON.stringify(r)?.slice(0, 120)); return r })
      .catch(e => { console.error('[Greffier] erreur:', e.message); return null })

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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

export const config = {
  path: '/.netlify/functions/claude'
}
