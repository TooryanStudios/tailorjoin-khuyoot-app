import React, { useState, useEffect, useLayoutEffect } from 'react';
import { Order, OrderStatus } from '../types';
import { 
  Check, 
  X, 
  MessageCircle, 
  AlertCircle, 
  DollarSign, 
  RefreshCw, 
  Info, 
  Eye,
  Ruler, 
  User as UserIcon, 
  FileText,
  Clock,
  ExternalLink,
  Target,
  Search,
  LayoutGrid,
  List,
  Filter,
  Calendar
} from 'lucide-react';
import { Button } from '../components/Button';
import { StableImage } from '../components/StableImage';
import { createNotification } from '../utils/notificationHelpers';
import { useApp } from '../context/AppContext';
import { useOrderDetails } from '../src/context/OrderDetailsContext';
import { 
  getTailorOrders, 
  acceptOrder as acceptOrderService, 
  rejectOrder as rejectOrderService,
  updateOrderProgress,
  sendNoteToCustomer
} from '../services/orderService';
import { MontHeader } from '../src/components/MontHeader';

interface CommunicationMessage {
  id: string;
  sender: 'tailor' | 'customer';
  message: string;
  timestamp: string;
  type: 'note' | 'clarification' | 'status' | 'acceptance' | 'rejection';
}

const MONT_HEADER_ID = 'khuyoot-mont-header';
const DEFAULT_HEADER_SPACER_HEIGHT = 72;

