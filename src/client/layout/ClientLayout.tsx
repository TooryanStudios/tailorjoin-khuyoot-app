import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

function useIsMobile(maxWidthPx = 768) {
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.(`(max-width: ${maxWidthPx}px)`)?.matches ?? false;
  });

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia(`(max-width: ${maxWidthPx}px)`);
    const onChange = () => setIsMobile(mq.matches);
    onChange();

    // Older Safari uses addListener/removeListener.
    // eslint-disable-next-line deprecation/deprecation
    mq.addEventListener ? mq.addEventListener('change', onChange) : mq.addListener(onChange);
    return () => {
      // eslint-disable-next-line deprecation/deprecation
      mq.removeEventListener ? mq.removeEventListener('change', onChange) : mq.removeListener(onChange);
    };
  }, [maxWidthPx]);

  return isMobile;
}

export const ClientLayout: React.FC = () => {
  const headerRef = React.useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const pathname = location.pathname;
  const isDesignerRoute = pathname.startsWith('/designer-v2-1');
  const isMobile = useIsMobile();

  // For Designer 2.1 on mobile, we want a fullscreen canvas (no global chrome).
  const hideChrome = isMobile && pathname.startsWith('/designer-v2-1');

  React.useLayoutEffect(() => {
    if (hideChrome) {
      document.documentElement.style.setProperty('--header-height', '0px');
      return;
    }

    const el = headerRef.current;
    if (!el) return;

    const setHeaderHeight = () => {
      const h = Math.ceil(el.getBoundingClientRect().height || 0);
      document.documentElement.style.setProperty('--header-height', `${h}px`);
    };

    setHeaderHeight();
    const ro = new ResizeObserver(setHeaderHeight);
    ro.observe(el);

    window.addEventListener('resize', setHeaderHeight);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', setHeaderHeight);
    };
  }, [hideChrome]);

  return (
    <div className="app-shell">
      {!hideChrome && (
        <div ref={headerRef}>
          <Header />
        </div>
      )}

      <main
        id="main-content"
        className={`main-content${isDesignerRoute ? ' no-scroll' : ''}${hideChrome ? ' no-footer' : ''}`}
      >
        <Outlet />
      </main>

      {!hideChrome && <Footer />}
    </div>
  );
};

export default ClientLayout;
