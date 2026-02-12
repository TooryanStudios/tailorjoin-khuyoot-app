import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Order, Tailor } from '../../types';
import { X, FileText, Ruler, ExternalLink, Eye, ArrowRight } from 'lucide-react';
import { TailorSelectionModal } from './TailorSelectionModal';
import { firebaseService } from '../../services/firebase';

interface OrderDetailsContextType {
  showOrderDetails: (order: Order) => void;
  showOrderDetailsById: (orderId: string) => Promise<void>;
  hideOrderDetails: () => void;
}

const OrderDetailsContext = createContext<OrderDetailsContextType | undefined>(undefined);

export const useOrderDetails = () => {
  const context = useContext(OrderDetailsContext);
  if (!context) {
    throw new Error('useOrderDetails must be used within OrderDetailsProvider');
  }
  return context;
};

interface OrderDetailsProviderProps {
  children: ReactNode;
  getOrderById?: (orderId: string) => Promise<Order | null>;
}

export const OrderDetailsProvider: React.FC<OrderDetailsProviderProps> = ({ children, getOrderById }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showTailorSelection, setShowTailorSelection] = useState(false);

  const showOrderDetails = (orderData: Order) => {
    setOrder(orderData);
    setShowTailorSelection(false);
    setIsOpen(true);
  };

  const showOrderDetailsById = async (orderId: string) => {
    if (getOrderById) {
      const orderData = await getOrderById(orderId);
      if (orderData) {
        showOrderDetails(orderData);
      }
    }
  };

  const hideOrderDetails = () => {
    setIsOpen(false);
    setShowTailorSelection(false);
    setTimeout(() => setOrder(null), 300); // Delay clearing to allow exit animation
  };

  const handleReassignToTailor = async (newTailor: Tailor) => {
    if (!order) return;
    try {
      // Update order with new tailor
      const orderRef = await firebaseService.updateOrder(order.id, {
        tailorId: newTailor.id,
        tailorName: newTailor.name,
        status: 'pending', // Reset to pending for new tailor
        acceptedByTailor: false,
        updatedAt: new Date().toISOString()
      });
      
      // Notify old tailor that order was reassigned
      // (optional: could send notification to both tailors)
      
      // Close modal and show success
      setShowTailorSelection(false);
      hideOrderDetails();
      
      // Show success message (could integrate with notification system)
      alert(`تم تعيين الطلب للخياط: ${newTailor.name}`);
    } catch (error) {
      console.error('Error reassigning order:', error);
      alert('حدث خطأ أثناء تعيين الطلب');
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
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

  return (
    <OrderDetailsContext.Provider value={{ showOrderDetails, showOrderDetailsById, hideOrderDetails }}>
      {children}
      
      {/* Order Details Modal */}
      {isOpen && order && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[10000]" 
          onClick={hideOrderDetails}
        >
          <div 
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-in zoom-in duration-300" 
            onClick={(e) => e.stopPropagation()} 
            dir="rtl"
          >
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 shrink-0">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#63498b]/10 flex items-center justify-center text-[#63498b]">
                     <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl text-slate-900">{showTailorSelection ? 'اختيار خياط بديل' : 'تفاصيل الطلب'}</h3>
                    <p className="text-sm text-slate-500">#{order.id.slice(-6).toUpperCase()}</p>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                 {showTailorSelection && (
                   <button
                     onClick={() => setShowTailorSelection(false)}
                     className="h-9 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center gap-2 text-slate-600 text-sm transition-colors"
                   >
                     <ArrowRight size={16} />
                     رجوع
                   </button>
                 )}
                 <button 
                   onClick={hideOrderDetails}
                   className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                   aria-label="إغلاق"
                 >
                   <X size={18} />
                 </button>
               </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-6 flex-1">
            {showTailorSelection ? (
              <TailorSelectionModal
                isOpen={showTailorSelection}
                order={order}
                onClose={() => setShowTailorSelection(false)}
                onTailorSelected={handleReassignToTailor}
                variant="inline"
                hideHeader
              />
            ) : (
            <>
            {/* Product Info */}
            <div className="mb-6 flex gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="w-24 h-28 bg-white rounded-lg border border-slate-200 overflow-hidden shrink-0">
                <img 
                  src={order.productImage} 
                  className="w-full h-full object-cover" 
                  alt={order.productName} 
                />
              </div>
              <div className="flex-1">
                <h4 className="text-base text-slate-900 mb-1">{order.productName}</h4>
                <div className="flex items-center gap-3 mt-3">
                  <div>
                    <p className="text-xs text-slate-500">السعر</p>
                    <p className="text-xl text-[#63498b]">{order.price?.toFixed(3)} ر.ع</p>
                  </div>
                  <div className="h-10 w-px bg-slate-200"></div>
                  <div>
                    <p className="text-xs text-slate-500">التاريخ</p>
                    <p className="text-sm text-slate-900">{new Date(order.orderDate).toLocaleDateString('ar-OM')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="mb-6">
              <h5 className="text-sm text-slate-600 mb-3">معلومات العميل</h5>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">الاسم</p>
                  <p className="text-sm text-slate-900">{order.customerName || 'غير محدد'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">الحالة</p>
                  <span className={`inline-block px-2.5 py-1 text-xs rounded-md ${
                    order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-purple-100 text-[#63498b]'
                  }`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Measurements */}
            {order.templatePoints && order.templatePoints.length > 0 && (
              <div className="mb-6">
                <h5 className="text-sm text-slate-600 mb-3 flex items-center gap-2">
                  <Ruler size={14} />
                  المقاسات
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {order.templatePoints.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg">
                       <span className="text-xs text-slate-600">{p.label || p.name}</span>
                       <span className="text-sm text-slate-900">{order.measurements?.[p.id] || '-'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Visual Map */}
            {order.templateUrl && (
              <div className="mb-6">
                <h5 className="text-sm text-slate-600 mb-3">خريطة المقاسات</h5>
                <div className="relative aspect-[3/4] bg-slate-50 rounded-lg overflow-hidden border border-slate-200 max-w-xs mx-auto">
                   <img src={order.templateUrl} className="w-full h-full object-contain opacity-40 grayscale" alt="" />
                   {order.templatePoints?.map((p: any, idx: number) => {
                       const val = order.measurements?.[p.id];
                       if (!val) return null;
                       return (
                         <div 
                          key={idx}
                          style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
                          className="absolute w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#63498b] shadow-lg border border-white"
                         ></div>
                       );
                   })}
                </div>
              </div>
            )}

            {/* Notes */}
            {(order.comments || order.customerNote) && (
               <div className="mb-6">
                  <h5 className="text-sm text-slate-600 mb-3">ملاحظات العميل</h5>
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <p className="text-sm text-slate-700">{order.comments || order.customerNote}</p>
                  </div>
               </div>
            )}

            {/* Rejection Reason */}
            {order.status === 'cancelled' && order.rejectionReason && (
               <div className="mb-6">
                  <h5 className="text-sm text-slate-600 mb-3">سبب الإلغاء</h5>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <p className="text-sm text-red-700">{order.rejectionReason}</p>
                  </div>
               </div>
            )}
            </>
            )}
            </div>

            {/* Footer Actions */}
            {!showTailorSelection && (
              <div className="flex gap-3 p-6 border-t border-slate-100 shrink-0">
              {order.status === 'cancelled' && (
                <button 
                  onClick={() => setShowTailorSelection(true)}
                  className="flex-1 h-11 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                >
                  <Eye size={16} />
                  البحث عن خياط آخر
                </button>
              )}
              <a 
                href={`/product/${order.productId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 h-11 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-slate-700 transition-colors"
              >
                <ExternalLink size={16} />
                عرض المنتج
              </a>
              <button 
                onClick={hideOrderDetails}
                className="flex-1 h-11 bg-[#63498b] text-white rounded-lg text-sm hover:bg-[#63498b]/90 transition-all"
              >
                إغلاق
              </button>
            </div>
            )}
          </div>
        </div>
      )}
    </OrderDetailsContext.Provider>
  );
};
