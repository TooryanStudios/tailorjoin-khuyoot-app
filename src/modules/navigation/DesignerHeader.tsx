import * as React from 'react';
import { Home } from 'lucide-react';

export type DesignerHeaderProps = {
  onHome: () => void;
  title?: string;
  rightSlot?: React.ReactNode;
};

export function DesignerHeader(props: DesignerHeaderProps) {
  const { onHome, title, rightSlot } = props;

  return (
    <div className="h-14 border-b border-zinc-800 px-6 flex items-center justify-between bg-zinc-950">
      <button
        onClick={onHome}
        className="flex items-center gap-3 hover:opacity-90 transition-opacity"
        title="العودة إلى الرئيسية"
        aria-label="العودة إلى الرئيسية"
      >
        <img 
          src="/logo.png" 
          alt="خيوط" 
          className="h-12 w-auto object-contain"
        />
        {title && (
          <span className="text-sm font-bold text-white whitespace-nowrap">
            {title}
          </span>
        )}
      </button>

      <div className="flex items-center gap-4">{rightSlot}</div>
    </div>
  );
}
