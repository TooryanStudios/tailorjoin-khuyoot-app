import React from 'react';
import { useImagePreloader } from '../utils/imagePreloader';

export type TemplatePickerItem = {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl?: string | null;
  disabled?: boolean;
  title?: string;
  isPremium?: boolean;
  isLocked?: boolean;
  metaLabel?: string;
  metaTone?: 'ok' | 'warn' | 'neutral';
  isHot?: boolean;
};

export function TemplatePicker(props: {
  items: TemplatePickerItem[];
  selectedId: string | null;
  onSelect: (item: TemplatePickerItem) => void;
  onConfirm?: (item: TemplatePickerItem) => void;
  aspect?: 'portrait' | 'square';
  maxItemWidthPx?: number;
}) {
  const { items, selectedId, onSelect, onConfirm, aspect = 'portrait', maxItemWidthPx = 140 } = props;

  const { preload, preloadWhenIdle, precacheBlobs, getLocalUrl } = useImagePreloader();
  
  // Memoize URLs to avoid re-triggering preload on every render
  const thumbUrls = React.useMemo(() => {
    return items
      .slice(0, 16)
      .map((item) => item.thumbnailUrl || item.imageUrl)
      .filter((url): url is string => Boolean(url));
  }, [items]);

  const largeUrls = React.useMemo(() => {
    return items
      .slice(0, 6)
      .map((item) => item.imageUrl)
      .filter((url): url is string => Boolean(url));
  }, [items]);

  // Track which URLs we've already preloaded to avoid redundant requests
  const preloadedUrlsRef = React.useRef<Set<string>>(new Set());

  // Preload thumbnails quickly, and large images opportunistically.
  // This keeps the grid snappy and makes the right-side large preview load faster after click.
  React.useEffect(() => {
    const newThumbUrls = thumbUrls.filter(url => !preloadedUrlsRef.current.has(url));
    if (newThumbUrls.length) {
      preloadWhenIdle(newThumbUrls, 'high', { kind: 'thumb' });
      // Also cache blobs during idle so reopening doesn't hit network
      precacheBlobs(newThumbUrls).catch(() => {});
      newThumbUrls.forEach(url => preloadedUrlsRef.current.add(url));
    }

    const newLargeUrls = largeUrls.filter(url => !preloadedUrlsRef.current.has(url));
    if (newLargeUrls.length) {
      preloadWhenIdle(newLargeUrls, 'low', { kind: 'large' });
      precacheBlobs(newLargeUrls).catch(() => {});
      newLargeUrls.forEach(url => preloadedUrlsRef.current.add(url));
    }
  }, [thumbUrls, largeUrls, preloadWhenIdle, precacheBlobs]);

  const maxWidthClass = `max-w-[${maxItemWidthPx}px]`;
  const aspectClass = aspect === 'square' ? 'aspect-square' : 'aspect-[3/4]';
  const desiredPerRow = 4;
  const placeholderCount = items.length >= desiredPerRow
    ? (desiredPerRow - (items.length % desiredPerRow)) % desiredPerRow
    : desiredPerRow - items.length;

  return (
    <div className="flex flex-wrap gap-1.5 justify-center">
      
      {items.map((t) => {
        const isSelected = t.id === selectedId;
        const metaToneClass = t.metaTone === 'ok'
          ? 'bg-emerald-600 text-white'
          : t.metaTone === 'warn'
            ? 'bg-amber-600 text-white'
            : 'bg-slate-900/70 text-white';
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              if (t.disabled) return;
              onSelect(t);
            }}
            onMouseEnter={() => {
              if (t.imageUrl) preload([t.imageUrl], 'high', { kind: 'large' });
            }}
            onFocus={() => {
              if (t.imageUrl) preload([t.imageUrl], 'high', { kind: 'large' });
            }}
            disabled={!!t.disabled}
            title={t.title}
            style={{ width: maxItemWidthPx, flexBasis: maxItemWidthPx }}
            className={
              `mx-0 ${maxWidthClass} rounded-xl p-0 text-right transition-all flex flex-col items-stretch bg-transparent ` +
              (isSelected ? 'ring-2 ring-violet-500' : '') +
              (t.disabled ? ' opacity-60 cursor-not-allowed' : '')
            }
          >
            <div className={`${aspectClass} relative w-full overflow-hidden rounded-xl flex items-start justify-start`}>
              {t.thumbnailUrl || t.imageUrl ? (
                <>
                  <img
                    src={(getLocalUrl(t.thumbnailUrl || t.imageUrl) || (t.thumbnailUrl || t.imageUrl)) as string}
                    alt={t.name}
                    className={`h-full w-full object-cover object-top ${t.isLocked ? 'opacity-40 grayscale' : ''}`}
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="absolute inset-0 hidden items-center justify-center text-xs text-slate-400">
                    لا توجد صورة
                  </div>
                  {/* bottom gradient overlay */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent dark:from-black/80" />
                  {/* hot tag */}
                  {t.isHot ? (
                    <div className="absolute left-2 top-2 bg-red-600 text-white text-[10px] font-bold rounded px-2 py-1 shadow-md">رائج</div>
                  ) : null}
                  {/* title and CTA overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col gap-2">
                    <div className="text-[12px] font-bold text-white drop-shadow-md truncate">{t.name}</div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (t.disabled) return;
                        if (onConfirm) {
                          onConfirm(t);
                        } else {
                          onSelect(t);
                        }
                      }}
                      className="pointer-events-auto w-full h-7 rounded-lg text-[10px] font-normal transition-colors bg-black/60 text-gray-400 hover:bg-black/80 hover:text-gray-300"
                    >
                      استخدم القالب
                    </button>
                  </div>
                </>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">
                  لا توجد صورة
                </div>
              )}
              {t.metaLabel ? (
                <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm ${metaToneClass}`}>
                  {t.metaLabel}
                </div>
              ) : null}
              {t.isPremium && (
                <div className="absolute top-1 left-1 bg-amber-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm">
                  ⭐ Premium
                </div>
              )}
              {t.isLocked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[1px]">
                  <svg className="w-6 h-6 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-white text-[10px] font-bold">اشترك</span>
                </div>
              )}
            </div>
          </button>
        );
      })}
      {Array.from({ length: placeholderCount }).map((_, idx) => (
        <div
          key={`placeholder-${idx}`}
          style={{ width: maxItemWidthPx, flexBasis: maxItemWidthPx }}
          className={`mx-0 ${maxWidthClass} rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-2 opacity-60`}
          aria-hidden
        >
          <div className={`${aspectClass} w-full overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-[11px] text-slate-400`}>—</div>
        </div>
      ))}
    </div>
  );
}
