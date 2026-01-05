import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

export const InsufficientCreditsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  required: number;
  balance: number;
  actionLabel?: string;
}> = ({ isOpen, onClose, required, balance, actionLabel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-md mx-4 border border-zinc-800 rounded-2xl bg-zinc-950 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-200 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-6 pt-8 pb-4 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-200">LOW CREDITS</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Insufficient Credits</h2>
          <p className="text-sm text-zinc-400">
            {actionLabel ? `${actionLabel} requires ` : 'This action requires '}<span className="text-zinc-200 font-semibold">{required}</span> credits.
          </p>
        </div>

        <div className="px-6 pb-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-sm text-zinc-300">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Your balance</span>
              <span className="font-semibold">{balance}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-zinc-400">Needed</span>
              <span className="font-semibold">{required}</span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-3 bg-zinc-800 text-zinc-200 font-semibold rounded-lg hover:bg-zinc-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
