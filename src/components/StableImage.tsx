import React from 'react'

type StableImageProps = {
  src: string | null | undefined
  alt: string
  aspectClass?: string
  className?: string
  imgClassName?: string
}

// Renders a reserved box with a fade-in image once decoded
export const StableImage = React.memo(function StableImage({ src, alt, aspectClass = 'aspect-[3/4]', className = '', imgClassName = '' }: StableImageProps) {
  const [loaded, setLoaded] = React.useState(false)

  return (
    <div className={`relative w-full ${aspectClass} bg-slate-100 dark:bg-slate-900 overflow-hidden ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
        />
      ) : null}
    </div>
  )
})
