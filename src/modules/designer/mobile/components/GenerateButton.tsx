import * as React from 'react';
import { Loader2 } from 'lucide-react';

export type GenerateButtonProps = {
  cost?: number;
  disabled: boolean;
  isProcessing: boolean;
  onClick: () => void;
};

export const GenerateButton = React.memo(function GenerateButton(props: GenerateButtonProps) {
  const { cost, disabled, isProcessing, onClick } = props;

  return (
    <div className="">
      <div className="rounded-xl border border-zinc-200 bg-white/50 p-1.5">
        <button
          type="button"
          disabled={disabled || isProcessing}
          onClick={onClick}
          className={
            'w-full py-4 rounded-lg font-black shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest ' +
            (disabled || isProcessing
              ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400 active:scale-[0.98]')
          }
        >
          {isProcessing && <Loader2 className="h-5 w-5 animate-spin" />}
          {isProcessing ? 'جاري التنفيذ...' : `توليد التصميم${typeof cost === 'number' && cost > 0 ? ` (${cost})` : ''}`}
        </button>
      </div>
    </div>
  );
});
