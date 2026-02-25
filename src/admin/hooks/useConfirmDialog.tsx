import React from 'react';

export type ConfirmDialogOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

type ConfirmDialogProps = {
  open: boolean;
  options: ConfirmDialogOptions;
  onCancel: () => void;
  onConfirm: () => void;
};

const defaultOptions: ConfirmDialogOptions = {
  title: 'تأكيد الإجراء',
  message: '',
  confirmText: 'تأكيد',
  cancelText: 'إلغاء',
  danger: true,
};

export const AdminConfirmDialog: React.FC<ConfirmDialogProps> = ({ open, options, onCancel, onConfirm }) => {
  if (!open) return null;

  const merged = {
    ...defaultOptions,
    ...options,
  };

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={merged.title}
      >
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{merged.title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line mb-5">{merged.message}</p>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {merged.cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white ${
              merged.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-theme-primary hover:opacity-90'
            }`}
          >
            {merged.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export function useConfirmDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [options, setOptions] = React.useState<ConfirmDialogOptions>(defaultOptions);
  const resolverRef = React.useRef<((value: boolean) => void) | null>(null);

  const confirm = React.useCallback((nextOptions: ConfirmDialogOptions) => {
    setOptions({ ...defaultOptions, ...nextOptions });
    setIsOpen(true);

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const closeWith = React.useCallback((value: boolean) => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(value);
      resolverRef.current = null;
    }
  }, []);

  const confirmDialog = (
    <AdminConfirmDialog
      open={isOpen}
      options={options}
      onCancel={() => closeWith(false)}
      onConfirm={() => closeWith(true)}
    />
  );

  return {
    confirm,
    confirmDialog,
  };
}
