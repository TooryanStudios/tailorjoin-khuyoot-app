import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, Plus, LogIn } from 'lucide-react';
import { useCredits } from './CreditProvider';
import { useAuth } from '../../auth/useAuth';
import { requestLoginPrompt } from '../../auth/authEvents';

function readCachedBalance(uid: string): number | null {
  try {
    const raw = window.localStorage.getItem(`khuyoot:credits:lastBalance:${uid}`);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : null;
  } catch {
    return null;
  }
}

export const CreditBadge: React.FC<{ onRefill?: () => void; minimal?: boolean }> = ({ onRefill, minimal }) => {
  const navigate = useNavigate();
  const { enabled, currentBalance, isLoading, profile } = useCredits();
  const { status: authStatus, user: authUser } = useAuth();
  const authLoading = authStatus === 'loading';

  const effectiveUid = authUser?.uid || (authUser as any)?.id || null;
  const cachedBalance = effectiveUid ? readCachedBalance(effectiveUid) : null;

  if (authStatus !== 'authenticated' || !authUser) {
    if (authLoading || typeof cachedBalance === 'number') {
      return (
        <div className={`inline-flex items-center gap-3 rounded-full ${minimal ? '' : 'border border-zinc-200 bg-white/40 px-4 py-2'} text-xs text-zinc-600 backdrop-blur-md min-w-0`}>
          <Coins className="h-4 w-4 text-purple-500 animate-pulse" />
          {typeof cachedBalance === 'number' ? (
            <span className="whitespace-nowrap tabular-nums text-zinc-900">
              {cachedBalance} <span className="text-zinc-500">رصيد</span>
            </span>
          ) : (
            <div className="h-3 w-12 bg-zinc-100 rounded animate-pulse" />
          )}
        </div>
      );
    }

    if (!authLoading) {
      return (
        <div className={`inline-flex items-center gap-3 rounded-full ${minimal ? '' : 'border border-purple-200 bg-white/40 px-4 py-2'} text-xs text-zinc-800 backdrop-blur-md min-w-0`}>
          <LogIn className="h-4 w-4 text-purple-600" />
          <button
            type="button"
            onClick={() => requestLoginPrompt('user_action')}
            className="text-purple-600 hover:text-purple-700 font-medium transition-colors whitespace-nowrap"
          >
            سجل دخول لرؤية الرصيد
          </button>
        </div>
      );
    }

    return (
      <div className={`inline-flex items-center gap-3 rounded-full ${minimal ? '' : 'border border-zinc-200 bg-white/40 px-4 py-2'} text-xs text-zinc-600 backdrop-blur-md min-w-0`}>
        <LogIn className="h-4 w-4 text-zinc-400" />
        <span className="whitespace-nowrap text-zinc-500">جاري التحميل...</span>
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className={`inline-flex items-center gap-3 rounded-full ${minimal ? '' : 'border border-zinc-200 bg-white/40 px-4 py-2'} text-xs text-zinc-600 backdrop-blur-md min-w-0`}>
        <Coins className="h-4 w-4 text-amber-400" />
        <span className="whitespace-nowrap">Credits: {typeof cachedBalance === 'number' ? cachedBalance : '...'}</span>
      </div>
    );
  }

  const displayBalance = (authLoading || isLoading) && !profile ? (cachedBalance != null ? String(cachedBalance) : '...') : String(currentBalance);
  const isSyncing = authLoading || isLoading;

  return (
    <div
      className={`group relative inline-flex items-center gap-3 rounded-xl ${minimal ? '' : 'border border-amber-200 bg-white/60 shadow-sm px-3 py-1.5'} text-xs text-zinc-800 backdrop-blur-md min-w-0 transition-all duration-300 hover:border-amber-400 hover:bg-amber-50 cursor-pointer`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        navigate('/transaction-history');
      }}
    >
      <div className={`flex items-center justify-center p-1.5 rounded-lg bg-amber-50 border border-amber-100 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12 ${isSyncing ? 'animate-pulse' : ''}`}>
        <Coins className="h-4 w-4 text-amber-500" />
      </div>

      <div className="flex flex-col items-start leading-none">
        <span className="text-[9px] uppercase tracking-[0.1em] text-zinc-700 font-black mb-0.5 transition-colors duration-300 group-hover:text-amber-600">
          الرصيد
        </span>
        <span
          className={`text-base font-black tabular-nums transition-all duration-500 flex items-center ${
            isSyncing ? 'opacity-60 blur-[0.5px]' : ''
          } group-hover:scale-105 group-hover:text-amber-600 origin-left`}
          title={isSyncing ? 'جاري المزامنة...' : 'الرصيد الحالي'}
        >
          {displayBalance === '...' ? (
            <div className="h-5 w-10 bg-zinc-100 rounded animate-pulse" />
          ) : (
            displayBalance
          )}
        </span>
      </div>

      {onRefill && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRefill();
          }}
          className="ml-0.5 inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-[11px] font-black text-white hover:bg-purple-700 active:scale-95 transition-all shadow-lg shadow-purple-200"
        >
          <Plus className="h-3.5 w-3.5 stroke-[3]" />
          شحن
        </button>
      )}
    </div>
  );
};
