import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronRight } from 'lucide-react';
import { useLayoutStore } from '../store/useLayoutStore';

const ACCENT = '#c6ff1a';

const ITEMS = [
  {
    id: 'd1',
    title: 'Studio',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
    href: '/designs',
  },
  {
    id: 'd2',
    title: 'Portrait',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=900&q=80',
    href: '/designs',
  },
  {
    id: 'd3',
    title: 'Editorial',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
    href: '/designs',
  },
  {
    id: 'd4',
    title: 'Cinematic',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
    href: '/designs',
  },
  {
    id: 'd5',
    title: 'Classic',
    image: 'https://images.unsplash.com/photo-1506086679524-493c64fdfaa6?auto=format&fit=crop&w=900&q=80',
    href: '/designs',
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

export default function BlockD() {
  const cfg = useLayoutStore((s) => s.blockConfig.blockD);
  const navigate = useNavigate();
  const maxItems = Math.max(1, (cfg?.maxColumns || 1) * (cfg?.maxRows || 1));
  const width = cfg?.cardWidth || 180;
  const height = cfg?.cardHeight || 110;
  const cardGapPx = cfg?.cardGapPx ?? 12;
  const cardRadiusPx = cfg?.cardRadiusPx ?? 8;
  const title = cfg?.title || 'HUMAN AI FACES';
  const viewAllHref = '/designs';

  const items = Array.isArray(cfg?.items) && cfg!.items!.length
    ? cfg!.items!.map((item) => ({ id: item.id, title: item.title, image: item.mediaUrl, href: item.href }))
    : ITEMS;

  return (
    <section className="py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
          <Sparkles size={16} color={ACCENT} />
          <span>{title}</span>
        </div>
        <button
          type="button"
          className="flex items-center gap-1 text-[12px] font-semibold text-black px-3 py-1 rounded-full"
          style={{ backgroundColor: ACCENT }}
          onClick={() => openHref(navigate, viewAllHref)}
        >
          VIEW ALL
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <div className="flex pb-2 min-w-max" style={{ gap: cardGapPx }}>
          {items.slice(0, maxItems).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openHref(navigate, item.href)}
              className="group relative shrink-0 text-left"
              style={{ width }}
            >
              <div
                className="relative overflow-hidden rounded-lg bg-slate-900 border border-white/5 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
                style={{ height, borderRadius: cardRadiusPx }}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.06]"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>
              <div className="mt-2 text-[12px] font-semibold text-white/80 leading-tight line-clamp-2 min-h-[32px]">
                {item.title}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
