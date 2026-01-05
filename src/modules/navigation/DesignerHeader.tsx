import * as React from 'react';
import { Home } from 'lucide-react';

export type DesignerHeaderProps = {
  onHome: () => void;
  rightSlot?: React.ReactNode;
};

export function DesignerHeader(props: DesignerHeaderProps) {
  const { onHome, rightSlot } = props;

  return (
    <div className="h-14 border-b border-zinc-800 px-6 flex items-center justify-between bg-zinc-950">
      <button
        onClick={onHome}
        className="flex items-center gap-3 hover:opacity-90 transition-opacity"
        title="العودة إلى الرئيسية"
        aria-label="العودة إلى الرئيسية"
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-teal-500/10 text-emerald-300">
          <Home className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 tracking-tight">
            خيوط
          </div>
          <div className="text-[10px] text-zinc-400 truncate">منصة التفصيل الذكي</div>
        </div>
      </button>

      <div className="flex items-center gap-4">{rightSlot}</div>
    </div>
  );
}
