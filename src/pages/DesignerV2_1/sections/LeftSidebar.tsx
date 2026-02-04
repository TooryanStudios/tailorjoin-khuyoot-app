import React from 'react';
import { ChevronDown, Loader2, Upload } from 'lucide-react';
import { TemplateSelectorView } from '../../modules/TemplatePicker';
import type { DesignerV2Features, DesignerUIState } from '../types';

export type FabricMaterial = 'silk' | 'cotton' | 'transparent' | 'velvet' | 'linen' | 'wool' | null;

type LeftSidebarProps = {
  t: (key: string) => string;
  features: DesignerV2Features;
  uiState: DesignerUIState;
  sidebarHasVisibleContent: boolean;
  templateInputRef: React.RefObject<HTMLInputElement>;
  fabricInputRef: React.RefObject<HTMLInputElement>;
  sourcePreviewUrl: string | null;
  fabricPreviewUrl: string | null;
  onOpenUserImagePrep: (file: File) => void;
  onOpenFabricPrep: (file: File) => void;
  onOpenFabricTiling: () => void;
  onTemplateSelect: (template: any) => void;
  fabricMaterial: FabricMaterial;
  onFabricMaterialChange: (material: FabricMaterial) => void;
  isProcessing: boolean;
  creditsEnabled: boolean;
  generationCost: number;
  onGenerate: () => void;
  isSubscribed: boolean;
  canAfford: (feature: string) => boolean;
  openUpgradeModal: (reason: string) => void;
  selectedTemplate: { id?: string | null } | null;
  isLoadingProduct: boolean;
  loadingTemplateId: string | null;
  setLastActiveTemplateTab: (tab: string) => void;
  isPrivacyMode: boolean;
  setPrivacyMode: (val: boolean) => void;
  isProcessingTemplate: boolean;
  isProcessingFabric: boolean;
  isProcessingPrivacy: boolean;
  maskingStyle: string;
  setMaskingStyle: (style: string) => void;
  blurStrength: number;
  setBlurStrength: (val: number) => void;
  selectedEmoji: string;
  setSelectedEmoji: (emoji: string) => void;
  upscaleEngine: 'standard' | 'creative';
  setUpscaleEngine: (val: 'standard' | 'creative') => void;
  outputFit: 'contain' | 'cover';
  setOutputFit: (val: 'contain' | 'cover') => void;
  handleUpscale: () => void;
  isUpscaling: boolean;
  upscaleProgress: number;
  upscaleCost: number;
  isWatermarkEnabled: boolean;
  setIsWatermarkEnabled: (val: boolean) => void;
  traceStep: (event: string, payload?: Record<string, unknown>) => void;
  user: any;
  lastRequestDebug: any;
  lastResponseDebug: any;
  isWatermarkDisabled?: boolean;
};

