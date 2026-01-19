import React from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useApp } from '../../../context/AppContext';
import { firebaseService } from '../../../services/firebase';
import type { CreditActionType, CreditPricing, UserCreditProfile } from './types';

const DEFAULT_PRICING: CreditPricing = {
  generation: { credit_cost: 30, is_active: true },
  upscale: { credit_cost: 10, is_active: true },
  premium_template: { credit_cost: 5, is_active: true },
};

type CreditsContextValue = {
  enabled: boolean;
  isLoading: boolean;
  pricing: CreditPricing;
  profile: UserCreditProfile | null;
  currentBalance: number;
  getCost: (action: CreditActionType) => number;
  canAfford: (action: CreditActionType) => boolean;
  executeCreditAction: <T>(
    action: CreditActionType,
    callback: () => Promise<T>
  ) => Promise<{ ok: true; value: T } | { ok: false; reason: 'insufficient' | 'inactive' | 'error'; error?: unknown }>;
  refresh: () => Promise<void>;
};

const CreditsContext = React.createContext<CreditsContextValue | null>(null);

function getBalanceCacheKey(uid: string) {
  return `khuyoot:credits:lastBalance:${uid}`;
}

function readCachedBalance(uid: string): number | null {
  try {
    const raw = window.localStorage.getItem(getBalanceCacheKey(uid));
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export const CreditProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { user } = useApp();

  const initialAuthUid = (firebaseService.auth?.currentUser?.uid as string | undefined) || null;

  const [authUid, setAuthUid] = React.useState<string | null>(() => {
    return initialAuthUid;
  });

  // Fail-safe: if anything goes wrong, default to free mode.
  const [enabled, setEnabled] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState<boolean>(() => !!initialAuthUid);
  const [pricing, setPricing] = React.useState<CreditPricing>(DEFAULT_PRICING);
  const [profile, setProfile] = React.useState<UserCreditProfile | null>(() => {
    if (!initialAuthUid) return null;
    const cached = readCachedBalance(initialAuthUid);
    if (cached == null) return null;
    return { user_id: initialAuthUid, credit_balance: cached };
  });

  // Keep credits in sync with Firebase Auth hydration.
  React.useEffect(() => {
    const auth = firebaseService.auth;
    if (!auth) return;

    const unsub = onAuthStateChanged(auth, (u) => {
      const next = u?.uid || null;
      setAuthUid(next);
    });
    return () => unsub();
  }, []);

  // When authUid changes, immediately show last-known cached balance (prevents flashing 0).
  React.useEffect(() => {
    if (!authUid) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    const cached = readCachedBalance(authUid);
    setProfile((prev) => {
      if (prev?.user_id === authUid) return prev;
      if (cached == null) return null;
      return { user_id: authUid, credit_balance: cached };
    });

    setIsLoading(true);
  }, [authUid]);

  // Persist last-known balance for instant hydration on next load.
  React.useEffect(() => {
    if (!authUid) return;
    const bal = profile?.credit_balance;
    if (typeof bal !== 'number' || !Number.isFinite(bal)) return;
    try {
      window.localStorage.setItem(getBalanceCacheKey(authUid), String(Math.max(0, Math.floor(bal))));
    } catch {
      // ignore
    }
  }, [authUid, profile?.credit_balance]);

  const refresh = React.useCallback(async () => {
    setIsLoading(true);
    try {
      if (!firebaseService?.isInitialized?.()) {
        setEnabled(false);
        return;
      }

      // Load pricing
      const raw = await firebaseService.getCreditPricing();
      const nextPricing: CreditPricing = { ...DEFAULT_PRICING };
      (Object.keys(DEFAULT_PRICING) as CreditActionType[]).forEach((k) => {
        const item = raw?.[k];
        if (item) {
          nextPricing[k] = {
            credit_cost: typeof item.credit_cost === 'number' ? item.credit_cost : DEFAULT_PRICING[k].credit_cost,
            is_active: item.is_active !== false,
          };
        }
      });
      setPricing(nextPricing);

      // Load user profile
      if (authUid) {
        await firebaseService.ensureUserCreditProfile(authUid);
        const p = await firebaseService.getUserCreditProfile(authUid);
        setProfile(p);
      } else {
        // Avoid forbidden writes/reads when auth hasn't hydrated yet.
        setProfile(null);
      }

      setEnabled(true);
    } catch (e) {
      console.warn('[CreditManager] refresh failed; falling back to free mode', e);
      setEnabled(false);
    } finally {
      setIsLoading(false);
    }
  }, [authUid, user?.id]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  // Listen for credit updates from upgrade modal or other sources
  React.useEffect(() => {
    const handleCreditsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newBalance = customEvent.detail?.balance;
      if (typeof newBalance === 'number' && authUid) {
        console.log('🔔 Credits updated event received, new balance:', newBalance);
        setProfile((prev) => ({
          ...prev,
          user_id: authUid,
          credit_balance: newBalance,
        }));
      }
    };

    window.addEventListener('khuyoot:credits-updated', handleCreditsUpdated);
    return () => window.removeEventListener('khuyoot:credits-updated', handleCreditsUpdated);
  }, [authUid]);

  const currentBalance = profile?.credit_balance ?? 0;

  const getCost = React.useCallback(
    (action: CreditActionType) => {
      if (!enabled) return 0;
      const item = pricing[action];
      if (!item || item.is_active === false) return 0;
      return Math.max(0, Math.floor(item.credit_cost || 0));
    },
    [enabled, pricing]
  );

  const canAfford = React.useCallback(
    (action: CreditActionType) => {
      if (!enabled) return true;
      const item = pricing[action];
      if (!item || item.is_active === false) return true;
      const cost = getCost(action);
      return currentBalance >= cost;
    },
    [currentBalance, enabled, getCost, pricing]
  );

  const executeCreditAction = React.useCallback<CreditsContextValue['executeCreditAction']>(
    async (action, callback) => {
      // Fail-safe bypass: if disabled, always allow.
      if (!enabled) {
        try {
          const value = await callback();
          return { ok: true, value };
        } catch (e) {
          return { ok: false, reason: 'error', error: e };
        }
      }

      if (!user?.id) {
        return { ok: false, reason: 'error', error: new Error('Not logged in') };
      }

      if (!authUid) {
        return { ok: false, reason: 'error', error: new Error('Not logged in') };
      }

      const item = pricing[action];
      if (!item || item.is_active === false) {
        // Treat inactive pricing as free.
        try {
          const value = await callback();
          return { ok: true, value };
        } catch (e) {
          return { ok: false, reason: 'error', error: e };
        }
      }

      const cost = getCost(action);
      if (cost <= 0) {
        try {
          const value = await callback();
          return { ok: true, value };
        } catch (e) {
          return { ok: false, reason: 'error', error: e };
        }
      }

      if (currentBalance < cost) {
        return { ok: false, reason: 'insufficient' };
      }

      // Two-phase hold: reserve -> run -> finalize/refund
      let reservation: { transaction_id: string; new_balance: number } | null = null;
      try {
        reservation = await firebaseService.reserveCredits({
          userId: authUid,
          actionType: action,
          cost,
        });

        // Update local optimistic balance
        setProfile((prev) => (prev ? { ...prev, credit_balance: reservation!.new_balance } : prev));

        const value = await callback();
        await firebaseService.finalizeCreditTransaction({ transactionId: reservation.transaction_id });
        return { ok: true, value };
      } catch (e: any) {
        if (String(e?.message || '') === 'INSUFFICIENT_CREDITS') {
          // Sync local state
          refresh().catch(() => undefined);
          return { ok: false, reason: 'insufficient' };
        }

        try {
          if (reservation?.transaction_id) {
            await firebaseService.refundCreditTransaction({ transactionId: reservation.transaction_id });
          }
        } catch {}

        refresh().catch(() => undefined);
        return { ok: false, reason: 'error', error: e };
      }
    },
    [authUid, currentBalance, enabled, getCost, pricing, refresh, user?.id]
  );

  const value = React.useMemo<CreditsContextValue>(
    () => ({
      enabled,
      isLoading,
      pricing,
      profile,
      currentBalance,
      getCost,
      canAfford,
      executeCreditAction,
      refresh,
    }),
    [canAfford, currentBalance, enabled, executeCreditAction, getCost, isLoading, pricing, profile, refresh]
  );

  return <CreditsContext.Provider value={value}>{children}</CreditsContext.Provider>;
};

export function useCredits(): CreditsContextValue {
  const ctx = React.useContext(CreditsContext);
  if (!ctx) {
    // Fail-safe: free mode if provider missing.
    return {
      enabled: false,
      isLoading: false,
      pricing: DEFAULT_PRICING,
      profile: null,
      currentBalance: 0,
      getCost: () => 0,
      canAfford: () => true,
      executeCreditAction: async (_action, callback) => {
        try {
          const value = await callback();
          return { ok: true, value };
        } catch (e) {
          return { ok: false, reason: 'error', error: e };
        }
      },
      refresh: async () => undefined,
    };
  }
  return ctx;
}
