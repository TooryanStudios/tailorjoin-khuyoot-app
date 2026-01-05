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
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4 overflow-x-auto">
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(`/admin/config/advanced/${tab.id}`)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6">
        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">إعدادات الطلبات</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  الحد الأدنى للطلب (د.ك)
                </label>
                <input
                  type="number"
                  value={orderSettings.minOrderValue}
                  onChange={(e) => setOrderSettings(prev => ({ ...prev, minOrderValue: Number(e.target.value) }))}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  رسوم التوصيل (د.ك)
                </label>
                <input
                  type="number"
                  value={orderSettings.defaultShippingFee}
                  onChange={(e) => setOrderSettings(prev => ({ ...prev, defaultShippingFee: Number(e.target.value) }))}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  مدة التسليم (أيام)
                </label>
                <input
                  type="number"
                  value={orderSettings.estimatedDeliveryDays}
                  onChange={(e) => setOrderSettings(prev => ({ ...prev, estimatedDeliveryDays: Number(e.target.value) }))}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                رسالة تأكيد الطلب
              </label>
              <textarea
                value={orderSettings.orderNotificationMessage}
                onChange={(e) => setOrderSettings(prev => ({ ...prev, orderNotificationMessage: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allowGuestOrders"
                checked={orderSettings.allowGuestOrders}
                onChange={(e) => setOrderSettings(prev => ({ ...prev, allowGuestOrders: e.target.checked }))}
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <label htmlFor="allowGuestOrders" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                السماح بالطلبات للزوار (بدون تسجيل)
              </label>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">إعدادات الإشعارات</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  عنوان الترحيب
                </label>
                <input
                  type="text"
                  value={notificationSettings.welcomeTitle}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, welcomeTitle: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  رسالة الترحيب
                </label>
                <input
                  type="text"
                  value={notificationSettings.welcomeMessage}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enableNewOrderNotifications"
                  checked={notificationSettings.enableNewOrderNotifications}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, enableNewOrderNotifications: e.target.checked }))}
                  className="w-5 h-5 text-indigo-600 rounded"
                />
                <label htmlFor="enableNewOrderNotifications" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  إشعارات الطلبات الجديدة
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enablePromotionalNotifications"
                  checked={notificationSettings.enablePromotionalNotifications}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, enablePromotionalNotifications: e.target.checked }))}
                  className="w-5 h-5 text-indigo-600 rounded"
                />
                <label htmlFor="enablePromotionalNotifications" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  إشعارات العروض والتخفيضات
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enableOrderStatusNotifications"
                  checked={notificationSettings.enableOrderStatusNotifications}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, enableOrderStatusNotifications: e.target.checked }))}
                  className="w-5 h-5 text-indigo-600 rounded"
                />
                <label htmlFor="enableOrderStatusNotifications" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  إشعارات تحديث حالة الطلب
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Pages Tab */}
        {activeTab === 'pages' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">نصوص الصفحات</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                من نحن (About Us)
              </label>
              <textarea
                value={pageTexts.aboutUs}
                onChange={(e) => setPageTexts(prev => ({ ...prev, aboutUs: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                الشروط والأحكام
              </label>
              <textarea
                value={pageTexts.termsAndConditions}
                onChange={(e) => setPageTexts(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                سياسة الخصوصية
              </label>
              <textarea
                value={pageTexts.privacyPolicy}
                onChange={(e) => setPageTexts(prev => ({ ...prev, privacyPolicy: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                سياسة الاسترجاع
              </label>
              <textarea
                value={pageTexts.returnPolicy}
                onChange={(e) => setPageTexts(prev => ({ ...prev, returnPolicy: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* Discounts Tab */}
        {activeTab === 'discounts' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">إعدادات الخصومات</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  خصم العضوية الذهبية (%)
                </label>
                <input
                  type="number"
                  value={discountSettings.goldMembershipDiscount}
                  onChange={(e) => setDiscountSettings(prev => ({ ...prev, goldMembershipDiscount: Number(e.target.value) }))}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  خصم الطلب الأول (%)
                </label>
                <input
                  type="number"
                  value={discountSettings.firstOrderDiscountPercent}
                  onChange={(e) => setDiscountSettings(prev => ({ ...prev, firstOrderDiscountPercent: Number(e.target.value) }))}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                رسالة العروض
              </label>
              <input
                type="text"
                value={discountSettings.promotionalMessage}
                onChange={(e) => setDiscountSettings(prev => ({ ...prev, promotionalMessage: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
              />
            </div>

            <div className="space-y-3 border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enableCoupons"
                  checked={discountSettings.enableCoupons}
                  onChange={(e) => setDiscountSettings(prev => ({ ...prev, enableCoupons: e.target.checked }))}
                  className="w-5 h-5 text-indigo-600 rounded"
                />
                <label htmlFor="enableCoupons" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  تفعيل نظام الكوبونات
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enableFirstOrderDiscount"
                  checked={discountSettings.enableFirstOrderDiscount}
                  onChange={(e) => setDiscountSettings(prev => ({ ...prev, enableFirstOrderDiscount: e.target.checked }))}
                  className="w-5 h-5 text-indigo-600 rounded"
                />
                <label htmlFor="enableFirstOrderDiscount" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  تفعيل خصم الطلب الأول
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">إعدادات التقييمات</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                الحد الأدنى للنجوم (لعرض التقييم)
              </label>
              <select
                value={reviewSettings.minimumStarsToShow}
                onChange={(e) => setReviewSettings(prev => ({ ...prev, minimumStarsToShow: Number(e.target.value) }))}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
              >
                <option value={1}>نجمة واحدة فأكثر</option>
                <option value={2}>نجمتين فأكثر</option>
                <option value={3}>3 نجوم فأكثر</option>
                <option value={4}>4 نجوم فأكثر</option>
                <option value={5}>5 نجوم فقط</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                رسالة طلب التقييم
              </label>
              <input
                type="text"
                value={reviewSettings.requestReviewMessage}
                onChange={(e) => setReviewSettings(prev => ({ ...prev, requestReviewMessage: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
              />
            </div>

            <div className="space-y-3 border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="allowGuestReviews"
                  checked={reviewSettings.allowGuestReviews}
                  onChange={(e) => setReviewSettings(prev => ({ ...prev, allowGuestReviews: e.target.checked }))}
                  className="w-5 h-5 text-indigo-600 rounded"
                />
                <label htmlFor="allowGuestReviews" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  السماح للزوار بالتقييم
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enableReviewModeration"
                  checked={reviewSettings.enableReviewModeration}
                  onChange={(e) => setReviewSettings(prev => ({ ...prev, enableReviewModeration: e.target.checked }))}
                  className="w-5 h-5 text-indigo-600 rounded"
                />
                <label htmlFor="enableReviewModeration" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  مراجعة التقييمات قبل النشر
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Images Tab */}
        {activeTab === 'images' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">إعدادات الصور</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  أقصى حجم (MB)
                </label>
                <input
                  type="number"
                  value={imageSettings.maxImageSize}
                  onChange={(e) => setImageSettings(prev => ({ ...prev, maxImageSize: Number(e.target.value) }))}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                  min="1"
                  max="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  جودة الصورة (%)
                </label>
                <input
                  type="number"
                  value={imageSettings.imageQuality}
                  onChange={(e) => setImageSettings(prev => ({ ...prev, imageQuality: Number(e.target.value) }))}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                  min="1"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  صور لكل منتج
                </label>
                <input
                  type="number"
                  value={imageSettings.maxImagesPerProduct}
                  onChange={(e) => setImageSettings(prev => ({ ...prev, maxImagesPerProduct: Number(e.target.value) }))}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                  min="1"
                  max="20"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                صور لكل معرض أعمال
              </label>
              <input
                type="number"
                value={imageSettings.maxImagesPerPortfolio}
                onChange={(e) => setImageSettings(prev => ({ ...prev, maxImagesPerPortfolio: Number(e.target.value) }))}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                min="1"
                max="100"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allowImageUploads"
                checked={imageSettings.allowImageUploads}
                onChange={(e) => setImageSettings(prev => ({ ...prev, allowImageUploads: e.target.checked }))}
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <label htmlFor="allowImageUploads" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                السماح برفع الصور
              </label>
            </div>
          </div>
        )}

        {/* Payment Tab */}
        {activeTab === 'payment' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">إعدادات الدفع</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                رسالة تأكيد الدفع
              </label>
              <input
                type="text"
                value={paymentSettings.paymentConfirmationMessage}
                onChange={(e) => setPaymentSettings(prev => ({ ...prev, paymentConfirmationMessage: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
              />
            </div>

            <div className="space-y-3 border-t border-slate-200 dark:border-slate-700 pt-4">
              <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3">طرق الدفع المتاحة</h4>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enableCash"
                  checked={paymentSettings.enableCash}
                  onChange={(e) => setPaymentSettings(prev => ({ ...prev, enableCash: e.target.checked }))}
                  className="w-5 h-5 text-indigo-600 rounded"
                />
                <label htmlFor="enableCash" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  💵 الدفع نقداً
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enableCard"
                  checked={paymentSettings.enableCard}
                  onChange={(e) => setPaymentSettings(prev => ({ ...prev, enableCard: e.target.checked }))}
                  className="w-5 h-5 text-indigo-600 rounded"
                />
                <label htmlFor="enableCard" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  💳 البطاقة الائتمانية
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enableKnet"
                  checked={paymentSettings.enableKnet}
                  onChange={(e) => setPaymentSettings(prev => ({ ...prev, enableKnet: e.target.checked }))}
                  className="w-5 h-5 text-indigo-600 rounded"
                />
                <label htmlFor="enableKnet" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  🏧 كي-نت (K-NET)
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enableCOD"
                  checked={paymentSettings.enableCOD}
                  onChange={(e) => setPaymentSettings(prev => ({ ...prev, enableCOD: e.target.checked }))}
                  className="w-5 h-5 text-indigo-600 rounded"
                />
                <label htmlFor="enableCOD" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  📦 الدفع عند الاستلام (COD)
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Try-On Tab */}
        {activeTab === 'tryon' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">إعدادات Try‑On</h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Driver Prompt (الموجه الأساسي)
              </label>
              <textarea
                value={tryOnDriverPrompt}
                onChange={(e) => setTryOnDriverPrompt(e.target.value)}
                rows={6}
                placeholder="اكتب الموجه الأساسي الذي سيتم حقنه في طلبات Try‑On..."
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white font-mono text-sm"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setTryOnDriverPrompt('')}
                  className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  مسح الموجه
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleSaveTryOnPromptOnly}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold rounded-lg transition-all disabled:cursor-not-allowed"
              >
                <Save size={18} />
                {saving ? 'جاري الحفظ...' : 'حفظ الموجه فقط'}
              </button>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
          >
            <Save size={20} />
            {saving ? 'جاري الحفظ...' : 'حفظ جميع الإعدادات'}
          </button>
          {message && (
            <span className={`text-sm font-medium ${message.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
