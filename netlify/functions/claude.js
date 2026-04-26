// netlify/functions/claude.js
// Proxy sécurisé — la clé API Anthropic ne passe jamais côté client
import { NOEMA_SYSTEM } from '../../src/constants/prompt.js'
import { buildQuotaState, getDailyLimitForTier, isTrialTier, resolveAccessTier } from '../../src/lib/entitlements.js'
import { buildProgressPromptContext } from '../../src/lib/progressionSignals.js'
import { runGreffier } from './greffier.js'
import { createClient } from '@supabase/supabase-js'

const FULL_ACCESS_LIMIT_MSG = "La limite du jour est atteinte. Reviens demain pour continuer."
const TRIAL_LIMIT_MSG = "Ton essai gratuit du jour est termine. Tu peux continuer avec Noema des maintenant."
const MODEL_HEAVY = 'claude-sonnet-4-6'         // synthèse (greffier)
const MODEL_LIGHT = 'claude-haiku-4-5-20251001' // échanges standard
const MAX_TOKENS_TRIAL      = 1200
const MAX_TOKENS_SUBSCRIBER = 1800
const MAX_MESSAGES_PER_REQUEST = 24
const MAX_USER_REQUESTS_PER_MINUTE = 30
const inMemoryUserRateLimit = new Map()

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquante côté serveur.')
  }
  return createClient(url, key)
}

function json(body, status = 200, request = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(request),
    },
  })
}

// Additional server-side burst protection.
// This is intentionally lightweight: DB quotas remain the source of truth for daily limits.
function enforceInMemoryRateLimit(userId) {
  const now = Date.now()
  const timestamps = (inMemoryUserRateLimit.get(userId) || []).filter((ts) => now - ts < 60_000)

  if (timestamps.length >= MAX_USER_REQUESTS_PER_MINUTE) {
    inMemoryUserRateLimit.set(userId, timestamps)
    return false
  }

  timestamps.push(now)
  inMemoryUserRateLimit.set(userId, timestamps)
  if (inMemoryUserRateLimit.size > 10000) inMemoryUserRateLimit.clear()
  return true
}

