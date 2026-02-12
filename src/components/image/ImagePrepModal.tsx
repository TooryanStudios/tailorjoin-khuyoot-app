import React from 'react';
import { useTranslation } from 'react-i18next';
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
  convertToPixelCrop,
} from 'react-image-crop';
import { Check, ImagePlus, Settings, X } from 'lucide-react';

import { Modal } from '../../../components/Modal';
import { exportCroppedImage } from '../../utils/image/exportCroppedImage';
import { usePrivacyShield } from '../../modules/PrivacyShield';
import { traceStep } from '../../utils/trace';

function getCenteredAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  const base = makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight);
  return centerCrop(base, mediaWidth, mediaHeight);
}

export type ImagePrepModalProps = {
  isOpen: boolean;
  file: File | null;
  onCancel: () => void;
  onReplaceFile?: (file: File) => void;
  onApply: (
    processed: File,
    meta?: {
      privacyApplied?: boolean;
      fabricMaterial?: 'silk' | 'cotton' | 'transparent' | 'velvet' | 'linen' | 'wool' | null;
    }
  ) => void | Promise<void>;
  mode?: 'template' | 'fabric'; // template = show privacy controls, fabric = hide privacy controls
  fabricMaterial?: 'silk' | 'cotton' | 'transparent' | 'velvet' | 'linen' | 'wool' | null;
  onFabricMaterialChange?: (next: 'silk' | 'cotton' | 'transparent' | 'velvet' | 'linen' | 'wool' | null) => void;
  theme?: 'default' | 'designer';
};

