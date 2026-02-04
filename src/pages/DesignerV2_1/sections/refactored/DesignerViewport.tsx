import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Download, Loader2, Maximize2, ZoomIn, Share2, Check } from 'lucide-react';
import ImageSlider from '../../../../components/DesignerV2_1/ImageSlider';
import { LightingPresets } from '../../components/LightingPresets';
import { ProcessingOverlay } from '../../../../modules/canvas/components/ProcessingOverlay';
import { FabricSourceTile } from '../../../../modules/results/FabricSourceTile';
import { HistoryFilmstrip } from '../../components/HistoryFilmstrip';

interface ViewportProps {
  features: any;
  uiState: any;
  sourceForComparison: string | null;
  afterImage: string | null;
  fabricMaterial: string;
  setFabricMaterial: (m: string) => void;
  sliderPos: number;
  setSliderPos: (pos: number) => void;
  isProcessing: boolean;
  progress: number;
  processingStatus: string;
  isLoadingHistoryImage: boolean;
  history: any[];
  activeId: string | null;
  fabricPreviewUrl: string | null;
  lastResponseDebug: any;
  isMobile: boolean;
  shareUrlCopied: boolean;
  handleShareTask: () => void;
  currentTaskId: string | null;
  lightingGenerator: any;
  handleSelectHistory: (item: any) => void;
  handleDeleteSlot: (jobId: string, event: React.MouseEvent) => void;
  setBeforeFromHistory: (item: any) => void;
  setAfterFromHistory: (item: any) => void;
  deletingItemId: string | null;
  isLoading: boolean;
  productId?: string;
}

export const DesignerViewport: React.FC<ViewportProps> = (props) => {
  const { t } = useTranslation(['designer']);
  const {
    features, uiState, sourceForComparison, afterImage, fabricMaterial, setFabricMaterial,
    sliderPos, setSliderPos, isProcessing, progress, processingStatus, isLoadingHistoryImage,
    history, activeId, fabricPreviewUrl, lastResponseDebug, isMobile,
    shareUrlCopied, handleShareTask, currentTaskId, lightingGenerator,
    handleSelectHistory, handleDeleteSlot, setBeforeFromHistory, setAfterFromHistory,
    deletingItemId, isLoading, productId
  } = props;

  return (
    <div className="p-8 pb-12 bg-transparent select-none">
      <div className="relative rounded-2xl border border-white/10 bg-zinc-900/40 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5),0_0_20px_var(--theme-primary-glow)] overflow-hidden backdrop-blur-md">
        {features.showComparisonSlider ? (
          <div className="relative px-4" dir="ltr">
            <ImageSlider
              before={sourceForComparison}
              after={afterImage}
              mode="fabric"
              fabricMaterial={fabricMaterial}
              onFabricMaterialChange={setFabricMaterial}
              value={sliderPos}
              onChange={setSliderPos}
            />

            <FabricSourceTile
              debug={lastResponseDebug}
              fallbackThumbnailUrl={history.find((h: any) => (h?.jobId ?? h?.clientId) === activeId)?.fabricUrl || fabricPreviewUrl || undefined}
              productId={history.find((h: any) => (h?.jobId ?? h?.clientId) === activeId)?.fabricId || undefined}
            />

            {isProcessing && (
              <div className="absolute inset-0 z-50 pointer-events-none">
                <div className="scan-line" />
                <ProcessingOverlay progress={progress} message={processingStatus} />
              </div>
            )}
            {isLoadingHistoryImage && (
              <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-md flex items-center justify-center z-[60]">
                <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-black/40 border border-white/5 shadow-2xl">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-theme-primary/10 border-t-theme-primary rounded-full animate-spin" />
                    <div className="absolute inset-0 w-12 h-12 border-4 border-theme-primary/20 rounded-full" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{t('resultLoading')}</span>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest italic">Syncing neural layers...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Lighting presets row (below canvas) */}
      <div className="mt-2 mb-1 flex items-center justify-between">
        {!isMobile && features.showFloatingToolbar && (
          <div className="flex items-center gap-2 h-12 px-2 rounded-xl border border-zinc-800 bg-zinc-900/60">
            <button
              type="button"
              title={shareUrlCopied ? t('shareLinkCopied') : t('shareDesign')}
              onClick={handleShareTask}
              disabled={!currentTaskId}
              className={`p-2 bg-zinc-900/90 border rounded-lg transition-all ${
                shareUrlCopied
                  ? 'border-green-500/60 bg-green-500/10'
                  : 'border-zinc-800 hover:border-theme-primary/60'
              } ${!currentTaskId ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {shareUrlCopied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Share2 className="w-4 h-4 text-zinc-300" />
              )}
            </button>
            <button
              type="button"
              title={t('resultLoading')}
              className="p-2 bg-zinc-900/90 border border-zinc-800 rounded-lg hover:border-theme-primary/60 transition-colors"
            >
              <Download className="w-4 h-4 text-zinc-300" />
            </button>
            <button
              type="button"
              title={t('zoomIn')}
              className="p-2 bg-zinc-900/90 border border-zinc-800 rounded-lg hover:border-theme-primary/60 transition-colors"
            >
              <ZoomIn className="w-4 h-4 text-zinc-300" />
            </button>
            <button
              type="button"
              title={t('fullscreen')}
              className="p-2 bg-zinc-900/90 border border-zinc-800 rounded-lg hover:border-theme-primary/60 transition-colors"
            >
              <Maximize2 className="w-4 h-4 text-zinc-300" />
            </button>
            <div className="w-[1px] h-4 bg-white/10 mx-1" />
            <button
              type="button"
              title="Tailor This Design"
               onClick={() => {
                 const idToUse = productId || 'default';
                 window.location.href = `/studio/measurements/${idToUse}`;
               }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 shadow-lg shadow-emerald-500/10"
            >
              Tailor It
            </button>
          </div>
        )}
        <div className="flex-1 flex justify-center">
          <LightingPresets value={lightingGenerator.value} onChange={lightingGenerator.onSelectPreset} />
        </div>
      </div>

    </div>
  );
};
