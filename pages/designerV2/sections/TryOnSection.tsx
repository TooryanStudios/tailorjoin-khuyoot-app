import React from 'react';
import { TryFabricPanel, type TryFabricPanelHandle } from '../../../src/designer/components/TryFabricPanel';
import { AdminAnchor } from '../components/AdminAnchor';
import type { TryOnResultFeatures } from '../../../src/designer/components/tryOnResult/TryOnResultFeatures';

interface TryOnSectionProps {
  tryFabricPanelRef: React.RefObject<TryFabricPanelHandle>;
  tryFabricSectionRef: React.RefObject<HTMLDivElement>;
  showAdminLabels: boolean;
  
  // Template props
  selectedTemplate: string;
  templatePreviewUrl: string | null;
  templateDimensions: { width: number; height: number } | null;
  templateFullSizeCache: Record<string, string>;
  
  // Fabric props
  fabricImage: string | null;
  selectedFabricId: string | null;
  
  // Comparison override
  generationsBeforeUrl: string | null;
  generationsAfterUrl: string | null;
  
  // Callbacks
  showToast: (message: string, type: 'success' | 'error' | 'info', duration?: number) => void;
  onResultHelp: () => void;
  onResultToggleAdminAnchors?: () => void;
  onTemplateSubmit: (data: { templateId: string; templateImageUrl: string; originalImageUrl?: string }) => Promise<void>;
  onFabricSubmit: (data: { fabricImageUrl: string; fabricPreviewUrl?: string | null }) => void;
  onOpenTiling: () => void;
  onOpenNeck: () => void;
  onOpenSleeve: () => void;
  onGenerated: (data: { jobId: string; resultImageUrl: string; resultThumbnailUrl?: string }) => Promise<void>;
  onApplyResult: (data: { jobId: string; resultImageUrl: string }) => void;
  
  // Initial options
  initialOptions: {
    neckStyle: 'round' | 'v' | 'collar' | 'keep';
    sleeveStyle: 'long' | 'short' | 'none' | 'keep';
    embroideryStyle: 'chest' | 'collar' | 'full' | 'keep';
    fabricScale: number;
    colorPreservation: 'high' | 'medium' | 'low';
  };
  
  // Generations
  generations: GenerationItem[];
  onModalGenerationOpen: (url: string) => void;
  onModalGenerationSetBefore: (url: string) => void;
  onModalGenerationSetAfter: (url: string) => void;
  onRefreshAfterImage?: () => void;
  onSaveAfterImage?: () => void;
  
  // Try-on metadata
  lastTryOnJobId: string | null;
  
  // Feature toggles
  features?: Partial<TryOnResultFeatures>;
}

export const TryOnSection: React.FC<TryOnSectionProps> = ({
  tryFabricPanelRef,
  tryFabricSectionRef,
  showAdminLabels,
  selectedTemplate,
  templatePreviewUrl,
  templateDimensions,
  templateFullSizeCache,
  fabricImage,
  selectedFabricId,
  generationsBeforeUrl,
  generationsAfterUrl,
  showToast,
  onResultHelp,
  onResultToggleAdminAnchors,
  onTemplateSubmit,
  onFabricSubmit,
  onOpenTiling,
  onOpenNeck,
  onOpenSleeve,
  onGenerated,
  onApplyResult,
  initialOptions,
  generations,
  onModalGenerationOpen,
  onModalGenerationSetBefore,
  onModalGenerationSetAfter,
  onRefreshAfterImage,
  onSaveAfterImage,
  lastTryOnJobId,
  features,
}) => {
  return (
    <AdminAnchor
      ref={tryFabricSectionRef}
      anchorId="panel-try-fabric"
      label="panel-try-fabric"
      visible={showAdminLabels}
      className=""
    >
      <AdminAnchor
        anchorId="panel-try-fabric-header"
        label="panel-try-fabric-header"
        visible={showAdminLabels}
        className="contents"
      />

      <AdminAnchor
        anchorId="panel-try-fabric-controls"
        label="panel-try-fabric-controls"
        visible={showAdminLabels}
        className="block"
      >
        {/* TryFabricPanel - ENABLED with limited features */}
        {true && (
        <TryFabricPanel
          ref={tryFabricPanelRef}
          initialTemplateId={selectedTemplate}
          initialTemplateImageUrl={templatePreviewUrl}
          initialTemplateWidth={templateDimensions?.width || null}
          initialTemplateHeight={templateDimensions?.height || null}
          useExternalCards={true}
          externalTemplateImageUrl={templatePreviewUrl}
          externalTemplateImageUrlForGeneration={selectedTemplate ? (templateFullSizeCache[selectedTemplate] || null) : null}
          externalFabricImageUrl={fabricImage}
          selectedFabricId={selectedFabricId}
          showToast={showToast}
          comparisonOverride={{
            beforeImage: generationsBeforeUrl,
            afterImage: generationsAfterUrl,
            beforeLabel: 'القماش',
            afterLabel: 'النتيجة',
          }}
          onResultHelp={onResultHelp}
          onResultToggleAdminAnchors={onResultToggleAdminAnchors}
          showAdminAnchors={showAdminLabels}
          onTemplateSubmit={onTemplateSubmit}
          onFabricSubmit={onFabricSubmit}
          modalGenerations={generations}
          modalGenerationsPlaceholderCount={Math.max(0, 8 - generations.length)}
          onModalGenerationOpen={onModalGenerationOpen}
          onModalGenerationSetBefore={onModalGenerationSetBefore}
          onModalGenerationSetAfter={onModalGenerationSetAfter}
          onRefreshAfterImage={onRefreshAfterImage}
          onSaveAfterImage={onSaveAfterImage}
          onOpenTiling={onOpenTiling}
          onOpenNeck={onOpenNeck}
          onOpenSleeve={onOpenSleeve}
          onGenerated={onGenerated}
          initialOptions={initialOptions}
          onApplyResult={onApplyResult}
          features={{
            ...features,
            showPreviewSection: true,
            showTemplatePreview: true,
            showFabricPreview: true,
            showGenerateButton: true,
            showFabricTilingButton: true,
            showComparisonSlider: true,
            showGenerationsRail: true,
          }}
        />
        )}
      </AdminAnchor>
    </AdminAnchor>
  );
};
