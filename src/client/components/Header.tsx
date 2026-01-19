import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Moon, Sun, Scissors, ShoppingCart, Package, ClipboardList, Store, PackageOpen, Box, Menu, X, Bell, Download } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { designService } from '../../../services/designService';
import { firebaseService } from '../../../services/firebase';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { requestNotificationPermission, showLocalTestNotification, isNotificationSupported } from '../../../utils/notifications';

const HeaderComponent = () => {
  const { user, loading, toggleAuthModal, theme, toggleTheme, cartCount, ordersCount, appSettings } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { showInstallButton, isInstalled, promptInstall } = usePWAInstall();
  const [designsCount, setDesignsCount] = useState<number>(0);
  const [mobileOpen, setMobileOpen] = useState(false);

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
      window.alert('❌ التنبيهات غير مدعومة في هذا المتصفح');
      return;
    }

    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      showLocalTestNotification('خيوط - Khuyoot', 'تم تفعيل تنبيهات خيوط بنجاح! 🎉');
    } else if (permission === 'denied') {
      window.alert('❌ تم رفض إذن التنبيهات. يرجى تفعيلها من إعدادات المتصفح');
    } else {
      window.alert('⚠️ لم يتم منح إذن التنبيهات');
    }
  };

  const roleLinks = useMemo(() => {
    return {
      guest: [
        { label: 'Page A', path: '/demo-shell/a', icon: null },
        { label: 'Page B', path: '/demo-shell/b', icon: null },
        { label: 'Top Tailors', path: '/demo-shell/top-tailors', icon: null },
        { label: 'Designer', path: '/designer-v2-1', icon: null },
        { label: 'الرئيسية', path: '/', icon: null },
        { label: 'المجموعات', path: '/collections', icon: Package },
        { label: 'المحلات', path: '/shops', icon: null },
        { label: 'الخياطون', path: '/tailors', icon: null },
        { label: 'تصاميمي', path: '/designs', icon: null, badge: () => (user ? designsCount : 0) },
        { label: 'مسوداتي', path: '/drafts', icon: ClipboardList, badge: () => 0 },
      ],
      user: [
        { label: 'Page A', path: '/demo-shell/a', icon: null },
        { label: 'Page B', path: '/demo-shell/b', icon: null },
        { label: 'Top Tailors', path: '/demo-shell/top-tailors', icon: null },
        { label: 'Designer', path: '/designer-v2-1', icon: null },
        { label: 'الرئيسية', path: '/', icon: null },
        { label: 'المجموعات', path: '/collections', icon: Package },
        { label: 'المحلات', path: '/shops', icon: null },
        { label: 'الخياطون', path: '/tailors', icon: null },
        { label: 'تصاميمي', path: '/designs', icon: null, badge: () => designsCount },
        { label: 'مسوداتي', path: '/drafts', icon: ClipboardList, badge: () => 0 },
      ],
      tailor: [
        { label: 'Page A', path: '/demo-shell/a', icon: null },
        { label: 'Page B', path: '/demo-shell/b', icon: null },
        { label: 'Top Tailors', path: '/demo-shell/top-tailors', icon: null },
        { label: 'Designer', path: '/designer-v2-1', icon: null },
        { label: 'الرئيسية', path: '/', icon: null },
        { label: 'منتجاتي', path: '/tailor/collections', icon: Scissors },
        { label: 'الطلبات', path: '/tailor/orders', icon: ClipboardList, badge: () => (ordersCount ?? 0) },
        { label: 'الأقمشة', path: '/tailor-materials', icon: null },
        { label: 'لوحة التحكم', path: '/tailor-dashboard', icon: null },
        { label: 'مسوداتي', path: '/drafts', icon: ClipboardList, badge: () => 0 },
      ],
      boutique: [
        { label: 'Page A', path: '/demo-shell/a', icon: null },
        { label: 'Page B', path: '/demo-shell/b', icon: null },
        { label: 'Top Tailors', path: '/demo-shell/top-tailors', icon: null },
        { label: 'Designer', path: '/designer-v2-1', icon: null },
        { label: 'الرئيسية', path: '/', icon: null },
        { label: 'الطلبات', path: '/boutique/orders', icon: PackageOpen, badge: () => (ordersCount ?? 0) },
        { label: 'المنتجات', path: '/boutique-account', icon: null },
        { label: 'الإحصائيات', path: '/account', icon: null },
        { label: 'مسوداتي', path: '/drafts', icon: ClipboardList, badge: () => 0 },
      ],
      shop: [
        { label: 'Page A', path: '/demo-shell/a', icon: null },
        { label: 'Page B', path: '/demo-shell/b', icon: null },
        { label: 'Top Tailors', path: '/demo-shell/top-tailors', icon: null },
        { label: 'Designer', path: '/designer-v2-1', icon: null },
        { label: 'الرئيسية', path: '/', icon: null },
        { label: 'الطلبات', path: '/shop/orders', icon: Store, badge: () => (ordersCount ?? 0) },
        { label: 'المخزون', path: '/shop/inventory', icon: Box },
        { label: 'المنتجات', path: '/shop-account', icon: null },
        { label: 'المبيعات', path: '/account', icon: null },
        { label: 'مسوداتي', path: '/drafts', icon: ClipboardList },
      ],
      admin: [
        { label: 'Page A', path: '/demo-shell/a', icon: null },
        { label: 'Page B', path: '/demo-shell/b', icon: null },
        { label: 'Top Tailors', path: '/demo-shell/top-tailors', icon: null },
        { label: 'Designer', path: '/designer-v2-1', icon: null },
        { label: 'لوحة التحكم', path: '/admin', icon: null },
        { label: 'المستخدمين', path: '/admin', icon: null },
        { label: 'الطلبات', path: '/admin', icon: null },
        { label: 'الإعدادات', path: '/admin', icon: null },
      ],
    } as const;
  }, [designsCount, ordersCount, user]);

  return (
    <>
      {/* Skip to content for accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-blue-600 text-white px-3 py-2 rounded-md">تخطي إلى المحتوى</a>
      <header className="bg-white/80 dark:bg-[#050817]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 py-3 px-4 transition-colors duration-300" role="banner">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          {/* Logo block - top left */}
          <div 
            className="flex items-center gap-3 shrink-0 cursor-pointer" 
            onClick={() => navigate('/')}
            aria-label="الانتقال إلى الصفحة الرئيسية"
          >
            <img 
              src="/logo.png" 
              alt="خيوط" 
              className="h-12 sm:h-16 w-auto object-contain"
            />
          </div>

          {/* Navigation Links - inline for admin and other roles */}
          {!(loading && !user) ? (
            <nav aria-label="التنقل الرئيسي" className="hidden md:flex items-center gap-2">
              {(() => {
                // Determine role key - handle both legacy roles and new shopType model
                let role = user?.role ?? (user ? 'user' : 'guest');
                const shopType = (user as any)?.shopType;
                
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
                    key={l.path + l.label}
                    onClick={() => {
                      try {
                        console.log('Header navigate click', { label: l.label, path: l.path });
                      } catch {}
                      navigate(l.path);
                    }}
                    className={`text-xs font-medium transition-colors flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
                    } ${isActive(l.path) ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                    aria-current={isActive(l.path) ? 'page' : undefined}
                  >
                    {l.icon ? <l.icon size={14} /> : null}
                    {l.label}
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
              aria-label={mobileOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
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
                title="أضف التطبيق للشاشة الرئيسية"
                aria-label="تثبيت التطبيق"
              >
                <Download size={18} />
              </button>
            )}

            {canShowHomeSection('notificationButton') && (
              <button
                onClick={handleTestNotification}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                title={isDev ? 'تجربة التنبيهات (Dev)' : 'تجربة التنبيهات'}
                aria-label="تجربة التنبيهات"
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
                    title="السلة"
                    aria-label="فتح السلة"
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
                    title="تصاميمي"
                    aria-label="فتح تصاميمي"
                  >
                    <span>تصاميمي</span>
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
                    title="الطلبات"
                    aria-label="عرض طلبات الخياط"
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
                    title="طلبات الشراء والإيجار"
                    aria-label="عرض طلبات البوتيك"
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
                    title="طلبات المحل"
                    aria-label="عرض طلبات المحل"
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

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={theme === 'light' ? 'تفعيل الوضع الداكن' : 'تفعيل الوضع الفاتح'}
            >
               {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            

            {!user && (
              <button 
                onClick={() => toggleAuthModal(true)}
                className="text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-1.5 rounded-full transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="تسجيل الدخول"
              >
                <LogIn size={12} />
                <span>دخول</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Links - Mobile only (shown below on small screens) */}
        {mobileOpen && !(loading && !user) ? (
          <nav aria-label="التنقل الرئيسي" className="md:hidden mt-3 pb-2 flex flex-col gap-2">
            {(() => {
              // Determine role key - handle both legacy roles and new shopType model
              let role = user?.role ?? (user ? 'user' : 'guest');
              const shopType = (user as any)?.shopType;
              
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
                  key={l.path + l.label}
                  onClick={() => {
                    try {
                      console.log('Header navigate click (mobile)', { label: l.label, path: l.path });
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
                  {l.label}
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

export const Header = React.memo(HeaderComponent);
