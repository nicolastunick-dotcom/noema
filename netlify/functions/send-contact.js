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

  const { name, email, subject, message } = body;

  if (!name || !email || !subject || !message) {
    return json({ error: "Champs manquants" }, 400);
  }

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
      replyTo: `"${name}" <${email}>`,
      subject: `[Contact Noema] ${subject}`,
      text: `Nom : ${name}\nEmail : ${email}\n\n${message}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2 style="color: #bdc2ff;">Nouveau message — Noema</h2>
          <p><strong>Nom :</strong> ${name}</p>
          <p><strong>Email :</strong> ${email}</p>
          <p><strong>Sujet :</strong> ${subject}</p>
          <hr style="border-color: #454655;" />
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      `,
    });

    return json({ ok: true });
  } catch (err) {
    console.error("[send-contact] Erreur envoi email :", err.message);
    return json({ error: "Échec de l'envoi" }, 500);
  }
}
