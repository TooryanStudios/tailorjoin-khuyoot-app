import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FullComparisonProps {
  features: any;
  sourceForComparison: string | null;
  afterImage: string | null;
}

export const DesignerFullComparison: React.FC<FullComparisonProps> = React.memo((props) => {
  const { t } = useTranslation(['designer']);
  const { features, sourceForComparison, afterImage } = props;
  const [isCollapsed, setIsCollapsed] = useState(true);

  if (!features.showFullComparison) return null;

  return (
    <div className="border border-zinc-100/20 bg-white rounded-xl overflow-hidden mx-4 my-4" dir="ltr">
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-zinc-50 transition-colors"
      >
        <span className="text-sm font-medium text-zinc-700">مقارنة كاملة</span>
        {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
      </button>
      
      {!isCollapsed && (
        <div className="p-6 pt-0">
      <div className="grid grid-cols-2 gap-6 max-w-7xl mx-auto min-h-[420px]">
        {/* Source Image */}
        <div className="space-y-2 flex flex-col">
          <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{t('originalModel')}</div>
          <div className="w-full aspect-[3/4] bg-zinc-50 dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-100/20 dark:border-zinc-800 flex items-center justify-center relative">
            {sourceForComparison ? (
              <img
                src={sourceForComparison}
                alt="Source"
                className="absolute inset-0 w-full h-full object-contain"
                onError={(e) => {
                  console.warn('Failed to load source image:', sourceForComparison);
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
          </div>
        </div>

        {/* Result Image */}
        <div className="space-y-2 flex flex-col">
          <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{t('aiResult')}</div>
          <div className="w-full aspect-[3/4] bg-zinc-50 dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-100/20 dark:border-zinc-800 flex items-center justify-center relative">
            {afterImage ? (
              <img
                src={afterImage}
                alt="Result"
                className="absolute inset-0 w-full h-full object-contain"
                onError={(e) => {
                  console.warn('Failed to load result image:', afterImage);
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-zinc-400 dark:text-zinc-500">
                <div className="w-24 h-24 rounded-full bg-white dark:bg-zinc-800/50 border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                  <svg className="w-12 h-12 text-zinc-300 dark:text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-sm font-bold text-zinc-500 dark:text-zinc-400">{t('noResultYet')}</div>
                <div className="text-[10px] font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">{t('generateToSee')}</div>
              </div>
            )}
          </div>
        </div>
      </div>
        </div>
      )}
    </div>
  );
});
