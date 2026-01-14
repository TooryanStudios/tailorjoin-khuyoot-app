import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';

function isLikelyVideo(url: string) {
  return /\.(mp4|webm|ogg)(\?|#|$)/i.test(url);
}

function useNearViewport<T extends Element>(opts?: {
  rootMargin?: string;
  threshold?: number;
  once?: boolean;
}) {
  const { rootMargin = '500px 0px', threshold = 0.01, once = true } = opts ?? {};
  const ref = React.useRef<T | null>(null);
  const [isNear, setIsNear] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setIsNear(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsNear(false);
        }
      },
      { root: null, rootMargin, threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, threshold, once]);

  return { ref, isNear } as const;
}

function useImageLoader(src?: string | null) {
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!src) {
      setIsLoaded(false);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (!cancelled) setIsLoaded(true);
    };
    img.onerror = () => {
      if (!cancelled) setIsLoaded(false);
    };
    setIsLoaded(false);
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  return { isLoaded } as const;
}

const SkeletonShimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative overflow-hidden bg-slate-900 ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  </div>
);

interface V2DynamicHeroProps {
  headline?: string;
  subheadline?: string;
  primaryCtaText?: string;
  secondaryCtaText?: string;
  primaryCtaHref?: string;
  secondaryCtaHref?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  heightPx?: number;
}

export const V2DynamicHero: React.FC<V2DynamicHeroProps> = React.memo(function V2DynamicHero({
  headline = 'خيوط - ألبسة عمانية أصيلة',
  subheadline = 'اكتشف تصاميم فريدة من أفضل الخياطين',
  primaryCtaText = 'استكشف',
  secondaryCtaText = 'الجديد',
  primaryCtaHref = '/designer-v2-1',
  secondaryCtaHref = '/products',
  mediaUrl = '',
  mediaType,
  heightPx,
}) {
  const navigate = useNavigate();
  const { appSettings } = useApp();

  // Pull from homePageV2Layout.blockConfig.dynamicHero if available
  const v2Config = (appSettings as any)?.homePageV2Layout?.blockConfig?.dynamicHero;
  
  const effectiveHeadline = headline !== 'خيوط - ألبسة عمانية أصيلة' ? headline : (v2Config?.headline || headline);
  const effectiveSubheadline = subheadline !== 'اكتشف تصاميم فريدة من أفضل الخياطين' ? subheadline : (v2Config?.subheadline || subheadline);
  const effectivePrimaryCtaText = primaryCtaText !== 'استكشف' ? primaryCtaText : (v2Config?.primaryCtaText || primaryCtaText);
  const effectiveSecondaryCtaText = secondaryCtaText !== 'الجديد' ? secondaryCtaText : (v2Config?.secondaryCtaText || secondaryCtaText);
  
  // Add cache-busting for media URLs to ensure new images load
  const rawMediaUrl = mediaUrl || v2Config?.mediaUrl || '';
  const effectiveMediaUrl = React.useMemo(() => {
    if (!rawMediaUrl) return '';
    // Add timestamp from config update or current time for cache-busting
    const cacheBuster = v2Config?.updatedAt || Date.now();
    const separator = rawMediaUrl.includes('?') ? '&' : '?';
    return `${rawMediaUrl}${separator}v=${cacheBuster}`;
  }, [rawMediaUrl, v2Config?.updatedAt]);
  
  const inferred = effectiveMediaUrl && isLikelyVideo(effectiveMediaUrl) ? 'video' : 'image';
  const effectiveMediaType = mediaType ?? v2Config?.mediaType ?? inferred;
  const effectiveHeightPx = heightPx ?? v2Config?.heroHeightPx ?? null;

  const { ref, isNear } = useNearViewport<HTMLDivElement>({ rootMargin: '500px 0px', once: true });
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  const { isLoaded } = useImageLoader(effectiveMediaType === 'image' ? effectiveMediaUrl : null);

  return (
    <section ref={ref} className="mb-8">
      <div
        className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/40 to-slate-950/60 backdrop-blur-xl"
        style={effectiveHeightPx ? { height: `${effectiveHeightPx}px` } : { height: '65vh' }}
      >
        {!effectiveMediaUrl ? (
          <SkeletonShimmer className="absolute inset-0" />
        ) : effectiveMediaType === 'video' ? (
          isNear ? (
            <video
              ref={videoRef}
              src={effectiveMediaUrl}
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              onMouseEnter={() => {
                if (videoRef.current) videoRef.current.playbackRate = 1.1;
              }}
              onMouseLeave={() => {
                if (videoRef.current) videoRef.current.playbackRate = 1.0;
              }}
            />
          ) : (
            <SkeletonShimmer className="absolute inset-0" />
          )
        ) : (
          <>
            {!isLoaded && <SkeletonShimmer className="absolute inset-0" />}
            <img
              src={effectiveMediaUrl}
              alt="Hero"
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-[20s] ease-out ${
                isLoaded ? 'opacity-100 scale-110' : 'opacity-0 scale-100'
              }`}
              style={isLoaded ? { animation: 'kenBurns 20s ease-out infinite alternate' } : undefined}
              decoding="async"
              loading="lazy"
              draggable={false}
            />
          </>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-2xl">
            <div className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">{effectiveHeadline}</div>
            <div className="mt-2 text-white/80 text-base md:text-lg">{effectiveSubheadline}</div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className="h-11 px-5 rounded-xl bg-[color:var(--theme-secondary)] text-black font-semibold hover:brightness-110 active:scale-[0.99] transition min-w-[44px]"
                onClick={() => navigate(primaryCtaHref)}
              >
                {effectivePrimaryCtaText}
              </button>
              <button
                type="button"
                className="h-11 px-5 rounded-xl border border-white/20 bg-white/5 backdrop-blur-[12px] text-white hover:bg-white/10 active:scale-[0.99] transition min-w-[44px]"
                onClick={() => navigate(secondaryCtaHref)}
              >
                {effectiveSecondaryCtaText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

// Add kenBurns animation to global styles
const style = document.createElement('style');
style.textContent = `
  @keyframes kenBurns {
    0% { transform: scale(1); }
    100% { transform: scale(1.1); }
  }
  @keyframes shimmer {
    100% { transform: translateX(100%); }
  }
`;
if (!document.querySelector('[data-ken-burns]')) {
  style.setAttribute('data-ken-burns', '');
  document.head.appendChild(style);
}
