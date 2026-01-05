import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Moon, Sun, Scissors, ShoppingCart, Package, ClipboardList, Store, PackageOpen, Box, Menu, X, Bell, Download } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { designService } from '../../../services/designService';
import { firebaseService } from '../../../services/firebase';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { requestNotificationPermission, showLocalTestNotification, isNotificationSupported } from '../../../utils/notifications';
import { CreditBadge } from '../../modules/CreditManager/CreditBadge';

const HeaderComponent = () => {
  const { user, loading, toggleAuthModal, theme, toggleTheme, cartCount, ordersCount, appSettings } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { showInstallButton, isInstalled, promptInstall } = usePWAInstall();
  const [designsCount, setDesignsCount] = useState<number>(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [draftsCount, setDraftsCount] = useState<number>(0);
  const [showDraftToast, setShowDraftToast] = useState(false);
  const [draftToastMsg, setDraftToastMsg] = useState('');

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

  // Load drafts count for badge
  useEffect(() => {
    let cancelled = false;

    const uid = user?.id || 'guest';

    // Cache-first: show cached count immediately (prevents “late” badge on refresh)
    try {
      const raw = localStorage.getItem(`order_drafts_${uid}`);
      const arr = raw ? JSON.parse(raw) : [];
      if (Array.isArray(arr)) setDraftsCount(arr.length);
    } catch {
      // ignore
    }

    const t = setTimeout(async () => {
      if (cancelled) return;
      try {
        const items = await firebaseService.loadOrderDrafts(uid);
        if (!cancelled) {
          const safeItems = Array.isArray(items) ? items : [];
          setDraftsCount(safeItems.length);
          try {
            localStorage.setItem(`order_drafts_${uid}`, JSON.stringify(safeItems));
          } catch {
            // ignore
          }
        }
      } catch (e) {
        console.warn('Failed to load drafts count, using fallback', e);
        if (!cancelled) {
          try {
            const raw = localStorage.getItem(`order_drafts_${uid}`);
            const arr = raw ? JSON.parse(raw) : [];
            setDraftsCount(Array.isArray(arr) ? arr.length : 0);
          } catch {}
        }
      }
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [user?.id]);

  // Toast when drafts count increases
  useEffect(() => {
    // Read previous count from session to avoid noisy toasts across navigations
    const key = `__last_drafts_count_${user?.id || 'guest'}`;
    const lastRaw = sessionStorage.getItem(key);
    const last = lastRaw ? parseInt(lastRaw, 10) : 0;
    if (Number.isFinite(last) && draftsCount > last) {
      setDraftToastMsg(`تم حفظ ${draftsCount - last} مسودة جديدة`);
      setShowDraftToast(true);
      const timer = setTimeout(() => setShowDraftToast(false), 2500);
      return () => clearTimeout(timer);
    }
    sessionStorage.setItem(key, String(draftsCount));
  }, [draftsCount, user?.id]);

  const isActive = (path: string) => location.pathname === path;
  const isDev = import.meta.env.DEV;
  const isDesignerRoute = location.pathname.startsWith('/designer-v2-1');

  const triggerDesignerUpgrade = () => {
    try {
      sessionStorage.setItem('__khuyoot_open_upgrade_modal', '1');
    } catch {
      // ignore
    }
    if (!location.pathname.startsWith('/designer-v2-1')) {
      navigate('/designer-v2-1');
    } else {
      // Let the designer page react to this without requiring navigation.
      window.dispatchEvent(new Event('khuyoot:open-upgrade-modal'));
    }
  };

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
        { label: 'الرئيسية', path: '/', icon: null },
        { label: 'المجموعات', path: '/collections', icon: Package },
        { label: 'المحلات', path: '/shops', icon: null },
        { label: 'الخياطون', path: '/tailors', icon: null },
        { label: 'تصاميمي', path: '/designs', icon: null, badge: () => (user ? designsCount : 0) },
        { label: 'مسوداتي', path: '/drafts', icon: ClipboardList, badge: () => draftsCount },
      ],
      user: [
        { label: 'الرئيسية', path: '/', icon: null },
        { label: 'المجموعات', path: '/collections', icon: Package },
        { label: 'المحلات', path: '/shops', icon: null },
        { label: 'الخياطون', path: '/tailors', icon: null },
        { label: 'تصاميمي', path: '/designs', icon: null, badge: () => designsCount },
        { label: 'مسوداتي', path: '/drafts', icon: ClipboardList, badge: () => draftsCount },
      ],
      tailor: [
        { label: 'الرئيسية', path: '/', icon: null },
        { label: 'منتجاتي', path: '/tailor/collections', icon: Scissors },
        { label: 'الطلبات', path: '/tailor/orders', icon: ClipboardList, badge: () => (ordersCount ?? 0) },
        { label: 'الأقمشة', path: '/tailor-materials', icon: null },
        { label: 'لوحة التحكم', path: '/tailor-dashboard', icon: null },
        { label: 'مسوداتي', path: '/drafts', icon: ClipboardList, badge: () => draftsCount },
      ],
      boutique: [
        { label: 'الرئيسية', path: '/', icon: null },
        { label: 'الطلبات', path: '/boutique/orders', icon: PackageOpen, badge: () => (ordersCount ?? 0) },
        { label: 'المنتجات', path: '/boutique-account', icon: null },
        { label: 'الإحصائيات', path: '/boutique-account', icon: null },
        { label: 'مسوداتي', path: '/drafts', icon: ClipboardList, badge: () => draftsCount },
      ],
      shop: [
        { label: 'الرئيسية', path: '/', icon: null },
        { label: 'الطلبات', path: '/shop/orders', icon: Store, badge: () => (ordersCount ?? 0) },
        { label: 'المخزون', path: '/shop/inventory', icon: Box },
        { label: 'المنتجات', path: '/shop-account', icon: null },
        { label: 'المبيعات', path: '/shop-account', icon: null },
        { label: 'مسوداتي', path: '/drafts', icon: ClipboardList },
      ],
      admin: [
        { label: 'لوحة التحكم', path: '/admin', icon: null },
        { label: 'المستخدمين', path: '/admin', icon: null },
        { label: 'الطلبات', path: '/admin', icon: null },
        { label: 'الإعدادات', path: '/admin', icon: null },
      ],
    } as const;
  }, [designsCount, ordersCount, draftsCount, user]);

  return (
    <>
      {/* Skip to content for accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-blue-600 text-white px-3 py-2 rounded-md">تخطي إلى المحتوى</a>
      <header className="bg-white/80 dark:bg-[#050817]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 py-3 px-4 transition-colors duration-300" role="banner">
        {/* Lightweight toast for drafts updates */}
        {showDraftToast && (
          <button
            onClick={() => navigate('/drafts')}
            className="fixed top-2 right-2 z-50 bg-blue-600 text-white text-xs px-3 py-2 rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="فتح صفحة المسودات"
            title="افتح المسودات"
          >
            {draftToastMsg || 'تم حفظ المسودة بنجاح'}
          </button>
        )}
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo block */}
          <div 
            className="flex-1 shrink-0 cursor-pointer" 
            onClick={() => navigate('/')}
            aria-label="الانتقال إلى الصفحة الرئيسية"
          >
            <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500 dark:from-blue-400 dark:to-emerald-400 tracking-tighter">
              خيوط
            </h1>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">منصة التفصيل الذكي</p>
          </div>

          {/* Designer V2.1 meta + credits (Designer routes only) */}
          {isDesignerRoute && (
            <div className="hidden sm:flex flex-col items-end gap-2 min-w-0 max-w-[240px]">
              <div className="text-right min-w-0">
                <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">Designer V2.1</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Fabric Swap (Powered by NanoBana)</p>
              </div>
              <div className="min-w-0">
                <CreditBadge onRefill={triggerDesignerUpgrade} />
              </div>
            </div>
          )}

          {/* Actions: Mobile menu + Role icons + Theme + Auth */}
          <div className="flex items-center gap-2 shrink-0">
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

        {/* Navigation Links - تظهر حسب نوع الحساب (cache-first) */}
        <nav aria-label="التنقل الرئيسي">
          {!(loading && !user) ? (
            <div
              className={`max-w-7xl mx-auto mt-3 pb-2 ${mobileOpen ? 'flex flex-col gap-2' : 'hidden'} md:flex md:flex-row justify-center md:gap-4`}
            >
              {(() => {
                const role = user?.role ?? (user ? 'user' : 'guest');
                const links = roleLinks[role as keyof typeof roleLinks] ?? roleLinks.guest;
                return links.map((l) => (
                  <button
                    key={l.path + l.label}
                    onClick={() => navigate(l.path)}
                    className={`text-xs font-medium transition-colors flex items-center gap-1.5 px-3 py-2 md:py-0 rounded-md md:rounded-none hover:bg-slate-100 dark:hover:bg-slate-800 md:hover:bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
                    } ${isActive(l.path) ? 'font-semibold underline underline-offset-4 decoration-2' : ''}`}
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
            </div>
          ) : (
            // Skeleton shimmer while loading (only when we have no cached user)
            <div className="max-w-7xl mx-auto mt-3 pb-2 flex justify-center gap-4">
              {[1, 2, 3, 4].map((id) => (
                <div key={`nav-skel-${id}`} className="w-16 h-4 rounded-sm bg-slate-200 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          )}
        </nav>
      </header>
    </>
  );
};

export const Header = React.memo(HeaderComponent);
