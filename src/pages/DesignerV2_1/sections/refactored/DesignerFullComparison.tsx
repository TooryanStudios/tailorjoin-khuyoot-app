import React from 'react';
import { useTranslation } from 'react-i18next';

interface FullComparisonProps {
  features: any;
  sourceForComparison: string | null;
  afterImage: string | null;
}

export const DesignerFullComparison: React.FC<FullComparisonProps> = (props) => {
  const { t } = useTranslation(['designer']);
  const { features, sourceForComparison, afterImage } = props;

  if (!features.showFullComparison) return null;

  return (
    <div className="border-t border-zinc-800 bg-zinc-950 p-6" dir="ltr">
      <div className="grid grid-cols-2 gap-6 max-w-7xl mx-auto min-h-[420px]">
        {/* Source Image */}
        <div className="space-y-2 flex flex-col">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{t('originalModel')}</div>
          <div className="flex-1 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 flex items-center justify-center relative min-h-[420px]">
            {sourceForComparison ? (
              <img
                src={sourceForComparison}
                alt="Source"
                className="absolute inset-0 w-full h-full object-contain"
              />
            ) : null}
          </div>
        </div>

        {/* Result Image */}
        <div className="space-y-2 flex flex-col">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{t('aiResult')}</div>
          <div className="flex-1 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 flex items-center justify-center relative min-h-[420px]">
            {afterImage ? (
              <img
                src={afterImage}
                alt="Result"
                className="absolute inset-0 w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-zinc-500">
                <div className="w-24 h-24 rounded-full bg-zinc-800/50 border-2 border-dashed border-zinc-700 flex items-center justify-center">
                  <svg className="w-12 h-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-sm font-medium">{t('noResultYet')}</div>
                <div className="text-xs text-zinc-600">{t('generateToSee')}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
