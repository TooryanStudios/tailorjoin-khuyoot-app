import * as React from 'react';
import { Trash2 } from 'lucide-react';
import { CreditBadge } from '../../../CreditManager';

export type FloatingCreditChipProps = {
  onRefill?: () => void;
  onClear?: () => void;
  canClear?: boolean;
  disabled?: boolean;
};

export const FloatingCreditChip = React.memo(function FloatingCreditChip(props: FloatingCreditChipProps) {
  const { onRefill, onClear, canClear, disabled } = props;

  const showClear = Boolean(onClear);
  // IMPORTANT: Clear must always be enabled on mobile.
  // (Even if nothing is selected, clicking clear is a no-op but should remain available.)
  const clearLooksInactive = !Boolean(canClear);

  return (
    <div className="w-full flex items-center justify-between px-4 py-2.5 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800/50 rounded-[4px]">
      <div className="flex items-center">
        <CreditBadge onRefill={onRefill} minimal />
      </div>

      <div className="flex items-center gap-2">
        {showClear && (
          <button
            type="button"
            onClick={onClear}
            disabled={false}
            title="Clear selections"
            aria-label="Clear selections"
            className={
              'h-9 w-9 grid place-items-center rounded-full border transition-colors ' +
              (clearLooksInactive
                ? 'bg-zinc-950/20 border-zinc-900 text-zinc-500 hover:border-red-500/30 hover:text-zinc-200'
                : 'bg-zinc-950/40 border-zinc-800 text-zinc-200 hover:border-red-500/40')
            }
          >
            <Trash2 size={16} />
          </button>
        )}
        <img
          src="/logo_big.png?v=4"
          alt="Khuyoot"
          className="h-8 w-auto opacity-90"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
});
