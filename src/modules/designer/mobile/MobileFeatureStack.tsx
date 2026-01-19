import * as React from 'react';
import { FloatingCreditChip } from './components/FloatingCreditChip';
import { type FabricThumb } from './components/FabricPicker';
import { StudioLayout } from '../../studio/components/StudioLayout';
import { PreviewCanvas } from '../../studio/components/PreviewCanvas';
import { SelectionPanel } from '../../studio/components/SelectionPanel';
import { GenerationHistory } from '../../history/components/GenerationHistory';
import { DesignerCardsRail } from './components/DesignerCardsRail';
import { useTemplateStore } from '../../TemplatePicker/useTemplateStore';
import { ImagePrepModal } from '../../../components/image/ImagePrepModal';

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
  } = props;
  const templateStore = useTemplateStore();

  const uploadInputRef = React.useRef<HTMLInputElement | null>(null);
  const [prepOpen, setPrepOpen] = React.useState(false);
  const [prepFile, setPrepFile] = React.useState<File | null>(null);
  const lastUploadPreviewUrlRef = React.useRef<string | null>(null);

  const templateThumbUrl = React.useMemo(() => {
    if (!currentTemplateId) return undefined;
    const allTemplates = [
      ...(templateStore.studioTemplates || []),
      ...(templateStore.shopTemplates || []),
      ...(templateStore.closetTemplates || []),
    ];
    const t: any = allTemplates.find((x: any) => x?.id === currentTemplateId);
    return (t?.imageUrl || t?.src || t?.preview || '') as string;
  }, [
    currentTemplateId,
    templateStore.studioTemplates,
    templateStore.shopTemplates,
    templateStore.closetTemplates,
  ]);

  const canClearSelections = Boolean(templateThumbUrl) || Boolean(fabricPreviewUrl);

  const showIntroCards = !currentTemplateId && !fabricPreviewUrl;

  const openTemplates = React.useCallback(() => {
    try {
      window.dispatchEvent(new CustomEvent('khuyoot:studio-sheet-expand'));
      window.dispatchEvent(new CustomEvent('khuyoot:studio-open-tab', { detail: 'templates' }));
    } catch {
      // ignore
    }
  }, []);

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
    try {
      window.dispatchEvent(new CustomEvent('khuyoot:studio-sheet-expand'));
      window.dispatchEvent(new CustomEvent('khuyoot:studio-open-tab', { detail: 'fabric' }));
    } catch {
      // ignore
    }
  }, []);

  return (
    <>
      <ImagePrepModal
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
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setPrepFile(file);
          setPrepOpen(true);
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
          onOpenTemplates={openTemplates}
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
        <div className="flex w-full gap-2 px-3 py-2 justify-center">
          {([
            { id: 'night', label: 'Night' },
            { id: 'day', label: 'Day' },
            { id: 'cinematic', label: 'Cinematic' },
          ] as const).map((o) => {
            const active = lightingPreset === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => onSelectLightingPreset(o.id)}
                className={
                  'h-9 px-3 rounded-lg border text-xs font-semibold transition-colors ' +
                  (active
                    ? 'bg-zinc-900 border-purple-500/60 text-white'
                    : 'bg-zinc-950/40 border-zinc-800 text-zinc-300 hover:border-purple-500/40')
                }
              >
                {o.label}
              </button>
            );
          })}
        </div>
      }
      history={
        <div className="flex flex-col gap-3">
          <GenerationHistory
            items={history}
            isLoading={historyLoading}
            activeId={activeHistoryId}
            onSelect={onSelectHistoryItem}
          />
          <DesignerCardsRail />
        </div>
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
    </>
  );
});
