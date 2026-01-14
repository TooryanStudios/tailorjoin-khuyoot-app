import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';

type ActionCard = {
  id: string;
  title: string;
  subtitle?: string;
  badge?: 'new' | 'live';
  href: string;
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
  mediaPosterUrl?: string;
};

// Keep a lightweight cache across route unmount/remount so we don't show a
// loading shimmer every time the user revisits Home in the SPA.
const loadedMediaUrls = new Set<string>();

const DEFAULT_VIDEO_POSTER =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#0b1220"/>
          <stop offset="0.55" stop-color="#111827"/>
          <stop offset="1" stop-color="#0b1220"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="1500" fill="url(#g)"/>
    </svg>`
  );

const DEFAULT_CARDS: ActionCard[] = [
  {
    id: 'create',
    title: 'إنشاء (AI)',
    subtitle: 'ابدأ التصميم',
    badge: 'new',
    href: '/designer-v2-1',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1520975911038-26c9ca0e152a?auto=format&fit=crop&w=1200&q=70',
  },
  {
    id: 'discover',
    title: 'اكتشف',
    subtitle: 'تصفح التصاميم',
    href: '/products',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1520975959122-0a71e5b3f3f1?auto=format&fit=crop&w=1200&q=70',
  },
  {
    id: 'tailors',
    title: 'الخياطين',
    subtitle: 'ابحث عن خبراء',
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

const BoutiqueCard = React.memo<{
  title: string;
  subtitle?: string;
  mediaUrl: string;
  mediaType?: 'image' | 'video';
  mediaPosterUrl?: string;
  badge?: 'new' | 'live';
  onClick?: () => void;
  width: number;
  height: number;
}>(function BoutiqueCard({ title, subtitle, mediaUrl, mediaType = 'image', mediaPosterUrl, badge, onClick, width, height }) {
  const [mediaLoaded, setMediaLoaded] = React.useState<boolean>(() => (mediaUrl ? loadedMediaUrls.has(mediaUrl) : false));
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    setMediaLoaded(mediaUrl ? loadedMediaUrls.has(mediaUrl) : false);
  }, [mediaUrl]);

  // Manage video playback to prevent flash on remount
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || mediaType !== 'video') return;

    // Start playing once loaded
    const playVideo = () => {
      video.play().catch(() => {
        // Silently handle autoplay errors
      });
    };

    if (video.readyState >= 3) {
      // Video already loaded
      playVideo();
    } else {
      video.addEventListener('loadeddata', playVideo, { once: true });
    }

    return () => {
      video.removeEventListener('loadeddata', playVideo);
    };
  }, [mediaType, mediaUrl]);

  return (
    <div
      onClick={onClick}
      className="relative rounded-3xl overflow-hidden border border-white/10 group cursor-pointer transition-all duration-300 hover:border-white/30 hover:shadow-lg hover:shadow-blue-500/20"
      style={{ width, height }}
    >
      {mediaUrl && mediaType === 'video' ? (
        <video
          key={mediaUrl}
          ref={videoRef}
          src={mediaUrl}
          poster={mediaPosterUrl || DEFAULT_VIDEO_POSTER}
          className={`absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-[transform,opacity] duration-500 ${
            mediaLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loop
          muted
          playsInline
          preload="auto"
          onLoadedData={() => {
            loadedMediaUrls.add(mediaUrl);
            setMediaLoaded(true);
          }}
          draggable={false}
        />
      ) : mediaUrl ? (
        <img
          src={mediaUrl}
          alt={title}
          onLoad={() => {
            loadedMediaUrls.add(mediaUrl);
            setMediaLoaded(true);
          }}
          onError={() => setMediaLoaded(false)}
          className={`absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-all duration-500 ${
            mediaLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          draggable={false}
        />
      ) : null}

      {!mediaLoaded && !!mediaUrl && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10" />
      )}

      {!mediaUrl && <div className="absolute inset-0 bg-white/5" />}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 group-hover:from-black/90 transition-all duration-300" />

      {/* Navigation indicator on hover */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="w-8 h-8 rounded-full bg-blue-500/90 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
      </div>

      <div className="absolute inset-0 flex flex-col justify-end p-6">
        {badge && (
          <span className="inline-block mb-4 bg-[color:var(--theme-secondary)] text-black text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest w-fit">
            {badge === 'new' ? '✨ جديد' : '🔴 مباشر'}
          </span>
        )}

        <div className="text-2xl font-black tracking-tight text-white mb-1">{title}</div>
        {subtitle && <div className="text-sm text-white/70">{subtitle}</div>}
      </div>
    </div>
  );
});

export const V2ActionCards: React.FC = React.memo(function V2ActionCards() {
  const { appSettings } = useApp();
  const navigate = useNavigate();
  
  const cfg = (appSettings as any)?.homePageV2Layout?.blockConfig?.actionCards;
  const cardGapPx = cfg?.cardGapPx ?? 16;
  const title = cfg?.title || 'أدوات سريعة';

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
    ? cfg!.items!
        .filter((item: any) => item.enabled !== false)
        .map((item: any) => ({
          id: item.id,
          title: item.title,
          subtitle: item.subtitle || '',
          href: item.href,
          mediaType: item.mediaType,
          mediaUrl: item.mediaUrl,
        }))
    : DEFAULT_CARDS;

  const visibleCards = cards.slice(0, maxItems);

  return (
    <section className="py-6">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white">{title}</h2>
          <p className="text-sm text-slate-400 mt-1">وصول سريع إلى الأدوات الرئيسية</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={scrollLeft}
            aria-label="Scroll left"
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition"
          >
            <ChevronRight size={20} />
          </button>
          <button
            type="button"
            onClick={scrollRight}
            aria-label="Scroll right"
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex overflow-x-auto overflow-y-hidden no-scrollbar scroll-smooth"
        style={{ gap: cardGapPx }}
      >
        {visibleCards.map((card) => (
          <BoutiqueCard
            key={card.id}
            title={card.title}
            subtitle={card.subtitle}
            mediaUrl={card.mediaUrl || ''}
            mediaType={card.mediaType}
            mediaPosterUrl={(card as any).mediaPosterUrl}
            badge={card.badge}
            onClick={() => openHref(navigate, card.href)}
            width={cardWidthPx}
            height={cardHeightPx}
          />
        ))}
      </div>
    </section>
  );
});
