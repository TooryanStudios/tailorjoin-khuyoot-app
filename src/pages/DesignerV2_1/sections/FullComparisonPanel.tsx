import React from 'react';
import type { DesignerV2Features } from '../types';

type FullComparisonPanelProps = {
  t: (key: string) => string;
  features: DesignerV2Features;
  sourceForComparison: string | null;
  afterImage: string | null;
};

export function FullComparisonPanel({ t, features, sourceForComparison, afterImage }: FullComparisonPanelProps) {
  if (!features.showFullComparison || (!sourceForComparison && !afterImage)) return null;

  return (
    <div className="border-t border-zinc-800 bg-zinc-950 pt-0 px-6 pb-6" dir="ltr">
      <div className="grid grid-cols-2 gap-6 max-w-7xl mx-auto min-h-[420px]">
        <div className="space-y-2 flex flex-col">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{t('originalModel')}</div>
          <div className="flex-1 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 flex items-center justify-center relative min-h-[420px]">
            {sourceForComparison && <img src={sourceForComparison} alt="Source" className="absolute inset-0 w-full h-full object-contain" />}
          </div>
        </div>

        <div className="space-y-2 flex flex-col">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{t('aiResult')}</div>
          <div className="flex-1 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 flex items-center justify-center relative min-h-[420px]">
            {afterImage && <img src={afterImage} alt="Result" className="absolute inset-0 w-full h-full object-contain" />}
          </div>
        </div>
      </div>
    </div>
  );
}
