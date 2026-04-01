import { useCallback, useEffect, useState } from "react";
import { sb } from "../lib/supabase";
import { hasActiveSubscriptionRecord } from "../lib/access";

const INITIAL_STATE = {
  loading: false,
  hasActiveSubscription: false,
  subscription: null,
  records: [],
  isAdmin: false,
  adminSource: null,
  profile: null,
  error: null,
};

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "";

export function useSubscriptionAccess(user) {
  const [state, setState] = useState(INITIAL_STATE);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setState(INITIAL_STATE);
      return INITIAL_STATE;
    }

    if (ADMIN_EMAIL && user.email === ADMIN_EMAIL) {
      const adminState = {
        loading: false,
        hasActiveSubscription: true,
        subscription: { status: "active", plan: "admin" },
        records: [],
        isAdmin: true,
        adminSource: "legacy_email",
        profile: null,
        error: null,
      };
      setState(adminState);
      return adminState;
    }

    if (!sb) {
      const hasLegacyAdminAccess = Boolean(ADMIN_EMAIL && user.email === ADMIN_EMAIL);
      const nextState = {
        loading: false,
        hasActiveSubscription: hasLegacyAdminAccess,
        subscription: hasLegacyAdminAccess ? { status: "active", plan: "admin" } : null,
        records: [],
        isAdmin: hasLegacyAdminAccess,
        adminSource: hasLegacyAdminAccess ? "legacy_email" : null,
        profile: null,
        error: "SUPABASE_UNAVAILABLE",
      };
      setState(nextState);
      return nextState;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    let profile = null;
    let isAdmin = Boolean(ADMIN_EMAIL && user.email === ADMIN_EMAIL);
    let adminSource = isAdmin ? "legacy_email" : null;

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

    if (isAdmin) {
      const adminState = {
        loading: false,
        hasActiveSubscription: true,
        subscription: { status: "active", plan: "admin" },
        records: [],
        isAdmin: true,
        adminSource,
        profile,
        error: null,
      };
      setState(adminState);
      return adminState;
    }

    // Invite beta : token validé au moment du clic sur /invite, lié à l'utilisateur connecté
    const inviteRaw = sessionStorage.getItem("noema_invite");
    if (inviteRaw) {
      let invite;
      try { invite = JSON.parse(inviteRaw); } catch { invite = { token: inviteRaw }; }
      // Première utilisation : lier le token à cet utilisateur
      if (!invite.userId) {
        invite.userId = user.id;
        sessionStorage.setItem("noema_invite", JSON.stringify(invite));
      }
      // Vérifier que l'invite appartient bien à cet utilisateur
      if (invite.userId === user.id) {
        const inviteState = {
          loading: false,
          hasActiveSubscription: true,
          subscription: { status: "active", plan: "invite" },
          records: [],
          isAdmin: false,
          adminSource: null,
          profile,
          error: null,
        };
        setState(inviteState);
        return inviteState;
      }
    }

    const { data, error } = await sb
      .from("subscriptions")
      .select("id, user_id, stripe_customer_id, stripe_subscription_id, plan, status, current_period_end, cancel_at_period_end, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Noema] Erreur verification abonnement:", error);
      const nextState = {
        loading: false,
        hasActiveSubscription: false,
        subscription: null,
        records: [],
        isAdmin,
        adminSource,
        profile,
        error: error.message || "SUBSCRIPTION_CHECK_FAILED",
      };
      setState(nextState);
      return nextState;
    }

    const records = data || [];
    const subscription = records.find(hasActiveSubscriptionRecord) || records[0] || null;
    const nextState = {
      loading: false,
      hasActiveSubscription: hasActiveSubscriptionRecord(subscription),
      subscription,
      records,
      isAdmin,
      adminSource,
      profile,
      error: null,
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
