import React from 'react';
import type { TryOnOptions, TryOnRequest, TryOnResponse } from '../../types/tryon';
import { resizeImage } from '../../utils/imageResize';
import { fileToBase64 } from '../../utils/fileToBase64';
import { generateTryOn } from '../../services/tryonService';
import { showToast } from '../../../utils/notifications';
import { firebaseService } from '../../../services/firebase';

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
  externalTemplateImageUrlForGeneration?: string | null;
  externalFabricImageUrl?: string | null;

  selectedTemplateId: string | null;
  templates: Array<{ id: string; imageUrl: string }>;

  customTemplateFile: File | null;
  customTemplatePreview: string | null;

  fabricFile: File | null;
  fabricImageUrl: string | null;
  selectedFabricId?: string | null;

  options: TryOnOptions;
  customPrompt?: string;

  comparisonBeforeImageUrl?: string | null; // URL to send for before panel comparison

  validateFabricFile: (file: File | null) => boolean;

  resultRef: React.RefObject<HTMLDivElement>;
  topRef: React.RefObject<HTMLDivElement>;

  onApplyResult: (result: { jobId: string; resultImageUrl: string }) => void;
  onGenerated?: (result: { jobId: string; resultImageUrl: string; resultThumbnailUrl?: string }) => void;
  onReloadGenerations?: () => void | Promise<void>;

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
    externalTemplateImageUrlForGeneration,
    externalFabricImageUrl,
    selectedTemplateId,
    templates,
    customTemplateFile,
    customTemplatePreview,
    fabricFile,
    fabricImageUrl,
    selectedFabricId,
    options,
    customPrompt,
    comparisonBeforeImageUrl,
    validateFabricFile,
    resultRef,
    topRef,
    onApplyResult,
    onGenerated,
    onReloadGenerations,
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

  // Track mount status to avoid setState on unmounted, but still allow background persistence
  const isMountedRef = React.useRef(true);
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadingRef = React.useRef(false);
  React.useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  const clearResult = React.useCallback(() => {
    setResult(null);
    onClearResultSideEffects?.();
  }, [onClearResultSideEffects]);

  const persistResultSnapshot = React.useCallback((snapshot: TryOnResponse) => {
    try {
      const raw = localStorage.getItem('khuyoot_tryfabric_state');
      const parsed = raw ? JSON.parse(raw) : {};
      localStorage.setItem('khuyoot_tryfabric_state', JSON.stringify({ ...parsed, result: snapshot }));
      
      // Clear pending generation state
      localStorage.removeItem('khuyoot_pending_generation');
    } catch {
      // ignore persistence errors
    }
  }, []);

  const savePendingGeneration = React.useCallback((jobId: string) => {
    try {
      localStorage.setItem('khuyoot_pending_generation', JSON.stringify({
        jobId,
        startedAt: Date.now(),
      }));
    } catch {
      // ignore
    }
  }, []);

  const clearPendingGeneration = React.useCallback(() => {
    try {
      localStorage.removeItem('khuyoot_pending_generation');
    } catch {
      // ignore
    }
  }, []);

  // Check for pending generation on mount and poll for result
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('khuyoot_pending_generation');
      if (!raw) return;

      const pending = JSON.parse(raw);
      const elapsed = Date.now() - (pending.startedAt || 0);
      
      // If more than 5 minutes old, consider it failed
      if (elapsed > 5 * 60 * 1000) {
        clearPendingGeneration();
        return;
      }

      console.log('[TryOn] Found pending generation:', pending.jobId);
      
      // Set loading state
      if (isMountedRef.current) {
        setLoading(true);
        setProgress(50);
      }

      // Poll for result
      const pollInterval = setInterval(async () => {
        try {
          const job = await firebaseService.getTryOnJobById(pending.jobId);
          if (job?.status === 'completed' && job.resultUrl) {
            console.log('[TryOn] Pending generation completed!');
            
            const resp: TryOnResponse = {
              jobId: pending.jobId,
              status: 'completed',
              resultImageUrl: job.resultUrl,
              resultThumbnailUrl: job.thumbnailUrl || undefined,
            };

            persistResultSnapshot(resp);
            
            if (isMountedRef.current) {
              setResult(resp);
              setProgress(100);
              setLoading(false);
              setAnimateReveal(true);
            }

            onGenerated?.({
              jobId: pending.jobId,
              resultImageUrl: job.resultUrl,
              resultThumbnailUrl: job.thumbnailUrl || undefined,
            });

            // Reload generations from Firestore to ensure it appears in the list
            await onReloadGenerations?.();

            clearInterval(pollInterval);
            clearPendingGeneration();
          }
        } catch (e) {
          console.warn('[TryOn] Poll error:', e);
        }
      }, 2000);

      // Clear interval after 5 minutes
      const timeout = setTimeout(() => {
        clearInterval(pollInterval);
        clearPendingGeneration();
        if (isMountedRef.current) {
          setLoading(false);
        }
      }, 5 * 60 * 1000);

      return () => {
        clearInterval(pollInterval);
        clearTimeout(timeout);
      };
    } catch (e) {
      console.error('[TryOn] Error checking pending generation:', e);
    }
  }, [clearPendingGeneration, persistResultSnapshot, onGenerated, onReloadGenerations]);

  const generate = React.useCallback(async () => {
    // Prevent double-clicks
    if (loading) return;

    console.log('[TryOn] Starting generation...');

    // Step 1: Get template URL
    const templateUrl = useExternalCards
      ? (externalTemplateImageUrlForGeneration || externalTemplateImageUrl || initialTemplateImageUrl)
      : (selectedTemplateId ? templates.find(t => t.id === selectedTemplateId)?.imageUrl : null) || initialTemplateImageUrl;

    const templateId = useExternalCards ? initialTemplateId : selectedTemplateId;

    // Step 2: Get fabric URL
    const fabricUrl = fabricImageUrl || externalFabricImageUrl;

    console.log('[TryOn] Inputs', { templateId, templateUrl, fabricUrl });

    // Debug: show exactly what prompt will be sent (without generating extra output elsewhere)
    try {
      const prompt = typeof customPrompt === 'string' ? customPrompt : '';
      const trimmed = prompt.trim();
      console.log('[TryOn] customPrompt being sent:', {
        hasPrompt: !!trimmed,
        length: trimmed.length,
        preview: trimmed ? trimmed.slice(0, 220) : '',
      });
    } catch {
      // ignore
    }

    // Step 3: Validate
    if (!templateUrl) {
      onMissingTemplate?.();
      showToast('⚠️ القالب مطلوب', 'يرجى اختيار قالب أولاً', 'error');
      return;
    }

    // Check for AVIF format (not supported by API)
    if (templateUrl.includes('.avif') || templateUrl.includes('image/avif')) {
      console.log('[TryOn] AVIF format detected in templateUrl');
      showToast('❌ صيغة غير مدعومة', 'صيغة صورة القالب AVIF غير مدعومة. اختر WebP أو JPEG أو PNG', 'error');
      return;
    }

    if (!fabricUrl && !fabricFile) {
      onMissingFabric?.();
      showToast('⚠️ القماش مطلوب', 'يرجى اختيار القماش أولاً', 'error');
      return;
    }

    // Check fabric for AVIF too
    if (fabricUrl && (fabricUrl.includes('.avif') || fabricUrl.includes('image/avif'))) {
      console.log('[TryOn] AVIF format detected in fabricUrl');
      showToast('❌ صيغة غير مدعومة', 'صيغة صورة القماش AVIF غير مدعومة. اختر WebP أو JPEG أو PNG', 'error');
      return;
    }

    // Step 4: Start loading
    setResult(null);
    setProgress(0);
    setAnimateReveal(false);
    setLoading(true);

    try {
      // Step 5: Prepare fabric data - send at full quality without resizing
      setProgress(20);
      let fabricBase64: string | null = null;
      let fabricMimeType: string | null = null;

      if (fabricFile) {
        // Send fabric file at original quality without resizing
        const { base64, mimeType } = await fileToBase64(fabricFile);
        fabricBase64 = base64;
        fabricMimeType = mimeType;
      } else if (fabricUrl?.startsWith('data:')) {
        const parsed = parseDataUrl(fabricUrl);
        if (parsed) {
          fabricBase64 = parsed.base64;
          fabricMimeType = parsed.mimeType;
        }
      }

      // Step 5b: Prepare template data (if custom file was uploaded)
      let resolvedTemplateUrl = templateUrl;
      let templateBase64: string | null = null;
      let templateMimeType: string | null = null;

      if (customTemplateFile && templateUrl?.startsWith('blob:')) {
        // Custom uploaded template: convert File to base64 at full quality
        console.log('[TryOn] Converting custom template file to base64');
        const { base64, mimeType } = await fileToBase64(customTemplateFile);
        templateBase64 = base64;
        templateMimeType = mimeType;
        // Clear the blob URL since we're sending base64 instead
        resolvedTemplateUrl = undefined;
      }

      // Step 6: Build API request
      setProgress(40);
      const generationStartTime = Date.now();
      const payload: TryOnRequest = {
        garmentTemplateId: templateId || 'unknown',
        ...(templateBase64 
          ? { garmentTemplateImageBase64: templateBase64, garmentTemplateMimeType: templateMimeType || undefined }
          : { garmentTemplateImageUrl: resolvedTemplateUrl }),
        ...(fabricBase64 
          ? { fabricImageBase64: fabricBase64, fabricMimeType: fabricMimeType || undefined }
          : { fabricImageUrl: fabricUrl }),
        options: {
          neckStyle: options?.neckStyle || 'keep',
          embroideryStyle: options?.embroideryStyle || 'keep',
          sleeveStyle: options?.sleeveStyle || 'keep',
          fabricScale: options?.fabricScale ?? 1,
          colorPreservation: options?.colorPreservation || 'high',
          applyMask: options?.applyMask ?? false,
          watermarkEnabled: options?.watermarkEnabled ?? true,
          model: options?.model ?? 'gemini-2.5-flash-image',
          generationStartTime,
          customPrompt: customPrompt || undefined,
        },
      };

      // Step 7: Call API
      setProgress(50);
      console.log('[TryOn] Calling API...', { templateId, templateUrl: templateUrl?.substring(0, 50) });

      try {
        const prompt = typeof customPrompt === 'string' ? customPrompt : '';
        const trimmed = prompt.trim();
        console.log('[TryOn] customPrompt (pre-API):', {
          hasPrompt: !!trimmed,
          length: trimmed.length,
          preview: trimmed ? trimmed.slice(0, 220) : '',
        });
      } catch {
        // ignore
      }
      
      // Save pending generation state before API call
      const tempJobId = `pending-${Date.now()}`;
      savePendingGeneration(tempJobId);
      
      const resp = await generateTryOn(payload);
      
      // Set generation end time after API response
      const generationEndTime = Date.now();
      payload.options.generationEndTime = generationEndTime;
      console.log('[TryOn] API response:', resp.status);
      
      // Update pending generation with actual jobId
      if (resp.jobId !== tempJobId) {
        savePendingGeneration(resp.jobId);
      }
      
      // Step 8: Show result
      setProgress(90);

      // Persist result even if user navigated away (allow background completion)
      if (resp.status === 'completed') {
        persistResultSnapshot(resp);
      }

      if (isMountedRef.current) {
        setResult(resp);
      }

      const completedUrl = resp.status === 'completed' ? (resp.resultImageUrl || (resp as any).resultImageDataUrl || null) : null;
      if (completedUrl) {
        setProgress(100);
        
        // Save to Firestore immediately (works even if component unmounts)
        try {
          const currentUser = firebaseService.auth?.currentUser;
          await firebaseService.saveTryOnJobResult({
            jobId: resp.jobId,
            userId: currentUser?.uid,
            resultImageUrl: completedUrl,
            resultThumbnailUrl: (resp as any)?.resultThumbnailUrl,
            templateId: templateId || undefined,
            fabricId: selectedFabricId || undefined,
          });
        } catch (e) {
          console.warn('[TryOn] Failed to save job to Firestore:', e);
        }
        
        // Call onGenerated even if unmounted so result gets saved to user's database
        onGenerated?.({ jobId: resp.jobId, resultImageUrl: completedUrl, resultThumbnailUrl: (resp as any)?.resultThumbnailUrl });
        
        if (isMountedRef.current) {
          setTimeout(() => setAnimateReveal(true), 300);
        }
      }
    } catch (e: any) {
      console.error('[TryOn] Error caught:', e);
      
      // Clear pending generation on error
      clearPendingGeneration();
      
      // Check if error is about AVIF
      const errorMsg = e?.message || 'Request failed';
      if (errorMsg.includes('avif') || errorMsg.includes('AVIF')) {
        showToast('❌ صيغة غير مدعومة', 'صيغة الصورة AVIF غير مدعومة. اختر WebP أو JPEG أو PNG', 'error');
        setResult({ 
          jobId: 'n/a', 
          status: 'failed', 
          error: 'صيغة الصورة AVIF غير مدعومة. يرجى اختيار قالب بصيغة WebP أو JPEG أو PNG' 
        });
      } else {
        showToast('خطأ في إنشاء الصورة', errorMsg, 'error');
        setResult({ jobId: 'n/a', status: 'failed', error: errorMsg });
      }
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
