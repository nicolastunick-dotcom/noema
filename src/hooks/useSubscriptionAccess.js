
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

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "";

export function useSubscriptionAccess(user) {
  const [state, setState] = useState(INITIAL_STATE);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      // Pas d'utilisateur → rien à charger, on nettoie et on sort avec loading: false
      const noUserState = { ...INITIAL_STATE, loading: false };
      setState(noUserState);
      return noUserState;
    }

    if (ADMIN_EMAIL && user.email === ADMIN_EMAIL) {
      const accessTier = resolveAccessTier({ isAuthenticated: true, isAdmin: true });
      const adminState = {
        loading: false,
        hasActiveSubscription: false,
        hasFullAccess: true,
        hasProductAccess: true,
        accessTier,
        subscription: { status: "active", plan: "admin" },
        records: [],
        isAdmin: true,
        adminSource: "legacy_email",
        profile: null,
        quota: buildQuotaState({ tier: accessTier, used: 0 }),
        error: null,
      };
      setState(adminState);
      return adminState;
    }

    if (!sb) {
      const hasLegacyAdminAccess = Boolean(ADMIN_EMAIL && user.email === ADMIN_EMAIL);
      const accessTier = resolveAccessTier({
        isAuthenticated: true,
        isAdmin: hasLegacyAdminAccess,
      });
      const nextState = {
        loading: false,
        hasActiveSubscription: false,
        hasFullAccess: isFullAccessTier(accessTier),
        hasProductAccess: hasProductAccessForTier(accessTier),
        accessTier,
        subscription: hasLegacyAdminAccess ? { status: "active", plan: "admin" } : null,
        records: [],
        isAdmin: hasLegacyAdminAccess,
        adminSource: hasLegacyAdminAccess ? "legacy_email" : null,
        profile: null,
        quota: buildQuotaState({ tier: accessTier, used: 0 }),
        error: "SUPABASE_UNAVAILABLE",
      };
      setState(nextState);
      return nextState;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    let profile = null;
    let isAdmin = Boolean(ADMIN_EMAIL && user.email === ADMIN_EMAIL);
    let adminSource = isAdmin ? "legacy_email" : null;
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
    // Sprint 1 : source de vérité = table invites (user_id lié).
    // Fallback : sessionStorage (utilisateurs existants pas encore liés en base).
    // Lorsque sessionStorage invite est présent, on tente de le persister en base via
    // validate-invite (avec JWT) pour que le backend puisse vérifier l'entitlement.

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

    // 2. Fallback sessionStorage + tentative de persistance en base
    const inviteRaw = !isAdmin && !hasInvite ? sessionStorage.getItem("noema_invite") : null;
    if (inviteRaw && !hasInvite) {
      let invite;
      try { invite = JSON.parse(inviteRaw); } catch { invite = { token: inviteRaw }; }

      // Lier à cet utilisateur dans sessionStorage si pas encore fait
      if (!invite.userId) {
        invite.userId = user.id;
        sessionStorage.setItem("noema_invite", JSON.stringify(invite));
      }

      if (invite.userId === user.id) {
        // Persister le lien en base pour que le backend (claude.js) puisse vérifier l'entitlement
        if (invite.token) {
          // Sprint 1.1 : linkage ATTENDU (plus fire-and-forget).
          // invites.user_id doit être lié AVANT que loading passe à false,
          // sinon claude.js ne trouve pas l'entitlement et retourne 403 sur openingMessage().
          try {
            const { data: { session: authSession } } = await sb.auth.getSession();
            if (authSession?.access_token) {
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
              } else {
                console.log("[Noema] Invite linkage confirmé avant résolution entitlement.");
              }
            }
          } catch (e) {
            // Non-bloquant sur erreur réseau : accès frontend accordé quand même.
            // La prochaine session re-tentera automatiquement.
            console.warn("[Noema] Invite linkage failed:", e.message);
          }
        }

        hasInvite = true;
        subscription = { status: "active", plan: "invite" };
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
  }, [user?.email, user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    ...state,
    isAuthenticated: Boolean(user),
    refresh,
  };
}
