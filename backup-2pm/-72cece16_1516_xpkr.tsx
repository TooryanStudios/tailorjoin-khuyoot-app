import React from 'react';
import { AdminAnchor } from './AdminAnchor';

interface CanvasPanelProps {
  anchorId?: string;
  showAdminLabels?: boolean;
  tryFabricSectionRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}

export const CanvasPanel: React.FC<CanvasPanelProps> = ({
  anchorId,
  showAdminLabels,
  tryFabricSectionRef,
  children,
}) => {
  return (
    <AdminAnchor
      anchorId={anchorId}
      visible={showAdminLabels}
      label="section-left"
      className="w-full md:flex-[1.4] min-h-[400px] md:min-h-[calc(85vh-74px)] relative bg-[#F0F0F3] dark:bg-[#050505] flex flex-col justify-start items-center overflow-visible border-b md:border-b-0 md:border-l border-slate-200 dark:border-slate-800 order-1 md:order-1"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-violet-200/40 to-fuchsia-100/40 dark:from-violet-900/10 dark:to-fuchsia-900/00 rounded-full blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{ backgroundImage: 'radial-gradient(#a1a1aa 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        />
      </div>

      <div className="relative w-full p-2 flex flex-col items-stretch justify-start z-10">
        {children}
      </div>
    </AdminAnchor>
  );
};