export default async (request) => {
  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(request)
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
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders(request) } }
    )
  }
  let sbAdmin
  try {
    sbAdmin = getSupabaseAdmin()
  } catch (error) {
    return json({ error: { message: error.message } }, 500, request)
  }
  const { data: { user: verifiedUser }, error: authError } = await sbAdmin.auth.getUser(token)
  if (authError || !verifiedUser) {
    return json({ error: { message: 'Session invalide ou expirée.' } }, 401, request)
  }
  const userId = verifiedUser.id

  // Security layer 1: reject unauthenticated public traffic before any model work starts.
  if (!enforceInMemoryRateLimit(userId)) {
    return json({ error: { message: 'Trop de requêtes. Attends une minute avant de continuer.' } }, 429, request)
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('[claude] ANTHROPIC_API_KEY manquante dans process.env')
    return new Response(
      JSON.stringify({ error: { message: 'ANTHROPIC_API_KEY non configurée.' } }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(request) } }
    )
  }

  // ── Résolution d'entitlement ──────────────────────────────────
  // Autorité finale d'accès : backend uniquement.
  // Depuis Sprint 8, tout utilisateur authentifié entre au moins en essai gratuit.
  // Les accès complets restent résolus ici: admin → abonnement actif → invite beta persistée.
  let isAdmin = false
  let hasInvite = false
  let hasSubscription = false

  // 1. Admin via profiles.is_admin
  const { data: profile } = await sbAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle()
  if (profile?.is_admin === true) {
    isAdmin = true
  }

  // 2. Abonnement actif ou en période d'essai
  if (!isAdmin) {
    const { data: sub } = await sbAdmin
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .maybeSingle()
    if (sub) hasSubscription = true
  }

  // 3. Invite beta liée en base (persistée via validate-invite.js avec JWT)
  if (!isAdmin && !hasSubscription) {
    const { data: invite } = await sbAdmin
      .from('invites')
      .select('id')
      .eq('user_id', userId)
      .eq('active', true)
      .maybeSingle()
    if (invite) hasInvite = true
  }

  const accessTier = resolveAccessTier({
    isAuthenticated: true,
    isAdmin,
    hasInvite,
    hasSubscription,
  })

  // ── Chargement mémoire utilisateur (server-side) ─────────────
  // Sprint 3.1 : les deux queries tournent en parallèle pour éviter toute latence additionnelle.
  // memory  → forces, blocages, contradictions, ikigai, session_notes
  // sessions → step (absent de la table memory — pas de migration SQL requise)
  let serverMemoryContext = ''
  const [{ data: memRow }, { data: lastSessionRow }, { data: recentSessions }, { data: lastJournalEntry }] = await Promise.all([
    sbAdmin
      .from('memory')
      .select('forces, contradictions, blocages, ikigai, session_notes, session_count')
      .eq('user_id', userId)
      .maybeSingle(),
    sbAdmin
      .from('sessions')
      .select('step')
      .eq('user_id', userId)
      .order('ended_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    sbAdmin
      .from('sessions')
      .select('insights, next_action, session_note, step, ended_at')
      .eq('user_id', userId)
      .order('ended_at', { ascending: false })
      .limit(5),
    sbAdmin
      .from('journal_entries')
      .select('content, entry_date, next_action')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])
  if (memRow || lastSessionRow) {
    serverMemoryContext = buildServerMemoryContext(memRow, lastSessionRow?.step ?? null)
  }
  serverMemoryContext += buildProgressPromptContext({ sessions: recentSessions || [], journalEntry: lastJournalEntry || null })

  try {
    const body = await request.json()
    const rawMessages = Array.isArray(body.messages) ? body.messages.slice(-MAX_MESSAGES_PER_REQUEST) : []
    const isOpeningRequest = body.consume_quota === false
      && rawMessages.length === 1
      && rawMessages[0]?.role === 'user'
      && typeof rawMessages[0]?.content === 'string'
      && rawMessages[0].content.startsWith('[SYSTÈME — ne pas afficher] Démarre la session.')
    const shouldConsumeQuota = !isOpeningRequest

    // ── Quota produit (journalier) ────────────────────────────────
    // Unique source de vérité : backend seulement depuis Sprint 1.
    // Sprint 8 : le tier d'accès pilote maintenant la limite journalière.
    const dailyLimit = getDailyLimitForTier(accessTier)
    let quotaUsed = 0

    if (dailyLimit != null && shouldConsumeQuota) {
      const today = new Date().toISOString().slice(0, 10)
      const { data: quotaRows, error: quotaError } = await sbAdmin
        .rpc('increment_rate_limit_if_allowed', {
          p_user_id: userId,
          p_date: today,
          p_limit: dailyLimit,
        })

      if (quotaError) {
        console.error('[claude] Quota atomique indisponible:', quotaError.message)
        return json({ error: { message: 'Quota indisponible. Réessaie dans un instant.' } }, 503, request)
      }

      const quotaResult = Array.isArray(quotaRows) ? quotaRows[0] : quotaRows
      quotaUsed = quotaResult?.count || 0

      if (!quotaResult?.allowed) {
        return json({
          content: isTrialTier(accessTier) ? TRIAL_LIMIT_MSG : FULL_ACCESS_LIMIT_MSG,
          _greffier: null,
          _quota: buildQuotaState({ tier: accessTier, used: quotaUsed }),
          _access: { tier: accessTier },
          _session_limit: true,
          _trial_ended: isTrialTier(accessTier),
        }, 200, request)
      }
    } else if (dailyLimit != null) {
      const today = new Date().toISOString().slice(0, 10)
      const { data: rl } = await sbAdmin
        .from('rate_limits')
        .select('count')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle()
      quotaUsed = rl?.count || 0
    }
    const messages   = rawMessages
    const sessionId  = body.session_id || null
    const userMemory = body.user_memory && typeof body.user_memory === 'object' ? body.user_memory : {}
    // Mini-sprint coût : Greffier différencié — /3 pour les trials, /2 pour les abonnés.
    const userMsgCount = messages.filter(m => m.role === 'user').length
    const greffierInterval = isTrialTier(accessTier) ? 3 : 2
    const shouldRunGreffier = userMsgCount > 0 && userMsgCount % greffierInterval === 0
    if (!sessionId && shouldRunGreffier) {
      console.warn('[claude] Greffier actif mais session_id absent — historique session non mis à jour')
    }

    // Whitelist des champs autorisés — ne jamais forwarder le body brut
    // Le system prompt est toujours NOEMA_SYSTEM + serverMemoryContext (chargé depuis DB ci-dessus)
    // Security layer 2: strict request shaping. Only a safe subset of the body reaches Anthropic.
    // Hybrid model: Haiku pour les échanges standard, Sonnet lors des synthèses Greffier.
    // Prompt caching : les deux blocs system sont marqués ephemeral pour réduire les coûts d'entrée.
    const systemBlocks = [
      {
        type: "text",
        text: NOEMA_SYSTEM,
        cache_control: { type: "ephemeral" }
      },
      ...(serverMemoryContext ? [{
        type: "text",
        text: serverMemoryContext,
        cache_control: { type: "ephemeral" }
      }] : [])
    ]
    const allowed = {
      model:      shouldRunGreffier ? MODEL_HEAVY : MODEL_LIGHT,
      max_tokens: Math.min(body.max_tokens || 1100, isTrialTier(accessTier) ? MAX_TOKENS_TRIAL : MAX_TOKENS_SUBSCRIBER),
      system:     systemBlocks,
      messages:   rawMessages,
      stream:     false,
    }
    const greffierPromise = shouldRunGreffier
      ? runGreffier({ apiKey, sb: sbAdmin, userId, sessionId, history: messages, userMemory: memRow ?? {} })
          .then((result) => {
            console.log('[Greffier] succès:', JSON.stringify(result)?.slice(0, 120))
            return result
          })
          .catch((e) => {
            console.error('[Greffier] erreur:', e.message)
            return null
          })
      : Promise.resolve(null)

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31',
      },
      body: JSON.stringify(allowed),
    })

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text().catch(() => '')
      console.error('[claude] Anthropic HTTP error:', anthropicResponse.status, errText)
      return json({ error: { message: `Anthropic HTTP ${anthropicResponse.status}` } }, anthropicResponse.status, request)
    }

    const data = await anthropicResponse.json()
    const fullText = Array.isArray(data.content)
      ? data.content
        .filter((block) => block?.type === 'text' && typeof block.text === 'string')
        .map((block) => block.text)
        .join('')
      : ''
    const quota = buildQuotaState({ tier: accessTier, used: quotaUsed })

    if (userId && data.usage) {
      sbAdmin.from('api_usage').insert({
        user_id:           userId,
        model:             allowed.model,
        prompt_tokens:     data.usage.input_tokens,
        completion_tokens: data.usage.output_tokens,
        session_id:        sessionId, // Sprint 4 : session_id propagé depuis le frontend
      }).then(() => {}, e => console.log('[Usage] log failed:', e.message))
    }

    console.log('[Greffier]', shouldRunGreffier ? 'déclenchement' : 'skipped', '— userMsgCount:', userMsgCount, 'userId:', userId)
    const greffierResult = await greffierPromise

    return json({
      content: fullText,
      _greffier: greffierResult,
      _quota: quota,
      _access: { tier: accessTier },
    }, 200, request)

  } catch (err) {
    return json({ error: { message: err.message } }, 500, request)
  }
}

