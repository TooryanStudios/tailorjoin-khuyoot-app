import React from 'react';
import { TryFabricControlsStrip } from './TryFabricControlsStrip';

export function TryFabricMainCard(props: {
  fabricSelectCard?: React.ReactNode;
  onRequestHelp?: () => void;
}) {
  const {
    fabricSelectCard,
    onRequestHelp,
  } = props;

  return (
    <div className="order-2 md:order-1 space-y-4">
      {fabricSelectCard ?? (
        
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          fabricSelectCard
          <div className="flex items-start gap-3">
            <div className="w-24 aspect-[3/4] rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
              
              <svg
                className="w-8 h-8 text-slate-300 dark:text-slate-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>

            <div className="flex-1">
              <div className="text-sm font-bold text-slate-800 dark:text-white">اختر القماش</div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">اختر صورة القماش ليظهر هنا.</div>
            </div>
          </div>
        </div>
      )}

      <TryFabricControlsStrip onRequestHelp={onRequestHelp} />
    </div>
  );
}
