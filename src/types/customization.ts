/**
 * Types for Customization Page
 * Handles model selection, fabric upload, and AI preview
 */

export type GarmentType = 'abaya' | 'dress' | 'thobe' | 'jalabia' | 'shirt' | 'other';

export type PreviewStatus = 'idle' | 'processing' | 'ready' | 'error';

export interface CustomizationModel {
  id: string;
  name: string;
  nameEn?: string;
  type: GarmentType;
  thumbnailUrl: string;
  description?: string;
}

export interface FabricUpload {
  file?: File;
  url: string;
  preview: string; // Data URL for local preview
  uploadedAt: Date;
}

export interface AIPreviewResult {
  previewUrl: string;
  aiTips: string[];
  processingTime?: number;
}

export interface CustomizationState {
  selectedModel?: CustomizationModel;
  fabricUpload?: FabricUpload;
  previewUrl?: string;
  previewStatus: PreviewStatus;
  aiTips: string[];
  errorMessage?: string;
}

export interface CustomizationData {
  modelId: string;
  modelName: string;
  fabricUrl: string;
  previewUrl?: string;
  aiTips?: string[];
  createdAt: Date;
}
