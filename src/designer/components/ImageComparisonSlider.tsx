import React, { useState, useRef, useEffect, useMemo } from 'react';

interface ImageComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  animateReveal?: boolean;
  controlledPosition?: number;
  isLoading?: boolean;
}

const ImageComparisonSliderBase = React.forwardRef<HTMLDivElement, ImageComparisonSliderProps>(function ImageComparisonSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
  animateReveal = false,
  controlledPosition,
  isLoading = false,
}, ref) {
  const [sliderPosition, setSliderPosition] = useState(animateReveal ? 0 : (controlledPosition ?? 50));
  const [isDragging, setIsDragging] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<string>('3 / 4');
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const beforeImageRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pendingClientXRef = useRef<number>(0);
  const touchIntentRef = useRef<{ startX: number; startY: number; locked: boolean } | null>(null);
  const currentPositionRef = useRef<number>(animateReveal ? 0 : 50);

  const updateSliderFromClientX = (clientX: number, directUpdate = false) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    currentPositionRef.current = percentage;
    
    // Track container width for proper sizing
    if (containerWidth !== rect.width) {
      setContainerWidth(rect.width);
    }
    
    // During drag, update DOM directly for better performance
    if (directUpdate && beforeImageRef.current && handleRef.current) {
      beforeImageRef.current.style.width = `${percentage}%`;
      handleRef.current.style.left = `${percentage}%`;
    } else {
      setSliderPosition(percentage);
    }
  };

  const scheduleUpdate = (clientX: number, directUpdate = false) => {
    pendingClientXRef.current = clientX;
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      updateSliderFromClientX(pendingClientXRef.current, directUpdate);
    });
  };

  const handleMouseDown = () => setIsDragging(true);
  
  const handleMouseUp = () => {
    setIsDragging(false);
    touchIntentRef.current = null;
    // Sync state after drag ends
    setSliderPosition(currentPositionRef.current);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    scheduleUpdate(e.clientX, true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    const intent = touchIntentRef.current;

    if (intent && !intent.locked) {
      const deltaX = Math.abs(touch.clientX - intent.startX);
      const deltaY = Math.abs(touch.clientY - intent.startY);

      if (deltaY > deltaX && deltaY > 8) {
        touchIntentRef.current = null;
        setIsDragging(false);
        return;
      }

      if (deltaX >= 8) {
        intent.locked = true;
      } else {
        return;
      }
    }

    e.preventDefault();
    scheduleUpdate(touch.clientX, true);
  };

  useEffect(() => {
    if (animateReveal) {
      // Animate from 0 to 50 over 1.5 seconds
      const duration = 1500;
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setSliderPosition(easeOut * 50);
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [animateReveal]);

  useEffect(() => {
    if (typeof controlledPosition === 'number' && !isDragging) {
      const startPos = sliderPosition;
      const endPos = controlledPosition;
      const duration = 800;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeInOut = progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        const newPos = startPos + (endPos - startPos) * easeInOut;
        setSliderPosition(newPos);
        currentPositionRef.current = newPos;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [controlledPosition, isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Initialize container width
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerWidth(rect.width);
    }
  }, []);

  useEffect(() => {
    // Match container aspect ratio to the actual template/original image.
    // This prevents cropping/zooming that causes before/after misalignment.
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setAspectRatio(`${img.naturalWidth} / ${img.naturalHeight}`);
      }
    };
    img.src = beforeImage;
  }, [beforeImage]);

  // Memoize container styles to prevent unnecessary re-renders
  const containerStyle = useMemo(() => ({
    aspectRatio: window.innerWidth < 768 ? '600 / 960' : aspectRatio,
    touchAction: 'pan-y' as const,
    contain: 'layout style paint' as const,
    transform: 'translateZ(0)'
  }), [aspectRatio]);

  // Memoize handle position style
  const handleStyle = useMemo(() => ({
    left: `${sliderPosition}%`,
    touchAction: 'none' as const
  }), [sliderPosition]);

  // Use width-based clipping instead of translateX for proper masking
  const beforeContainerStyle = useMemo(() => ({
    pointerEvents: 'none' as const,
    width: `${sliderPosition}%`,
    transform: 'translateZ(0)'
  }), [sliderPosition]);

  const beforeImageStyle = useMemo(() => ({
    width: containerWidth > 0 ? `${containerWidth}px` : '100vw',
    willChange: isDragging ? 'auto' : undefined
  }), [isDragging, containerWidth]);

  return (
    <div
      ref={containerRef}
      className="relative w-full mx-auto overflow-hidden rounded-lg bg-gray-100 select-none"
      style={containerStyle}
    >
      {/* After Image (background) */}
      <div className="absolute inset-0 z-10" style={{ pointerEvents: 'none' }}>
        <img
          src={afterImage}
          alt={afterLabel}
          className={`w-full h-full object-contain transition-all duration-500 ${
            isLoading ? 'blur-sm scale-105 opacity-70' : ''
          }`}
          style={{
            animation: isLoading ? 'pulse 2s ease-in-out infinite' : undefined
          }}
          loading="eager"
          decoding="async"
          draggable={false}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
              جارٍ الإنشاء...
            </div>
          </div>
        )}
        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
          {afterLabel}
        </div>
      </div>

      {/* Before Image (width-based clipping for performance) */}
      <div
        ref={beforeImageRef}
        className="absolute top-0 left-0 bottom-0 overflow-hidden z-20"
        style={beforeContainerStyle}
      >
        <div
          className="absolute top-0 left-0 bottom-0"
          style={beforeImageStyle}
        >
          <img
            src={beforeImage}
            alt={beforeLabel}
            className="w-full h-full object-contain"
            loading="eager"
            decoding="async"
            draggable={false}
          />
          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
            {beforeLabel}
          </div>
        </div>
      </div>

      {/* Slider Handle */}
      <div
        ref={handleRef}
        className="absolute top-0 bottom-0 w-12 -ml-6 flex items-center justify-center cursor-ew-resize z-30 pointer-events-auto"
        style={handleStyle}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleMouseDown();
          scheduleUpdate(e.clientX, false);
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          const touch = e.touches[0];
          touchIntentRef.current = { startX: touch.clientX, startY: touch.clientY, locked: false };
          handleMouseDown();
          scheduleUpdate(touch.clientX, false);
        }}
      >
        <div className="relative h-full w-0.5 bg-white/80 shadow-lg pointer-events-none">
          {/* Handle Circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full shadow-lg flex items-center justify-center border border-gray-300/50">
            <svg
              className="w-4 h-4 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 8l-4-4-4 4m6 8l4 4 4-4"
                transform="rotate(90 12 12)"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
});

ImageComparisonSliderBase.displayName = 'ImageComparisonSlider';
export const ImageComparisonSlider = React.memo(ImageComparisonSliderBase);
