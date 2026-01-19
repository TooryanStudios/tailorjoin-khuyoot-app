import React from 'react'
import { useThumbnail } from '../src/hooks/useThumbnailCache'

type StableImageProps = {
  src: string | null | undefined
  alt: string
  aspectClass?: string
  className?: string
  imgClassName?: string
}

/**
 * 🚀 High-Performance Persistent Image
 * Uses the Unified Blob Cache to prevent flickering and layout shifts.
 * Once an image is loaded, it remains as a Blob URL for instant access elsewhere.
 */
export const StableImage = React.memo(function StableImage({ src, alt, aspectClass = 'aspect-[3/4]', className = '', imgClassName = '' }: StableImageProps) {
  // Use the global high-performance cache
  const cachedSrc = useThumbnail(src, { maxEntries: 300 });

  const [loaded, setLoaded] = React.useState(false)

  // Determine if it's already a blob (cached)
  const isBlob = cachedSrc?.startsWith('blob:');

  return (
    <div className={`relative w-full ${aspectClass} bg-slate-100 dark:bg-slate-900/50 overflow-hidden ${className}`}>
      {cachedSrc ? (
        <img
          src={cachedSrc}
          alt={alt}
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-300 ${isBlob || loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105 blur-sm'} ${imgClassName}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
        />
      ) : null}
      
      {/* Loading Skeleton if no source or not yet blobbed */}
      {!isBlob && !loaded && src && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent animate-shimmer" />
      )}
    </div>
  )
})
