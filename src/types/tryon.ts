export type TryOnOptions = {
  neckStyle?: string;
  embroideryStyle?: string;
  sleeveStyle?: string;
  fabricScale?: number; // 0.5..3
  colorPreservation?: 'high' | 'medium' | 'low';
};

export type TryOnRequest = {
  garmentTemplateId: string;
  garmentTemplateImageUrl?: string; // optional if server maps id->url
  garmentTemplateWidth?: number; // optional: client-provided template dimensions
  garmentTemplateHeight?: number; // optional: client-provided template dimensions
  fabricImageBase64?: string; // optional alternative to URL
  fabricImageUrl?: string; // optional
  fabricMimeType?: string;
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
