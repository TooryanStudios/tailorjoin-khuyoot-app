import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Save, ShoppingCart, DollarSign, Bell, FileText, Percent, Star, Image as ImageIcon, CreditCard } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { useLocation, useNavigate } from 'react-router-dom';

type AdvancedTab = 'orders' | 'notifications' | 'pages' | 'discounts' | 'reviews' | 'images' | 'payment' | 'tryon';

const ADVANCED_TABS: ReadonlyArray<AdvancedTab> = [
  'orders',
  'notifications',
  'pages',
  'discounts',
  'reviews',
  'images',
  'payment',
  'tryon',
];

function getAdvancedTabFromPathname(pathname: string): AdvancedTab {
  const parts = String(pathname || '').split('/').filter(Boolean);
  // parts: ['admin', 'config', 'advanced', ':tab?']
  const tab = parts[3];
  if (ADVANCED_TABS.includes(tab as AdvancedTab)) return tab as AdvancedTab;
  return 'orders';
}

export const AdvancedSettings: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appSettings, saveAppSettings, settingsLoaded } = useApp();
  const activeTab = useMemo(() => getAdvancedTabFromPathname(location.pathname), [location.pathname]);
  const didHydrateFromSettingsRef = useRef(false);
  
  // Order Settings
  const [orderSettings, setOrderSettings] = useState({
    minOrderValue: 10,
    defaultShippingFee: 2,
    estimatedDeliveryDays: 7,
    orderNotificationMessage: 'شكراً لطلبك! سنتواصل معك قريباً.',
    allowGuestOrders: false,
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    welcomeTitle: 'مرحباً بك في خيوط!',
    welcomeMessage: 'نحن سعداء بانضمامك إلينا',
    enableNewOrderNotifications: true,
    enablePromotionalNotifications: true,
    enableOrderStatusNotifications: true,
  });

  // Page Texts
  const [pageTexts, setPageTexts] = useState({
    aboutUs: 'خيوط هي منصة كويتية رائدة في مجال الخياطة والتفصيل...',
    termsAndConditions: 'الشروط والأحكام...',
    privacyPolicy: 'سياسة الخصوصية...',
    returnPolicy: 'سياسة الاسترجاع والاستبدال...',
  });

  // Discount Settings
  const [discountSettings, setDiscountSettings] = useState({
    enableCoupons: true,
    goldMembershipDiscount: 10,
    promotionalMessage: 'عروض حصرية للأعضاء الذهبيين!',
    enableFirstOrderDiscount: true,
    firstOrderDiscountPercent: 15,
  });

  // Review Settings
  const [reviewSettings, setReviewSettings] = useState({
    allowGuestReviews: false,
    minimumStarsToShow: 1,
    requestReviewMessage: 'نرجو تقييم تجربتك معنا',
    enableReviewModeration: true,
  });

  // Image Settings
  const [imageSettings, setImageSettings] = useState({
    maxImageSize: 5,
    imageQuality: 80,
    allowImageUploads: true,
    maxImagesPerProduct: 5,
    maxImagesPerPortfolio: 20,
  });

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    enableCash: true,
    enableCard: true,
    enableKnet: true,
    enableCOD: true,
    paymentConfirmationMessage: 'تم استلام الدفعة بنجاح',
  });

  // Try-On Settings
  const [tryOnDriverPrompt, setTryOnDriverPrompt] = useState<string>('');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Hydrate local UI state ONCE after global settings are loaded.
  // Re-applying on every save can feel like a full-page refresh.
  useEffect(() => {
    if (!settingsLoaded) return;
    if (didHydrateFromSettingsRef.current) return;

    if (appSettings.orderSettings) setOrderSettings(appSettings.orderSettings as any);
    if (appSettings.notificationSettings) setNotificationSettings(appSettings.notificationSettings as any);
    if (appSettings.pageTexts) setPageTexts(appSettings.pageTexts as any);
    if (appSettings.discountSettings) setDiscountSettings(appSettings.discountSettings as any);
    if (appSettings.reviewSettings) setReviewSettings(appSettings.reviewSettings as any);
    if (appSettings.imageSettings) setImageSettings(appSettings.imageSettings as any);
    if (appSettings.paymentSettings) setPaymentSettings(appSettings.paymentSettings as any);
    setTryOnDriverPrompt((appSettings as any)?.aiTryOn?.driverPrompt || '');

    didHydrateFromSettingsRef.current = true;
  }, [appSettings, settingsLoaded]);

  useEffect(() => {
    const pathname = location.pathname;
    const parts = String(pathname || '').split('/').filter(Boolean);
    if (parts[0] !== 'admin' || parts[1] !== 'config' || parts[2] !== 'advanced') return;

    const rawTab = parts[3];
    const canonical = `/admin/config/advanced/${getAdvancedTabFromPathname(pathname)}`;

    if (!rawTab || !ADVANCED_TABS.includes(rawTab as AdvancedTab)) {
      if (pathname !== canonical) navigate(canonical, { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      await saveAppSettings({
        ...appSettings,
        orderSettings,
        notificationSettings,
        pageTexts,
        discountSettings,
        reviewSettings,
        imageSettings,
        paymentSettings,
        aiTryOn: {
          ...(appSettings as any)?.aiTryOn,
          driverPrompt: tryOnDriverPrompt,
        },
      }, { silent: true, optimistic: true });
      
      setMessage('✅ تم حفظ الإعدادات بنجاح');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving advanced settings:', error);
      setMessage('❌ حدث خطأ أثناء الحفظ');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTryOnPromptOnly = async () => {
    setSaving(true);
    setMessage('');

    try {
      await saveAppSettings({
        ...appSettings,
        aiTryOn: {
          ...(appSettings as any)?.aiTryOn,
          driverPrompt: tryOnDriverPrompt,
        },
      }, { silent: true, optimistic: true });

      setMessage('✅ تم حفظ موجه Try‑On بنجاح');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving Try-On driver prompt:', error);
      setMessage('❌ حدث خطأ أثناء حفظ موجه Try‑On');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'orders', label: 'الطلبات', icon: ShoppingCart },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'pages', label: 'صفحات', icon: FileText },
    { id: 'discounts', label: 'الخصومات', icon: Percent },
    { id: 'reviews', label: 'التقييمات', icon: Star },
    { id: 'images', label: 'الصور', icon: ImageIcon },
    { id: 'payment', label: 'الدفع', icon: CreditCard },
    { id: 'tryon', label: 'Try‑On', icon: Star },
  ];

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -ml-32 -mb-32" />

      {/* Tabs */}
      <div className="relative border-b border-white/10 bg-white/5 p-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(`/admin/config/advanced/${tab.id}`)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap border ${
                  isActive
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/20'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={18} className={isActive ? 'scale-110' : ''} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative p-8">
        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
              <h3 className="text-xl font-bold text-white">إعدادات الطلبات</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
                <label className="block text-sm font-medium text-slate-400 mb-3 mr-1">
                  الحد الأدنى للطلب (د.ك)
                </label>
                <input
                  type="number"
                  value={orderSettings.minOrderValue}
                  onChange={(e) => setOrderSettings(prev => ({ ...prev, minOrderValue: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none"
                />
              </div>
              
              <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
                <label className="block text-sm font-medium text-slate-400 mb-3 mr-1">
                  رسوم التوصيل (د.ك)
                </label>
                <input
                  type="number"
                  value={orderSettings.defaultShippingFee}
                  onChange={(e) => setOrderSettings(prev => ({ ...prev, defaultShippingFee: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none"
                />
              </div>
              
              <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
                <label className="block text-sm font-medium text-slate-400 mb-3 mr-1">
                  مدة التسليم (أيام)
                </label>
                <input
                  type="number"
                  value={orderSettings.estimatedDeliveryDays}
                  onChange={(e) => setOrderSettings(prev => ({ ...prev, estimatedDeliveryDays: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none"
                />
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
              <label className="block text-sm font-medium text-slate-400 mb-3 mr-1">
                رسالة تأكيد الطلب
              </label>
              <textarea
                value={orderSettings.orderNotificationMessage}
                onChange={(e) => setOrderSettings(prev => ({ ...prev, orderNotificationMessage: e.target.value }))}
                rows={2}
                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none resize-none"
              />
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/5 p-6 flex items-center gap-4 group cursor-pointer" onClick={() => setOrderSettings(prev => ({ ...prev, allowGuestOrders: !prev.allowGuestOrders }))}>
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${orderSettings.allowGuestOrders ? 'bg-indigo-600 border-indigo-500' : 'border-white/10 bg-white/5'}`}>
                {orderSettings.allowGuestOrders && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <span className="text-slate-300 font-medium group-hover:text-white transition-colors">
                السماح بالطلبات للزوار (بدون تسجيل)
              </span>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
              <h3 className="text-xl font-bold text-white">إعدادات الإشعارات</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
                <label className="block text-sm font-medium text-slate-400 mb-3 mr-1">
                  عنوان الترحيب
                </label>
                <input
                  type="text"
                  value={notificationSettings.welcomeTitle}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, welcomeTitle: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none"
                />
              </div>
              
              <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
                <label className="block text-sm font-medium text-slate-400 mb-3 mr-1">
                  رسالة الترحيب
                </label>
                <input
                  type="text"
                  value={notificationSettings.welcomeMessage}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none"
                />
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/5 p-6 space-y-6">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 mr-1">تفضيلات الإشعارات</h4>
              
              <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setNotificationSettings(prev => ({ ...prev, enableNewOrderNotifications: !prev.enableNewOrderNotifications }))}>
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${notificationSettings.enableNewOrderNotifications ? 'bg-indigo-600 border-indigo-500' : 'border-white/10 bg-white/5'}`}>
                  {notificationSettings.enableNewOrderNotifications && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-slate-300 font-medium group-hover:text-white transition-colors">إشعارات الطلبات الجديدة</span>
              </div>

              <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setNotificationSettings(prev => ({ ...prev, enablePromotionalNotifications: !prev.enablePromotionalNotifications }))}>
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${notificationSettings.enablePromotionalNotifications ? 'bg-indigo-600 border-indigo-500' : 'border-white/10 bg-white/5'}`}>
                  {notificationSettings.enablePromotionalNotifications && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-slate-300 font-medium group-hover:text-white transition-colors">إشعارات العروض والتخفيضات</span>
              </div>

              <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setNotificationSettings(prev => ({ ...prev, enableOrderStatusNotifications: !prev.enableOrderStatusNotifications }))}>
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${notificationSettings.enableOrderStatusNotifications ? 'bg-indigo-600 border-indigo-500' : 'border-white/10 bg-white/5'}`}>
                  {notificationSettings.enableOrderStatusNotifications && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-slate-300 font-medium group-hover:text-white transition-colors">إشعارات تحديث حالة الطلب</span>
              </div>
            </div>
          </div>
        )}

        {/* Pages Tab */}
        {activeTab === 'pages' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
              <h3 className="text-xl font-bold text-white">نصوص الصفحات</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
                <label className="block text-sm font-medium text-slate-400 mb-3 mr-1">
                  من نحن (About Us)
                </label>
                <textarea
                  value={pageTexts.aboutUs}
                  onChange={(e) => setPageTexts(prev => ({ ...prev, aboutUs: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none resize-none"
                />
              </div>

              <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
                <label className="block text-sm font-medium text-slate-400 mb-3 mr-1">
                  الشروط والأحكام
                </label>
                <textarea
                  value={pageTexts.termsAndConditions}
                  onChange={(e) => setPageTexts(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none resize-none"
                />
              </div>

              <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
                <label className="block text-sm font-medium text-slate-400 mb-3 mr-1">
                  سياسة الخصوصية
                </label>
                <textarea
                  value={pageTexts.privacyPolicy}
                  onChange={(e) => setPageTexts(prev => ({ ...prev, privacyPolicy: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none resize-none"
                />
              </div>

              <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
                <label className="block text-sm font-medium text-slate-400 mb-3 mr-1">
                  سياسة الاسترجاع
                </label>
                <textarea
                  value={pageTexts.returnPolicy}
                  onChange={(e) => setPageTexts(prev => ({ ...prev, returnPolicy: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Discounts Tab */}
        {activeTab === 'discounts' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
              <h3 className="text-xl font-bold text-white">إعدادات الخصومات</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
                <label className="block text-sm font-medium text-slate-400 mb-3 mr-1">
                  خصم العضوية الذهبية (%)
                </label>
                <input
                  type="number"
                  value={discountSettings.goldMembershipDiscount}
                  onChange={(e) => setDiscountSettings(prev => ({ ...prev, goldMembershipDiscount: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none"
                  min="0"
                  max="100"
                />
              </div>

              <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
                <label className="block text-sm font-medium text-slate-400 mb-3 mr-1">
                  خصم الطلب الأول (%)
                </label>
                <input
                  type="number"
                  value={discountSettings.firstOrderDiscountPercent}
                  onChange={(e) => setDiscountSettings(prev => ({ ...prev, firstOrderDiscountPercent: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
              <label className="block text-sm font-medium text-slate-400 mb-3 mr-1">
                رسالة العروض
              </label>
              <input
                type="text"
                value={discountSettings.promotionalMessage}
                onChange={(e) => setDiscountSettings(prev => ({ ...prev, promotionalMessage: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none"
              />
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/5 p-6 space-y-6">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 mr-1">تفعيل الأنظمة</h4>
              
              <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setDiscountSettings(prev => ({ ...prev, enableCoupons: !prev.enableCoupons }))}>
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${discountSettings.enableCoupons ? 'bg-indigo-600 border-indigo-500' : 'border-white/10 bg-white/5'}`}>
                  {discountSettings.enableCoupons && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-slate-300 font-medium group-hover:text-white transition-colors">تفعيل نظام الكوبونات</span>
              </div>

              <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setDiscountSettings(prev => ({ ...prev, enableFirstOrderDiscount: !prev.enableFirstOrderDiscount }))}>
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${discountSettings.enableFirstOrderDiscount ? 'bg-indigo-600 border-indigo-500' : 'border-white/10 bg-white/5'}`}>
                  {discountSettings.enableFirstOrderDiscount && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-slate-300 font-medium group-hover:text-white transition-colors">تفعيل خصم الطلب الأول</span>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-6 bg-yellow-500 rounded-full" />
              <h3 className="text-xl font-bold text-white">إعدادات التقييمات</h3>
            </div>
            
            <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
              <label className="block text-sm font-medium text-slate-400 mb-3 mr-1">
                الحد الأدنى للنجوم (لعرض التقييم)
              </label>
              <select
                value={reviewSettings.minimumStarsToShow}
                onChange={(e) => setReviewSettings(prev => ({ ...prev, minimumStarsToShow: Number(e.target.value) }))}
                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none appearance-none"
              >
                <option value={1} className="bg-slate-900">نجمة واحدة فأكثر</option>
                <option value={2} className="bg-slate-900">نجمتين فأكثر</option>
                <option value={3} className="bg-slate-900">3 نجوم فأكثر</option>
                <option value={4} className="bg-slate-900">4 نجوم فأكثر</option>
                <option value={5} className="bg-slate-900">5 نجوم فقط</option>
              </select>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
              <label className="block text-sm font-medium text-slate-400 mb-3 mr-1">
                رسالة طلب التقييم
              </label>
              <input
                type="text"
                value={reviewSettings.requestReviewMessage}
                onChange={(e) => setReviewSettings(prev => ({ ...prev, requestReviewMessage: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none"
              />
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/5 p-6 space-y-6">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 mr-1">سياسة التقييم</h4>
              
              <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setReviewSettings(prev => ({ ...prev, allowGuestReviews: !prev.allowGuestReviews }))}>
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${reviewSettings.allowGuestReviews ? 'bg-indigo-600 border-indigo-500' : 'border-white/10 bg-white/5'}`}>
                  {reviewSettings.allowGuestReviews && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-slate-300 font-medium group-hover:text-white transition-colors">السماح للزوار بالتقييم</span>
              </div>

              <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setReviewSettings(prev => ({ ...prev, enableReviewModeration: !prev.enableReviewModeration }))}>
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${reviewSettings.enableReviewModeration ? 'bg-indigo-600 border-indigo-500' : 'border-white/10 bg-white/5'}`}>
                  {reviewSettings.enableReviewModeration && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-slate-300 font-medium group-hover:text-white transition-colors">مراجعة التقييمات قبل النشر</span>
              </div>
            </div>
          </div>
        )}

        {/* Images Tab */}
        {activeTab === 'images' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
              <h3 className="text-xl font-bold text-white">إعدادات الصور</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
                <label className="block text-sm font-medium text-slate-400 mb-3 mr-1">
                  أقصى حجم (MB)
                </label>
                <input
                  type="number"
                  value={imageSettings.maxImageSize}
                  onChange={(e) => setImageSettings(prev => ({ ...prev, maxImageSize: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none"
                  min="1"
                  max="50"
                />
              </div>

              <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
                <label className="block text-sm font-medium text-slate-400 mb-3 mr-1">
                  جودة الصورة (%)
                </label>
                <input
                  type="number"
                  value={imageSettings.imageQuality}
                  onChange={(e) => setImageSettings(prev => ({ ...prev, imageQuality: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none"
                  min="1"
                  max="100"
                />
              </div>

              <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
                <label className="block text-sm font-medium text-slate-400 mb-3 mr-1">
                  صور لكل منتج
                </label>
                <input
                  type="number"
                  value={imageSettings.maxImagesPerProduct}
                  onChange={(e) => setImageSettings(prev => ({ ...prev, maxImagesPerProduct: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none"
                  min="1"
                  max="20"
                />
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
              <label className="block text-sm font-medium text-slate-400 mb-3 mr-1">
                صور لكل معرض أعمال
              </label>
              <input
                type="number"
                value={imageSettings.maxImagesPerPortfolio}
                onChange={(e) => setImageSettings(prev => ({ ...prev, maxImagesPerPortfolio: Number(e.target.value) }))}
                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none"
                min="1"
                max="100"
              />
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/5 p-6 flex items-center gap-4 group cursor-pointer" onClick={() => setImageSettings(prev => ({ ...prev, allowImageUploads: !prev.allowImageUploads }))}>
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${imageSettings.allowImageUploads ? 'bg-indigo-600 border-indigo-500' : 'border-white/10 bg-white/5'}`}>
                {imageSettings.allowImageUploads && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <span className="text-slate-300 font-medium group-hover:text-white transition-colors">السماح برفع الصور</span>
            </div>
          </div>
        )}

        {/* Payment Tab */}
        {activeTab === 'payment' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-6 bg-cyan-500 rounded-full" />
              <h3 className="text-xl font-bold text-white">إعدادات الدفع</h3>
            </div>
            
            <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
              <label className="block text-sm font-medium text-slate-400 mb-3 mr-1">
                رسالة تأكيد الدفع
              </label>
              <input
                type="text"
                value={paymentSettings.paymentConfirmationMessage}
                onChange={(e) => setPaymentSettings(prev => ({ ...prev, paymentConfirmationMessage: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none"
              />
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/5 p-6 space-y-6">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 mr-1">طرق الدفع المتاحة</h4>
              
              <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setPaymentSettings(prev => ({ ...prev, enableCash: !prev.enableCash }))}>
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${paymentSettings.enableCash ? 'bg-indigo-600 border-indigo-500' : 'border-white/10 bg-white/5'}`}>
                  {paymentSettings.enableCash && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-slate-300 font-medium group-hover:text-white transition-colors">💵 الدفع نقداً</span>
              </div>

              <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setPaymentSettings(prev => ({ ...prev, enableCard: !prev.enableCard }))}>
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${paymentSettings.enableCard ? 'bg-indigo-600 border-indigo-500' : 'border-white/10 bg-white/5'}`}>
                  {paymentSettings.enableCard && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-slate-300 font-medium group-hover:text-white transition-colors">💳 البطاقة الائتمانية</span>
              </div>

              <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setPaymentSettings(prev => ({ ...prev, enableKnet: !prev.enableKnet }))}>
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${paymentSettings.enableKnet ? 'bg-indigo-600 border-indigo-500' : 'border-white/10 bg-white/5'}`}>
                  {paymentSettings.enableKnet && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-slate-300 font-medium group-hover:text-white transition-colors">🏧 كي-نت (K-NET)</span>
              </div>

              <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setPaymentSettings(prev => ({ ...prev, enableCOD: !prev.enableCOD }))}>
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${paymentSettings.enableCOD ? 'bg-indigo-600 border-indigo-500' : 'border-white/10 bg-white/5'}`}>
                  {paymentSettings.enableCOD && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-slate-300 font-medium group-hover:text-white transition-colors">📦 الدفع عند الاستلام (COD)</span>
              </div>
            </div>
          </div>
        )}

        {/* Try-On Tab */}
        {activeTab === 'tryon' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-6 bg-pink-500 rounded-full" />
              <h3 className="text-xl font-bold text-white">إعدادات Try‑On</h3>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
              <label className="block text-sm font-medium text-slate-400 mb-3 mr-1">
                Driver Prompt (الموجه الأساسي)
              </label>
              <textarea
                value={tryOnDriverPrompt}
                onChange={(e) => setTryOnDriverPrompt(e.target.value)}
                rows={6}
                placeholder="اكتب الموجه الأساسي الذي سيتم حقنه في طلبات Try‑On..."
                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none resize-none"
              />
              <div className="mt-3 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setTryOnDriverPrompt('')}
                  className="text-xs font-bold text-slate-500 hover:text-red-400 transition-colors"
                >
                  مسح الموجه
                </button>
                <button
                  type="button"
                  onClick={handleSaveTryOnPromptOnly}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-white/10 hover:bg-white/20 disabled:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all border border-white/10"
                >
                  <Save size={16} />
                  {saving ? 'جاري الحفظ...' : 'حفظ الموجه فقط'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sticky Save Bar */}
        <div className="sticky bottom-0 left-0 right-0 mt-10 -mx-8 -mb-8 p-6 bg-slate-900/80 backdrop-blur-md border-t border-white/10 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {message && (
              <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${
                message.includes('✅') 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/20' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/20'
              }`}>
                {message}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/20 hover:shadow-indigo-500/40 disabled:cursor-not-allowed group"
          >
            <Save size={20} className={saving ? 'animate-spin' : 'group-hover:scale-110 transition-transform'} />
            {saving ? 'جاري الحفظ...' : 'حفظ جميع الإعدادات'}
          </button>
        </div>
      </div>
    </div>
  );
};
