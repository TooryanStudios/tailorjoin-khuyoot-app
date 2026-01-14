import React from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLayoutStore } from '../store/useLayoutStore';
import type { HomePageV2CardItem } from '../types';
import styles from './homepageV2.module.css';

const ACCENT = 'var(--theme-primary)';

const FALLBACK_ITEMS: HomePageV2CardItem[] = [
  {
    id: 'b1',
    title: 'Create Image',
    href: '/',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'b2',
    title: 'Create Video',
    href: '/',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'b3',
    title: 'Edit Image',
    href: '/',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1526481280695-3c469c2f88b8?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'b4',
    title: 'AI Film Tools',
    href: '/',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'b5',
    title: 'Upscale',
    href: '/',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=900&q=80',
  },
];

const BlockBCard = React.memo(function BlockBCard(props: {
  item: HomePageV2CardItem;
  width: number;
  height: number;
  radiusPx: number;
  onNavigate: (href: string) => void;
}) {
  const { item, width, height, radiusPx, onNavigate } = props;
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [videoFailed, setVideoFailed] = React.useState(false);

  React.useEffect(() => {
    setVideoFailed(false);
  }, [item.mediaType, item.mediaUrl]);

  const tryPlay = React.useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    // Best-effort: some browsers require an explicit play call even with muted autoplay.
    const p = el.play();
    if (p && typeof (p as any).catch === 'function') {
      (p as Promise<void>).catch(() => {
        // Autoplay can be blocked or the media can be unsupported.
      });
    }
  }, []);

  return (
    <button type="button" className="group shrink-0 text-left" style={{ width }} onClick={() => onNavigate(item.href)}>
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5"
        style={{ height, borderRadius: radiusPx }}
      >
        {item.mediaType === 'video' ? (
          videoFailed ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white/70 text-xs">
              Video failed to load
            </div>
          ) : (
            <video
              ref={videoRef}
              src={item.mediaUrl}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onCanPlay={tryPlay}
              onLoadedData={tryPlay}
              onError={() => setVideoFailed(true)}
            />
          )
        ) : (
          <img
            src={item.mediaUrl}
            alt={item.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-white/90">
        <span className="text-sm font-semibold line-clamp-1">{item.title}</span>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 group-hover:bg-white/10 transition">
          <ChevronRight size={16} className="text-white/80" />
        </span>
      </div>
    </button>
  );
});

function splitTitle(raw: string): { left: string; right?: string } {
  const parts = raw.split('—').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return { left: parts[0], right: parts.slice(1).join(' — ') };
  return { left: raw };
}

export default function BlockB() {
  const navigate = useNavigate();
  const cfg = useLayoutStore((s) => s.blockConfig.blockB);
  const maxItems = Math.max(1, (cfg?.maxColumns || 1) * (cfg?.maxRows || 1));
  const cardWidth = cfg?.cardWidth || 240;
  const cardHeight = cfg?.cardHeight || 140;
  const cardGapPx = cfg?.cardGapPx ?? 16;
  const cardRadiusPx = cfg?.cardRadiusPx ?? 16;
  const titleRaw = cfg?.title || 'AI FILMS — HOT RIGHT NOW';
  const title = splitTitle(titleRaw);
  const exploreAllToolsHref = cfg?.exploreAllToolsHref || '/designer-v2-1';

  const items = (Array.isArray(cfg?.items) && cfg!.items!.length ? cfg!.items! : FALLBACK_ITEMS).filter((it) => it && typeof it.id === 'string');

  const onNavigate = React.useCallback(
    (href: string) => {
      const next = String(href || '').trim();
      if (!next) return;
      if (next.startsWith('/')) {
        navigate(next);
        return;
      }
      // External or hash links
      window.location.href = next;
    },
    [navigate]
  );

  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const scrollStep = cardWidth + cardGapPx;

  const scrollLeft = React.useCallback(() => {
    scrollerRef.current?.scrollBy({ left: -scrollStep, behavior: 'smooth' });
  }, [scrollStep]);

  const scrollRight = React.useCallback(() => {
    scrollerRef.current?.scrollBy({ left: scrollStep, behavior: 'smooth' });
  }, [scrollStep]);

  return (
    <section className="py-6">
      <div className="group relative overflow-hidden rounded-[20px] border border-white/10 bg-gradient-to-r from-[#0b0f14] via-[#0b1322] to-[#0c101a]">
        <div className="flex flex-col lg:flex-row lg:items-stretch gap-6 lg:gap-10 p-6 lg:p-8">
          <div className="lg:w-[360px]">
            <div className="text-3xl md:text-4xl font-black tracking-tight leading-[1.05]">
              <div className="text-white">{title.left}</div>
              {title.right ? (
                <div style={{ color: ACCENT }}>{title.right}</div>
              ) : null}
            </div>
            <p className="mt-4 text-sm text-white/70 max-w-sm">
              Discover trending AI film cuts and tools with a fast, scrollable rail.
            </p>

            <button
              type="button"
              onClick={() => onNavigate(exploreAllToolsHref)}
              className="mt-6 inline-flex items-center gap-2 h-11 px-5 rounded-[12px] font-semibold text-black"
              style={{ backgroundColor: ACCENT }}
            >
              Explore all tools
              <Sparkles size={18} />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="relative">
              <button
                type="button"
                aria-label="Scroll left"
                onClick={scrollRight}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full border border-white/15 bg-white/5 text-white/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto hover:bg-white/10 transition"
              >
                <span className="sr-only">Scroll left</span>
                <ChevronLeft size={18} className="mx-auto" />
              </button>

              <button
                type="button"
                aria-label="Scroll right"
                onClick={scrollLeft}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full border border-white/15 bg-white/5 text-white/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto hover:bg-white/10 transition"
              >
                <span className="sr-only">Scroll right</span>
                <ChevronRight size={18} className="mx-auto" />
              </button>

              <div ref={scrollerRef} className={`overflow-x-auto ${styles.hideScrollbar}`}>
                <div className="flex min-w-max pb-2" style={{ gap: cardGapPx }}>
                  {items.slice(0, maxItems).map((item) => (
                    <BlockBCard
                      key={item.id}
                      item={item}
                      width={cardWidth}
                      height={cardHeight}
                      radiusPx={cardRadiusPx}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
