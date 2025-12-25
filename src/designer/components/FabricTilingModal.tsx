import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';

type TilingSettings = {
  scale: number;
  rotationDeg: number;
  offsetX: number;
  offsetY: number;
};

export function FabricTilingModal(props: {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
  onApply: (tiledDataUrl: string) => void;
}) {
  const { isOpen, onClose, imageUrl, title = 'تكرار القماش (تجريبي)', onApply } = props;

  const [settings, setSettings] = useState<TilingSettings>({
    scale: 1,
    rotationDeg: 0,
    offsetX: 0,
    offsetY: 0,
  });

  const [canvasCssSize, setCanvasCssSize] = useState<{ w: number; h: number }>({ w: 440, h: 440 });
  const [exportError, setExportError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const isReady = !!imageUrl;

  const dpr = useMemo(() => {
    if (typeof window === 'undefined') return 1;
    return Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setExportError(null);
    setSettings({ scale: 1, rotationDeg: 0, offsetX: 0, offsetY: 0 });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!containerRef.current) return;

    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const cr = entry.contentRect;
      const w = Math.max(240, Math.floor(cr.width));
      const h = Math.max(240, Math.floor(cr.height));
      setCanvasCssSize({ w, h });
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!imageUrl) {
      imgRef.current = null;
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.src = imageUrl;

    const handleLoad = () => {
      imgRef.current = img;
      scheduleDraw();
    };

    const handleError = () => {
      imgRef.current = null;
      scheduleDraw();
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    // Attempt decode (best-effort)
    img.decode?.().then(handleLoad).catch(() => {
      // ignore; load/error events will handle
    });

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, imageUrl]);

  const scheduleDraw = () => {
    if (rafRef.current != null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      draw();
    });
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cssW = canvasCssSize.w;
    const cssH = canvasCssSize.h;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssW, cssH);

    const img = imgRef.current;
    if (!img || !img.naturalWidth || !img.naturalHeight) {
      // empty state
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, 0, cssW, cssH);
      ctx.fillStyle = '#64748b';
      ctx.font = '14px system-ui, -apple-system, Segoe UI, Roboto, Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('تعذر تحميل صورة القماش', cssW / 2, cssH / 2);
      return;
    }

    const tileW = Math.max(8, Math.round(img.naturalWidth * settings.scale));
    const tileH = Math.max(8, Math.round(img.naturalHeight * settings.scale));

    const tileCanvas = document.createElement('canvas');
    tileCanvas.width = tileW;
    tileCanvas.height = tileH;
    const tctx = tileCanvas.getContext('2d');
    if (!tctx) return;

    tctx.clearRect(0, 0, tileW, tileH);
    tctx.drawImage(img, 0, 0, tileW, tileH);

    const pattern = ctx.createPattern(tileCanvas, 'repeat');
    if (!pattern) return;

    ctx.save();
    // rotate around center
    ctx.translate(cssW / 2, cssH / 2);
    ctx.rotate((settings.rotationDeg * Math.PI) / 180);
    ctx.translate(-cssW / 2, -cssH / 2);

    // offset (pan)
    ctx.translate(settings.offsetX, settings.offsetY);

    ctx.fillStyle = pattern;
    ctx.fillRect(-settings.offsetX, -settings.offsetY, cssW, cssH);
    ctx.restore();
  };

  useEffect(() => {
    if (!isOpen) return;
    scheduleDraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, canvasCssSize.w, canvasCssSize.h, settings.scale, settings.rotationDeg, settings.offsetX, settings.offsetY]);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setExportError(null);
    try {
      const dataUrl = canvas.toDataURL('image/webp', 0.9);
      onApply(dataUrl);
    } catch (e) {
      setExportError(
        'تعذر تصدير/استخدام صورة القماش بسبب CORS (Firebase Storage). جرب قماش مرفوع من جهازك أو فعّل CORS للـ bucket باستخدام ملف firebase.storage.cors.json (انظر FIREBASE_STORAGE_FIX.md).'
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-3xl" debugId="FABRIC-TILING-MODAL">
      {!isReady ? (
        <div className="text-sm text-slate-600 dark:text-slate-300">اختر قماشاً أولاً لبدء التكرار.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
            <div ref={containerRef} className="w-full aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
              <canvas ref={canvasRef} className="w-full h-full block" />
            </div>
            {exportError ? (
              <div className="mt-2 text-[12px] text-red-600 dark:text-red-400">{exportError}</div>
            ) : (
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                ملاحظة: إذا كان القماش من مصدر يمنع CORS قد لا يعمل التصدير.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                <span>الحجم</span>
                <span className="text-slate-500 dark:text-slate-400">{settings.scale.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={4}
                step={0.05}
                value={settings.scale}
                onChange={(e) => setSettings((s) => ({ ...s, scale: Number(e.target.value) }))}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                <span>الدوران</span>
                <span className="text-slate-500 dark:text-slate-400">{Math.round(settings.rotationDeg)}°</span>
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={settings.rotationDeg}
                onChange={(e) => setSettings((s) => ({ ...s, rotationDeg: Number(e.target.value) }))}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                <span>إزاحة أفقية</span>
                <span className="text-slate-500 dark:text-slate-400">{Math.round(settings.offsetX)}px</span>
              </div>
              <input
                type="range"
                min={-240}
                max={240}
                step={2}
                value={settings.offsetX}
                onChange={(e) => setSettings((s) => ({ ...s, offsetX: Number(e.target.value) }))}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                <span>إزاحة عمودية</span>
                <span className="text-slate-500 dark:text-slate-400">{Math.round(settings.offsetY)}px</span>
              </div>
              <input
                type="range"
                min={-240}
                max={240}
                step={2}
                value={settings.offsetY}
                onChange={(e) => setSettings((s) => ({ ...s, offsetY: Number(e.target.value) }))}
                className="w-full"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSettings({ scale: 1, rotationDeg: 0, offsetX: 0, offsetY: 0 })}
                className="flex-1 text-xs justify-center"
              >
                إعادة ضبط
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
                className="flex-1 text-xs justify-center"
              >
                استخدام النتيجة
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
