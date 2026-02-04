import React from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../../auth/useAuth';
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
  
  const { user: authUser } = useAuth();
  
  // Unify UID access
  const authUid = React.useMemo(() => {
    return authUser?.uid || (authUser as any)?.id || null;
  }, [authUser]);

  const [enabled, setEnabled] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState<boolean>(() => !!authUid);
  const [pricing, setPricing] = React.useState<CreditPricing>(DEFAULT_PRICING);
  const [profile, setProfile] = React.useState<UserCreditProfile | null>(() => {
    if (!authUid) return null;
    const cached = readCachedBalance(authUid);
    if (cached == null) return null;
    return { user_id: authUid, credit_balance: cached };
  });

  // Derived balance calculation: 
  // 1. Auth/me response (most authoritative/fresh)
  // 2. Local profile (Firestore watch/fetch)
  // 3. Fallback fields
  const currentBalance = (authUser as any)?.credit_balance 
    ?? profile?.credit_balance 
    ?? (authUser as any)?.credits 
    ?? (authUser as any)?.billing?.credits 
    ?? 0;

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
      if (isLoading) return true;
      const item = pricing[action];
      if (!item || item.is_active === false) return true;
      const cost = getCost(action);
      return currentBalance >= cost;
    },
    [currentBalance, enabled, getCost, pricing, isLoading]
  );

  const refresh = React.useCallback(async () => {
    if (!authUid) return;
    try {
      setIsLoading(true);
      const data: any = await firebaseService.getUserCreditProfile(authUid);
      if (data) {
        setProfile(data);
        if (typeof data.credit_balance === 'number') {
           window.localStorage.setItem(getBalanceCacheKey(authUid), data.credit_balance.toString());
        }
      }
    } catch (e) {
      console.warn('[CreditManager] Refresh failed:', e);
    } finally {
      setIsLoading(false);
    }
  }, [authUid]);

  React.useEffect(() => {
    if (authUid) {
      refresh();
    } else {
      setIsLoading(false);
      setProfile(null);
    }
  }, [authUid, refresh]);

  // Listen for credit updates from purchase events
  React.useEffect(() => {
    if (!authUid) return;

    const handleCreditsUpdated = (event: CustomEvent) => {
      const newBalance = event.detail?.balance;
      if (typeof newBalance === 'number') {
        setProfile((prev) => 
          prev ? { ...prev, credit_balance: newBalance } : { user_id: authUid, credit_balance: newBalance }
        );
      }
    };

    window.addEventListener('khuyoot:credits-updated', handleCreditsUpdated as EventListener);
    window.addEventListener('khuyoot:refresh-user-data', refresh as EventListener);
    return () => {
      window.removeEventListener('khuyoot:credits-updated', handleCreditsUpdated as EventListener);
      window.removeEventListener('khuyoot:refresh-user-data', refresh as EventListener);
    };
  }, [authUid]);

  const executeCreditAction = React.useCallback<CreditsContextValue['executeCreditAction']>(
    async (action, callback) => {
      if (!enabled) {
        try {
          const value = await callback();
          return { ok: true, value };
        } catch (e) {
          return { ok: false, reason: 'error', error: e };
        }
      }

      const uid = authUser?.uid || authUid;
      if (!uid) {
        try {
          const value = await callback();
          return { ok: true, value };
        } catch (e) {
          return { ok: false, reason: 'error', error: e };
        }
      }

      const item = pricing[action];
      if (!item || item.is_active === false) {
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

      let reservation: { transaction_id: string; new_balance: number } | null = null;
      try {
        const reservePromise = firebaseService.reserveCredits({
          userId: uid,
          actionType: action,
          cost,
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Credit reservation timed out')), 5000)
        );
        reservation = (await Promise.race([reservePromise, timeoutPromise])) as any;
        
        // Optimistically update local state if using profile fallback
        setProfile((prev) => (prev ? { ...prev, credit_balance: reservation!.new_balance } : prev));
        
        const value = await callback();
        
        firebaseService.finalizeCreditTransaction({ transactionId: reservation!.transaction_id })
          .catch(e => console.warn('[CreditManager] Finalize failed:', e));
        
        return { ok: true, value };
      } catch (e: any) {
        const errorMsg = String(e?.message || '');
        const isTimeout = errorMsg.includes('timed out');
        const isConnection = errorMsg.includes('connection') || errorMsg.includes('fetch');

        if (isTimeout || isConnection) {
            try {
                const value = await callback();
                return { ok: true, value };
            } catch (innerErr) {
                 return { ok: false, reason: 'error', error: innerErr };
            }
        }

        if (errorMsg === 'INSUFFICIENT_CREDITS') {
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
    [authUid, currentBalance, enabled, getCost, pricing, refresh, authUser?.uid]
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


