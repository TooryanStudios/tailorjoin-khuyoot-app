import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../../../context/AppContext';

const isExternalHref = (href: string) => /^https?:\/\//i.test(href);

export const DesignerCardsRail = React.memo(function DesignerCardsRail() {
  const { appSettings } = useApp();
  const navigate = useNavigate();
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);

  const rail = appSettings.designerCardsRail;
  const railEnabled = rail?.enabled !== false;

  const title = rail?.title ?? 'Explore';
  const maxCards = Math.max(0, Number.isFinite(rail?.maxCards as number) ? (rail?.maxCards as number) : 12);
  const cardWidthPx = Math.max(120, Number.isFinite(rail?.cardWidthPx as number) ? (rail?.cardWidthPx as number) : 220);
  const cardHeightPx = Math.max(80, Number.isFinite(rail?.cardHeightPx as number) ? (rail?.cardHeightPx as number) : 140);
  const cardRadiusPx = Math.max(0, Number.isFinite(rail?.cardRadiusPx as number) ? (rail?.cardRadiusPx as number) : 16);
  const gapPx = Math.max(0, Number.isFinite(rail?.gapPx as number) ? (rail?.gapPx as number) : 12);
  const paddingXPx = Math.max(0, Number.isFinite(rail?.paddingXPx as number) ? (rail?.paddingXPx as number) : 16);

  const cards = (rail?.cards || [])
    .filter((c) => c && c.enabled !== false && c.mediaUrl && c.mediaUrl.trim().length > 0)
    .slice(0, maxCards);

  const scrollByAmount = React.useCallback((dx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dx, behavior: 'smooth' });
  }, []);

  const handleCardClick = React.useCallback(
    (href?: string) => {
      if (!href) return;
      if (isExternalHref(href)) {
        window.open(href, '_blank', 'noopener,noreferrer');
        return;
      }
      navigate(href);
    },
    [navigate]
  );

  // Show nothing if disabled
  if (!railEnabled) return null;

  // Show placeholder if enabled but no cards
  if (cards.length === 0) {
    return (
      <div className="w-full px-4 py-3 text-center text-xs text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-700 rounded-lg">
        {title} section enabled. Add cards from Admin → Config → المصمم
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="flex items-center justify-between px-4 mb-2">
        <div className="text-[11px] font-black uppercase tracking-wider text-zinc-400">{title}</div>
      </div>

      <div
        ref={scrollerRef}
        className="flex overflow-x-auto pb-2 overscroll-x-contain scroll-smooth"
        style={{
          WebkitOverflowScrolling: 'touch',
          columnGap: gapPx,
          paddingLeft: paddingXPx,
          paddingRight: paddingXPx,
        }}
      >
        {cards.map((card) => {
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleCardClick(card.href)}
              className="relative shrink-0 overflow-hidden border border-zinc-800/70 bg-zinc-900/70 text-left"
              style={{
                width: cardWidthPx,
                borderRadius: cardRadiusPx,
              }}
            >
              <div className="relative w-full bg-zinc-900" style={{ height: cardHeightPx }}>
                {card.type === 'video' ? (
                  <video
                    src={card.mediaUrl}
                    className="absolute inset-0 w-full h-full object-cover"
                    muted
                    playsInline
                    loop
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={card.mediaUrl}
                    alt={card.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                  <div className="text-sm font-semibold text-white line-clamp-2">{card.title}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => scrollByAmount(-260)}
        className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-zinc-900/80 border border-zinc-700/70 text-zinc-200 flex items-center justify-center"
        aria-label="Scroll left"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        onClick={() => scrollByAmount(260)}
        className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-zinc-900/80 border border-zinc-700/70 text-zinc-200 flex items-center justify-center"
        aria-label="Scroll right"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
});
