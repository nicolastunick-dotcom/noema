// netlify/functions/send-contact.js
import nodemailer from "nodemailer";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });

function cleanText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function escapeHtml(value) {
  return cleanText(value, 5000)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default async function handler(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const name = cleanText(body.name, 80);
  const email = cleanText(body.email, 160);
  const subject = cleanText(body.subject, 140);
  const message = cleanText(body.message, 4000);

  if (!name || !email || !subject || !message) {
    return json({ error: "Champs manquants" }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Email invalide" }, 400);
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message);

  const appPassword = process.env.GMAIL_APP_PASSWORD;
  if (!appPassword) {
    console.error("[send-contact] GMAIL_APP_PASSWORD manquant");
    return json({ error: "Configuration serveur manquante" }, 500);
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "noema.app.support@gmail.com",
      pass: appPassword,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Noema Contact" <noema.app.support@gmail.com>`,
      to: "noema.app.support@gmail.com",
      replyTo: `"${name.replace(/"/g, "'")}" <${email}>`,
      subject: `[Contact Noema] ${subject}`,
      text: `Nom : ${name}\nEmail : ${email}\n\n${message}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2 style="color: #bdc2ff;">Nouveau message — Noema</h2>
          <p><strong>Nom :</strong> ${safeName}</p>
          <p><strong>Email :</strong> ${safeEmail}</p>
          <p><strong>Sujet :</strong> ${safeSubject}</p>
          <hr style="border-color: #454655;" />
          <p style="white-space: pre-wrap;">${safeMessage}</p>
        </div>
      `,
    });

    return json({ ok: true });
  } catch (err) {
    console.error("[send-contact] Erreur envoi email :", err.message);
    return json({ error: "Échec de l'envoi" }, 500);
  }
}
