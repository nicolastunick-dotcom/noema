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

// validate-invite.js
//
// Usage 1 — validation simple (avant login) :
//   POST { token }
//   → { valid: true/false, label, linked: false }
//
// Usage 2 — validation + linkage (après login) :
//   POST { token } + Authorization: Bearer <JWT>
//   → { valid: true/false, label, linked: true/false }
//   Lie l'invite à l'utilisateur en base (source de vérité accès beta backend)

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

  console.log("[ValidateInvite] Received token:", token ?? "(none)");

  if (!token || typeof token !== "string" || !token.trim()) {
    return json({ valid: false, label: null, error: "No token" }, 400);
  }

  const sbAdmin = getSupabaseAdmin();
  if (!sbAdmin) {
    console.error("[ValidateInvite] Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return json({ valid: false, label: null, error: "Server configuration error" }, 500);
  }

  try {
    const rawToken = token.trim();

    // Correspondance exacte — tokens toujours en majuscules (générés par create-invite.js)
    const { data, error } = await sbAdmin
      .from("invites")
      .select("id, token, active, label, user_id")
      .eq("token", rawToken.trim())
      .eq("active", true)
      .maybeSingle();

    console.log("[ValidateInvite] Query result — data:", JSON.stringify(data), "error:", error?.message ?? null);

    if (error) {
      console.error("[ValidateInvite] DB error:", error.message);
      return json({ valid: false, label: null }, 200);
    }

    if (!data) {
      console.log("[ValidateInvite] No matching invite found for token:", rawToken);
      return json({ valid: false, label: null, linked: false });
    }

    // Si Authorization header présent : lier l'invite à cet utilisateur
    const authHeader = request.headers.get("Authorization") || "";
    const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    let linked = Boolean(data.user_id); // déjà liée si user_id non null

    if (jwt && !linked) {
      const { data: { user: verifiedUser }, error: authError } = await sbAdmin.auth.getUser(jwt);
      if (!authError && verifiedUser) {
        const { error: updateError } = await sbAdmin
          .from("invites")
          .update({ user_id: verifiedUser.id })
          .eq("id", data.id)
          .is("user_id", null); // ne remplace jamais un lien existant
        if (!updateError) {
          linked = true;
          console.log("[ValidateInvite] Invite liée à userId:", verifiedUser.id);
        } else {
          console.error("[ValidateInvite] Link error:", updateError.message);
        }
      }
    }

    return json({ valid: true, label: data.label || null, linked });
  } catch (err) {
    console.error("[ValidateInvite] Unexpected error:", err.message);
    return json({ valid: false, label: null }, 200);
  }
}
