import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, Menu, Search, Bell, Activity, Save, PlayCircle, PenTool, ShoppingCart, Users, Lock, Scissors, Package, FileText, Store, Building2, Moon, Sun, CheckCircle, Home, Maximize2, X } from 'lucide-react';
import { Button } from '../../components/Button';
import { AppSettings, User, Order, SystemLog, Fabric, AIModelConfig, Tailor, Shop, MeasurementProfile } from '../../types';
import { getUsers, getTailors, getAllShops, MOCK_ORDERS } from '../../services/mockService';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { DevSectionAnchor } from './components/DevSectionAnchor';
import { UpgradeModal } from '../components/DesignerV2_1/UpgradeModal';
import { createPortal } from 'react-dom';
import { useModalStore } from '../store/useModalStore';
import { DashboardOverview } from './dashboard/DashboardOverview';
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
import { AdminDevTools } from '../components/AdminDevTools';
import { SurveyResponsesPage } from '../features/admin/surveys/SurveyResponsesPage';
import { DebugToolsHub } from './settings/DebugToolsHub';

type AdminSection = 
  | 'dashboard' 
  | 'orders'
  | 'approvals'
  | 'users'
  | 'tailors' 
  | 'boutiques'
  | 'shops'
  | 'products'
  | 'orphaned-products' 
  | 'fabrics' 
  | 'measurements' 
  | 'family' 
  | 'ai' 
  | 'store'
  | 'images'
  | 'tryon-templates'
  | 'notifications'
  | 'ads'
  | 'regions'
  | 'financial'
  | 'credits'
  | 'debug-tools'
  | 'config' 
  | 'logs';

type ConfigSection = 'general' | 'homepage' | 'texts' | 'social' | 'seo' | 'advanced' | 'product-page';

type ExtendedConfigSection = ConfigSection | 'designer' | 'debug-tools';

const CONFIG_SECTIONS: ReadonlyArray<ExtendedConfigSection> = ['general', 'homepage', 'designer', 'texts', 'social', 'seo', 'advanced', 'product-page', 'debug-tools'];

function getConfigSectionFromPathname(pathname: string): ExtendedConfigSection {
  // Supported:
  // - /admin/config
  // - /admin/config/
  // - /admin/config/:tab
  // - /admin/config/:tab/
  const parts = String(pathname || '').split('/').filter(Boolean);
  // parts: ['admin', 'config', ':tab?']
  const tab = parts[2];
  if (CONFIG_SECTIONS.includes(tab as ExtendedConfigSection)) return tab as ExtendedConfigSection;
  return 'general';
}

