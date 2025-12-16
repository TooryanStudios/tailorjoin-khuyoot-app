import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Package, Settings, BarChart3, Eye, CheckCircle, XCircle, MessageCircle, Phone, MapPin, Clock, Star, User, Camera, Edit2, Save, Bell, DollarSign, TrendingUp, ShoppingBag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Order, Tailor } from '../types';
import { Button } from '../components/Button';
import { getTailorById } from '../services/mockService';
import { getTailorOrders, getTailorOrdersStats } from '../services/orderService';

export const TailorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState<'orders' | 'settings' | 'dashboard'>('orders');
  const [tailor, setTailor] = useState<Tailor | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      getTailorById(user.id).then(setTailor);
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const tailorOrders = await getTailorOrders(user.id);
      setOrders(tailorOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = (order: Order) => {
    alert(`تم قبول الطلب ${order.id}`);
    setShowOrderDetails(false);
  };

  const handleRejectOrder = (order: Order) => {
    const reason = prompt('سبب الرفض (اختياري):');
    alert(`تم رفض الطلب ${order.id}${reason ? ': ' + reason : ''}`);
    setShowOrderDetails(false);
  };

  const handleContactCustomer = (order: Order) => {
    alert(`فتح محادثة مع العميل - الطلب ${order.id}`);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-amber-500/20 text-amber-600';
      case 'measuring': return 'bg-blue-500/20 text-blue-600';
      case 'cutting': return 'bg-purple-500/20 text-purple-600';
      case 'sewing': return 'bg-indigo-500/20 text-indigo-600';
      case 'ready': return 'bg-green-500/20 text-green-600';
      case 'delivered': return 'bg-slate-500/20 text-slate-600';
      default: return 'bg-slate-500/20 text-slate-600';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'معلق',
      measuring: 'قياس',
      cutting: 'قص',
      sewing: 'خياطة',
      ready: 'جاهز',
      delivered: 'تم التسليم'
    };
    return statusMap[status] || status;
  };

  if (!tailor) {
    return <div className="p-10 text-center">جاري التحميل...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1121] pb-24" dir="rtl">
      {/* Header with Profile */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowRight size={20} />
            <span>رجوع</span>
          </button>

          {/* Profile Section */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <img 
                src={tailor.image} 
                alt={tailor.name}
                className="w-20 h-20 rounded-xl object-cover border-2 border-slate-200 dark:border-slate-700"
              />
              <button className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                <Camera size={14} />
              </button>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                {tailor.name}
                {tailor.isVerified && <CheckCircle size={20} className="text-blue-500" />}
              </h1>
              <p className="text-slate-500 dark:text-slate-400">{tailor.specialization}</p>
              <div className="flex items-center gap-3 mt-1 text-sm">
                <span className="flex items-center gap-1 text-amber-500">
                  <Star size={14} fill="currentColor" />
                  {tailor.rating}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600 dark:text-slate-400">{tailor.followers} متابع</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
            {[
              { id: 'orders', label: 'الطلبات', icon: Package },
              { id: 'settings', label: 'الإعدادات', icon: Settings },
              { id: 'dashboard', label: 'الإحصائيات', icon: BarChart3 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">جميع الطلبات</h2>
              <div className="flex gap-2 text-sm">
                <span className="px-3 py-1 bg-amber-500/20 text-amber-600 rounded-lg font-medium">
                  معلق: {orders.filter(o => o.status === 'pending').length}
                </span>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-600 rounded-lg font-medium">
                  قيد العمل: {orders.filter(o => ['measuring', 'cutting', 'sewing'].includes(o.status)).length}
                </span>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto mb-4 text-slate-400" size={64} />
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">لا توجد طلبات</h3>
                <p className="text-slate-500">سيتم عرض الطلبات الجديدة هنا</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowOrderDetails(true);
                    }}
                  >
                    <div className="relative h-40 bg-slate-200 dark:bg-slate-700">
                      <img 
                        src={order.productImage} 
                        alt={order.productName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-1">
                            {order.productName}
                          </h3>
                          <p className="text-xs text-slate-500">
                            رقم الطلب: {order.id}
                          </p>
                        </div>
                        <span className="font-bold text-blue-600 text-sm">
                          {order.price} ر.ع
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">
                        {new Date(order.orderDate).toLocaleDateString('ar')}
                      </p>
                      <Button className="w-full text-xs py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/50 transition-all">
                        <Eye size={14} />
                        عرض التفاصيل
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">إعدادات المحل</h2>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  اسم المحل
                </label>
                <input
                  type="text"
                  defaultValue={tailor.name}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  نبذة عن المحل
                </label>
                <textarea
                  defaultValue={tailor.bio}
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    <MapPin size={14} className="inline mr-1" />
                    الموقع
                  </label>
                  <input
                    type="text"
                    defaultValue={tailor.location}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    <Phone size={14} className="inline mr-1" />
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    defaultValue={tailor.contactNumber || '+968 9999 9999'}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  <Clock size={14} className="inline mr-1" />
                  ساعات العمل
                </label>
                <input
                  type="text"
                  defaultValue={tailor.workingHours || '9:00 ص - 10:00 م'}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    <Bell size={14} className="inline mr-1" />
                    تفعيل الإشعارات للطلبات الجديدة
                  </span>
                </label>
              </div>

              <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all">
                <Save size={18} />
                حفظ التغييرات
              </Button>
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">الإحصائيات والأداء</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <ShoppingBag size={24} />
                  </div>
                  <TrendingUp size={20} className="opacity-70" />
                </div>
                <p className="text-sm opacity-90 mb-1">إجمالي الطلبات</p>
                <p className="text-3xl font-bold">{orders.length}</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <CheckCircle size={24} />
                  </div>
                  <TrendingUp size={20} className="opacity-70" />
                </div>
                <p className="text-sm opacity-90 mb-1">طلبات مكتملة</p>
                <p className="text-3xl font-bold">
                  {orders.filter(o => o.status === 'delivered').length}
                </p>
              </div>

              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Clock size={24} />
                  </div>
                  <TrendingUp size={20} className="opacity-70" />
                </div>
                <p className="text-sm opacity-90 mb-1">قيد العمل</p>
                <p className="text-3xl font-bold">
                  {orders.filter(o => ['measuring', 'cutting', 'sewing'].includes(o.status)).length}
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <DollarSign size={24} />
                  </div>
                  <TrendingUp size={20} className="opacity-70" />
                </div>
                <p className="text-sm opacity-90 mb-1">إجمالي الإيرادات</p>
                <p className="text-3xl font-bold">
                  {orders.reduce((sum, o) => sum + o.price, 0).toFixed(0)}
                  <span className="text-sm mr-1">ر.ع</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <Star className="text-amber-500" size={20} />
                  التقييمات
                </h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-5xl font-bold text-slate-800 dark:text-white">
                    {tailor.rating}
                  </div>
                  <div className="flex-1">
                    <div className="flex text-amber-500 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={20} fill="currentColor" />
                      ))}
                    </div>
                    <p className="text-sm text-slate-500">
                      بناءً على {tailor.reviews?.length || 0} تقييم
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <User className="text-blue-500" size={20} />
                  المتابعون
                </h3>
                <div className="text-5xl font-bold text-slate-800 dark:text-white mb-2">
                  {tailor.followers}
                </div>
                <p className="text-sm text-slate-500">متابع على المنصة</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                    {selectedOrder.productName}
                  </h3>
                  <p className="text-sm text-slate-500">رقم الطلب: {selectedOrder.id}</p>
                </div>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <XCircle size={20} className="text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <img
                src={selectedOrder.productImage}
                alt={selectedOrder.productName}
                className="w-full h-48 object-cover rounded-xl"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">السعر</p>
                  <p className="font-bold text-lg text-slate-800 dark:text-white">
                    {selectedOrder.price} ر.ع
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">الحالة</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusText(selectedOrder.status)}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">تاريخ الطلب</p>
                  <p className="text-sm text-slate-800 dark:text-white">
                    {new Date(selectedOrder.orderDate).toLocaleDateString('ar')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">المصدر</p>
                  <p className="text-sm text-slate-800 dark:text-white">
                    {selectedOrder.fabricSource === 'tailor' ? 'من الخياط' : 
                     selectedOrder.fabricSource === 'customer' ? 'من العميل' : 'من المتجر'}
                  </p>
                </div>
              </div>

              {selectedOrder.measurements && (
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white mb-2">المقاسات:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(selectedOrder.measurements).map(([key, value]) => (
                      <div key={key} className="flex justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded">
                        <span className="text-slate-600 dark:text-slate-400">{key}</span>
                        <span className="font-medium text-slate-800 dark:text-white">{value} سم</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedOrder.notes && (
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white mb-2">ملاحظات:</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-700">
              {selectedOrder.status === 'pending' ? (
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    onClick={() => handleAcceptOrder(selectedOrder)}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md shadow-green-500/30 hover:shadow-lg hover:shadow-green-500/50 col-span-1 transition-all"
                  >
                    <CheckCircle size={18} />
                    قبول
                  </Button>
                  <Button
                    onClick={() => handleRejectOrder(selectedOrder)}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-md shadow-red-500/30 hover:shadow-lg hover:shadow-red-500/50 col-span-1 transition-all"
                  >
                    <XCircle size={18} />
                    رفض
                  </Button>
                  <Button
                    onClick={() => handleContactCustomer(selectedOrder)}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/50 col-span-1 transition-all"
                  >
                    <MessageCircle size={18} />
                    تواصل
                  </Button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleContactCustomer(selectedOrder)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
                  >
                    <MessageCircle size={18} />
                    تواصل مع العميل
                  </Button>
                  <Button
                    onClick={() => setShowOrderDetails(false)}
                    className="flex-1 bg-slate-600 hover:bg-slate-700"
                  >
                    إغلاق
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
