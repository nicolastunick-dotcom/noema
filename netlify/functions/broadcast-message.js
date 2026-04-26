// ─────────────────────────────────────────────────────────────────────────────
// broadcast-message — Envoie un email à un groupe d'utilisateurs Noema
// Requiert : JWT admin + profiles.is_admin = true
// Body     : { subject, message, targetGroup, previewOnly }
//   targetGroup : "all" | "active" | "trial" | "free"
//   previewOnly : boolean — compte les destinataires sans envoyer
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });

// ── Supabase service role ─────────────────────────────────────────────────────
function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try { return createClient(url, key); } catch { return null; }
}

// ── Auth helpers (same pattern as admin-tools) ────────────────────────────────
async function getVerifiedUser(request, sbAdmin) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return { error: json({ error: "Non autorisé." }, 401) };

  const { data: { user }, error } = await sbAdmin.auth.getUser(token);
  if (error || !user) return { error: json({ error: "Session invalide." }, 401) };
  return { user };
}

async function getAdminAccess(sbAdmin, user) {
  try {
    const { data } = await sbAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    if (data?.is_admin) return { isAdmin: true };
  } catch (error) {
    console.warn("[broadcast-message] Admin profile check failed:", error?.message || error);
  }
  return { isAdmin: false };
}

// ── Email builder ─────────────────────────────────────────────────────────────
function buildHtml(subject, message) {
  const escaped = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const withBreaks = escaped.replace(/\n/g, "<br/>");
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0c0e13;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#e2e2e9">
  <div style="max-width:600px;margin:40px auto;padding:0 16px">
    <!-- Header -->
    <div style="margin-bottom:32px;padding:28px 32px;background:#111318;border-radius:16px;border:1px solid rgba(189,194,255,0.1)">
      <p style="margin:0 0 4px;font-size:28px;font-style:italic;color:#bdc2ff;letter-spacing:-0.02em">Noema</p>
      <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#454655;font-weight:700">Message de l'équipe</p>
    </div>

    <!-- Subject -->
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#e2e2e9;line-height:1.3">${subject}</h1>

    <!-- Body -->
    <div style="font-size:15px;line-height:1.75;color:#c5c5d8;margin-bottom:40px;white-space:pre-wrap">${withBreaks}</div>

    <!-- CTA -->
    <div style="margin-bottom:48px">
      <a href="https://noema.app/app/chat"
         style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#bdc2ff,#7886ff);border-radius:9999px;color:#00118c;font-weight:700;font-size:14px;text-decoration:none">
        Ouvrir Noema →
      </a>
    </div>

    <!-- Footer -->
    <div style="padding-top:24px;border-top:1px solid rgba(69,70,85,0.3)">
      <p style="margin:0 0 6px;font-size:12px;color:#454655">
        Tu reçois cet email car tu as un compte Noema.
      </p>
      <p style="margin:0;font-size:12px;color:#454655">
        Pour ne plus recevoir ces messages, réponds à cet email avec "désabonner".
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ── Send batch ────────────────────────────────────────────────────────────────
async function sendBatch(transporter, emails, subject, message, fromEmail) {
  const results = await Promise.allSettled(
    emails.map(email =>
      transporter.sendMail({
        from: `"Noema" <${fromEmail}>`,
        to: email,
        subject,
        text: message,
        html: buildHtml(subject, message),
      })
    )
  );

  let sent = 0;
  const errors = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      sent++;
    } else {
      errors.push({ email: emails[i], error: r.reason?.message || "Erreur inconnue" });
    }
  });
  return { sent, errors };
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // ── Auth ──
  const sbAdmin = getSupabaseAdmin();
  if (!sbAdmin) return json({ error: "Configuration serveur manquante." }, 500);

  const { user, error: authError } = await getVerifiedUser(request, sbAdmin);
  if (authError) return authError;

  const adminAccess = await getAdminAccess(sbAdmin, user);
  if (!adminAccess.isAdmin) return json({ error: "Accès admin requis." }, 403);

  // ── Body ──
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const {
    subject     = "Message de l'équipe Noema",
    message,
    targetGroup = "all",
    previewOnly = false,
  } = body;

  if (!message?.trim()) {
    return json({ error: "Le message est vide." }, 400);
  }

  // ── Fetch all users via service role ──
  let allUsers = [];
  let page = 1;
  while (true) {
    const { data, error: listError } = await sbAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (listError) {
      console.error("[broadcast-message] listUsers error:", listError.message);
      return json({ error: "Impossible de récupérer la liste des utilisateurs." }, 500);
    }
    allUsers = allUsers.concat(data?.users || []);
    if (!data?.nextPage) break;
    page++;
  }

  // ── Fetch subscriptions to filter by group ──
  const { data: subs = [] } = await sbAdmin
    .from("subscriptions")
    .select("user_id, status");

  const activeSet  = new Set((subs).filter(s => s.status === "active").map(s => s.user_id));
  const trialSet   = new Set((subs).filter(s => ["trialing", "trial"].includes(s.status)).map(s => s.user_id));

  // ── Filter recipients ──
  let recipients = allUsers;
  if (targetGroup === "active") {
    recipients = allUsers.filter(u => activeSet.has(u.id));
  } else if (targetGroup === "trial") {
    recipients = allUsers.filter(u => trialSet.has(u.id) && !activeSet.has(u.id));
  } else if (targetGroup === "free") {
    recipients = allUsers.filter(u => !activeSet.has(u.id) && !trialSet.has(u.id));
  }

  const emails = recipients.map(u => u.email).filter(Boolean);

  // ── Preview mode — just return counts ──
  if (previewOnly) {
    return json({
      ok: true,
      preview: true,
      total: emails.length,
      targetGroup,
      breakdown: {
        active: activeSet.size,
        trial: trialSet.size,
        free: Math.max(0, allUsers.length - activeSet.size - trialSet.size),
        all: allUsers.length,
      },
    });
  }

  // ── SMTP setup ──
  const appPassword = process.env.GMAIL_APP_PASSWORD;
  if (!appPassword) {
    return json({ error: "Configuration SMTP manquante (GMAIL_APP_PASSWORD)." }, 500);
  }

  const fromEmail = "noema.app.support@gmail.com";
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: fromEmail, pass: appPassword },
  });

  // ── Send in batches of 20 to respect SMTP limits ──
  const BATCH_SIZE = 20;
  let totalSent = 0;
  let allErrors = [];

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);
    const { sent, errors } = await sendBatch(transporter, batch, subject, message, fromEmail);
    totalSent += sent;
    allErrors = allErrors.concat(errors);

    // Short pause between batches to avoid SMTP rate limits
    if (i + BATCH_SIZE < emails.length) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  console.log(`[broadcast-message] Sent ${totalSent}/${emails.length} to group="${targetGroup}"`);

  return json({
    ok: true,
    sent:   totalSent,
    failed: allErrors.length,
    total:  emails.length,
    errors: allErrors.slice(0, 10), // cap error list
  });
}

export const config = {
  path: "/.netlify/functions/broadcast-message",
};
