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

  // ── Résolution d'entitlement ──────────────────────────────────
  // Autorité finale d'accès : backend uniquement.
  // Un JWT valide ne suffit pas — l'entitlement produit doit être vérifié ici.
  // Ordre de vérification : admin → abonnement actif → invite beta persistée
  let hasEntitlement = false
  let isAdmin = false

  // 1. Admin via profiles.is_admin
  const { data: profile } = await sbAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle()
  if (profile?.is_admin === true) {
    hasEntitlement = true
    isAdmin = true
  }

  // 2. Bypass admin email legacy (transitoire — à retirer une fois profiles.is_admin généralisé)
  if (!hasEntitlement) {
    const adminEmail = process.env.VITE_ADMIN_EMAIL || ''
    if (adminEmail && verifiedUser.email === adminEmail) {
      hasEntitlement = true
      isAdmin = true
    }
  }

  // 3. Abonnement actif ou en période d'essai
  if (!hasEntitlement) {
    const { data: sub } = await sbAdmin
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .maybeSingle()
    if (sub) hasEntitlement = true
  }

  // 4. Invite beta liée en base (persistée via validate-invite.js avec JWT)
  if (!hasEntitlement) {
    const { data: invite } = await sbAdmin
      .from('invites')
      .select('id')
      .eq('user_id', userId)
      .eq('active', true)
      .maybeSingle()
    if (invite) hasEntitlement = true
  }

  if (!hasEntitlement) {
    console.log('[claude] accès refusé — pas d\'entitlement pour userId:', userId)
    return new Response(
      JSON.stringify({ error: { message: 'Accès non autorisé. Un abonnement actif ou une invitation valide est requis.' } }),
      { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
    )
  }

  // ── Chargement mémoire utilisateur (server-side) ─────────────
  // Sprint 3.1 : les deux queries tournent en parallèle pour éviter toute latence additionnelle.
  // memory  → forces, blocages, contradictions, ikigai, session_notes
  // sessions → step (absent de la table memory — pas de migration SQL requise)
  let serverMemoryContext = ''
  const [{ data: memRow }, { data: lastSessionRow }] = await Promise.all([
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
  ])
  if (memRow || lastSessionRow) {
    serverMemoryContext = buildServerMemoryContext(memRow, lastSessionRow?.step ?? null)
  }

  try {
    const body = await request.json()

    // ── Quota produit (25 messages par user par jour) ─────────────
    // Unique source de vérité : backend seulement depuis Sprint 1.
    // Le frontend ne lit/écrit plus rate_limits (seulement garde-fou local 30/min).
    // La limite reste journalière — elle deviendra par session au Sprint 3 (session_id live).
    // Les admins sont exemptés du quota.
    if (!isAdmin) {
      const today = new Date().toISOString().slice(0, 10)
      const { data: rl } = await sbAdmin
        .from('rate_limits')
        .select('count')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle()
      const count = rl?.count || 0
      if (count >= SESSION_LIMIT) {
        return new Response(JSON.stringify({
          content: SESSION_LIMIT_MSG,
          _greffier: null,
          _session_limit: true,
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders()
          }
        })
      }
      // Incrément — seule écriture quota produit dans tout le système
      await sbAdmin.from('rate_limits').upsert(
        { user_id: userId, date: today, count: count + 1 },
        { onConflict: 'user_id,date' }
      )
    }

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
      }).then(() => {}, e => console.log('[Usage] log failed:', e.message))
    }

    console.log('[Greffier]', shouldRunGreffier ? 'déclenchement' : 'skipped', '— userMsgCount:', userMsgCount, 'userId:', userId)
    const greffierResult = await greffierPromise

    return new Response(JSON.stringify({
      content: fullText,
      _greffier: greffierResult,
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
