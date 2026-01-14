import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayoutStore } from '../store/useLayoutStore';
import { useNearViewport } from '../hooks/useNearViewport';
import { useImageLoader } from '../hooks/useImageLoader';
import { SkeletonShimmer } from './SkeletonShimmer';
import styles from './homepageV2.module.css';

function isLikelyVideo(url: string) {
  return /\.(mp4|webm|ogg)(\?|#|$)/i.test(url);
}

export default function DynamicHero() {
  const hero = useLayoutStore((s) => s.hero);
  const setHero = useLayoutStore((s) => s.setHero);
  const cfg = useLayoutStore((s) => s.blockConfig.dynamicHero);
  const navigate = useNavigate();

  const headline = cfg?.headline || 'Omani Boutique';
  const subheadline = cfg?.subheadline || 'Media-rich, glassy, and precise.';
  const primaryCtaText = cfg?.primaryCtaText || 'Explore';
  const secondaryCtaText = cfg?.secondaryCtaText || 'New Drops';
  const heightPx = typeof cfg?.heroHeightPx === 'number' && cfg.heroHeightPx > 0 ? cfg.heroHeightPx : null;

  // Prefer per-block config, but fall back to the legacy hero media store.
  const mediaUrl = (cfg?.mediaUrl ?? hero.mediaUrl) || '';
  const inferred = mediaUrl && isLikelyVideo(mediaUrl) ? 'video' : 'image';
  const mediaType = cfg?.mediaType ?? hero.mediaType ?? inferred;

  // Keep legacy store consistent if URL implies video (only when using legacy store).
  React.useEffect(() => {
    if (!mediaUrl) return;
    if (cfg?.mediaUrl) return;
    if (hero.mediaType !== inferred) setHero({ mediaType: inferred });
  }, [cfg?.mediaUrl, hero.mediaType, inferred, mediaUrl, setHero]);

  const { ref, isNear } = useNearViewport<HTMLDivElement>({ rootMargin: '500px 0px', once: true });
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  const { isLoaded } = useImageLoader(mediaType === 'image' ? mediaUrl : null);

  const primaryCtaHref = '/designer-v2-1';
  const secondaryCtaHref = '/collections';

  return (
    <section ref={ref} className="pt-0 mb-12">
      <div
        className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[rgba(26,11,46,0.4)] to-[rgba(11,3,21,0.6)] backdrop-blur-xl"
        style={heightPx ? { height: `${heightPx}px` } : { height: '65vh' }}
      >
        {!mediaUrl ? (
          <SkeletonShimmer className="absolute inset-0" />
        ) : mediaType === 'video' ? (
          isNear ? (
            <video
              ref={videoRef}
              src={mediaUrl}
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
            {!isLoaded ? <SkeletonShimmer className="absolute inset-0" /> : null}
            <img
              src={mediaUrl}
              alt="Hero"
              className={`absolute inset-0 h-full w-full object-cover ${styles.kenBurns} ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              } transition-opacity duration-500`}
              decoding="async"
              loading="lazy"
              draggable={false}
            />
          </>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0315] via-transparent to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-2xl">
            <div className="text-4xl md:text-5xl font-extrabold tracking-tight">{headline}</div>
            <div className="mt-2 text-white/80 text-base md:text-lg">{subheadline}</div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className="h-11 px-5 rounded-xl bg-[color:var(--theme-secondary)] text-black font-semibold hover:brightness-110 active:scale-[0.99] transition min-w-[44px]"
                onClick={() => navigate(primaryCtaHref)}
              >
                {primaryCtaText}
              </button>
              <button
                type="button"
                className="h-11 px-5 rounded-xl border border-white/20 bg-white/5 backdrop-blur-[12px] text-white hover:bg-white/10 active:scale-[0.99] transition min-w-[44px]"
                onClick={() => navigate(secondaryCtaHref)}
              >
                {secondaryCtaText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
