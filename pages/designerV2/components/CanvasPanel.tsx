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
      className="w-full md:flex-[1.4] min-h-[50vh] md:min-h-[calc(85vh-74px)] relative bg-[#F0F0F3] dark:bg-[#050505] flex flex-col justify-start items-end overflow-visible border-b md:border-b-0 md:border-l border-slate-200 dark:border-slate-800 order-1 md:order-1"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-violet-200/40 to-fuchsia-100/40 dark:from-violet-900/10 dark:to-fuchsia-900/10 rounded-full blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.05] dark:opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(#d4d4d8 1.05px, transparent 1px)', backgroundSize: '12px 12px' }}
        />
        <div
          className="absolute inset-0 opacity-0 dark:opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(#1a1a1a 1.05px, transparent 1px)', backgroundSize: '12px 12px' }}
        />
      </div>

      <div className="relative w-full p-0 md:p-4 flex flex-col items-stretch justify-start z-10 max-w-full">
        {children}
      </div>
    </AdminAnchor>
  );
};
