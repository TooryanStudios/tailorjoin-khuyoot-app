import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  LogOut, Store, ShoppingBag, MapPin, Plus, ChevronLeft,
  Phone, Package, BarChart3, Eye, CheckCircle, XCircle, Clock, 
  Bell, Save, Settings, Star, MessageCircle, Tag
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Order } from '../../types';
import { getTailorOrders } from '../../services/orderService';

export const ShopAccount = () => {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'dashboard' | 'settings'>('products');
  const [shopOrders, setShopOrders] = useState<Order[]>([]);

  // Redirect non-shop users after hydration
  useEffect(() => {
    if (!user) return;
    if (user.role !== 'shop') {
      navigate('/account', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && user.role === 'shop') {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user?.id) return;
    try {
      const orders = await getTailorOrders(user.id);
      setShopOrders(orders);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  // Show loader until user loads
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'shop') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl p-6 text-center border border-slate-200 dark:border-slate-700">
          <Store className="mx-auto text-indigo-600 dark:text-indigo-400" size={32} />
          <h3 className="mt-3 font-bold text-slate-900 dark:text-white">هذه الصفحة مخصصة لحسابات المحلات</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">يبدو أن نوع حسابك مختلف. انتقل لصفحتك المناسبة.</p>
          <div className="mt-4">
            <button onClick={() => navigate('/account', { replace: true })} className="w-full py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
              الصفحة العامة للحساب
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-6 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header & Identity */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/40">
                <Store size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{user.name}</h1>
                <p className="text-indigo-100 text-sm flex items-center gap-2 mt-1">
                  <MapPin size={14} /> {user.location || 'الموقع غير محدد'}
                </p>
                <p className="text-indigo-100 text-xs mt-1">
                  <Phone size={12} className="inline mr-1" /> {user.phone || 'لا يوجد'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{shopOrders.length}</div>
              <div className="text-indigo-100 text-sm">طلب كلي</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2 flex gap-2 overflow-x-auto">
          {[
            { id: 'products', label: 'المنتجات', icon: Tag },
            { id: 'orders', label: 'الطلبات', icon: ShoppingBag },
            { id: 'dashboard', label: 'لوحة التحكم', icon: BarChart3 },
            { id: 'settings', label: 'الإعدادات', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          
          {/* Products Tab */}
          {activeTab === 'products' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">المنتجات</h2>
                <Button>
                  <Plus size={18} className="ml-2" />
                  إضافة منتج
                </Button>
              </div>
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <Tag size={48} className="mx-auto mb-3 opacity-30" />
                <p>لا توجد منتجات حالياً</p>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">الطلبات</h2>
              {shopOrders.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <Package size={48} className="mx-auto mb-3 opacity-30" />
                  <p>لا توجد طلبات حالياً</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shopOrders.map(order => (
                    <div key={order.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">طلب #{order.id}</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">{order.customerName}</div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          order.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {order.status === 'completed' ? 'مكتمل' : order.status === 'in-progress' ? 'قيد التنفيذ' : 'معلق'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">لوحة التحكم</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <div className="text-blue-600 dark:text-blue-400 mb-2"><ShoppingBag size={24} /></div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{shopOrders.length}</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">إجمالي الطلبات</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                  <div className="text-emerald-600 dark:text-emerald-400 mb-2"><CheckCircle size={24} /></div>
                  <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                    {shopOrders.filter(o => o.status === 'completed').length}
                  </div>
                  <div className="text-sm text-emerald-700 dark:text-emerald-300">طلبات مكتملة</div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                  <div className="text-amber-600 dark:text-amber-400 mb-2"><Clock size={24} /></div>
                  <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                    {shopOrders.filter(o => o.status === 'pending').length}
                  </div>
                  <div className="text-sm text-amber-700 dark:text-amber-300">طلبات معلقة</div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">الإعدادات</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">اسم المحل</label>
                  <input type="text" defaultValue={user.name} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">الموقع</label>
                  <input type="text" defaultValue={user.location} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">رقم الهاتف</label>
                  <input type="tel" defaultValue={user.phone} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white" />
                </div>
                <Button>
                  <Save size={18} className="ml-2" />
                  حفظ التغييرات
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <LogOut size={18} />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
};
