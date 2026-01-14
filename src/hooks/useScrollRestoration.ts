import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface ScrollPosition {
  x: number;
  y: number;
}

const scrollPositions = new Map<string, ScrollPosition>();

function getScrollableContainer(): HTMLElement | Window {
  if (typeof document === 'undefined') return window;

  // In this app, html/body overflow is hidden and the primary scroll container
  // is the layout element with id="main-content".
  const main = document.getElementById('main-content');
  if (main) return main;

  const candidates: Array<HTMLElement | null> = [document.getElementById('root')];

  for (const el of candidates) {
    if (!el) continue;
    try {
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY;
      const canScroll = el.scrollHeight > el.clientHeight;
      if (canScroll || overflowY === 'auto' || overflowY === 'scroll') {
        return el;
      }
    } catch {
      // ignore
    }
  }

  return window;
}

function getScrollPosition(container: HTMLElement | Window): ScrollPosition {
  if (container === window) {
    return { x: window.scrollX, y: window.scrollY };
  }
  return { x: container.scrollLeft, y: container.scrollTop };
}

function setScrollPosition(container: HTMLElement | Window, pos: ScrollPosition) {
  if (container === window) {
    window.scrollTo(pos.x, pos.y);
    return;
  }
  container.scrollLeft = pos.x;
  container.scrollTop = pos.y;
}

/**
 * Hook to preserve scroll position when navigating between pages
 * Usage: Add `useScrollRestoration()` to any page component
 */
export function useScrollRestoration() {
  const location = useLocation();

  useEffect(() => {
    const key = `${location.pathname}${location.search}`;
    const container = getScrollableContainer();
    
    // Restore scroll position when route changes
    const saved = scrollPositions.get(key);
    if (saved) {
      // Restoration can race with layout changes (e.g., main-content overflow toggling)
      // and with async content (Home data). Retry a few times.
      let raf1 = 0;
      let raf2 = 0;
      const timeouts: number[] = [];

      const attemptRestore = () => {
        try {
          setScrollPosition(container, saved);
        } catch {
          // ignore
        }
      };

      raf1 = window.requestAnimationFrame(() => {
        raf2 = window.requestAnimationFrame(attemptRestore);
      });

      // Extra retries for stability.
      for (const ms of [32, 80, 160, 320]) {
        timeouts.push(window.setTimeout(attemptRestore, ms));
      }

      return () => {
        if (raf1) window.cancelAnimationFrame(raf1);
        if (raf2) window.cancelAnimationFrame(raf2);
        timeouts.forEach((id) => window.clearTimeout(id));
      };
    } else {
      // New route - scroll to top
      setScrollPosition(container, { x: 0, y: 0 });
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    const key = `${location.pathname}${location.search}`;
    const container = getScrollableContainer();

    // Save scroll position continuously as user scrolls
    const handleScroll = () => {
      scrollPositions.set(key, getScrollPosition(container));
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Save once immediately so a quick navigate-back restores correctly.
    handleScroll();

    const target: any = container === window ? window : (container as HTMLElement);
    target.addEventListener('scroll', throttledScroll, { passive: true });
    
    return () => {
      target.removeEventListener('scroll', throttledScroll);
      // Do not "final save" here.
      // Route changes can temporarily clamp scrollTop (e.g., overflow toggles),
      // which would overwrite the real last-known position.
    };
  }, [location.pathname, location.search]);
}
