import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { db, firebaseService } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Shield, Menu, Search, Bell, Activity, Save, PlayCircle, PenTool, ShoppingCart, Users, Lock, Scissors, Package, FileText, Store, Building2, Moon, Sun, CheckCircle, Home, Maximize2, X, Key, Eye, EyeOff, Settings, ChevronDown, LogOut } from 'lucide-react';
import { Button } from '../../components/Button';
import { AppSettings, User, Order, SystemLog, Fabric, AIModelConfig, Tailor, Shop, MeasurementProfile } from '../../types';
import { getTailors, getAllShops } from '../../services/mockService';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { createPortal } from 'react-dom';
import { DashboardOverview } from './dashboard/DashboardOverview';
import { LimitedAdminDashboard } from './dashboard/LimitedAdminDashboard';
import { OrdersTable } from './orders/OrdersTable';
import { FabricLibrary } from './fabrics/FabricLibrary';
import { AIModels } from './ai/AIModels';
import { ShopsManagement } from './shops/ShopsManagement';
import { MerchantsApproval } from './merchants/MerchantsApproval';
import { UsersManagement } from './users/UsersManagement';
import { ImageLibraryManagement } from './images/ImageLibraryManagement';
import { MeasurementTemplates } from './measurements/MeasurementTemplates';
import { ProductsManagement } from './products/ProductsManagement';
import { OrphanedProducts } from './products/OrphanedProducts';
import { HomePageSettings } from './settings/HomePageSettings';
import { LandingPageConfig } from './settings/LandingPageConfig';
import { DesignerSettings } from './settings/DesignerSettings';
import { SiteTextsSettings } from './settings/SiteTextsSettings';
import { SocialMediaSettings } from './settings/SocialMediaSettings';
import { SEOSettings } from './settings/SEOSettings';
import { AdvancedSettings } from './settings/AdvancedSettings';
import { ProductPageSettings } from './settings/ProductPageSettings';
import { NotificationsSender } from './notifications/NotificationsSender';
import { AdsManagement } from './ads/AdsManagement';
import { FinancialManagement } from './financial/FinancialManagement';
import { RegionsManagement } from './regions/RegionsManagement';
import { TryOnTemplates } from './tryon/TryOnTemplates';
import { CreditsManagement } from './credits/CreditsManagement';
import { SurveyResponsesPage } from '../features/admin/surveys/SurveyResponsesPage';
import { DebugToolsHub } from './settings/DebugToolsHub';
import {
  AdminSection,
  AdminConfigSection,
  buildAdminAccessPolicy,
  canAccessAdminSection,
  canAccessAdminConfigSection,
  getFirstAllowedSection,
  getFirstAllowedConfigSection,
} from './rbac/accessControl';

const CONFIG_SECTIONS: ReadonlyArray<AdminConfigSection> = ['general', 'homepage', 'landing-page', 'designer', 'texts', 'social', 'seo', 'advanced', 'product-page', 'debug-tools'];

const ADMIN_SECTION_ORDER: ReadonlyArray<AdminSection> = [
  'dashboard',
  'orders',
  'approvals',
  'users',
  'tailors',
  'boutiques',
  'shops',
  'products',
  'orphaned-products',
  'fabrics',
  'measurements',
  'family',
  'ai',
  'store',
  'images',
  'tryon-templates',
  'notifications',
  'ads',
  'regions',
  'financial',
  'credits',
  'settings',
  'config',
  'debug-tools',
  'logs',
];

function getConfigSectionFromPathname(pathname: string): AdminConfigSection {
  // Supported:
  // - /admin/config
  // - /admin/config/
  // - /admin/config/:tab
  // - /admin/config/:tab/
  const parts = String(pathname || '').split('/').filter(Boolean);
  // parts: ['admin', 'config', ':tab?']
  const tab = parts[2];
  if (CONFIG_SECTIONS.includes(tab as AdminConfigSection)) return tab as AdminConfigSection;
  return 'general';
}

function toAdminSectionPath(section: AdminSection): string {
  if (section === 'dashboard') return '/admin/dashboard';
  if (section === 'settings') return '/admin/settings/surveys/khuyoot-validation';
  if (section === 'config' || section === 'debug-tools') return '/admin/config/general';
  return `/admin/${section}`;
}

