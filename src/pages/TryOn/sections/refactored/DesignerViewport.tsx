import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Download, Loader2, Maximize2, ZoomIn, Share2, Check, Trash2 } from 'lucide-react';
import ImageSlider from '../../../../components/DesignerV2_1/ImageSlider';
import { ProcessingOverlay } from '../../../../modules/canvas/components/ProcessingOverlay';
import { FabricSourceTile } from '../../../../modules/results/FabricSourceTile';
import { HistoryFilmstrip } from '../../components/HistoryFilmstrip';

const createObjectUrlFromDataUrl = (dataUrl: string): string | null => {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) return null;
  const metadata = dataUrl.slice(0, commaIndex);
  const base64 = dataUrl.slice(commaIndex + 1);
  const mimeMatch = metadata.match(/data:([^;]+);base64/i);
  const mimeType = mimeMatch?.[1] || 'image/png';

  try {
    const binary = atob(base64);
    const len = binary.length;
    const buffer = new Uint8Array(len);
    for (let i = 0; i < len; i += 1) {
      buffer[i] = binary.charCodeAt(i);
    }
    return URL.createObjectURL(new Blob([buffer], { type: mimeType }));
  } catch (error) {
    console.warn('DesignerViewport: failed to convert data URL to blob', error);
    return null;
  }
};
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
  handleSelectHistory: (item: any) => void;
  handleDeleteSlot: (jobId: string, event: React.MouseEvent) => void;
  setBeforeFromHistory: (item: any) => void;
  setAfterFromHistory: (item: any) => void;
  deletingItemId: string | null;
  isLoading: boolean;
  productId?: string;
  handleClearSelections?: () => void;
}

export const DesignerViewport: React.FC<ViewportProps> = (props) => {
  const { t } = useTranslation(['designer']);
  const {
    features, uiState, sourceForComparison, afterImage, fabricMaterial, setFabricMaterial,
    sliderPos, setSliderPos, isProcessing, progress, processingStatus, isLoadingHistoryImage,
    history, activeId, fabricPreviewUrl, lastResponseDebug, isMobile,
    shareUrlCopied, handleShareTask, currentTaskId,
    handleSelectHistory, handleDeleteSlot, setBeforeFromHistory, setAfterFromHistory,
    deletingItemId, isLoading, productId, handleClearSelections
  } = props;

  const afterDisplayUrlRef = React.useRef<string | null>(null);
  const [afterDisplayUrl, setAfterDisplayUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    const prevUrl = afterDisplayUrlRef.current;

    if (!afterImage) {
      if (prevUrl) {
        URL.revokeObjectURL(prevUrl);
        afterDisplayUrlRef.current = null;
      }
      setAfterDisplayUrl(null);
      return;
    }

    if (afterImage.startsWith('data:')) {
      const objectUrl = createObjectUrlFromDataUrl(afterImage);
      if (objectUrl) {
        if (prevUrl && prevUrl !== objectUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        afterDisplayUrlRef.current = objectUrl;
        setAfterDisplayUrl(objectUrl);
        return () => {
          if (afterDisplayUrlRef.current === objectUrl) {
            URL.revokeObjectURL(objectUrl);
            afterDisplayUrlRef.current = null;
          }
        };
      }
      if (prevUrl) {
        URL.revokeObjectURL(prevUrl);
        afterDisplayUrlRef.current = null;
      }
      setAfterDisplayUrl(null);
      return;
    }

    if (prevUrl) {
      URL.revokeObjectURL(prevUrl);
      afterDisplayUrlRef.current = null;
    }
    setAfterDisplayUrl(null);
  }, [afterImage]);

  return (
    <div className="p-2 pb-4 bg-[#e5e5e5] select-none">
      <div className="relative rounded-2xl border border-zinc-800 bg-white overflow-hidden">
        {features.showComparisonSlider ? (
          <div className="relative" dir="ltr">
            <ImageSlider
              before={sourceForComparison}
              after={afterDisplayUrl || afterImage || ''}
              mode="fabric"
              fabricMaterial={fabricMaterial}
              onFabricMaterialChange={setFabricMaterial}
              value={sliderPos}
              onChange={setSliderPos}
              heightClassName="h-auto aspect-[3/4] max-h-[75vh]"
            />

            <FabricSourceTile
              debug={lastResponseDebug}
              fallbackThumbnailUrl={fabricPreviewUrl || history.find((h: any) => (h?.jobId ?? h?.clientId) === activeId)?.fabricUrl || undefined}
              productId={history.find((h: any) => (h?.jobId ?? h?.clientId) === activeId)?.fabricId || undefined}
            />

            {isProcessing && (
              <div className="absolute inset-0 z-50 pointer-events-none">
                <div className="scan-line" />
                <ProcessingOverlay progress={progress} message={processingStatus} />
              </div>
            )}
            {isLoadingHistoryImage && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center z-[60]">
                <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white border border-zinc-300 shadow-lg">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-purple-100 border-t-purple-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 w-12 h-12 border-4 border-purple-100 rounded-full" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em]">{t('resultLoading')}</span>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest italic">Syncing neural layers...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

    </div>
  );
};
