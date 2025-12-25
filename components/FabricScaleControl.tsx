import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Maximize2, Minimize2, RotateCw, Sparkles, RotateCcw } from 'lucide-react';
import { FabricPatternSettings } from '../types';
import { calculateAutoScale } from '../services/recommendationService';

const clampPatternScale = (value: number | undefined): number => {
  if (!Number.isFinite(value)) return 1;
  const min = 0.25;
  const max = 1.2;
  return Math.min(max, Math.max(min, value as number));
};

export interface FabricScaleApplyPayload {
  settings: FabricPatternSettings;
  previewDataUrl: string | null;
}

interface FabricScaleControlProps {
  imageUrl: string;
  imageWidth?: number;
  imageHeight?: number;
  settings: FabricPatternSettings;
  onSettingsChange: (settings: FabricPatternSettings) => void;
  onPreview?: (settings: FabricPatternSettings) => void;
  onApply?: (payload: FabricScaleApplyPayload) => void;
  onCancel?: () => void;
}

export const FabricScaleControl: React.FC<FabricScaleControlProps> = ({
  imageUrl,
  imageWidth = 800,
  imageHeight = 600,
  settings,
  onSettingsChange,
  onPreview,
  onApply,
  onCancel
}) => {
  const [localSettings, setLocalSettings] = useState<FabricPatternSettings>(() => ({
    ...settings,
    patternScale: clampPatternScale(settings.patternScale),
  }));
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const drawPreviewRef = useRef<() => void>(() => {});
  const [previewReady, setPreviewReady] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    setLocalSettings({
      ...settings,
      patternScale: clampPatternScale(settings.patternScale),
    });
  }, [settings]);

  const applySettings = useCallback(
    (updates: Partial<FabricPatternSettings>) => {
      setLocalSettings((prev) => {
        const next: FabricPatternSettings = { ...prev, ...updates };

        if (updates.patternScale !== undefined) {
          next.patternScale = clampPatternScale(updates.patternScale);
        }

        onSettingsChange(next);
        onPreview?.(next);
        return next;
      });
    },
    [onSettingsChange, onPreview]
  );

  const drawPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const containerWidth = canvas.parentElement?.clientWidth ?? 260;
    const cssSize = Math.max(200, containerWidth);
    const dpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1;

    canvas.width = Math.floor(cssSize * dpr);
    canvas.height = Math.floor(cssSize * dpr);
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssSize, cssSize);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, cssSize, cssSize);

    const img = imageRef.current;
    if (!img || !img.naturalWidth || !img.naturalHeight) {
      return;
    }

    const clampedScale = clampPatternScale(localSettings.patternScale);
    const fitScale = Math.min(cssSize / img.naturalWidth, cssSize / img.naturalHeight);
    const effectiveScale = fitScale * clampedScale;
    const tileWidth = Math.max(8, Math.round(img.naturalWidth * effectiveScale));
    const tileHeight = Math.max(8, Math.round(img.naturalHeight * effectiveScale));
    const tileCanvas = document.createElement('canvas');
    tileCanvas.width = tileWidth;
    tileCanvas.height = tileHeight;
    const tileCtx = tileCanvas.getContext('2d');
    if (!tileCtx) return;
    tileCtx.clearRect(0, 0, tileWidth, tileHeight);
    tileCtx.drawImage(img, 0, 0, tileWidth, tileHeight);

    const repeatMode = localSettings.patternRepeatMode === 'no-repeat' ? 'no-repeat' : 'repeat';
    const pattern = ctx.createPattern(tileCanvas, repeatMode);
    if (!pattern) return;

    const rotation = ((localSettings.patternRotation || 0) * Math.PI) / 180;
    const offsetX = localSettings.patternOffsetX || 0;
    const offsetY = localSettings.patternOffsetY || 0;

    ctx.save();
    ctx.translate(cssSize / 2, cssSize / 2);
    ctx.rotate(rotation);
    ctx.translate(-cssSize / 2, -cssSize / 2);
    ctx.translate(offsetX, offsetY);
    ctx.fillStyle = pattern;
    ctx.fillRect(-offsetX, -offsetY, cssSize, cssSize);
    ctx.restore();
  }, [localSettings]);

  drawPreviewRef.current = drawPreview;

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  useEffect(() => {
    const handleResize = () => drawPreviewRef.current();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setPreviewReady(false);
    setPreviewError(null);
    if (!imageUrl) {
      imageRef.current = null;
      drawPreviewRef.current();
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.src = imageUrl;

    const handleLoad = () => {
      imageRef.current = img;
      setPreviewReady(true);
      drawPreviewRef.current();
    };

    const handleError = () => {
      imageRef.current = null;
      setPreviewReady(false);
      setPreviewError('تعذر تحميل صورة المعاينة');
      drawPreviewRef.current();
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    img.decode?.().catch(() => {
      // Ignore decode errors; load event will handle fallback.
    });

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [imageUrl]);

  const handleScaleChange = (value: number) => {
    applySettings({ patternScale: value });
  };

  const handleRotationChange = (value: number) => {
    applySettings({ patternRotation: value });
  };

  const handleAutoScale = () => {
    const suggestedScale = clampPatternScale(calculateAutoScale(imageWidth, imageHeight));
    applySettings({ patternScale: suggestedScale });
  };

  const resetSettings = () => {
    applySettings({
      patternScale: 1.0,
      patternOffsetX: 0,
      patternOffsetY: 0,
      patternRotation: 0,
      patternRepeatMode: 'repeat'
    });
  };

  const resetScale = () => handleScaleChange(1);
  const resetRotation = () => handleRotationChange(0);

  const getPreviewDataUrl = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return null;
    try {
      return canvas.toDataURL('image/png');
    } catch {
      return null;
    }
  }, []);

  const handleApplyClick = () => {
    if (onApply) {
      const payloadSettings: FabricPatternSettings = { ...localSettings };
      onApply({
        settings: payloadSettings,
        previewDataUrl: getPreviewDataUrl(),
      });
    } else {
      onSettingsChange(localSettings);
    }
  };

  const handleCancelClick = () => {
    setLocalSettings({
      ...settings,
      patternScale: clampPatternScale(settings.patternScale),
    });
    onCancel?.();
  };

  const showActionButtons = Boolean(onApply || onCancel);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 sm:p-4 space-y-4 text-[13px]">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          <span>معاينة فورية</span>
          <span className={previewReady ? 'text-emerald-500' : 'text-slate-400'}>
            {previewReady ? 'جاهزة' : '...'}
          </span>
        </div>
        <div className="relative aspect-[4/3] w-[80%] min-w-[200px] mx-auto rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-900">
          <canvas ref={previewCanvasRef} className="w-full h-full" aria-label="معاينة تكرار القماش" />
          {!previewReady && !previewError && (
            <div className="absolute inset-0 flex items-center justify-center text-[11px] text-slate-500">
              جاري التحميل...
            </div>
          )}
          {previewError && (
            <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-[11px] text-red-500 bg-white/80 dark:bg-slate-900/80">
              {previewError}
            </div>
          )}
        </div>
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 dark:border-amber-400/30 dark:bg-amber-500/10 p-2 text-[11px] text-amber-700 dark:text-amber-300">
          <span aria-hidden="true">⚠️</span>
          <p className="leading-relaxed">
            هذه المعاينة توضح طريقة تكرار القماش لكنها لا تضمن تطابق المقاس الفعلي أثناء التنفيذ.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm font-semibold text-slate-800 dark:text-white">
          <span className="flex items-center gap-1">
            <Maximize2 size={16} />
            ضبط المقياس
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetScale}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 transition-colors"
              title="إعادة ضبط المقياس"
              aria-label="إعادة ضبط المقياس"
            >
              <RotateCcw size={13} />
            </button>
            <span className="font-mono text-xs">
              {(localSettings.patternScale * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Minimize2 size={14} className="text-slate-400" />
            <input
              type="range"
              min="25"
              max="120"
              step="5"
              value={localSettings.patternScale * 100}
              onChange={(e) => handleScaleChange(parseInt(e.target.value) / 100)}
              className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:rounded-full"
            />
            <Maximize2 size={14} className="text-slate-400" />
          </div>
          <div className="flex flex-wrap gap-1">
            {[25, 50, 75, 100, 120].map((preset) => (
              <button
                key={preset}
                onClick={() => handleScaleChange(preset / 100)}
                className={`px-2 py-1 rounded-md text-[11px] border transition-colors ${
                  Math.abs(localSettings.patternScale * 100 - preset) < 1
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {preset}%
              </button>)
            )}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-800 dark:text-white">
            <span className="flex items-center gap-1">
              <RotateCw size={14} />
              الدوران
            </span>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300">
              <button
                type="button"
                onClick={resetRotation}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 transition-colors"
                title="إعادة ضبط الدوران"
                aria-label="إعادة ضبط الدوران"
              >
                <RotateCcw size={12} />
              </button>
              <span className="font-mono text-xs">{localSettings.patternRotation || 0}°</span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            step="15"
            value={localSettings.patternRotation || 0}
            onChange={(e) => handleRotationChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-green-600 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleAutoScale}
            className="flex-1 min-w-[120px] flex items-center justify-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <Sparkles size={14} />
            تلقائي
          </button>
          <button
            onClick={resetSettings}
            className="flex-1 min-w-[120px] rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            إعادة ضبط
          </button>
        </div>
      </div>
      {showActionButtons && (
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
          {onCancel && (
            <button
              type="button"
              onClick={handleCancelClick}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              إلغاء
            </button>
          )}
          {onApply && (
            <button
              type="button"
              onClick={handleApplyClick}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90"
            >
              تطبيق
            </button>
          )}
        </div>
      )}
    </div>
  );
};
