// netlify/functions/verify-code.js
// Vérifie si un code est un code admin — côté serveur uniquement
// ADMIN_CODES est une variable d'env Netlify (jamais exposée au client)
import { createClient } from "@supabase/supabase-js";

const CODE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function generateAccessCode() {
  let value = "";
  for (let i = 0; i < 5; i += 1) value += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return `NOEMA-${value}`;
}

function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  try {
    return createClient(url, key);
  } catch {
    return null;
  }
}

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

    const normalizedCode = code.trim().toUpperCase()
    if (!adminCodes.includes(normalizedCode)) {
      return json({ isAdmin: false })
    }

    const sbAdmin = getSupabaseAdmin()
    if (!sbAdmin) {
      console.error("[verify-code] Configuration Supabase admin manquante")
      return json({ isAdmin: true, error: "Configuration serveur manquante." }, 500)
    }

    const generatedCode = generateAccessCode()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const { error } = await sbAdmin
      .from("access_codes")
      .insert({ code: generatedCode, expires_at: expiresAt, max_uses: 1 })

    if (error) {
      console.error("[verify-code] Erreur création code:", error.message)
      return json({ isAdmin: true, error: "Impossible de créer un code d'accès." }, 500)
    }

    return json({ isAdmin: true, generatedCode, expiresAt })
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
