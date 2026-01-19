import * as React from 'react';
import { FabricPicker, type FabricThumb } from '../../designer/mobile/components/FabricPicker';
import { AdvancedSettings } from '../../designer/mobile/components/AdvancedSettings';
import { GenerateButton } from '../../designer/mobile/components/GenerateButton.tsx';
import { STUDIO_FEATURES } from '../config/featureFlags';
import { traceStep } from '../../../utils/trace';
import { TemplateSelectorView } from '../../TemplatePicker/TemplateSelectorView.jsx';

type ParentTab = 'templates' | 'fabric';
type TemplatePickerTab = 'Studio' | 'Shop' | 'Closet';

type OpenTabDetail =
  | ParentTab
  | {
      parent?: ParentTab;
      templateTab?: TemplatePickerTab;
    };

type ParentTabButtonProps = {
  active?: boolean;
  label: string;
  onClick: () => void;
};

const ParentTabButton = React.memo(function ParentTabButton({ active, label, onClick }: ParentTabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'flex-1 px-3 py-2 text-[11px] font-black uppercase tracking-wider transition-colors border-b-2 ' +
        (active
          ? 'text-white border-white'
          : 'text-zinc-500 border-transparent hover:text-zinc-300')
      }
    >
      {label}
    </button>
  );
});

export type SelectionPanelProps = {
  currentTemplateId?: string;
  onSelectTemplate: (template: any) => void;
  isSubscribedToPremiumTemplates?: boolean;
  onPremiumTemplateClick?: () => void;
  fabricPreviewUrl?: string;
  onUploadFabric: (file: File) => void;
  onSelectFabricFromUrl?: (url: string) => void;
  fabricThumbs?: FabricThumb[];
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
  selectedModel: 'NanoBana' | 'Pro';
  onChangeSelectedModel: (next: 'NanoBana' | 'Pro') => void;
  upscaleEngine: 'standard' | 'creative';
  onChangeUpscaleEngine: (next: 'standard' | 'creative') => void;
  outputFit: 'contain' | 'cover';
  onChangeOutputFit: (next: 'contain' | 'cover') => void;
  generationCost?: number;
  isProcessing: boolean;
  canGenerate: boolean;
  onGenerate: () => void;
  inputsDisabled?: boolean;
};

