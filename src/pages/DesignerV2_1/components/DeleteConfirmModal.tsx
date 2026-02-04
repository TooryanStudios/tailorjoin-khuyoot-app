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
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600/20 rounded-lg">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-100">تأكيد الحذف</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-zinc-800 rounded-md transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-zinc-300">
            هل أنت متأكد من حذف <span className="font-semibold text-zinc-100">{itemName}</span>؟
          </p>
          <p className="text-xs text-zinc-500 mt-2">
            لا يمكن التراجع عن هذا الإجراء.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-zinc-950 border-t border-zinc-800">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            حذف
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
