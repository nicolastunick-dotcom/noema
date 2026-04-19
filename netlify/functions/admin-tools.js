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

    // ── get-all-costs — coûts API sur tous les users (pas juste l'admin) ─────
    case "get-all-costs": {
      const { data, error: usageError } = await sbAdmin
        .from("api_usage")
        .select("model, prompt_tokens, completion_tokens, user_id");

      if (usageError) {
        console.error("[admin-tools] Erreur get-all-costs:", usageError.message);
        return json({ error: "Impossible de lire les coûts API." }, 500);
      }

      return json({ ...aggregateCosts(data || []), source: adminAccess.source });
    }

    // ── get-overview — stats globales avec service role ───────────────────────
    case "get-overview": {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        profilesRes,
        activeSubsRes,
        trialSubsRes,
        sessionsTodayRes,
        recentSessionsRes,
      ] = await Promise.all([
        sbAdmin.from("profiles").select("*", { count: "exact", head: true }),
        sbAdmin.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
        sbAdmin.from("subscriptions").select("*", { count: "exact", head: true }).in("status", ["trialing", "trial"]),
        sbAdmin.from("sessions").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
        sbAdmin.from("sessions")
          .select("user_id, created_at, step")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      const totalUsers = profilesRes.count   ?? 0;
      const activeSubs = activeSubsRes.count  ?? 0;
      const trialUsers = trialSubsRes.count   ?? 0;
      const freeUsers  = Math.max(0, totalUsers - activeSubs - trialUsers);

      return json({
        ok:            true,
        totalUsers,
        activeSubs,
        trialUsers,
        freeUsers,
        sessionsToday: sessionsTodayRes.count ?? 0,
        monthlyRevenue: activeSubs * 19,
        recentSessions: recentSessionsRes.data || [],
      });
    }

    // ── list-users — tous les users avec email (service role) ────────────────
    case "list-users": {
      // Pagination : récupère tous les users
      let allAuthUsers = [];
      let page = 1;
      while (true) {
        const { data, error: listError } = await sbAdmin.auth.admin.listUsers({ page, perPage: 1000 });
        if (listError) {
          console.error("[admin-tools] listUsers error:", listError.message);
          break;
        }
        allAuthUsers = allAuthUsers.concat(data?.users || []);
        if (!data?.nextPage) break;
        page++;
      }

      // Subscriptions
      const { data: subs = [] } = await sbAdmin
        .from("subscriptions")
        .select("user_id, status, created_at, stripe_subscription_id");

      // Dernières sessions (pour déduire la phase)
      const { data: sessions = [] } = await sbAdmin
        .from("sessions")
        .select("user_id, step, created_at")
        .order("created_at", { ascending: false })
        .limit(5000);

      // Profils admin
      const { data: profiles = [] } = await sbAdmin
        .from("profiles")
        .select("id, is_admin, created_at");

      // Build maps
      const subMap     = {};
      const sessionMap = {};
      const profileMap = {};

      subs.forEach(s => { subMap[s.user_id] = s; });
      sessions.forEach(s => {
        if (!sessionMap[s.user_id]) sessionMap[s.user_id] = s;
      });
      profiles.forEach(p => { profileMap[p.id] = p; });

      function stepToPhase(step) {
        if (!step || step <= 2) return "perdu";
        if (step <= 6) return "guide";
        return "stratege";
      }

      const users = allAuthUsers.map(u => {
        const sub     = subMap[u.id];
        const session = sessionMap[u.id];
        const profile = profileMap[u.id];
        return {
          id:          u.id,
          email:       u.email || "—",
          created_at:  profile?.created_at || u.created_at,
          subStatus:   sub?.status || "free",
          stripeId:    sub?.stripe_subscription_id || null,
          subCreated:  sub?.created_at || null,
          phase:       stepToPhase(session?.step),
          lastStep:    session?.step ?? null,
          lastSession: session?.created_at || null,
          isAdmin:     profile?.is_admin || false,
        };
      });

      // Sort: admins first, then by created_at desc
      users.sort((a, b) => {
        if (a.isAdmin && !b.isAdmin) return -1;
        if (!a.isAdmin && b.isAdmin) return 1;
        return new Date(b.created_at) - new Date(a.created_at);
      });

      return json({ ok: true, users, total: users.length });
    }

    default:
      return json({ error: "Action admin inconnue." }, 400);
  }
}

export const config = {
  path: "/.netlify/functions/admin-tools",
};
