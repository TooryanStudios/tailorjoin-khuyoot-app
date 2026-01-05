import React from 'react';
import type { TryOnResponse } from '../../../types/tryon';
import { TryOnResult } from '../TryOnResult';
import type { GenerationItem } from '../../../../pages/designerV2/components/GenerationsRail';
import type { TryOnResultFeatures } from '../tryOnResult/TryOnResultFeatures';

export const TryOnResultSection = React.forwardRef<HTMLDivElement, {
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
  features?: Partial<TryOnResultFeatures>;
}>(function TryOnResultSection(props, ref) {
  return (
    <div ref={ref} className="order-1 md:order-2">
      <TryOnResult
        result={props.result}
        loading={props.loading}
        progress={props.progress}
        originalImageUrl={props.originalImageUrl}
        fabricThumbnailUrl={props.fabricThumbnailUrl}
        comparisonBeforeImage={props.comparisonBeforeImage}
        comparisonAfterImage={props.comparisonAfterImage}
        comparisonBeforeLabel={props.comparisonBeforeLabel}
        comparisonAfterLabel={props.comparisonAfterLabel}
        onHelp={props.onHelp}
        onToggleAdminAnchors={props.onToggleAdminAnchors}
        showAdminAnchors={props.showAdminAnchors}
        onSaveToProject={props.onSaveToProject}
        onRetry={props.onRetry}
        onDebugPrompt={props.onDebugPrompt}
        applyMask={props.applyMask}
        onApplyMaskChange={props.onApplyMaskChange}
        watermarkEnabled={props.watermarkEnabled}
        onWatermarkChange={props.onWatermarkChange}
        selectedModel={props.selectedModel}
        onModelChange={props.onModelChange}
        customPrompt={props.customPrompt}
        onCustomPromptChange={props.onCustomPromptChange}
        animateReveal={props.animateReveal}
        modalGenerations={props.modalGenerations}
        modalGenerationsPlaceholderCount={props.modalGenerationsPlaceholderCount}
        onModalGenerationOpen={props.onModalGenerationOpen}
        onModalGenerationSetBefore={props.onModalGenerationSetBefore}
        onModalGenerationSetAfter={props.onModalGenerationSetAfter}
        onRefreshAfterImage={props.onRefreshAfterImage}
        onSaveAfterImage={props.onSaveAfterImage}
        onOpenTemplatePicker={props.onOpenTemplatePicker}
        onOpenFabricPicker={props.onOpenFabricPicker}
        onOpenFabricTiling={props.onOpenFabricTiling}
        features={props.features}
      />
    </div>
  );
});
