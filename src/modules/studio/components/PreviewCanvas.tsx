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
  showIntroCards?: boolean;
  onOpenTemplates?: () => void;
  onOpenFabric?: () => void;
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
  showIntroCards,
  onOpenTemplates,
  onOpenFabric,
}) => {
  return (
    <div className="h-full relative overflow-hidden bg-[#09090b]">
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
          showIntroCards={showIntroCards}
          onOpenTemplates={onOpenTemplates}
          onOpenFabric={onOpenFabric}
        />
      </div>
    </div>
  );
};
