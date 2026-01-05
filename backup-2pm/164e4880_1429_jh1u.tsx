import React from 'react';
import type { TryOnOptions } from '../../types/tryon';
import type { GenerationItem } from '../../../pages/designerV2/components/GenerationsRail';
import { TryFabricPanelBase, type TryFabricPanelBaseHandle } from './TryFabricPanelBase';

type GarmentTemplate = {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl?: string | null;
  enabled?: boolean;
  order?: number;
  isPremium?: boolean;
};

export type TryFabricPanelHandle = {
  generate: () => void;
  openTemplatePicker: () => void;
  openFabricPicker: () => void;
};

export type TryFabricPanelProps = {
  initialTemplateId?: string;
  initialTemplateImageUrl?: string | null;
  initialTemplateWidth?: number | null;
  initialTemplateHeight?: number | null;
  initialOptions?: TryOnOptions;
  onApplyResult: (result: { jobId: string; resultImageUrl: string }) => void;
  onTemplateSubmit?: (payload: { templateId: string; templateImageUrl: string }) => void;
  onFabricSubmit?: (payload: { fabricImageUrl: string; fabricPreviewUrl?: string | null }) => void;
  templates?: GarmentTemplate[];
  useExternalCards?: boolean;
  externalTemplateImageUrl?: string | null;
  externalFabricImageUrl?: string | null;
  comparisonOverride?: {
    beforeImage?: string | null;
    afterImage?: string | null;
    beforeLabel?: string;
    afterLabel?: string;
  } | null;
  onResultHelp?: () => void;
  onResultToggleAdminAnchors?: () => void;
  showAdminAnchors?: boolean;
  onRequestPickTemplate?: () => void;
  onRequestPickFabric?: () => void;
  onMissingTemplate?: () => void;
  onMissingFabric?: () => void;
  onRequestHelp?: () => void;
  onGenerated?: (result: { jobId: string; resultImageUrl: string; resultThumbnailUrl?: string }) => void;
  modalGenerations?: GenerationItem[];
  modalGenerationsPlaceholderCount?: number;
  onModalGenerationOpen?: (url: string) => void;
  onModalGenerationSetBefore?: (url: string) => void;
  onModalGenerationSetAfter?: (url: string) => void;
};

export const TryFabricPanel = React.forwardRef<TryFabricPanelHandle, TryFabricPanelProps>(function TryFabricPanel(props, ref) {
  return <TryFabricPanelBase {...props} ref={ref} />;
});
