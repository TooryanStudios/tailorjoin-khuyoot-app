import React from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import { TemplateCard } from './TemplateCard.jsx';
import { UploadSection } from './UploadSection.jsx';

export const ClosetItems = React.memo(function ClosetItems({
  items,
  onSelect,
  currentId,
  onUploadToCloset,
  onDeleteTemplate,
  onHover,
  extra = null,
  loadingTemplateId = null,
}) {
  const DELETE_CONFIRM_KEY = 'khuyoot_closet_delete_confirm_disabled';
  const [deletingId, setDeletingId] = React.useState(null);
  const [pendingDelete, setPendingDelete] = React.useState(null);
  const [dontAskAgain, setDontAskAgain] = React.useState(false);
  const [skipConfirm, setSkipConfirm] = React.useState(() => {
    try {
      return window.localStorage.getItem(DELETE_CONFIRM_KEY) === '1';
    } catch {
      return false;
    }
  });

  const persistSkipConfirm = React.useCallback((value) => {
    try {
      if (value) window.localStorage.setItem(DELETE_CONFIRM_KEY, '1');
      else window.localStorage.removeItem(DELETE_CONFIRM_KEY);
    } catch {
      // ignore
    }
  }, []);

  const deleteNow = React.useCallback(async (template) => {
    if (!template?.id || !onDeleteTemplate) return;
    setDeletingId(template.id);
    try {
      await onDeleteTemplate(template);
    } finally {
      setDeletingId(null);
    }
  }, [onDeleteTemplate]);

  const handleDelete = React.useCallback(async (template, event) => {
    event?.stopPropagation?.();
    if (!template?.id) return;
    if (!onDeleteTemplate) return;

    if (skipConfirm) {
      await deleteNow(template);
      return;
    }

    setPendingDelete(template);
    setDontAskAgain(false);
  }, [deleteNow, onDeleteTemplate, skipConfirm]);

  const handleConfirmDelete = React.useCallback(async () => {
    if (!pendingDelete) return;
    if (dontAskAgain) {
      setSkipConfirm(true);
      persistSkipConfirm(true);
    }
    const target = pendingDelete;
    setPendingDelete(null);
    await deleteNow(target);
  }, [deleteNow, dontAskAgain, pendingDelete, persistSkipConfirm]);

  const handleCancelDelete = React.useCallback(() => {
    setPendingDelete(null);
  }, []);
  return (
    <>
      {extra ? (
        <div className="col-span-2 mt-2">{extra}</div>
      ) : null}

      {items?.length ? (
        items.map((template) => (
          <div key={template.id} className="relative group">
            <TemplateCard
              template={template}
              isActive={Boolean(currentId && template.id === currentId)}
              onSelect={onSelect}
              onHover={onHover}
              isLoading={loadingTemplateId === template.id}
            />
            <button
              type="button"
              onClick={(event) => handleDelete(template, event)}
              disabled={deletingId === template.id}
              className={`absolute top-2 left-2 z-10 rounded-md border px-2 py-1 text-[10px] font-semibold transition-all opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto sm:opacity-0 sm:pointer-events-none sm:group-hover:opacity-100 sm:group-hover:pointer-events-auto max-sm:opacity-100 max-sm:pointer-events-auto ${
                deletingId === template.id
                  ? 'border-red-500/60 bg-red-500/20 text-red-200 cursor-wait'
                  : 'border-zinc-700/80 bg-zinc-950/70 text-zinc-300 hover:border-red-500/60 hover:text-red-200'
              }`}
              title="حذف الصورة"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))
      ) : (
        <div className="col-span-2 rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
          No saved templates yet.
        </div>
      )}

      <Modal
        isOpen={Boolean(pendingDelete)}
        onClose={handleCancelDelete}
        title="تأكيد الحذف"
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancelDelete}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
            >
              حذف نهائي
            </button>
          </div>
        }
      >
        <div className="text-sm text-slate-700 dark:text-slate-200">
          هل تريد حذف هذه الصورة نهائيًا من الخزانة؟ لا يمكن التراجع عن هذا الإجراء.
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
          <input
            type="checkbox"
            checked={dontAskAgain}
            onChange={(e) => setDontAskAgain(e.target.checked)}
          />
          لا تسألني مرة أخرى
        </label>
      </Modal>
    </>
  );
});
