import React from 'react';

export function FabricSelectCard(props: {
  imageUrl?: string | null;
  onClick: () => void;
}) {
  const { imageUrl, onClick } = props;

  return (
    <div className="grid gap-3 grid-cols-1">
      <div
        className="relative w-full aspect-[3/4] lg:aspect-auto lg:h-[360px] xl:h-[420px] lg:max-w-[520px] lg:mx-auto rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 cursor-pointer hover:border-blue-500 transition-all group"
        onClick={onClick}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="Fabric preview" className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
            <svg className="w-12 h-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
              />
            </svg>
            <span className="text-xs font-bold">اختر القماش</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-bold border border-white/30">
            اختر القماش
          </div>
        </div>
        <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] px-2 py-1 rounded-full font-bold">القماش</div>
      </div>
    </div>
  );
}
