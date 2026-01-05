import React from 'react';
import { createPortal } from 'react-dom';
import { Anchor, HelpCircle, Menu, Save, X, Download, Wand2 } from 'lucide-react';
import type { TryOnResponse } from '../../types/tryon';
import { ImageComparisonSlider } from './ImageComparisonSlider';
import { GenerationsRail, type GenerationItem } from '../../../pages/designerV2/components/GenerationsRail';
import { ControlsPanel } from './tryOnResult/ControlsPanel';
import { ComparisonPanel } from './tryOnResult/ComparisonPanel';
import { useTryOnResultLogic } from './tryOnResult/useTryOnResultLogic';
import { getTryOnResultFeatures, type TryOnResultFeatures, DEFAULT_FEATURES } from './tryOnResult/TryOnResultFeatures';

// Dark theme placeholders
const PLACEHOLDER_BEFORE = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22450%22 height=%22600%22 viewBox=%220 0 450 600%22%3E%3Crect x=%2220%22 y=%2220%22 width=%22410%22 height=%22560%22 fill=%22none%22 stroke=%22%23475569%22 stroke-width=%221%22 stroke-dasharray=%228,6%22 rx=%2212%22/%3E%3Cg transform=%22translate(225,280)%22%3E%3Ccircle cx=%220%22 cy=%220%22 r=%2230%22 fill=%22%23334155%22 opacity=%220.9%22/%3E%3Cpath d=%22M-13,-6 L-13,9 L13,9 L13,-6 Z M-9,-9 L-6,-13 L6,-13 L9,-9 Z%22 fill=%22none%22 stroke=%2264748b%22 stroke-width=%221.8%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/%3E%3Ccircle cx=%22-4.5%22 cy=%22-0.5%22 r=%222.2%22 fill=%2264748b%22/%3E%3Cpath d=%22M-13,4 L-4.5,0 L4.5,4 L13,0%22 fill=%22none%22 stroke=%2264748b%22 stroke-width=%221.8%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/%3E%3C/g%3E%3Ctext x=%2250%25%22 y=%2272%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22-apple-system,BlinkMacSystemFont,Segoe UI,Arial%22 font-size=%2215%22 font-weight=%22600%22 fill=%22%23cbd5e1%22%3E%D8%A7%D8%AE%D8%AA%D8%B1 %D8%B5%D9%88%D8%B1%D8%A9 %D9%82%D8%A8%D9%84%3C/text%3E%3Ctext x=%2250%25%22 y=%2278%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22-apple-system,BlinkMacSystemFont,Segoe UI,Arial%22 font-size=%2211%22 fill=%2264748b%22%3E%D8%A7%D8%B6%D8%BA%D8%B7 %D8%B9%D9%84%D9%89 %D8%A7%D9%84%D8%B2%D8%B1%3C/text%3E%3C/svg%3E';

const PLACEHOLDER_AFTER = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22450%22 height=%22600%22 viewBox=%220 0 450 600%22%3E%3Crect x=%2220%22 y=%2220%22 width=%22410%22 height=%22560%22 fill=%22none%22 stroke=%22%23047857%22 stroke-width=%221%22 stroke-dasharray=%228,6%22 rx=%2212%22/%3E%3Cg transform=%22translate(225,280)%22%3E%3Ccircle cx=%220%22 cy=%220%22 r=%2230%22 fill=%22%23065f46%22 opacity=%220.95%22/%3E%3Cpath d=%22M-13,-6 L-13,9 L13,9 L13,-6 Z M-9,-9 L-6,-13 L6,-13 L9,-9 Z%22 fill=%22none%22 stroke=%22%2334d399%22 stroke-width=%221.8%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/%3E%3Ccircle cx=%22-4.5%22 cy=%22-0.5%22 r=%222.2%22 fill=%22%2334d399%22/%3E%3Cpath d=%22M-13,4 L-4.5,0 L4.5,4 L13,0%22 fill=%22none%22 stroke=%22%2334d399%22 stroke-width=%221.8%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/%3E%3C/g%3E%3Ctext x=%2250%25%22 y=%2272%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22-apple-system,BlinkMacSystemFont,Segoe UI,Arial%22 font-size=%2215%22 font-weight=%22600%22 fill=%22%23a7f3d0%22%3E%D8%A7%D8%AE%D8%AA%D8%B1 %D8%B5%D9%88%D8%B1%D8%A9 %D8%A8%D8%B9%D8%AF%3C/text%3E%3Ctext x=%2250%25%22 y=%2278%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22-apple-system,BlinkMacSystemFont,Segoe UI,Arial%22 font-size=%2211%22 fill=%22%2334d399%22%3E%D9%86%D8%AA%D9%8A%D8%AC%D8%A9 %D8%A7%D9%84%D8%AA%D8%AC%D8%B1%D8%A8%D8%A9%3C/text%3E%3C/svg%3E';

