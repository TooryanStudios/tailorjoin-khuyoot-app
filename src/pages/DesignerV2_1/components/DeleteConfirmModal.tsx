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
    <div data-overlay="khuyoot-modal" className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl max-w-[320px] w-full overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        <div className="p-5 text-center">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-red-50/50 dark:ring-red-900/10">
            <Trash2 className="w-6 h-6" />
          </div>
          
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">تأكيد الحذف</h3>
          
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            هل أنت متأكد من حذف <span className="font-bold text-zinc-900 dark:text-white px-1">{itemName}</span>؟ 
            لا يمكن التراجع عن هذا الإجراء.
          </p>
        </div>

        <div className="flex gap-2 p-4 pt-0">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold text-sm transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-red-200 dark:shadow-red-900/10"
          >
            حذف
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
