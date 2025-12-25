import React from 'react';
import type { TryOnOptions, TryOnRequest, TryOnResponse } from '../../types/tryon';
import { resizeImage } from '../../utils/imageResize';
import { fileToBase64 } from '../../utils/fileToBase64';
import { generateTryOn } from '../../services/tryonService';

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } | null {
  const match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl || '');
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

export function useTryOnGeneration(params: {
  useExternalCards: boolean;

  initialTemplateId?: string;
  initialTemplateImageUrl?: string | null;
  initialTemplateWidth?: number | null;
  initialTemplateHeight?: number | null;
  initialOptions?: TryOnOptions;

  externalTemplateImageUrl?: string | null;
  externalFabricImageUrl?: string | null;

  selectedTemplateId: string | null;
  templates: Array<{ id: string; imageUrl: string }>;

  customTemplateFile: File | null;
  customTemplatePreview: string | null;

  fabricFile: File | null;
  fabricImageUrl: string | null;

  options: TryOnOptions;

  validateFabricFile: (file: File | null) => boolean;

  resultRef: React.RefObject<HTMLDivElement>;
  topRef: React.RefObject<HTMLDivElement>;

  onApplyResult: (result: { jobId: string; resultImageUrl: string }) => void;
  onGenerated?: (result: { jobId: string; resultImageUrl: string; resultThumbnailUrl?: string }) => void;

  onMissingTemplate?: () => void;
  onMissingFabric?: () => void;

  onClearResultSideEffects?: () => void;

  createCoverThumbnailDataUrl: (params: { sourceDataUrl: string; targetWidth: number; targetHeight: number }) => Promise<string | null>;
  upsertRecentTemplate: (payload: { id?: string; imageUrl?: string; thumbnailUrl?: string | null; name?: string }) => void;
  saveTemplateToHistory: boolean;
  recentThumbWidth: number;
  recentThumbHeight: number;

  setProgressToZeroDelayMs?: number;
}) {
  const {
    useExternalCards,
    initialTemplateId,
    initialTemplateImageUrl,
    initialTemplateWidth,
    initialTemplateHeight,
    initialOptions,
    externalTemplateImageUrl,
    externalFabricImageUrl,
    selectedTemplateId,
    templates,
    customTemplateFile,
    customTemplatePreview,
    fabricFile,
    fabricImageUrl,
    options,
    validateFabricFile,
    resultRef,
    topRef,
    onApplyResult,
    onGenerated,
    onMissingTemplate,
    onMissingFabric,
    onClearResultSideEffects,
    createCoverThumbnailDataUrl,
    upsertRecentTemplate,
    saveTemplateToHistory,
    recentThumbWidth,
    recentThumbHeight,
    setProgressToZeroDelayMs = 500,
  } = params;

  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [result, setResult] = React.useState<TryOnResponse | null>(null);
  const [animateReveal, setAnimateReveal] = React.useState(false);

  const loadingRef = React.useRef(false);
  React.useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  const clearResult = React.useCallback(() => {
    setResult(null);
    onClearResultSideEffects?.();
  }, [onClearResultSideEffects]);

  const generate = React.useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    const effectiveTemplateId = useExternalCards ? (initialTemplateId || null) : (selectedTemplateId || null);
    const templateImageFromLibrary = !useExternalCards && selectedTemplateId
      ? (templates.find(t => t.id === selectedTemplateId)?.imageUrl || null)
      : null;

    const effectiveTemplateImageUrl = useExternalCards
      ? (externalTemplateImageUrl || initialTemplateImageUrl || null)
      : (templateImageFromLibrary || initialTemplateImageUrl || null);
    const effectiveFabricUrl = fabricImageUrl || (useExternalCards ? (externalFabricImageUrl || null) : null);

    if (useExternalCards) {
      if (!effectiveTemplateId || !effectiveTemplateImageUrl) {
        onMissingTemplate?.();
        return;
      }
      if (!effectiveFabricUrl && !fabricFile) {
        onMissingFabric?.();
        return;
      }
    }

    const hasCustomTemplateFromFile = Boolean(customTemplateFile);
    const hasCustomTemplateFromDataUrl = Boolean(!customTemplateFile && customTemplatePreview && customTemplatePreview.startsWith('data:image/'));
    const hasAnyCustomTemplate = hasCustomTemplateFromFile || hasCustomTemplateFromDataUrl;

    if (!effectiveTemplateId && !hasAnyCustomTemplate) {
      setResult({ jobId: 'n/a', status: 'failed', error: 'يرجى اختيار قالب أو رفع صورة' });
      loadingRef.current = false;
      return;
    }
    if (!useExternalCards && !fabricFile && !effectiveFabricUrl) {
      setResult({ jobId: 'n/a', status: 'failed', error: 'يرجى اختيار القماش' });
      loadingRef.current = false;
      return;
    }
    if (fabricFile && !validateFabricFile(fabricFile)) {
      loadingRef.current = false;
      return;
    }

    setResult(null);
    setProgress(0);
    setAnimateReveal(false);
    setLoading(true);

    setTimeout(() => {
      resultRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' } as any);
    }, 100);

    try {
      setProgress(10);
      let fabricBase64: string | null = null;
      let fabricMimeType: string | null = null;

      if (fabricFile) {
        const resized = await resizeImage(fabricFile, 1024);
        setProgress(25);
        const { base64, mimeType } = await fileToBase64(resized);
        fabricBase64 = base64;
        fabricMimeType = mimeType;
        setProgress(40);
      } else {
        const url = effectiveFabricUrl;
        if (url && url.startsWith('data:')) {
          const parsed = parseDataUrl(url);
          if (parsed) {
            fabricBase64 = parsed.base64;
            fabricMimeType = parsed.mimeType;
          }
        }
        setProgress(40);
      }

      const templateId = hasAnyCustomTemplate ? 'custom-upload' : (effectiveTemplateId || selectedTemplateId)!;

      const optionsForPayload = useExternalCards
        ? {
            neckStyle: initialOptions?.neckStyle || 'keep',
            embroideryStyle: initialOptions?.embroideryStyle || 'keep',
            sleeveStyle: initialOptions?.sleeveStyle || 'keep',
            fabricScale: initialOptions?.fabricScale ?? 1,
            colorPreservation: initialOptions?.colorPreservation || 'high',
          }
        : options;

      const includeParentDimensions =
        Boolean(initialTemplateImageUrl) &&
        effectiveTemplateImageUrl === (initialTemplateImageUrl || null) &&
        typeof initialTemplateWidth === 'number' &&
        typeof initialTemplateHeight === 'number' &&
        initialTemplateWidth > 0 &&
        initialTemplateHeight > 0;

      const payload: TryOnRequest = {
        garmentTemplateId: templateId,
        ...(effectiveTemplateImageUrl ? { garmentTemplateImageUrl: effectiveTemplateImageUrl } : {}),
        ...(includeParentDimensions ? { garmentTemplateWidth: initialTemplateWidth!, garmentTemplateHeight: initialTemplateHeight! } : {}),
        ...(fabricBase64
          ? { fabricImageBase64: fabricBase64, fabricMimeType: fabricMimeType || undefined }
          : { fabricImageUrl: effectiveFabricUrl || undefined }),
        options: {
          neckStyle: optionsForPayload?.neckStyle || 'keep',
          embroideryStyle: optionsForPayload?.embroideryStyle || 'keep',
          sleeveStyle: optionsForPayload?.sleeveStyle || 'keep',
          fabricScale: Math.max(0.5, Math.min(3, Number(optionsForPayload?.fabricScale ?? 1))),
          colorPreservation: optionsForPayload?.colorPreservation || 'high',
        },
      };

      if (hasCustomTemplateFromFile && customTemplateFile) {
        const templateResized = await resizeImage(customTemplateFile, 1024);
        const templateData = await fileToBase64(templateResized);
        const templateDataUrl = `data:${templateData.mimeType};base64,${templateData.base64}`;
        payload.garmentTemplateImageUrl = templateDataUrl;

        if (saveTemplateToHistory) {
          const thumb = await createCoverThumbnailDataUrl({
            sourceDataUrl: templateDataUrl,
            targetWidth: recentThumbWidth,
            targetHeight: recentThumbHeight,
          });
          upsertRecentTemplate({
            id: `custom-${Date.now()}`,
            imageUrl: templateDataUrl,
            thumbnailUrl: thumb,
            name: customTemplateFile.name || 'قالب مخصص',
          });
        }
      } else if (hasCustomTemplateFromDataUrl && customTemplatePreview) {
        payload.garmentTemplateImageUrl = customTemplatePreview;
      }

      setProgress(50);
      const resp = await generateTryOn(payload);
      setProgress(90);
      setResult(resp);

      const completedUrl = resp.status === 'completed' ? (resp.resultImageUrl || (resp as any).resultImageDataUrl || null) : null;
      if (completedUrl) {
        setProgress(100);
        onGenerated?.({ jobId: resp.jobId, resultImageUrl: completedUrl, resultThumbnailUrl: (resp as any)?.resultThumbnailUrl });
        setTimeout(() => setAnimateReveal(true), 300);
      }
    } catch (e: any) {
      setResult({ jobId: 'n/a', status: 'failed', error: e?.message || 'Request failed' });
    } finally {
      setLoading(false);
      loadingRef.current = false;
      setTimeout(() => setProgress(0), setProgressToZeroDelayMs);
    }
  }, [
    useExternalCards,
    initialTemplateId,
    selectedTemplateId,
    templates,
    externalTemplateImageUrl,
    initialTemplateImageUrl,
    fabricImageUrl,
    externalFabricImageUrl,
    fabricFile,
    customTemplateFile,
    customTemplatePreview,
    validateFabricFile,
    resultRef,
    initialOptions,
    initialTemplateWidth,
    initialTemplateHeight,
    options,
    onMissingTemplate,
    onMissingFabric,
    onGenerated,
    createCoverThumbnailDataUrl,
    upsertRecentTemplate,
    saveTemplateToHistory,
    recentThumbWidth,
    recentThumbHeight,
    setProgressToZeroDelayMs,
  ]);

  const saveToProject = React.useCallback(() => {
    if (result?.status !== 'completed' || !result.resultImageUrl) return;
    onApplyResult({ jobId: result.jobId, resultImageUrl: result.resultImageUrl });
  }, [result, onApplyResult]);

  const retry = React.useCallback(() => {
    topRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' } as any);
    generate();
  }, [topRef, generate]);

  return {
    loading,
    progress,
    result,
    animateReveal,
    setAnimateReveal,
    setResult,
    clearResult,
    generate,
    saveToProject,
    retry,
  };
}
