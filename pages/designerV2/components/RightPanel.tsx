import React from 'react';
import { Sparkles, RotateCcw, Wand2 } from 'lucide-react';
import { Button } from '../../../components/Button';
import { AdminAnchor } from './AdminAnchor';

interface RightPanelProps {
  anchorId?: string;
  showAdminLabels?: boolean;
  onReset: () => void;
  onSave: () => void;
  onGenerate: () => void;
  selectedTemplateName?: string;
  children: React.ReactNode;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  anchorId,
  showAdminLabels,
  onReset,
  onSave,
  onGenerate,
  selectedTemplateName,
  children,
}) => {
  return (
    <AdminAnchor
      anchorId={anchorId}
      visible={showAdminLabels}
      label="section-right"
      className="relative overflow-visible transition-all duration-300 bg-white dark:bg-slate-900 flex flex-col z-20 order-2 md:order-2 md:min-h-[calc(85vh-74px)] w-full md:w-[360px] lg:w-[400px]"
    >
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-h-0 p-4 space-y-0 overflow-y-auto">
          <AdminAnchor
            anchorId="panel-studio-header"
            label="panel-studio-header"
            visible={showAdminLabels}
            className="flex items-center justify-between"
          >
          </AdminAnchor>
          {children}
        </div>

      </div>

      <div className="hidden md:block p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <Button
          onClick={onGenerate}
          size="lg"
          className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-slate-500/20"
        >
          <Wand2 className="w-4 h-4 ml-2" />
          GenerateXXXXX
        </Button>
      </div>
    </AdminAnchor>
  );
};
