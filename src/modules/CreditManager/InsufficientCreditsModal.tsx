import React from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';
import { useModalStore } from '../../store/useModalStore';

export const InsufficientCreditsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  required: number;
  balance: number;
  actionLabel?: string;
}> = ({ isOpen, onClose, required, balance, actionLabel }) => {
  const { setIsUpgradeModalOpen } = useModalStore();
  React.useEffect(() => {
    if (isOpen) {
      try { document.body.classList.add('modal-open'); } catch {}
    }
    return () => {
      try { document.body.classList.remove('modal-open'); } catch {}
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div data-overlay="khuyoot-modal" className="fixed inset-0 z-[10000] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-md mx-4 border border-zinc-200 rounded-2xl bg-white overflow-hidden shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-6 pt-8 pb-4 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-amber-600">رصيد منخفض</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">رصيد غير كافٍ</h2>
          <p className="text-sm text-zinc-500 text-center px-4">
            {actionLabel ? `${actionLabel} يتطلب ` : 'هذا الإجراء يتطلب '}<span className="text-zinc-900 font-bold">{required}</span> نقطة رصيد.
          </p>
        </div>

        <div className="px-6 pb-6">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-600">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">رصيدك الحالي</span>
              <span className="font-bold text-zinc-900">{balance}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-zinc-500">المطلوب</span>
              <span className="font-bold text-zinc-900">{required}</span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => {
                // Open the upgrade/refill modal directly
                try { setIsUpgradeModalOpen(true); } catch {}
                onClose();
              }}
              className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-100 active:scale-95"
            >
              شحن الرصيد
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-3 bg-zinc-100 text-zinc-600 font-bold rounded-xl hover:bg-zinc-200 transition-all active:scale-95"
            >
              حسناً
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
