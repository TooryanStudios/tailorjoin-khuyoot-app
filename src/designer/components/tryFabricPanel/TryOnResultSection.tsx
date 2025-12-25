import React from 'react';
import type { TryOnResponse } from '../../../types/tryon';
import { TryOnResult } from '../TryOnResult';
import type { GenerationItem } from '../../../../pages/designerV2/components/GenerationsRail';

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
  onHelp?: () => void;
  onToggleAdminAnchors?: () => void;
  showAdminAnchors?: boolean;
  modalGenerations?: GenerationItem[];
  modalGenerationsPlaceholderCount?: number;
  onModalGenerationOpen?: (url: string) => void;
  onModalGenerationSetBefore?: (url: string) => void;
  onModalGenerationSetAfter?: (url: string) => void;
  onOpenTemplatePicker?: () => void;
  onOpenFabricPicker?: () => void;
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
        animateReveal={props.animateReveal}
        modalGenerations={props.modalGenerations}
        modalGenerationsPlaceholderCount={props.modalGenerationsPlaceholderCount}
        onModalGenerationOpen={props.onModalGenerationOpen}
        onModalGenerationSetBefore={props.onModalGenerationSetBefore}
        onModalGenerationSetAfter={props.onModalGenerationSetAfter}
        onOpenTemplatePicker={props.onOpenTemplatePicker}
        onOpenFabricPicker={props.onOpenFabricPicker}
      />
    </div>
  );
});
