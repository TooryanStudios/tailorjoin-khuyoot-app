import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MontHeader } from '../components/MontHeader';
import { useMobileDetection } from '../modules/designer/mobile';

/**
 * AppLayout - Persistent layout wrapper with shared header
 * This component wraps all routes and provides a single MontHeader instance
 * that persists across route changes, implementing proper SPA behavior.
 */
export const AppLayout: React.FC = () => {
  const location = useLocation();
  const isMobile = useMobileDetection();
  const isTryOnRoute = location.pathname.startsWith('/tryon') || location.pathname.startsWith('/designer-v2-1');
  const hideHeader = isMobile && isTryOnRoute;

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden">
      {/* Persistent Header - hidden on mobile TryOn */}
      {!hideHeader && <MontHeader />}
      
      {/* Main Content Area - Routes render here */}
      <main
        className={[
          'flex-1 overflow-hidden',
          hideHeader ? 'pt-[calc(env(safe-area-inset-top)+24px)]' : '',
        ].join(' ')}
      >
        <Outlet />
      </main>
    </div>
  );
};
