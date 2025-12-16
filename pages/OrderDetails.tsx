import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, X, Edit, CreditCard, Clock, Package, AlertCircle, CheckCircle, MapPin, Truck, Store, MessageCircle, Mail, XCircle, ShoppingBag, Star } from 'lucide-react';
import { Order, OrderStatus, DeliveryMethod, User } from '../types';
import { Button } from '../components/Button';
import { useApp } from '../context/AppContext';
import { notificationService } from '../services/notificationService';
import { createNotification } from '../utils/notificationHelpers';
import { getOrderById } from '../services/orderService';
import { firebaseService } from '../services/firebase';

export const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useApp();
  const [order, setOrder] = useState<Order | null>(null);
  const [tailorInfo, setTailorInfo] = useState<User | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<DeliveryMethod>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  useEffect(() => {
    loadOrder();
  }, [id]);
  
  useEffect(() => {
    // Check if order is ready and notification needs to be sent
    if (order && order.status === 'ready' && !order.readyNotificationSent) {
      sendReadyNotifications();
    }
  }, [order]);

  const loadOrder = async () => {
    if (!id) return;
    try {
      const orderData = await getOrderById(id);
      if (orderData) {
        setOrder(orderData);
        
        // Fetch tailor information
        if (orderData.tailorId) {
          const tailor = await firebaseService.getUserProfile(orderData.tailorId);
          if (tailor) {
            setTailorInfo(tailor);
          }
        }
      } else {
        alert('الطلب غير موجود');
        navigate('/account');
      }
    } catch (error) {
      console.error('Error loading order:', error);
      alert('حدث خطأ أثناء تحميل الطلب');
    }
  };

  const canEdit = () => {
    if (!order) return false;
    // يمكن التعديل قبل قبول الخياط أو قبل بدء التفصيل
    return !order.acceptedByTailor || ['pending'].includes(order.status);
  };

  const needsPayment = () => {
    if (!order) return false;
    return order.acceptedByTailor && order.paymentStatus === 'pending';
  };

  const handleEditOrder = () => {
    navigate(`/product/${order?.productId}?edit=${order?.id}`);
  };

  const handlePayment = () => {
    if (!order) return;
    // Process payment
    const updatedOrder = { ...order, paymentStatus: 'paid' as const };
    localStorage.setItem(`order_${order.id}`, JSON.stringify(updatedOrder));
    setOrder(updatedOrder);
    setShowPaymentModal(false);
    alert('تم الدفع بنجاح! سيبدأ الخياط في التفصيل قريباً');
  };

  const sendReadyNotifications = async () => {
    if (!order || !user) return;
    
    // إرسال الإشعارات باستخدام خدمة الإشعارات
    const sentChannels = await notificationService.sendOrderReadyNotification(order, user);
    
    // Create in-app notification
    createNotification(
      order.userId,
      'delivery',
      'طلبك جاهز للاستلام',
      `طلبك "${order.productName}" جاهز! يمكنك اختيار طريقة الاستلام.`,
      order.id
    );
    
    // Update order with notification info
    const updatedOrder = {
      ...order,
      readyNotificationSent: true,
      readyNotificationDate: new Date().toISOString(),
      notificationChannels: sentChannels
    };
    
    localStorage.setItem(`order_${order.id}`, JSON.stringify(updatedOrder));
    setOrder(updatedOrder);
    
    // Show delivery method selection
    setShowDeliveryModal(true);
  };

  const handleDeliveryMethodSelection = () => {
    if (!order) return;
    
    const updatedOrder = {
      ...order,
      deliveryMethod: selectedDeliveryMethod,
      deliveryAddress: selectedDeliveryMethod === 'delivery' ? deliveryAddress : undefined
    };
    
    localStorage.setItem(`order_${order.id}`, JSON.stringify(updatedOrder));
    setOrder(updatedOrder);
    setShowDeliveryModal(false);
    
    const message = selectedDeliveryMethod === 'delivery' 
      ? `تم اختيار التوصيل! سيتم توصيل الطلب إلى: ${deliveryAddress}`
      : 'تم اختيار الاستلام من المحل! يرجى زيارة المحل في الوقت المناسب.';
    
    alert(message);
  };

  const isOrderReady = () => {
    return order?.status === 'ready';
  };

  const needsDeliverySelection = () => {
    return isOrderReady() && !order?.deliveryMethod;
  };

  const getStatusInfo = (status: OrderStatus) => {
    const statusMap = {
      pending: { label: 'في انتظار موافقة الخياط', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
      measuring: { label: 'جاري أخذ المقاسات', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Package },
      cutting: { label: 'جاري قص القماش', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400', icon: Package },
      sewing: { label: 'جاري الخياطة', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: Package },
      ready: { label: 'جاهز للاستلام', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
      delivered: { label: 'تم التسليم', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400', icon: CheckCircle },
      cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: X }
    };
    return statusMap[status] || statusMap.pending;
  };

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">جاري التحميل...</p>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="pb-24 pt-4 px-4 md:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate('/account')}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowRight size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">تفاصيل الطلب</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              رقم الطلب: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">#{order.orderNumber || order.id.substring(0, 8)}</span>
            </p>
          </div>
        </div>

        {/* Status Banner - Only show if NOT cancelled/rejected */}
        {order.status !== 'cancelled' && order.status !== 'rejected' && (
          <div className={`${statusInfo.color} rounded-2xl p-4 mb-6 flex items-center gap-3`}>
            <div className="w-12 h-12 bg-white/50 dark:bg-black/20 rounded-full flex items-center justify-center">
              <StatusIcon size={24} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">{statusInfo.label}</p>
              <p className="text-xs opacity-80">تاريخ الطلب: {order.orderDate}</p>
            </div>
          </div>
        )}

        {/* Payment Required Alert */}
        {needsPayment() && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-green-300 dark:border-green-700 rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center shrink-0">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="font-bold text-green-900 dark:text-green-300 text-lg mb-1">الدفع مطلوب</h3>
                <p className="text-sm text-green-800 dark:text-green-400">
                  قبل الخياط طلبك! يرجى إتمام الدفع الآن ليبدأ في التفصيل.
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setShowPaymentModal(true)}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all"
            >
              <CreditCard size={20} />
              ادفع الآن - {order.price} ر.ع
            </Button>
          </div>
        )}

        {/* Delivery Selection Required */}
        {needsDeliverySelection() && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-300 dark:border-emerald-700 rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center shrink-0">
                <Package size={24} />
              </div>
              <div>
                <h3 className="font-bold text-emerald-900 dark:text-emerald-300 text-lg mb-1">🎉 طلبك جاهز!</h3>
                <p className="text-sm text-emerald-800 dark:text-emerald-400 mb-2">
                  تم إرسال إشعار لك عبر الواتساب والبريد الإلكتروني
                </p>
                <div className="flex gap-2 text-xs text-emerald-700 dark:text-emerald-500">
                  {order.notificationChannels?.includes('whatsapp') && (
                    <span className="flex items-center gap-1 bg-white/50 dark:bg-black/20 px-2 py-1 rounded">
                      <MessageCircle size={12} /> واتساب
                    </span>
                  )}
                  {order.notificationChannels?.includes('email') && (
                    <span className="flex items-center gap-1 bg-white/50 dark:bg-black/20 px-2 py-1 rounded">
                      <Mail size={12} /> بريد إلكتروني
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-sm font-bold text-emerald-900 dark:text-emerald-300 mb-3">
              يرجى اختيار طريقة الاستلام:
            </p>
            <Button 
              onClick={() => setShowDeliveryModal(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <Truck size={20} />
              اختر طريقة الاستلام
            </Button>
          </div>
        )}

        {/* Delivery Method Selected */}
        {order.deliveryMethod && isOrderReady() && (
          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              {order.deliveryMethod === 'delivery' ? (
                <>
                  <Truck size={20} className="text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-teal-900 dark:text-teal-300 mb-1">
                      ✓ سيتم التوصيل
                    </p>
                    <p className="text-xs text-teal-700 dark:text-teal-400">
                      العنوان: {order.deliveryAddress}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Store size={20} className="text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-teal-900 dark:text-teal-300 mb-1">
                      ✓ الاستلام من المحل
                    </p>
                    <p className="text-xs text-teal-700 dark:text-teal-400">
                      يرجى زيارة المحل: {order.tailorName}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Rejected/Cancelled Alert */}
        {(order.status === 'rejected' || order.status === 'cancelled') && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3 mb-3">
              <XCircle size={20} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 dark:text-red-300 font-bold mb-1">
                  {order.status === 'rejected' ? 'تم رفض الطلب من الخياط' : 'تم إلغاء الطلب'}
                </p>
                <p className="text-xs text-red-700 dark:text-red-400">
                  نأسف لعدم إتمام هذا الطلب. يمكنك البحث عن خياطين آخرين متخصصين في {order.productCategory || 'نفس نوع الملابس'}.
                </p>
              </div>
            </div>
            <Button 
              onClick={() => navigate(`/tailors${order.productCategory ? `?specialization=${encodeURIComponent(order.productCategory)}` : ''}`)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <ShoppingBag size={18} />
              البحث عن خياط آخر{order.productCategory ? ` - ${order.productCategory}` : ''}
            </Button>
          </div>
        )}

        {/* Can Edit Alert */}
        {canEdit() && !needsPayment() && !needsDeliverySelection() && order.status !== 'rejected' && order.status !== 'cancelled' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">
                يمكنك تعديل الطلب قبل أن يبدأ الخياط في التفصيل
              </p>
              <Button 
                onClick={handleEditOrder}
                variant="outline"
                size="sm"
                className="bg-white dark:bg-slate-800"
              >
                <Edit size={16} />
                تعديل الطلب
              </Button>
            </div>
          </div>
        )}

        {/* Customer Info - Only for Tailor */}
        {user?.role === 'tailor' && order.customerName && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 mb-6">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <MessageCircle size={16} className="text-blue-600 dark:text-blue-400" />
              معلومات العميل
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-600 dark:text-slate-400">الاسم:</span>
                <span className="font-bold text-slate-900 dark:text-white">{order.customerName}</span>
              </div>
              {order.customerPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-600 dark:text-slate-400">الهاتف:</span>
                  <a 
                    href={`tel:${order.customerPhone}`}
                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {order.customerPhone}
                  </a>
                </div>
              )}
              {order.customerEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-slate-400" />
                  <a 
                    href={`mailto:${order.customerEmail}`}
                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {order.customerEmail}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Product Info */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
          {/* Tailor Shop Details */}
          {tailorInfo && (
            <div className="mb-5 pb-5 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-start gap-3 mb-3">
                <Store size={20} className="text-blue-600 dark:text-blue-400 mt-1" />
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">{order.tailorName}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    {tailorInfo.location && (
                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <MapPin size={14} />
                        {tailorInfo.location}
                      </span>
                    )}
                    {tailorInfo.rating && (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <Star size={14} fill="currentColor" />
                        {tailorInfo.rating.toFixed(1)}
                        {tailorInfo.reviewsCount && (
                          <span className="text-slate-500 dark:text-slate-400 text-xs">({tailorInfo.reviewsCount})</span>
                        )}
                      </span>
                    )}
                    {tailorInfo.specialization && (
                      <span className="text-slate-600 dark:text-slate-400">• {tailorInfo.specialization}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/tailor/${order.tailorId}`)}
                  className="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  زيارة المحل
                </button>
              </div>
            </div>
          )}
          
          <div className="flex gap-4 mb-6">
            <img 
              src={order.productImage} 
              alt={order.productName}
              className="w-24 h-24 rounded-xl object-cover"
            />
            <div className="flex-1">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{order.productName}</h3>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-2">{order.price} ر.ع</p>
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3">تفاصيل الطلب</h4>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400">مصدر القماش:</span>
                <p className="font-medium text-slate-900 dark:text-white">
                  {order.fabricSource === 'tailor' ? 'من الخياط' : 
                   order.fabricSource === 'customer' ? 'من العميل' : 'من المتجر'}
                </p>
              </div>
              
              <div>
                <span className="text-slate-500 dark:text-slate-400">حالة الدفع:</span>
                <p className="font-medium text-slate-900 dark:text-white">
                  {order.paymentStatus === 'paid' ? '✓ مدفوع' : 
                   order.paymentStatus === 'partial' ? 'جزئي' : 'قيد الانتظار'}
                </p>
              </div>

              {order.acceptedByTailor && (
                <div className="col-span-2">
                  <span className="text-slate-500 dark:text-slate-400">حالة الطلب:</span>
                  <p className="font-medium text-green-600 dark:text-green-400">
                    ✓ تم قبوله من الخياط
                  </p>
                </div>
              )}
            </div>

            {/* Measurements */}
            {order.measurements && Object.keys(order.measurements).length > 0 && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <h5 className="font-bold text-sm text-slate-900 dark:text-white mb-2">المقاسات</h5>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {Object.entries(order.measurements).map(([key, value]) => (
                    <div key={key} className="bg-slate-50 dark:bg-slate-900 p-2 rounded">
                      <span className="text-slate-500 capitalize">{key}:</span>
                      <span className="font-bold text-slate-900 dark:text-white ml-1">{value} سم</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Note */}
            {order.customerNote && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <h5 className="font-bold text-sm text-slate-900 dark:text-white mb-2">ملاحظات</h5>
                <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
                  {order.customerNote}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">مراحل الطلب</h3>
          <div className="space-y-4">
            {[
              { status: 'pending', label: 'تم إرسال الطلب', completed: true, rejected: false },
              { 
                status: 'accepted', 
                label: 'قبول الخياط', 
                completed: !!order.acceptedByTailor,
                rejected: order.status === 'rejected' || order.status === 'cancelled'
              },
              { status: 'paid', label: 'الدفع', completed: order.paymentStatus === 'paid', rejected: false },
              { status: 'working', label: 'البدء في التفصيل', completed: ['measuring', 'cutting', 'sewing', 'ready', 'delivered'].includes(order.status), rejected: false },
              { status: 'ready', label: 'جاهز للاستلام', completed: ['ready', 'delivered'].includes(order.status), rejected: false },
              { status: 'delivered', label: 'تم التسليم', completed: order.status === 'delivered', rejected: false }
            ].map((step, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  step.rejected 
                    ? 'bg-red-500 text-white'
                    : step.completed 
                    ? 'bg-green-500 text-white' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                }`}>
                  {step.rejected ? (
                    <X size={16} />
                  ) : step.completed ? (
                    <Check size={16} />
                  ) : (
                    <div className="w-2 h-2 bg-current rounded-full"></div>
                  )}
                </div>
                <p className={`text-sm ${
                  step.rejected
                    ? 'font-medium text-red-600 dark:text-red-400'
                    : step.completed 
                    ? 'font-medium text-slate-900 dark:text-white' 
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {step.label}
                  {step.rejected && ' (تم الرفض)'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">إتمام الدفع</h2>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-600 dark:text-slate-400">المبلغ الإجمالي:</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{order.price} ر.ع</span>
                </div>
                <p className="text-xs text-slate-500">سيتم خصم المبلغ بالكامل</p>
              </div>

              <div className="space-y-3 mb-6">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">اختر طريقة الدفع</h3>
                {['بطاقة ائتمانية', 'بطاقة مدى', 'محفظة رقمية'].map((method) => (
                  <button
                    key={method}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <span className="font-medium text-slate-900 dark:text-white">{method}</span>
                    <CreditCard size={20} className="text-slate-400" />
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button onClick={handlePayment} className="flex-1">
                  <Check size={20} />
                  تأكيد الدفع
                </Button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-6 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Method Selection Modal */}
        {showDeliveryModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">اختر طريقة الاستلام</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">كيف تريد استلام طلبك؟</p>
                </div>
                <button 
                  onClick={() => setShowDeliveryModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 mb-6">
                {/* Pickup Option */}
                <button
                  onClick={() => setSelectedDeliveryMethod('pickup')}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-right ${
                    selectedDeliveryMethod === 'pickup'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                      selectedDeliveryMethod === 'pickup'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                    }`}>
                      <Store size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold mb-1 ${
                        selectedDeliveryMethod === 'pickup'
                          ? 'text-emerald-900 dark:text-emerald-300'
                          : 'text-slate-900 dark:text-white'
                      }`}>
                        الاستلام من المحل
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        قم بزيارة المحل واستلم طلبك مباشرة
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 flex items-center gap-1">
                        <MapPin size={12} />
                        {order.tailorName}
                      </p>
                    </div>
                    {selectedDeliveryMethod === 'pickup' && (
                      <Check size={20} className="text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                </button>

                {/* Delivery Option */}
                <button
                  onClick={() => setSelectedDeliveryMethod('delivery')}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-right ${
                    selectedDeliveryMethod === 'delivery'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                      selectedDeliveryMethod === 'delivery'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                    }`}>
                      <Truck size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold mb-1 ${
                        selectedDeliveryMethod === 'delivery'
                          ? 'text-emerald-900 dark:text-emerald-300'
                          : 'text-slate-900 dark:text-white'
                      }`}>
                        التوصيل للمنزل
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        سيتم توصيل الطلب إلى عنوانك
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                        قد تطبق رسوم توصيل إضافية
                      </p>
                    </div>
                    {selectedDeliveryMethod === 'delivery' && (
                      <Check size={20} className="text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                </button>
              </div>

              {/* Delivery Address Input */}
              {selectedDeliveryMethod === 'delivery' && (
                <div className="mb-6 animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                    عنوان التوصيل *
                  </label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white resize-none"
                    placeholder="أدخل العنوان الكامل للتوصيل..."
                    rows={3}
                    required
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  onClick={handleDeliveryMethodSelection}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  disabled={selectedDeliveryMethod === 'delivery' && !deliveryAddress.trim()}
                >
                  <Check size={20} />
                  تأكيد الاختيار
                </Button>
                <button
                  onClick={() => setShowDeliveryModal(false)}
                  className="px-6 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
