import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MontHeader } from '../../components/MontHeader';
import { Footer } from '../components/Footer';

const MONT_HEADER_ID = 'khuyoot-mont-header';

function useIsMobile(maxWidthPx = 640) {
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
  const location = useLocation();
  const pathname = location.pathname;
  const isDesignerRoute = pathname.startsWith('/designer-v2-1');
  const isMobile = useIsMobile();
  const isTailorOrdersRoute = pathname.startsWith('/tailor/orders');
  const isTailorCollectionsRoute = pathname.startsWith('/tailor/collections');
  const isTailorDashboardRoute = pathname.startsWith('/tailor-dashboard');
  const isTransactionHistoryRoute = pathname.startsWith('/transaction-history');
  const isFamilyMeasurementsRoute = pathname.startsWith('/family-measurements');
  const isOrdersRoute = pathname.startsWith('/orders');
  const isRegionsRoute = pathname.startsWith('/regions');

  // Check if we are on the tailor profile page (e.g. /tailor/123) but NOT on tailor admin pages
  const isTailorProfile = pathname.startsWith('/tailor/') && 
    !isTailorCollectionsRoute && 
    !isTailorOrdersRoute && 
    !pathname.startsWith('/tailor/product');

  // Check if we are on the product details page
  const isProductDetails = pathname.startsWith('/product/');

  // For mobile: hide header on designer, tailor profile, and product details pages
  // For mobile tailor profile and product details, hide only the header but keep the footer
  // UPDATED: Hide header on ALL mobile pages
  // ALSO: Hide header for Tailor Orders and Account as they use MontHeader
  const hideHeader = isMobile || isDesignerRoute || isTailorOrdersRoute || isTailorCollectionsRoute || isTailorDashboardRoute || pathname.startsWith('/account') || isTransactionHistoryRoute || isFamilyMeasurementsRoute || isOrdersRoute || isRegionsRoute;
  const hideAccountChrome = pathname.startsWith('/account') && !isMobile;
  const hideChrome = pathname.startsWith('/designer-v2-1') || isTailorOrdersRoute || isTailorCollectionsRoute || hideAccountChrome || isTransactionHistoryRoute || isFamilyMeasurementsRoute || isOrdersRoute || isRegionsRoute;

  React.useLayoutEffect(() => {
    if (hideHeader) {
      document.documentElement.style.setProperty('--header-height', '0px');
      return;
    }

    const setHeaderHeight = () => {
      const headerEl = document.getElementById(MONT_HEADER_ID);
      if (!headerEl) return;
      const h = Math.ceil(headerEl.getBoundingClientRect().height || 0);
      document.documentElement.style.setProperty('--header-height', `${h}px`);
    };

    setHeaderHeight();
    window.addEventListener('resize', setHeaderHeight);
    return () => {
      window.removeEventListener('resize', setHeaderHeight);
    };
  }, [hideHeader]);

  return (
    <div className="app-shell">
      {!hideHeader && (
        <>
          <MontHeader />
          <div aria-hidden="true" className="pointer-events-none shrink-0 h-[var(--header-height)]" />
        </>
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
