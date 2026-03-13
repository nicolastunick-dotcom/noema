// netlify/functions/claude.js
// Proxy sécurisé — la clé API Anthropic ne passe jamais côté client

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

    // Whitelist des champs autorisés — ne jamais forwarder le body brut
    const allowed = {
      model:      body.model      || 'claude-sonnet-4-6',
      max_tokens: Math.min(body.max_tokens || 1400, 4096),
      system:     typeof body.system   === 'string' ? body.system   : '',
      messages:   Array.isArray(body.messages) ? body.messages : [],
    }

    // --- CODEX CHANGE START ---
    // Codex modification - retry Anthropic calls when the API is temporarily
    // overloaded, using bounded exponential backoff before returning a clean 529.
    const response = await fetchAnthropicWithRetry(apiKey, allowed)

    if (!response.ok && response.status === 529) {
      return new Response(
        JSON.stringify({ error: { message: "Noema est momentanément surchargé. Réessaie dans quelques secondes." } }),
        {
          status: 529,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders()
          }
        }
      )
    }
    // --- CODEX CHANGE END ---

    const data = await response.json()

    return new Response(JSON.stringify(data), {
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

// --- CODEX CHANGE START ---
// Codex modification - detect Anthropic overload responses and retry them with
// explicit backoff delays before giving up.
async function fetchAnthropicWithRetry(apiKey, allowed) {
  const retryDelays = [1500, 3000, 5000]
  let lastResponse = null

  for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(allowed),
    })

    if (!(await isAnthropicOverloaded(response))) {
      return response
    }

    lastResponse = response
    if (attempt === retryDelays.length) break
    await wait(retryDelays[attempt])
  }

  return lastResponse
}

async function isAnthropicOverloaded(response) {
  if (response.status === 529) return true

  const headerMessage = response.headers.get('x-error-type') || ''
  if (headerMessage.toLowerCase().includes('overloaded')) return true

  const errorPayload = await response.clone().json().catch(() => null)
  const errorMessage = errorPayload?.error?.message || errorPayload?.message || ''
  return errorMessage.toLowerCase().includes('overloaded')
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
// --- CODEX CHANGE END ---

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
