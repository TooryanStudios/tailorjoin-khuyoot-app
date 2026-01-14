import React from 'react';

export interface FeatureCardData {
  id: string;
  image: string;
  title: string;
  description?: string;
  badge?: {
    text: string;
    variant: 'new' | 'top' | 'hot' | 'custom';
    color?: string;
  };
  onClick?: () => void;
}

export interface FeatureCardDimensions {
  width?: string;      // e.g., 'w-48', 'w-64', 'w-full'
  aspectRatio?: string; // e.g., 'aspect-[4/5]', 'aspect-square', 'aspect-video'
  imageHeight?: string; // e.g., 'h-40', 'h-52'
}

interface FeatureCardProps {
  card: FeatureCardData;
  dimensions?: FeatureCardDimensions;
  className?: string;
}

const badgeColors = {
  new: 'bg-lime-400 text-slate-900',
  top: 'bg-pink-500 text-white',
  hot: 'bg-orange-500 text-white',
  custom: '',
};

export const FeatureCard: React.FC<FeatureCardProps> = ({
  card,
  dimensions,
  className = '',
}) => {
  const width = dimensions?.width ?? 'w-48';
  const aspectRatio = dimensions?.aspectRatio ?? 'aspect-[4/5]';

  return (
    <button
      type="button"
      onClick={card.onClick}
      className={`group flex-shrink-0 text-left ${width} ${className}`}
    >
      {/* Image Container */}
      <div className={`relative ${aspectRatio} rounded-xl overflow-hidden bg-white/[0.02] border border-white/5 transition-all group-hover:border-white/20 group-hover:scale-[1.02]`}>
        {card.image ? (
          <img
            src={card.image}
            alt={card.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-slate-600">No image</span>
          </div>
        )}

        {/* Badge */}
        {card.badge && (
          <div className="absolute bottom-2 left-2">
            <span
              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                card.badge.variant === 'custom' && card.badge.color
                  ? card.badge.color
                  : badgeColors[card.badge.variant]
              }`}
            >
              {card.badge.text}
            </span>
          </div>
        )}
      </div>

      {/* Text Content */}
      <div className="mt-2 px-0.5">
        <h4 className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
          {card.title}
        </h4>
        {card.description && (
          <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
            {card.description}
          </p>
        )}
      </div>
    </button>
  );
};

export default FeatureCard;
