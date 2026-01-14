import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FeatureCard, FeatureCardData, FeatureCardDimensions } from './FeatureCard';

export interface CardGridSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  cards: FeatureCardData[];
  cardDimensions?: FeatureCardDimensions;
  layout?: 'scroll' | 'grid';
  gridCols?: string; // e.g., 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
  gap?: string;      // e.g., 'gap-3', 'gap-4'
  showArrows?: boolean;
  enabled?: boolean;
  className?: string;
  headerClassName?: string;
  dir?: 'ltr' | 'rtl';
}

export const CardGridSection: React.FC<CardGridSectionProps> = ({
  id,
  title,
  subtitle,
  cards,
  cardDimensions,
  layout = 'scroll',
  gridCols = 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
  gap = 'gap-3',
  showArrows = true,
  enabled = true,
  className = '',
  headerClassName = '',
  dir = 'ltr',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!enabled || cards.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    const newScroll = direction === 'left'
      ? scrollRef.current.scrollLeft - scrollAmount
      : scrollRef.current.scrollLeft + scrollAmount;
    scrollRef.current.scrollTo({ left: newScroll, behavior: 'smooth' });
  };

  return (
    <section id={id} className={`${className}`} dir={dir}>
      {/* Header */}
      <div className={`flex items-end justify-between mb-3 ${headerClassName}`}>
        <div>
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
          )}
        </div>

        {/* Scroll Arrows */}
        {layout === 'scroll' && showArrows && cards.length > 3 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Cards Container */}
      {layout === 'scroll' ? (
        <div
          ref={scrollRef}
          className={`flex ${gap} overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent scroll-smooth`}
        >
          {cards.map((card) => (
            <FeatureCard
              key={card.id}
              card={card}
              dimensions={cardDimensions}
            />
          ))}
        </div>
      ) : (
        <div className={`grid ${gridCols} ${gap}`}>
          {cards.map((card) => (
            <FeatureCard
              key={card.id}
              card={card}
              dimensions={{ ...cardDimensions, width: 'w-full' }}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default CardGridSection;
