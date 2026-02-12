import React from 'react';
import { useTranslation } from 'react-i18next';
import ImageSlider from '../../../components/DesignerV2_1/ImageSlider';
import { ProcessingOverlay } from '../../../modules/canvas/components/ProcessingOverlay';
import { FabricSourceTile } from '../../../modules/results/FabricSourceTile';

export type ComparisonPanelProps = {
  showComparisonSlider: boolean;
  sourceForComparison: string | null;
  afterImage: string | null;
  fabricMaterial: 'silk' | 'cotton' | 'transparent' | 'velvet' | 'linen' | 'wool' | null;
  onFabricMaterialChange: (value: 'silk' | 'cotton' | 'transparent' | 'velvet' | 'linen' | 'wool' | null) => void;
  sliderPos: number;
  onSliderChange: (value: number) => void;
  history: any[];
  activeId: string | null;
  fabricPreviewUrl?: string | null;
  lastResponseDebug: any;
  isProcessing: boolean;
  progress: number;
  processingStatus: string;
  isLoadingHistoryImage: boolean;
};

export function ComparisonPanel(props: ComparisonPanelProps) {
  const { t, i18n } = useTranslation(['designer']);
  const isAr = i18n.language === 'ar';
  const {
    showComparisonSlider,
    sourceForComparison,
    afterImage,
    fabricMaterial,
    onFabricMaterialChange,
    sliderPos,
    onSliderChange,
    history,
    activeId,
    fabricPreviewUrl,
    lastResponseDebug,
    isProcessing,
    progress,
    processingStatus,
    isLoadingHistoryImage,
  } = props;

  if (!showComparisonSlider) return null;

  const activeHistory = history.find((h: any) => (h?.jobId ?? h?.clientId) === activeId);

  return (
    <div className="relative px-4" dir="ltr">
      <ImageSlider
        before={sourceForComparison}
        after={afterImage}
        mode="fabric"
        fabricMaterial={fabricMaterial}
        onFabricMaterialChange={onFabricMaterialChange}
        value={sliderPos}
        onChange={onSliderChange}
      />

      <FabricSourceTile
        debug={lastResponseDebug}
        fallbackThumbnailUrl={activeHistory?.fabricUrl || fabricPreviewUrl || undefined}
        productId={activeHistory?.fabricId || undefined}
      />

      {isProcessing && <ProcessingOverlay progress={progress} message={processingStatus} />}

      {isLoadingHistoryImage && (
        <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            <span className="text-xs text-zinc-400">{t('loading')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