export const AdminApp = () => {
  const { appSettings, saveAppSettings, user, logout, login, loading, theme, toggleTheme } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

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
  const [localSettings, setLocalSettings] = useState<AppSettings>(appSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(getDefaultSidebarOpen);
  const [isSmallScreen, setIsSmallScreen] = useState(getIsSmallScreen);
  const { isUpgradeModalOpen, setIsUpgradeModalOpen } = useModalStore();
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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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

  // Data States
  const [users, setUsers] = useState<User[]>([]);
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  
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
    setLocalSettings(appSettings);
    getUsers().then(setUsers);
    getTailors().then(setTailors);
    
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
    const timer = setTimeout(() => {
      setIsCheckingAuth(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // إذا تغير المستخدم، أعد التحقق
  useEffect(() => {
    if (user !== null) {
      setIsCheckingAuth(false);
    }
  }, [user]);

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
      await logout();
      // Navigate to homepage after logout
      navigate('/', { replace: true });
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    
    try {
      await login(loginEmail, loginPassword);
      
      // انتظر قليلاً لتحميل بيانات المستخدم من Firestore
      setTimeout(() => {
        setShowLoginForm(false);
        setIsLoggingIn(false);
      }, 1500);
      
    } catch (error: any) {
      setLoginError(error.message || 'فشل تسجيل الدخول. تحقق من البيانات.');
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
       <h3 className="text-lg font-bold text-slate-600 dark:text-zinc-300">{title}</h3>
       <p className="text-sm">هذه الوحدة قيد التطوير حالياً</p>
    </div>
  );

  const ConfigView = () => {
    const configSection = getConfigSectionFromPathname(location.pathname);

    return (
      <div className="space-y-6 w-full max-w-none min-w-0 rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-[0_20px_60px_-30px_rgba(168,85,247,0.25)]">
        <div className="flex justify-between items-start gap-3 mb-4">
          <div>
            <h2 className="text-xl font-black text-white drop-shadow-sm">إعدادات النظام</h2>
            <p className="text-sm text-zinc-400">تحديث الإعدادات بنفس لغة واجهة المصمم 2.1</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/visualizer"
              className="inline-flex items-center gap-2 rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-100 hover:bg-purple-500/20 transition-colors"
            >
              <Maximize2 size={14} />
              <span>فتح الـ 3D Visualizer</span>
            </Link>
            {configSection === 'general' && (
              <Button onClick={handleSaveSettings} disabled={isSaving} className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all disabled:shadow-none disabled:from-slate-400 disabled:to-slate-400">
                {isSaving ? <Activity className="animate-spin" size={16} /> : <Save size={16} />}
                <span>حفظ التغييرات</span>
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => navigate('/admin/config/general')}
            className={`px-4 py-2 rounded-full text-sm md:text-base font-semibold transition-all whitespace-nowrap border ${
              configSection === 'general'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 border-purple-400/40'
                : 'bg-zinc-800/50 text-zinc-200 border-zinc-700 hover:bg-zinc-800'
            }`}
          >
            الإعدادات العامة
          </button>
          <button
            onClick={() => navigate('/admin/config/homepage')}
            className={`px-4 py-2 rounded-full text-sm md:text-base font-semibold transition-all whitespace-nowrap border ${
              configSection === 'homepage'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 border-purple-400/40'
                : 'bg-zinc-800/50 text-zinc-200 border-zinc-700 hover:bg-zinc-800'
            }`}
          >
            الصفحة الرئيسية
          </button>
          <button
            onClick={() => navigate('/admin/config/designer')}
            className={`px-4 py-2 rounded-full text-sm md:text-base font-semibold transition-all whitespace-nowrap border ${
              configSection === 'designer'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 border-purple-400/40'
                : 'bg-zinc-800/50 text-zinc-200 border-zinc-700 hover:bg-zinc-800'
            }`}
          >
            المصمم
          </button>
          <button
            onClick={() => navigate('/admin/config/product-page')}
            className={`px-4 py-2 rounded-full text-sm md:text-base font-semibold transition-all whitespace-nowrap border ${
              configSection === 'product-page'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 border-purple-400/40'
                : 'bg-zinc-800/50 text-zinc-200 border-zinc-700 hover:bg-zinc-800'
            }`}
          >
            صفحة المنتج
          </button>
          <button
            onClick={() => navigate('/admin/config/texts')}
            className={`px-4 py-2 rounded-full text-sm md:text-base font-semibold transition-all whitespace-nowrap border ${
              configSection === 'texts'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 border-purple-400/40'
                : 'bg-zinc-800/50 text-zinc-200 border-zinc-700 hover:bg-zinc-800'
            }`}
          >
            نصوص الموقع
          </button>
          <button
            onClick={() => navigate('/admin/config/social')}
            className={`px-4 py-2 rounded-full text-sm md:text-base font-semibold transition-all whitespace-nowrap border ${
              configSection === 'social'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 border-purple-400/40'
                : 'bg-zinc-800/50 text-zinc-200 border-zinc-700 hover:bg-zinc-800'
            }`}
          >
            السوشيال ميديا
          </button>
          <button
            onClick={() => navigate('/admin/config/seo')}
            className={`px-4 py-2 rounded-full text-sm md:text-base font-semibold transition-all whitespace-nowrap border ${
              configSection === 'seo'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 border-purple-400/40'
                : 'bg-zinc-800/50 text-zinc-200 border-zinc-700 hover:bg-zinc-800'
            }`}
          >
            SEO
          </button>
          <button
            onClick={() => navigate('/admin/config/advanced/orders')}
            className={`px-4 py-2 rounded-full text-sm md:text-base font-semibold transition-all whitespace-nowrap border ${
              configSection === 'advanced'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 border-purple-400/40'
                : 'bg-zinc-800/50 text-zinc-200 border-zinc-700 hover:bg-zinc-800'
            }`}
          >
            إعدادات متقدمة
          </button>

          <button
            onClick={() => navigate('/admin/config/debug-tools')}
            className={`px-4 py-2 rounded-full text-sm md:text-base font-semibold transition-all whitespace-nowrap border ${
              configSection === 'debug-tools'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 border-purple-400/40'
                : 'bg-zinc-800/50 text-zinc-200 border-zinc-700 hover:bg-zinc-800'
            }`}
          >
            أدوات التشخيص
          </button>
        </div>

        {configSection === 'debug-tools' ? (
          <DebugToolsHub />
        ) : configSection === 'homepage' ? (
          <HomePageSettings />
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
          <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-zinc-700/50 overflow-hidden divide-y divide-zinc-800/50 shadow-xl shadow-purple-900/20">
            {/* خيار الوضع الفاتح/الداكن */}
          <div className="p-5 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg bg-zinc-800/50 ${theme === 'dark' ? 'text-purple-400' : 'text-amber-300'} border border-zinc-700`}>
                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <div>
                <p className="font-semibold text-white text-sm">مظهر لوحة التحكم</p>
                <p className="text-xs text-zinc-400">التبديل بين الوضع الفاتح والداكن للوحة التحكم</p>
              </div>
            </div>
            <button 
              onClick={toggleTheme}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors border border-zinc-700 shadow-sm ${
                theme === 'dark' 
                  ? 'bg-purple-600 text-white hover:bg-purple-500' 
                  : 'bg-amber-500 text-white hover:bg-amber-400'
              }`}
            >
              {theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
            </button>
          </div>

          {[
            { key: 'storiesEnabled', label: 'القصص (Stories)', desc: 'تفعيل ميزة القصص للخياطين في الصفحة الرئيسية', icon: PlayCircle, color: 'text-pink-500' },
            { key: 'designerEnabled', label: 'المصمم الذكي', desc: 'تفعيل أدوات التصميم بالذكاء الاصطناعي', icon: PenTool, color: 'text-purple-500' },
            { key: 'cartEnabled', label: 'نظام السلة والطلبات', desc: 'إتاحة عمليات الشراء وإدارة الطلبات', icon: ShoppingCart, color: 'text-orange-500' },
            { key: 'storeEnabled', label: 'متجر خيوط للأقمشة', desc: 'تفعيل متجر خيوط لشراء الأقمشة (تجريبي)', icon: Store, color: 'text-emerald-500' },
            { key: 'allowNewRegistrations', label: 'التسجيل الجديد', desc: 'السماح للمستخدمين الجدد بإنشاء حسابات', icon: Users, color: 'text-blue-500' },
            { key: 'maintenanceMode', label: 'وضع الصيانة', desc: 'إغلاق الموقع مؤقتاً لجميع المستخدمين', icon: Lock, color: 'text-red-500' },
          ].map((item: any) => (
            <div key={item.key} className="p-5 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
              <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg bg-zinc-800/50 border border-zinc-700 ${item.color}`}>
                    <item.icon size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{item.label}</p>
                    <p className="text-xs text-zinc-400">{item.desc}</p>
                  </div>
              </div>
              <button 
                onClick={() => handleToggle(item.key)}
                className={`w-12 h-6 rounded-full p-1 transition-colors border border-zinc-700 ${localSettings[item.key as keyof AppSettings] ? 'bg-emerald-500' : 'bg-zinc-700'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow transform transition ${localSettings[item.key as keyof AppSettings] ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          ))}

          {/* إعدادات فيديو المساعدة */}
          <div className="p-5 border-t border-zinc-800/50 bg-zinc-900/40">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-200 border border-purple-500/40">جديد</span>
                  إعدادات فيديو المساعدة
                </h3>
                <p className="text-xs text-zinc-400 mt-1">تحكّم بزر "شاهد" الذي يعرض فيديو شرح المقاسات داخل صفحات العميل.</p>
              </div>
              <button
                onClick={() => setLocalSettings(prev => ({
                  ...prev,
                  helpVideo: {
                    ...(prev.helpVideo || {}),
                    enabled: !(prev.helpVideo?.enabled)
                  }
                }))}
                className={`w-12 h-6 rounded-full p-1 transition-colors border border-zinc-700 ${localSettings.helpVideo?.enabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow transform transition ${localSettings.helpVideo?.enabled ? 'translate-x-6' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-zinc-300 mb-2 text-right">رابط الفيديو (YouTube)</label>
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
                  className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-purple-500/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2 text-right">نص الزر</label>
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
                  className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-purple-500/40"
                />
              </div>
              <div className="flex items-center gap-2 bg-purple-500/15 text-purple-100 px-3 py-2 rounded-lg text-xs md:justify-end border border-purple-500/30">
                <CheckCircle size={14} />
                <span>نقوم تلقائياً بتحويل الروابط إلى صيغة embed المتوافقة مع YouTube.</span>
              </div>
            </div>
          </div>

          {/* ??????? ????? ?????? */}
          <div className="p-5 border-t border-zinc-800/50 bg-zinc-900/40">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-white">????? ??????</h3>
              <p className="text-xs text-zinc-400 mt-1">???? ??????? ???????? ????????? (HEX) ???????? ??? ??????? ?????? ????????.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2 text-right">????? ???????</label>
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
                  className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-purple-500/40"
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
                  className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-purple-500/40"
                />
              </div>
            </div>
          </div>

          {/* إعدادات مقاسات قوالب المقاسات */}
          <div className="p-5 border-t border-zinc-800/50 bg-zinc-900/40">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-white mb-1">مقاسات صور قوالب المقاسات</h3>
              <p className="text-xs text-zinc-400">حدد الأبعاد الموحدة المطلوبة لصور قوالب المقاسات (بالبكسل)</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2">العرض (Width)</label>
                <input
                  type="number"
                  min="100"
                  max="5000"
                  value={localSettings.measurementTemplateWidth || 600}
                  onChange={(e) => {
                    const newSettings = { ...localSettings, measurementTemplateWidth: parseInt(e.target.value) || 600 };
                    setLocalSettings(newSettings);
                    saveAppSettings(newSettings, { silent: true, optimistic: true });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white text-sm focus:ring-2 focus:ring-purple-500/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2">الارتفاع (Height)</label>
                <input
                  type="number"
                  min="100"
                  max="5000"
                  value={localSettings.measurementTemplateHeight || 800}
                  onChange={(e) => {
                    const newSettings = { ...localSettings, measurementTemplateHeight: parseInt(e.target.value) || 800 };
                    setLocalSettings(newSettings);
                    saveAppSettings(newSettings, { silent: true, optimistic: true });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white text-sm focus:ring-2 focus:ring-purple-500/40"
                />
              </div>
            </div>
            <div className="mt-3 p-3 bg-purple-500/15 rounded-lg border border-purple-500/30">
              <p className="text-xs text-purple-200">
                📐 المقاس الحالي: <span className="font-bold">{localSettings.measurementTemplateWidth || 600}×{localSettings.measurementTemplateHeight || 800}</span> بكسل (نسبة 3:4)
              </p>
            </div>
          </div>
      </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (location.pathname.startsWith('/admin/settings/surveys/khuyoot-validation')) {
      return <SurveyResponsesPage />;
    }
    switch(activeSection) {
      case 'dashboard': return <DashboardOverview users={users} orders={orders} tailors={tailors} logs={logs} />;
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
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">إدارة متجر خيوط</h2>
          
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-start gap-6">
              <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                <Store size={48} />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">لوحة التحكم الكاملة للمتجر</h3>
                <p className="text-emerald-50 mb-6">
                  انتقل إلى صفحة إدارة المتجر المنفصلة للوصول إلى جميع ميزات الإدارة الشاملة:
                  إدارة المنتجات، الطلبات، المخزون، التقارير والإحصائيات.
                </p>
                <Button 
                  onClick={() => navigate('/store-admin')}
                  className="bg-white text-emerald-600 hover:bg-emerald-50 font-bold flex items-center gap-2 shadow-lg"
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
                <h4 className="font-bold text-slate-800 dark:text-white">إدارة المنتجات</h4>
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
                <h4 className="font-bold text-slate-800 dark:text-white">معالجة الطلبات</h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-zinc-400">
                متابعة الطلبات، تحديث الحالات، إدارة الشحن والتوصيل
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Activity className="text-purple-500" size={24} />
                </div>
                <h4 className="font-bold text-slate-800 dark:text-white">التقارير والإحصائيات</h4>
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
      default: return <DashboardOverview users={users} orders={orders} tailors={tailors} logs={logs} />;
    }
  };

  // شاشة تحميل أثناء التحقق من المصادقة
  // Keep this gate time-bound to avoid indefinite spinners if auth is slow.
  if (isCheckingAuth) {
    return (
      <div className="h-screen w-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Activity className="animate-spin text-purple-500 mx-auto mb-4" size={48} />
          <p className="text-zinc-400">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
     return (
        <div className="h-screen w-screen bg-zinc-950 flex items-center justify-center text-center p-4" dir="rtl">
           <div className="max-w-md w-full">
             <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-700/50 rounded-3xl p-8 shadow-2xl">
               <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Shield size={40} className="text-red-500" />
               </div>
               
               <h1 className="text-3xl font-bold text-white mb-2">منطقة محظورة</h1>
               <p className="text-zinc-400 mb-8">
                 {showLoginForm 
                   ? 'أدخل بيانات حساب المسؤول للمتابعة' 
                   : 'يجب عليك تسجيل الدخول بحساب مسؤول (Admin) للوصول إلى لوحة التحكم.'
                 }
               </p>

               {!showLoginForm ? (
                 <div className="space-y-3">
                   <Button 
                     onClick={() => setShowLoginForm(true)} 
                     className="w-full bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 flex items-center justify-center gap-2 transition-all"
                   >
                     <Lock size={18} />
                     تسجيل دخول كمسؤول
                   </Button>
                   <button 
                     onClick={() => navigate('/')}
                     className="w-full py-3 px-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-300 font-medium transition-colors"
                   >
                     العودة للرئيسية
                   </button>
                 </div>
               ) : (
                 <form onSubmit={handleAdminLogin} className="space-y-4">
                   {loginError && (
                     <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
                       {loginError}
                     </div>
                   )}
                   
                   <div className="text-right">
                     <label className="block text-sm font-medium text-zinc-300 mb-2">
                       البريد الإلكتروني
                     </label>
                     <input
                       type="email"
                       value={loginEmail}
                       onChange={(e) => setLoginEmail(e.target.value)}
                       placeholder="admin@khuyoot.com"
                       required
                       className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-transparent"
                     />
                   </div>

                   <div className="text-right">
                     <label className="block text-sm font-medium text-zinc-300 mb-2">
                       كلمة المرور
                     </label>
                     <input
                       type="password"
                       value={loginPassword}
                       onChange={(e) => setLoginPassword(e.target.value)}
                       placeholder="••••••••"
                       required
                       className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-transparent"
                     />
                   </div>

                   <div className="space-y-2 pt-2">
                     <Button 
                       type="submit" 
                       disabled={isLoggingIn}
                       className="w-full bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 flex items-center justify-center gap-2 transition-all disabled:shadow-none disabled:bg-zinc-600"
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
                     
                     <button
                       type="button"
                       onClick={() => {
                         setShowLoginForm(false);
                         setLoginError('');
                         setLoginEmail('');
                         setLoginPassword('');
                       }}
                       className="w-full py-3 px-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-300 font-medium transition-colors"
                     >
                       إلغاء
                     </button>
                   </div>
                 </form>
               )}

               {user && user.role !== 'admin' && (
                 <div className="mt-6 pt-6 border-t border-zinc-700">
                   <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-yellow-400 text-xs">
                     ⚠️ أنت مسجل دخول كـ "{user.role}" - يجب أن يكون الدور "admin" في Firestore
                   </div>
                 </div>
               )}
             </div>
           </div>
        </div>
     );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden dir-rtl">
      {(location.pathname === '/admin/dashboard' || location.pathname === '/admin/dashboard/') && (
        <AdminDevTools />
      )}
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
      />

      {isSidebarOpen && isSmallScreen && (
        <div
          className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpenPersisted(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between px-6 shadow-sm z-10">
           <div className="flex items-center gap-4">
             <button 
               onClick={() => setSidebarOpenPersisted(!isSidebarOpen)} 
               className="text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300 transition-colors"
               title={isSidebarOpen ? "إخفاء الشريط الجانبي" : "إظهار الشريط الجانبي"}
             >
               <Menu size={24} />
             </button>
             <div className="flex items-center gap-3">
               <h2 className="text-lg font-bold text-slate-700 dark:text-zinc-200 capitalize">
                 {activeSection === 'ai'
                   ? 'AI Configuration'
                   : activeSection === 'debug-tools'
                     ? 'Debug Tools'
                     : activeSection}
               </h2>
               <DevSectionAnchor sectionId={activeSection} />
             </div>
           </div>

           <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/')}
                className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-md hover:shadow-lg"
                title="الصفحة الرئيسية"
              >
                <Home size={20} />
              </button>
              <button
                onClick={() => {
                  console.log('🔘 AdminApp - Show Upgrade Modal clicked');
                  setIsUpgradeModalOpen(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-colors shadow-md hover:shadow-lg font-semibold text-sm"
                title="عرض نافذة الترقية"
              >
                🪙 عرض نافذة الترقية
              </button>
              <button
                onClick={() => {
                  console.log('🖥️ AdminApp - Opening visualizer');
                  window.open('/visualizer', '_blank', 'noopener,noreferrer');
                }}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-colors shadow-md hover:shadow-lg font-semibold text-sm flex items-center gap-2"
                title="فتح لوحة التحكم في نافذة منفصلة"
              >
                <Maximize2 size={16} />
                فتح منفصل
              </button>
              <div className="relative hidden md:block">
                 <input type="text" placeholder="بحث سريع..." className="pl-4 pr-10 py-1.5 bg-slate-100 dark:bg-zinc-800 border-none rounded-full text-xs w-64 focus:ring-1 focus:ring-purple-500" />
                 <Search size={14} className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400" />
              </div>
              <button className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full">
                 <Bell size={20} />
                 <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-2 border-r border-slate-200 dark:border-zinc-700 pr-4">
                 <div className="text-left hidden md:block">
                    <p className="text-xs font-bold text-slate-700 dark:text-white">Admin User</p>
                    <p className="text-[10px] text-slate-400">Super Admin</p>
                 </div>
                 <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">A</div>
              </div>
           </div>
        </header>

        <main
          id={`admin-${activeSection}`}
          data-admin-section={activeSection}
          className="flex-1 overflow-y-auto p-6 scroll-smooth"
        >
          {renderContent()}
        </main>

        {/* Full-Screen Dashboard Modal */}
        {isFullScreenMode && createPortal(
          <div className="fixed inset-0 z-[9999] bg-zinc-950 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="h-16 bg-gradient-to-r from-zinc-900 to-zinc-800 border-b border-zinc-700 px-6 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-3">
                <Shield className="text-purple-400" size={28} />
                <div>
                  <h1 className="text-lg font-bold text-white">لوحة التحكم - وضع منفصل</h1>
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
                <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-zinc-700/50 overflow-hidden shadow-xl shadow-purple-900/20 p-8">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">لوحة التحكم الرئيسية</h2>
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
                        <h3 className="text-white font-bold mb-1">{item.title}</h3>
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
