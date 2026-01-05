import * as React from 'react';
import { ComparisonSlider } from '../../designer/mobile/components/ComparisonSlider';
import { FloatingCreditChip } from '../../designer/mobile/components/FloatingCreditChip';

export type PreviewCanvasProps = {
  beforeImage: string;
  afterImage: string;
  sliderPos: number;
  onSliderChange: (next: number) => void;
  isProcessing: boolean;
  fabricPreviewUrl?: string;
  fabricProductId?: string;
  fabricDebug?: any;
  onRefillCredits?: () => void;
  lightingPreset: string;
  onSelectLightingPreset: (preset: any) => void;
};

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  beforeImage,
  afterImage,
  sliderPos,
  onSliderChange,
  isProcessing,
  fabricPreviewUrl,
  fabricProductId,
  fabricDebug,
}) => {
  return (
    <div className="h-full relative overflow-hidden bg-[#09090b]">
      {/* Background parity with desktop (Zinc-950/900) */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/20 to-transparent" />
      
      <div className="relative h-full w-full px-10">
        <ComparisonSlider
          before={beforeImage}
          after={afterImage}
          value={sliderPos}
          onChange={onSliderChange}
          isProcessing={isProcessing}
          fabricPreviewUrl={fabricPreviewUrl}
          fabricProductId={fabricProductId}
          fabricDebug={fabricDebug}
        />
      </div>
    </div>
  );
};
