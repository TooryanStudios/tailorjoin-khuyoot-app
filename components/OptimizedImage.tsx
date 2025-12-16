import React, { useState, useRef, useEffect } from 'react';
import { ImageIcon } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  thumbnailSrc?: string; // صورة مصغرة للتحميل السريع
  sizes?: {
    thumbnail?: string;
    medium?: string;
    full?: string;
  };
  priority?: boolean; // تحميل فوري بدون lazy loading
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * مكون صورة محسّن مع:
 * - Lazy Loading تلقائي
 * - Progressive Loading (blur placeholder)
 * - Responsive Images
 * - Error Handling
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  thumbnailSrc,
  sizes,
  priority = false,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority); // إذا كانت priority، حمّل فوراً
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer للـ Lazy Loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px' // تحميل الصورة قبل ظهورها بـ 50px
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // اختيار الصورة المناسبة بناءً على حجم الشاشة
  const getResponsiveSrc = () => {
    if (sizes) {
      // يمكن تحسين هذا بناءً على حجم الشاشة
      return sizes.medium || sizes.full || src;
    }
    return src;
  };

  const imageSrc = getResponsiveSrc();

  return (
    <div 
      ref={imgRef} 
      className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 ${className}`}
    >
      {/* Placeholder أثناء التحميل */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          {thumbnailSrc ? (
            <img
              src={thumbnailSrc}
              alt={alt}
              className="absolute inset-0 w-full h-full object-cover blur-sm scale-110"
            />
          ) : (
            <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-600" />
          )}
          
          {/* Loading animation */}
          <div className="absolute inset-0 bg-slate-200/50 dark:bg-slate-700/50 animate-pulse" />
        </div>
      )}

      {/* الصورة الفعلية */}
      {isInView && !hasError && (
        <img
          src={imageSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={`
            w-full h-full object-cover transition-opacity duration-500
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
          `}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800">
          <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-600" />
          <p className="text-xs text-slate-400 dark:text-slate-500">فشل تحميل الصورة</p>
        </div>
      )}
    </div>
  );
};

/**
 * مكون صورة أفاتار محسّن
 */
export const Avatar: React.FC<{
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ src, name, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-xl'
  };

  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (!src) {
    return (
      <div 
        className={`
          ${sizeClasses[size]} 
          rounded-full bg-gradient-to-br from-blue-500 to-purple-600 
          flex items-center justify-center text-white font-bold
          ${className}
        `}
      >
        {initials}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={name}
      className={`${sizeClasses[size]} rounded-full ${className}`}
      priority={true} // الأفاتار عادة مرئي فوراً
    />
  );
};
