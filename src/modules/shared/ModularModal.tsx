import React from 'react';
import { createPortal } from 'react-dom';

export function ModularModal(props: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  const { isOpen, onClose, title, children } = props;

  React.useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000]">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 backdrop-blur-[12px] shadow-2xl overflow-hidden">
          {title ? (
            <div className="px-5 py-4 border-b border-white/10">
              <div className="flex items-center justify-between gap-4">
                <div className="text-white text-lg font-semibold">{title}</div>
                <button
                  type="button"
                  onClick={onClose}
                  className="h-10 w-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition"
                >
                  <span className="sr-only">Close</span>
                  <span className="text-white/80 text-xl leading-none">×</span>
                </button>
              </div>
            </div>
          ) : null}
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
