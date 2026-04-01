import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export default async function handler(request) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const stripeKey     = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    console.error("[Webhook] Variables manquantes : STRIPE_SECRET_KEY ou STRIPE_WEBHOOK_SECRET");
    return new Response("Stripe not configured", { status: 500 });
  }

  // Stripe exige le body brut (non parsé) pour vérifier la signature
  const rawBody   = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event;
  try {
    const stripe = new Stripe(stripeKey);
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[Webhook] Signature invalide :", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const sbAdmin = getSupabaseAdmin();
  if (!sbAdmin) {
    console.error("[Webhook] Supabase admin non configuré");
    return new Response("Server configuration error", { status: 500 });
  }

  console.log("[Webhook] Événement reçu :", event.type);

  try {
    switch (event.type) {

      // ── Paiement confirmé — première activation de l'abonnement ──
      case "checkout.session.completed": {
        const session = event.data.object;

        const userId               = session.client_reference_id; // passé par create-checkout-session.js
        const stripeCustomerId     = session.customer;
        const stripeSubscriptionId = session.subscription;

        if (!userId || !stripeSubscriptionId) {
          console.error("[Webhook] checkout.session.completed : userId ou subscriptionId manquant", {
            userId, stripeSubscriptionId,
          });
          break;
        }

        // Récupère les détails complets de l'abonnement depuis Stripe
        const stripe       = new Stripe(stripeKey);
        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

        const { error } = await sbAdmin.from("subscriptions").upsert(
          {
            user_id:                userId,
            stripe_customer_id:     stripeCustomerId,
            stripe_subscription_id: stripeSubscriptionId,
            plan:                   subscription.items.data[0]?.price?.lookup_key || "noema_monthly",
            status:                 subscription.status,
            current_period_end:     new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end:   subscription.cancel_at_period_end,
            updated_at:             new Date().toISOString(),
          },
          { onConflict: "stripe_subscription_id" }
        );

        if (error) console.error("[Webhook] Supabase upsert error (checkout.completed):", error);
        else console.log("[Webhook] Abonnement activé pour user:", userId, "→", subscription.status);
        break;
      }

      // ── Mise à jour d'un abonnement existant (renouvellement, changement de plan, past_due…) ──
      case "customer.subscription.updated": {
        const subscription = event.data.object;

        const { error } = await sbAdmin.from("subscriptions")
          .update({
            status:               subscription.status,
            current_period_end:   new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at:           new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) console.error("[Webhook] Supabase update error (subscription.updated):", error);
        else console.log("[Webhook] Abonnement mis à jour :", subscription.id, "→", subscription.status);
        break;
      }

      // ── Résiliation définitive ──
      case "customer.subscription.deleted": {
        const subscription = event.data.object;

        const { error } = await sbAdmin.from("subscriptions")
          .update({
            status:     "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) console.error("[Webhook] Supabase update error (subscription.deleted):", error);
        else console.log("[Webhook] Abonnement annulé :", subscription.id);
        break;
      }

      default:
        console.log("[Webhook] Événement ignoré :", event.type);
    }
  } catch (err) {
    console.error("[Webhook] Erreur handler :", err.message);
    return new Response("Internal error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
