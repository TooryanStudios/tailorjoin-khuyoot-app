import React from 'react';
import { Search, Save } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { firebaseService } from '../../../services/firebase';

type PricingRow = { feature_name: string; credit_cost: number; is_active: boolean };

const DEFAULT_ROWS: PricingRow[] = [
  { feature_name: 'generation', credit_cost: 30, is_active: true },
  { feature_name: 'upscale', credit_cost: 10, is_active: true },
  { feature_name: 'premium_template', credit_cost: 5, is_active: true },
];

export const CreditsManagement: React.FC = () => {
  const { user } = useApp();

  const [rows, setRows] = React.useState<PricingRow[]>(DEFAULT_ROWS);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string>('');

  // Wallet tool
  const [searchValue, setSearchValue] = React.useState('');
  const [foundUserId, setFoundUserId] = React.useState<string | null>(null);
  const [foundEmail, setFoundEmail] = React.useState<string | null>(null);
  const [balance, setBalance] = React.useState<number | null>(null);
  const [adjustAmount, setAdjustAmount] = React.useState<number>(0);
  const [adjustReason, setAdjustReason] = React.useState('');
  const [isAdjusting, setIsAdjusting] = React.useState(false);

  const canUseAdminTools = user?.role === 'admin';

  const loadPricing = React.useCallback(async () => {
    setError('');
    setIsLoading(true);
    try {
      const pricing = await firebaseService.getCreditPricing();
      const next = DEFAULT_ROWS.map((r) => {
        const item = pricing?.[r.feature_name];
        if (!item) return r;
        return {
          feature_name: r.feature_name,
          credit_cost: typeof item.credit_cost === 'number' ? item.credit_cost : r.credit_cost,
          is_active: item.is_active !== false,
        };
      });
      setRows(next);
    } catch (e: any) {
      setError(e?.message || 'Failed to load pricing');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!firebaseService?.isInitialized?.()) return;
    loadPricing();
  }, [loadPricing]);

  const savePricing = async () => {
    setError('');
    setIsSaving(true);
    try {
      for (const r of rows) {
        await firebaseService.upsertCreditPricing({
          feature_name: r.feature_name,
          credit_cost: r.credit_cost,
          is_active: r.is_active,
        });
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to save pricing');
    } finally {
      setIsSaving(false);
    }
  };

  const searchUser = async () => {
    setError('');
    setFoundUserId(null);
    setFoundEmail(null);
    setBalance(null);

    const q = searchValue.trim();
    if (!q) return;

    try {
      if (!firebaseService?.isInitialized?.()) throw new Error('Firebase not configured');

      // If it looks like an email, resolve user by email.
      let uid: string | null = null;
      let email: string | null = null;

      if (q.includes('@')) {
        const byEmail = await firebaseService.findUserByEmail(q);
        if (byEmail?.uid) {
          uid = byEmail.uid;
          email = byEmail.email || q;
        } else {
          // Fallback: some installs store email in loginId.
          const byLoginId = await firebaseService.findUserByLoginId(q);
          if (byLoginId?.uid) {
            uid = byLoginId.uid;
            email = byLoginId.email || q;
          }
        }
      }

      // Otherwise assume it's a UID.
      if (!uid) {
        uid = q;
        const u = await firebaseService.getUserById(uid);
        email = u?.email || null;
      }

      if (!uid) throw new Error('User not found');

      await firebaseService.ensureUserCreditProfile(uid);
      const profile = await firebaseService.getUserCreditProfile(uid);

      setFoundUserId(uid);
      setFoundEmail(email);
      setBalance(profile?.credit_balance ?? 0);
    } catch (e: any) {
      setError(e?.message || 'Search failed');
    }
  };

  const submitAdjustment = async () => {
    if (!foundUserId) return;
    const reason = adjustReason.trim();
    if (!reason) {
      setError('Reason is required');
      return;
    }

    setError('');
    setIsAdjusting(true);
    try {
      const res = await firebaseService.adminAdjustCredits({
        userId: foundUserId,
        amount: adjustAmount,
        reason,
        adminId: user?.id,
      });
      setBalance(res.new_balance);
      setAdjustAmount(0);
      setAdjustReason('');
    } catch (e: any) {
      setError(e?.message || 'Adjustment failed');
    } finally {
      setIsAdjusting(false);
    }
  };

  if (!canUseAdminTools) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-sm text-slate-700 dark:text-slate-200">
          Admin access required.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 w-full max-w-none min-w-0">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Credit Pricing Table</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Update costs dynamically without code changes.</p>

        {error && (
          <div className="mt-3 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
            <div className="col-span-5">Feature</div>
            <div className="col-span-4">Cost</div>
            <div className="col-span-3">Active</div>
          </div>

          {rows.map((r) => (
            <div key={r.feature_name} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700/60 items-center">
              <div className="col-span-5 text-sm text-slate-800 dark:text-slate-100 font-mono">{r.feature_name}</div>
              <div className="col-span-4">
                <input
                  type="number"
                  min={0}
                  value={r.credit_cost}
                  onChange={(e) => {
                    const next = Math.max(0, Math.floor(Number(e.target.value || 0)));
                    setRows((prev) => prev.map((x) => (x.feature_name === r.feature_name ? { ...x, credit_cost: next } : x)));
                  }}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div className="col-span-3">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={r.is_active}
                    onChange={(e) => {
                      setRows((prev) => prev.map((x) => (x.feature_name === r.feature_name ? { ...x, is_active: e.target.checked } : x)));
                    }}
                  />
                  Enabled
                </label>
              </div>
            </div>
          ))}

          <div className="px-4 py-4 flex items-center gap-3">
            <button
              type="button"
              onClick={savePricing}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={loadPricing}
              disabled={isLoading}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
            >
              {isLoading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">User Wallet</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Search a user and apply manual credit adjustments.</p>

        <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="User UID (or email if your loginId is email)"
              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
            />
            <button
              type="button"
              onClick={searchUser}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 dark:bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:hover:bg-slate-600"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>

          {foundUserId && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 p-3">
                <div className="text-xs text-slate-500 dark:text-slate-400">User ID</div>
                <div className="mt-1 text-sm text-slate-800 dark:text-slate-100 font-mono break-all">{foundUserId}</div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 p-3">
                <div className="text-xs text-slate-500 dark:text-slate-400">Email</div>
                <div className="mt-1 text-sm text-slate-800 dark:text-slate-100 break-all">{foundEmail || '—'}</div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 p-3">
                <div className="text-xs text-slate-500 dark:text-slate-400">Current Balance</div>
                <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{balance ?? 0}</div>
              </div>
            </div>
          )}

          {foundUserId && (
            <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/20 p-4">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Manual Adjustment</div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Math.floor(Number(e.target.value || 0)))}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  placeholder="Amount (e.g. 100 or -30)"
                />
                <input
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  placeholder="Reason (required)"
                />
                <button
                  type="button"
                  onClick={submitAdjustment}
                  disabled={isAdjusting}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  {isAdjusting ? 'Applying…' : 'Apply'}
                </button>
              </div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Every adjustment writes a MANUAL_ADJUSTMENT transaction log.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
