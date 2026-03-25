// netlify/functions/verify-code.js
// Vérifie si un code est un code admin — côté serveur uniquement
// ADMIN_CODES est une variable d'env Netlify (jamais exposée au client)

export default async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { code } = await request.json()
    if (!code || typeof code !== 'string') {
      return json({ isAdmin: false })
    }

    const adminCodes = (process.env.ADMIN_CODES || '')
      .split(',')
      .map(c => c.trim())
      .filter(Boolean)

    return json({ isAdmin: adminCodes.includes(code.trim().toUpperCase()) })
  } catch {
    return json({ isAdmin: false })
  }
}

function json(data) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export const config = { path: '/.netlify/functions/verify-code' }
