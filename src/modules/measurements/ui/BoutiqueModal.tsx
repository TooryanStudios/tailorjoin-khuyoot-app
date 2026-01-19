import React from 'react';
import { createPortal } from 'react-dom';

export interface BoutiqueModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children?: React.ReactNode;
}

export const BoutiqueModal: React.FC<BoutiqueModalProps> = ({ open, title, onClose, children }) => {
  // ✅ FIXED: Using createPortal to prevent modal from being clipped/removed
  React.useEffect(() => {
    if (open) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [open]);

  if (!open) return null;
  
  return createPortal(
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      data-overlay="khuyoot-modal"
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative khiyoot-glass rounded-2xl max-w-lg w-full p-6 border border-gold-400/40">
        {title && <h3 className="text-lg font-bold text-gold-400 mb-3">{title}</h3>}
        {children}
        <div className="mt-4 text-right">
          <button className="px-4 py-2 rounded-xl khiyoot-glass" onClick={onClose}>إغلاق</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BoutiqueModal;