export function ImagePrepModal(props: ImagePrepModalProps) {
  const { t, i18n } = useTranslation('designer');
  const {
    isOpen,
    file,
    onCancel,
    onApply,
    onReplaceFile,
    mode = 'template',
    fabricMaterial: fabricMaterialValue,
    onFabricMaterialChange,
    theme = 'default',
  } = props;
  const isTemplateMode = mode === 'template';
  const isDesignerTheme = theme === 'designer';

  const rebrowseInputRef = React.useRef<HTMLInputElement | null>(null);

  const [imgSrc, setImgSrc] = React.useState<string | null>(null);
  const originalImgUrlRef = React.useRef<string | null>(null);
  const maskedImgUrlRef = React.useRef<string | null>(null);
  const isOpenRef = React.useRef(isOpen);
  isOpenRef.current = isOpen;
  const unmountedRef = React.useRef(false);
  React.useEffect(() => () => {
    unmountedRef.current = true;
  }, []);
  const imgRef = React.useRef<HTMLImageElement | null>(null);

  const [crop, setCrop] = React.useState<Crop>();
  const [completedCrop, setCompletedCrop] = React.useState<PixelCrop | null>(null);

  const lastFileSigRef = React.useRef<string>('');

  const getCropPx = React.useCallback(() => {
    const image = imgRef.current;
    if (!image || !crop) return null;

    const pixelCrop = convertToPixelCrop(crop, image.width, image.height);
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    return {
      x: pixelCrop.x * scaleX,
      y: pixelCrop.y * scaleY,
      width: pixelCrop.width * scaleX,
      height: pixelCrop.height * scaleY,
    };
  }, [crop]);

  const [isApplying, setIsApplying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [progressText, setProgressText] = React.useState<string | null>(null);

  const [isMaskingForDisplay, setIsMaskingForDisplay] = React.useState(false);
  const maskJobIdRef = React.useRef(0);
  const [showAdvancedSettings, setShowAdvancedSettings] = React.useState(false);
  const [isDraggingCrop, setIsDraggingCrop] = React.useState(false);
  const [maskRequestNonce, setMaskRequestNonce] = React.useState(0);
  const [imageLoadNonce, setImageLoadNonce] = React.useState(0);
  const [fabricMaterial, setFabricMaterial] = React.useState<
    'silk' | 'cotton' | 'transparent' | 'velvet' | 'linen' | 'wool' | null
  >(fabricMaterialValue ?? null);

  React.useEffect(() => {
    if (isTemplateMode) return;
    if (fabricMaterialValue === undefined) return;
    setFabricMaterial(fabricMaterialValue ?? null);
  }, [fabricMaterialValue, isTemplateMode]);

  const requestMaskRefresh = React.useCallback(() => {
    // Cancel any in-flight masking job so we don't swap the image mid-interaction.
    maskJobIdRef.current += 1;
    setIsMaskingForDisplay(false);
    setProgressText(null);
    maskedImgUrlRef.current = null;
    setMaskRequestNonce((n) => n + 1);
  }, []);

  // Ensure we never mount with a stale (revoked) blob: src.
  React.useEffect(() => {
    if (isOpen) return;
    setImgSrc(null);
    originalImgUrlRef.current = null;
    maskedImgUrlRef.current = null;
    imgRef.current = null;
    setCrop(undefined);
    setCompletedCrop(null);
    setError(null);
    setProgressText(null);
    setIsApplying(false);

    setIsMaskingForDisplay(false);
    maskJobIdRef.current += 1;
  }, [isOpen]);

  // Privacy Shield hooks
  const { 
    isPrivacyMode, 
    setPrivacyMode, 
    maskingStyle, 
    setMaskingStyle, 
    blurStrength, 
    setBlurStrength,
    selectedEmoji,
    setSelectedEmoji,
    processImage: processWithPrivacyShield,
    isProcessingPrivacy,
    detectorError,
  } = usePrivacyShield();

  const applyMaskToDisplayedImage = React.useCallback(async () => {
    if (!file) return;
    const jobId = ++maskJobIdRef.current;
    const imgEl = imgRef.current;

    setIsMaskingForDisplay(true);
    setError(null);
    setProgressText(t('imagePrepProgressHideFace'));

    traceStep('Privacy mask (display) START', {
      maskingStyle,
      blurStrength,
      selectedEmoji,
    });

    try {
      if (detectorError) {
        setError(t('imagePrepErrorDetector'));
        return;
      }
      const focusRectRaw = getCropPx();
      const focusRect = (() => {
        if (!focusRectRaw || !imgEl) return null;

        const naturalWidth = imgEl.naturalWidth || imgEl.width;
        const naturalHeight = imgEl.naturalHeight || imgEl.height;
        if (!naturalWidth || !naturalHeight) return null;

        const padded = {
          x: Math.max(0, focusRectRaw.x - focusRectRaw.width * 0.25),
          y: Math.max(0, focusRectRaw.y - focusRectRaw.height * 0.25),
          width: focusRectRaw.width * 1.5,
          height: focusRectRaw.height * 1.5,
        };

        const x = Math.min(Math.max(0, padded.x), naturalWidth);
        const y = Math.min(Math.max(0, padded.y), naturalHeight);
        const width = Math.max(1, Math.min(padded.width, naturalWidth - x));
        const height = Math.max(1, Math.min(padded.height, naturalHeight - y));
        return { x, y, width, height };
      })();

      // First try focused detection near the crop, then fall back to full image.
      let maskedFile = await processWithPrivacyShield(file, focusRect ? { focusRect } : undefined);
      if (maskedFile === file) {
        maskedFile = await processWithPrivacyShield(file);
      }
      if (maskedFile === file) {
        setError(t('imagePrepErrorNoFace'));
        return;
      }

      if (unmountedRef.current || !isOpenRef.current || jobId !== maskJobIdRef.current) return;

      const nextUrl = URL.createObjectURL(maskedFile);
      const prevMaskedUrl = maskedImgUrlRef.current;
      maskedImgUrlRef.current = nextUrl;
      setImgSrc(nextUrl);

      if (prevMaskedUrl && prevMaskedUrl !== nextUrl) {
        try {
          URL.revokeObjectURL(prevMaskedUrl);
        } catch {
          // ignore
        }
      }

      traceStep('Privacy mask (display) DONE', { size: maskedFile.size, type: maskedFile.type });
    } catch (e: any) {
      if (unmountedRef.current || !isOpenRef.current || jobId !== maskJobIdRef.current) return;
      setError(e?.message || t('imagePrepErrorHideFace'));
      traceStep('Privacy mask (display) ERROR', { message: String(e?.message || e) });
    } finally {
      if (!unmountedRef.current && isOpenRef.current && jobId === maskJobIdRef.current) {
        setIsMaskingForDisplay(false);
        setProgressText(null);
      }
    }
  }, [blurStrength, detectorError, file, getCropPx, maskingStyle, processWithPrivacyShield, selectedEmoji]);

  // Load file into object URL
  React.useEffect(() => {
    if (!isOpen) return;
    if (!file) {
      setImgSrc(null);
      originalImgUrlRef.current = null;
      return;
    }

    traceStep('ImagePrepModal OPEN', { name: file.name, size: file.size, type: file.type });

    // Delay revokes a bit in dev to avoid StrictMode blob URL noise.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const revokeDelayMs = (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV) ? 2500 : 0;

    const url = URL.createObjectURL(file);
    const prevOriginal = originalImgUrlRef.current;
    const prevMasked = maskedImgUrlRef.current;

    originalImgUrlRef.current = url;
    maskedImgUrlRef.current = null;
    setImgSrc(url);
    setError(null);

    // Invalidate any in-flight masking job.
    maskJobIdRef.current += 1;
    setIsMaskingForDisplay(false);
    setProgressText(null);

    if (prevMasked) {
      setTimeout(() => {
        try {
          URL.revokeObjectURL(prevMasked);
        } catch {
          // ignore
        }
      }, revokeDelayMs);
    }

    if (prevOriginal && prevOriginal !== url) {
      setTimeout(() => {
        try {
          URL.revokeObjectURL(prevOriginal);
        } catch {
          // ignore
        }
      }, revokeDelayMs);
    }

    return () => {
      setTimeout(() => {
        const shouldRevoke = unmountedRef.current || !isOpenRef.current || originalImgUrlRef.current !== url;
        if (!shouldRevoke) return;
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
        if (originalImgUrlRef.current === url) originalImgUrlRef.current = null;
      }, revokeDelayMs);
    };
  }, [file, isOpen]);

  // Reset state when opening
  React.useEffect(() => {
    if (!isOpen) return;
    setIsApplying(false);
    setCompletedCrop(null);
    // Privacy ON by default for templates, OFF for fabrics
    setPrivacyMode(isTemplateMode);
    setShowAdvancedSettings(false);
    if (!isTemplateMode) {
      setFabricMaterial(fabricMaterialValue ?? null);
    }
    if (isTemplateMode) {
      requestMaskRefresh();
    }
  }, [fabricMaterialValue, isOpen, isTemplateMode, requestMaskRefresh, setPrivacyMode]);

  // If privacy is enabled, apply mask once to the displayed image.
  // This is intentionally NOT "live" while dragging; it only runs on toggle or initial open.
  // Skip entirely for fabric mode.
  React.useEffect(() => {
    if (!isTemplateMode) return; // Skip for fabric mode
    if (!isOpen) return;
    if (!file) return;
    if (!isPrivacyMode) return;
    if (maskedImgUrlRef.current) return;
    if (!imgRef.current) return;
    if (isDraggingCrop) return;

    void applyMaskToDisplayedImage();
  }, [applyMaskToDisplayedImage, crop, file, imageLoadNonce, isDraggingCrop, isOpen, isPrivacyMode, isTemplateMode, maskRequestNonce]);

  // Refresh mask when privacy settings change
  React.useEffect(() => {
    if (!isTemplateMode) return; // Skip for fabric mode
    if (!isOpen) return;
    if (!file) return;
    if (!isPrivacyMode) return;
    requestMaskRefresh();
  }, [blurStrength, file, isOpen, isPrivacyMode, isTemplateMode, maskingStyle, requestMaskRefresh, selectedEmoji]);

  const onImageLoad = React.useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    imgRef.current = img;
    setImageLoadNonce((n) => n + 1);

    traceStep('ImagePrepModal IMAGE_LOADED', {
      w: img.naturalWidth,
      h: img.naturalHeight,
    });

    // Initialize crop when a NEW file is loaded, or if crop is missing.
    const sig = file ? `${file.name}:${file.size}:${file.lastModified}` : '';
    if (sig && (lastFileSigRef.current !== sig || !crop)) {
      lastFileSigRef.current = sig;
      const baseWidth = img.naturalWidth || img.width;
      const baseHeight = img.naturalHeight || img.height;
      const defaultAspect = isTemplateMode ? 9 / 16 : 1;
      const initialCrop = getCenteredAspectCrop(baseWidth, baseHeight, defaultAspect);
      setCrop(initialCrop);
      setCompletedCrop(convertToPixelCrop(initialCrop, baseWidth, baseHeight));
      if (isPrivacyMode) {
        requestMaskRefresh();
      }
      return;
    }

    // Otherwise (e.g., toggling masked/original src), keep existing crop.
  }, [crop, file, isPrivacyMode, isTemplateMode, requestMaskRefresh]);

  React.useEffect(() => {
    if (!isOpen) return;
    if (!file) return;
    if (crop) return;
    const img = imgRef.current;
    if (!img) return;
    const baseWidth = img.naturalWidth || img.width;
    const baseHeight = img.naturalHeight || img.height;
    if (!baseWidth || !baseHeight) return;
    const defaultAspect = isTemplateMode ? 9 / 16 : 1;
    const initialCrop = getCenteredAspectCrop(baseWidth, baseHeight, defaultAspect);
    setCrop(initialCrop);
    setCompletedCrop(convertToPixelCrop(initialCrop, baseWidth, baseHeight));
  }, [crop, file, imgSrc, isOpen, isTemplateMode]);

  const handleApply = async () => {
    setError(null);

    const image = imgRef.current;
    if (!image || !file || !crop) {
      setError('Select an image first');
      return;
    }

    try {
      setIsApplying(true);
      setProgressText(isPrivacyMode ? t('imagePrepProgressHideFace') : t('imagePrepProgressPreparing'));

      traceStep('ImagePrepModal SUBMIT', {
        privacyMode: Boolean(isPrivacyMode),
        maskingStyle,
        blurStrength,
        selectedEmoji,
      });

      // Convert crop into pixel crop in the rendered image coordinate space
      const pixelCrop = convertToPixelCrop(crop, image.width, image.height);

      // Translate to natural pixels using scale factors
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const cropPx = {
        x: pixelCrop.x * scaleX,
        y: pixelCrop.y * scaleY,
        width: pixelCrop.width * scaleX,
        height: pixelCrop.height * scaleY,
      };

      traceStep('Crop export START');
      let processedFile = await exportCroppedImage({
        image,
        cropPx,
        fileName: file.name,
        outputMime: 'image/jpeg',
        outputQuality: 0.92,
        maxSide: 1536,
        hideFaceEnabled: false,
        hideMode: 'blur',
        stickerShape: 'circle',
        blurPx: 14,
        faceBoxPct: null,
      });
      traceStep('Crop export DONE', { size: processedFile.size, type: processedFile.type });

      // If privacy is enabled, apply real local face masking before continuing.
      const privacyApplied = Boolean(isPrivacyMode);
      const selectedFabricMaterial = isTemplateMode ? null : fabricMaterial;

      // No second privacy pass here: privacy (if enabled) is applied to the displayed image
      // before cropping. So cropping already includes the mask.

      setProgressText(t('imagePrepProgressUpdatingPreview'));
      traceStep('Parent onApply START', { privacyApplied });
      await onApply(processedFile, { privacyApplied, fabricMaterial: selectedFabricMaterial });
      traceStep('Parent onApply DONE');
    } catch (e: any) {
      setError(e?.message || t('imagePrepErrorProcess'));
      traceStep('ImagePrepModal ERROR', { message: String(e?.message || e) });
    } finally {
      setIsApplying(false);
      setProgressText(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (isApplying) return;
        onCancel();
      }}
      title={t('imagePrepTitle')}
      maxWidth="max-w-[540px]"
      containerClassName={`rounded-xl mx-auto max-h-[85vh] ${isDesignerTheme ? 'bg-white border-slate-200 text-black' : ''}`}
      headerClassName={isDesignerTheme ? 'border-slate-200 bg-white/95 py-2' : 'py-2'}
      titleClassName={isDesignerTheme ? 'text-black text-sm font-["Tajawal"]' : 'text-base'}
      contentClassName={isDesignerTheme ? 'bg-white text-black' : undefined}
      footerClassName={isDesignerTheme ? 'border-slate-200 bg-white' : undefined}
      closeButtonClassName={isDesignerTheme ? 'hidden' : undefined}
      showFooter={false}
      debugId="IMAGE-PREP"
      footer={
        <div className={`flex items-center justify-between gap-2 ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
          {/* Left side: Privacy controls (template mode only) */}
          {isTemplateMode ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const next = !isPrivacyMode;
                  setPrivacyMode(next);
                  if (next) {
                    const originalUrl = originalImgUrlRef.current;
                    if (originalUrl) setImgSrc(originalUrl);
                    requestMaskRefresh();
                  } else {
                    maskJobIdRef.current += 1;
                    setIsMaskingForDisplay(false);
                    setProgressText(null);
                    const originalUrl = originalImgUrlRef.current;
                    if (originalUrl) setImgSrc(originalUrl);
                    setShowAdvancedSettings(false);
                  }
                }}
                disabled={isApplying || isMaskingForDisplay}
                className={`h-11 w-11 rounded-lg transition-all border flex items-center justify-center ${
                  isPrivacyMode
                    ? 'bg-[var(--theme-primary)] border-[var(--theme-primary)] text-white shadow-sm'
                    : isDesignerTheme
                      ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                } ${isApplying || isMaskingForDisplay ? 'opacity-60 cursor-not-allowed' : 'active:scale-[0.98]'}`}
                title={isPrivacyMode ? t('imagePrepDisableFaceHide') : t('imagePrepEnableFaceHide')}
                aria-pressed={isPrivacyMode}
              >
                <span className={`text-lg ${isPrivacyMode ? '' : 'opacity-90'}`}>🎭</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                disabled={!isPrivacyMode || isApplying || isMaskingForDisplay}
                className={`h-11 w-11 rounded-lg transition-all flex items-center justify-center ${
                  !isPrivacyMode || isApplying || isMaskingForDisplay
                    ? isDesignerTheme
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    : showAdvancedSettings
                      ? isDesignerTheme
                        ? 'bg-slate-200 text-slate-900 border border-slate-300'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      : isDesignerTheme
                        ? 'text-slate-600 hover:bg-slate-100 border border-slate-300'
                        : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={isPrivacyMode ? t('imagePrepAdvancedSettings') : t('imagePrepEnableFaceHideToShow')}
              >
                <Settings size={18} />
              </button>
            </div>
          ) : <div />}
          
          {/* Right side: Action buttons */}
          <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-11 w-11 rounded-lg bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-dark)] text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow active:scale-[0.98] flex items-center justify-center"
            disabled={isApplying}
            onClick={() => void handleApply()}
            title={isApplying ? t('imagePrepProcessing') : t('imagePrepApply')}
            aria-label={isApplying ? t('imagePrepProcessing') : t('imagePrepApply')}
          >
            <Check size={16} />
          </button>
          <button
            type="button"
            className="h-11 w-11 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center"
            disabled={isApplying || !onReplaceFile}
            onClick={() => rebrowseInputRef.current?.click()}
            title={!onReplaceFile ? t('imagePrepNotAvailableHere') : t('imagePrepChooseOther')}
            aria-label={!onReplaceFile ? t('imagePrepNotAvailableHere') : t('imagePrepChooseOther')}
          >
            <ImagePlus size={16} />
          </button>
          <button
            type="button"
            className="h-11 w-11 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center"
            disabled={isApplying}
            onClick={onCancel}
            title={t('imagePrepCancel')}
            aria-label={t('imagePrepCancel')}
          >
            <X size={16} />
          </button>
          </div>
        </div>
      }
    >
      <input
        ref={rebrowseInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const nextFile = e.currentTarget.files?.[0];
          e.currentTarget.value = '';
          if (!nextFile) return;
          onReplaceFile?.(nextFile);
        }}
      />

      {!file ? (
        <div className={`text-sm ${isDesignerTheme ? 'text-zinc-400' : 'text-slate-600 dark:text-slate-300'}`}>{t('imagePrepSelectImageFirst')}</div>
      ) : !imgSrc ? (
        <div className="flex items-center justify-center py-8">
          <div className={`h-8 w-8 rounded-full border-2 ${isDesignerTheme ? 'border-zinc-600' : 'border-slate-300 dark:border-slate-600'} border-t-transparent animate-spin`} />
        </div>
      ) : (
        <div className="relative flex flex-col">
          <style>{`
            .image-prep-crop-wrapper {
              touch-action: pan-y;
            }
            .react-crop-compact {
              height: 100%;
              max-width: 100%;
            }
            .react-crop-compact .ReactCrop__child-wrapper {
              height: 100%;
              max-width: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .react-crop-compact img {
              height: 100%;
              width: auto;
              max-width: 100%;
              display: block;
              margin-left: auto;
              margin-right: auto;
              object-fit: contain;
            }
            .react-crop-compact .ReactCrop__drag-handle {
              width: 12px;
              height: 12px;
              border: 2px solid #fff;
              box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3);
            }
            .react-crop-compact .ReactCrop__crop-selection {
              box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.9), 0 0 0 2px rgba(0, 0, 0, 0.25);
            }
          `}</style>
          
          {/* Crop Section - Compact */}
          <div className="image-prep-crop-wrapper mb-2">
            <div
              className={`h-[50vh] sm:h-[48vh] rounded-lg border p-2 overflow-visible flex items-center justify-center ${
                isDesignerTheme
                  ? 'border-zinc-700 bg-zinc-950/60'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50'
              }`}
              dir="ltr"
            >
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                onDragStart={() => {
                  // Cancel any in-flight masking while the user is dragging.
                  maskJobIdRef.current += 1;
                  setIsMaskingForDisplay(false);
                  setProgressText(null);
                  setIsDraggingCrop(true);
                }}
                onDragEnd={() => {
                  setIsDraggingCrop(false);
                  if (isPrivacyMode) {
                    requestMaskRefresh();
                  }
                }}
                keepSelection
                // NOTE: `disabled` hides resize handles in react-image-crop.
                // We keep it interactive so users can resize/drag the selection.
                className="react-crop-compact overflow-visible"
              >
                <img
                  src={imgSrc}
                  alt="To crop"
                  onLoad={onImageLoad}
                  className="h-full w-auto max-w-full"
                />
              </ReactCrop>
            </div>
          </div>

          {!isTemplateMode && (
            <div className={`mb-2 rounded-lg border px-3 py-2.5 ${
              isDesignerTheme
                ? 'border-slate-300 bg-slate-100'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
            }`}>
              <div className={`text-[10px] font-semibold uppercase tracking-wide mb-2 ${
                isDesignerTheme ? 'text-slate-700' : 'text-slate-500 dark:text-slate-400'
              }`}>
                {t('imagePrepFabricType')}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { id: null, label: t('imagePrepMaterialNone'), icon: '➖' },
                  { id: 'transparent', label: t('imagePrepMaterialTransparent'), icon: '🫧' },
                  { id: 'silk', label: t('imagePrepMaterialSilk'), icon: '🧵' },
                  { id: 'cotton', label: t('imagePrepMaterialCotton'), icon: '☁️' },
                  { id: 'linen', label: t('imagePrepMaterialLinen'), icon: '🌾' },
                  { id: 'velvet', label: t('imagePrepMaterialVelvet'), icon: '✨' },
                  { id: 'wool', label: t('imagePrepMaterialWool'), icon: '🧶' },
                ].map((material) => {
                  const isActive = fabricMaterial === material.id;
                  return (
                    <button
                      key={material.label}
                      type="button"
                      onClick={() => {
                        const nextValue = material.id as typeof fabricMaterial;
                        setFabricMaterial(nextValue);
                        onFabricMaterialChange?.(nextValue ?? null);
                      }}
                      className={`flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-[11px] transition-all ${
                        isActive
                          ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/15 text-[var(--theme-primary)] font-semibold'
                          : isDesignerTheme
                            ? 'border-slate-300 text-slate-700 hover:bg-slate-200 hover:border-slate-400'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                      title={material.label}
                    >
                      <span className="text-sm">{material.icon}</span>
                      <span className="truncate">{material.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Advanced Privacy Settings - Collapsible & Compact */}
          {isPrivacyMode && showAdvancedSettings && (
            <div className={`mb-2 rounded-lg border overflow-hidden ${
              isDesignerTheme
                ? 'border-zinc-700'
                : 'border-slate-200 dark:border-slate-700'
            }`}>

              <div className={`px-3 py-2.5 space-y-2.5 ${
                isDesignerTheme ? 'bg-zinc-900/50' : 'bg-white dark:bg-slate-900'
              }`}>
                {/* Masking Style - Compact Icons */}
                <div>
                  <label className={`text-[10px] font-semibold uppercase tracking-wide mb-1.5 block ${
                    isDesignerTheme ? 'text-zinc-400' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {t('imagePrepMaskStyleLabel')}
                  </label>
                  <div className="flex gap-1.5">
                    {[
                      { value: 'feathered-blur' as const, icon: '🎭', label: t('imagePrepMaskStyleBlur') },
                      { value: 'pixelate' as const, icon: '🔲', label: t('imagePrepMaskStylePixel') },
                      { value: 'emoji' as const, icon: '😊', label: t('imagePrepMaskStyleEmoji') },
                    ].map((style) => (
                      <button
                        key={style.value}
                        type="button"
                        onClick={() => setMaskingStyle(style.value)}
                        className={`flex-1 py-1.5 px-2 rounded-md border text-center transition-all ${
                          maskingStyle === style.value
                            ? 'bg-purple-500/15 border-purple-500/60 shadow-sm'
                            : isDesignerTheme
                              ? 'bg-zinc-900 border-zinc-700'
                              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="text-base leading-none mb-0.5">{style.icon}</div>
                        <div className={`text-[9px] font-medium ${
                          isDesignerTheme ? 'text-zinc-400' : 'text-slate-600 dark:text-slate-400'
                        }`}>{style.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Blur Strength - Compact */}
                {maskingStyle === 'feathered-blur' && (
                  <div>
                    <label className={`text-[10px] font-semibold uppercase tracking-wide mb-1 flex items-center justify-between ${
                      isDesignerTheme ? 'text-zinc-400' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      <span>{t('imagePrepStrength')}</span>
                      <span className="text-xs text-purple-600 dark:text-purple-400 font-bold">{blurStrength}px</span>
                    </label>
                    <input
                      type="range"
                      min={6}
                      max={40}
                      value={blurStrength}
                      onChange={(e) => setBlurStrength(Number(e.target.value))}
                      className="w-full h-1.5 accent-purple-500"
                    />
                  </div>
                )}

                {/* Emoji Selection - Compact Grid */}
                {maskingStyle === 'emoji' && (
                  <div>
                    <label className={`text-[10px] font-semibold uppercase tracking-wide mb-1.5 block ${
                      isDesignerTheme ? 'text-zinc-400' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {t('imagePrepChooseEmoji')}
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {['😊', '😎', '🤐', '😴', '👽', '🤖', '😺', '🐵'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setSelectedEmoji(emoji)}
                          className={`aspect-square py-1.5 rounded-md border text-xl transition-all ${
                            selectedEmoji === emoji
                              ? 'bg-purple-500/15 border-purple-500/60 shadow-sm scale-105'
                              : isDesignerTheme
                                ? 'bg-zinc-900 border-zinc-700 hover:scale-105'
                                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:scale-105'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className={`mb-2 px-3 py-2 rounded-lg text-xs ${
              isDesignerTheme
                ? 'bg-red-950/40 border border-red-800 text-red-300'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}>
              {error}
            </div>
          )}

          {/* Processing Overlay - Compact */}
          {isApplying && progressText && (
            <div className="absolute inset-0 z-20 rounded-lg">
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm rounded-lg" aria-hidden />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="h-8 w-8 rounded-full border-2 border-white/80 border-t-transparent animate-spin" />
                <div className="px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium shadow-lg">
                  {progressText}
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </Modal>
  );
}
