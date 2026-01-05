import React from 'react';
import { ModularModal } from '../../shared/ModularModal';
import { DiscoveryCard, type DiscoveryCardData } from './DiscoveryCard';
import { useLayoutStore } from '../store/useLayoutStore';

const SAMPLE: DiscoveryCardData[] = [
  {
    id: '1',
    title: 'Omani Gold',
    mediaUrl: 'https://images.unsplash.com/photo-1520975958225-3f61d2b7a47b?auto=format&fit=crop&w=1200&q=70',
    type: 'image',
  },
  {
    id: '2',
    title: 'Royal Purple',
    mediaUrl: 'https://images.unsplash.com/photo-1520975881379-5a7dfb24f9ab?auto=format&fit=crop&w=1200&q=70',
    type: 'image',
  },
  {
    id: '3',
    title: 'Boutique Detail',
    mediaUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=70',
    type: 'image',
  },
  {
    id: '4',
    title: 'New Drop',
    mediaUrl: 'https://images.unsplash.com/photo-1520975959122-0a71e5b3f3f1?auto=format&fit=crop&w=1200&q=70',
    type: 'image',
  },
];

export default function MasonryDiscoveryGrid() {
  const cfg = useLayoutStore((s) => s.blockConfig.masonryDiscovery);
  const cardGapPx = cfg?.cardGapPx ?? 16;
  const cardRadiusPx = cfg?.cardRadiusPx ?? 16;
  const title = cfg?.title || 'Discovery';
  const maxColumns = Math.max(1, Math.floor(cfg?.maxColumns ?? 4));
  const maxItems = Math.max(1, Math.floor((cfg?.maxColumns ?? 4) * (cfg?.maxRows ?? 1)));
  const mediaAspectRatio =
    typeof cfg?.cardWidth === 'number' && cfg.cardWidth > 0 && typeof cfg?.cardHeight === 'number' && cfg.cardHeight > 0
      ? `${cfg.cardWidth} / ${cfg.cardHeight}`
      : undefined;
  const [active, setActive] = React.useState<DiscoveryCardData | null>(null);

  const items: DiscoveryCardData[] = Array.isArray(cfg?.items) && cfg!.items!.length
    ? cfg!.items!.map((item) => ({
        id: item.id,
        title: item.title,
        mediaUrl: item.mediaUrl,
        type: item.mediaType,
      }))
    : SAMPLE;

  return (
    <section className="mt-10 pb-14">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-[2.5rem] leading-[1.05] font-extrabold">{title}</div>
          <div className="text-white/70 text-base">Masonry grid with scroll reveal and modal focus.</div>
        </div>
      </div>

      <div
        className="mt-5 [column-fill:_balance]"
        style={{ columnGap: cardGapPx, columnCount: maxColumns }}
      >
        {items.slice(0, maxItems).map((item) => (
          <div key={item.id} className="break-inside-avoid" style={{ marginBottom: cardGapPx }}>
            <DiscoveryCard
              data={item}
              onClick={() => setActive(item)}
              radiusPx={cardRadiusPx}
              mediaAspectRatio={mediaAspectRatio}
            />
          </div>
        ))}
      </div>

      <ModularModal isOpen={!!active} onClose={() => setActive(null)} title={active?.title}>
        {active ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className="aspect-[3/4] w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5"
              style={{ borderRadius: cardRadiusPx }}
            >
              {active.type === 'video' ? (
                <video
                  src={active.mediaUrl}
                  className="w-full h-full object-cover"
                  controls
                  playsInline
                  preload="metadata"
                />
              ) : (
                <img src={active.mediaUrl} className="w-full h-full object-cover" alt={active.title} />
              )}
            </div>
            <div
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-[12px] p-4"
              style={{ borderRadius: cardRadiusPx }}
            >
              <div className="text-white text-lg font-semibold">{active.title}</div>
              <div className="mt-2 text-white/75 text-sm">
                This is a modular modal — content can be swapped per block.
              </div>
              <button
                type="button"
                className="mt-4 h-11 px-5 rounded-xl bg-[#D4AF37] text-black font-semibold hover:brightness-110 active:scale-[0.99] transition min-w-[44px]"
                onClick={() => setActive(null)}
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </ModularModal>
    </section>
  );
}