export const AdminApp = () => {
  const { appSettings, saveAppSettings, user, logout, login, loginWithGoogle, loading, theme, toggleTheme, refreshUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Force refresh user profile when accessing admin panel
  React.useEffect(() => {
    const role = String(user?.role || '').toLowerCase();
    const accessMode = String(user?.adminAccess?.mode || '').toLowerCase();
    const permissionsMode = String(user?.adminPermissions?.mode || '').toLowerCase();

    const hasAdminMode =
      accessMode === 'full' ||
      accessMode === 'unlimited' ||
      accessMode === 'limited' ||
      permissionsMode === 'full' ||
      permissionsMode === 'unlimited' ||
      permissionsMode === 'limited';

    if (user && role !== 'admin' && !hasAdminMode) {
      console.log('[AdminApp] Non-admin session detected, forcing profile refresh...');
      refreshUser?.();
    }
  }, [user?.uid, user?.role, user?.adminAccess?.mode, user?.adminPermissions?.mode, refreshUser]);

  const ADMIN_SIDEBAR_OPEN_KEY = 'khuyoot_admin_sidebar_open';

  const getDefaultSidebarOpen = () => {
    try {
      if (typeof window === 'undefined') return false;
      const persisted = window.localStorage?.getItem(ADMIN_SIDEBAR_OPEN_KEY);
      if (persisted === '1') return true;
      if (persisted === '0') return false;
      // Default to closed unless the user explicitly opened it.
      return false;
    } catch {
      return false;
    }
  };

  const getIsSmallScreen = () => {
    try {
      // Treat <1024px as "small" so the admin sidebar behaves like an overlay.
      return typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;
    } catch {
      return true;
    }
  };
  
  // استخرج القسم النشط من URL بدلاً من state
  const getActiveSectionFromPath = () => {
    const raw = String(location.pathname || '');
    if (raw.startsWith('/admin/config/debug-tools')) return 'debug-tools' as AdminSection;
    const remainder = raw.replace(/^\/admin\/?/, '');
    const first = (remainder.split('/')[0] || 'dashboard').trim();
    return (first || 'dashboard') as AdminSection;
  };
  const activeSection = getActiveSectionFromPath();
    const activeConfigSection = getConfigSectionFromPathname(location.pathname);
    const accessPolicy = React.useMemo(() => buildAdminAccessPolicy(user), [user]);
    const firstAllowedSection = React.useMemo(
      () => getFirstAllowedSection(accessPolicy, ADMIN_SECTION_ORDER),
      [accessPolicy]
    );
    const firstAllowedConfigSection = React.useMemo(
      () => getFirstAllowedConfigSection(accessPolicy, CONFIG_SECTIONS),
      [accessPolicy]
    );
    const canAccessSection = React.useCallback(
      (section: string) => canAccessAdminSection(accessPolicy, section),
      [accessPolicy]
    );
    const canAccessConfigSection = React.useCallback(
      (section: string) => canAccessAdminConfigSection(accessPolicy, section),
      [accessPolicy]
    );
  const [localSettings, setLocalSettings] = useState<AppSettings>(appSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(getDefaultSidebarOpen);
  const [isSmallScreen, setIsSmallScreen] = useState(getIsSmallScreen);
  const [isFullScreenMode, setIsFullScreenMode] = useState<boolean>(false);

  const setSidebarOpenPersisted = (next: boolean) => {
    setSidebarOpen(next);
    try {
      window.localStorage?.setItem(ADMIN_SIDEBAR_OPEN_KEY, next ? '1' : '0');
    } catch {
      // ignore
    }
  };
  
  // Admin Login Form State
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [hasCompletedInitialCheck, setHasCompletedInitialCheck] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const adminDisplayName = React.useMemo(() => {
    const fromName = String(user?.name || '').trim();
    const fromUsername = String(user?.username || '').trim();
    const fromEmail = String(user?.email || '').trim();
    if (fromName) return fromName;
    if (fromUsername) return fromUsername;
    if (fromEmail.includes('@')) return fromEmail.split('@')[0];
    return fromEmail || 'Admin';
  }, [user?.name, user?.username, user?.email]);

  const adminRoleLabel = React.useMemo(() => {
    const role = String(user?.role || '').toLowerCase();
    const isLimitedAdmin =
      (user as any)?.adminAccess?.mode === 'limited' ||
      (user as any)?.adminPermissions?.mode === 'limited';
    
    if (role === 'admin' && isLimitedAdmin) return 'Limited Admin';
    if (role === 'admin') return 'Super Admin';
    if (role) return role;
    return 'Admin';
  }, [user?.role, (user as any)?.adminAccess?.mode, (user as any)?.adminPermissions?.mode]);

  const adminAvatarSrc = user?.profileImage || user?.avatar || '';
  const adminInitial = (adminDisplayName || 'A').trim().charAt(0).toUpperCase();

  const activeSectionLabel = React.useMemo(() => {
    const labels: Record<string, string> = {
      ai: 'AI Configuration',
      dashboard: 'Dashboard',
      'debug-tools': 'Debug Tools',
      settings: 'Settings',
      config: 'Configuration',
    };
    return labels[activeSection] || activeSection;
  }, [activeSection]);

  useEffect(() => {
    const onResize = () => {
      const small = getIsSmallScreen();
      setIsSmallScreen(small);
      // Avoid any auto-opening. If we switch to a small layout, close the sidebar.
      if (small) setSidebarOpenPersisted(false);
    };

    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!isProfileMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileMenuOpen]);

  // Data States
  const [users, setUsers] = useState<User[]>([]);
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Mock Data
  const [logs] = useState<SystemLog[]>([
    { id: '1', action: 'Update', adminName: 'Admin', timestamp: '10:30 AM', details: 'Updated AI model v2.1', type: 'info' },
    { id: '2', action: 'Ban', adminName: 'Admin', timestamp: 'Yesterday', details: 'Banned user ID u102', type: 'warning' },
    { id: '3', action: 'Error', adminName: 'System', timestamp: '2 days ago', details: 'Payment gateway timeout', type: 'error' },
  ]);

  const [fabrics] = useState<Fabric[]>([
    { id: 'f1', name: 'كتان ياباني فاخر', code: 'LIN-001', type: 'Linen', color: 'White', stock: 150, pricePerMeter: 4.5, image: '' },
    { id: 'f2', name: 'قطن مصري 100%', code: 'COT-099', type: 'Cotton', color: 'Cream', stock: 80, pricePerMeter: 3.2, image: '' },
    { id: 'f3', name: 'صوف كشميري', code: 'WOL-X10', type: 'Wool', color: 'Black', stock: 25, pricePerMeter: 12.0, image: '' },
  ]);

  const [aiModels] = useState<AIModelConfig[]>([
    { id: 'ai1', name: 'Sketch-to-Realism v2', version: '2.4.1', status: 'active', accuracy: 94.5, lastUpdated: '2023-10-20' },
    { id: 'ai2', name: 'Fabric-Texture-Mapper', version: '1.0.8', status: 'training', accuracy: 88.2, lastUpdated: '2023-10-25' },
    { id: 'ai3', name: 'Body-Measurement-Est', version: '0.9.5', status: 'inactive', accuracy: 76.0, lastUpdated: '2023-09-15' },
  ]);

  // إحصائيات المحلات المعلقة
  const [tailorsCount, setTailorsCount] = useState(0);
  const [boutiquesCount, setBoutiquesCount] = useState(0);
  const [shopsCount, setShopsCount] = useState(0);

  useEffect(() => {
    // إعادة توجيه إلى dashboard إذا كان المسار /admin فقط
    if (location.pathname === '/admin' || location.pathname === '/admin/') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Ensure Config has a stable deep link (no implicit tab).
  useEffect(() => {
    if (location.pathname === '/admin/config' || location.pathname === '/admin/config/') {
      navigate('/admin/config/general', { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (user?.role !== 'admin') return;

    if (!canAccessSection(activeSection)) {
      if (firstAllowedSection) {
        const target = toAdminSectionPath(firstAllowedSection);
        if (location.pathname !== target) {
          navigate(target, { replace: true });
        }
      }
      return;
    }

    if ((activeSection === 'config' || activeSection === 'debug-tools') && !canAccessConfigSection(activeConfigSection)) {
      if (firstAllowedConfigSection) {
        const target = `/admin/config/${firstAllowedConfigSection}`;
        if (location.pathname !== target) {
          navigate(target, { replace: true });
        }
      }
    }
  }, [
    user?.role,
    activeSection,
    activeConfigSection,
    canAccessSection,
    canAccessConfigSection,
    firstAllowedSection,
    firstAllowedConfigSection,
    location.pathname,
    navigate,
  ]);

  useEffect(() => {
    setLocalSettings(appSettings);
    firebaseService
      .getAllUsers()
      .then((allUsers) => setUsers(allUsers as User[]))
      .catch(() => setUsers([]));

    getTailors().then(setTailors);

    getDocs(collection(db, 'orders'))
      .then((snapshot) => {
        const realOrders = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as any;
          return {
            id: docSnap.id,
            productId: String(data.productId || ''),
            productName: String(data.productName || data.title || 'طلب'),
            productImage: String(data.productImage || ''),
            price: Number(data.price || 0),
            tailorName: String(data.tailorName || ''),
            tailorId: String(data.tailorId || ''),
            userId: String(data.userId || ''),
            status: (data.status || 'pending') as Order['status'],
            orderDate: String(data.orderDate || data.createdAt || ''),
          } as Order;
        });
        setOrders(realOrders);
      })
      .catch(() => setOrders([]));
    
    // تحميل جميع المحلات (خياطين + بوتيكات + محلات أقمشة + مستلزمات)
    getAllShops().then((shopsData) => {
      setAllShops(shopsData);
      
      // حساب المحلات المعلقة حسب النوع
      const pending = shopsData.filter(t => t.approvalStatus === 'pending');
      
      // Count based on specialization or name patterns since shopType is removed
      setTailorsCount(pending.filter(t => 
        t.specialization?.includes('خياط') || 
        t.specialization?.includes('دشداش') || 
        t.name?.includes('خياط')
      ).length);
      
      setBoutiquesCount(pending.filter(t => 
        t.specialization?.includes('بوتيك') || 
        t.specialization?.includes('عبايات') || 
        t.name?.includes('بوتيك')
      ).length);
      
      const otherShops = pending.filter(t => 
        t.specialization?.includes('أقمشة') || 
        t.specialization?.includes('محل') ||
        (!t.specialization?.includes('خياط') && !t.specialization?.includes('بوتيك'))
      ).length;
      setShopsCount(otherShops);
    });
  }, [appSettings]);

  // مراقبة تحديث المستخدم بعد تسجيل الدخول
  useEffect(() => {
    if (user?.role === 'admin' && showLoginForm) {
      setShowLoginForm(false);
    }
  }, [user]);

  // انتظر تحميل حالة المصادقة
  useEffect(() => {
    // Always wait minimum time before showing any UI (prevents flash)
    const minWaitTimer = setTimeout(() => {
      setHasCompletedInitialCheck(true);
    }, 800);

    return () => clearTimeout(minWaitTimer);
  }, []);

  useEffect(() => {
    // Don't make any decisions until minimum wait time has passed
    if (!hasCompletedInitialCheck) {
      return;
    }

    // If we have an admin user, stop checking immediately
    if (user?.role === 'admin') {
      setIsCheckingAuth(false);
      return;
    }

    // If AppContext is still loading, keep checking
    if (loading) {
      return;
    }

    // If we have a user but not admin role, wait for profile refresh
    if (user && user.role !== 'admin') {
       const timer = setTimeout(() => {
          setIsCheckingAuth(false);
       }, 1500);
       return () => clearTimeout(timer);
    }
    
    // If no user at all, stop checking
    if (!user) {
      setIsCheckingAuth(false);
    }
  }, [user, loading, hasCompletedInitialCheck]);

  const handleToggle = (key: keyof AppSettings) => {
    setLocalSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] } as AppSettings;
      // Persist immediately to keep the app (Home) in sync with the admin toggle.
      // Uses optimistic+silent to avoid UI flicker/alerts.
      saveAppSettings(next, { silent: true, optimistic: true });
      return next;
    });
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    await saveAppSettings(localSettings, { silent: true, optimistic: true });
    setIsSaving(false);
  };

  const handleLogout = async () => {
      try {
        setIsProfileMenuOpen(false);
        setIsSigningOut(true);

        // Keep indicator visible briefly for better UX
        await new Promise(resolve => setTimeout(resolve, 350));
        await logout();

        // Move directly to home page after logout
        navigate('/', { replace: true });
      } catch {
        console.error('Logout error');
        navigate('/', { replace: true });
      } finally {
        setIsSigningOut(false);
      }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    console.log('🚀 [AdminApp] Attempting admin login');
    
    try {
      await login(loginEmail, loginPassword);
      console.log('✅ [AdminApp] Firebase login successful');
      
      // Wait for profile hydration
      console.log('⏳ [AdminApp] Waiting for profile hydration...');
      setTimeout(() => {
        setIsLoggingIn(false);
        console.log('🏁 [AdminApp] Login flow finished');
        if (user?.role === 'admin') {
          setShowLoginForm(false);
        } else {
          console.warn('❌ [AdminApp] User logged in but role is not admin');
          setLoginError(`تم تسجيل الدخول بنجاح، ولكن دور الحساب هو "${user?.role}". يرجى التأكد من أنك تستخدم حساب مسؤول.`);
        }
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ [AdminApp] Login error');
      setLoginError(error.message || 'فشل تسجيل الدخول. تحقق من البيانات.');
      setIsLoggingIn(false);
    }
  };

  const handleAdminGoogleLogin = async () => {
    setLoginError('');
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
      setTimeout(() => {
        setIsLoggingIn(false);
        if (user?.role === 'admin') {
          setShowLoginForm(false);
        } else {
          setLoginError('هذا الحساب ليس حساب مسؤول. يرجى استخدام حساب Google المرتبط بحساب مسؤول معتمد.');
        }
      }, 2000);
    } catch (error: any) {
      if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
        setLoginError(error.message || 'فشل تسجيل الدخول بـ Google.');
      }
      setIsLoggingIn(false);
    }
  };

  // Defensive: cleanup only explicitly tagged overlays to avoid removing React-managed nodes
  useEffect(() => {
    try {
      const overlays = Array.from(
        document.querySelectorAll('[data-khuyoot-overlay="cleanup"]')
      ) as HTMLElement[];
      overlays.forEach((el) => {
        el.parentElement?.removeChild(el);
      });
      // Also reset any body styles a modal might have set
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    } catch {}
  }, [location.pathname]);

  const PlaceholderView = ({ title, icon: Icon }: any) => (
    <div className="flex flex-col items-center justify-center h-96 text-zinc-400 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
       <div className="w-20 h-20 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
          <Icon size={40} className="opacity-50" />
       </div>
       <h3 className="text-lg font-normal text-slate-600 dark:text-zinc-300">{title}</h3>
       <p className="text-sm">هذه الوحدة قيد التطوير حالياً</p>
    </div>
  );

  const AccessDeniedView = ({ title = 'غير مصرح', description = 'ليس لديك صلاحية للوصول إلى هذه الصفحة.' }: { title?: string; description?: string }) => (
    <div className="flex flex-col items-center justify-center h-96 text-zinc-400 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
      <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
        <Lock size={40} className="opacity-70 text-red-500" />
      </div>
      <h3 className="text-lg font-normal text-slate-700 dark:text-zinc-200">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-zinc-400">{description}</p>
    </div>
  );

  const ConfigView = () => {
    const configSection = getConfigSectionFromPathname(location.pathname);
    const configTabs = [
      { id: 'general' as const, label: 'الإعدادات العامة', selectedClass: 'bg-theme-primary text-white shadow-sm font-bold', idleClass: 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300', to: '/admin/config/general' },
      { id: 'homepage' as const, label: 'الصفحة الرئيسية', selectedClass: 'bg-theme-primary text-white shadow-sm font-bold', idleClass: 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300', to: '/admin/config/homepage' },
      { id: 'landing-page' as const, label: 'صفحة الهبوط (Mont)', selectedClass: 'bg-theme-primary text-white shadow-sm font-bold', idleClass: 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300', to: '/admin/config/landing-page' },
      { id: 'designer' as const, label: 'المصمم', selectedClass: 'bg-theme-primary text-white shadow-sm font-bold', idleClass: 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300', to: '/admin/config/designer' },
      { id: 'product-page' as const, label: 'صفحة المنتج', selectedClass: 'bg-theme-primary text-white shadow-sm font-bold', idleClass: 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300', to: '/admin/config/product-page' },
      { id: 'texts' as const, label: 'نصوص الموقع', selectedClass: 'bg-theme-primary text-white shadow-sm font-bold', idleClass: 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300', to: '/admin/config/texts' },
      { id: 'social' as const, label: 'السوشيال ميديا', selectedClass: 'bg-theme-primary text-white shadow-sm font-bold', idleClass: 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300', to: '/admin/config/social' },
      { id: 'seo' as const, label: 'SEO', selectedClass: 'bg-theme-primary text-white shadow-sm font-bold', idleClass: 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300', to: '/admin/config/seo' },
      { id: 'advanced' as const, label: 'إعدادات متقدمة', selectedClass: 'bg-black text-white shadow-sm font-bold', idleClass: 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300', to: '/admin/config/advanced/orders' },
      { id: 'debug-tools' as const, label: 'أدوات التشخيص', selectedClass: 'bg-black text-white shadow-sm font-bold', idleClass: 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300', to: '/admin/config/debug-tools' },
    ];
    const visibleConfigTabs = configTabs.filter((tab) => canAccessConfigSection(tab.id));

    if (!canAccessConfigSection(configSection)) {
      return <AccessDeniedView title="صلاحيات غير كافية" description="لا يمكنك الوصول إلى تبويب الإعدادات هذا." />;
    }

    if (visibleConfigTabs.length === 0) {
      return <AccessDeniedView title="لا توجد صلاحيات" description="لا توجد تبويبات إعدادات متاحة لهذا الحساب." />;
    }

    return (
      <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-4 md:p-6 min-h-[85vh] font-['Cairo'] bg-[#ededed] dark:bg-zinc-950">
        {/* Header Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border-[1.5px] border-black/10 dark:border-white/10 shadow-sm p-6">
          <div className="flex justify-between items-start gap-3">
            <div className="flex items-end gap-3">
              <div className="w-12 h-12 rounded-2xl bg-theme-primary/10 flex items-center justify-center">
                <Settings size={24} className="text-theme-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-normal text-zinc-900 dark:text-white tracking-tight">إعدادات النظام</h2>
                <p className="text-xs text-zinc-500 font-normal uppercase tracking-widest mt-0.5">تحديث الإعدادات بنفس لغة واجهة المصمم 2.1</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/visualizer"
                className="inline-flex items-center gap-2 rounded-2xl border border-purple-500/40 bg-purple-500/10 px-4 py-2.5 text-xs font-semibold text-purple-600 dark:text-purple-300 hover:bg-purple-500/20 transition-all shadow-sm"
              >
                <Maximize2 size={14} />
                <span>فتح الـ 3D Visualizer</span>
              </Link>
              {configSection === 'general' && (
                <Button onClick={handleSaveSettings} disabled={isSaving} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 text-xs">
                  {isSaving ? <Activity className="animate-spin" size={16} /> : <Save size={16} />}
                  <span>حفظ التغييرات</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border-[1.5px] border-black/10 dark:border-white/10 shadow-sm p-2">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-1">
            {visibleConfigTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => navigate(tab.to)}
                className={`px-3 py-2 rounded-2xl text-xs font-normal transition-all text-center ${
                  configSection === tab.id ? tab.selectedClass : tab.idleClass
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {configSection === 'debug-tools' ? (
          <DebugToolsHub />
        ) : configSection === 'homepage' ? (
          <HomePageSettings />
        ) : configSection === 'landing-page' ? (
          <LandingPageConfig />
          ) : configSection === 'designer' ? (
            <DesignerSettings />
        ) : configSection === 'product-page' ? (
          <ProductPageSettings />
        ) : configSection === 'texts' ? (
          <SiteTextsSettings />
        ) : configSection === 'social' ? (
          <SocialMediaSettings />
        ) : configSection === 'seo' ? (
          <SEOSettings />
        ) : configSection === 'advanced' ? (
          <AdvancedSettings />
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border-[1.5px] border-black/10 dark:border-white/10 shadow-sm overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800">
            {/* خيار الوضع الفاتح/الداكن */}
          <div className="p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-2xl ${theme === 'dark' ? 'bg-theme-primary/10 text-theme-primary' : 'bg-amber-100 text-amber-600'} border-[1.5px] ${theme === 'dark' ? 'border-theme-primary/20' : 'border-amber-200'}`}>
                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <div>
                <p className="font-bold text-zinc-900 dark:text-white text-sm">مظهر لوحة التحكم</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">التبديل بين الوضع الفاتح والداكن للوحة التحكم</p>
              </div>
            </div>
            <button 
              onClick={toggleTheme}
              className={`px-4 py-2.5 rounded-2xl font-semibold text-xs transition-all shadow-sm hover:shadow-md ${
                theme === 'dark' 
                  ? 'bg-theme-primary text-white hover:bg-purple-500' 
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            >
              {theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
            </button>
          </div>

          {[
            { key: 'storiesEnabled', label: 'القصص (Stories)', desc: 'تفعيل ميزة القصص للخياطين في الصفحة الرئيسية', icon: PlayCircle, color: 'text-pink-500', bgColor: 'bg-pink-50 dark:bg-pink-900/10', borderColor: 'border-pink-200 dark:border-pink-800/30' },
            { key: 'designerEnabled', label: 'المصمم الذكي', desc: 'تفعيل أدوات التصميم بالذكاء الاصطناعي', icon: PenTool, color: 'text-theme-primary', bgColor: 'bg-purple-50 dark:bg-purple-900/10', borderColor: 'border-purple-200 dark:border-purple-800/30' },
            { key: 'cartEnabled', label: 'نظام السلة والطلبات', desc: 'إتاحة عمليات الشراء وإدارة الطلبات', icon: ShoppingCart, color: 'text-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-900/10', borderColor: 'border-orange-200 dark:border-orange-800/30' },
            { key: 'storeEnabled', label: 'متجر خيوط للأقمشة', desc: 'تفعيل متجر خيوط لشراء الأقمشة (تجريبي)', icon: Store, color: 'text-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-900/10', borderColor: 'border-emerald-200 dark:border-emerald-800/30' },
            { key: 'allowNewRegistrations', label: 'التسجيل الجديد', desc: 'السماح للمستخدمين الجدد بإنشاء حسابات', icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/10', borderColor: 'border-blue-200 dark:border-blue-800/30' },
            { key: 'maintenanceMode', label: 'وضع الصيانة', desc: 'إغلاق الموقع مؤقتاً لجميع المستخدمين', icon: Lock, color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-900/10', borderColor: 'border-red-200 dark:border-red-800/30' },
          ].map((item: any) => (
            <div key={item.key} className="p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
              <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-2xl ${item.bgColor} border-[1.5px] ${item.borderColor} ${item.color}`}>
                    <item.icon size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900 dark:text-white text-sm">{item.label}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.desc}</p>
                  </div>
              </div>
              <button 
                onClick={() => handleToggle(item.key)}
                className={`w-12 h-6 rounded-full p-1 transition-all ${localSettings[item.key as keyof AppSettings] ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                title={localSettings[item.key as keyof AppSettings] ? 'الغاء التفعيل' : 'تفعيل'}
                aria-label={item.label}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow transform transition ${localSettings[item.key as keyof AppSettings] ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          ))}

          {/* إعدادات فيديو المساعدة */}
          <div className="p-6 bg-zinc-50 dark:bg-zinc-800/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-500/40">جديد</span>
                  إعدادات فيديو المساعدة
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">تحكّم بزر "شاهد" الذي يعرض فيديو شرح المقاسات داخل صفحات العميل.</p>
              </div>
              <button
                onClick={() => setLocalSettings(prev => ({
                  ...prev,
                  helpVideo: {
                    ...(prev.helpVideo || {}),
                    enabled: !(prev.helpVideo?.enabled)
                  }
                }))}
                className={`w-12 h-6 rounded-full p-1 transition-all ${localSettings.helpVideo?.enabled ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                title={localSettings.helpVideo?.enabled ? 'الغاء التفعيل' : 'تفعيل'}
                aria-label="تفعيل فيديو المساعدة"
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow transform transition ${localSettings.helpVideo?.enabled ? 'translate-x-6' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2 text-right">رابط الفيديو (YouTube)</label>
                <input
                  type="text"
                  defaultValue={localSettings.helpVideo?.url || ''}
                  onBlur={(e) => setLocalSettings(prev => ({
                    ...prev,
                    helpVideo: {
                      ...(prev.helpVideo || {}),
                      url: e.target.value
                    }
                  }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.currentTarget.blur();
                    }
                  }}
                  placeholder="مثال: https://youtu.be/xxxxxxxx أو https://www.youtube.com/watch?v=xxxxxxx"
                  className="w-full px-3 py-2 rounded-2xl border-[1.5px] border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-theme-primary/40"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2 text-right">نص الزر</label>
                <input
                  type="text"
                  defaultValue={localSettings.helpVideo?.buttonText || 'شاهد'}
                  onBlur={(e) => setLocalSettings(prev => ({
                    ...prev,
                    helpVideo: {
                      ...(prev.helpVideo || {}),
                      buttonText: e.target.value
                    }
                  }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.currentTarget.blur();
                    }
                  }}
                  placeholder="شاهد"
                  className="w-full px-3 py-2 rounded-2xl border-[1.5px] border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-theme-primary/40"
                />
              </div>
              <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-200 px-3 py-2 rounded-2xl text-xs md:justify-end border-[1.5px] border-purple-200 dark:border-purple-500/30">
                <CheckCircle size={14} />
                <span>نقوم تلقائياً بتحويل الروابط إلى صيغة embed المتوافقة مع YouTube.</span>
              </div>
            </div>
          </div>

          {/* ??????? ????? ?????? */}
          <div className="p-6 bg-zinc-50 dark:bg-zinc-800/20">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">????? ??????</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">???? ??????? ???????? ????????? (HEX) ???????? ??? ??????? ?????? ????????.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2 text-right">????? ???????</label>
                <input
                  type="text"
                  defaultValue={localSettings.themeColors?.primary || '#CFFF04'}
                  onBlur={(e) => setLocalSettings(prev => ({
                    ...prev,
                    themeColors: {
                      ...(prev.themeColors || {}),
                      primary: e.target.value
                    }
                  }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.currentTarget.blur();
                    }
                  }}
                  placeholder="#CFFF04"
                  className="w-full px-3 py-2 rounded-2xl border-[1.5px] border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-theme-primary/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2 text-right">????? ???????</label>
                <input
                  type="text"
                  defaultValue={localSettings.themeColors?.secondary || '#D4AF37'}
                  onBlur={(e) => setLocalSettings(prev => ({
                    ...prev,
                    themeColors: {
                      ...(prev.themeColors || {}),
                      secondary: e.target.value
                    }
                  }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.currentTarget.blur();
                    }
                  }}
                  placeholder="#D4AF37"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-theme-primary/40"
                />
              </div>
            </div>
          </div>

          {/* إعدادات مقاسات قوالب المقاسات */}
          <div className="p-5 border-t border-zinc-800/50 bg-zinc-900/40">
            <div className="mb-4">
              <h3 className="text-sm font-normal text-white mb-1">مقاسات صور قوالب المقاسات</h3>
              <p className="text-xs text-zinc-400">حدد الأبعاد الموحدة المطلوبة لصور قوالب المقاسات (بالبكسل)</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="template-width" className="block text-xs font-medium text-zinc-300 mb-2">العرض (Width)</label>
                <input
                  id="template-width"
                  type="number"
                  min="100"
                  max="5000"
                  value={localSettings.measurementTemplateWidth || 600}
                  onChange={(e) => {
                    const newSettings = { ...localSettings, measurementTemplateWidth: parseInt(e.target.value) || 600 };
                    setLocalSettings(newSettings);
                    saveAppSettings(newSettings, { silent: true, optimistic: true });
                  }}
                  title="العرض"
                  placeholder="600"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white text-sm focus:ring-2 focus:ring-theme-primary/40"
                />
              </div>
              <div>
                <label htmlFor="template-height" className="block text-xs font-medium text-zinc-300 mb-2">الارتفاع (Height)</label>
                <input
                  id="template-height"
                  type="number"
                  min="100"
                  max="5000"
                  value={localSettings.measurementTemplateHeight || 800}
                  onChange={(e) => {
                    const newSettings = { ...localSettings, measurementTemplateHeight: parseInt(e.target.value) || 800 };
                    setLocalSettings(newSettings);
                    saveAppSettings(newSettings, { silent: true, optimistic: true });
                  }}
                  title="الارتفاع"
                  placeholder="800"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white text-sm focus:ring-2 focus:ring-theme-primary/40"
                />
              </div>
            </div>
            <div className="mt-3 p-3 bg-purple-500/15 rounded-lg border border-purple-500/30">
              <p className="text-xs text-purple-200">
                📐 المقاس الحالي: <span className="font-normal">{localSettings.measurementTemplateWidth || 600}×{localSettings.measurementTemplateHeight || 800}</span> بكسل (نسبة 3:4)
              </p>
            </div>
          </div>
      </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (!canAccessSection(activeSection)) {
      return <AccessDeniedView title="صلاحيات غير كافية" description="ليس لديك إذن للوصول إلى هذا القسم." />;
    }

    if (location.pathname.startsWith('/admin/settings/surveys/khuyoot-validation')) {
      return <SurveyResponsesPage />;
    }

    // Check if user is a limited admin to show appropriate dashboard
    const isLimitedAdminUser =
      user?.adminAccess?.mode === 'limited' ||
      user?.adminPermissions?.mode === 'limited';

    switch(activeSection) {
      case 'dashboard':
        return isLimitedAdminUser ? (
          <LimitedAdminDashboard users={users} orders={orders} tailors={tailors} />
        ) : (
          <DashboardOverview users={users} orders={orders} tailors={tailors} logs={logs} />
        );
      case 'orders': return <OrdersTable orders={orders} />;
      case 'approvals': return <MerchantsApproval />;
      case 'users': return <UsersManagement />;
      case 'tailors': return <ShopsManagement shops={allShops} shopType="tailor" title="جميع محلات الخياطة" />;
      case 'boutiques': return <ShopsManagement shops={allShops} shopType="boutique" title="إدارة البوتيكات" />;
      case 'shops': return <ShopsManagement shops={allShops} shopType="fabric_store" title="المحلات الأخرى (أقمشة ومواد خياطة)" />;
      case 'products': return <ProductsManagement />;
      case 'orphaned-products': return <OrphanedProducts />;
      case 'store': return (
        <div className="space-y-6 max-w-3xl">
          <h2 className="text-2xl font-normal text-slate-800 dark:text-white mb-4">إدارة متجر خيوط</h2>
          
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-start gap-6">
              <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                <Store size={48} />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-normal mb-2">لوحة التحكم الكاملة للمتجر</h3>
                <p className="text-emerald-50 mb-6">
                  انتقل إلى صفحة إدارة المتجر المنفصلة للوصول إلى جميع ميزات الإدارة الشاملة:
                  إدارة المنتجات، الطلبات، المخزون، التقارير والإحصائيات.
                </p>
                <Button 
                  onClick={() => navigate('/store-admin')}
                  className="bg-white text-emerald-600 hover:bg-emerald-50 font-normal flex items-center gap-2 shadow-lg"
                >
                  <Store size={20} />
                  الانتقال إلى إدارة المتجر
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Package className="text-blue-500" size={24} />
                </div>
                <h4 className="font-normal text-slate-800 dark:text-white">إدارة المنتجات</h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-zinc-400">
                إضافة وتعديل وحذف المنتجات، إدارة الفئات والأسعار
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <ShoppingCart className="text-amber-500" size={24} />
                </div>
                <h4 className="font-normal text-slate-800 dark:text-white">معالجة الطلبات</h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-zinc-400">
                متابعة الطلبات، تحديث الحالات، إدارة الشحن والتوصيل
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Activity className="text-theme-primary" size={24} />
                </div>
                <h4 className="font-normal text-slate-800 dark:text-white">التقارير والإحصائيات</h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-zinc-400">
                تقارير المبيعات، تحليل الأداء، إحصائيات شاملة
              </p>
            </div>
          </div>
        </div>
      );
      case 'images': return <ImageLibraryManagement />;
      case 'fabrics': return <FabricLibrary />;
      case 'tryon-templates': return <TryOnTemplates />;
      case 'measurements': return <MeasurementTemplates />;
      case 'family': return <PlaceholderView title="ملفات العائلة" icon={Users} />;
      case 'ai': return <AIModels aiModels={aiModels} />;
      case 'notifications': return <NotificationsSender />;
      case 'ads': return <AdsManagement />;
      case 'regions': return <RegionsManagement />;
      case 'financial': return <FinancialManagement />;
      case 'credits': return <CreditsManagement />;
      case 'debug-tools': return <ConfigView />;
      case 'config': return <ConfigView />;
      case 'logs': return <PlaceholderView title="سجلات النظام" icon={FileText} />;
      default:
        return isLimitedAdminUser ? (
          <LimitedAdminDashboard users={users} orders={orders} tailors={tailors} />
        ) : (
          <DashboardOverview users={users} orders={orders} tailors={tailors} logs={logs} />
        );
    }
  };

  if (isSigningOut) {
    return (
      <div className="h-screen w-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white/95 shadow-[0_30px_80px_rgba(15,23,42,0.12)] px-8 py-10 text-center">
          <Activity className="animate-spin text-theme-primary mx-auto mb-4" size={36} />
          <p className="text-base font-medium text-slate-800">جاري تسجيل الخروج...</p>
          <p className="mt-1 text-xs text-slate-500">سيتم تحويلك إلى الصفحة الرئيسية</p>
        </div>
      </div>
    );
  }

  // شاشة تحميل أثناء التحقق من المصادقة
  // Keep this gate time-bound to avoid indefinite spinners if auth is slow.
  // Also show spinner if global loading is active to prevent flashes of restricted area
  if (isCheckingAuth || loading) {
    return (
      <div className="h-screen w-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white/95 shadow-[0_30px_80px_rgba(15,23,42,0.12)] px-8 py-10 text-center">
          <div className="relative mx-auto mb-5 h-20 w-20">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-theme-primary border-r-theme-primary animate-spin" />
            <div className="absolute inset-[14px] rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
              <img src="/logo.png?v=4" alt="خيوط" className="h-8 w-8 object-contain" />
            </div>
          </div>

          <p className="text-base font-medium text-slate-800">جاري التحقق من الصلاحيات...</p>
          <p className="mt-1 text-xs text-slate-500">يرجى الانتظار لحظة واحدة</p>

          <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-theme-primary/70 to-theme-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Check both authentication and admin role
  // CRITICAL: Check Firebase auth state first to prevent cached access
  const isFirebaseAuthenticated = !!firebaseService.auth.currentUser;
  const hasUserData = !!user;
  const role = String(user?.role || '').toLowerCase();
  const isAdminRole = role === 'admin';
  const accessMode = String(user?.adminAccess?.mode || '').toLowerCase();
  const permissionsMode = String(user?.adminPermissions?.mode || '').toLowerCase();

  const hasAdminMode =
    accessMode === 'full' ||
    accessMode === 'unlimited' ||
    accessMode === 'limited' ||
    permissionsMode === 'full' ||
    permissionsMode === 'unlimited' ||
    permissionsMode === 'limited';
  
  if (!isFirebaseAuthenticated || !hasUserData || (!isAdminRole && !hasAdminMode)) {
     return (
        <div className="h-screen w-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center text-center p-4" dir="rtl">
           <div className="max-w-md w-full">
             <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl p-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
               <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
                 <Shield size={40} className="text-red-500" />
               </div>
               
               <h1 className="text-3xl font-normal text-slate-900 mb-2">منطقة محظورة</h1>
               <p className="text-slate-600 mb-8 leading-relaxed">
                 {showLoginForm 
                   ? 'أدخل بيانات حساب المسؤول للمتابعة' 
                   : 'يجب عليك تسجيل الدخول بحساب مسؤول (Admin) للوصول إلى لوحة التحكم.'
                 }
               </p>

               {!showLoginForm ? (
                 <div className="space-y-3">
                   {loginError && (
                     <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
                       {loginError}
                     </div>
                   )}
                   <Button 
                     onClick={() => setShowLoginForm(true)} 
                     className="w-full bg-theme-primary hover:bg-theme-primary/90 text-white shadow-lg shadow-theme-primary/20 hover:shadow-theme-primary/35 flex items-center justify-center gap-2 transition-all"
                   >
                     <Lock size={18} />
                     تسجيل دخول كمسؤول
                   </Button>

                   <div className="flex items-center gap-3">
                     <div className="flex-1 h-px bg-slate-200" />
                     <span className="text-xs text-slate-400">أو</span>
                     <div className="flex-1 h-px bg-slate-200" />
                   </div>

                   <button
                     type="button"
                     onClick={handleAdminGoogleLogin}
                     disabled={isLoggingIn}
                     className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                   >
                     {isLoggingIn ? (
                       <Activity className="animate-spin text-slate-400" size={18} />
                     ) : (
                       <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                         <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                         <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                         <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                         <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                       </svg>
                     )}
                     {isLoggingIn ? 'جاري التحقق...' : 'تسجيل الدخول بـ Google'}
                   </button>

                   <button 
                     onClick={() => navigate('/')}
                     className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-medium transition-colors"
                   >
                     العودة للرئيسية
                   </button>
                 </div>
               ) : (
                 <form onSubmit={handleAdminLogin} className="space-y-4">
                   {loginError && (
                     <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
                       {loginError}
                     </div>
                   )}
                   
                   <div className="text-right">
                     <label className="block text-sm font-medium text-slate-700 mb-2">
                       البريد الإلكتروني
                     </label>
                     <input
                       type="email"
                       value={loginEmail}
                       onChange={(e) => setLoginEmail(e.target.value)}
                       placeholder="admin@example.com"
                       title="البريد الإلكتروني"
                       required
                       className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-theme-primary/25 focus:border-theme-primary"
                     />
                   </div>

                   <div className="text-right">
                     <label className="block text-sm font-medium text-slate-700 mb-2">
                       كلمة المرور
                     </label>
                     <div className="relative">
                       <button
                         type="button"
                         onClick={() => setShowPassword(!showPassword)}
                         className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                       >
                         {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                       </button>
                       <input
                         type={showPassword ? "text" : "password"}
                         value={loginPassword}
                         onChange={(e) => setLoginPassword(e.target.value)}
                         placeholder="••••••••"
                         required
                         className="w-full px-4 py-3 pl-10 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-theme-primary/25 focus:border-theme-primary"
                       />
                     </div>
                   </div>

                   <div className="space-y-2 pt-2">
                     <Button 
                       type="submit" 
                       disabled={isLoggingIn}
                       className="w-full bg-theme-primary hover:bg-theme-primary/90 shadow-lg shadow-theme-primary/20 hover:shadow-theme-primary/35 flex items-center justify-center gap-2 transition-all disabled:shadow-none disabled:bg-slate-400"
                     >
                       {isLoggingIn ? (
                         <>
                           <Activity className="animate-spin" size={18} />
                           جاري التحقق...
                         </>
                       ) : (
                         <>
                           <Lock size={18} />
                           تسجيل الدخول
                         </>
                       )}
                     </Button>
                     
                     <div className="flex items-center gap-3 py-1">
                       <div className="flex-1 h-px bg-slate-200" />
                       <span className="text-xs text-slate-400">أو</span>
                       <div className="flex-1 h-px bg-slate-200" />
                     </div>

                     <button
                       type="button"
                       onClick={handleAdminGoogleLogin}
                       disabled={isLoggingIn}
                       className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                     >
                       {isLoggingIn ? (
                         <Activity className="animate-spin text-slate-400" size={18} />
                       ) : (
                         <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                           <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                           <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                           <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                           <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                         </svg>
                       )}
                       {isLoggingIn ? 'جاري التحقق...' : 'تسجيل الدخول بـ Google'}
                     </button>
                     
                     <button
                       type="button"
                       onClick={() => {
                         setShowLoginForm(false);
                         setLoginError('');
                         setLoginEmail('');
                         setLoginPassword('');
                       }}
                       className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-medium transition-colors"
                     >
                       إلغاء
                     </button>
                   </div>
                 </form>
               )}

               {user && user.role !== 'admin' && (
                 <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
                   <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-700 text-xs">
                     ⚠️ أنت مسجل دخول كـ "{user.role}" - يجب أن يكون الدور "admin" في Firestore
                     <div className="mt-2 text-[10px] opacity-70">UID: {user.uid}</div>
                     <div className="text-[10px] opacity-70">Email: {user.email}</div>
                   </div>
                   
                   <Button 
                     variant="outline"
                     size="sm"
                     className="w-full text-xs"
                     onClick={() => {
                        localStorage.clear();
                        window.location.reload();
                     }}
                   >
                     مسح الذاكرة التخزينية وتحديث الصفحة
                   </Button>

                   <Button 
                     variant="ghost"
                     size="sm"
                     className="w-full text-xs text-red-600 hover:bg-red-50"
                     onClick={handleLogout}
                   >
                     تسجيل الخروج والتبديل
                   </Button>
                 </div>
               )}
             </div>
           </div>
        </div>
     );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden dir-rtl">
      <Sidebar 
        activeSection={activeSection} 
        isOpen={isSidebarOpen} 
        setIsOpen={setSidebarOpenPersisted}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
        tailorsCount={tailorsCount}
        boutiquesCount={boutiquesCount}
        shopsCount={shopsCount}
        canAccessSection={canAccessSection}
      />

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpenPersisted(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-[#ededed] dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 shadow-sm z-10">
           <div className="flex items-center gap-4">
             <button 
               onClick={() => setSidebarOpenPersisted(!isSidebarOpen)} 
               className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"
               title={isSidebarOpen ? "إخفاء الشريط الجانبي" : "إظهار الشريط الجانبي"}
             >
               <Menu size={24} />
             </button>
             <button 
               onClick={() => navigate('/')}
               className="p-2 text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
               title="الصفحة الرئيسية"
             >
               <Home size={20} />
             </button>
             <div className="flex items-center gap-3">
               <h2 className="text-lg font-normal text-zinc-900 dark:text-white capitalize">
                 {activeSectionLabel}
               </h2>
             </div>
           </div>

           <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                 <input type="text" placeholder="بحث سريع..." className="pl-4 pr-10 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full text-xs w-64 focus:ring-2 focus:ring-theme-primary/50 focus:border-theme-primary" />
                 <Search size={14} className="absolute top-1/2 -translate-y-1/2 right-3 text-zinc-400" />
              </div>
              <button title="التنبيهات" className="relative p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                 <Bell size={20} />
                 <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div ref={profileMenuRef} className="relative border-r border-zinc-200 dark:border-zinc-700 pr-4">
                <button
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="قائمة الحساب"
                >
                  {adminAvatarSrc ? (
                    <img
                      src={adminAvatarSrc}
                      alt={adminDisplayName}
                      className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-normal">
                      {adminInitial}
                    </div>
                  )}
                  <div className="text-left hidden md:block">
                    <p className="text-xs font-normal text-zinc-900 dark:text-white leading-tight">{adminDisplayName}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">{adminRoleLabel}</p>
                  </div>
                  <ChevronDown size={14} className="text-zinc-500" />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute left-0 mt-2 w-52 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl p-1 z-30">
                    <button
                      onClick={() => {
                        navigate('/admin/config/general');
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Settings size={15} />
                      إعدادات النظام
                    </button>
                    {canAccessSection('users') && (
                      <button
                        onClick={() => {
                          navigate('/admin/users');
                          setIsProfileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Users size={15} />
                        إدارة المستخدمين
                      </button>
                    )}
                    <button
                      onClick={() => {
                        navigate('/admin/settings/surveys/khuyoot-validation');
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Home size={15} />
                      الصفحة الرئيسية
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut size={15} />
                      تسجيل الخروج
                    </button>
                  </div>
                )}
              </div>
           </div>
        </header>

        <main
          id={`admin-${activeSection}`}
          data-admin-section={activeSection}
          className="flex-1 overflow-y-auto p-4 scroll-smooth"
        >
          {renderContent()}
        </main>

        {/* Full-Screen Dashboard Modal */}
        {isFullScreenMode && createPortal(
          <div className="fixed inset-0 z-[9999] bg-zinc-950 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="h-16 bg-gradient-to-r from-zinc-900 to-zinc-800 border-b border-zinc-700 px-6 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-3">
                <Shield className="text-theme-primary" size={28} />
                <div>
                  <h1 className="text-lg font-normal text-white">لوحة التحكم - وضع منفصل</h1>
                  <p className="text-xs text-zinc-400">Admin Dashboard - Full Screen Mode</p>
                </div>
              </div>
              <button
                onClick={() => {
                  console.log('❌ AdminApp - Closing full-screen dashboard mode');
                  setIsFullScreenMode(false);
                }}
                className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-300 hover:text-white transition-colors"
                title="إغلاق النافذة المنفصلة"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-full">
                <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-zinc-700/50 overflow-hidden shadow-xl shadow-theme-primary/40 p-8">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-normal text-white mb-2">لوحة التحكم الرئيسية</h2>
                    <p className="text-zinc-400">هذه نسخة منفصلة من لوحة التحكم بدون حاويات الوالد</p>
                  </div>

                  {/* Dashboard Content Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {[
                      { icon: <Users size={32} />, title: 'المستخدمون', count: users.length, color: 'from-blue-600 to-blue-700', icon_color: 'text-blue-300' },
                      { icon: <ShoppingCart size={32} />, title: 'الطلبات', count: orders.length, color: 'from-orange-600 to-orange-700', icon_color: 'text-orange-300' },
                      { icon: <Scissors size={32} />, title: 'الخياطون', count: tailors.length, color: 'from-purple-600 to-purple-700', icon_color: 'text-purple-300' },
                      { icon: <Package size={32} />, title: 'المنتجات', count: '1,234', color: 'from-emerald-600 to-emerald-700', icon_color: 'text-emerald-300' },
                      { icon: <Building2 size={32} />, title: 'المحلات', count: '45', color: 'from-pink-600 to-pink-700', icon_color: 'text-pink-300' },
                      { icon: <FileText size={32} />, title: 'السجلات', count: 'N/A', color: 'from-indigo-600 to-indigo-700', icon_color: 'text-indigo-300' },
                    ].map((item, idx) => (
                      <div key={idx} className={`bg-gradient-to-br ${item.color} rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow`}>
                        <div className={`${item.icon_color} mb-4 opacity-80`}>{item.icon}</div>
                        <h3 className="text-white font-normal mb-1">{item.title}</h3>
                        <p className="text-white/90 text-2xl font-extrabold">{item.count}</p>
                      </div>
                    ))}
                  </div>

                  {/* Info Message */}
                  <div className="bg-purple-500/15 border border-purple-500/30 rounded-xl p-6 text-center">
                    <p className="text-purple-200 text-sm">
                      ✨ هذه لوحة تحكم منفصلة وكاملة بدون أي حاويات أو أشرطة جانبية - تعمل كنافذة مستقلة تماماً
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

