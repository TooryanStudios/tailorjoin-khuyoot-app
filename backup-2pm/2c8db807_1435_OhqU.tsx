import React from 'react';

export function TryFabricControlsStrip(props: {
  templateSelectCard?: React.ReactNode;
  fabricSelectCard?: React.ReactNode;
  onRequestHelp?: () => void;
  onOpenTemplatePicker?: () => void;
  onOpenFabricPicker?: () => void;
}) {
  const { templateSelectCard, fabricSelectCard, onRequestHelp, onOpenTemplatePicker, onOpenFabricPicker } = props;

  console.log('[TryFabricControlsStrip] Render', {
    hasTemplateSelectCard: !!templateSelectCard,
    hasFabricSelectCard: !!fabricSelectCard,
    hasOnRequestHelp: !!onRequestHelp,
    hasOnOpenTemplatePicker: !!onOpenTemplatePicker,
    hasOnOpenFabricPicker: !!onOpenFabricPicker
  });

  return (
    <div className="flex items-stretch gap-3"
      onClick={() => console.log('[TryFabricControlsStrip] Container clicked')}
    >
      {onOpenTemplatePicker && (
        <div className="flex-1">
          <button
            type="button"
            onClick={(e) => {
              console.log('[TryFabricControlsStrip] Template picker button clicked');
              e.preventDefault();
              e.stopPropagation();
              onOpenTemplatePicker();
            }}
            className="relative w-full aspect-[3/4] lg:aspect-auto lg:h-[260px] xl:h-[260px] lg:max-w-[520px] lg:mx-auto rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer hover:border-emerald-500 transition-all group flex flex-col items-center justify-center text-slate-400 border-2 border-slate-300 dark:border-slate-600"
            title="اختر التصميم"
          >
            <svg className="w-12 h-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs font-bold">اختر التصميم</span>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-bold border border-white/30">
                اختر التصميم
              </div>
            </div>
            <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] px-2 py-1 rounded-full font-bold">التصميم</div>
          </button>
        </div>
      )}

      {onOpenFabricPicker && (
        <button
          type="button"
          onClick={onOpenFabricPicker}
          className="shrink-0 px-4 min-w-[96px] rounded-3xl text-xs font-black bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white shadow-xl shadow-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center"
          title="اختر القماش"
        >
          اختر القماش
        </button>
      )}

      {templateSelectCard && (
        <div className="flex-1">
          {templateSelectCard}
        </div>
      )}

      {fabricSelectCard && (
        <div className="flex-1">
          {fabricSelectCard}
        </div>
      )}

      {onRequestHelp && (
        <button
          type="button"
          onClick={onRequestHelp}
          className="shrink-0 px-4 min-w-[96px] rounded-3xl text-xs font-black bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-xl shadow-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center"
          title="مساعدة"
        >
          مساعدة
        </button>
      )}
    </div>
  );
}
