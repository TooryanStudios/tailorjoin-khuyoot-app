import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  LogOut, Store, ShoppingBag, MapPin, Plus, ChevronLeft,
  Phone, Package, BarChart3, Eye, CheckCircle, XCircle, Clock, 
  Bell, Save, Settings, Star, MessageCircle, Shirt, Tag, Calendar
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Order } from '../../types';
import { getTailorOrders } from '../../services/orderService';

export const BoutiqueAccount = () => {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'products' | 'rentals' | 'orders' | 'dashboard' | 'settings'>('products');
  const [shopOrders, setShopOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect users who are not a tailor with shopType 'boutique'
  useEffect(() => {
    if (!user) return;
    const shopType = (user as any)?.shopType;
    if (user.role === 'tailor') {
      if (shopType !== 'boutique') {
        navigate('/tailor-account', { replace: true });
        return;
      }
      // Tailor with boutique shopType stays on BoutiqueAccount
      return;
    }
    // Non-tailor users go to generic account
    navigate('/account', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (user && user.role === 'boutique') {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const orders = await getTailorOrders(user.id);
      setShopOrders(orders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show a loader until the user is confirmed as boutique
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!(user.role === 'tailor' && (user as any)?.shopType === 'boutique')) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl p-6 text-center border border-slate-200 dark:border-slate-700">
          <Store className="mx-auto text-pink-600 dark:text-pink-400" size={32} />
          <h3 className="mt-3 font-bold text-slate-900 dark:text-white">هذه الصفحة مخصصة لحسابات البوتيك</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">يبدو أن نوع حسابك مختلف. انتقل لصفحتك المناسبة.</p>
          <div className="mt-4 flex flex-col gap-2">
            <button onClick={() => navigate('/account', { replace: true })} className="w-full py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">الصفحة العامة للحساب</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-6 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header & Identity */}
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-pink-500/20 to-purple-600/20"></div>
          
          <div className="relative w-24 h-24 mb-4">
            <img 
              src={user?.profileImage || "https://picsum.photos/200/200?random=shop"} 
              alt="Shop Logo" 
              className="w-full h-full rounded-full border-4 border-white dark:border-[#050817] object-cover shadow-lg"
            />
            <div className="absolute bottom-0 right-0 bg-pink-600 text-white p-1.5 rounded-full border-2 border-white dark:border-[#050817]">
              <Store size={14} />
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{user?.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 text-[10px] font-bold rounded-full border border-pink-200 dark:border-pink-800">
              بوتيك
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</span>
          </div>

          {user.location && (
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-2">
              <MapPin size={12} />
              <span>{user.location}</span>
            </div>
          )}

          {/* Tabs Navigation */}
          <div className="w-full mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { id: 'products', label: 'المنتجات', icon: Shirt },
                { id: 'rentals', label: 'الإيجارات', icon: Calendar },
                { id: 'orders', label: 'الطلبات', icon: Package },
                { id: 'dashboard', label: 'الإحصائيات', icon: BarChart3 },
                { id: 'settings', label: 'الإعدادات', icon: Settings },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex flex-col items-center gap-2 py-5 rounded-2xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <tab.icon size={20} />
                  <span className="text-xs font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-2xl p-6">
          
          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">إدارة المنتجات</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">أضف وأدر منتجاتك المعروضة للبيع</p>
                </div>
                <Button className="flex items-center gap-2">
                  <Plus size={18} />
                  إضافة منتج جديد
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Product Cards */}
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                  <div className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-lg mb-3 flex items-center justify-center">
                    <Shirt size={48} className="text-slate-400" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">فستان سهرة</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">150 ر.ع</p>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">متوفر</span>
                    <span className="text-xs text-slate-400">5 قطع</span>
                  </div>
                </div>

                {/* Add Product Card */}
                <button className="bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 hover:border-pink-500 dark:hover:border-pink-500 transition-colors flex flex-col items-center justify-center gap-3 aspect-square">
                  <Plus size={48} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">إضافة منتج</span>
                </button>
              </div>
            </div>
          )}

          {/* Rentals Tab */}
          {activeTab === 'rentals' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">إدارة الإيجارات</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">أدر المنتجات المتاحة للإيجار</p>
                </div>
                <Button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all">
                  <Plus size={18} />
                  إضافة للإيجار
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                  <div className="aspect-square bg-purple-100 dark:bg-purple-900/40 rounded-lg mb-3 flex items-center justify-center">
                    <Shirt size={48} className="text-purple-600" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">عباية سهرة فاخرة</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">30 ر.ع / اليوم</p>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 text-xs rounded">
                      <Calendar size={12} className="inline mr-1" />
                      للإيجار
                    </span>
                  </div>
                </div>

                <button className="bg-purple-50 dark:bg-purple-900/20 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-xl p-4 hover:border-purple-500 transition-colors flex flex-col items-center justify-center gap-3 aspect-square">
                  <Plus size={48} className="text-purple-400" />
                  <span className="text-sm font-medium text-purple-600 dark:text-purple-400">إضافة للإيجار</span>
                </button>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">الطلبات</h3>
              
              {shopOrders.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Package size={48} className="mx-auto mb-3 opacity-30" />
                  <p>لا توجد طلبات حالياً</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shopOrders.map(order => (
                    <div key={order.id} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white">طلب #{order.id.slice(0, 8)}</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{order.productName}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          order.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {order.status === 'completed' ? 'مكتمل' : order.status === 'pending' ? 'قيد الانتظار' : 'جاري التنفيذ'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">الإحصائيات</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <ShoppingBag className="text-blue-600" size={24} />
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">هذا الشهر</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">45</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">إجمالي المبيعات</p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Calendar className="text-purple-600" size={24} />
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">نشط</span>
                  </div>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">12</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">إيجارات نشطة</p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Star className="text-green-600" size={24} />
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">التقييم</span>
                  </div>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">4.8</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">من 5 نجوم</p>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">إعدادات المحل</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">اسم المحل</label>
                  <input 
                    type="text" 
                    value={user.name}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">الموقع</label>
                  <input 
                    type="text" 
                    value={user.location || ''}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">رقم الهاتف</label>
                  <input 
                    type="text" 
                    value={user.phone || ''}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <Button className="w-full flex items-center justify-center gap-2">
                  <Save size={18} />
                  حفظ التغييرات
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* Logout Button */}
        <button
          onClick={async () => { await logout(); navigate('/', { replace: true }); }}
          className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <LogOut size={18} />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
};
