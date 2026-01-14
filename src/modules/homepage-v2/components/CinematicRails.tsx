import React from 'react';
import { Sparkles, Play, ChevronRight } from 'lucide-react';
import { SkeletonShimmer } from './SkeletonShimmer';

const ACCENT = 'var(--theme-primary)';

type RailItem = {
  id: string;
  title: string;
  image: string;
  tag?: string;
};

type Rail = {
  id: string;
  title: string;
  items: RailItem[];
};

const RAILS: Rail[] = [
  {
    id: 'ai-showcase',
    title: 'AI FILMS — HOT RIGHT NOW',
    items: [
      { id: 'ai-1', title: 'Syndicate', image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=900&q=80', tag: 'HD' },
      { id: 'ai-2', title: 'Aurora', image: 'https://images.unsplash.com/photo-1526481280695-3c469c2f88b8?auto=format&fit=crop&w=900&q=80', tag: '4K' },
      { id: 'ai-3', title: 'Neon Fleet', image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=900&q=80', tag: 'HDR' },
      { id: 'ai-4', title: 'Mirror City', image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=900&q=80', tag: 'AI' },
      { id: 'ai-5', title: 'Prism', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80', tag: 'HD' },
      { id: 'ai-6', title: 'Chronicle', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80', tag: '4K' }
    ]
  },
  {
    id: 'ai-magic',
    title: 'AI MAGIC & EFFECTS',
    items: [
      { id: 'fx-1', title: 'Cosmic Threads', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80', tag: 'VFX' },
      { id: 'fx-2', title: 'Red Shift', image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=900&q=80', tag: 'New' },
      { id: 'fx-3', title: 'Phoenix', image: 'https://images.unsplash.com/photo-1481349518771-20055b2a7b24?auto=format&fit=crop&w=900&q=80', tag: 'Live' },
      { id: 'fx-4', title: 'Neutron', image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80' },
      { id: 'fx-5', title: 'Afterglow', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80' }
    ]
  },
  {
    id: 'ai-faces',
    title: 'HUMAN AI FACES',
    items: [
      { id: 'face-1', title: 'Studio', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80' },
      { id: 'face-2', title: 'Portrait', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=900&q=80' },
      { id: 'face-3', title: 'Editorial', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80' },
      { id: 'face-4', title: 'Cinematic', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80' },
      { id: 'face-5', title: 'Classic', image: 'https://images.unsplash.com/photo-1506086679524-493c64fdfaa6?auto=format&fit=crop&w=900&q=80' }
    ]
  },
  {
    id: 'ai-cities',
    title: 'AI CITIES & SCAPES',
    items: [
      { id: 'city-1', title: 'Glasswork', image: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=900&q=80' },
      { id: 'city-2', title: 'Rain Alley', image: 'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=900&q=80' },
      { id: 'city-3', title: 'Highline', image: 'https://images.unsplash.com/photo-1526401485004-2aa7c769f2f0?auto=format&fit=crop&w=900&q=80' },
      { id: 'city-4', title: 'Voltage', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80' },
      { id: 'city-5', title: 'Deep Night', image: 'https://images.unsplash.com/photo-1433838552652-f9a46b332c40?auto=format&fit=crop&w=900&q=80' }
    ]
  }
];

function RailRow({ title, items }: Rail) {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
          <Sparkles size={16} color={ACCENT} />
          <span>{title}</span>
        </div>
        <button
          type="button"
          className="flex items-center gap-1 text-[12px] font-semibold text-black px-3 py-1 rounded-full"
          style={{ backgroundColor: ACCENT }}
        >
          VIEW ALL
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-3 pb-2 min-w-max">
          {items.map((item) => (
            <article
              key={item.id}
              className="group relative w-[175px] shrink-0"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-900 border border-white/5 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
                <img
                  src={item.image}
                  alt={item.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.06]"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                {item.tag ? (
                  <div className="absolute top-2 left-2 text-[10px] font-black px-2 py-1 rounded-full bg-black/70 border border-white/10 text-white">
                    {item.tag}
                  </div>
                ) : null}
              </div>
              <div className="mt-2 text-[12px] font-semibold text-white/80 leading-tight line-clamp-2 min-h-[32px]">
                {item.title}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CinematicRails() {
  return (
    <section className="py-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-gradient-to-br from-[#05070c] via-[#0b1322] to-[#0c101a] shadow-[0_25px_70px_rgba(0,0,0,0.55)]">
        <div className="grid md:grid-cols-[1.2fr_1fr] gap-0">
          <div className="relative min-h-[320px] md:min-h-[360px]">
            <SkeletonShimmer className="absolute inset-0" />
            <img
              src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80"
              alt="AI Hero"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex items-end">
              <div className="space-y-3 max-w-xl">
                <p className="text-[12px] font-bold" style={{ color: ACCENT }}>
                  NEW · AI PREMIUM CONTENT
                </p>
                <h1 className="text-3xl md:text-4xl font-black leading-tight">The Ultimate AI Film Hub</h1>
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
          <div className="relative p-6 md:p-8 bg-gradient-to-b from-[#0b1322] via-[#0f1b2f] to-[#0b1322]">
            <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
              {['ALL AI TOOLS', 'CATEGORIES', 'COLLECTIONS', 'PUBLISH', 'TOOLS'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className="px-3 py-2 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 transition"
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="mt-5 space-y-3">
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-[12px] bg-black/20 border border-white/5 hover:border-white/15 transition"
                >
                  <div className="relative h-14 w-14 overflow-hidden rounded-[12px] bg-slate-900">
                    <img
                      src={`https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=400&q=60&sig=${idx}`}
                      alt={`Highlight ${idx}`}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white/90 line-clamp-1">Featured Cut #{idx}</p>
                    <p className="text-[11px] text-white/60 line-clamp-1">Midjourney · Stable Diffusion · Filmic LUTs</p>
                  </div>
                  <div className="text-[11px] font-bold px-3 py-1 rounded-full text-black" style={{ backgroundColor: ACCENT }}>
                    NEW
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Rails */}
      <div className="mt-6">
        {RAILS.map((rail) => (
          <RailRow key={rail.id} {...rail} />
        ))}
      </div>

      {/* Explore CTA */}
      <div className="mt-10 text-center">
        <div className="inline-flex flex-col items-center gap-3 px-6 py-5 rounded-[16px] border border-white/10 bg-black/30">
          <span className="text-sm font-semibold" style={{ color: ACCENT }}>EXPLORE MORE AI FEATURES</span>
          <div className="flex gap-2 text-[11px] text-white/70 flex-wrap justify-center max-w-4xl">
            {['AI CINEMA', 'AI FACES', 'AI MAGIC', 'AI CITIES', 'AI ENVIRONMENTS', 'AI LANDS', 'AI AVATAR', 'AI TOOLS'].map((chip) => (
              <span
                key={chip}
                className="px-3 py-1 rounded-full border border-white/10 bg-white/5"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
