import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  content?: string;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, content }) => {
  const [agreed, setAgreed] = React.useState(false);

  // Manage modal-open class on body to prevent cleanup from removing modal
  useEffect(() => {
    if (isOpen) {
      setAgreed(false);
      document.body.classList.add('modal-open');
      return () => {
        document.body.classList.remove('modal-open');
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleViewFull = () => {
    onClose();
    window.location.href = '/terms';
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-start md:items-center justify-center p-4 md:p-6 overflow-y-auto"
      data-overlay="khuyoot-modal"
    >
      <div
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-2xl bg-zinc-950 text-white rounded-2xl border border-zinc-800 shadow-2xl overflow-y-auto max-h-[80vh] animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-zinc-950 border-b border-zinc-800 p-4">
          <h2 className="text-lg font-bold text-white">الشروط والأحكام</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 text-slate-900">
            <div className="max-h-[45vh] overflow-y-auto p-4">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {content || 'لم يتم تحديد الشروط والأحكام حتى الآن.'}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-zinc-200">
            <input
              id="terms-agree"
              type="checkbox"
              className="mt-0.5 h-4 w-4"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <label htmlFor="terms-agree">أقر أنني قرأت الشروط والأحكام وأوافق عليها.</label>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleViewFull}
              className="text-xs font-semibold text-purple-300 hover:text-purple-200 transition"
            >
              اقرأ الصفحة الكاملة
            </button>
            <button
              onClick={onClose}
              disabled={!agreed}
              className="px-4 py-2 rounded-lg text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              أوافق وأكمل
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
