// netlify/functions/claude.js
// Proxy sécurisé — la clé API Anthropic ne passe jamais côté client
import { NOEMA_SYSTEM } from '../../src/constants/prompt.js'
import { buildQuotaState, getDailyLimitForTier, isTrialTier, resolveAccessTier } from '../../src/lib/entitlements.js'
import { buildProgressPromptContext } from '../../src/lib/progressionSignals.js'
import { runGreffier } from './greffier.js'
import { createClient } from '@supabase/supabase-js'

const FULL_ACCESS_LIMIT_MSG = "La limite du jour est atteinte. Reviens demain pour continuer."
const TRIAL_LIMIT_MSG = "Ton essai gratuit du jour est termine. Tu peux continuer avec Noema des maintenant."

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
    const shouldConsumeQuota = body.consume_quota !== false

    // ── Quota produit (journalier) ────────────────────────────────
    // Unique source de vérité : backend seulement depuis Sprint 1.
    // Sprint 8 : le tier d'accès pilote maintenant la limite journalière.
    const dailyLimit = getDailyLimitForTier(accessTier)
    let quotaUsed = 0

    if (dailyLimit != null) {
      const today = new Date().toISOString().slice(0, 10)
      const { data: rl } = await sbAdmin
        .from('rate_limits')
        .select('count')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle()
      quotaUsed = rl?.count || 0

      if (shouldConsumeQuota && quotaUsed >= dailyLimit) {
        return new Response(JSON.stringify({
          content: isTrialTier(accessTier) ? TRIAL_LIMIT_MSG : FULL_ACCESS_LIMIT_MSG,
          _greffier: null,
          _quota: buildQuotaState({ tier: accessTier, used: quotaUsed }),
          _access: { tier: accessTier },
          _session_limit: true,
          _trial_ended: isTrialTier(accessTier),
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders()
          }
        })
      }

      if (shouldConsumeQuota) {
        quotaUsed += 1
        // Incrément — seule écriture quota produit dans tout le système
        await sbAdmin.from('rate_limits').upsert(
          { user_id: userId, date: today, count: quotaUsed },
          { onConflict: 'user_id,date' }
        )
      }
    }

    const quota = buildQuotaState({ tier: accessTier, used: quotaUsed })

    // Whitelist des champs autorisés — ne jamais forwarder le body brut
    // Le system prompt est toujours NOEMA_SYSTEM + serverMemoryContext (chargé depuis DB ci-dessus)
    const allowed = {
      model:      body.model      || 'claude-sonnet-4-6',
      max_tokens: Math.min(body.max_tokens || 1100, 4096),
      system:     NOEMA_SYSTEM + serverMemoryContext,
      messages:   Array.isArray(body.messages) ? body.messages : [],
      stream:     false,
    }

    const messages   = allowed.messages
    const sessionId  = body.session_id || null
    const userMemory = body.user_memory && typeof body.user_memory === 'object' ? body.user_memory : {}
    // Mini-sprint coût : Greffier toutes les 3 requêtes utilisateur — ~67% de réduction de coût Greffier.
    const userMsgCount = messages.filter(m => m.role === 'user').length
    const shouldRunGreffier = userMsgCount > 0 && userMsgCount % 3 === 0
    const greffierPromise = shouldRunGreffier
      ? runGreffier({ apiKey, sb: sbAdmin, userId, sessionId, history: messages, userMemory })
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
      },
      body: JSON.stringify(allowed),
    })

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text().catch(() => '')
      console.error('[claude] Anthropic HTTP error:', anthropicResponse.status, errText)
      return new Response(
        JSON.stringify({ error: { message: `Anthropic HTTP ${anthropicResponse.status}` } }),
        { status: anthropicResponse.status, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }

    const data = await anthropicResponse.json()
    const fullText = Array.isArray(data.content)
      ? data.content
        .filter((block) => block?.type === 'text' && typeof block.text === 'string')
        .map((block) => block.text)
        .join('')
      : ''

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

    return new Response(JSON.stringify({
      content: fullText,
      _greffier: greffierResult,
      _quota: quota,
      _access: { tier: accessTier },
    }), {
      status: 200,
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
