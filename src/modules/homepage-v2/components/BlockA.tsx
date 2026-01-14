import React from 'react';
import { Play } from 'lucide-react';
import { useLayoutStore } from '../store/useLayoutStore';
import { SkeletonShimmer } from './SkeletonShimmer';

const ACCENT = 'var(--theme-secondary)';

const FEATURED = [
  { id: 'f1', title: 'Featured Cut #1', subtitle: 'Midjourney · Stable Diffusion · Filmic LUTs' },
  { id: 'f2', title: 'Featured Cut #2', subtitle: 'Midjourney · Stable Diffusion · Filmic LUTs' },
  { id: 'f3', title: 'Featured Cut #3', subtitle: 'Midjourney · Stable Diffusion · Filmic LUTs' },
];

export default function BlockA() {
  const cfg = useLayoutStore((s) => s.blockConfig.blockA);
  const hero = useLayoutStore((s) => s.hero);
  const { setHero } = useLayoutStore.getState();

  const list = FEATURED.slice(0, cfg?.maxRows || FEATURED.length);
  const cardWidth = cfg?.cardWidth || 240;
  const cardHeight = cfg?.cardHeight || 68;
  const cardGapPx = cfg?.cardGapPx ?? 8;
  const cardRadiusPx = cfg?.cardRadiusPx ?? 14;
  const title = cfg?.title || 'The Ultimate AI Film Hub';

  React.useEffect(() => {
    // keep hero.mediaType in sync if URL changes type
    if (!hero.mediaUrl) return;
    if (/\.(mp4|webm|ogg)(\?|#|$)/i.test(hero.mediaUrl) && hero.mediaType !== 'video') setHero({ mediaType: 'video' });
  }, [hero.mediaUrl, hero.mediaType]);

  return (
    <section className="py-6">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0B0315] via-[rgba(26,11,46,0.4)] to-[#0B0315] backdrop-blur-xl shadow-[0_25px_70px_rgba(212,175,55,0.1)]">
        <div className="grid md:grid-cols-[1.2fr_1fr] gap-0">
          <div className="relative p-4 md:p-5 flex flex-col gap-3 bg-gradient-to-b from-[rgba(26,11,46,0.3)] to-transparent">
            <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
              {['PUBLISH', 'COLLECTIONS', 'CATEGORIES', 'ALL AI TOOLS', 'TOOLS'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className="px-3 py-2 rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition"
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex flex-col mt-2" style={{ gap: cardGapPx }}>
              {list.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-[14px] border border-white/10 bg-[#0c1424] text-white px-3"
                  style={{ minHeight: cardHeight, height: cardHeight, width: '100%', maxWidth: 420, borderRadius: cardRadiusPx }}
                >
                  <div className="flex flex-col gap-1">
                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase" style={{ color: ACCENT }}>
                      <span className="px-2 py-1 rounded-full bg-black/60 border border-white/10">NEW</span>
                      <span>AI PREMIUM CONTENT</span>
                    </div>
                    <div className="text-[13px] font-bold leading-tight">{item.title}</div>
                    <div className="text-[11px] text-white/70">{item.subtitle}</div>
                  </div>
                  <div
                    className="flex items-center justify-center rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold px-3 py-2"
                    style={{ minWidth: cardWidth / 2, height: cardHeight - 16 }}
                  >
                    Tools
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[320px] md:min-h-[360px]">
            {!hero.mediaUrl ? <SkeletonShimmer className="absolute inset-0" /> : null}
            {hero.mediaType === 'video' ? (
              hero.mediaUrl ? (
                <video
                  src={hero.mediaUrl}
                  className="absolute inset-0 h-full w-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : null
            ) : (
              hero.mediaUrl ? (
                <img
                  src={hero.mediaUrl}
                  alt={title}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              ) : null
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex items-end">
              <div className="space-y-3 max-w-xl">
                <p className="text-[12px] font-bold" style={{ color: ACCENT }}>
                  NEW · AI PREMIUM CONTENT
                </p>
                <h1 className="text-3xl md:text-4xl font-black leading-tight">{title}</h1>
                <p className="text-sm md:text-base text-white/80 max-w-xl">
                  Browse hundreds of AI-generated universes, cinematic cuts, portraits, and environments — all in one ultra-fast rail layout.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="flex items-center gap-2 px-4 h-11 rounded-[12px] font-semibold text-black shadow-lg"
                    style={{ backgroundColor: ACCENT }}
                  >
                    <Play size={18} fill="black" />
                    Watch Now
                  </button>
                  <button
                    type="button"
                    className="h-11 px-4 rounded-[12px] border border-white/15 text-white bg-white/5 hover:bg-white/10 transition"
                  >
                    Explore Collections
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