// Construit le contexte mémoire à partir de la table memory (côté serveur).
// Même logique que buildMemoryContext() dans src/lib/supabase.js — dupliqué intentionnellement
// pour garder le backend indépendant du frontend sans partager de module.
// Sprint 3.1 : lastStep est lu depuis sessions.step (pas de colonne step dans memory).
function buildServerMemoryContext(memory, lastStep = null) {
  if (!memory && lastStep === null) return ''
  const mem            = memory || {}
  const count          = mem.session_count || 0
  const notes          = (mem.session_notes || []).slice(-5).map(n => `- ${n}`).join('\n')
  const forces         = (mem.forces || []).join(', ')
  const contradictions = (mem.contradictions || []).join(', ')
  const ikigai         = mem.ikigai   || {}
  const blocages       = mem.blocages || {}
  const step           = lastStep !== null ? lastStep : null

  const hasData = count > 0 || notes || forces || contradictions || step !== null ||
    Object.values(ikigai).some(v => v) || Object.values(blocages).some(v => v)
  if (!hasData) return ''

  const sessionLabel = count > 0
    ? `${count} session${count > 1 ? 's' : ''} précédente${count > 1 ? 's' : ''}`
    : 'première session'

  return [
    `\n\n---\nMÉMOIRE INTER-SESSIONS (${sessionLabel}) :`,
    notes          ? `Notes des dernières sessions :\n${notes}` : '',
    forces         ? `Forces identifiées : ${forces}` : '',
    contradictions ? `Contradictions repérées : ${contradictions}` : '',
    blocages.racine    ? `Blocage racine : ${blocages.racine}` : '',
    blocages.entretien ? `Ce qui l'entretient : ${blocages.entretien}` : '',
    blocages.visible   ? `Manifestation visible : ${blocages.visible}` : '',
    ikigai.aime    ? `Ikigai — ce qu'il aime : ${ikigai.aime}` : '',
    ikigai.excelle ? `Ikigai — ce en quoi il excelle : ${ikigai.excelle}` : '',
    ikigai.monde   ? `Ikigai — besoin du monde : ${ikigai.monde}` : '',
    ikigai.paie    ? `Ikigai — ce pour quoi il peut être payé : ${ikigai.paie}` : '',
    ikigai.mission ? `Ikigai — mission : ${ikigai.mission}` : '',
    step !== null  ? `Progression actuelle : étape ${step}/10` : '',
    '---',
    "Appuie-toi sur ces données pour assurer la continuité. Rappelle l'évolution par rapport aux sessions précédentes quand c'est pertinent.",
  ].filter(Boolean).join('\n')
}

