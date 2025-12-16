import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, Menu, Search, Bell, Activity, Save, PlayCircle, PenTool, ShoppingCart, Users, Lock, Scissors, Package, FileText, Store, Building2, Moon, Sun, CheckCircle, Home } from 'lucide-react';
import { Button } from '../../components/Button';
import { AppSettings, User, Order, SystemLog, Fabric, AIModelConfig, Tailor, Shop, MeasurementProfile } from '../../types';
import { getUsers, getTailors, getAllShops, MOCK_ORDERS } from '../../services/mockService';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
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
import { HomePageSettings } from './settings/HomePageSettings';
import { SiteTextsSettings } from './settings/SiteTextsSettings';
import { SocialMediaSettings } from './settings/SocialMediaSettings';
import { SEOSettings } from './settings/SEOSettings';
import { AdvancedSettings } from './settings/AdvancedSettings';
import { NotificationsSender } from './notifications/NotificationsSender';
import { AdsManagement } from './ads/AdsManagement';
import { FinancialManagement } from './financial/FinancialManagement';
import { RegionsManagement } from './regions/RegionsManagement';

type AdminSection = 
  | 'dashboard' 
  | 'orders'
  | 'approvals'
  | 'users'
  | 'tailors' 
  | 'boutiques'
  | 'shops'
  | 'products' 
  | 'fabrics' 
  | 'measurements' 
  | 'family' 
  | 'ai' 
  | 'store'
  | 'images'
  | 'notifications'
  | 'ads'
  | 'regions'
  | 'financial'
  | 'config' 
  | 'logs';

