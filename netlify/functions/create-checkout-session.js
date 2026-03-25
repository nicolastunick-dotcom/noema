import Stripe from "stripe";
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

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // Verify JWT
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return json({ error: "Unauthorized" }, 401);

  const sbAdmin = getSupabaseAdmin();
  if (!sbAdmin) return json({ error: "Server configuration error" }, 500);

  const { data: { user: verifiedUser }, error: authError } = await sbAdmin.auth.getUser(token);
  if (authError || !verifiedUser) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => ({}));
  const priceId = body.priceId || "price_1TAZhkQh5xN0PliA3dUAqyqP";

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return json({ error: "Stripe not configured" }, 500);

  try {
    const stripe = new Stripe(stripeKey);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: "https://noemaapp.netlify.app/success",
      cancel_url: "https://noemaapp.netlify.app/pricing",
      client_reference_id: verifiedUser.id,
      customer_email: verifiedUser.email,
      metadata: { userId: verifiedUser.id },
    });
    return json({ url: session.url });
  } catch (err) {
    console.error("[Checkout] Stripe error:", err.message);
    return json({ error: "Stripe error: " + err.message }, 500);
  }
}
