import * as React from 'react';
import ImageSlider from '../../../../components/DesignerV2_1/ImageSlider';
import { FabricSourceTile } from '../../../results/FabricSourceTile';
import { traceStep } from '../../../../utils/trace';

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
  onUploadTemplate?: () => void;
  onOpenFabric?: () => void;
};

const CanvasPlaceholder = React.memo(function CanvasPlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-full max-w-[320px] px-4 text-center" />
    </div>
  );
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
    onUploadTemplate,
    onOpenFabric,
  } = props;

  const hasBefore = Boolean(before);
  const hasAfter = Boolean(after);
  const hasBoth = hasBefore && hasAfter;
  const hasAny = hasBefore || hasAfter;
  const singleImage = hasBefore ? before : after;
  const needsFabricPrompt = !fabricPreviewUrl && hasBefore;
  const isEmptyPlaceholder = !hasAny;
  const introFabricDisabled = Boolean(showIntroCards);

  return (
    <div className="h-full w-full px-6 py-3">
      <div
        className={
          'relative h-full w-full rounded-xl overflow-hidden border border-2 ' +
          (isEmptyPlaceholder
            ? 'border-dashed border-zinc-600/40 bg-zinc-900/60'
            : 'border-solid border-zinc-800/60 bg-zinc-950')
        }
      >
        {!hasAny && <CanvasPlaceholder />}

        {showIntroCards && (
          <div className="absolute inset-3 flex items-center justify-center">
            <div className="w-full max-w-[320px] px-4">
              <p className="mb-3 text-center text-xs font-medium text-white/70">👇 ابدأ باختيار القالب ثم الخامة</p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onUploadTemplate}
                  className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-zinc-600/50 bg-zinc-950/40 px-4 py-6 text-zinc-100 transition-colors hover:bg-zinc-900/40 hover:border-zinc-500/70 active:scale-95"
                >
                  <div className="h-14 w-14 rounded-2xl border border-zinc-800 bg-zinc-900/40 flex items-center justify-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-zinc-200">
                      <path d="M12 16V4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      <path d="M8 8l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4 20h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-sm font-extrabold tracking-wide">رفع صورة</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenTemplates}
                  className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-zinc-800/60 bg-zinc-950/40 px-4 py-6 text-zinc-100 transition-colors hover:bg-zinc-900/40 active:scale-95"
                >
                  <div className="h-14 w-14 rounded-2xl border border-zinc-800 bg-zinc-900/40 flex items-center justify-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-zinc-200">
                      <path d="M7 3l-2 6 3 6v6h8v-6l3-6-2-6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
                      <path d="M7 3c1.6 1.4 3.1 2 5 2s3.4-.6 5-2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-sm font-extrabold tracking-wide">اختر قالب</span>
                </button>

                <button
                  type="button"
                  onClick={introFabricDisabled ? undefined : onOpenFabric}
                  disabled={introFabricDisabled}
                  aria-disabled={introFabricDisabled}
                  className={
                    'group col-span-2 flex flex-col items-center justify-center gap-3 rounded-2xl border px-4 py-6 transition-colors ' +
                    (introFabricDisabled
                      ? 'border-2 border-zinc-900/60 bg-zinc-950/40 text-zinc-500 cursor-not-allowed'
                      : 'border-2 border-zinc-800/60 bg-zinc-950/40 text-zinc-100 hover:bg-zinc-900/40 active:scale-95')
                  }
                >
                  <div className="h-14 w-14 rounded-2xl border border-zinc-800 bg-zinc-900/40 flex items-center justify-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-zinc-200">
                      <path d="M4 7h16v10H4z" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M8 7l2-3h4l2 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-sm font-extrabold tracking-wide">اختر القماش</span>
                </button>
              </div>
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
            className="absolute inset-0 h-full w-full object-contain"
            loading="eager"
            decoding="async"
            draggable={false}
            onLoad={() => {
              try {
                const s = String(singleImage || '');
                const kind = s.startsWith('blob:') ? 'blob' : s.startsWith('data:') ? 'data' : s.startsWith('http') ? 'http' : 'other';
                traceStep('ComparisonSlider single img LOAD', { kind });
              } catch {
                // ignore
              }
            }}
            onError={() => {
              try {
                const s = String(singleImage || '');
                const kind = s.startsWith('blob:') ? 'blob' : s.startsWith('data:') ? 'data' : s.startsWith('http') ? 'http' : 'other';
                traceStep('ComparisonSlider single img ERROR', { kind });
              } catch {
                // ignore
              }
            }}
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
