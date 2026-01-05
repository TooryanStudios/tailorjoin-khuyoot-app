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
};

const CanvasPlaceholder = React.memo(function CanvasPlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative w-[220px] h-[320px] opacity-70">
        <div className="absolute inset-0 rounded-[48px] bg-gradient-to-b from-white/10 to-white/0" />
        <svg viewBox="0 0 200 280" className="absolute inset-0 w-full h-full" aria-hidden>
          <path
            d="M100 20c24 0 40 18 40 40 0 18-8 30-18 38 20 16 38 44 38 84v58c0 10-8 18-18 18H58c-10 0-18-8-18-18v-58c0-40 18-68 38-84-10-8-18-20-18-38 0-22 16-40 40-40z"
            fill="rgba(255,255,255,0.08)"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="2"
          />
        </svg>
        <div className="absolute -inset-8 rounded-[64px] blur-2xl bg-purple-500/10" />
      </div>
    </div>
  );
});

export const ComparisonSlider = React.memo(function ComparisonSlider(props: ComparisonSliderProps) {
  const { before, after, value, onChange, isProcessing, fabricPreviewUrl, fabricProductId, fabricDebug } = props;

  const hasAny = Boolean(before || after);

  return (
    <div className="h-full w-full pt-2 pb-2">
      <div className="relative h-full w-full rounded-xl border border-zinc-800/70 bg-zinc-900/50 overflow-hidden">
        {!hasAny && <CanvasPlaceholder />}

        {hasAny && (
          <ImageSlider
            before={before}
            after={after}
            value={value}
            onChange={onChange}
            heightClassName="h-full"
            className="rounded-2xl"
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
