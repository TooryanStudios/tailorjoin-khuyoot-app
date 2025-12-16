
import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types';
import { Check, X, MessageCircle, AlertCircle, DollarSign, RefreshCw, Info } from 'lucide-react';
import { Button } from '../components/Button';
import { createNotification } from '../utils/notificationHelpers';
import { useApp } from '../context/AppContext';
import { 
  getTailorOrders, 
  acceptOrder as acceptOrderService, 
  rejectOrder as rejectOrderService,
  updateOrderProgress,
  sendNoteToCustomer
} from '../services/orderService';

export const TailorOrders = () => {
  const { user } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [noteModal, setNoteModal] = useState<{ orderId: string; show: boolean }>({ orderId: '', show: false });
  const [note, setNote] = useState('');
  const [sendingNote, setSendingNote] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      console.log('🔍 Loading orders for tailor ID:', user.id);
      console.log('👤 Current user role:', user.role);
      const tailorOrders = await getTailorOrders(user.id);
      console.log('📦 Found orders:', tailorOrders.length, tailorOrders);
      
      // تحذير: إذا كان المستخدم ليس خياطاً
      if (user.role !== 'tailor') {
        console.warn('⚠️ Current user is not a tailor! Role:', user.role);
      }
      
      setOrders(tailorOrders);
    } catch (error) {
      console.error('❌ Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setTimeout(() => setRefreshing(false), 500);
  };

  const updateStatus = async (id: string, newStatus: OrderStatus) => {
    try {
      await updateOrderProgress(id, newStatus);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      
      // إرسال إشعار للعميل عند تغيير الحالة
      const order = orders.find(o => o.id === id);
      if (order) {
        createNotification(
          order.userId,
          'order',
          'تحديث حالة طلبك',
          `تم تحديث حالة طلبك إلى: ${getStatusLabel(newStatus)}`,
          order.id
        );
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('فشل تحديث حالة الطلب');
    }
  };

  const handleNegotiation = async (id: string, accepted: boolean) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    try {
      if (accepted) {
        await updateOrderProgress(id, 'pending', `تم قبول السعر المقترح: ${order.requestedPrice} ر.ع`);
        setOrders(prev => prev.map(o => 
          o.id === id 
            ? { ...o, price: o.requestedPrice || o.price, negotiationStatus: 'accepted' }
            : o
        ));
        
        createNotification(
          order.userId,
          'order',
          'تم قبول سعرك المقترح',
          `وافق الخياط على السعر ${order.requestedPrice} ر.ع`,
          order.id
        );
      } else {
        await sendNoteToCustomer(id, 'عذراً، لا يمكننا قبول السعر المقترح', false);
        setOrders(prev => prev.map(o => 
          o.id === id 
            ? { ...o, negotiationStatus: 'rejected' }
            : o
        ));
        
        createNotification(
          order.userId,
          'order',
          'تم رفض السعر المقترح',
          'الخياط لا يمكنه قبول السعر المقترح',
          order.id
        );
      }
    } catch (error) {
      console.error('Error handling negotiation:', error);
      alert('فشل معالجة التفاوض');
    }
  };

  const acceptOrder = async (id: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    try {
      await acceptOrderService(id);
      await loadOrders();
      
      createNotification(
        order.userId,
        'order',
        'تم قبول طلبك',
        'قبل الخياط طلبك! سيبدأ العمل عليه قريباً.',
        order.id
      );
      
      alert('تم قبول الطلب بنجاح');
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('فشل قبول الطلب');
    }
  };

  const rejectOrder = async (id: string) => {
    const reason = prompt('يرجى إدخال سبب رفض الطلب:');
    if (!reason) return;

    const order = orders.find(o => o.id === id);
    if (!order) return;

    try {
      await rejectOrderService(id, reason);
      await loadOrders();
      
      createNotification(
        order.userId,
        'order',
        'تم رفض طلبك',
        `عذراً، تم رفض طلبك. السبب: ${reason}`,
        order.id
      );
      
      alert('تم رفض الطلب');
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('فشل رفض الطلب');
    }
  };

  const handleSendNote = async () => {
    if (!note.trim() || !noteModal.orderId) return;

    const order = orders.find(o => o.id === noteModal.orderId);
    if (!order) return;

    try {
      setSendingNote(true);
      await sendNoteToCustomer(noteModal.orderId, note, false);
      
      createNotification(
        order.userId,
        'order',
        'ملاحظة جديدة من الخياط',
        note.substring(0, 100),
        order.id
      );
      
      setNoteModal({ orderId: '', show: false });
      setNote('');
      alert('تم إرسال الملاحظة');
    } catch (error) {
      console.error('Error sending note:', error);
      alert('فشل إرسال الملاحظة');
    } finally {
      setSendingNote(false);
    }
  };

  const getStatusLabel = (status: OrderStatus): string => {
    const labels: Record<OrderStatus, string> = {
      pending: 'قيد الانتظار',
      measuring: 'أخذ المقاسات',
      cutting: 'قص',
      sewing: 'خياطة',
      ready: 'جاهز',
      delivered: 'تم التسليم',
      cancelled: 'ملغي',
      rejected: 'مرفوض'
    };
    return labels[status] || status;
  };

  if (!user || user.role !== 'tailor') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">غير مصرح</h2>
          <p className="text-gray-600">هذه الصفحة متاحة للخياطين فقط</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pb-24 pt-6 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">جاري تحميل الطلبات...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="pb-24 pt-6 px-4">
       <div className="max-w-3xl mx-auto">
         <div className="flex items-center justify-between mb-6">
           <h1 className="text-2xl font-bold text-slate-900 dark:text-white">الطلبات الواردة</h1>
           <button
             onClick={handleRefresh}
             disabled={refreshing}
             className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50"
           >
             <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
             <span className="text-sm">تحديث</span>
           </button>
         </div>
         
         {orders.length === 0 ? (
           <div className="text-center py-20">
             <div className="text-6xl mb-4">📭</div>
             <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
               لا توجد طلبات حالياً
             </h3>
             <p className="text-slate-500">
               ستظهر الطلبات الواردة هنا
             </p>
           </div>
         ) : (
           <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                 {/* Status Badge */}
                 <div className="absolute top-4 left-4">
                    <span className={`px-2 py-1 text-[10px] rounded-full font-bold ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status === 'pending' ? 'طلب جديد' : 
                       order.status === 'cancelled' ? 'ملغي' : 'قيد التنفيذ'}
                    </span>
                 </div>

                 <div className="flex gap-4 mb-4">
                    <img src={order.productImage} alt="Product" className="w-20 h-20 rounded-lg object-cover" />
                    <div className="flex-1">
                       <h3 className="font-bold text-slate-900 dark:text-white">{order.productName}</h3>
                       <p className="text-xs text-slate-500 mb-1">تاريخ الطلب: {order.orderDate}</p>
                       {order.orderNumber && (
                         <p className="text-xs text-blue-600 dark:text-blue-400 font-mono mb-1">#{order.orderNumber}</p>
                       )}
                       <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold">
                          <span>{order.price.toFixed(3)} ر.ع</span>
                          {order.negotiationStatus === 'accepted' && <span className="text-[10px] text-green-500 bg-green-500/10 px-1 rounded">(تم تخفيض السعر)</span>}
                       </div>
                    </div>
                 </div>

                 {/* Customer Info */}
                 {order.customerName && (
                   <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-lg p-3 mb-4">
                      <p className="text-xs font-bold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-1">
                        <MessageCircle size={12} />
                        معلومات العميل
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-600 dark:text-slate-400">الاسم:</span>
                          <span className="font-medium text-slate-900 dark:text-white">{order.customerName}</span>
                        </div>
                        
                        {/* Show contact details only after accepting the order */}
                        {order.acceptedByTailor ? (
                          <>
                            {order.customerPhone && (
                              <div className="flex items-center gap-2 text-xs">
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
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-slate-600 dark:text-slate-400">البريد:</span>
                                <a 
                                  href={`mailto:${order.customerEmail}`}
                                  className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  {order.customerEmail}
                                </a>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <Info size={12} />
                            <span>ستظهر تفاصيل الاتصال بعد قبول الطلب</span>
                          </div>
                        )}
                      </div>
                   </div>
                 )}

                 {/* Negotiation Section */}
                 {order.status === 'pending' && order.negotiationStatus === 'requested' && (
                   <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-3 mb-4">
                      <div className="flex items-start gap-2 mb-2">
                        <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">العميل يطلب تخفيض السعر</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">"{order.customerNote}"</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded-lg border border-amber-100 dark:border-amber-900/20">
                         <div className="flex items-center gap-2">
                           <span className="text-xs text-slate-500">السعر المقترح:</span>
                           <span className="font-bold text-amber-600 dark:text-amber-400">{order.requestedPrice?.toFixed(3)} ر.ع</span>
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => handleNegotiation(order.id, true)} className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"><Check size={14} /></button>
                            <button onClick={() => handleNegotiation(order.id, false)} className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200"><X size={14} /></button>
                         </div>
                      </div>
                   </div>
                 )}

                 {/* Actions */}
                 <div className="border-t border-slate-100 dark:border-slate-700 pt-4 flex gap-3">
                    {order.status === 'pending' ? (
                      <>
                        <Button onClick={() => acceptOrder(order.id)} className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md shadow-green-500/30 hover:shadow-lg hover:shadow-green-500/50 text-white h-10 transition-all">
                           قبول الطلب
                        </Button>
                        <Button onClick={() => rejectOrder(order.id)} variant="danger" className="flex-1 h-10">
                           رفض
                        </Button>
                      </>
                    ) : (
                      order.status !== 'cancelled' && (
                        <div className="flex-1">
                          <label className="text-xs text-slate-500 block mb-1">تحديث الحالة</label>
                          <select 
                            value={order.status} 
                            onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm"
                          >
                            <option value="measuring">أخذ المقاسات</option>
                            <option value="cutting">قص</option>
                            <option value="sewing">خياطة</option>
                            <option value="ready">جاهز</option>
                            <option value="delivered">تم التسليم</option>
                          </select>
                        </div>
                      )
                    )}
                    
                    {order.status !== 'cancelled' && (
                      <button 
                        onClick={() => setNoteModal({ orderId: order.id, show: true })}
                        className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <MessageCircle size={20} />
                      </button>
                    )}
                 </div>
              </div>
            ))}
           </div>
         )}
       </div>
      </div>

      {/* Note Modal */}
      {noteModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setNoteModal({ orderId: '', show: false })}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              إرسال ملاحظة للعميل
            </h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="اكتب ملاحظتك هنا..."
              className="w-full h-32 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-3 mt-4">
              <Button
                onClick={handleSendNote}
                disabled={!note.trim() || sendingNote}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700"
              >
                {sendingNote ? 'جاري الإرسال...' : 'إرسال'}
              </Button>
              <Button
                onClick={() => {
                  setNoteModal({ orderId: '', show: false });
                  setNote('');
                }}
                variant="outline"
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
