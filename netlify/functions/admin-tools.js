import { createClient } from "@supabase/supabase-js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PRICING = {
  "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
  "claude-haiku-4-5-20251001": { input: 0.8, output: 4.0 },
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
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

function calcCost(model, inputTokens, outputTokens) {
  const pricing = PRICING[model] || PRICING["claude-sonnet-4-6"];
  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
}

function aggregateCosts(rows = []) {
  const grouped = {};

  for (const row of rows) {
    if (!grouped[row.model]) {
      grouped[row.model] = { input: 0, output: 0, calls: 0 };
    }

    grouped[row.model].input += row.prompt_tokens || 0;
    grouped[row.model].output += row.completion_tokens || 0;
    grouped[row.model].calls += 1;
  }

  const normalizedRows = Object.entries(grouped).map(([model, totals]) => ({
    model,
    input: totals.input,
    output: totals.output,
    calls: totals.calls,
    cost: calcCost(model, totals.input, totals.output),
  }));

  const total = normalizedRows.reduce((sum, row) => sum + row.cost, 0);
  return { rows: normalizedRows, total };
}

async function getVerifiedUser(request, sbAdmin) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return { error: json({ error: "Non autorisé." }, 401) };
  }

  const { data: { user }, error } = await sbAdmin.auth.getUser(token);
  if (error || !user) {
    return { error: json({ error: "Session invalide ou expirée." }, 401) };
  }

  return { user };
}

async function getAdminAccess(sbAdmin, user) {
  const legacyAdminEmail = process.env.VITE_ADMIN_EMAIL || "";

  try {
    const { data } = await sbAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (data?.is_admin) {
      return { isAdmin: true, source: "profile" };
    }
  } catch (error) {
    console.error("[admin-tools] Erreur lecture profil admin:", error.message);
  }

  if (legacyAdminEmail && user.email === legacyAdminEmail) {
    return { isAdmin: true, source: "legacy_email" };
  }

  return { isAdmin: false, source: null };
}

export default async function handler(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const sbAdmin = getSupabaseAdmin();
  if (!sbAdmin) {
    return json({ error: "Configuration serveur manquante." }, 500);
  }

  const { user, error } = await getVerifiedUser(request, sbAdmin);
  if (error) return error;

  const adminAccess = await getAdminAccess(sbAdmin, user);
  if (!adminAccess.isAdmin) {
    return json({ error: "Accès admin requis." }, 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  switch (body.action) {
    case "get-costs": {
      const { data, error: usageError } = await sbAdmin
        .from("api_usage")
        .select("model, prompt_tokens, completion_tokens")
        .eq("user_id", user.id);

      if (usageError) {
        console.error("[admin-tools] Erreur lecture api_usage:", usageError.message);
        return json({ error: "Impossible de lire les coûts API." }, 500);
      }

      return json({
        ...aggregateCosts(data || []),
        source: adminAccess.source,
      });
    }

    case "reset-memory": {
      const { error: memoryError } = await sbAdmin
        .from("memory")
        .delete()
        .eq("user_id", user.id);

      if (memoryError) {
        console.error("[admin-tools] Erreur reset memory:", memoryError.message);
        return json({ error: "Impossible de réinitialiser la mémoire." }, 500);
      }

      return json({ ok: true, source: adminAccess.source });
    }

    default:
      return json({ error: "Action admin inconnue." }, 400);
  }
}

export const config = {
  path: "/.netlify/functions/admin-tools",
};