export const AdminApp = () => {
  const { appSettings, saveAppSettings, user, logout, login, loading, theme, toggleTheme } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  
  // استخرج القسم النشط من URL بدلاً من state
  const getActiveSectionFromPath = () => {
    const path = location.pathname.replace('/admin/', '') || 'dashboard';
    return path as AdminSection;
  };
  const activeSection = getActiveSectionFromPath();
  const [localSettings, setLocalSettings] = useState<AppSettings>(appSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  // Admin Login Form State
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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
    setLocalSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    await saveAppSettings(localSettings);
    setIsSaving(false);
  };

  const handleLogout = async () => {
      await logout();
      // Stay on admin page to show login screen
      setShowLoginForm(false);
      setLoginEmail('');
      setLoginPassword('');
      setLoginError('');
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

  const PlaceholderView = ({ title, icon: Icon }: any) => (
    <div className="flex flex-col items-center justify-center h-96 text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
       <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
          <Icon size={40} className="opacity-50" />
       </div>
       <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300">{title}</h3>
       <p className="text-sm">هذه الوحدة قيد التطوير حالياً</p>
    </div>
  );

  const ConfigView = () => {
    const [configSection, setConfigSection] = useState<'general' | 'homepage' | 'texts' | 'social' | 'seo' | 'advanced'>('general');

    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">إعدادات النظام</h2>
          {configSection === 'general' && (
            <Button onClick={handleSaveSettings} disabled={isSaving} className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all disabled:shadow-none disabled:from-slate-400 disabled:to-slate-400">
              {isSaving ? <Activity className="animate-spin" size={16} /> : <Save size={16} />}
              <span>حفظ التغييرات</span>
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          <button
            onClick={() => setConfigSection('general')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
              configSection === 'general'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            الإعدادات العامة
          </button>
          <button
            onClick={() => setConfigSection('homepage')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
              configSection === 'homepage'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            الصفحة الرئيسية
          </button>
          <button
            onClick={() => setConfigSection('texts')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
              configSection === 'texts'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            نصوص الموقع
          </button>
          <button
            onClick={() => setConfigSection('social')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
              configSection === 'social'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            السوشيال ميديا
          </button>
          <button
            onClick={() => setConfigSection('seo')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
              configSection === 'seo'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            SEO
          </button>
          <button
            onClick={() => setConfigSection('advanced')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
              configSection === 'advanced'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            إعدادات متقدمة
          </button>
        </div>

        {configSection === 'homepage' ? (
          <HomePageSettings />
        ) : configSection === 'texts' ? (
          <SiteTextsSettings />
        ) : configSection === 'social' ? (
          <SocialMediaSettings />
        ) : configSection === 'seo' ? (
          <SEOSettings />
        ) : configSection === 'advanced' ? (
          <AdvancedSettings />
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
            {/* خيار الوضع الفاتح/الداكن */}
          <div className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg bg-slate-50 dark:bg-slate-900 ${theme === 'dark' ? 'text-indigo-500' : 'text-amber-500'}`}>
                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <div>
                <p className="font-medium text-slate-800 dark:text-white text-sm">مظهر لوحة التحكم</p>
                <p className="text-xs text-slate-500">التبديل بين الوضع الفاتح والداكن للوحة التحكم</p>
              </div>
            </div>
            <button 
              onClick={toggleTheme}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                theme === 'dark' 
                  ? 'bg-indigo-500 text-white hover:bg-indigo-600' 
                  : 'bg-amber-500 text-white hover:bg-amber-600'
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
            <div key={item.key} className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg bg-slate-50 dark:bg-slate-900 ${item.color}`}>
                    <item.icon size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white text-sm">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
              </div>
              <button 
                onClick={() => handleToggle(item.key)}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${localSettings[item.key as keyof AppSettings] ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${localSettings[item.key as keyof AppSettings] ? 'translate-x-0' : '-translate-x-6'}`}></div>
              </button>
            </div>
          ))}

          {/* إعدادات فيديو المساعدة */}
          <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">جديد</span>
                  إعدادات فيديو المساعدة
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">تحكّم بزر "شاهد" الذي يعرض فيديو شرح المقاسات داخل صفحات العميل.</p>
              </div>
              <button
                onClick={() => setLocalSettings(prev => ({
                  ...prev,
                  helpVideo: {
                    ...(prev.helpVideo || {}),
                    enabled: !(prev.helpVideo?.enabled)
                  }
                }))}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${localSettings.helpVideo?.enabled ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${localSettings.helpVideo?.enabled ? 'translate-x-0' : '-translate-x-6'}`}></div>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 text-right">رابط الفيديو (YouTube)</label>
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 text-right">نص الزر</label>
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-2 bg-blue-100/60 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 px-3 py-2 rounded-lg text-xs md:justify-end">
                <CheckCircle size={14} />
                <span>نقوم تلقائياً بتحويل الروابط إلى صيغة embed المتوافقة مع YouTube.</span>
              </div>
            </div>
          </div>

          {/* إعدادات مقاسات قوالب المقاسات */}
          <div className="p-5 border-t border-slate-200 dark:border-slate-700">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">مقاسات صور قوالب المقاسات</h3>
              <p className="text-xs text-slate-500">حدد الأبعاد الموحدة المطلوبة لصور قوالب المقاسات (بالبكسل)</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">العرض (Width)</label>
                <input
                  type="number"
                  min="100"
                  max="5000"
                  value={localSettings.measurementTemplateWidth || 800}
                  onChange={(e) => {
                    const newSettings = { ...localSettings, measurementTemplateWidth: parseInt(e.target.value) || 800 };
                    setLocalSettings(newSettings);
                    saveAppSettings(newSettings);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">الارتفاع (Height)</label>
                <input
                  type="number"
                  min="100"
                  max="5000"
                  value={localSettings.measurementTemplateHeight || 1200}
                  onChange={(e) => {
                    const newSettings = { ...localSettings, measurementTemplateHeight: parseInt(e.target.value) || 1200 };
                    setLocalSettings(newSettings);
                    saveAppSettings(newSettings);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
            </div>
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                📐 المقاس الحالي: <span className="font-bold">{localSettings.measurementTemplateWidth || 800}×{localSettings.measurementTemplateHeight || 1200}</span> بكسل
              </p>
            </div>
          </div>
      </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch(activeSection) {
      case 'dashboard': return <DashboardOverview users={users} orders={orders} tailors={tailors} logs={logs} />;
      case 'orders': return <OrdersTable orders={orders} />;
      case 'approvals': return <MerchantsApproval />;
      case 'users': return <UsersManagement />;
      case 'tailors': return <ShopsManagement shops={allShops} shopType="tailor" title="جميع محلات الخياطة" />;
      case 'boutiques': return <ShopsManagement shops={allShops} shopType="boutique" title="إدارة البوتيكات" />;
      case 'shops': return <ShopsManagement shops={allShops} shopType="fabric_store" title="المحلات الأخرى (أقمشة ومواد خياطة)" />;
      case 'products': return <ProductsManagement />;
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
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Package className="text-blue-500" size={24} />
                </div>
                <h4 className="font-bold text-slate-800 dark:text-white">إدارة المنتجات</h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                إضافة وتعديل وحذف المنتجات، إدارة الفئات والأسعار
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <ShoppingCart className="text-amber-500" size={24} />
                </div>
                <h4 className="font-bold text-slate-800 dark:text-white">معالجة الطلبات</h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                متابعة الطلبات، تحديث الحالات، إدارة الشحن والتوصيل
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Activity className="text-purple-500" size={24} />
                </div>
                <h4 className="font-bold text-slate-800 dark:text-white">التقارير والإحصائيات</h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                تقارير المبيعات، تحليل الأداء، إحصائيات شاملة
              </p>
            </div>
          </div>
        </div>
      );
      case 'images': return <ImageLibraryManagement />;
      case 'fabrics': return <FabricLibrary fabrics={fabrics} />;
      case 'measurements': return <MeasurementTemplates />;
      case 'family': return <PlaceholderView title="ملفات العائلة" icon={Users} />;
      case 'ai': return <AIModels aiModels={aiModels} />;
      case 'notifications': return <NotificationsSender />;
      case 'ads': return <AdsManagement />;
      case 'regions': return <RegionsManagement />;
      case 'financial': return <FinancialManagement />;
      case 'config': return <ConfigView />;
      case 'logs': return <PlaceholderView title="سجلات النظام" icon={FileText} />;
      default: return <DashboardOverview users={users} orders={orders} tailors={tailors} logs={logs} />;
    }
  };

  // شاشة تحميل أثناء التحقق من المصادقة
  // Avoid blocking the whole admin UI when global `loading` is toggled by non-auth flows.
  if (isCheckingAuth || (loading && user === null)) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-[#050817] to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Activity className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
          <p className="text-slate-400">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
     return (
        <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-[#050817] to-slate-900 flex items-center justify-center text-center p-4" dir="rtl">
           <div className="max-w-md w-full">
             <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
               <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Shield size={40} className="text-red-500" />
               </div>
               
               <h1 className="text-3xl font-bold text-white mb-2">منطقة محظورة</h1>
               <p className="text-slate-400 mb-8">
                 {showLoginForm 
                   ? 'أدخل بيانات حساب المسؤول للمتابعة' 
                   : 'يجب عليك تسجيل الدخول بحساب مسؤول (Admin) للوصول إلى لوحة التحكم.'
                 }
               </p>

               {!showLoginForm ? (
                 <div className="space-y-3">
                   <Button 
                     onClick={() => setShowLoginForm(true)} 
                     className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center justify-center gap-2 transition-all"
                   >
                     <Lock size={18} />
                     تسجيل دخول كمسؤول
                   </Button>
                   <button 
                     onClick={() => navigate('/')}
                     className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 font-medium transition-colors"
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
                     <label className="block text-sm font-medium text-slate-300 mb-2">
                       البريد الإلكتروني
                     </label>
                     <input
                       type="email"
                       value={loginEmail}
                       onChange={(e) => setLoginEmail(e.target.value)}
                       placeholder="admin@khuyoot.com"
                       required
                       className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     />
                   </div>

                   <div className="text-right">
                     <label className="block text-sm font-medium text-slate-300 mb-2">
                       كلمة المرور
                     </label>
                     <input
                       type="password"
                       value={loginPassword}
                       onChange={(e) => setLoginPassword(e.target.value)}
                       placeholder="••••••••"
                       required
                       className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     />
                   </div>

                   <div className="space-y-2 pt-2">
                     <Button 
                       type="submit" 
                       disabled={isLoggingIn}
                       className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center justify-center gap-2 transition-all disabled:shadow-none disabled:from-slate-400 disabled:to-slate-400"
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
                       className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 font-medium transition-colors"
                     >
                       إلغاء
                     </button>
                   </div>
                 </form>
               )}

               {user && user.role !== 'admin' && (
                 <div className="mt-6 pt-6 border-t border-white/10">
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
    <div className="flex h-screen bg-slate-50 dark:bg-[#0b1121] text-slate-900 dark:text-slate-100 font-sans overflow-hidden dir-rtl">
      <Sidebar 
        activeSection={activeSection} 
        isOpen={isSidebarOpen} 
        setIsOpen={setSidebarOpen}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
        tailorsCount={tailorsCount}
        boutiquesCount={boutiquesCount}
        shopsCount={shopsCount}
      />

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* زر إظهار الشريط الجانبي عندما يكون مخفياً */}
      {!isSidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-all hover:scale-110"
          title="إظهار الشريط الجانبي"
        >
          <Menu size={20} />
        </button>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 shadow-sm z-10">
           <div className="flex items-center gap-4">
             <button 
               onClick={() => setSidebarOpen(!isSidebarOpen)} 
               className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
               title={isSidebarOpen ? "إخفاء الشريط الجانبي" : "إظهار الشريط الجانبي"}
             >
               <Menu size={24} />
             </button>
             <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 capitalize">
               {activeSection === 'ai' ? 'AI Configuration' : activeSection}
             </h2>
           </div>

           <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/')}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md hover:shadow-lg"
                title="الصفحة الرئيسية"
              >
                <Home size={20} />
              </button>
              <div className="relative hidden md:block">
                 <input type="text" placeholder="بحث سريع..." className="pl-4 pr-10 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-full text-xs w-64 focus:ring-1 focus:ring-blue-500" />
                 <Search size={14} className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400" />
              </div>
              <button className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                 <Bell size={20} />
                 <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-700 pr-4">
                 <div className="text-left hidden md:block">
                    <p className="text-xs font-bold text-slate-700 dark:text-white">Admin User</p>
                    <p className="text-[10px] text-slate-400">Super Admin</p>
                 </div>
                 <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">A</div>
              </div>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
           {renderContent()}
        </main>
      </div>
    </div>
  );
};
