import * as React from 'react';

export function useNearViewport<T extends Element>(opts?: {
  rootMargin?: string;
  threshold?: number;
  once?: boolean;
}) {
  const { rootMargin = '500px 0px', threshold = 0.01, once = true } = opts ?? {};
  const ref = React.useRef<T | null>(null);
  const [isNear, setIsNear] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setIsNear(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsNear(false);
        }
      },
      { root: null, rootMargin, threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, threshold, once]);

  return { ref, isNear } as const;
}
