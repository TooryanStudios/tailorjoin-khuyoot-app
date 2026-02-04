import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  modeless?: boolean;
  showFooter?: boolean;
  footer?: React.ReactNode;
  cancelText?: string;
  confirmText?: string;
  debugId?: string;
  headerActions?: React.ReactNode;
  containerClassName?: string;
  headerClassName?: string;
  titleClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  closeButtonClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  title, 
  children,
  maxWidth = 'max-w-lg',
  modeless = false,
  showFooter = false,
  footer,
  cancelText = 'إلغاء الأمر',
  confirmText = 'اعتماد',
  debugId,
  headerActions,
  containerClassName,
  headerClassName,
  titleClassName,
  contentClassName,
  footerClassName,
  closeButtonClassName
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const scrollLockAppliedRef = useRef(false);
  const prevBodyOverflowRef = useRef<string>('');
  const prevHtmlOverflowRef = useRef<string>('');

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);

      if (!modeless) {
        try {
          // Prefer overflow locking over position:fixed. It's significantly less likely
          // to cause mobile Safari layout "crush" / viewport glitches.
          scrollPositionRef.current = window.scrollY;

          prevBodyOverflowRef.current = document.body.style.overflow;
          prevHtmlOverflowRef.current = document.documentElement.style.overflow;

          document.body.style.overflow = 'hidden';
          document.documentElement.style.overflow = 'hidden';
          scrollLockAppliedRef.current = true;
        } catch {
          // If anything goes wrong, do not break rendering.
          scrollLockAppliedRef.current = false;
        }
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);

      if (!modeless && scrollLockAppliedRef.current) {
        try {
          document.body.style.overflow = prevBodyOverflowRef.current;
          document.documentElement.style.overflow = prevHtmlOverflowRef.current;
        } catch {
          // ignore
        } finally {
          scrollLockAppliedRef.current = false;
        }
      }
    };
  }, [isOpen, onClose, modeless]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const showDebug = !!debugId && !!import.meta?.env?.DEV;

  const backdropClass = modeless 
    ? "fixed inset-0 z-[1000] flex items-center justify-center p-4 pb-20 pointer-events-none"
    : "fixed inset-0 z-[1000] flex items-center justify-center p-4 pb-20 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200";

  const modalUi = (
    <div
      className={backdropClass}
      data-overlay="khuyoot-modal"
      data-debug-modal={debugId || undefined}
      onClick={modeless ? undefined : onClose}
    >
      <div
        ref={modalRef}
        className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200 pointer-events-auto border border-slate-200 dark:border-slate-700 relative ${containerClassName || ''}`}
        onClick={(e) => e.stopPropagation()}
        data-debug-modal={debugId || undefined}
      >
        {showDebug && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[9999] text-[10px] font-black px-2 py-1 rounded-full bg-slate-900 text-white shadow-xl ring-2 ring-white/70 select-text cursor-text">
            MODAL: {debugId}
          </div>
        )}

        {/* Header */}
        <div className={`flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800 ${headerClassName || ''}`}>
          <h3 className={`text-lg font-bold text-slate-900 dark:text-white ${titleClassName || ''}`}>{title}</h3>
          <div className="flex items-center gap-2">
            {headerActions}
            <button
              onClick={onClose}
              className={`p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors ${closeButtonClassName || ''}`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`p-3 overflow-y-auto custom-scrollbar flex-1 flex flex-col ${contentClassName || ''}`}>{children}</div>

        {/* Custom Footer Slot */}
        {footer && (
          <div className={`p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl shrink-0 ${footerClassName || ''}`}>
            {footer}
          </div>
        )}

        {/* Fixed Footer */}
        {!footer && showFooter && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm || onClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
              >
                <Check size={16} />
                {confirmText}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalUi, document.body);
};
