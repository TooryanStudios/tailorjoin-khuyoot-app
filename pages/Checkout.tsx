import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowRight, CheckCircle2, MapPin, Phone, Mail, User as UserIcon,
  CreditCard, Package, AlertCircle, Loader
} from 'lucide-react';
import { Button } from '../components/Button';
import { useApp } from '../context/AppContext';
import { firebaseService } from '../services/firebase';
import { measurementService } from '../src/modules/measurements/services/measurementService';

export const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, appSettings } = useApp();
  const [showHelp, setShowHelp] = useState(false);
  
  const state = location.state as {
    measurementId?: string;
    customizationId?: string;
    productId?: string;
    product?: any;
    measurements?: any;
    customization?: any;
  };

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitOrder = async () => {
    // Validate form
    if (!formData.name || !formData.phone) {
      alert('الرجاء إدخال الاسم ورقم الهاتف');
      return;
    }

    setLoading(true);

    try {
      // 1. Fetch template for the product to ensure we save labels/map and filter correctly
      let template: any = null;
      if (state?.product) {
        template = await measurementService.getTemplateForProduct(state.product);
      }

      // 2. Filter measurements & create labels mapping
      const measurements = state?.measurements || {};
      const filteredMeasurements: Record<string, string | number> = {};
      const measurementLabels: Record<string, string> = {};

      if (template?.points) {
        template.points.forEach((p: any) => {
          measurementLabels[p.id] = p.label || p.name || p.id;
          if (measurements[p.id] !== undefined) {
            filteredMeasurements[p.id] = measurements[p.id];
          }
        });
      }

      // Create order object
      const orderData = {
        userId: user?.id || user?.uid || null,
        customerName: formData.name || user?.name || 'عميل خيوط',
        customerPhone: formData.phone || user?.phone || '',
        customerEmail: formData.email || user?.email || '',
        customerAddress: formData.address,
        productId: state?.productId,
        productName: state?.product?.name,
        // Persist original shop/tailor for accurate navigation and summary.
        tailorId: state?.product?.tailorId,
        tailorName: state?.product?.tailorName,
        tailorLocation: state?.product?.location || state?.product?.region,
        region: state?.product?.region || state?.product?.location,
        measurementId: state?.measurementId,
        customizationId: state?.customizationId,
        measurements: Object.keys(filteredMeasurements).length > 0 ? filteredMeasurements : measurements,
        measurementLabels: Object.keys(measurementLabels).length > 0 ? measurementLabels : {},
        templateId: template?.id || null,
        templateUrl: template?.imageUrl || template?.baseImageUrl || null,
        templatePoints: template?.points || [],
        templateArrows: template?.arrows || [],
        customization: state?.customization,
        notes: formData.notes,
        status: 'pending',
        orderDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        price: state?.product?.price || 0,
        totalPrice: state?.product?.price || 0
      };

      console.log('[Checkout] Creating order with filtered data:', orderData);

      // Save order to Firebase or localStorage
      let newOrderId: string;
      
      if (user?.id || user?.uid) {
        // Authenticated user - save to Firebase
        newOrderId = await firebaseService.createOrder(orderData);
        console.log('[Checkout] Order saved to Firebase:', newOrderId);
      } else {
        // Guest user - save to localStorage
        newOrderId = `guest_order_${Date.now()}`;
        const guestOrders = JSON.parse(localStorage.getItem('guest_orders') || '[]');
        localStorage.setItem('guest_orders', JSON.stringify([
          ...guestOrders,
          { ...orderData, id: newOrderId }
        ]));
        console.log('[Checkout] Order saved to localStorage:', newOrderId);
      }

      setOrderId(newOrderId);
      setOrderPlaced(true);

    } catch (error) {
      console.error('[Checkout] Error creating order:', error);
      alert('حدث خطأ أثناء إنشاء الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={48} className="text-green-600 dark:text-green-400" />
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
            تم إنشاء الطلب بنجاح!
          </h1>
          
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            رقم الطلب: <span className="font-mono text-slate-900 dark:text-white">{orderId}</span>
          </p>
          
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            سيتواصل معك الخياط قريباً لتأكيد التفاصيل وبدء العمل
          </p>

          {!user && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 text-right">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-amber-900 dark:text-amber-100">
                  <p className="font-semibold mb-1">تنبيه:</p>
                  <p>
                    طلبك محفوظ محلياً. لمتابعة حالة الطلب والحصول على إشعارات، 
                    يُفضل تسجيل الدخول أو إنشاء حساب جديد.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {user ? (
              <Button onClick={() => navigate('/tailor/orders')}>
                عرض طلباتي
              </Button>
            ) : (
              <Button onClick={() => navigate('/')}>
                العودة للصفحة الرئيسية
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => navigate('/tailors')}
            >
              تصفح المزيد من الخياطين
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 md:pb-24 px-4 md:px-6 lg:px-8 py-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowRight size={20} />
            <span>العودة</span>
          </button>
          
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <CreditCard className="text-blue-600 dark:text-blue-400" size={32} />
            إتمام الطلب
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            أدخل معلومات التواصل لإتمام طلبك
          </p>
          {appSettings?.helpVideo?.enabled && (
            <div className="mt-3">
              <Button variant="outline" onClick={() => setShowHelp(true)}>
                {appSettings.helpVideo.buttonText}
              </Button>
            </div>
          )}
        </div>

        {/* Alert for guest users */}
        {!user && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-semibold mb-1">نصيحة:</p>
                <p>
                  يمكنك إنشاء حساب للحصول على تجربة أفضل وإمكانية متابعة طلباتك
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Order Summary Card */}
        {state?.product && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Package className="text-blue-600 dark:text-blue-400" size={24} />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                ملخص الطلب
              </h2>
            </div>
            
            <div className="flex gap-4">
              {state.product.image && (
                <img
                  src={state.product.image}
                  alt={state.product.name}
                  className="w-20 h-24 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                  {state.product.name}
                </h3>
                {state.product.price && (
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {state.product.price} ر.ع
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contact Form */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            معلومات التواصل
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <UserIcon size={16} className="inline ml-2" />
                الاسم الكامل *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="أدخل اسمك الكامل"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Phone size={16} className="inline ml-2" />
                رقم الهاتف *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="مثال: +968 9123 4567"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Mail size={16} className="inline ml-2" />
                البريد الإلكتروني (اختياري)
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <MapPin size={16} className="inline ml-2" />
                العنوان (اختياري)
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="المدينة، المنطقة، الشارع"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                ملاحظات إضافية (اختياري)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="أي ملاحظات أو تفاصيل إضافية تود إضافتها..."
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="flex-1"
          >
            <ArrowRight size={20} />
            <span>العودة</span>
          </Button>
          
          <Button
            onClick={handleSubmitOrder}
            disabled={loading || !formData.name || !formData.phone}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader size={20} className="animate-spin" />
                <span>جاري إرسال الطلب...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={20} />
                <span>تأكيد وإرسال الطلب</span>
              </>
            )}
          </Button>
        </div>

        {/* Help Video Modal */}
        {showHelp && (
          <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white">فيديو المساعدة</h3>
                <button onClick={() => setShowHelp(false)} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">إغلاق</button>
              </div>
              <div className="aspect-video bg-black">
                <iframe
                  src={(appSettings?.helpVideo?.url || 'https://www.youtube.com/embed/6eZtn5Du8O4') + '?rel=0'}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Info Note */}
        <div className="mt-6 mb-8 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
            بالضغط على "تأكيد وإرسال الطلب"، سيتم إرسال تفاصيل طلبك إلى الخياط.
            <br />
            سيتواصل معك الخياط خلال 24 ساعة لتأكيد التفاصيل والسعر النهائي.
          </p>
        </div>
      </div>
    </div>
  );
};
