import * as React from 'react';
import ImageSlider from '../../../../components/DesignerV2_1/ImageSlider';
import { FabricSourceTile } from '../../../results/FabricSourceTile';

export type ComparisonSliderProps = {
  before: string;
  after: string;
  value: number;
  onChange: (next: number) => void;
  isProcessing?: boolean;
  fabricPreviewUrl?: string;
  fabricProductId?: string;
  fabricDebug?: any;
  showIntroCards?: boolean;
  onOpenTemplates?: () => void;
  onOpenFabric?: () => void;
};

const CanvasPlaceholder = React.memo(function CanvasPlaceholder() {
  return null;
});

export const ComparisonSlider = React.memo(function ComparisonSlider(props: ComparisonSliderProps) {
  const {
    before,
    after,
    value,
    onChange,
    isProcessing,
    fabricPreviewUrl,
    fabricProductId,
    fabricDebug,
    showIntroCards,
    onOpenTemplates,
    onOpenFabric,
  } = props;

  const hasBefore = Boolean(before);
  const hasAfter = Boolean(after);
  const hasBoth = hasBefore && hasAfter;
  const hasAny = hasBefore || hasAfter;
  const singleImage = hasBefore ? before : after;
  const needsFabricPrompt = !fabricPreviewUrl && hasBefore;

  return (
    <div className="h-full w-full pt-2 pb-2">
      <div className="relative h-full w-full rounded-xl border border-zinc-800/70 bg-zinc-950 overflow-hidden">
        {!hasAny && <CanvasPlaceholder />}

        {showIntroCards && (
          <div className="absolute inset-0 flex items-center justify-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-full max-w-[320px] px-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onOpenTemplates}
                  className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-purple-500/40 bg-gradient-to-br from-purple-900/30 to-zinc-900/80 px-4 py-6 text-white shadow-xl shadow-purple-500/20 transition-all hover:scale-105 hover:border-purple-400/60 hover:shadow-2xl hover:shadow-purple-500/30 active:scale-95 animate-in slide-in-from-left-4 fade-in duration-700"
                  style={{ animationDelay: '100ms' }}
                >
                  <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center ring-2 ring-purple-500/30 group-hover:ring-purple-400/50 transition-all group-hover:scale-110 animate-bounce">
                    <span className="absolute inset-0 rounded-2xl ring-2 ring-purple-500/40 animate-ping opacity-30" />
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-purple-300 group-hover:text-purple-200 transition-colors">
                      <path d="M7 3l-2 6 3 6v6h8v-6l3-6-2-6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
                      <path d="M7 3c1.6 1.4 3.1 2 5 2s3.4-.6 5-2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-sm font-extrabold tracking-wide">اختر قالب</span>
                  <div className="h-1 w-8 rounded-full bg-purple-500/50 group-hover:w-12 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={onOpenFabric}
                  className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-pink-500/40 bg-gradient-to-br from-pink-900/30 to-zinc-900/80 px-4 py-6 text-white shadow-xl shadow-pink-500/20 transition-all hover:scale-105 hover:border-pink-400/60 hover:shadow-2xl hover:shadow-pink-500/30 active:scale-95 animate-in slide-in-from-right-4 fade-in duration-700"
                  style={{ animationDelay: '200ms' }}
                >
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-pink-500/20 to-pink-600/10 flex items-center justify-center ring-2 ring-pink-500/30 group-hover:ring-pink-400/50 transition-all group-hover:scale-110">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-pink-300 group-hover:text-pink-200 transition-colors">
                      <path d="M4 7h16v10H4z" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M8 7l2-3h4l2 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-sm font-extrabold tracking-wide">اختر القماش</span>
                  <div className="h-1 w-8 rounded-full bg-pink-500/50 group-hover:w-12 transition-all" />
                </button>
              </div>
              <p className="mt-4 text-center text-xs font-medium text-white/60 animate-in fade-in duration-1000" style={{ animationDelay: '400ms' }}>
                👉 ابدأ باختيار القالب ثم الخامة
              </p>
            </div>
          </div>
        )}


        {hasBoth && (
          <ImageSlider
            before={before}
            after={after}
            value={value}
            onChange={onChange}
            heightClassName="h-full"
            className="rounded-2xl"
          />
        )}

        {!hasBoth && hasAny && (
          <img
            src={singleImage}
            alt="Preview"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        )}

        <FabricSourceTile
          debug={fabricDebug}
          fallbackThumbnailUrl={fabricPreviewUrl}
          productId={fabricProductId}
        />

        {isProcessing && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm">
              Processing…
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
