import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useOrderDetails } from '../src/context/OrderDetailsContext';
import { 
   ShoppingBag, Package, Calendar, LayoutGrid, List, Scissors, User as UserIcon, 
   Clock, CheckCircle2, AlertCircle, XCircle, Sparkles
} from 'lucide-react';
import { Order } from '../types';
import { getUserOrders } from '../services/orderService';
import { MontHeader } from '../src/components/MontHeader';

const MONT_HEADER_ID = 'khuyoot-mont-header';

export const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const { showOrderDetails } = useOrderDetails();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<'active' | 'pending' | 'cancelled' | 'completed' | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [headerHeight, setHeaderHeight] = useState(0);

  // Calculate header height
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const updateHeaderHeight = () => {
      const headerEl = document.getElementById(MONT_HEADER_ID);
      if (!headerEl) return;
      const measuredHeight = headerEl.getBoundingClientRect().height;
      if (measuredHeight > 0) {
        setHeaderHeight(measuredHeight);
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  // Load orders on mount
  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
     if (!user?.id) return;
     try {
        const userOrders = await getUserOrders(user.id);
        setOrders(userOrders);
     } catch (error) {
        console.error('Error loading orders:', error);
     }
  };

  const filteredOrders = orders.filter(order => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'active') return !['pending', 'cancelled', 'delivered'].includes(order.status);
      if (statusFilter === 'pending') return order.status === 'pending';
      if (statusFilter === 'cancelled') return order.status === 'cancelled';
      if (statusFilter === 'completed') return order.status === 'delivered';
      return true;
  });

  // Group orders by status
  const activeOrders = orders.filter(o => !['pending', 'cancelled', 'delivered'].includes(o.status));
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const completedOrders = orders.filter(o => o.status === 'delivered');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  // Render order card for grid mode
  const renderOrderCard = (order: Order, featured = false) => (
    <div
      key={order.id}
      onClick={() => showOrderDetails(order)}
      className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
        featured
          ? 'bg-white border-2 border-slate-200 hover:border-[var(--theme-primary)] hover:shadow-2xl'
          : 'bg-white border border-slate-100 hover:border-[var(--theme-primary)] hover:shadow-lg'
      }`}
    >
      <div className={`${featured ? 'aspect-[2/1]' : 'aspect-video'} relative overflow-hidden bg-slate-50`}>
        {order.items && order.items[0]?.image ? (
          <img
            src={order.items[0].image}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            alt={order.items[0].name || order.productName}
          />
        ) : order.productImage ? (
          <img
            src={order.productImage}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            alt={order.productName}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Package size={featured ? 48 : 32} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1.5 text-xs font-medium rounded-full backdrop-blur-md border ${
            order.status === 'delivered' ? 'bg-green-500/90 text-white border-green-400' :
            order.status === 'processing' ? 'bg-[var(--theme-primary)]/90 text-white border-[var(--theme-primary)]' :
            order.status === 'pending' ? 'bg-amber-500/90 text-white border-amber-400' :
            order.status === 'cancelled' ? 'bg-red-500/90 text-white border-red-400' :
            'bg-slate-500/90 text-white border-slate-400'
          }`}>
            {order.status === 'delivered' ? 'مكتمل' :
             order.status === 'processing' ? 'قيد التنفيذ' :
             order.status === 'pending' ? 'بانتظار التأكيد' :
             order.status === 'cancelled' ? 'ملغي' : order.status}
          </span>
        </div>
      </div>

      <div className={`${featured ? 'p-6' : 'p-4'}`} dir="rtl">
        <h3 className={`${featured ? 'text-xl' : 'text-base'} font-bold text-slate-900 mb-1 line-clamp-1`}>
          {order.items && order.items[0]?.name ? order.items[0].name : order.productName || "طلب تفصيل"}
        </h3>
        <p className="text-xs text-[var(--theme-primary)] mb-2">#{order.id.slice(-6).toUpperCase()}</p>
        
        {(order.tailorShop || order.tailorName) && (
          <p className="text-sm text-slate-600 mb-3 flex items-center gap-1.5">
            <Scissors size={14} />
            {order.tailorShop || order.tailorName}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-slate-500">المبلغ</p>
              <p className={`${featured ? 'text-2xl' : 'text-lg'} font-bold text-slate-900`}>
                {order.totalPrice || order.price} <span className="text-sm">ر.س</span>
              </p>
            </div>
          </div>
          <div className="text-left">
            <p className="text-xs text-slate-500 mb-0.5">تاريخ الطلب</p>
            <p className="text-xs text-slate-600 flex items-center gap-1">
              <Calendar size={12} />
              {order.createdAt?.toDate?.() 
                ? new Date(order.createdAt.toDate()).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' })
                : new Date(order.orderDate).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' })
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render order list item for list mode
  const renderOrderListItem = (order: Order) => (
    <div
      key={order.id}
      onClick={() => showOrderDetails(order)}
      className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all group border border-slate-100 hover:border-[var(--theme-primary)] cursor-pointer flex gap-4"
      dir="rtl"
    >
      {/* Thumbnail */}
      <div className="w-24 h-28 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden shrink-0">
        {order.items && order.items[0]?.image ? (
          <img
            src={order.items[0].image}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            alt={order.items[0].name || order.productName}
          />
        ) : order.productImage ? (
          <img
            src={order.productImage}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            alt={order.productName}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Package size={28} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-slate-900 line-clamp-1">
                {order.items && order.items[0]?.name ? order.items[0].name : order.productName || "طلب تفصيل"}
              </h4>
              <p className="text-xs text-[var(--theme-primary)] mt-0.5">#{order.id.slice(-6).toUpperCase()}</p>
            </div>
            <span className={`px-2.5 py-1 text-xs font-medium rounded-md shrink-0 ${
              order.status === 'delivered' ? 'bg-green-100 text-green-700' :
              order.status === 'processing' ? 'bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]' :
              order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
              order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {order.status === 'delivered' ? 'مكتمل' :
               order.status === 'processing' ? 'قيد التنفيذ' :
               order.status === 'pending' ? 'بانتظار التأكيد' :
               order.status === 'cancelled' ? 'ملغي' : order.status}
            </span>
          </div>

          {(order.tailorShop || order.tailorName) && (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Scissors size={11} />
              {order.tailorShop || order.tailorName}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-lg font-bold text-slate-900">
            {order.totalPrice || order.price} <span className="text-sm font-normal">ر.س</span>
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Calendar size={11} />
            {order.createdAt?.toDate?.() 
              ? new Date(order.createdAt.toDate()).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' })
              : new Date(order.orderDate).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' })
            }
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <MontHeader />
      <div
        aria-hidden="true"
        className="pointer-events-none"
        style={{ height: headerHeight }}
      />
      
      <div className="bg-[#ededed] font-['Tajawal'] text-slate-900 selection:bg-[var(--theme-primary)] selection:text-white min-h-screen pb-8">
        {/* Hero Banner */}
        <section className="px-4 md:px-8 py-3 max-w-[1400px] mx-auto">
            <div className="relative rounded-xl bg-[var(--theme-primary)] p-6 md:p-8 overflow-hidden min-h-[140px] flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
              
              <div className="relative z-10" dir="rtl">
                <div className="flex items-center justify-between gap-4">
                  {/* Title with Profile Photo (mobile only) */}
                  <div className="flex items-center gap-4">
                    {/* Profile photo - visible only on mobile */}
                    <div className="md:hidden relative">
                      <div className="w-14 h-14 rounded-full border-4 border-white/20 overflow-hidden bg-white/10 flex items-center justify-center">
                        {(user?.profileImage || user?.avatar) ? (
                          <img src={user.profileImage || user.avatar} className="w-full h-full object-cover" alt={user.name} />
                        ) : (
                          <UserIcon size={20} className="text-white/60" />
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <h1 className="text-2xl md:text-3xl font-bold text-white">طلباتي</h1>
                      <p className="text-white/70 text-sm">تتبع وإدارة طلباتك</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-2">
                    <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/10 flex flex-col items-center justify-center min-w-[70px]">
                      <span className="text-xl md:text-2xl font-bold text-white">{orders.length}</span>
                      <span className="text-[9px] md:text-[10px] text-white/60">إجمالي الطلبات</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/10 flex flex-col items-center justify-center min-w-[70px]">
                      <span className="text-xl md:text-2xl font-bold text-white">
                        {orders.filter(o => !['pending', 'cancelled', 'delivered'].includes(o.status)).length}
                      </span>
                      <span className="text-[9px] md:text-[10px] text-white/60">النشطة</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

        <main className="px-4 md:px-8 py-3 max-w-[1400px] mx-auto pb-8">
          {/* Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6" dir="rtl">
            <div className="flex items-center gap-2">
              {/* Filter Tabs */}
              <div className="flex gap-1 bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    statusFilter === 'active'
                      ? 'bg-[var(--theme-primary)] text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  النشطة
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    statusFilter === 'pending'
                      ? 'bg-[var(--theme-primary)] text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  قيد الانتظار
                </button>
                <button
                  onClick={() => setStatusFilter('cancelled')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    statusFilter === 'cancelled'
                      ? 'bg-[var(--theme-primary)] text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  الملغية
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    statusFilter === 'completed'
                      ? 'bg-[var(--theme-primary)] text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  المكتملة
                </button>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    statusFilter === 'all'
                      ? 'bg-[var(--theme-primary)] text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  الكل
                </button>
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-2 py-1.5 rounded-md transition-all ${
                    viewMode === 'list'
                      ? 'bg-[var(--theme-primary)] text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  title="عرض القائمة"
                >
                  <List size={14} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-2 py-1.5 rounded-md transition-all ${
                    viewMode === 'grid'
                      ? 'bg-[var(--theme-primary)] text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  title="عرض الشبكة"
                >
                  <LayoutGrid size={14} />
                </button>
              </div>
            </div>

            {/* Order count */}
            <div className="text-sm text-slate-600">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'طلب' : 'طلبات'}
            </div>
          </div>

          {/* Orders List */}
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl shadow-sm" dir="rtl">
              <div className="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center mb-4 shadow-sm border border-slate-200">
                <ShoppingBag size={32} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">لا توجد طلبات حالياً</h3>
              <p className="text-sm text-slate-400 mt-1">ابدأ التسوق واطلب منتجاتك المفضلة</p>
              <button
                onClick={() => navigate('/')}
                className="mt-6 px-8 py-3 bg-[var(--theme-primary)] text-white rounded-lg text-sm font-bold hover:bg-[var(--theme-primary)]/90 transition-all shadow-lg hover:shadow-xl"
              >
                تصفح المنتجات
              </button>
            </div>
          ) : (
            <>
              {/* Active Orders Section */}
              {statusFilter === 'all' || statusFilter === 'active' ? (
                activeOrders.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center gap-2 mb-6" dir="rtl">
                      <Clock className="text-[var(--theme-primary)]" size={24} />
                      <h2 className="text-2xl font-bold text-slate-900">
                        الطلبات النشطة
                      </h2>
                      <span className="text-sm text-slate-500">({activeOrders.length})</span>
                    </div>

                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {activeOrders.slice(0, 4).map(order => renderOrderCard(order, true))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeOrders.slice(0, 4).map(order => renderOrderListItem(order))}
                      </div>
                    )}
                  </div>
                )
              ) : null}

              {/* Pending Orders Section */}
              {statusFilter === 'all' || statusFilter === 'pending' ? (
                pendingOrders.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center gap-2 mb-6" dir="rtl">
                      <AlertCircle className="text-amber-500" size={24} />
                      <h2 className="text-2xl font-bold text-slate-900">
                        بانتظار التأكيد
                      </h2>
                      <span className="text-sm text-slate-500">({pendingOrders.length})</span>
                    </div>

                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {pendingOrders.map(order => renderOrderCard(order, false))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingOrders.map(order => renderOrderListItem(order))}
                      </div>
                    )}
                  </div>
                )
              ) : null}

              {/* Completed Orders Section */}
              {statusFilter === 'all' || statusFilter === 'completed' ? (
                completedOrders.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center gap-2 mb-6" dir="rtl">
                      <CheckCircle2 className="text-green-500" size={24} />
                      <h2 className="text-2xl font-bold text-slate-900">
                        الطلبات المكتملة
                      </h2>
                      <span className="text-sm text-slate-500">({completedOrders.length})</span>
                    </div>

                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {completedOrders.map(order => renderOrderCard(order, false))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {completedOrders.map(order => renderOrderListItem(order))}
                      </div>
                    )}
                  </div>
                )
              ) : null}

              {/* Cancelled Orders Section */}
              {statusFilter === 'all' || statusFilter === 'cancelled' ? (
                cancelledOrders.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center gap-2 mb-6" dir="rtl">
                      <XCircle className="text-red-500" size={24} />
                      <h2 className="text-2xl font-bold text-slate-900">
                        الطلبات الملغية
                      </h2>
                      <span className="text-sm text-slate-500">({cancelledOrders.length})</span>
                    </div>

                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {cancelledOrders.map(order => renderOrderCard(order, false))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {cancelledOrders.map(order => renderOrderListItem(order))}
                      </div>
                    )}
                  </div>
                )
              ) : null}

              {/* No orders in filter */}
              {filteredOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl shadow-sm" dir="rtl">
                  <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center mb-3 border border-slate-200">
                    <Package size={24} className="text-slate-300" />
                  </div>
                  <h3 className="text-base font-bold text-slate-700">لا توجد طلبات في هذا القسم</h3>
                  <p className="text-sm text-slate-400 mt-1">جرب فلتر آخر لعرض طلباتك</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
};

export default Orders;
