import React from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  itemName?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  itemName = 'هذا التوليد',
}) => {
  // Prevent overlay cleanup from removing this modal
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
    <div data-overlay="khuyoot-modal" className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 dark:bg-red-600/20 rounded-xl">
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-500" />
            </div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">تأكيد الحذف</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 font-sans">
          <p className="text-zinc-600 dark:text-zinc-300 text-base leading-relaxed">
            هل أنت متأكد أنك تريد حذف <span className="font-bold text-zinc-900 dark:text-white underline decoration-red-500/30">{itemName}</span>؟ 
            لا يمكن التراجع عن هذا الإجراء وسيتم مسح جميع البيانات المرتبطة بهذا التصميم.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all active:scale-95 text-sm"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-200 dark:shadow-red-900/10 text-sm flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            حذف نهائياً
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