export function LeftSidebar(props: LeftSidebarProps) {
  const {
    t,
    features,
    uiState,
    sidebarHasVisibleContent,
    templateInputRef,
    fabricInputRef,
    sourcePreviewUrl,
    fabricPreviewUrl,
    onOpenUserImagePrep,
    onOpenFabricPrep,
    onOpenFabricTiling,
    onTemplateSelect,
    fabricMaterial,
    onFabricMaterialChange,
    isProcessing,
    creditsEnabled,
    generationCost,
    onGenerate,
    isSubscribed,
    canAfford,
    openUpgradeModal,
    selectedTemplate,
    isLoadingProduct,
    loadingTemplateId,
    setLastActiveTemplateTab,
    isPrivacyMode,
    setPrivacyMode,
    isProcessingTemplate,
    isProcessingFabric,
    isProcessingPrivacy,
    maskingStyle,
    setMaskingStyle,
    blurStrength,
    setBlurStrength,
    selectedEmoji,
    setSelectedEmoji,
    upscaleEngine,
    setUpscaleEngine,
    outputFit,
    setOutputFit,
    handleUpscale,
    isUpscaling,
    upscaleProgress,
    upscaleCost,
    isWatermarkEnabled,
    setIsWatermarkEnabled,
    traceStep,
    user,
    lastRequestDebug,
    lastResponseDebug,
    isWatermarkDisabled,
  } = props;

  return (
    <aside className="w-[280px] shrink-0 border-r-2 border-zinc-700 flex flex-col h-screen bg-zinc-900 overflow-hidden">
      {/* Header & Scrollable Inputs */}
      <div className={`flex-1 ${sidebarHasVisibleContent ? 'overflow-y-auto custom-scrollbar' : 'overflow-y-hidden'} overflow-x-hidden p-4 space-y-6 pb-10`}>
        {/* User Image Upload Card */}
        <div>
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">{t('userImageLabel')}</div>
          <label
            className={`relative h-[8.4rem] rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 flex flex-col items-center justify-center gap-2 overflow-hidden ${
              uiState.uploadsDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <input
              ref={templateInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uiState.uploadsDisabled}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onOpenUserImagePrep(file);
                  e.currentTarget.value = '';
                }
              }}
            />
            {sourcePreviewUrl ? (
              <img src={sourcePreviewUrl} alt="User Image" className="absolute inset-0 w-full h-full object-contain object-center" loading="lazy" decoding="async" />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2">
                <Upload className="w-5 h-5 text-zinc-500" />
                <div className="text-xs text-zinc-500">{t('uploadImage')}</div>
              </div>
            )}
            {sourcePreviewUrl && (
              <div className="absolute bottom-2 left-2 text-xs font-normal px-3 py-1 rounded-md bg-black/60 border border-zinc-700 text-zinc-200">{t('change')}</div>
            )}
          </label>
        </div>

        {/* Fabric/Pattern Image */}
        {features.showFabricUpload && (
          <div>
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">{t('fabricPatternLabel')}</div>
            <div className={`grid grid-cols-[1fr_96px] gap-2 ${uiState.uploadsDisabled ? 'opacity-50' : ''}`}>
              <input
                ref={fabricInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uiState.uploadsDisabled}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onOpenFabricPrep(file);
                  e.currentTarget.value = '';
                }}
              />
              <div className="relative h-28 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 overflow-hidden">
                {fabricPreviewUrl ? (
                  <img
                    src={fabricPreviewUrl}
                    alt="Fabric"
                    className="absolute inset-2 w-[calc(100%-1rem)] h-[calc(100%-1rem)] object-cover object-center rounded-lg cursor-pointer"
                    loading="lazy"
                    decoding="async"
                    onClick={() => fabricInputRef.current?.click()}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => fabricInputRef.current?.click()}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-zinc-500"
                  >
                    <Upload className="w-5 h-5" />
                    <span>{t('noFabric')}</span>
                  </button>
                )}
              </div>
              <div className="h-28 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 p-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fabricInputRef.current?.click()}
                  className="w-full h-10 rounded-md border border-zinc-700 bg-zinc-900 text-xs text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  {fabricPreviewUrl ? t('change') : t('upload')}
                </button>
                <button
                  type="button"
                  onClick={onOpenFabricTiling}
                  disabled={!fabricPreviewUrl}
                  className={`w-full h-10 rounded-md border text-xs transition-colors ${
                    fabricPreviewUrl
                      ? 'border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  {t('tile')}
                </button>
              </div>
            </div>

            {/* Fabric Material Selection */}
            <details className="mt-3 mb-4">
              <summary className="cursor-pointer select-none text-xs font-semibold text-zinc-400 uppercase tracking-wider">{t('fabricType')}</summary>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { id: 'silk', label: t('materialSilk'), icon: 'âœ¨' },
                  { id: 'cotton', label: t('materialCotton'), icon: 'â˜ï¸' },
                  { id: 'linen', label: t('materialLinen'), icon: 'ðŸŒ¾' },
                  { id: 'velvet', label: t('materialVelvet'), icon: 'ðŸŽ' },
                  { id: 'transparent', label: t('materialTransparent'), icon: 'ðŸ’Ž' },
                  { id: 'wool', label: t('materialWool'), icon: 'ðŸ§¶' },
                ].map((material) => (
                  <button
                    key={material.id}
                    type="button"
                    onClick={() => onFabricMaterialChange(material.id as FabricMaterial)}
                    disabled={uiState.uploadsDisabled}
                    className={`px-2 py-2 rounded-lg text-[11px] font-medium transition-all duration-200 flex flex-col items-center gap-1 ${
                      fabricMaterial === material.id
                        ? 'bg-purple-500/30 border-2 border-purple-500 text-purple-200'
                        : 'bg-zinc-800/50 border border-zinc-700 text-zinc-400 hover:border-zinc-600'
                    } ${uiState.uploadsDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    title={material.label}
                  >
                    <span className="text-lg">{material.icon}</span>
                    <span className="text-[10px]">{material.label}</span>
                  </button>
                ))}
              </div>
            </details>
          </div>
        )}

        {/* Sidebar Generate button */}
        {features.showRefinementPrompt && (
          <button
            type="button"
            disabled={uiState.generationDisabled}
            onClick={onGenerate}
            className={`generateButtonShine w-full px-4 py-3 rounded-xl font-extrabold tracking-wide text-base transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 border ${
              uiState.generationDisabled
                ? 'bg-purple-600/60 text-white cursor-not-allowed border-purple-500/20'
                : 'bg-purple-600 hover:bg-purple-500 text-white active:scale-95 border-purple-500/40 hover:border-purple-400/60'
            }`}
          >
            {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
            {isProcessing ? (
              t('processing')
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-pulse">âœ¨</span>
                <span>
                  {t('generateOne')}
                </span>
              </span>
            )}
          </button>
        )}

        {/* Model/Template Gallery */}
        {features.showTemplateUpload && (
          <div>
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              {t('modelTemplateLabel')}
              {isLoadingProduct && <span className="ml-2 text-[10px] text-purple-400 animate-pulse">{t('loading')}</span>}
            </div>
            <div className={uiState.uploadsDisabled ? 'opacity-50' : ''}>
              <TemplateSelectorView
                onSelect={onTemplateSelect}
                onTabChange={(tab) => {
                  setLastActiveTemplateTab(tab);
                  console.log(`[Designer] Tab switched to: ${tab}`);
                }}
                currentId={selectedTemplate?.id}
                shopItems={undefined}
                closetItems={undefined}
                enableUpload
                isSubscribed={isSubscribed || canAfford('premium_template')}
                onPremiumClick={() => openUpgradeModal('template_premium_click')}
                defaultTab="Closet"
                loadingTemplateId={isLoadingProduct ? 'loading-product' : loadingTemplateId}
              />
            </div>
          </div>
        )}

        {/* Privacy Shield Section */}
        <div className="pt-6 border-t border-zinc-800">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">{t('privacyProtectionTitle')}</div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-zinc-300">{t('privacyModeLabel')}</label>
              <span className="text-[10px] text-purple-400">{t('localOnlyBadge')}</span>
            </div>
            <button
              onClick={() => {
                console.log('[Privacy Toggle] Current state:', isPrivacyMode, '→ New state:', !isPrivacyMode);
                setPrivacyMode(!isPrivacyMode);
              }}
              disabled={isProcessingTemplate || isProcessingFabric || isProcessingPrivacy}
              className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${
                isPrivacyMode ? 'bg-purple-500/40 border border-purple-500/60' : 'bg-zinc-800 border border-zinc-700'
              } ${(isProcessingTemplate || isProcessingFabric || isProcessingPrivacy) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  isPrivacyMode ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="text-[10px] text-zinc-400 p-3 bg-zinc-900/50 rounded border border-zinc-800 mb-4">
            {isPrivacyMode ? (
              <>
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-emerald-400">âœ“</span>
                  <span>{t('privacyMaskingEnabled')}</span>
                </div>
                <div className="text-[9px] text-zinc-500">{t('privacyMaskingDescription')}</div>
              </>
            ) : (
              <span>{t('privacyMaskingPrompt')}</span>
            )}
          </div>

          {/* Masking Settings Collapsible */}
          {isPrivacyMode && (
            <details className="mb-4">
              <summary className="cursor-pointer select-none text-xs font-semibold text-zinc-400 uppercase tracking-wider">{t('maskingModeSettings')}</summary>

              <div className="mt-3 p-3 bg-zinc-900/50 border-2 border-purple-500/30 rounded-lg space-y-3">
                {/* Masking Style Cards */}
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 block">{t('maskingStyleLabel')}</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'feathered-blur', icon: 'ðŸŽ', label: t('maskingStyleBlur') },
                      { value: 'pixelate', icon: 'ðŸ”²', label: t('maskingStylePixelate') },
                      { value: 'emoji', icon: 'ðŸ˜Š', label: t('maskingStyleEmoji') },
                    ].map((style) => (
                      <button
                        key={style.value}
                        onClick={() => setMaskingStyle(style.value as string)}
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                          maskingStyle === style.value
                            ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                            : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-purple-500/50'
                        }`}
                      >
                        <div className="text-2xl leading-none mb-1">{style.icon}</div>
                        <div className="text-[11px] font-semibold leading-tight">{style.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Blur Strength Slider */}
                {maskingStyle === 'feathered-blur' && (
                  <div className="pt-2 border-t border-zinc-800">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 block">{t('intensityLabel')}</label>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-zinc-400">{t('blurStrengthLabel')}</span>
                      <span className="text-xs text-purple-400">{blurStrength}px</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="50"
                      value={blurStrength}
                      onChange={(e) => setBlurStrength(Number(e.target.value))}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
                    />
                    <div className="flex justify-between text-[9px] text-zinc-500 mt-1">
                      <span>{t('lightLabel')}</span>
                      <span>{t('heavyLabel')}</span>
                    </div>
                  </div>
                )}

                {/* Emoji Selector */}
                {maskingStyle === 'emoji' && (
                  <div className="pt-2 border-t border-zinc-800">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 block">{t('chooseEmojiLabel')}</label>
                    <div className="grid grid-cols-6 gap-2">
                      {['ðŸ˜Š', 'ðŸ˜ƒ', 'ðŸ™‚', 'ðŸ˜„', 'ðŸ˜', 'ðŸ¥°', 'ðŸ˜', 'ðŸ¤—', 'ðŸ˜Œ', 'ðŸ˜Ž', 'ðŸ¤©', 'ðŸ˜‡'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => setSelectedEmoji(emoji)}
                          className={`p-2 text-2xl rounded-lg border transition-all ${
                            selectedEmoji === emoji
                              ? 'bg-purple-500/20 border-purple-500 scale-110'
                              : 'bg-zinc-900 border-zinc-700 hover:border-purple-500/50'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>

        {(features.showModelSelection || features.showRefinementPrompt) && (
          <details className="pt-6 border-t border-zinc-800">
            <summary className="cursor-pointer select-none text-xs font-semibold text-zinc-400 uppercase tracking-wider">{t('advancedSettings')}</summary>
            <div className="mt-3 text-xs text-zinc-500">—</div>
          </details>
        )}

        {/* Output Quality Section */}
        {features.showOutputQuality && (
          <div className="pt-6 border-t border-zinc-800">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">{t('outputQuality')}</div>
            {features.showUpscaleEngine && (
              <div className="mb-3">
                <div className="text-xs text-zinc-500 mb-1.5">{t('upscaleEngine')}</div>
                <div className={`relative ${uiState.allDisabled ? 'opacity-60' : ''}`}>
                  <select
                    value={upscaleEngine}
                    disabled={uiState.allDisabled}
                    onChange={(e) => setUpscaleEngine(e.target.value as 'standard' | 'creative')}
                    className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  >
                    <option value="standard">{t('upscaleStandard')}</option>
                    <option value="creative">{t('upscaleCreative')}</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>
            )}

            {features.showOutputFit && (
              <div className="mb-1">
                <div className="text-xs text-zinc-500 mb-1.5">{t('outputFit')}</div>
                <div className={`relative ${uiState.inputsDisabled ? 'opacity-60' : ''}`}>
                  <select
                    value={outputFit}
                    disabled={uiState.inputsDisabled}
                    onChange={(e) => setOutputFit(e.target.value as 'contain' | 'cover')}
                    className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  >
                    <option value="contain">{t('fitContain')}</option>
                    <option value="cover">{t('fitCover')}</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>
            )}

            {features.showUpscaleButton && uiState.showUpscaleButton && (
              <div className="mt-4 pt-4 border-t border-zinc-700">
                <button
                  onClick={handleUpscale}
                  disabled={uiState.upscaleDisabled}
                  className={`w-full px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    uiState.upscaleDisabled ? 'bg-purple-500/30 text-purple-300 cursor-wait' : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {isUpscaling ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-purple-300/30 border-t-purple-300 rounded-full animate-spin" />
                      {t('upscalingInProgress', { percent: Math.round(upscaleProgress) })}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span>âœ¨ {t('upscaleResult')}{creditsEnabled && upscaleCost > 0 ? ` (${upscaleCost})` : ''}</span>
                    </span>
                  )}
                </button>
                <div className="text-xs text-zinc-500 text-center mt-2">{t('upscaleDescription')}</div>
              </div>
            )}
          </div>
        )}

        {/* Export Settings Section */}
        {features.showExportSettings && (
          <details className="pt-6 border-t border-zinc-800">
            <summary className="cursor-pointer select-none text-xs font-semibold text-zinc-400 uppercase tracking-wider">{t('exportSettings')}</summary>

            <div className="mt-3">
              {features.showWatermarkToggle && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-zinc-300">{t('addWatermark')}</label>
                      {!isSubscribed && <span className="text-[10px] text-purple-400">{t('freeMode')}</span>}
                      {isSubscribed && <span className="text-[10px] text-emerald-400">{t('proMode')}</span>}
                    </div>
                    <button
                      onClick={() => {
                        if (!isSubscribed) {
                          if (!isWatermarkEnabled) {
                            openUpgradeModal('watermark_upgrade');
                            return;
                          }
                        } else {
                          setIsWatermarkEnabled(!isWatermarkEnabled);
                        }
                      }}
                      disabled={uiState.watermarkDisabled || isWatermarkDisabled}
                      className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${
                        isWatermarkEnabled ? 'bg-purple-500/40 border border-purple-500/60' : 'bg-zinc-800 border border-zinc-700'
                      } ${uiState.watermarkDisabled || isWatermarkDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          isWatermarkEnabled ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {isWatermarkEnabled && <div className="text-[10px] text-zinc-400 p-2 bg-zinc-900/50 rounded border border-zinc-800 mb-4">{t('watermarkApplied')}</div>}
                </>
              )}

              {features.showSubscriptionControls && uiState.showUpgradePrompt && (
                <button
                  onClick={() => {
                    traceStep('designer_v2_upgrade_click', { context: 'watermark_upgrade', user: user?.uid || 'unknown' });
                    openUpgradeModal('watermark_upgrade_button');
                  }}
                  className="w-full mt-4 px-3 py-2 text-sm font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 hover:border-purple-500/50 transition-all"
                >
                  {t('upgradeToPro')}
                </button>
              )}

              {features.showSubscriptionControls && uiState.showProFeatures && (
                <div className="w-full mt-4 px-3 py-2 text-sm font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-center">
                  {t('proFeaturesUnlocked')}
                </div>
              )}
            </div>
          </details>
        )}

        {features.showDebugSection && (
          <details className="rounded-lg border border-zinc-800 bg-zinc-950/40">
            <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">{t('debugSectionTitle')}</summary>
            <div className="px-3 pb-3 text-[11px] text-zinc-300">
              <div className="text-zinc-500 mb-2">Last request/response (dev only)</div>
              <pre className="whitespace-pre-wrap break-words bg-zinc-950 border border-zinc-800 rounded-md p-2 overflow-auto max-h-64">
                {JSON.stringify(
                  {
                    request: lastRequestDebug,
                    response: lastResponseDebug,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </details>
        )}
      </div>
    </aside>
  );
}
