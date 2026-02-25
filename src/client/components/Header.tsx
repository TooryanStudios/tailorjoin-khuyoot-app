import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, LogOut, Moon, Sun, Scissors, ShoppingCart, Package, ClipboardList, Store, PackageOpen, Box, Menu, X, Bell, Download, User, ChevronDown, SquareSplitHorizontal, LayoutDashboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../../context/AppContext';
import { designService } from '../../../services/designService';
import { firebaseService } from '../../../services/firebase';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { requestNotificationPermission, showLocalTestNotification, isNotificationSupported } from '../../../utils/notifications';
import { setLanguage } from '../../i18n/i18n';
import { UserAvatar } from '../../components/common/UserAvatar';

const HeaderComponent = () => {
  const { i18n, t } = useTranslation('common');
  const { user, loading, logout, toggleAuthModal, theme, toggleTheme, cartCount, ordersCount, appSettings } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { showInstallButton, isInstalled, promptInstall } = usePWAInstall();
  const [designsCount, setDesignsCount] = useState<number>(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [langMenuAlign, setLangMenuAlign] = useState<'left' | 'right'>('left');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const langButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const userMenuRef = React.useRef<HTMLDivElement | null>(null);

  const hasAdminAccess = useMemo(() => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const accessMode = user.adminAccess?.mode;
    const permissionsMode = user.adminPermissions?.mode;
    return accessMode === 'full' || accessMode === 'limited' || permissionsMode === 'full' || permissionsMode === 'limited';
  }, [user]);

  const activeLang = React.useMemo(() => {
    const lower = (i18n.language || 'ar').toLowerCase();
    if (lower.startsWith('ar')) return 'ar';
    if (lower.startsWith('fr')) return 'fr';
    return 'en';
  }, [i18n.language]);

  const languageBadgeClassName =
    'inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full border text-[10px] font-extrabold leading-none';

  const languageOptions = useMemo(
    () =>
      [
        {
          code: 'ar' as const,
          label: t('arabic'),
          icon: (
            <span
              aria-hidden
              className={`${languageBadgeClassName} bg-theme-primary/10 text-theme-primary border-theme-primary/30 dark:bg-theme-primary/20 dark:text-theme-primary dark:border-theme-primary/40`}
            >
              ع
            </span>
          ),
        },
        {
          code: 'en' as const,
          label: t('english'),
          icon: (
            <span
              aria-hidden
              className={`${languageBadgeClassName} bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-200 dark:border-slate-700`}
            >
              EN
            </span>
          ),
        },
        {
          code: 'fr' as const,
          label: t('french'),
          icon: (
            <span
              aria-hidden
              className={`${languageBadgeClassName} bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800/60`}
            >
              FR
            </span>
          ),
        },
      ],
    [languageBadgeClassName, t]
  );

  const activeLangOption = useMemo(() => {
    return languageOptions.find((o) => o.code === activeLang);
  }, [activeLang, languageOptions]);

  const computeLangMenuAlign = React.useCallback(() => {
    const btn = langButtonRef.current;
    if (!btn || typeof window === 'undefined') return;

    const rect = btn.getBoundingClientRect();
    const viewportWidth = window.innerWidth || 0;
    const menuWidth = 128; // w-32
    const padding = 12;

    const canOpenToRight = rect.left + menuWidth <= viewportWidth - padding; // left-0
    const canOpenToLeft = rect.right - menuWidth >= padding; // right-0

    if (canOpenToRight && !canOpenToLeft) {
      setLangMenuAlign('left');
      return;
    }

    if (!canOpenToRight && canOpenToLeft) {
      setLangMenuAlign('right');
      return;
    }

    if (canOpenToRight && canOpenToLeft) {
      setLangMenuAlign('left');
      return;
    }

    // If both would clip, choose the side with less overflow.
    const overflowRight = rect.left + menuWidth - (viewportWidth - padding);
    const overflowLeft = padding - (rect.right - menuWidth);
    setLangMenuAlign(overflowLeft <= overflowRight ? 'right' : 'left');
  }, []);

  const activeLangLabel = useMemo(() => {
    const match = languageOptions.find((o) => o.code === activeLang);
    if (match?.label) return match.label;
    if (activeLang === 'ar') return t('arabic');
    if (activeLang === 'fr') return t('french');
    return t('english');
  }, [activeLang, languageOptions, t]);

  // Debounced designs count fetch to reduce repeated loads
  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setDesignsCount(0);
      return;
    }

    // Cache-first: show cached count immediately (prevents “late” badge on refresh)
    try {
      const raw = localStorage.getItem(`designs_${user.id}`);
      const arr = raw ? JSON.parse(raw) : [];
      if (Array.isArray(arr)) setDesignsCount(arr.length);
    } catch {
      // ignore
    }

    const t = setTimeout(async () => {
      if (cancelled) return;
      try {
        const list = await designService.listDesigns(user.id);
        if (!cancelled) {
          const safeList = Array.isArray(list) ? list : [];
          setDesignsCount(safeList.length);
          try {
            localStorage.setItem(`designs_${user.id}`, JSON.stringify(safeList));
          } catch {
            // ignore
          }
        }
      } catch (e) {
        console.warn('Failed to load designs count, using fallback', e);
        if (!cancelled) {
          try {
            const raw = localStorage.getItem(`designs_${user.id}`);
            const arr = raw ? JSON.parse(raw) : [];
            setDesignsCount(Array.isArray(arr) ? arr.length : 0);
          } catch {}
        }
      }
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [user?.id]);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Close language menu on route change
  useEffect(() => { setLangMenuOpen(false); }, [location.pathname]);

  // Close user menu on route change
  useEffect(() => { setUserMenuOpen(false); }, [location.pathname]);

  // Close language menu on outside click / escape
  useEffect(() => {
    if (!langMenuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLangMenuOpen(false);
    };

    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const root = target.closest('[data-lang-menu-root="true"]');
      if (!root) setLangMenuOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [langMenuOpen]);

  // Close user menu on outside click / escape
  useEffect(() => {
    if (!userMenuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false);
    };

    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Check if click is inside user menu
      if (userMenuRef.current && userMenuRef.current.contains(target)) return;
      setUserMenuOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [userMenuOpen]);

  // Recompute language menu alignment while open (resize/scroll)
  useEffect(() => {
    if (!langMenuOpen) return;
    computeLangMenuAlign();

    const onUpdate = () => computeLangMenuAlign();
    window.addEventListener('resize', onUpdate);
    window.addEventListener('scroll', onUpdate, { passive: true });
    return () => {
      window.removeEventListener('resize', onUpdate);
      window.removeEventListener('scroll', onUpdate as any);
    };
  }, [computeLangMenuAlign, langMenuOpen]);

  const isActive = (path: string) => location.pathname === path;
  const isDev = import.meta.env.DEV;

  const canShowHomeSection = (section: 'installButton' | 'notificationButton') => {
    const sectionSettings = (appSettings?.homeSections ?? {}) as Record<string, boolean | undefined>;
    const visibility = appSettings?.sectionVisibility?.[section];
    if (visibility?.adminOnly && user?.role !== 'admin') return false;
    return sectionSettings[section] ?? true;
  };

  const handleTestNotification = async () => {
    if (!isNotificationSupported()) {
      window.alert(t('notificationsNotSupported'));
      return;
    }

    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      showLocalTestNotification('خيوط - Khuyoot', t('notificationsEnabled'));
    } else if (permission === 'denied') {
      window.alert(t('notificationsDenied'));
    } else {
      window.alert(t('notificationsNotGranted'));
    }
  };

  const roleLinks = useMemo(() => {
    return {
      guest: [
        { id: 'designer', labelKey: 'navDesigner', path: '/designer-v2-1', icon: SquareSplitHorizontal },
        { id: 'pageB', labelKey: 'navPageB', path: '/page-b', icon: null },
        { id: 'collections', labelKey: 'navCollections', path: '/collections', icon: Package },
        { id: 'shops', labelKey: 'navShops', path: '/shops', icon: null },
        { id: 'tailors', labelKey: 'navTailors', path: '/tailors', icon: null },
        
      ],
      user: [
        { id: 'designer', labelKey: 'navDesigner', path: '/designer-v2-1', icon: SquareSplitHorizontal },
        { id: 'collections', labelKey: 'navCollections', path: '/collections', icon: Package },
        { id: 'tracking', labelKey: 'navTrackingOrders', path: '/orders', icon: ClipboardList },
        { id: 'tailors', labelKey: 'navTailors', path: '/tailors', icon: null },
      ],
      tailor: [
        { id: 'designer', labelKey: 'navDesigner', path: '/designer-v2-1', icon: SquareSplitHorizontal },
        { id: 'myProducts', labelKey: 'navMyProducts', path: '/tailor/collections', icon: Scissors },
        { id: 'orders', labelKey: 'orders', path: '/tailor/orders', icon: ClipboardList, badge: () => (ordersCount ?? 0) },
        { id: 'dashboard', labelKey: 'navDashboard', path: '/tailor-dashboard', icon: LayoutDashboard },
      ],
      boutique: [
        { id: 'designer', labelKey: 'navDesigner', path: '/designer-v2-1', icon: SquareSplitHorizontal },
        { id: 'pageB', labelKey: 'navPageB', path: '/page-b', icon: null },
        { id: 'orders', labelKey: 'orders', path: '/boutique/orders', icon: PackageOpen, badge: () => (ordersCount ?? 0) },
        { id: 'products', labelKey: 'navProducts', path: '/boutique-account', icon: null },
        { id: 'stats', labelKey: 'navStats', path: '/account', icon: null },
        
      ],
      shop: [
        { id: 'designer', labelKey: 'navDesigner', path: '/designer-v2-1', icon: SquareSplitHorizontal },
        { id: 'pageB', labelKey: 'navPageB', path: '/page-b', icon: null },
        { id: 'orders', labelKey: 'orders', path: '/shop/orders', icon: Store, badge: () => (ordersCount ?? 0) },
        { id: 'inventory', labelKey: 'navInventory', path: '/shop/inventory', icon: Box },
        { id: 'products', labelKey: 'navProducts', path: '/shop-account', icon: null },
        { id: 'sales', labelKey: 'navSales', path: '/account', icon: null },
        
      ],
      admin: [
        { id: 'designer', labelKey: 'navDesigner', path: '/designer-v2-1', icon: SquareSplitHorizontal },
        { id: 'adminDashboard', labelKey: 'navAdminDashboard', path: '/admin', icon: null },
        { id: 'adminUsers', labelKey: 'navAdminUsers', path: '/admin', icon: null },
        { id: 'adminOrders', labelKey: 'navAdminOrders', path: '/admin', icon: null },
        { id: 'adminSettings', labelKey: 'navAdminSettings', path: '/admin', icon: null },
      ],
    } as const;
  }, [designsCount, ordersCount, user]);

  return (
    <>
      {/* Skip to content for accessibility */}
      <a
        href="#main-content"
        dir="rtl"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-blue-600 text-white px-3 py-2 rounded-md"
      >
        {t('skipToContent')}
      </a>
      <header
        dir="rtl"
        className="sticky top-0 z-[1000] isolate bg-white/80 dark:bg-[#050817]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 py-3 px-4 transition-colors duration-300"
        role="banner"
      >
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          {/* Logo block - top left */}
          <div 
            className="flex items-center gap-3 shrink-0 cursor-pointer" 
            onClick={() => navigate('/')}
            aria-label={t('goToHome')}
          >
            <img 
              src="/logo_big.png" 
              alt="خيوط" 
              className="h-12 sm:h-16 w-auto object-contain"
            />
          </div>

          {/* Navigation Links - inline for admin and other roles */}
          {!(loading && !user) ? (
            <nav aria-label={t('mainNavigation')} className="hidden md:flex items-center gap-2">
              {(() => {
                // Determine role key - handle both legacy roles and new shopType model
                let role = user?.role ?? (user ? 'user' : 'guest');
                const shopType = (user as any)?.shopType;
                if (hasAdminAccess) role = 'admin';
                
                // If role is already boutique/shop, use it directly (legacy data)
                // Otherwise if tailor, check shopType
                if (user?.role === 'tailor' && shopType) {
                  if (shopType === 'boutique') role = 'boutique';
                  else if (shopType === 'shop' || shopType === 'fabric_store' || shopType === 'sewing_supplies') {
                    role = 'shop';
                  }
                }
                const links = roleLinks[role as keyof typeof roleLinks] ?? roleLinks.guest;
                
                return links.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => {
                      try {
                        console.log('Header navigate click', { labelKey: l.labelKey, path: l.path });
                      } catch {}
                      navigate(l.path);
                    }}
                    className={`text-xs font-medium transition-colors flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
                    } ${isActive(l.path) ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                    aria-current={isActive(l.path) ? 'page' : undefined}
                  >
                    {l.icon ? <l.icon size={14} /> : null}
                    {t(l.labelKey)}
                    {typeof l.badge === 'function' && l.badge() > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-blue-600 text-white text-[9px] font-semibold">
                        {l.badge()}
                      </span>
                    ) : null}
                  </button>
                ));
              })()}
            </nav>
          ) : null}

          {/* Empty space */}
          <div className="flex-1" />

          {/* Actions: Mobile menu + Role icons + Theme + Auth */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Mobile menu toggle */}
            <button
              aria-label={mobileOpen ? t('closeMenu') : t('openMenu')}
              onClick={() => setMobileOpen((v) => !v)}
              className="w-8 h-8 flex md:hidden items-center justify-center rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            {/* Utility buttons (not part of site content) */}
            {canShowHomeSection('installButton') && showInstallButton && !isInstalled && (
              <button
                onClick={promptInstall}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                title={t('addToHomeScreen')}
                aria-label={t('installApp')}
              >
                <Download size={18} />
              </button>
            )}

            {canShowHomeSection('notificationButton') && (
              <button
                onClick={handleTestNotification}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                title={isDev ? t('testNotificationsDev') : t('testNotifications')}
                aria-label={t('testNotifications')}
              >
                <Bell size={18} />
              </button>
            )}

            {/* Role-specific icons - allow cached user to render immediately */}
            {!(loading && !user) && (
              <>
                {/* Cart Icon - للمستخدمين العاديين والضيوف فقط */}
                {(!user || user.role === 'user') && (
                  <button 
                    onClick={() => navigate('/cart')}
                    className="relative w-8 h-8 flex items-center justify-center rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title={t('cart')}
                    aria-label={t('openCart')}
                  >
                    <ShoppingCart size={18} />
                    {(cartCount ?? 0) > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[9px] font-semibold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </button>
                )}

                {/* My Designs shortcut */}
                {(!user || user.role === 'user') && (
                  <button 
                    onClick={() => navigate('/designs')}
                    className="relative px-3 h-8 flex items-center gap-1 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title={t('myDesigns')}
                    aria-label={t('openMyDesigns')}
                  >
                    <span>{t('myDesigns')}</span>
                    {user && designsCount > 0 && (
                      <span className="bg-blue-600 text-white text-[9px] font-semibold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
                        {designsCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Orders Icon - للخياط */}
                {user?.role === 'tailor' && (
                  <button 
                    onClick={() => navigate('/tailor/orders')}
                    className="relative w-8 h-8 flex items-center justify-center rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title={t('orders')}
                    aria-label={t('tailorOrders')}
                  >
                    <ClipboardList size={18} />
                    {(ordersCount ?? 0) > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[9px] font-semibold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
                        {ordersCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Orders Icon - للبوتيك */}
                {user?.role === 'boutique' && (
                  <button 
                    onClick={() => navigate('/boutique/orders')}
                    className="relative w-8 h-8 flex items-center justify-center rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title={t('orders')}
                    aria-label={t('boutiqueOrders')}
                  >
                    <PackageOpen size={18} />
                    {(ordersCount ?? 0) > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[9px] font-semibold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
                        {ordersCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Orders Icon - للمحل */}
                {user?.role === 'shop' && (
                  <button 
                    onClick={() => navigate('/shop/orders')}
                    className="relative w-8 h-8 flex items-center justify-center rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title={t('orders')}
                    aria-label={t('shopOrders')}
                  >
                    <Store size={18} />
                    {(ordersCount ?? 0) > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[9px] font-semibold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
                        {ordersCount}
                      </span>
                    )}
                  </button>
                )}
              </>
            )}

            {/* Language Dropdown (Arabic first) */}
            <div className="relative" data-lang-menu-root="true">
              <button
                type="button"
                ref={langButtonRef}
                onClick={() => {
                  if (!langMenuOpen) computeLangMenuAlign();
                  setLangMenuOpen((v) => !v);
                }}
                className="h-8 px-3 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-bold inline-flex items-center gap-2"
                aria-label={t('language')}
                aria-haspopup="menu"
                aria-expanded={langMenuOpen}
                title={t('language')}
              >
                {activeLangOption?.icon ? activeLangOption.icon : null}
                <span className="truncate max-w-[92px]">{activeLangLabel}</span>
                <span aria-hidden className="text-[10px] opacity-70">▾</span>
              </button>

              {langMenuOpen && (
                <div
                  role="menu"
                  aria-label={t('language')}
                  className={
                    'absolute z-[1100] mt-2 w-32 max-w-[calc(100vw-16px)] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0b1020] shadow-xl overflow-hidden ' +
                    (langMenuAlign === 'right' ? 'right-0' : 'left-0')
                  }
                >
                  {languageOptions.map((opt) => {
                    const isActive = opt.code === activeLang;
                    return (
                      <button
                        key={opt.code}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setLanguage(opt.code);
                          setLangMenuOpen(false);
                        }}
                        className={
                          'w-full px-3 py-2 text-xs font-semibold text-right transition-colors ' +
                          (isActive
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200'
                            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800')
                        }
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-2 min-w-0">
                            {opt.icon}
                            <span className="truncate">{opt.label}</span>
                          </span>
                          {isActive ? <span aria-hidden className="text-[10px]">✓</span> : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={theme === 'light' ? t('enableDarkMode') : t('enableLightMode')}
            >
               {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* User Menu (when logged in) */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="h-8 flex items-center gap-2 pr-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden hover:bg-slate-50 dark:hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="User menu"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                >
                  <UserAvatar
                    src={user.profileImage || user.avatar}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover border border-slate-100 dark:border-white/10"
                  />
                  <span className="hidden sm:inline text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[80px]">
                    {user.name || 'User'}
                  </span>
                  <ChevronDown size={12} className={`mr-1 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div
                    role="menu"
                    className="absolute left-0 z-[1100] mt-2 w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0b1020] shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                  >
                    <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-white/5">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                    </div>

                    {/* Quick Access Control Panel Link */}
                    <button
                      onClick={() => {
                        const path = hasAdminAccess ? '/admin' : 
                                    user.role === 'tailor' ? '/tailor-dashboard' : 
                                    user.role === 'boutique' ? '/boutique-account' :
                                    user.role === 'shop' ? '/shop-account' : '/account';
                        navigate(path);
                        setUserMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-xs font-semibold text-right text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 border-b border-slate-100 dark:border-slate-800"
                    >
                      <Store size={14} className="text-blue-500" />
                      <span>{hasAdminAccess ? 'لوحة تحكم المسؤول' : 'لوحة التحكم'}</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={async () => {
                        console.log('🚪 Logout clicked');
                        setUserMenuOpen(false);
                        try {
                          await logout();
                          console.log('✅ Logout successful');
                          navigate('/');
                        } catch (error) {
                          console.error('❌ Logout failed:', error);
                        }
                      }}
                      className="w-full px-3 py-2 text-xs font-semibold text-right text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                    >
                      <LogOut size={14} />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => toggleAuthModal(true)}
                className="text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-1.5 rounded-full transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={t('login')}
              >
                <LogIn size={12} />
                <span>{t('signIn')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Links - Mobile only (shown below on small screens) */}
        {mobileOpen && !(loading && !user) ? (
          <nav aria-label={t('mainNavigation')} className="md:hidden mt-3 pb-2 flex flex-col gap-2">
            {(() => {
              // Determine role key - handle both legacy roles and new shopType model
              let role = user?.role ?? (user ? 'user' : 'guest');
              const shopType = (user as any)?.shopType;
              if (hasAdminAccess) role = 'admin';
              
              // If role is already boutique/shop, use it directly (legacy data)
              // Otherwise if tailor, check shopType
              if (user?.role === 'tailor' && shopType) {
                if (shopType === 'boutique') role = 'boutique';
                else if (shopType === 'shop' || shopType === 'fabric_store' || shopType === 'sewing_supplies') {
                  role = 'shop';
                }
              }
              const links = roleLinks[role as keyof typeof roleLinks] ?? roleLinks.guest;
              return links.map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    try {
                      console.log('Header navigate click (mobile)', { labelKey: l.labelKey, path: l.path });
                    } catch {}
                    navigate(l.path);
                    setMobileOpen(false);
                  }}
                  className={`text-xs font-medium transition-colors flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
                  } ${isActive(l.path) ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                  aria-current={isActive(l.path) ? 'page' : undefined}
                >
                  {l.icon ? <l.icon size={14} /> : null}
                  {t(l.labelKey)}
                  {typeof l.badge === 'function' && l.badge() > 0 ? (
                    <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-blue-600 text-white text-[9px] font-semibold">
                      {l.badge()}
                    </span>
                  ) : null}
                </button>
              ));
            })()}
          </nav>
        ) : null}
      </header>
    </>
  );
};

export const Header = HeaderComponent;
