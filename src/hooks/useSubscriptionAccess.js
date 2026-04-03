
import { useCallback, useEffect, useState } from "react";
import { sb } from "../lib/supabase";
import { hasActiveSubscriptionRecord } from "../lib/access";
import { buildQuotaState, hasProductAccessForTier, isFullAccessTier, resolveAccessTier } from "../lib/entitlements";

const INITIAL_STATE = {
  // Sprint 1.1 : loading: true dès le départ pour bloquer openingMessage() tant que
  // l'entitlement n'est pas résolu. Évite le faux 403 sur les comptes invités.
  // Tous les chemins de refresh() posent explicitement loading: false avant de retourner.
  loading: true,
  hasActiveSubscription: false,
  hasFullAccess: false,
  hasProductAccess: false,
  accessTier: "anonymous",
  subscription: null,
  records: [],
  isAdmin: false,
  adminSource: null,
  profile: null,
  quota: buildQuotaState({ tier: "anonymous", used: 0 }),
  error: null,
};

export function useSubscriptionAccess(user) {
  const [state, setState] = useState(INITIAL_STATE);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      // Pas d'utilisateur → rien à charger, on nettoie et on sort avec loading: false
      const noUserState = { ...INITIAL_STATE, loading: false };
      setState(noUserState);
      return noUserState;
    }

    if (!sb) {
      const accessTier = resolveAccessTier({
        isAuthenticated: true,
        isAdmin: false,
      });
      const nextState = {
        loading: false,
        hasActiveSubscription: false,
        hasFullAccess: isFullAccessTier(accessTier),
        hasProductAccess: hasProductAccessForTier(accessTier),
        accessTier,
        subscription: null,
        records: [],
        isAdmin: false,
        adminSource: null,
        profile: null,
        quota: buildQuotaState({ tier: accessTier, used: 0 }),
        error: "SUPABASE_UNAVAILABLE",
      };
      setState(nextState);
      return nextState;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    let profile = null;
    let isAdmin = false;
    let adminSource = null;
    let hasInvite = false;
    let subscription = null;
    let records = [];
    let errorMessage = null;

    const { data: profileData, error: profileError } = await sb
      .from("profiles")
      .select("id, is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[Noema] Erreur lecture profil admin:", profileError);
    } else {
      profile = profileData || null;
      if (profileData?.is_admin) {
        isAdmin = true;
        adminSource = "profile";
      }
    }

    // ── Invite beta ────────────────────────────────────────────────
    // Source de vérité d'accès : table invites liée en base.
    // sessionStorage sert uniquement à transporter le token entre l'écran d'invite
    // et la première session authentifiée, jamais à accorder l'accès à lui seul.

    // 1. Vérification en base (source de vérité après linkage)
    if (!isAdmin) {
      const { data: dbInvite } = await sb
        .from("invites")
        .select("id")
        .eq("user_id", user.id)
        .eq("active", true)
        .maybeSingle();

      if (dbInvite) {
        hasInvite = true;
        subscription = { status: "active", plan: "invite" };
      }
    }

    // 2. Transport token sessionStorage + tentative de persistance en base
    const inviteRaw = !isAdmin && !hasInvite ? sessionStorage.getItem("noema_invite") : null;
    if (inviteRaw && !hasInvite) {
      let invite;
      try { invite = JSON.parse(inviteRaw); } catch { invite = { token: inviteRaw }; }

      if (!invite.userId) {
        invite.userId = user.id;
        sessionStorage.setItem("noema_invite", JSON.stringify(invite));
      }

      if (invite.userId === user.id && invite.token) {
        try {
          const { data: { session: authSession } } = await sb.auth.getSession();

          if (!authSession?.access_token) {
            if (!errorMessage) errorMessage = "INVITE_AUTH_REQUIRED";
          } else {
            const baseUrl = import.meta.env.VITE_NETLIFY_URL || window.location.origin;
            const res = await fetch(`${baseUrl}/.netlify/functions/validate-invite`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authSession.access_token}`,
              },
              body: JSON.stringify({ token: invite.token }),
            });

            if (!res.ok) {
              const errText = await res.text().catch(() => String(res.status));
              console.error("[Noema] Invite linkage HTTP error:", errText);
              if (!errorMessage) errorMessage = "INVITE_LINK_FAILED";
            } else {
              const inviteResult = await res.json().catch(() => null);

              if (!inviteResult?.valid) {
                sessionStorage.removeItem("noema_invite");
                if (!errorMessage) errorMessage = "INVITE_INVALID";
              } else {
                const { data: linkedInvite, error: linkedInviteError } = await sb
                  .from("invites")
                  .select("id")
                  .eq("user_id", user.id)
                  .eq("active", true)
                  .maybeSingle();

                if (linkedInviteError) {
                  console.error("[Noema] Erreur verification invite liée:", linkedInviteError);
                  if (!errorMessage) errorMessage = linkedInviteError.message || "INVITE_LINK_CHECK_FAILED";
                } else if (linkedInvite) {
                  hasInvite = true;
                  subscription = { status: "active", plan: "invite" };
                  sessionStorage.setItem("noema_invite", JSON.stringify({ ...invite, userId: user.id, linked: true }));
                } else if (!errorMessage) {
                  errorMessage = "INVITE_LINK_PENDING";
                }
              }
            }
          }
        } catch (e) {
          console.warn("[Noema] Invite linkage failed:", e.message);
          if (!errorMessage) errorMessage = "INVITE_LINK_FAILED";
        }
      }
    }

    // ── Abonnement Stripe ──────────────────────────────────────────
    if (!isAdmin && !hasInvite) {
      const { data, error } = await sb
        .from("subscriptions")
        .select("id, user_id, stripe_customer_id, stripe_subscription_id, plan, status, current_period_end, cancel_at_period_end, created_at, updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[Noema] Erreur verification abonnement:", error);
        errorMessage = error.message || "SUBSCRIPTION_CHECK_FAILED";
      } else {
        records = data || [];
        subscription = records.find(hasActiveSubscriptionRecord) || records[0] || null;
      }
    }

    const hasActiveSubscription = hasActiveSubscriptionRecord(subscription);
    const accessTier = resolveAccessTier({
      isAuthenticated: true,
      isAdmin,
      hasInvite,
      hasSubscription: hasActiveSubscription,
    });

    let quota = buildQuotaState({ tier: accessTier, used: 0 });
    if (!quota.isUnlimited) {
      const today = new Date().toISOString().slice(0, 10);
      const { data: rateLimitRow, error: rateLimitError } = await sb
        .from("rate_limits")
        .select("count")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (rateLimitError) {
        console.error("[Noema] Erreur lecture quota:", rateLimitError);
        if (!errorMessage) errorMessage = rateLimitError.message || "RATE_LIMIT_CHECK_FAILED";
      } else {
        quota = buildQuotaState({ tier: accessTier, used: rateLimitRow?.count || 0 });
      }
    }

    const nextState = {
      loading: false,
      hasActiveSubscription,
      hasFullAccess: isFullAccessTier(accessTier),
      hasProductAccess: hasProductAccessForTier(accessTier),
      accessTier,
      subscription,
      records,
      isAdmin,
      adminSource,
      profile,
      quota,
      error: errorMessage,
    };

    setState(nextState);
    return nextState;
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    ...state,
    isAuthenticated: Boolean(user),
    refresh,
  };
}
