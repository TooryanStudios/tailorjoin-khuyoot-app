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
    <div className="w-full flex items-center justify-between px-4 py-2.5 bg-purple-50/95 backdrop-blur-md border-b border-purple-100 rounded-[4px]">
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
                ? 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:border-red-400 hover:text-red-500'
                : 'bg-zinc-100 border-zinc-300 text-zinc-600 hover:border-red-400 hover:text-red-500')
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
