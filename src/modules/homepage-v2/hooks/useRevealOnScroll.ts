import * as React from 'react';

export function useRevealOnScroll<T extends Element>(opts?: { rootMargin?: string }) {
  const { rootMargin = '0px 0px -10% 0px' } = opts ?? {};
  const ref = React.useRef<T | null>(null);
  const [isRevealed, setIsRevealed] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setIsRevealed(true);
          observer.disconnect();
        }
      },
      { root: null, rootMargin, threshold: 0.05 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, isRevealed } as const;
}
