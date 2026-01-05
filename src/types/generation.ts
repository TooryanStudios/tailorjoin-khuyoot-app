// Stable state management for AI generation to prevent impossible states

export type GenerationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ImageResult {
  url: string;
  width: number;
  height: number;
  thumbnailUrl?: string;
  jobId?: string;
}

export type GenerationState = 
  | { status: 'idle' }
  | { status: 'loading'; progress?: number }
  | { status: 'success'; data: ImageResult }
  | { status: 'error'; error: string };

export interface ModelOption {
  id: string;
  label: string;
  labelAr: string;
  speed: 'instant' | 'fast' | 'high-quality';
  enhancePrompt: boolean;
}

export const AI_MODELS: ModelOption[] = [
  {
    id: 'imagen-3.0-fast-generate-001',
    label: 'Fastest',
    labelAr: 'الأسرع',
    speed: 'instant',
    enhancePrompt: false
  },
  {
    id: 'imagen-3.0-generate-002',
    label: 'Balanced',
    labelAr: 'متوازن',
    speed: 'fast',
    enhancePrompt: true
  },
  {
    id: 'gemini-3-pro-image-preview',
    label: 'Highest Quality',
    labelAr: 'أعلى جودة',
    speed: 'high-quality',
    enhancePrompt: true
  }
];
