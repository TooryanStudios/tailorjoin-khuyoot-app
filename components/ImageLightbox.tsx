/**
 * ImageLightbox — universal full-screen image preview
 *
 * Usage:
 *   const { openLightbox, LightboxPortal } = useImageLightbox();
 *   ...
 *   <img onClick={() => openLightbox([url1, url2], 0)} ... />
 *   ...
 *   <LightboxPortal />
 */

import React, { useCallback, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImageLightboxProps {
  /** All images to show in the lightbox */
  images: string[];
  /** Currently visible image index */
  index: number;
  /** Called to close */
  onClose: () => void;
  /** Called to change image */
  onIndexChange: (index: number) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  index,
  onClose,
  onIndexChange,
}) => {
  const hasMultiple = images.length > 1;

  const prev = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onIndexChange((index - 1 + images.length) % images.length);
    },
    [index, images.length, onIndexChange],
  );

  const next = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onIndexChange((index + 1) % images.length);
    },
    [index, images.length, onIndexChange],
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown')
        onIndexChange((index + 1) % images.length);
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp')
        onIndexChange((index - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [index, images.length, onClose, onIndexChange]);

  if (!images.length) return null;

  return (
    <div
      className="fixed inset-0 z-[10200] bg-black/92 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-4 left-4 bg-white/10 hover:bg-white/25 text-white p-2 rounded-full transition z-10"
        onClick={onClose}
        aria-label="إغلاق"
      >
        <X size={22} />
      </button>

      {/* Counter */}
      {hasMultiple && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-4 py-1 rounded-full select-none pointer-events-none">
          {index + 1} / {images.length}
        </div>
      )}

      {/* Prev (RTL layout — right side = previous) */}
      {hasMultiple && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white p-3 rounded-full transition z-10"
          onClick={prev}
          aria-label="السابقة"
        >
          <ChevronRight size={26} />
        </button>
      )}

      {/* Next */}
      {hasMultiple && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white p-3 rounded-full transition z-10"
          onClick={next}
          aria-label="التالية"
        >
          <ChevronLeft size={26} />
        </button>
      )}

      {/* Main image */}
      <img
        src={images[index]}
        alt={`صورة ${index + 1}`}
        className="max-h-[85vh] max-w-[88vw] object-contain rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Thumbnail strip */}
      {hasMultiple && (
        <div
          className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 flex-wrap justify-center max-w-[90vw]"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => onIndexChange(i)}
              aria-label={`صورة ${i + 1}`}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition ${
                i === index
                  ? 'border-white scale-110 shadow-lg'
                  : 'border-white/30 opacity-55 hover:opacity-90'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseLightboxReturn {
  /** Open the lightbox with a set of images, starting at the given index */
  openLightbox: (images: string[], startIndex?: number) => void;
  /** Drop this inside your JSX to render the lightbox */
  LightboxPortal: React.FC;
}

export function useImageLightbox(): UseLightboxReturn {
  const [state, setState] = React.useState<{
    images: string[];
    index: number;
  } | null>(null);

  const openLightbox = useCallback((images: string[], startIndex = 0) => {
    const filtered = images.filter(Boolean);
    if (!filtered.length) return;
    setState({ images: filtered, index: startIndex });
  }, []);

  const close = useCallback(() => setState(null), []);

  const changeIndex = useCallback((index: number) => {
    setState((prev) => (prev ? { ...prev, index } : null));
  }, []);

  const LightboxPortal: React.FC = useCallback(() => {
    if (!state) return null;
    return (
      <ImageLightbox
        images={state.images}
        index={state.index}
        onClose={close}
        onIndexChange={changeIndex}
      />
    );
  }, [state, close, changeIndex]) as React.FC;

  return { openLightbox, LightboxPortal };
}
