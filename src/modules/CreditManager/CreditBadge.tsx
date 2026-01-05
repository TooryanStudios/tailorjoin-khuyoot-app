import React from 'react';
import { Coins, Plus } from 'lucide-react';
import { useCredits } from './CreditProvider';

export const CreditBadge: React.FC<{ onRefill?: () => void; minimal?: boolean }> = ({ onRefill, minimal }) => {
  const { enabled, currentBalance, isLoading, profile } = useCredits();

  // In free mode we keep it minimal and non-blocking.
  if (!enabled) {
    return (
      <div className={`inline-flex items-center gap-3 rounded-full ${minimal ? '' : 'border border-zinc-800/80 bg-zinc-950/40 px-4 py-2'} text-xs text-zinc-300 backdrop-blur-md min-w-0`}>
        <Coins className="h-4 w-4 text-amber-400" />
        <span className="whitespace-nowrap">Credits: ∞</span>
      </div>
    );
  }

  const displayBalance = isLoading && !profile ? '—' : String(currentBalance);

  return (
    <div className={`inline-flex items-center gap-3 rounded-full ${minimal ? '' : 'border border-amber-400/20 bg-zinc-950/40 px-4 py-2'} text-xs text-zinc-200 backdrop-blur-md min-w-0`}>
      <Coins className="h-4 w-4 text-amber-400" />
      <span className="text-xl font-extrabold leading-none tabular-nums">{displayBalance}</span>
      <span className="text-zinc-300 whitespace-nowrap">Credits</span>
      {onRefill && (
        <button
          type="button"
          onClick={onRefill}
          className="ml-1 inline-flex items-center gap-1 rounded-full bg-purple-600 px-4 py-1.5 text-[12px] font-bold text-white hover:bg-purple-500 active:scale-95 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Refill
        </button>
      )}
    </div>
  );
};
