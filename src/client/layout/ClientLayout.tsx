
import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useOutlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { AuthModal } from '../../../components/AuthModal';
import { LoadingShell } from '../../components/LoadingShell';
import { useApp } from '../../../context/AppContext';
import { useVisualViewportHeight } from '../../hooks/useVisualViewportHeight';
import { useScrollRestoration } from '../../hooks/useScrollRestoration';
import { ADMIN_CONFIG_QUERY_KEY, fetchAdminConfig } from '../../lib/adminConfig';

/**
 * ClientLayout
 *
 * Key change vs old version:
 * - NO global scan/removal of arbitrary fixed overlays.
 * - Only cleans overlays that are explicitly tagged as ours: data-overlay="khuyoot-modal"
 * - Only resets body scroll lock if we previously locked it (data-scroll-locked="1")
 */
export const ClientLayout: React.FC = () => {
  const location = useLocation();
  const outlet = useOutlet();
  const { user, appSettings } = useApp();

  // Preserve window scroll positions across SPA navigation.
  // Uses module-level Map so positions persist even if ClientLayout unmounts.
  useScrollRestoration();

  const { data: config, isLoading: isConfigLoading } = useQuery({
    queryKey: ADMIN_CONFIG_QUERY_KEY,
    queryFn: fetchAdminConfig,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const isAdmin = user?.role === 'admin';
  const isProductRoute = location.pathname.startsWith('/product/');
  const hideHeader =
    location.pathname.startsWith('/kling') ||
    location.pathname.startsWith('/designer-v2-1');
  const isFullBleedRoute =
    location.pathname.startsWith('/kling') ||
    location.pathname.startsWith('/designer-v2-1') ||
    isProductRoute;
  const isHomeRoute = location.pathname === '/';
  const isDesignerRoute = location.pathname === '/designer' || location.pathname.startsWith('/designer/');
  const shouldCenterConstrain = !isFullBleedRoute && !isHomeRoute;

  // **MEMORY FIX: Keep ONLY ONE previous route alive to prevent DOM bloat**
  // Store only the previous non-Designer route to cache Home when in Designer
  const [cachedNode, setCachedNode] = useState<React.ReactNode | null>(null);
  const [cachedRouteType, setCachedRouteType] = useState<'home' | 'other' | null>(null);

  useVisualViewportHeight();

  // Ensure React Router controls scroll restoration (avoid browser restoring to a stale position).
  useEffect(() => {
    try {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
    } catch {
      // ignore
    }
  }, []);

  // Cache the current outlet based on route
  useEffect(() => {
    if (!outlet) return;
    
    if (isHomeRoute) {
      setCachedNode(outlet);
      setCachedRouteType('home');
    } else if (!isDesignerRoute) {
      setCachedNode(outlet);
      setCachedRouteType('other');
    }
  }, [isHomeRoute, isDesignerRoute, outlet]);

  useEffect(() => {
    try {
      // Only reset body styles if we previously locked scroll intentionally.
      // This prevents fighting legitimate modal/drawer scroll locks.
      const wasLockedByUs = document.body.getAttribute('data-scroll-locked') === '1';
      if (wasLockedByUs) {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.body.removeAttribute('data-scroll-locked');
      }

      // Only remove overlays that our app explicitly created and tagged.
      // This avoids deleting legitimate layers from components/libs/dev overlays.
      const overlays = Array.from(
        document.querySelectorAll<HTMLElement>('[data-overlay="khuyoot-modal"]')
      );

      overlays.forEach((el) => {
        // Never remove anything inside the auth modal root
        const ownedByAuth = !!el.closest('[data-auth-modal-root]');
        if (!ownedByAuth) {
          el.remove();
        }
      });
    } catch {
      // ignore
    }
  }, [location.pathname, location.search, location.hash]);

  // **CRITICAL: Block render until site config is loaded**
  // AppInitializer already loads initial config into AppContext.
  // If the query fails (e.g. after login/logout), fall back to AppContext settings
  // instead of showing a permanent LoadingShell (blank page).
  const effectiveConfig = config ?? appSettings;
  // Must be AFTER all hooks to comply with React rules
  if (isConfigLoading && !effectiveConfig) {
    return <LoadingShell />;
  }

  // Determine visibility (exclusive render): only mount when explicitly allowed
  const shouldShowHeader = !hideHeader && effectiveConfig?.showHeader !== false;
  const shouldShowFooter = effectiveConfig?.showFooter !== false;

  return (
    <div
      className="app-shell bg-slate-50 dark:bg-[#050817] text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500/30"
      style={{ height: 'var(--app-height)' }}
    >
      <main
        id="main-content"
        className="main-content w-full mx-0 relative"
        style={isFullBleedRoute ? { overflow: 'hidden', paddingBottom: 0 } : undefined}
      >
        {/* Header - shown when enabled in settings */}
        {shouldShowHeader && <Header />}

        <div className={isFullBleedRoute ? '' : 'pt-3'}>
          {shouldCenterConstrain ? (
            <div className="md:max-w-7xl mx-auto">
              {/* Hidden cached Home - shows only when navigating from Designer back to home */}
              {cachedRouteType === 'home' && !isHomeRoute && (
                <div style={{ display: 'none', height: 0, overflow: 'hidden' }} aria-hidden data-kept-alive="home">
                  {cachedNode}
                </div>
              )}

              {/* Render current route OR cached route */}
              {isHomeRoute && cachedRouteType === 'home' ? (
                <div className="w-full" style={{ display: 'block' }}>
                  {cachedNode}
                </div>
              ) : isDesignerRoute ? (
                <div className="w-full h-full" style={{ display: 'block' }}>
                  <Outlet />
                </div>
              ) : (
                <Outlet />
              )}
            </div>
          ) : (
            <>
              {/* Hidden cached Home - shows only when navigating from Designer back to home */}
              {cachedRouteType === 'home' && !isHomeRoute && (
                <div style={{ display: 'none', height: 0, overflow: 'hidden' }} aria-hidden data-kept-alive="home">
                  {cachedNode}
                </div>
              )}

              {/* Render current route OR cached route */}
              {isHomeRoute && cachedRouteType === 'home' ? (
                <div className="w-full" style={{ display: 'block' }}>
                  {cachedNode}
                </div>
              ) : isDesignerRoute ? (
                <div className="w-full h-full" style={{ display: 'block' }}>
                  <Outlet />
                </div>
              ) : (
                <Outlet />
              )}
            </>
          )}
        </div>
      </main>

      {shouldShowFooter && (
        <div className="app-footer">
          <Footer />
        </div>
      )}

      {/* Mark root for overlay ownership checks */}
      <div data-auth-modal-root>
        <AuthModal />
      </div>
    </div>
  );
};

export default ClientLayout;


