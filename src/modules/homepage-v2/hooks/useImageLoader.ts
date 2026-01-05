import * as React from 'react';

export function useImageLoader(src?: string | null) {
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!src) {
      setIsLoaded(false);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (!cancelled) setIsLoaded(true);
    };
    img.onerror = () => {
      if (!cancelled) setIsLoaded(false);
    };
    setIsLoaded(false);
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  return { isLoaded } as const;
}