type TryOnResultProps = {
  result: TryOnResponse | null;
  loading: boolean;
  progress?: number;
  originalImageUrl?: string;
  fabricThumbnailUrl?: string | null;

  comparisonBeforeImage?: string;
  comparisonAfterImage?: string;
  comparisonBeforeLabel?: string;
  comparisonAfterLabel?: string;

  onSaveToProject?: () => void;
  animateReveal?: boolean;
  onRetry?: () => void;
  onDebugPrompt?: () => void;
  onHelp?: () => void;
  onToggleAdminAnchors?: () => void;
  showAdminAnchors?: boolean;

  applyMask?: boolean;
  onApplyMaskChange?: (value: boolean) => void;

  watermarkEnabled?: boolean;
  onWatermarkChange?: (value: boolean) => void;

  selectedModel?: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';
  onModelChange?: (model: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview') => void;
  customPrompt?: string;
  onCustomPromptChange?: (prompt: string) => void;

  modalGenerations?: GenerationItem[];
  modalGenerationsPlaceholderCount?: number;
  onModalGenerationOpen?: (url: string) => void;
  onModalGenerationSetBefore?: (url: string) => void;
  onModalGenerationSetAfter?: (url: string) => void;
  onRefreshAfterImage?: () => void;
  onSaveAfterImage?: () => void;

  onOpenTemplatePicker?: () => void;
  onOpenFabricPicker?: () => void;
  onOpenFabricTiling?: () => void;
  
  // Feature flags for UI control
  features?: Partial<TryOnResultFeatures>;
};

function TryOnResultComponent(props: TryOnResultProps, ref: React.Ref<HTMLDivElement>) {
  const {
    result,
    loading,
    progress,
    originalImageUrl,
    fabricThumbnailUrl,
    comparisonBeforeImage,
    comparisonAfterImage,
    comparisonBeforeLabel,
    comparisonAfterLabel,
    onSaveToProject,
    onRetry,
    onDebugPrompt,
    onHelp,
    onToggleAdminAnchors,
    showAdminAnchors = false,
    applyMask = true,
    onApplyMaskChange,
    watermarkEnabled = true,
    onWatermarkChange,
    selectedModel = 'gemini-2.5-flash-image',
    onModelChange,
    customPrompt = '',
    onCustomPromptChange,
    modalGenerations,
    modalGenerationsPlaceholderCount,
    onModalGenerationOpen,
    onModalGenerationSetBefore,
    onModalGenerationSetAfter,
    onRefreshAfterImage,
    onSaveAfterImage,
    onOpenTemplatePicker,
    onOpenFabricPicker,
    onOpenFabricTiling,
    features: customFeatures,
  } = props;

  // Merge custom features with defaults
  const features = React.useMemo(
    () => ({ ...DEFAULT_FEATURES, ...customFeatures }),
    [customFeatures]
  );

  // Use custom hook for all business logic
  const {
    showDrawer,
    setShowDrawer,
    showMenu,
    setShowMenu,
    showThumbnailBar,
    setShowThumbnailBar,
    sliderPosition,
    setSliderPosition,
    testingMode,
    setTestingMode,
    showDevUi,
    setShowDevUi,
    mockLoading,
    mockProgress,
    mockResult,
    generationLogs,
    comparisonPanelRef,
    menuRootRef,
    effectiveLoading,
    effectiveProgress,
    effectiveResult,
    effectiveResultImageSrc,
    canOpenDrawer,
    canUseResultImageActions,
    placeholderCount,
    handleRetry,
    handleDownload,
    formatTime,
    formatDuration,
    scrollComparisonPanelToViewportTop,
  } = useTryOnResultLogic({
    result,
    loading,
    progress,
    originalImageUrl,
    fabricThumbnailUrl,
    onRetry,
  });

  const portalTarget = typeof document !== 'undefined' ? document.body : null;
  const resultImageSrc = result?.status !== 'failed' ? (result?.resultImageUrl || result?.resultImageDataUrl) : null;
  const hasModalGenerations = Array.isArray(modalGenerations) && modalGenerations.length > 0;
  const safeModalGenerations = Array.isArray(modalGenerations) ? modalGenerations : [];
  const [menuKeyVertical, setMenuKeyVertical] = React.useState<string | null>(null);

  return (
    <div ref={ref} className="relative w-full">
      <div className="w-full flex flex-col md:grid md:grid-cols-[140px_auto_110px] gap-2 md:gap-3 md:gap-4 items-start md:justify-center px-0 md:px-4">
        {/* ========================================
            PANEL 0: SIDEBAR (Unified Generations Rail - SM+)
            ======================================== */}
        {features.showGenerationsRail && (
        <div className="hidden md:block w-[110px] md:col-start-3 md:row-start-1">
          <GenerationsRail
            generations={safeModalGenerations}
            onOpenImage={onModalGenerationOpen}
            onSetBefore={onModalGenerationSetBefore}
            onSetAfter={onModalGenerationSetAfter}
            placeholderCount={Math.max(0, 8 - safeModalGenerations.length)}
          />
        </div>
        )}

        {/* ========================================
            PANEL 1: CONTROLS (Mobile: top, Desktop: left)
            ======================================== */}
        <ControlsPanel
          originalImageUrl={originalImageUrl}
          fabricThumbnailUrl={fabricThumbnailUrl}
          onOpenTemplatePicker={onOpenTemplatePicker}
          onOpenFabricPicker={onOpenFabricPicker}
          onOpenFabricTiling={onOpenFabricTiling}
          effectiveLoading={effectiveLoading}
          effectiveProgress={effectiveProgress}
          applyMask={applyMask}
          onApplyMaskChange={onApplyMaskChange}
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          customPrompt={customPrompt}
          onCustomPromptChange={onCustomPromptChange}
          onRetry={handleRetry}
          onDebugPrompt={onDebugPrompt}
          onSaveAfterImage={onSaveAfterImage}
          testingMode={testingMode}
          showDevUi={showDevUi}
          onToggleDevUi={() => setShowDevUi((v) => !v)}
          features={features}
        />  
        
        {/* ========================================
            PANEL 2: COMPARISON (Mobile: below controls, Desktop: middle)
            ======================================== */}
        <ComparisonPanel
          ref={comparisonPanelRef}
          comparisonBeforeImage={comparisonBeforeImage}
          comparisonAfterImage={comparisonAfterImage}
          comparisonBeforeLabel={comparisonBeforeLabel}
          comparisonAfterLabel={comparisonAfterLabel}
          originalImageUrl={originalImageUrl}
          effectiveResultImageSrc={effectiveResultImageSrc}
          sliderPosition={sliderPosition}
          effectiveLoading={effectiveLoading}
          PLACEHOLDER_BEFORE={PLACEHOLDER_BEFORE}
          PLACEHOLDER_AFTER={PLACEHOLDER_AFTER}
          safeModalGenerations={safeModalGenerations}
          onModalGenerationOpen={onModalGenerationOpen}
          onModalGenerationSetBefore={onModalGenerationSetBefore}
          onModalGenerationSetAfter={onModalGenerationSetAfter}
          placeholderCount={placeholderCount}
          features={features}
          onHelp={onHelp}
          onSaveToProject={onSaveToProject}
          onDownload={() => {
            if (effectiveResultImageSrc) {
              handleDownload(effectiveResultImageSrc, `khuyoot-tryon-${effectiveResult?.jobId || Date.now()}.png`);
            }
          }}
          onOpenDrawer={() => setShowDrawer(true)}
          onRefreshAfterImage={onRefreshAfterImage}
          canUseResultImageActions={canUseResultImageActions}
          canOpenDrawer={canOpenDrawer}
          applyMask={applyMask}
          onApplyMaskChange={onApplyMaskChange}
          watermarkEnabled={watermarkEnabled}
          onWatermarkChange={onWatermarkChange}
        />
      </div>

      {/* ========================================
          GENERATIONS RAIL (XS: bottom, SM+: hidden)
          ======================================== */}
      {features.showGenerationsRail && (
      <div className="w-full md:hidden mt-3 px-2 md:px-4">
        <GenerationsRail
          generations={safeModalGenerations}
          onOpenImage={onModalGenerationOpen}
          onSetBefore={onModalGenerationSetBefore}
          onSetAfter={onModalGenerationSetAfter}
          placeholderCount={Math.max(0, 8 - safeModalGenerations.length)}
        />
      </div>
      )}

      {/* ========================================
          PANEL 4: SLIDE-OVER DRAWER (PORTAL)
          ======================================== */}
      {features.showComparisonDrawer && showDrawer && portalTarget
        ? createPortal(
            <div className="fixed inset-0 z-[300] flex" aria-modal="true" role="dialog">
              <div
                className="flex-1 bg-black/60 backdrop-blur-[2px]"
                onClick={() => setShowDrawer(false)}
                aria-label="إغلاق المقارنة"
              />
              <aside className="relative w-full max-w-[520px] h-full bg-slate-950 text-white shadow-2xl border-l border-white/10 flex flex-col">
                <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold tracking-wide">سحب المقارنة</div>
                    <div className="text-[11px] text-white/60">راجع قبل/بعد مع آخر النتائج</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDrawer(false)}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    title="إغلاق"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-semibold">المقارنة</h3>
                    </div>
                    <ImageComparisonSlider
                      beforeImage={comparisonBeforeImage || originalImageUrl}
                      afterImage={comparisonAfterImage || resultImageSrc || originalImageUrl || ''}
                      beforeLabel={comparisonBeforeLabel || 'الأصل'}
                      afterLabel={comparisonAfterLabel || 'بعد القماش'}
                      heightScale={0.9}
                      animateReveal={false}
                    />
                  </div>
                </div>
              </aside>
            </div>,
            portalTarget
          )
        : null}
    </div>
  );
}

const TryOnResultBase = React.forwardRef(TryOnResultComponent);
TryOnResultBase.displayName = 'TryOnResult';
export const TryOnResult = TryOnResultBase;