export const TailorOrders = () => {
  const { user, appSettings } = useApp();
  const { showOrderDetails } = useOrderDetails();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [noteModal, setNoteModal] = useState<{ orderId: string; show: boolean }>({ orderId: '', show: false });
  const [note, setNote] = useState('');
  const [sendingNote, setSendingNote] = useState(false);
  const [acceptConfirmModal, setAcceptConfirmModal] = useState<{ order: Order | null; show: boolean }>({ order: null, show: false });
  const [clarificationModal, setClarificationModal] = useState<{ orderId: string; show: boolean }>({ orderId: '', show: false });
  const [clarification, setClarification] = useState('');
  const [sendingClarification, setSendingClarification] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [chatHistoryModal, setChatHistoryModal] = useState<{ order: Order | null; show: boolean }>({ order: null, show: false });
  const [rejectModal, setRejectModal] = useState<{ orderId: string; show: boolean }>({ orderId: '', show: false });
  const [rejectReasons, setRejectReasons] = useState<string[]>([]);
  const [rejectCustomNote, setRejectCustomNote] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'completed' | 'cancelled'>('all');
  const [pendingStatusChanges, setPendingStatusChanges] = useState<Record<string, OrderStatus>>({});
  const [headerHeight, setHeaderHeight] = useState(DEFAULT_HEADER_SPACER_HEIGHT);
  
  const theme = {
    primary: '#63498b',
    accent: '#63498b',
    bg: '#ededed'
  };

  useEffect(() => {
    if (user?.id) {
      loadOrders();
    }
  }, [user]);

  useLayoutEffect(() => {
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
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, []);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setTimeout(() => setRefreshing(false), 500);
  };

  const filteredOrders = orders
    .filter(o => {
      // Apply status filter first
      if (statusFilter === 'pending') return o.status === 'pending';
      if (statusFilter === 'active') return !['pending', 'cancelled', 'delivered', 'rejected'].includes(o.status);
      if (statusFilter === 'completed') return o.status === 'delivered';
      if (statusFilter === 'cancelled') return ['cancelled', 'rejected'].includes(o.status);
      return true; // 'all' - show everything
    })
    .filter(o => 
      // Then apply search filter
      o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const stats = {
    pending: orders.filter(o => o.status === 'pending').length,
    active: orders.filter(o => !['pending', 'cancelled', 'delivered', 'rejected'].includes(o.status)).length,
    completed: orders.filter(o => o.status === 'delivered').length,
    totalActiveAmount: orders
      .filter(o => !['cancelled', 'rejected'].includes(o.status))
      .reduce((sum, o) => sum + (o.price || 0), 0)
  };

  const updateStatus = async (id: string, newStatus: OrderStatus) => {
    try {
      await updateOrderProgress(id, newStatus);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      
      // Remove from pending changes after successful update
      setPendingStatusChanges(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      
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
      alert('فشل تحديث حالة الطلب');
    }
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setPendingStatusChanges(prev => ({
      ...prev,
      [orderId]: newStatus
    }));
  };

  const confirmStatusChange = async (orderId: string) => {
    const newStatus = pendingStatusChanges[orderId];
    if (newStatus) {
      await updateStatus(orderId, newStatus);
    }
  };

  const cancelStatusChange = (orderId: string) => {
    setPendingStatusChanges(prev => {
      const updated = { ...prev };
      delete updated[orderId];
      return updated;
    });
  };

  const getCurrentStatus = (orderId: string, originalStatus: OrderStatus): OrderStatus => {
    return pendingStatusChanges[orderId] || originalStatus;
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
        await sendNoteToCustomer(id, 'عذرا لا يمكننا قبول السعر المقترح', false);
        setOrders(prev => prev.map(o => 
          o.id === id 
            ? { ...o, negotiationStatus: 'rejected' }
            : o
        ));
      }
    } catch (error) {
      alert('فشل معالجة التفاوض');
    }
  };

  const acceptOrder = async (id: string) => {
    try {
      await acceptOrderService(id);
      await loadOrders();
      setAcceptConfirmModal({ order: null, show: false });
      alert('تم قبول الطلب بنجاح');
    } catch (error) {
      alert('فشل قبول الطلب');
    }
  };

  const rejectOrder = async (id: string) => {
    setRejectModal({ orderId: id, show: true });
  };

  const toggleRejectReason = (reason: string) => {
    setRejectReasons(prev => 
      prev.includes(reason) 
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const handleRejectOrder = async () => {
    if (rejectReasons.length === 0 || !rejectModal.orderId) return;
    
    let fullReason = rejectReasons.join('، ');
    if (rejectCustomNote) {
      fullReason += ` - ${rejectCustomNote}`;
    }
    
    try {
      setIsRejecting(true);
      await rejectOrderService(rejectModal.orderId, fullReason);
      await loadOrders();
      setRejectModal({ orderId: '', show: false });
      setRejectReasons([]);
      setRejectCustomNote('');
      alert('تم رفض الطلب');
    } catch (error) {
      alert('فشل رفض الطلب');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleSendNote = async () => {
    if (!note.trim() || !noteModal.orderId) return;
    try {
      setSendingNote(true);
      await sendNoteToCustomer(noteModal.orderId, note, false);
      await loadOrders(); // Reload to update chat history
      setNoteModal({ orderId: '', show: false });
      setNote('');
      alert('تم إرسال الملاحظة');
    } catch (error) {
      alert('فشل إرسال الملاحظة');
    } finally {
      setSendingNote(false);
    }
  };

  const handleSendClarification = async () => {
    if (!clarification.trim() || !clarificationModal.orderId) return;
    try {
      setSendingClarification(true);
      await sendNoteToCustomer(
        clarificationModal.orderId, 
        `طلب توضيح من الخياط: ${clarification}`, 
        true
      );
      
      const order = orders.find(o => o.id === clarificationModal.orderId);
      if (order) {
        createNotification(
          order.userId,
          'order',
          'طلب توضيح من الخياط',
          `يطلب الخياط بعض التوضيحات حول طلبك`,
          order.id
        );
      }
      
      await loadOrders(); // Reload to update chat history
      setClarificationModal({ orderId: '', show: false });
      setClarification('');
      alert('تم إرسال طلب التوضيح للعميل');
    } catch (error) {
      alert('فشل إرسال طلب التوضيح');
    } finally {
      setSendingClarification(false);
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

  const getCommunicationHistory = (order: Order): CommunicationMessage[] => {
    const history: CommunicationMessage[] = [];
    
    // Initial order creation
    history.push({
      id: `order-${order.id}-created`,
      sender: 'customer',
      message: `تم إنشاء طلب جديد لمنتج: ${order.productName}`,
      timestamp: order.orderDate,
      type: 'note'
    });
    
    // Customer note
    if (order.customerNote) {
      history.push({
        id: `order-${order.id}-customer-note`,
        sender: 'customer',
        message: order.customerNote,
        timestamp: order.orderDate,
        type: 'note'
      });
    }
    
    // Order acceptance
    if (order.acceptedByTailor && order.acceptedAt) {
      history.push({
        id: `order-${order.id}-accepted`,
        sender: 'tailor',
        message: 'تم قبول الطلب وبدء العمل عليه',
        timestamp: order.acceptedAt,
        type: 'acceptance'
      });
    }
    
    // Order rejection
    if (order.status === 'rejected' && order.notes) {
      history.push({
        id: `order-${order.id}-rejected`,
        sender: 'tailor',
        message: order.notes,
        timestamp: new Date().toISOString(),
        type: 'rejection'
      });
    }
    
    // Parse comments for clarifications and notes
    if (order.comments) {
      // Check if it's a clarification request (starts with specific prefix)
      if (order.comments.includes('طلب توضيح من الخياط:')) {
        history.push({
          id: `order-${order.id}-clarification`,
          sender: 'tailor',
          message: order.comments.replace('طلب توضيح من الخياط: ', ''),
          timestamp: new Date().toISOString(),
          type: 'clarification'
        });
      } else {
        // Regular note from tailor
        history.push({
          id: `order-${order.id}-comments`,
          sender: 'tailor',
          message: order.comments,
          timestamp: new Date().toISOString(),
          type: 'note'
        });
      }
    }
    
    // Sort by timestamp
    return history.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  };

  if (!user || user.role !== 'tailor') {
    return (
      <div className="min-h-screen bg-[#ededed] flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl text-gray-800 mb-2">غير مصرح</h2>
          <p className="text-gray-600">هذه الصفحة متاحة للخياطين فقط</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#ededed] font-['Tajawal'] text-slate-900 selection:bg-[#63498b] selection:text-white flex flex-col">
      <MontHeader />
      <div
        aria-hidden="true"
        className="pointer-events-none"
        style={{ height: headerHeight }}
      />
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollPaddingTop: headerHeight }}
      >
      {/* --- HERO / BANNER SECTION --- */}
      <section className="px-4 md:px-8 py-3 max-w-[1400px] mx-auto">
        <div className="relative rounded-xl bg-[#63498b] p-6 md:p-8 overflow-hidden min-h-[140px] flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4" dir="rtl">
            <div className="space-y-1">
              <h1 className="text-xl md:text-2xl text-white leading-tight">الطلبات الواردة</h1>
              <p className="text-white/70 text-xs md:text-sm max-w-sm">إدارة طلبات التفصيل الخاصة بك بكفاءة ومتابعة التقدم مع العملاء.</p>
            </div>
            
            <div className="flex gap-3">
               <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/10 flex flex-col items-center justify-center min-w-[70px]">
                  <span className="text-xl text-white">{stats.pending}</span>
                  <span className="text-[9px] text-white/60">طلب جديد</span>
               </div>
               <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/10 flex flex-col items-center justify-center min-w-[70px]">
                  <span className="text-xl text-white">{stats.active}</span>
                  <span className="text-[9px] text-white/60">قيد التنفيذ</span>
               </div>
               <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/10 flex flex-col items-center justify-center min-w-[90px]">
                  <span className="text-xl text-white">{stats.totalActiveAmount.toFixed(3)}</span>
                  <span className="text-[9px] text-white/60">إجمالي المبلغ</span>
               </div>
               <button 
                onClick={handleRefresh}
                title="تحديث البيانات"
                className="px-3 py-3 bg-white/10 backdrop-blur-md rounded-lg border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
               >
                 <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
               </button>
            </div>
          </div>
        </div>
      </section>

      {/* --- CONTENT SECTION --- */}
      <main className="px-4 md:px-8 py-4 max-w-[1400px] mx-auto pb-8">
        {/* Search and Filters Bar */}
        <div className="flex flex-col md:flex-row gap-3 mb-6" dir="rtl">
           <div className="relative flex-1">
              <input 
                type="text"
                placeholder="ابحث برقم الطلب أو اسم العميل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 bg-white rounded-lg border border-gray-200 px-4 pr-10 text-sm shadow-sm focus:ring-2 focus:ring-[#63498b] focus:border-transparent transition-all"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
           </div>
           <div className="flex gap-2">
              <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-[#63498b] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  title="عرض قائمة"
                >
                  <List size={16} />
                </button>
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-[#63498b] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  title="عرض شبكة"
                >
                  <LayoutGrid size={16} />
                </button>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="h-11 px-4 bg-white rounded-lg text-sm border border-gray-200 focus:ring-2 focus:ring-[#63498b] focus:border-transparent transition-all"
              >
                <option value="all">جميع الطلبات</option>
                <option value="pending">قيد الانتظار</option>
                <option value="active">نشطة</option>
                <option value="completed">مكتملة</option>
                <option value="cancelled">ملغاة / مرفوضة</option>
              </select>
              <button className="h-11 px-5 bg-white rounded-lg text-sm flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-colors border border-gray-200">
                <Calendar size={14} />
                التاريخ
              </button>
           </div>
        </div>

        {loading && !refreshing ? (
          <div className="flex flex-col items-center justify-center py-20 grayscale opacity-20">
             <div className="w-12 h-12 border-4 border-[#63498b] border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-xs uppercase tracking-widest">جاري التحميل...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center" dir="rtl">
             <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center mb-4 shadow-sm border border-gray-100">
               <LayoutGrid size={32} className="text-slate-300" />
             </div>
             <h3 className="text-lg text-slate-500">لا توجد طلبات لعرضها</h3>
             <p className="text-sm text-slate-400 mt-1">حاول تغيير كلمة البحث أو انتظر طلبات جديدة</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'} dir="rtl">
            {filteredOrders.map((order) => {
              const isActive = !['pending', 'cancelled', 'delivered', 'rejected'].includes(order.status);
              return (
              <div 
                key={order.id} 
                className={`bg-white rounded-lg p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all group overflow-hidden flex flex-col ${
                  isActive ? 'border-l-4 border-l-green-500' : ''
                }`}
              >
                {/* Order Header */}
                <div className="flex items-start justify-between mb-4">
                   <div className="flex gap-4">
                      <div className="w-20 h-24 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden shrink-0">
                        <img 
                          src={order.productImage} 
                          className="w-full h-full object-cover" 
                          alt={order.productName} 
                        />
                      </div>
                      <div className="min-w-0">
                         <h4 className="text-sm text-slate-900 line-clamp-1">{order.productName}</h4>
                         <p className="text-base text-[#63498b] mt-0.5">#{order.id.slice(-6).toUpperCase()}</p>
                         <div className="mt-2 flex flex-col gap-1.5">
                            <span className={`px-2.5 py-1 text-xs rounded-md inline-block w-fit ${
                              order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-purple-100 text-[#63498b]'
                            }`}>
                              {getStatusLabel(order.status)}
                            </span>
                            {order.status === 'cancelled' && order.rejectionReason && (
                              <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                                السبب: {order.rejectionReason}
                              </p>
                            )}
                         </div>
                      </div>
                   </div>
                   <div className="flex flex-col items-end gap-1">
                      <span className="text-lg text-slate-900">{order.price?.toFixed(3)} ر.ع</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(order.orderDate).toLocaleDateString('ar-OM', { day: 'numeric', month: 'short' })}
                      </span>
                   </div>
                </div>

                <div className="h-px bg-slate-100 w-full mb-4"></div>

                {/* Customer Info */}
                <div className="mb-4">
                   <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                         <UserIcon size={12} />
                      </div>
                      <div className="min-w-0">
                         <p className="text-xs text-slate-400 leading-none">العميل</p>
                         <p className="text-sm text-slate-900 truncate">{order.customerName || 'عميل مجهول'}</p>
                      </div>
                   </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 flex gap-2">
                   {order.status === 'pending' ? (
                     <>
                       <button 
                         onClick={() => showOrderDetails(order)}
                         className="flex-1 h-10 bg-white text-[#63498b] rounded-lg text-sm hover:bg-slate-50 transition-all border border-[#63498b] flex items-center justify-center gap-2"
                       >
                          <Eye size={16} />
                          عرض التفاصيل
                       </button>
                       <button 
                         onClick={() => setAcceptConfirmModal({ order, show: true })}
                         className="flex-1 h-10 bg-[#63498b] text-white rounded-lg text-sm hover:bg-[#63498b]/90 transition-all flex items-center justify-center gap-2"
                       >
                          <Check size={16} />
                          قبول
                       </button>
                       <button 
                         onClick={() => setChatHistoryModal({ order, show: true })}
                         title="سجل المحادثة"
                         className="w-10 h-10 bg-white text-[#63498b] rounded-lg flex items-center justify-center hover:bg-slate-50 transition-colors border border-[#63498b]"
                       >
                          <MessageCircle size={16} />
                       </button>
                       <button 
                         onClick={() => setChatHistoryModal({ order, show: true })}
                         className="w-10 h-10 bg-white text-[#63498b] rounded-lg flex items-center justify-center hover:bg-slate-50 transition-colors border border-[#63498b]"
                         title="سجل المحادثة"
                       >
                          <MessageCircle size={16} />
                       </button>
                       <button 
                         onClick={() => rejectOrder(order.id)}
                         className="w-10 h-10 bg-white text-red-500 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors border border-red-300"
                       >
                          <X size={16} />
                       </button>
                     </>
                   ) : order.status === 'cancelled' || order.status === 'rejected' ? (
                     <div className="flex-1 flex gap-2">
                       <button 
                         onClick={() => showOrderDetails(order)}
                         className="flex-1 h-10 bg-white text-[#63498b] rounded-lg text-sm hover:bg-slate-50 transition-all border border-[#63498b] flex items-center justify-center gap-2"
                       >
                          <Eye size={16} />
                          التفاصيل
                       </button>
                       <button 
                         onClick={() => setChatHistoryModal({ order, show: true })}
                         className="w-10 h-10 bg-white text-[#63498b] border border-[#63498b] rounded-lg flex items-center justify-center hover:bg-slate-50 transition-colors"
                         title="سجل المحادثة"
                       >
                         <MessageCircle size={16} />
                       </button>
                     </div>
                   ) : (
                     order.status !== 'cancelled' && order.status !== 'rejected' && (
                       <div className="flex-1 flex flex-col gap-2">
                          {/* Status Tabs */}
                          <div className="flex gap-1 bg-slate-50 p-1 rounded-lg">
                            {[
                              { value: 'measuring', label: 'قياس', icon: '📏' },
                              { value: 'cutting', label: 'قص', icon: '✂️' },
                              { value: 'sewing', label: 'خياطة', icon: '🧵' },
                              { value: 'ready', label: 'جاهز', icon: '✅' },
                              { value: 'delivered', label: 'مسلّم', icon: '📦' }
                            ].map((status) => {
                              const currentStatus = getCurrentStatus(order.id, order.status);
                              const isActive = currentStatus === status.value;
                              return (
                                <button
                                  key={status.value}
                                  onClick={() => handleStatusChange(order.id, status.value as OrderStatus)}
                                  className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                                    isActive
                                      ? 'bg-[#63498b] text-white shadow-sm'
                                      : 'text-slate-600 hover:bg-white hover:text-[#63498b]'
                                  }`}
                                  title={status.label}
                                >
                                  <span className="hidden sm:inline">{status.icon} {status.label}</span>
                                  <span className="sm:hidden">{status.icon}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Action Buttons Row */}
                          <div className="flex gap-2">
                            <button 
                              onClick={() => showOrderDetails(order)}
                              className="h-9 px-3 bg-white text-[#63498b] rounded-lg text-xs hover:bg-slate-50 transition-all border border-[#63498b] flex items-center justify-center gap-1.5"
                            >
                               <Eye size={14} />
                               <span className="hidden sm:inline">التفاصيل</span>
                            </button>
                            
                            {pendingStatusChanges[order.id] && (
                              <>
                                <button 
                                  onClick={() => confirmStatusChange(order.id)}
                                  className="flex-1 h-9 bg-[#63498b] text-white rounded-lg text-xs hover:bg-[#63498b]/90 transition-all flex items-center justify-center gap-1.5 font-medium"
                                >
                                   <Check size={14} />
                                   تأكيد التحديث
                                </button>
                                <button 
                                  onClick={() => cancelStatusChange(order.id)}
                                  className="h-9 px-3 bg-slate-100 text-slate-600 rounded-lg text-xs hover:bg-slate-200 transition-all flex items-center justify-center"
                                  title="إلغاء"
                                >
                                   <X size={14} />
                                </button>
                              </>
                            )}
                            
                            {!pendingStatusChanges[order.id] && (
                              <>
                                <button 
                                  onClick={() => setClarificationModal({ orderId: order.id, show: true })}
                                  className="h-9 px-3 bg-white text-amber-600 border border-amber-600 rounded-lg flex items-center justify-center hover:bg-amber-50 transition-colors text-xs"
                                  title="طلب توضيح"
                                >
                                  <AlertCircle size={14} />
                                </button>
                                <button 
                                  onClick={() => setChatHistoryModal({ order, show: true })}
                                  className="h-9 px-3 bg-white text-[#63498b] rounded-lg flex items-center justify-center hover:bg-slate-50 transition-colors border border-[#63498b] text-xs"
                                  title="سجل المحادثة"
                                >
                                  <MessageCircle size={14} />
                                </button>
                                <button 
                                  onClick={() => setNoteModal({ orderId: order.id, show: true })}
                                  className="h-9 px-3 bg-white text-slate-500 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-slate-50 transition-colors text-xs"
                                  title="إرسال ملاحظة"
                                >
                                  <FileText size={14} />
                                </button>
                              </>
                            )}
                          </div>
                       </div>
                     )
                   )}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Accept Confirmation Modal */}
      {acceptConfirmModal.show && acceptConfirmModal.order && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]" onClick={() => setAcceptConfirmModal({ order: null, show: false })}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                  <Check size={20} />
               </div>
               <h3 className="text-lg text-slate-900">تأكيد قبول الطلب</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-slate-600 mb-4">هل أنت متأكد من قبول هذا الطلب؟</p>
              
              <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">رقم الطلب</span>
                  <span className="text-sm text-[#63498b] font-medium">#{acceptConfirmModal.order.id.slice(-6).toUpperCase()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">العميل</span>
                  <span className="text-sm text-slate-900">{acceptConfirmModal.order.customerName || 'غير محدد'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">المبلغ</span>
                  <span className="text-sm text-slate-900">{acceptConfirmModal.order.price?.toFixed(3)} ر.ع</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setAcceptConfirmModal({ order: null, show: false })}
                className="flex-1 h-11 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={() => acceptConfirmModal.order && acceptOrder(acceptConfirmModal.order.id)}
                className="flex-1 h-11 bg-[#63498b] text-white rounded-lg text-sm hover:bg-[#63498b]/90 transition-all flex items-center justify-center gap-2"
              >
                <Check size={16} />
                تأكيد القبول
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {noteModal.show && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]" onClick={() => setNoteModal({ orderId: '', show: false })}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-9 h-9 rounded-full bg-[#63498b]/10 flex items-center justify-center text-[#63498b]">
                  <MessageCircle size={18} />
               </div>
               <h3 className="text-lg text-slate-900">إرسال ملاحظة</h3>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="اكتب ملاحظتك للعميل هنا..."
              className="w-full h-32 px-4 py-3 border-2 border-slate-200 rounded-lg bg-white text-slate-900 text-sm resize-none focus:outline-none focus:border-[#63498b] transition-all"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSendNote}
                disabled={!note.trim() || sendingNote}
                className="flex-1 h-11 bg-[#63498b] text-white rounded-lg text-sm hover:bg-[#63498b]/90 disabled:opacity-50 transition-all"
              >
                {sendingNote ? 'جاري الإرسال...' : 'إرسال الملاحظة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat History Modal */}
      {chatHistoryModal.show && chatHistoryModal.order && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]" onClick={() => setChatHistoryModal({ order: null, show: false })}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()} dir="rtl">
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#63498b]/10 flex items-center justify-center text-[#63498b]">
                     <MessageCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl text-slate-900">سجل المحادثة</h3>
                    <p className="text-sm text-slate-500">#{chatHistoryModal.order.id.slice(-6).toUpperCase()}</p>
                  </div>
               </div>
               <button 
                 onClick={() => setChatHistoryModal({ order: null, show: false })}
                 className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
               >
                 <X size={18} />
               </button>
            </div>

            {/* Scrollable Chat History */}
            <div className="overflow-y-auto p-6 flex-1">
              <div className="space-y-4">
                {getCommunicationHistory(chatHistoryModal.order).map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex gap-3 ${
                      msg.sender === 'tailor' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      msg.sender === 'tailor' 
                        ? 'bg-[#63498b] text-white' 
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {msg.sender === 'tailor' ? (
                        <Ruler size={14} />
                      ) : (
                        <UserIcon size={14} />
                      )}
                    </div>
                    <div className={`flex-1 ${
                      msg.sender === 'tailor' ? 'text-right' : 'text-left'
                    }`}>
                      <div className={`inline-block max-w-[85%] rounded-lg px-4 py-2 ${
                        msg.sender === 'tailor'
                          ? msg.type === 'acceptance' ? 'bg-green-50 border border-green-200' :
                            msg.type === 'rejection' ? 'bg-red-50 border border-red-200' :
                            msg.type === 'clarification' ? 'bg-amber-50 border border-amber-200' :
                            'bg-purple-50 border border-purple-200'
                          : 'bg-slate-100 border border-slate-200'
                      }`}>
                        {msg.type === 'acceptance' && (
                          <div className="flex items-center gap-2 mb-1">
                            <Check size={14} className="text-green-600" />
                            <span className="text-xs text-green-600">تم القبول</span>
                          </div>
                        )}
                        {msg.type === 'rejection' && (
                          <div className="flex items-center gap-2 mb-1">
                            <X size={14} className="text-red-600" />
                            <span className="text-xs text-red-600">تم الرفض</span>
                          </div>
                        )}
                        {msg.type === 'clarification' && (
                          <div className="flex items-center gap-2 mb-1">
                            <AlertCircle size={14} className="text-amber-600" />
                            <span className="text-xs text-amber-600">طلب توضيح</span>
                          </div>
                        )}
                        <p className="text-sm text-slate-900">{msg.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(msg.timestamp).toLocaleString('ar-OM', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {getCommunicationHistory(chatHistoryModal.order).length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageCircle size={28} className="text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-400">لا توجد رسائل حتى الآن</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer with Close Button */}
            <div className="p-4 border-t border-slate-200">
              <button 
                onClick={() => setChatHistoryModal({ order: null, show: false })}
                className="w-full h-11 bg-[#63498b] text-white rounded-lg text-sm hover:bg-[#63498b]/90 transition-all font-medium"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModal.show && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]" onClick={() => setRejectModal({ orderId: '', show: false })}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center text-red-600">
                  <X size={18} />
               </div>
               <h3 className="text-lg text-slate-900">رفض الطلب</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">الرجاء اختيار سبب (أو أكثر) لرفض الطلب</p>
            
            {/* Predefined Reasons */}
            <div className="space-y-2 mb-4">
              {[
                'مشغول بطلبات أخرى حالياً',
                'المقاسات غير واضحة',
                'التصميم معقد جداً',
                'لا أملك القماش المطلوب',
                'الوقت المطلوب غير كافٍ',
                'خارج نطاق تخصصي',
                'سبب آخر'
              ].map((reason) => (
                <label 
                  key={reason}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    rejectReasons.includes(reason) 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-slate-200 hover:border-red-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={rejectReasons.includes(reason)}
                    onChange={() => toggleRejectReason(reason)}
                    className="w-4 h-4 text-red-500 focus:ring-red-500 rounded"
                  />
                  <span className="text-sm text-slate-900">{reason}</span>
                </label>
              ))}
            </div>

            {/* Optional Custom Note */}
            <div className="mb-4">
              <label className="text-xs text-slate-600 mb-2 block">ملاحظات إضافية (اختياري)</label>
              <textarea
                value={rejectCustomNote}
                onChange={(e) => setRejectCustomNote(e.target.value)}
                placeholder="أضف أي تفاصيل إضافية..."
                className="w-full h-24 px-4 py-3 border-2 border-slate-200 rounded-lg bg-white text-slate-900 text-sm resize-none focus:outline-none focus:border-red-500 transition-all"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRejectModal({ orderId: '', show: false });
                  setRejectReasons([]);
                  setRejectCustomNote('');
                }}
                className="flex-1 h-11 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={handleRejectOrder}
                disabled={rejectReasons.length === 0 || isRejecting}
                className="flex-1 h-11 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isRejecting ? 'جاري الرفض...' : 'تأكيد الرفض'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clarification Request Modal */}
      {clarificationModal.show && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]" onClick={() => setClarificationModal({ orderId: '', show: false })}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <AlertCircle size={18} />
               </div>
               <h3 className="text-lg text-slate-900">طلب توضيح من العميل</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">اكتب سؤالك أو طلب التوضيح الذي تحتاجه من العميل</p>
            <textarea
              value={clarification}
              onChange={(e) => setClarification(e.target.value)}
              placeholder="مثال: هل تفضل أن يكون الطول أطول بمقدار 2 بوصة؟"
              className="w-full h-32 px-4 py-3 border-2 border-slate-200 rounded-lg bg-white text-slate-900 text-sm resize-none focus:outline-none focus:border-amber-500 transition-all"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setClarificationModal({ orderId: '', show: false })}
                className="flex-1 h-11 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={handleSendClarification}
                disabled={!clarification.trim() || sendingClarification}
                className="flex-1 h-11 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 disabled:opacity-50 transition-all"
              >
                {sendingClarification ? 'جاري الإرسال...' : 'إرسال الطلب'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accept Confirmation Modal */}
      {acceptConfirmModal.show && acceptConfirmModal.order && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]" onClick={() => setAcceptConfirmModal({ order: null, show: false })}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                  <Check size={20} />
               </div>
               <h3 className="text-lg text-slate-900">تأكيد قبول الطلب</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-slate-600 mb-4">هل أنت متأكد من قبول هذا الطلب؟</p>
              
              <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">رقم الطلب</span>
                  <span className="text-sm text-[#63498b] font-medium">#{acceptConfirmModal.order.id.slice(-6).toUpperCase()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">العميل</span>
                  <span className="text-sm text-slate-900">{acceptConfirmModal.order.customerName || 'غير محدد'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">المبلغ</span>
                  <span className="text-sm text-slate-900">{acceptConfirmModal.order.price?.toFixed(3)} ر.ع</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setAcceptConfirmModal({ order: null, show: false })}
                className="flex-1 h-11 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={() => acceptConfirmModal.order && acceptOrder(acceptConfirmModal.order.id)}
                className="flex-1 h-11 bg-[#63498b] text-white rounded-lg text-sm hover:bg-[#63498b]/90 transition-all flex items-center justify-center gap-2"
              >
                <Check size={16} />
                تأكيد القبول
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};