import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  LogOut, Store, ShoppingBag, MapPin, Plus, ChevronLeft,
  Phone, Package, BarChart3, Eye, CheckCircle, XCircle, Clock, 
  Bell, Save, Settings, Star, MessageCircle, Shirt
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Order, Tailor } from '../../types';
import { getTailorById } from '../../services/mockService';
import { getTailorOrders } from '../../services/orderService';

export const TailorAccount = () => {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'materials' | 'dashboard' | 'branches' | 'settings'>('orders');
  const [tailorOrders, setTailorOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [tailor, setTailor] = useState<Tailor | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect non-tailor users after hydration
  useEffect(() => {
    if (!user) return;
    if (user.role !== 'tailor') {
      navigate('/account', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && user.role === 'tailor') {
      loadOrders();
      getTailorById(user.id).then(setTailor);
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const orders = await getTailorOrders(user.id);
      setTailorOrders(orders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show loader until user loads; render only for tailor/shop
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'tailor') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl p-6 text-center border border-slate-200 dark:border-slate-700">
          <Store className="mx-auto text-blue-600 dark:text-blue-400" size={32} />
          <h3 className="mt-3 font-bold text-slate-900 dark:text-white">هذه الصفحة مخصصة لحسابات الخياطين</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">نوع حسابك مختلف. استخدم الزر للانتقال للصفحة المناسبة.</p>
          <div className="mt-4 flex flex-col gap-2">
            <button onClick={() => navigate('/account', { replace: true })} className="w-full py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">الصفحة العامة للحساب</button>
          </div>
        </div>
      </div>
    );
  }
  {user && (
    <div className="fixed bottom-20 right-3 z-40 px-3 py-1.5 rounded-full text-xs font-semibold bg-black/70 text-white backdrop-blur-sm border border-white/20 shadow">
      دور: {user.role ?? '—'}
    </div>
  )}

  return (
    <div className="pb-24 pt-6 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header & Identity */}
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-amber-500/20 to-blue-600/20"></div>
          
          <div className="relative w-24 h-24 mb-4">
            <img 
              src={user?.profileImage || "https://picsum.photos/200/200?random=tailor"} 
              alt="Shop Logo" 
              className="w-full h-full rounded-full border-4 border-white dark:border-[#050817] object-cover shadow-lg"
            />
            <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full border-2 border-white dark:border-[#050817]">
              <Store size={14} />
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{user?.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-full border border-amber-200 dark:border-amber-800">
              خياط (شريك)
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</span>
          </div>

          {/* Tabs Navigation */}
          <div className="w-full mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { id: 'orders', label: 'الطلبات', icon: Package },
                { id: 'materials', label: 'الأقمشة والمواد', icon: ShoppingBag },
                { id: 'dashboard', label: 'الإحصائيات', icon: BarChart3 },
                { id: 'branches', label: 'إدارة المحل', icon: Store },
                { id: 'settings', label: 'الإعدادات', icon: Settings },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex flex-col items-center gap-2 py-5 rounded-2xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <tab.icon size={28} />
                  <span className="text-sm font-bold text-center">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content - Orders */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">جميع الطلبات</h3>
              <div className="flex gap-2 text-xs">
                <span className="px-3 py-1 bg-amber-500/20 text-amber-600 rounded-lg font-medium">
                  معلق: {tailorOrders.filter(o => o.status === 'pending').length}
                </span>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-600 rounded-lg font-medium">
                  قيد العمل: {tailorOrders.filter(o => ['measuring', 'cutting', 'sewing'].includes(o.status)).length}
                </span>
              </div>
            </div>

            {tailorOrders.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl">
                <Package className="mx-auto mb-4 text-slate-400" size={64} />
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">لا توجد طلبات</h3>
                <p className="text-slate-500">سيتم عرض الطلبات الجديدة هنا</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {tailorOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowOrderDetails(true);
                    }}
                  >
                    <div className="flex gap-4 p-4">
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-700">
                        <img 
                          src={order.productImage} 
                          alt={order.productName}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 left-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            order.status === 'pending' ? 'bg-amber-500/90 text-white' :
                            order.status === 'measuring' ? 'bg-blue-500/90 text-white' :
                            order.status === 'cutting' ? 'bg-purple-500/90 text-white' :
                            order.status === 'sewing' ? 'bg-indigo-500/90 text-white' :
                            order.status === 'ready' ? 'bg-green-500/90 text-white' :
                            'bg-slate-500/90 text-white'
                          }`}>
                            {order.status === 'pending' ? 'معلق' :
                             order.status === 'measuring' ? 'قياس' :
                             order.status === 'cutting' ? 'قص' :
                             order.status === 'sewing' ? 'خياطة' :
                             order.status === 'ready' ? 'جاهز' : 'مكتمل'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
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
                        <p className="text-xs text-slate-500 mb-2">
                          {new Date(order.orderDate).toLocaleDateString('ar')}
                        </p>
                        <Button className="w-full text-xs py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/50 transition-all">
                          <Eye size={14} />
                          عرض التفاصيل
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content - Materials */}
        {activeTab === 'materials' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">الأقمشة والمواد</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">إدارة الأقمشة والخيوط والملحقات المتوفرة</p>
              </div>
              <Button 
                onClick={() => navigate('/tailor-materials')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center gap-2 transition-all"
              >
                <Plus size={18} />
                إضافة جديد
              </Button>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 text-center border border-blue-100 dark:border-blue-800">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag size={40} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">إدارة الأقمشة والمواد</h4>
              <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                أضف وأدر الأقمشة والخيوط والملحقات المتوفرة لديك. يمكن للعملاء رؤية المواد المتاحة واختيارها عند الطلب.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => navigate('/tailor-materials')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center justify-center gap-2 transition-all"
                >
                  <ShoppingBag size={18} />
                  إدارة الأقمشة والمواد
                </Button>
                <button 
                  className="px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                >
                  عرض الدليل
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-3">
                  <Package size={24} className="text-purple-600 dark:text-purple-400" />
                </div>
                <h5 className="font-bold text-slate-800 dark:text-white mb-2">الأقمشة</h5>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  أضف أنواع الأقمشة المختلفة مع الأسعار والألوان المتاحة
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-3">
                  <Shirt size={24} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h5 className="font-bold text-slate-800 dark:text-white mb-2">الخيوط</h5>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  أضف أنواع الخيوط والألوان المتوفرة لديك
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-3">
                  <Star size={24} className="text-green-600 dark:text-green-400" />
                </div>
                <h5 className="font-bold text-slate-800 dark:text-white mb-2">الملحقات</h5>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  أزرار، سحابات، وملحقات الخياطة الأخرى
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content - Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">الإحصائيات والأداء</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
                <Package size={24} className="mb-2 opacity-80" />
                <p className="text-2xl font-bold mb-1">{tailorOrders.length}</p>
                <p className="text-xs text-blue-100">إجمالي الطلبات</p>
              </div>

              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white shadow-lg">
                <Clock size={24} className="mb-2 opacity-80" />
                <p className="text-2xl font-bold mb-1">{tailorOrders.filter(o => o.status === 'pending').length}</p>
                <p className="text-xs text-amber-100">طلبات معلقة</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
                <CheckCircle size={24} className="mb-2 opacity-80" />
                <p className="text-2xl font-bold mb-1">{tailorOrders.filter(o => o.status === 'delivered').length}</p>
                <p className="text-xs text-green-100">طلبات مكتملة</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
                <Star size={24} className="mb-2 opacity-80" fill="currentColor" />
                <p className="text-2xl font-bold mb-1">{tailor?.rating || 4.8}</p>
                <p className="text-xs text-purple-100">التقييم</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-slate-800 dark:text-white">معلومات إضافية</h4>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">عدد المتابعين</span>
                  <span className="font-bold text-slate-800 dark:text-white">{tailor?.followers || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">نوع الخياطة</span>
                  <span className={`font-bold px-3 py-1 rounded-full text-xs ${
                    user?.tailorGender === 'male' 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' 
                      : 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400'
                  }`}>
                    {user?.tailorGender === 'male' ? '👔 رجالي' : '👗 نسائي'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">التخصص</span>
                  <span className="font-bold text-slate-800 dark:text-white">{tailor?.specialization || 'رجالي'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600 dark:text-slate-400">سنوات الخبرة</span>
                  <span className="font-bold text-slate-800 dark:text-white">{tailor?.experience || '10+ سنوات'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content - Branches */}
        {activeTab === 'branches' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">إدارة المحل والفروع</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">إدارة معلومات المحل وإضافة الفروع الجديدة</p>
              </div>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center gap-2 transition-all">
                <Plus size={18} />
                إضافة فرع جديد
              </Button>
            </div>

            {/* معلومات المحل الرئيسية */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Store size={20} className="text-blue-600" />
                <h4 className="text-md font-bold text-slate-800 dark:text-white">معلومات المحل الرئيسية</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    اسم المحل
                  </label>
                  <input
                    type="text"
                    defaultValue={user?.name}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <MapPin size={14} className="inline ml-1" />
                    الموقع
                  </label>
                  <input
                    type="text"
                    defaultValue={tailor?.location || 'مسقط'}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Phone size={14} className="inline ml-1" />
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    defaultValue={tailor?.contactNumber || '+968 9999 9999'}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Clock size={14} className="inline ml-1" />
                    ساعات العمل
                  </label>
                  <input
                    type="text"
                    defaultValue={tailor?.workingHours || '9:00 ص - 10:00 م'}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  نبذة عن المحل
                </label>
                <textarea
                  defaultValue={tailor?.bio || 'متخصص في تفصيل الأزياء العمانية التقليدية والعصرية'}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white resize-none"
                />
              </div>

              <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all">
                <Save size={18} />
                حفظ التغييرات
              </Button>
            </div>

            {/* قائمة الفروع */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <MapPin size={20} className="text-purple-600" />
                  الفروع ({2})
                </h4>
                <span className="text-xs text-slate-500 dark:text-slate-400 bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full">
                  تتطلب موافقة الإدارة
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'الفرع الرئيسي - السيب', address: 'شارع السلطان قابوس، مقابل مول السيب', phone: '+968 9999 9999', status: 'approved' },
                  { name: 'فرع القرم - مجمع العريمي', address: 'مجمع العريمي التجاري، الدور الأول', phone: '+968 9888 8888', status: 'approved' },
                ].map((branch, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                          <Store size={20} />
                        </div>
                        <div className="flex-1">
                          <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">{branch.name}</h5>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 flex items-start gap-1">
                            <MapPin size={12} className="mt-0.5 shrink-0" />
                            <span>{branch.address}</span>
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <Phone size={12} />
                            {branch.phone}
                          </p>
                          <div className="mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              branch.status === 'approved' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            }`}>
                              {branch.status === 'approved' ? '✓ موافق عليه' : '⏳ قيد المراجعة'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        <ChevronLeft size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <p className="text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                  <Bell size={14} className="mt-0.5 shrink-0" />
                  <span>جميع الفروع الجديدة تتطلب موافقة الإدارة قبل الظهور في الموقع. عادة ما تستغرق عملية المراجعة من 24-48 ساعة.</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content - Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">الإعدادات العامة</h3>

            {/* إعدادات الإشعارات */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <h4 className="text-md font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Bell size={20} className="text-blue-600" />
                الإشعارات
              </h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer p-3 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">إشعارات الطلبات الجديدة</p>
                    <p className="text-xs text-slate-500">احصل على إشعار عند وصول طلب جديد</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" defaultChecked />
                </label>
                
                <label className="flex items-center justify-between cursor-pointer p-3 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">إشعارات الرسائل</p>
                    <p className="text-xs text-slate-500">احصل على إشعار عند استلام رسالة من عميل</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" defaultChecked />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-3 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">إشعارات التقييمات</p>
                    <p className="text-xs text-slate-500">احصل على إشعار عند حصولك على تقييم جديد</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" defaultChecked />
                </label>
              </div>
            </div>

            {/* إعدادات الخصوصية */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <h4 className="text-md font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Settings size={20} className="text-purple-600" />
                الخصوصية والأمان
              </h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer p-3 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">إظهار المحل للعملاء</p>
                    <p className="text-xs text-slate-500">اجعل محلك ظاهراً في قائمة الخياطين</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" defaultChecked />
                </label>
                
                <label className="flex items-center justify-between cursor-pointer p-3 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">إظهار رقم الهاتف</p>
                    <p className="text-xs text-slate-500">اجعل رقم الهاتف مرئياً للعملاء</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" defaultChecked />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-3 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">قبول طلبات جديدة</p>
                    <p className="text-xs text-slate-500">السماح للعملاء بإرسال طلبات جديدة</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" defaultChecked />
                </label>
              </div>
            </div>

            <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all">
              <Save size={18} />
              حفظ الإعدادات
            </Button>
          </div>
        )}

        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-t-3xl md:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">
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
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      selectedOrder.status === 'pending' ? 'bg-amber-500/20 text-amber-600' :
                      selectedOrder.status === 'measuring' ? 'bg-blue-500/20 text-blue-600' :
                      selectedOrder.status === 'cutting' ? 'bg-purple-500/20 text-purple-600' :
                      selectedOrder.status === 'sewing' ? 'bg-indigo-500/20 text-indigo-600' :
                      selectedOrder.status === 'ready' ? 'bg-green-500/20 text-green-600' :
                      'bg-slate-500/20 text-slate-600'
                    }`}>
                      {selectedOrder.status === 'pending' ? 'معلق' :
                       selectedOrder.status === 'measuring' ? 'قياس' :
                       selectedOrder.status === 'cutting' ? 'قص' :
                       selectedOrder.status === 'sewing' ? 'خياطة' :
                       selectedOrder.status === 'ready' ? 'جاهز' : 'مكتمل'}
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
                      onClick={() => {
                        alert(`تم قبول الطلب ${selectedOrder.id}`);
                        setShowOrderDetails(false);
                      }}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md shadow-green-500/30 hover:shadow-lg hover:shadow-green-500/50 col-span-1 transition-all"
                    >
                      <CheckCircle size={18} />
                      قبول
                    </Button>
                    <Button
                      onClick={() => {
                        const reason = prompt('سبب الرفض (اختياري):');
                        alert(`تم رفض الطلب ${selectedOrder.id}${reason ? ': ' + reason : ''}`);
                        setShowOrderDetails(false);
                      }}
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-md shadow-red-500/30 hover:shadow-lg hover:shadow-red-500/50 col-span-1 transition-all"
                    >
                      <XCircle size={18} />
                      رفض
                    </Button>
                    <Button
                      onClick={() => alert(`فتح محادثة مع العميل - الطلب ${selectedOrder.id}`)}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/50 col-span-1 transition-all"
                    >
                      <MessageCircle size={18} />
                      تواصل
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => alert(`فتح محادثة مع العميل`)}
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

        {/* Logout Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <Button 
            variant="danger" 
            className="w-full flex items-center justify-center gap-2"
            onClick={logout}
          >
            <LogOut size={18} />
            <span>تسجيل الخروج</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
