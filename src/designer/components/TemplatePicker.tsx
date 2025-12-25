import React from 'react';

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
};

export function TemplatePicker(props: {
  items: TemplatePickerItem[];
  selectedId: string | null;
  onSelect: (item: TemplatePickerItem) => void;
  aspect?: 'portrait' | 'square';
  maxItemWidthPx?: number;
}) {
  const { items, selectedId, onSelect, aspect = 'portrait', maxItemWidthPx = 140 } = props;

  const maxWidthClass = `max-w-[${maxItemWidthPx}px]`;
  const aspectClass = aspect === 'square' ? 'aspect-square' : 'aspect-[3/4]';
  const desiredPerRow = 4;
  const placeholderCount = items.length >= desiredPerRow
    ? (desiredPerRow - (items.length % desiredPerRow)) % desiredPerRow
    : desiredPerRow - items.length;

  return (
    <div className="flex flex-wrap gap-2 justify-start">
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
            disabled={!!t.disabled}
            title={t.title}
            style={{ width: maxItemWidthPx, flexBasis: maxItemWidthPx }}
            className={
              `mx-0 ${maxWidthClass} rounded-xl border p-2 text-right transition-all flex flex-col items-stretch ` +
              (isSelected
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600') +
              (t.disabled ? ' opacity-60 cursor-not-allowed hover:border-slate-200 dark:hover:border-slate-700' : '')
            }
          >
            <div className={`${aspectClass} relative w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 flex items-start justify-start`}>
              {t.thumbnailUrl || t.imageUrl ? (
                <>
                  <img
                    src={(t.thumbnailUrl || t.imageUrl) as string}
                    alt={t.name}
                    className={`h-full w-full object-cover object-top ${t.isLocked ? 'opacity-40 grayscale' : ''}`}
                    loading="lazy"
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
            <div className="mt-2 text-xs font-bold text-slate-800 dark:text-white">{t.name}</div>
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
