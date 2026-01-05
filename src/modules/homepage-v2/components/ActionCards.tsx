import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLayoutStore } from '../store/useLayoutStore';
import { BoutiqueCard } from './BoutiqueCard';
import styles from './homepageV2.module.css';

type ActionCard = {
  id: string;
  title: string;
  subtitle?: string;
  badge?: 'new' | 'live';
  href: string;
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
};

const DEFAULT_CARDS: ActionCard[] = [
  {
    id: 'create',
    title: 'Create (AI)',
    subtitle: 'Start designing',
    badge: 'new',
    href: '/designer-v2-1',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1520975911038-26c9ca0e152a?auto=format&fit=crop&w=1200&q=70',
  },
  {
    id: 'discover',
    title: 'Discover',
    subtitle: 'Browse designs',
    href: '/designs',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1520975959122-0a71e5b3f3f1?auto=format&fit=crop&w=1200&q=70',
  },
  {
    id: 'tailors',
    title: 'Tailors',
    subtitle: 'Find experts',
    badge: 'live',
    href: '/tailors',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=70',
  },
];

function isExternalHref(href: string): boolean {
  return /^(https?:\/\/|mailto:|tel:)/i.test(href);
}

function openHref(navigate: (to: string) => void, href: string) {
  if (!href) return;
  if (isExternalHref(href)) {
    window.open(href, '_blank', 'noopener,noreferrer');
    return;
  }
  navigate(href);
}

export default function ActionCards() {
  const cfg = useLayoutStore((s) => s.blockConfig.actionCards);
  const navigate = useNavigate();
  const cardGapPx = cfg?.cardGapPx ?? 16;
  const cardRadiusPx = cfg?.cardRadiusPx ?? 24;
  const title = cfg?.title || 'Quick Tools';

  const maxColumns = Math.max(1, Math.min(6, Math.floor(cfg?.maxColumns ?? 3)));
  const maxRows = Math.max(1, Math.min(6, Math.floor(cfg?.maxRows ?? 1)));
  const maxItems = Math.max(1, maxColumns * maxRows);

  const cardWidthPx = typeof cfg?.cardWidth === 'number' && cfg.cardWidth > 0 ? cfg.cardWidth : 260;
  const cardHeightPx = typeof cfg?.cardHeight === 'number' && cfg.cardHeight > 0 ? cfg.cardHeight : Math.round(cardWidthPx * 1.25);

  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const scrollStep = cardWidthPx + cardGapPx;

  const scrollLeft = React.useCallback(() => {
    scrollerRef.current?.scrollBy({ left: -scrollStep, behavior: 'smooth' });
  }, [scrollStep]);

  const scrollRight = React.useCallback(() => {
    scrollerRef.current?.scrollBy({ left: scrollStep, behavior: 'smooth' });
  }, [scrollStep]);

  const cards: ActionCard[] = Array.isArray(cfg?.items) && cfg!.items!.length
    ? cfg!.items!.map((item, index) => ({
        id: item.id,
        title: item.title,
        subtitle: index === 0 ? 'Start designing' : index === 1 ? 'Browse designs' : 'Open',
        href: item.href,
        mediaType: item.mediaType,
        mediaUrl: item.mediaUrl,
      }))
    : DEFAULT_CARDS;

  return (
    <section className="py-12">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">{title}</h2>
          <p className="text-[#A0AEC0] text-base mt-2">Fast entry points with precision hover states</p>
        </div>
      </div>

      <div className="group relative">
        {/* Left Arrow (Reversed: scrolls right) */}
        <button
          type="button"
          aria-label="Scroll left"
          onClick={scrollRight}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full border border-[#D4AF37]/20 bg-[#1A0B2E]/80 backdrop-blur-xl text-[#D4AF37] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto hover:bg-[#1A0B2E] hover:border-[#D4AF37]/50 transition-all"
        >
          <ChevronLeft size={24} className="mx-auto" />
        </button>

        {/* Right Arrow (Reversed: scrolls left) */}
        <button
          type="button"
          aria-label="Scroll right"
          onClick={scrollLeft}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full border border-[#D4AF37]/20 bg-[#1A0B2E]/80 backdrop-blur-xl text-[#D4AF37] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto hover:bg-[#1A0B2E] hover:border-[#D4AF37]/50 transition-all"
        >
          <ChevronRight size={24} className="mx-auto" />
        </button>

        {/* Horizontal Scroll Rail */}
        <div ref={scrollerRef} className={`overflow-x-auto ${styles.hideScrollbar}`}>
          <div className="grid grid-flow-col auto-cols-max gap-6 pb-4 px-4">
            {cards.slice(0, maxItems).map((card) => (
              <div key={card.id} className="shrink-0" style={{ width: `${cardWidthPx}px` }}>
                <BoutiqueCard
                  title={card.title}
                  subtitle={card.subtitle}
                  mediaUrl={card.mediaUrl || 'https://via.placeholder.com/280x350?text=No+Image'}
                  mediaType={card.mediaType || 'image'}
                  badge={card.badge as 'new' | 'live' | undefined}
                  onClick={() => openHref(navigate, card.href)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