function corsHeaders(request = null) {
  const fallbackOrigin = process.env.NOEMA_APP_ORIGIN || process.env.URL || 'https://noemaapp.netlify.app'
  const allowedOrigins = (process.env.NOEMA_ALLOWED_ORIGINS || fallbackOrigin)
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)

  // En développement local, autoriser automatiquement Vite + netlify dev
  const isDev = process.env.NODE_ENV !== 'production' || process.env.NETLIFY_DEV === 'true'
  const devOrigins = isDev ? ['http://localhost:5173', 'http://localhost:8888', 'http://localhost:3000'] : []
  const allAllowed = [...allowedOrigins, ...devOrigins]

  const requestOrigin = request?.headers?.get?.('Origin')

  let allowedOrigin
  if (!requestOrigin) {
    // Requête sans Origin (ex: curl, Postman) — laisser passer en dev, bloquer en prod
    allowedOrigin = isDev ? '*' : allowedOrigins[0]
  } else if (allAllowed.includes(requestOrigin)) {
    allowedOrigin = requestOrigin
  } else {
    console.warn(`[CORS] Origine refusée : ${requestOrigin} (attendu : ${allAllowed.join(', ')})`)
    allowedOrigin = allowedOrigins[0] // fallback — le navigateur bloquera de son côté
  }

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}
