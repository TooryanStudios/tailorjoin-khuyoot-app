import React, { useEffect, useRef } from 'react';
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
  headerActions
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      if (!modeless) {
        // Save scroll position before hiding overflow
        scrollPositionRef.current = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollPositionRef.current}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      if (!modeless) {
        // Restore scroll position
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollPositionRef.current);
      }
    };
  }, [isOpen, onClose, modeless]);

  if (!isOpen) return null;

  const showDebug = !!debugId && !!import.meta?.env?.DEV;

  const backdropClass = modeless 
    ? "fixed inset-0 z-[100] flex items-center justify-center p-4 pb-20 pointer-events-none"
    : "fixed inset-0 z-[100] flex items-center justify-center p-4 pb-20 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200";

  return (
    <div className={backdropClass} data-overlay="khuyoot-modal" data-debug-modal={debugId || undefined}>
      <div 
        ref={modalRef}
        className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200 pointer-events-auto border border-slate-200 dark:border-slate-700 relative`}
        onClick={(e) => e.stopPropagation()}
        data-debug-modal={debugId || undefined}
      >
        {showDebug && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[9999] text-[10px] font-black px-2 py-1 rounded-full bg-slate-900 text-white shadow-xl ring-2 ring-white/70 select-text cursor-text">
            MODAL: {debugId}
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {title}
          </h3>
          <div className="flex items-center gap-2">
            {headerActions}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-3 overflow-y-auto custom-scrollbar flex-1 flex flex-col">
          {children}
        </div>

        {/* Custom Footer Slot */}
        {footer && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl shrink-0">
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
};
