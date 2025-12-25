import React from 'react';
import { ImageLibraryPicker } from '../../../../components/ImageLibraryPicker';

export function FabricImageLibraryModal(props: {
  open: boolean;
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  const { open, onSelect, onClose } = props;

  if (!open) return null;

  return (
    <div data-debug-modal="TRYON-FABRIC-IMAGE-LIBRARY">
      <div className="fixed top-4 left-4 text-[10px] bg-blue-600 text-white px-2 py-1 z-[2147483647] rounded-full font-black shadow-2xl ring-2 ring-white/70 select-text cursor-text">
        MODAL: TRYON-FABRIC-IMAGE-LIBRARY
      </div>
      <ImageLibraryPicker onSelect={onSelect} onClose={onClose} />
    </div>
  );
}
