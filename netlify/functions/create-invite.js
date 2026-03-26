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

function generateToken() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";
  for (let i = 0; i < 8; i++) token += chars[Math.floor(Math.random() * chars.length)];
  return token;
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

  // Verify JWT + admin
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return json({ error: "Unauthorized" }, 401);

  const sbAdmin = getSupabaseAdmin();
  if (!sbAdmin) return json({ error: "Server configuration error" }, 500);

  const { data: { user: verifiedUser }, error: authError } = await sbAdmin.auth.getUser(token);
  if (authError || !verifiedUser) return json({ error: "Unauthorized" }, 401);

  // Check admin
  const { data: profile } = await sbAdmin
    .from("profiles")
    .select("is_admin")
    .eq("id", verifiedUser.id)
    .maybeSingle();

  const adminEmail = process.env.VITE_ADMIN_EMAIL || "";
  const isAdmin = profile?.is_admin === true || (adminEmail && verifiedUser.email === adminEmail);
  if (!isAdmin) return json({ error: "Forbidden" }, 403);

  const inviteToken = generateToken();
  const body = await request.json().catch(() => ({}));
  const label = body.label || null;

  try {
    const { data, error } = await sbAdmin
      .from("invites")
      .insert({ token: inviteToken, created_by: verifiedUser.id, label, active: true })
      .select()
      .single();

    if (error) {
      console.error("[Invite] DB error:", error.message);
      return json({ error: "Could not create invite: " + error.message }, 500);
    }

    return json({ token: inviteToken, id: data.id });
  } catch (err) {
    console.error("[Invite] Error:", err.message);
    return json({ error: err.message }, 500);
  }
}
