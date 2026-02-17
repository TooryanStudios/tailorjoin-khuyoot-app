import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FloatingCreditChip } from './components/FloatingCreditChip';
import { type FabricThumb } from './components/FabricPicker';
import { StudioLayout } from '../../studio/components/StudioLayout';
import { PreviewCanvas } from '../../studio/components/PreviewCanvas';
import { SelectionPanel } from '../../studio/components/SelectionPanel';
import { GenerationHistory } from '../../history/components/GenerationHistory';
import { useTemplateStore } from '../../TemplatePicker/useTemplateStore';
import { ImagePrepModal } from '../../../components/image/ImagePrepModal';
import { LightingPresets } from '../../../pages/TryOn/components/LightingPresets';
import { Check, X } from 'lucide-react';

const safeId = () => {
  try {
    return `upload-${crypto.randomUUID()}`;
  } catch {
    return `upload-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
};

export type LightingPreset = 'studio' | 'golden_hour' | 'cinematic' | 'day' | 'night';

export type MobileDesignerV2Props = {
  /** Disable the bottom drawer (StudioSheet) while keeping the rest of the UI enabled. */
  disableDrawer?: boolean;

  beforeImage: string;
  afterImage: string;
  sliderPos: number;
  onSliderChange: (next: number) => void;

  isProcessing: boolean;

  onSelectTemplate: (template: any) => void;
  currentTemplateId?: string;
  isSubscribedToPremiumTemplates?: boolean;
  onPremiumTemplateClick?: () => void;
  privacy: {
    isPrivacyMode: boolean;
    setPrivacyMode: (next: boolean) => void;
    maskingStyle: 'feathered-blur' | 'pixelate' | 'emoji';
    setMaskingStyle: (next: 'feathered-blur' | 'pixelate' | 'emoji') => void;
    blurStrength: number;
    setBlurStrength: (next: number) => void;
    selectedEmoji: string;
    setSelectedEmoji: (next: string) => void;
    isProcessingPrivacy: boolean;
    canApplyToCurrentTemplate: boolean;
    onApplyToCurrentTemplate: () => void;
    disabled?: boolean;
  };

  fabricPreviewUrl?: string;
  fabricProductId?: string;
  fabricDebug?: any;
  onUploadFabric: (file: File) => void;
  onSelectFabricFromUrl?: (url: string) => void;
  fabricThumbs?: FabricThumb[];
  fabricImageBase64?: string | null;
  fabricImageMimeType?: string | null;
  originalFabricData?: { base64: string; mimeType: string; url: string } | null;
  setFabricPreviewUrl?: (url: string | null) => void;
  setFabricImageBase64?: (base64: string | null) => void;
  setFabricImageMimeType?: (mime: string | null) => void;
  setOriginalFabricData?: (data: { base64: string; mimeType: string; url: string } | null) => void;

  lightingPreset: LightingPreset;
  onSelectLightingPreset: (preset: LightingPreset) => void;

  // Advanced Settings
  selectedModel: 'NanoBana' | 'Pro';
  onChangeSelectedModel: (next: 'NanoBana' | 'Pro') => void;
  upscaleEngine: 'standard' | 'creative';
  onChangeUpscaleEngine: (next: 'standard' | 'creative') => void;
  outputFit: 'contain' | 'cover';
  onChangeOutputFit: (next: 'contain' | 'cover') => void;

  // Credits + Generate
  generationCost?: number;
  canGenerate: boolean;
  onGenerate: () => void;
  onRefillCredits?: () => void;
  onClearSelections?: () => void;

  // History
  history?: any[];
  historyLoading?: boolean;
  activeHistoryId?: string | null;
  onSelectHistoryItem?: (item: any) => void;

  // UI gating
  inputsDisabled?: boolean;

  // Measurements
  onOpenMeasurements?: () => void;
};

export const MobileDesignerV2 = React.memo(function MobileDesignerV2(props: MobileDesignerV2Props) {
  const {
    disableDrawer,
    beforeImage,
    afterImage,
    sliderPos,
    onSliderChange,
    isProcessing,
    onSelectTemplate,
    currentTemplateId,
    isSubscribedToPremiumTemplates,
    onPremiumTemplateClick,
    privacy,
    fabricPreviewUrl,
    fabricProductId,
    fabricDebug,
    onUploadFabric,
    onSelectFabricFromUrl,
    fabricThumbs,
    fabricImageBase64,
    fabricImageMimeType,
    originalFabricData,
    setFabricPreviewUrl,
    setFabricImageBase64,
    setFabricImageMimeType,
    setOriginalFabricData,
    lightingPreset,
    onSelectLightingPreset,
    selectedModel,
    onChangeSelectedModel,
    upscaleEngine,
    onChangeUpscaleEngine,
    outputFit,
    onChangeOutputFit,
    generationCost,
    canGenerate,
    onGenerate,
    onRefillCredits,
    onClearSelections,
    history,
    historyLoading,
    activeHistoryId,
    onSelectHistoryItem,
    inputsDisabled,
    onOpenMeasurements,
  } = props;
  const navigate = useNavigate();
  const { productId } = useParams<{ productId?: string }>();
  const templateStore = useTemplateStore();

  const uploadInputRef = React.useRef<HTMLInputElement | null>(null);
  const fabricInputRef = React.useRef<HTMLInputElement | null>(null);
  const [prepOpen, setPrepOpen] = React.useState(false);
  const [prepFile, setPrepFile] = React.useState<File | null>(null);
  const [tilingOpen, setTilingOpen] = React.useState(false);
  const [tilingScale, setTilingScale] = React.useState(1);
  const tilingStartRef = React.useRef<{ url: string | null; base64: string | null; mimeType: string | null } | null>(null);
  const tilingPreviewJobRef = React.useRef(0);
  const lastUploadPreviewUrlRef = React.useRef<string | null>(null);

  const templateThumbUrl = React.useMemo(() => {
    if (!currentTemplateId) return beforeImage || undefined;
    const allTemplates = [
      ...(templateStore.studioTemplates || []),
      ...(templateStore.shopTemplates || []),
      ...(templateStore.closetTemplates || []),
    ];
    const t: any = allTemplates.find((x: any) => x?.id === currentTemplateId);
    return (t?.imageUrl || t?.src || t?.preview || beforeImage || '') as string;
  }, [
    beforeImage,
    currentTemplateId,
    templateStore.studioTemplates,
    templateStore.shopTemplates,
    templateStore.closetTemplates,
  ]);

  const canClearSelections = Boolean(templateThumbUrl) || Boolean(fabricPreviewUrl);

  const showIntroCards = !currentTemplateId && !fabricPreviewUrl;

  const openUploadTemplate = React.useCallback(() => {
    // Mobile: open file picker immediately (no drawer / closet tab).
    uploadInputRef.current?.click();
  }, []);

  React.useEffect(() => {
    return () => {
      const url = lastUploadPreviewUrlRef.current;
      if (url && url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      }
      lastUploadPreviewUrlRef.current = null;
    };
  }, []);

  const openFabric = React.useCallback(() => {
    fabricInputRef.current?.click();
  }, []);

  const openTiling = React.useCallback(() => {
    tilingStartRef.current = {
      url: fabricPreviewUrl || null,
      base64: fabricImageBase64 || null,
      mimeType: fabricImageMimeType || null,
    };
    setTilingScale(1);
    setTilingOpen(true);
  }, [fabricPreviewUrl, fabricImageBase64, fabricImageMimeType]);

  const generateTiledDataUrl = React.useCallback(async (sourceUrl: string, scale: number) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load fabric image for tiling'));
      img.src = sourceUrl;
    });

    const canvas = document.createElement('canvas');
    const size = 1024;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not get canvas context');

    const tileW = Math.max(16, img.naturalWidth * scale);
    const tileH = Math.max(16, img.naturalHeight * scale);

    const tileCanvas = document.createElement('canvas');
    tileCanvas.width = tileW;
    tileCanvas.height = tileH;
    const tctx = tileCanvas.getContext('2d');
    if (!tctx) throw new Error('Could not get tile canvas context');

    tctx.drawImage(img, 0, 0, tileW, tileH);
    const pattern = ctx.createPattern(tileCanvas, 'repeat');
    if (!pattern) throw new Error('Could not create tiling pattern');
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, size, size);
    return canvas.toDataURL('image/jpeg', 0.9);
  }, []);

  // Live preview while moving slider (desktop-like behavior).
  React.useEffect(() => {
    if (!tilingOpen) return;
    if (!setFabricPreviewUrl || !setFabricImageBase64 || !setFabricImageMimeType) return;

    const start = tilingStartRef.current;
    const sourceMimeType = start?.mimeType || fabricImageMimeType || 'image/jpeg';
    const sourceDataUrl = start?.base64
      ? `data:${sourceMimeType};base64,${start.base64}`
      : '';
    const sourceUrl = sourceDataUrl || start?.url || fabricPreviewUrl || '';
    if (!sourceUrl) return;

    const jobId = ++tilingPreviewJobRef.current;
    void generateTiledDataUrl(sourceUrl, tilingScale)
      .then((tiledDataUrl) => {
        if (jobId !== tilingPreviewJobRef.current) return;
        const tiledBase64 = tiledDataUrl.split(',')[1] || null;
        setFabricPreviewUrl(tiledDataUrl);
        setFabricImageBase64(tiledBase64);
        setFabricImageMimeType('image/jpeg');
      })
      .catch(() => {
        // keep current preview
      });
  }, [tilingOpen, tilingScale, fabricImageMimeType, fabricPreviewUrl, generateTiledDataUrl, setFabricImageBase64, setFabricImageMimeType, setFabricPreviewUrl]);

  const cancelTiling = React.useCallback(() => {
    const start = tilingStartRef.current;
    if (start) {
      setFabricPreviewUrl?.(start.url ?? null);
      setFabricImageBase64?.(start.base64 ?? null);
      setFabricImageMimeType?.(start.mimeType ?? null);
    }
    setTilingOpen(false);
    setTilingScale(1);
    tilingStartRef.current = null;
  }, [setFabricImageBase64, setFabricImageMimeType, setFabricPreviewUrl]);

  const applyTiling = React.useCallback(() => {
    if (fabricPreviewUrl && fabricImageBase64) {
      setOriginalFabricData?.({
        base64: fabricImageBase64,
        mimeType: fabricImageMimeType || 'image/jpeg',
        url: fabricPreviewUrl,
      });
    }
    setTilingOpen(false);
    setTilingScale(1);
    tilingStartRef.current = null;
  }, [fabricImageBase64, fabricImageMimeType, fabricPreviewUrl, setOriginalFabricData]);

  return (
    <>
      <ImagePrepModal
        theme="designer"
        mode="template"
        isOpen={prepOpen}
        file={prepFile}
        onReplaceFile={(nextFile) => {
          setPrepFile(nextFile);
        }}
        onCancel={() => {
          setPrepOpen(false);
          setPrepFile(null);
          if (uploadInputRef.current) uploadInputRef.current.value = '';
        }}
        onApply={async (processedFile, meta) => {
          const previewUrl = URL.createObjectURL(processedFile);

          // Clean up previous preview blob URL (if any)
          const prev = lastUploadPreviewUrlRef.current;
          if (prev && prev.startsWith('blob:') && prev !== previewUrl) {
            try {
              URL.revokeObjectURL(prev);
            } catch {
              // ignore
            }
          }
          lastUploadPreviewUrlRef.current = previewUrl;

          const draftTemplate = {
            id: safeId(),
            name: processedFile.name,
            imageUrl: previewUrl,
            thumbnailUrl: previewUrl,
            meta: { source: 'closet', label: 'upload' },
            file: processedFile,
            previewUrl,
            privacyApplied: Boolean(meta?.privacyApplied),
            __fromImagePrepModal: true,
          };

          onSelectTemplate(draftTemplate);

          setPrepOpen(false);
          setPrepFile(null);
          if (uploadInputRef.current) uploadInputRef.current.value = '';
        }}
      />

      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        title="Upload template"
        aria-label="Upload template"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setPrepFile(file);
          setPrepOpen(true);
        }}
      />

      <input
        ref={fabricInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        title="Upload fabric"
        aria-label="Upload fabric"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          onUploadFabric(file);
          e.currentTarget.value = '';
        }}
      />

      <StudioLayout
      sheetEnabled={!disableDrawer}
      credits={
        <FloatingCreditChip
          onRefill={onRefillCredits}
          onClear={onClearSelections}
          canClear={canClearSelections}
          disabled={inputsDisabled}
        />
      }
      templateThumbUrl={templateThumbUrl}
      fabricThumbUrl={fabricPreviewUrl}
      onBrowseTemplate={openUploadTemplate}
      onBrowseFabric={openFabric}
      fabricTiling={{
        enabled: Boolean(fabricPreviewUrl),
        onOpen: openTiling,
      }}
      stitchAction={{
        label: 'إبدأ التفصيل',
        onClick: () => {
          if (onOpenMeasurements) {
            onOpenMeasurements();
            return;
          }
          const idToUse = productId || 'default';
          navigate(`/studio/measurements/${idToUse}`);
        },
      }}
      preview={
        <PreviewCanvas
          beforeImage={beforeImage}
          afterImage={afterImage}
          sliderPos={sliderPos}
          onSliderChange={onSliderChange}
          isProcessing={isProcessing}
          fabricPreviewUrl={fabricPreviewUrl}
          fabricProductId={fabricProductId}
          fabricDebug={fabricDebug}
          showIntroCards={showIntroCards}
          onUploadTemplate={openUploadTemplate}
          onOpenFabric={openFabric}
        />
      }
      generateAction={{
        canGenerate,
        isProcessing,
        cost: generationCost,
        onGenerate,
      }}
      lighting={
        <div className="px-3 py-2">
          <LightingPresets value={lightingPreset} onChange={onSelectLightingPreset} />
        </div>
      }
      history={
        <GenerationHistory
          items={history}
          isLoading={historyLoading}
          activeId={activeHistoryId}
          onSelect={onSelectHistoryItem}
        />
      }
      panel={
        <SelectionPanel
          currentTemplateId={currentTemplateId}
          onSelectTemplate={onSelectTemplate}
          isSubscribedToPremiumTemplates={isSubscribedToPremiumTemplates}
          onPremiumTemplateClick={onPremiumTemplateClick}
          privacy={privacy}
          fabricPreviewUrl={fabricPreviewUrl}
          onUploadFabric={onUploadFabric}
          onSelectFabricFromUrl={onSelectFabricFromUrl}
          fabricThumbs={fabricThumbs}
          selectedModel={selectedModel}
          onChangeSelectedModel={onChangeSelectedModel}
          upscaleEngine={upscaleEngine}
          onChangeUpscaleEngine={onChangeUpscaleEngine}
          outputFit={outputFit}
          onChangeOutputFit={onChangeOutputFit}
          generationCost={generationCost}
          isProcessing={isProcessing}
          canGenerate={canGenerate}
          onGenerate={onGenerate}
          inputsDisabled={inputsDisabled}
        />
      }
      />

      {tilingOpen && (
        <div className="fixed inset-0 z-[1200]">
          <div className="absolute inset-0 bg-black/40" onClick={cancelTiling} />
          <div className="absolute left-4 right-4 bottom-6 rounded-2xl bg-[#fffdf7] border border-amber-500/20 p-3 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Tiling Scale</span>
              <span className="text-[10px] font-mono text-amber-500/70 bg-amber-500/10 px-2 py-0.5 rounded">
                {tilingScale.toFixed(2)}x
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.05"
                value={tilingScale}
                onChange={(e) => setTilingScale(Number(e.target.value))}
                title="Tiling scale"
                aria-label="Tiling scale"
                className="flex-1 accent-purple-500 h-1 bg-zinc-300 rounded-full appearance-none cursor-pointer"
              />

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={cancelTiling}
                  className="p-1.5 rounded-lg bg-white border border-zinc-200 text-purple-600 hover:text-purple-700 transition-colors"
                  title="Cancel"
                  aria-label="Cancel"
                >
                  <X size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => { void applyTiling(); }}
                  className="p-1.5 rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-colors"
                  title="Apply"
                  aria-label="Apply"
                >
                  <Check size={14} />
                </button>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={cancelTiling}
                className="flex-1 h-10 rounded-xl border border-zinc-200 bg-white text-zinc-700 text-sm font-semibold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => { void applyTiling(); }}
                className="flex-1 h-10 rounded-xl bg-amber-500 text-black text-sm font-black"
              >
                تطبيق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
