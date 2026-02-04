import React, { useEffect, useRef, useState } from 'react';
import { traceStep } from '../../utils/trace';

type ImageSliderProps = {
  before: string;
  after: string;
  value?: number;
  onChange?: (value: number) => void;
  initialValue?: number;
  className?: string;
  heightClassName?: string;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const ImageSlider: React.FC<ImageSliderProps> = ({
  before,
  after,
  value,
  onChange,
  initialValue = 50,
  className,
  heightClassName = 'h-[600px]',
}) => {
  const [internalPos, setInternalPos] = useState(initialValue);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
  const [beforeImageError, setBeforeImageError] = useState(false);
  const [afterImageError, setAfterImageError] = useState(false);
  const isDraggingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const latestPosRef = useRef<number>(initialValue);
  const containerRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const handleLineRef = useRef<HTMLDivElement>(null);
  const containerRectRef = useRef<DOMRect | null>(null);

  // Reset error states when images change
  useEffect(() => {
    setBeforeImageError(false);
  }, [before]);

  useEffect(() => {
    setAfterImageError(false);
  }, [after]);

  const isControlled = typeof value === 'number';
  const sliderPos = internalPos;

  const applyVisualPos = (pos: number) => {
    if (clipRef.current) {
      clipRef.current.style.width = `${pos}%`;
    }
    if (handleLineRef.current) {
      handleLineRef.current.style.left = `${pos}%`;
    }
  };

  // Keep internal state in sync with controlled value when not dragging.
  useEffect(() => {
    if (!isControlled) return;
    if (isDraggingRef.current) return;
    setInternalPos(value as number);
    latestPosRef.current = value as number;
    applyVisualPos(value as number);
  }, [isControlled, value]);

  // Measure container size so the "after" image stays full-size while the wrapper clips.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      setContainerSize({ width: rect.width, height: rect.height });
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const updateFromClientX = (clientX: number) => {
    const rect = containerRectRef.current ?? containerRef.current?.getBoundingClientRect() ?? null;
    if (!rect || rect.width <= 0) return;

    const position = ((clientX - rect.left) / rect.width) * 100;
    const next = clamp(position, 0, 100);
    latestPosRef.current = next;

    // Apply immediately to avoid “first frame” delay.
    applyVisualPos(next);

    // Throttle DOM writes to animation frames to avoid jank.
    if (rafRef.current != null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      applyVisualPos(latestPosRef.current);
    });
  };

  const onStartDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only start dragging on primary button for mouse.
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.stopPropagation(); // Prevent event bubbling
    isDraggingRef.current = true;

    const rect = containerRef.current?.getBoundingClientRect() ?? null;
    containerRectRef.current = rect;

    containerRef.current?.setPointerCapture(e.pointerId);
    updateFromClientX(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    updateFromClientX(e.clientX);
    
    // Update internal state immediately for visual smoothness without notifying parent
    setInternalPos(latestPosRef.current);
  };

  const onPointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    containerRectRef.current = null;

    if (rafRef.current != null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // Sync React state once (end of drag).
    setInternalPos(latestPosRef.current);

    // Commit to parent only once, on drag end. This avoids re-rendering the full DesignerV2_1 tree.
    if (onChange) onChange(latestPosRef.current);

    try {
      containerRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div
      ref={containerRef}
      dir="ltr"
      className={
        `relative w-full ${heightClassName} overflow-visible select-none bg-transparent ` +
        (className ?? '')
      }
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUpOrCancel}
      onPointerCancel={onPointerUpOrCancel}
    >
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        {before && !beforeImageError ? (
          <img
            src={before}
            className="absolute inset-0 w-full h-full object-contain object-center pointer-events-none"
            alt="Before"
            decoding="async"
            draggable={false}
            onLoad={() => {
              try {
                const s = String(before || '');
                const kind = s.startsWith('blob:') ? 'blob' : s.startsWith('data:') ? 'data' : s.startsWith('http') ? 'http' : 'other';
                traceStep('ImageSlider BEFORE load', { kind });
              } catch {
                // ignore
              }
            }}
            onError={() => {
              setBeforeImageError(true);
              try {
                const s = String(before || '');
                const kind = s.startsWith('blob:') ? 'blob' : s.startsWith('data:') ? 'data' : s.startsWith('http') ? 'http' : 'other';
                traceStep('ImageSlider BEFORE error', { kind });
              } catch {
                // ignore
              }
            }}
          />
        ) : null}
        
        {!before && !beforeImageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/30">
            <img
              src="/logo_big.png?v=4"
              alt="Khuyoot Logo"
              className="w-1/3 max-w-xs opacity-10 grayscale select-none pointer-events-none"
              draggable={false}
            />
          </div>
        )}
        
        {before && beforeImageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50">
            <div className="text-center text-zinc-400 text-sm">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>Original</div>
            </div>
          </div>
        )}

        {after && !afterImageError ? (
          <div
            className="absolute top-0 left-0 bottom-0 overflow-hidden pointer-events-none"
            style={{ width: `${sliderPos}%` }}
            ref={clipRef}
          >
            <div
              className="absolute top-0 left-0 bottom-0"
              style={
                containerSize
                  ? { width: `${containerSize.width}px` }
                  : { width: '100%' }
              }
            >
              <img
                src={after}
                className="w-full h-full object-contain object-center pointer-events-none"
                alt="After"
                decoding="async"
                draggable={false}
                onLoad={() => {
                  try {
                    const s = String(after || '');
                    const kind = s.startsWith('blob:') ? 'blob' : s.startsWith('data:') ? 'data' : s.startsWith('http') ? 'http' : 'other';
                    traceStep('ImageSlider AFTER load', { kind });
                  } catch {
                    // ignore
                  }
                }}
                onError={() => {
                  setAfterImageError(true);
                  try {
                    const s = String(after || '');
                    const kind = s.startsWith('blob:') ? 'blob' : s.startsWith('data:') ? 'data' : s.startsWith('http') ? 'http' : 'other';
                    traceStep('ImageSlider AFTER error', { kind });
                  } catch {
                    // ignore
                  }
                }}
              />
            </div>
          </div>
        ) : null}
        

        
        {after && afterImageError && (
          <div 
            className="absolute top-0 left-0 bottom-0 overflow-hidden pointer-events-none"
            style={{ width: `${sliderPos}%` }}
          >
            <div
              className="absolute top-0 left-0 bottom-0 flex items-center justify-center bg-zinc-900/50"
              style={
                containerSize
                  ? { width: `${containerSize.width}px` }
                  : { width: '100%' }
              }
            >
              <div className="text-center text-zinc-400 text-sm">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>Result</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Slider Handle Line */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white/90 shadow-[0_0_15px_rgba(255,255,255,0.4)] flex items-center justify-center cursor-col-resize pointer-events-auto z-50"
        style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)', willChange: 'left' }}
        onPointerDown={onStartDrag}
        ref={handleLineRef}
      >
        <div 
          className="w-10 h-10 bg-white border-2 border-theme-primary/10 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)] cursor-col-resize pointer-events-auto touch-none z-50 transition-transform active:scale-90"
        >
          <span className="text-theme-primary text-base font-black">↔</span>
        </div>
      </div>
    </div>
  );
};

export default ImageSlider;
