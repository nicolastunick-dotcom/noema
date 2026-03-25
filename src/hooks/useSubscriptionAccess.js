import { useCallback, useEffect, useState } from "react";
import { sb } from "../lib/supabase";
import { hasActiveSubscriptionRecord } from "../lib/access";

const INITIAL_STATE = {
  loading: false,
  hasActiveSubscription: false,
  subscription: null,
  records: [],
  error: null,
};

export function useSubscriptionAccess(user) {
  const [state, setState] = useState(INITIAL_STATE);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setState(INITIAL_STATE);
      return INITIAL_STATE;
    }

    if (!sb) {
      const nextState = {
        loading: false,
        hasActiveSubscription: false,
        subscription: null,
        records: [],
        error: "SUPABASE_UNAVAILABLE",
      };
      setState(nextState);
      return nextState;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

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
      error: null,
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
