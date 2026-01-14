import React from 'react';
import { useRevealOnScroll } from '../hooks/useRevealOnScroll';
import { useNearViewport } from '../hooks/useNearViewport';
import { useImageLoader } from '../hooks/useImageLoader';
import { SkeletonShimmer } from './SkeletonShimmer';

export type DiscoveryCardData = {
  id: string;
  title: string;
  mediaUrl: string;
  type: 'video' | 'image';
};

export function DiscoveryCard(props: {
  data: DiscoveryCardData;
  onClick: () => void;
  radiusPx?: number;
  mediaAspectRatio?: string;
}) {
  const { data, onClick, radiusPx, mediaAspectRatio } = props;
  const { ref, isRevealed } = useRevealOnScroll<HTMLDivElement>();
  const { ref: nearRef, isNear } = useNearViewport<HTMLDivElement>({ rootMargin: '500px 0px', once: true });
  const { isLoaded } = useImageLoader(data.type === 'image' ? data.mediaUrl : null);

  return (
    <div ref={(node) => {
      (ref as any).current = node;
      (nearRef as any).current = node;
    }}>
      <button
        type="button"
        onClick={onClick}
        style={typeof radiusPx === 'number' ? ({ borderRadius: radiusPx } as React.CSSProperties) : undefined}
        className={
          `relative group w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl text-left transition-all duration-500 ` +
          (isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[30px]')
        }
      >
        <div
          className={`${mediaAspectRatio ? '' : 'aspect-[3/4] '}w-full overflow-hidden`}
          style={mediaAspectRatio ? ({ aspectRatio: mediaAspectRatio } as React.CSSProperties) : undefined}
        >
          {data.type === 'video' ? (
            isNear ? (
              <video
                src={data.mediaUrl}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            ) : (
              <SkeletonShimmer className="w-full h-full" />
            )
          ) : (
            <>
              {!isLoaded ? <SkeletonShimmer className="w-full h-full" /> : null}
              <img
                src={data.mediaUrl}
                className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${
                  isLoaded ? 'opacity-100' : 'opacity-0'
                } transition-opacity duration-500`}
                loading="lazy"
                decoding="async"
                alt={data.title}
                draggable={false}
              />
            </>
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-[#1A0B2E] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <span className="text-[color:var(--theme-secondary)] font-bold tracking-wide uppercase text-sm">{data.title}</span>
        </div>
      </button>
    </div>
  );
}
