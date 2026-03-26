import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export default async function handler(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const body = await request.json().catch(() => ({}));
  const { token } = body;
  if (!token) return json({ valid: false, error: "No token" }, 400);

  const sbAdmin = getSupabaseAdmin();
  if (!sbAdmin) return json({ valid: false, error: "Server configuration error" }, 500);

  try {
    const { data, error } = await sbAdmin
      .from("invites")
      .select("id, token, active, label")
      .eq("token", token.trim().toUpperCase())
      .eq("active", true)
      .maybeSingle();

    if (error) {
      console.error("[ValidateInvite] DB error:", error.message);
      return json({ valid: false }, 200);
    }

    return json({ valid: Boolean(data), label: data?.label || null });
  } catch (err) {
    console.error("[ValidateInvite] Error:", err.message);
    return json({ valid: false }, 200);
  }
}
