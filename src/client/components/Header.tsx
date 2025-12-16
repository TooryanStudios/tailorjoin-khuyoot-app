
import React from 'react';
import { useApp } from '../../../context/AppContext';
import { useEffect, useMemo, useState } from 'react';
import { designService } from '../../../services/designService';
import { User, LogIn, Moon, Sun, Scissors, ShoppingCart, Package, ClipboardList, Store, PackageOpen, Box, Menu, X } from 'lucide-react';
import { firebaseService } from '../../../services/firebase';
import { useNavigate, useLocation } from 'react-router-dom';

export const Header = () => {
  const { user, loading, toggleAuthModal, theme, toggleTheme, cartCount, ordersCount } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [designsCount, setDesignsCount] = useState<number>(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [draftsCount, setDraftsCount] = useState<number>(0);
  const [showDraftToast, setShowDraftToast] = useState(false);
  const [draftToastMsg, setDraftToastMsg] = useState('');

  // Debounced designs count fetch to reduce repeated loads
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      if (cancelled) return;
      if (!user) { setDesignsCount(0); return; }
      try {
        const list = await designService.listDesigns(user.id);
        if (!cancelled) setDesignsCount(Array.isArray(list) ? list.length : 0);
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
  }, [user]);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Load drafts count for badge
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      if (cancelled) return;
      const uid = user?.id || 'guest';
      try {
        const items = await firebaseService.loadOrderDrafts(uid);
        if (!cancelled) setDraftsCount(Array.isArray(items) ? items.length : 0);
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
  }, [user]);

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

  // Role-based links config for consistency
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

  // 🔧 DEV ONLY: Force update role to admin
  const forceAdminRole = async () => {
    if (!user) {
      alert('يجب تسجيل الدخول أولاً');
      return;
    }
    
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../../../services/firebase');
      
      await setDoc(doc(db, 'users', user.id), { role: 'admin' }, { merge: true });
      alert('✅ تم تحديث الدور إلى admin\n🔄 أعد تحميل الصفحة');
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('❌ حدث خطأ: ' + error);
    }
  };

  return (
    <>
      {/* Skip to content for accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-blue-600 text-white px-3 py-2 rounded-md">تخطي إلى المحتوى</a>
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#050817]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 py-3 px-4 transition-colors duration-300" role="banner">
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
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Greeting only (account icon removed; role badge removed) */}
          <div className="flex items-center gap-3 shrink-0 order-2">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden xs:block">مرحباً بك</span>
              <div className="flex items-center gap-1 min-w-0"></div>
            </div>
          </div>

          {/* Logo block: center-align text inside */}
          <div 
            className="order-1 shrink-0 text-center cursor-pointer" 
            onClick={() => navigate('/')}
            onDoubleClick={(e) => {
              if (e.shiftKey) {
                e.stopPropagation();
                forceAdminRole();
              }
            }}
            title={user ? "Shift + Double Click = Force Admin Role (DEV)" : ""}
            aria-label="الانتقال إلى الصفحة الرئيسية"
          >
            <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500 dark:from-blue-400 dark:to-emerald-400 tracking-tighter">
              خيوط
            </h1>
            <p className="text-[8px] text-slate-500 dark:text-slate-500 hidden sm:block truncate text-center">منصة التفصيل الذكي</p>
          </div>

          {/* Left Side: Buttons */}
          <div className="flex items-center gap-2 shrink-0 order-3">
            {/* Mobile menu toggle */}
            <button
              aria-label={mobileOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              onClick={() => setMobileOpen((v) => !v)}
              className="w-8 h-8 flex md:hidden items-center justify-center rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            {/* Role-specific icons - only show after loading */}
            {!loading && (
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
                      <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </button>
                )}

                {/* My Designs shortcut */}
                {(!user || user.role === 'user') && (
                  <button 
                    onClick={() => navigate('/designs')}
                    className="relative w-auto px-3 h-8 flex items-center justify-center rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="تصاميمي"
                    aria-label="فتح تصاميمي"
                  >
                    تصاميمي
                    {user && designsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-violet-500 text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                        {designsCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Orders Icon - للخياط */}
                {user?.role === 'tailor' && (
                  <button 
                    onClick={() => navigate('/tailor/orders')}
                    className="relative w-8 h-8 flex items-center justify-center rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
                    title="الطلبات"
                    aria-label="عرض طلبات الخياط"
                  >
                    <ClipboardList size={18} />
                    {(ordersCount ?? 0) > 0 && (
                      <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {ordersCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Orders Icon - للبوتيك */}
                {user?.role === 'boutique' && (
                  <button 
                    onClick={() => navigate('/boutique/orders')}
                    className="relative w-8 h-8 flex items-center justify-center rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                    title="طلبات الشراء والإيجار"
                    aria-label="عرض طلبات البوتيك"
                  >
                    <PackageOpen size={18} />
                    {(ordersCount ?? 0) > 0 && (
                      <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {ordersCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Orders Icon - للمحل */}
                {user?.role === 'shop' && (
                  <button 
                    onClick={() => navigate('/shop/orders')}
                    className="relative w-8 h-8 flex items-center justify-center rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                    title="طلبات المحل"
                    aria-label="عرض طلبات المحل"
                  >
                    <Store size={18} />
                    {(ordersCount ?? 0) > 0 && (
                      <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
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

        {/* Navigation Links - تظهر بعد التحميل حسب نوع الحساب */}
        <nav aria-label="التنقل الرئيسي">
          {!loading ? (
            <div className={`max-w-7xl mx-auto mt-2 pb-2 ${mobileOpen ? 'flex' : 'hidden'} md:flex justify-center gap-4`}>
              {(() => {
                const role = user?.role ?? (user ? 'user' : 'guest');
                const links = roleLinks[role as keyof typeof roleLinks] ?? roleLinks.guest;
                return links.map((l) => (
                  <button
                    key={l.path + l.label}
                    onClick={() => navigate(l.path)}
                    className={`text-xs font-medium transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      role === 'tailor' ? 'text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400' :
                      role === 'boutique' ? 'text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400' :
                      role === 'shop' ? 'text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400' :
                      role === 'admin' ? 'text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400' :
                      'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
                    } ${isActive(l.path) ? 'underline underline-offset-4' : ''}`}
                    aria-current={isActive(l.path) ? 'page' : undefined}
                  >
                    {l.icon ? <l.icon size={14} /> : null}
                    {l.label}
                    {typeof l.badge === 'function' && l.badge() > 0 ? (
                      <span className="ml-1 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-700 dark:text-slate-200">
                        {l.badge()}
                      </span>
                    ) : null}
                  </button>
                ));
              })()}
            </div>
          ) : (
            // Skeleton shimmer while loading
            <div className="max-w-7xl mx-auto mt-2 pb-2 flex justify-center gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-16 h-4 rounded-sm bg-slate-200 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          )}
        </nav>
      </header>
    </>
  );
};
