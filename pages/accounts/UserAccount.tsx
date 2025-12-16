import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  LogOut, Package, BarChart3, Settings, Star, MessageCircle, 
  Eye, CheckCircle, XCircle, Clock
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Order } from '../../types';
import { getUserOrders } from '../../services/orderService';

export const UserAccount = () => {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'user') {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      console.log('🔍 Loading orders for user ID:', user.id);
      const userOrders = await getUserOrders(user.id);
      console.log('📦 Orders loaded from Firebase:', userOrders.length);
      console.log('📋 Orders data:', userOrders);
      setOrders(userOrders);
    } catch (error) {
      console.error('❌ Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'user') {
    navigate('/account');
    return null;
  }

  return (
    <div className="pb-24 pt-6 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* User Profile Header */}
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-2xl p-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4">
            <img 
              src={user.profileImage || "https://picsum.photos/200/200?random=user"} 
              alt="Avatar" 
              className="w-full h-full rounded-full border-4 border-blue-500/30 object-cover"
            />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{user.email}</p>
          {user.phone && (
            <p className="text-xs text-slate-400 mt-1">{user.phone}</p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center">
            <Package className="mx-auto mb-2 text-blue-600" size={24} />
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{orders.length}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">الطلبات</p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
            <Star className="mx-auto mb-2 text-green-600" size={24} />
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">4.5</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">التقييم</p>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 text-center">
            <MessageCircle className="mx-auto mb-2 text-purple-600" size={24} />
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">12</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">الرسائل</p>
          </div>
        </div>

        {/* My Orders - Full List */}
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">طلباتي</h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-slate-400">جاري تحميل الطلبات...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Package size={48} className="mx-auto mb-3 opacity-30" />
              <p>لا توجد طلبات</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => {
                const getStatusText = (status: string) => {
                  switch(status) {
                    case 'pending': return 'بانتظار الموافقة';
                    case 'measuring': return 'جاري أخذ المقاسات';
                    case 'cutting': return 'جاري القص';
                    case 'sewing': return 'جاري الخياطة';
                    case 'finishing': return 'مرحلة التشطيب';
                    case 'ready': return 'جاهز للاستلام';
                    case 'delivered': return 'تم التسليم';
                    case 'completed': return 'مكتمل';
                    case 'rejected': return 'مرفوض من الخياط';
                    case 'cancelled': return 'ملغي';
                    default: return status;
                  }
                };

                const getStatusColor = (status: string) => {
                  switch(status) {
                    case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
                    case 'measuring': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
                    case 'cutting': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
                    case 'sewing': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
                    case 'finishing': return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400';
                    case 'ready': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
                    case 'delivered':
                    case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
                    case 'rejected':
                    case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
                    default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
                  }
                };

                return (
                  <div 
                    key={order.id} 
                    onClick={() => navigate(`/order/${order.id}`)}
                    className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900/70 transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    <img 
                      src={order.productImage} 
                      alt={order.productName}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{order.productName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{order.tailorName}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{order.createdAt}</p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => navigate('/measurements')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 hover:from-blue-600 hover:to-blue-700 transition-all"
          >
            <BarChart3 size={24} className="mx-auto mb-2" />
            <p className="text-sm font-medium">المقاسات</p>
          </button>
          
          <button 
            onClick={() => navigate('/settings')}
            className="bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-xl p-4 hover:from-slate-600 hover:to-slate-700 transition-all"
          >
            <Settings size={24} className="mx-auto mb-2" />
            <p className="text-sm font-medium">الإعدادات</p>
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <LogOut size={18} />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
};
