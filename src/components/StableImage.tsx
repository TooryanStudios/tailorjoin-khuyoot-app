import React, { useState } from 'react';
import { ShoppingBag } from 'lucide-react';

interface StableImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
  imgClassName?: string;
}

export const StableImage: React.FC<StableImageProps> = ({ 
  src, 
  alt, 
  className, 
  imgClassName, 
  ...props 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 ${className || ''}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-600 animate-pulse">
           <ShoppingBag size={24} className="opacity-20" />
        </div>
      )}
      
      {!error ? (
        <img
          src={src}
          alt={alt}
          className={`transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'} ${imgClassName || 'w-full h-full object-cover'}`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError(true);
          }}
          loading="lazy"
          decoding="async"
          {...props}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-600">
           <ShoppingBag size={32} className="opacity-20" />
        </div>
      )}
    </div>
  );
};
