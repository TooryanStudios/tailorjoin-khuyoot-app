import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayoutStore } from '../store/useLayoutStore';

const CHIPS = ['AI CINEMA', 'AI FACES', 'AI MAGIC', 'AI CITIES', 'AI ENVIRONMENTS', 'AI LANDS', 'AI AVATAR', 'AI TOOLS'];
const ACCENT = '#c6ff1a';

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

export default function BlockF() {
  const cfg = useLayoutStore((s) => s.blockConfig.blockF);
  const navigate = useNavigate();
  const title = cfg?.title || 'EXPLORE MORE AI FEATURES';
  const maxItems = Math.max(1, (cfg?.maxColumns || 4) * (cfg?.maxRows || 1));
  const chipWidth = cfg?.cardWidth || 140;
  const chipHeight = cfg?.cardHeight || 44;
  const chipGapPx = cfg?.cardGapPx ?? 8;
  const chipRadiusPx = cfg?.cardRadiusPx ?? 9999;

  const chips = Array.isArray(cfg?.items) && cfg!.items!.length
    ? cfg!.items!.map((item) => ({ id: item.id, label: item.title, href: item.href }))
    : CHIPS.map((label) => ({ id: label, label, href: '/designer-v2-1' }));

  return (
    <section className="py-6 text-center">
      <div className="inline-flex flex-col items-center gap-3 px-6 py-5 rounded-[16px] border border-white/10 bg-black/30">
        <span className="text-sm font-semibold" style={{ color: ACCENT }}>{title}</span>
        <div className="flex text-[11px] text-white/70 flex-wrap justify-center max-w-5xl" style={{ gap: chipGapPx }}>
          {chips.slice(0, maxItems).map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => openHref(navigate, chip.href)}
              className="border border-white/10 bg-white/5 rounded-full inline-flex items-center justify-center hover:bg-white/10 active:scale-[0.99] transition"
              style={{ minWidth: chipWidth, height: chipHeight, padding: '0 12px', borderRadius: chipRadiusPx }}
              title={chip.label}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
