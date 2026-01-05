export type TryOnOptions = {
  neckStyle?: string;
  embroideryStyle?: string;
  sleeveStyle?: string;
  fabricScale?: number; // 0.5..3
  colorPreservation?: 'high' | 'medium' | 'low';
  applyMask?: boolean; // whether to apply background-preserving mask postprocess
  watermarkEnabled?: boolean; // whether to apply Khuyoot watermark
  model?: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview'; // AI model selection
  generationStartTime?: number; // timestamp when generation started
  generationEndTime?: number; // timestamp when generation ended
  customPrompt?: string; // custom prompt to override default
};

export type TryOnRequest = {
  garmentTemplateId: string;
  garmentTemplateImageUrl?: string; // optional if server maps id->url
  garmentTemplateImageBase64?: string; // optional: base64-encoded template (e.g., for custom uploads)
  garmentTemplateMimeType?: string; // required if garmentTemplateImageBase64 is provided
  garmentTemplateWidth?: number; // optional: client-provided template dimensions
  garmentTemplateHeight?: number; // optional: client-provided template dimensions
  fabricImageBase64?: string; // optional alternative to URL
  fabricImageUrl?: string; // optional
  fabricMimeType?: string;
  comparisonBeforeImageUrl?: string; // optional: image to use for before panel in comparison
  options: TryOnOptions;
};

export type TryOnResponse = {
  jobId: string;
  status: 'completed' | 'failed';
  resultImageUrl?: string;
  resultThumbnailUrl?: string;
  resultImageDataUrl?: string;
  error?: string;
};
