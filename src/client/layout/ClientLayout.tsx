
import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { AuthModal } from '../../../components/AuthModal';
import { useApp } from '../../../context/AppContext';

export const ClientLayout = () => {
  // Debug log removed
  const location = useLocation();
  const { user } = useApp();
  const isAdmin = user?.role === 'admin';

  // Defensive cleanup: remove any stuck full-screen overlays and restore body styles
  useEffect(() => {
    try {
      // Reset any body locks left by modals
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';

      const nodes = Array.from(document.querySelectorAll('div')) as HTMLElement[];
      const overlays = nodes.filter((el) => {
        const style = window.getComputedStyle(el);
        const cls = String(el.className || '');
        const isFixed = style.position === 'fixed';
        const coversScreen =
          cls.includes('inset-0') ||
          (style.top === '0px' && style.left === '0px' && style.right === '0px' && style.bottom === '0px');
        const looksLikeOverlay = cls.includes('bg-black') || cls.includes('bg-slate-900') || cls.includes('backdrop-blur') || el.getAttribute('data-overlay') === 'khuyoot-modal';
        const hasHighZ = /z-\[?\d+\]?/.test(cls) || (parseInt(style.zIndex || '0', 10) >= 70);
        return isFixed && coversScreen && looksLikeOverlay && hasHighZ;
      });

      overlays.forEach((el) => {
        // Skip legitimate overlays that belong to an open AuthModal
        const ownedByAuth = !!el.closest('[data-auth-modal-root]');
        if (!ownedByAuth) {
          el.parentElement?.removeChild(el);
        }
      });
    } catch {}
  }, [location.pathname, location.search, location.hash]);
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050817] text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500/30 transition-colors duration-300">
      <Header />
      {/* Global Under-Development Banner */}
      {!isAdmin && (
        <div className="w-full bg-amber-100 border-y border-amber-300 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700">
          <div className="max-w-7xl mx-auto px-4 py-3 text-center text-sm font-bold">
            🚧 هذا الموقع لا يزال قيد التطوير والاختبار. نشكركم على تفهّمكم.
          </div>
        </div>
      )}
      <main id="main-content" className="w-full max-w-7xl mx-auto min-h-[85vh] relative pb-[calc(74px+env(safe-area-inset-bottom))]">
         <Outlet />
      </main>
      <Footer />
      {/* Mark root for overlay detection */}
      <div data-auth-modal-root>
        <AuthModal />
      </div>
    </div>
  );
};