export const SelectionPanel = React.memo<SelectionPanelProps>(function SelectionPanel({
  currentTemplateId,
  onSelectTemplate,
  isSubscribedToPremiumTemplates,
  onPremiumTemplateClick,
  fabricPreviewUrl,
  onUploadFabric,
  onSelectFabricFromUrl,
  fabricThumbs,
  privacy,
  selectedModel,
  onChangeSelectedModel,
  upscaleEngine,
  onChangeUpscaleEngine,
  outputFit,
  onChangeOutputFit,
  generationCost,
  isProcessing,
  canGenerate,
  onGenerate,
  inputsDisabled,
}) {
  const safePrivacy = privacy ?? {
    isPrivacyMode: false,
    setPrivacyMode: () => undefined,
    maskingStyle: 'feathered-blur' as const,
    setMaskingStyle: () => undefined,
    blurStrength: 30,
    setBlurStrength: () => undefined,
    selectedEmoji: '😊',
    setSelectedEmoji: () => undefined,
    isProcessingPrivacy: false,
    canApplyToCurrentTemplate: false,
    onApplyToCurrentTemplate: () => undefined,
    disabled: false,
  };
  const [parentTab, setParentTab] = React.useState<ParentTab>('templates');
  // Default the template picker to Closet as requested
  const [templatePickerTab, setTemplatePickerTab] = React.useState<TemplatePickerTab>('Closet');

  const collapseSheet = React.useCallback(() => {
    try {
      traceStep('Studio sheet collapse DISPATCH (SelectionPanel)');
      window.dispatchEvent(new CustomEvent('khuyoot:studio-sheet-collapse'));
      traceStep('Studio sheet collapse DISPATCHED (SelectionPanel)');
    } catch {
      // ignore
    }
  }, []);

  const handleSelectTemplate = React.useCallback(
    (template: any) => {
      traceStep('SelectionPanel template selected', { id: template?.id });
      onSelectTemplate(template);
      setTimeout(collapseSheet, 120);
    },
    [onSelectTemplate, collapseSheet]
  );

  const handleUploadFabric = React.useCallback(
    (file: File) => {
      traceStep('SelectionPanel fabric uploaded', { name: file?.name, size: file?.size, type: file?.type });
      onUploadFabric(file);
      setTimeout(collapseSheet, 120);
    },
    [onUploadFabric, collapseSheet]
  );

  const handleSelectFabricFromUrl = React.useCallback(
    (url: string) => {
      onSelectFabricFromUrl?.(url);
      setTimeout(collapseSheet, 120);
    },
    [onSelectFabricFromUrl, collapseSheet]
  );

  React.useEffect(() => {
    const onOpenTab = (e: Event) => {
      const ce = e as CustomEvent;
      const detail = ce?.detail as OpenTabDetail | undefined;

      const nextParent = typeof detail === 'string' ? detail : detail?.parent;
      if (nextParent === 'templates' || nextParent === 'fabric') {
        setParentTab(nextParent);
      }

      const nextTemplateTab = typeof detail === 'string' ? undefined : detail?.templateTab;
      if (nextTemplateTab === 'Studio' || nextTemplateTab === 'Shop' || nextTemplateTab === 'Closet') {
        setTemplatePickerTab(nextTemplateTab);
      }
    };

    window.addEventListener('khuyoot:studio-open-tab', onOpenTab as EventListener);
    return () => window.removeEventListener('khuyoot:studio-open-tab', onOpenTab as EventListener);
  }, []);

  return (
    <div className="space-y-4 px-2 pt-1 pb-32 max-w-5xl mx-auto">
      <nav className="flex justify-around border-b border-zinc-800/50">
        <ParentTabButton
          active={parentTab === 'templates'}
          label="القوالب"
          onClick={() => setParentTab('templates')}
        />
        <ParentTabButton
          active={parentTab === 'fabric'}
          label="الخامة"
          onClick={() => setParentTab('fabric')}
        />
      </nav>

      {(STUDIO_FEATURES.SHOW_CLOSET || STUDIO_FEATURES.SHOW_SHOP) && (
        parentTab === 'templates' ? (
          <>
            <TemplateSelectorView
              onSelect={handleSelectTemplate}
              currentId={currentTemplateId}
              studioItems={undefined}
              shopItems={undefined}
              closetItems={undefined}
              enableUpload={Boolean(STUDIO_FEATURES.SHOW_CLOSET)}
              isSubscribed={Boolean(isSubscribedToPremiumTemplates)}
              onPremiumClick={onPremiumTemplateClick}
              forcedTab={templatePickerTab}
              onTabChange={setTemplatePickerTab}
              closetExtra={(
                <label className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-purple-500 focus:ring-purple-500"
                    checked={safePrivacy.isPrivacyMode}
                    onChange={(e) => safePrivacy.setPrivacyMode(e.target.checked)}
                    disabled={Boolean(safePrivacy.disabled) || Boolean(inputsDisabled) || safePrivacy.isProcessingPrivacy}
                  />
                  <div className="flex flex-col leading-tight">
                    <span className="font-semibold text-[13px]">Privacy Protection</span>
                    <span className="text-[11px] text-zinc-400">Blur faces locally before upload</span>
                  </div>
                </label>
              )}
            />
          </>
        ) : null
      )}

      {STUDIO_FEATURES.SHOW_FABRIC_GRID && (
        parentTab === 'fabric' ? (
          <FabricPicker
            fabricPreviewUrl={fabricPreviewUrl}
            onUpload={handleUploadFabric}
            onSelectFromUrl={handleSelectFabricFromUrl}
            thumbs={fabricThumbs}
            disabled={Boolean(inputsDisabled)}
          />
        ) : null
      )}

      <AdvancedSettings
        selectedModel={selectedModel}
        onChangeSelectedModel={onChangeSelectedModel}
        upscaleEngine={upscaleEngine}
        onChangeUpscaleEngine={onChangeUpscaleEngine}
        outputFit={outputFit}
        onChangeOutputFit={onChangeOutputFit}
        disabled={Boolean(inputsDisabled)}
      />

      <GenerateButton
        cost={generationCost}
        isProcessing={isProcessing}
        disabled={!canGenerate}
        onClick={onGenerate}
      />
    </div>
  );
});
