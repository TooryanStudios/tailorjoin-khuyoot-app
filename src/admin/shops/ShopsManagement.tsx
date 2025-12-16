import React, { useState } from 'react';
import { Shop } from '../../../types';
import { CheckCircle, XCircle, MessageCircle, Eye, Phone, Mail, MapPin, Calendar, Store, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/Button';
import { createNotification } from '../../../utils/notificationHelpers';

interface ShopsManagementProps {
  shops: Shop[];
  shopType: string; // Changed from ShopType to string
  title: string;
}

export const ShopsManagement: React.FC<ShopsManagementProps> = ({ shops, shopType, title }) => {
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const filteredShops = shops.filter(shop => {
    if (shop.shopType !== shopType) return false;
    if (filter === 'all') return true;
    return shop.approvalStatus === filter;
  });

  const pendingCount = shops.filter(s => s.shopType === shopType && s.approvalStatus === 'pending').length;
  const approvedCount = shops.filter(s => s.shopType === shopType && s.approvalStatus === 'approved').length;

  const handleApprove = (shop: Shop) => {
    // في التطبيق الحقيقي، سيتم تحديث Firestore
    // هنا نرسل إشعار فقط
    createNotification(
      shop.id,
      'info',
      'تمت الموافقة على محلك',
      `تم الموافقة على "${shop.name}" وأصبح مرئياً للعملاء الآن`
    );
    
    alert(`تمت الموافقة على: ${shop.name}`);
  };

  const handleReject = (shop: Shop) => {
    const reason = prompt('سبب الرفض (اختياري):');
    
    createNotification(
      shop.id,
      'info',
      'تم رفض محلك',
      reason || `لم تتم الموافقة على "${shop.name}" حالياً`
    );
    
    alert(`تم رفض: ${shop.name}`);
  };

  const handleRequestInfo = (shop: Shop) => {
    const message = prompt('ما هي المعلومات المطلوبة من صاحب المحل؟');
    
    if (message) {
      createNotification(
        shop.id,
        'info',
        'معلومات إضافية مطلوبة',
        message
      );
      
      alert('تم إرسال الطلب لصاحب المحل');
    }
  };

  const getStatusBadge = (status?: string) => {
    switch(status) {
      case 'approved':
        return <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full font-bold">موافق عليه</span>;
      case 'rejected':
        return <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-full font-bold">مرفوض</span>;
      case 'pending':
        return <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full font-bold animate-pulse">معلق</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{title}</h2>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-bold">
            معلق: {pendingCount}
          </span>
          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm font-bold">
            موافق: {approvedCount}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {status === 'all' ? 'الكل' : status === 'pending' ? 'معلق' : status === 'approved' ? 'موافق عليه' : 'مرفوض'}
          </button>
        ))}
      </div>

      {/* Shops List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredShops.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Store className="mx-auto mb-4 text-slate-400" size={48} />
            <p className="text-slate-500">لا توجد محلات في هذه الفئة</p>
          </div>
        ) : (
          filteredShops.map(shop => (
            <div key={shop.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="relative h-32 bg-gradient-to-br from-blue-500 to-purple-500">
                {shop.coverImage && (
                  <img src={shop.coverImage} alt={shop.name} className="w-full h-full object-cover" />
                )}
                <div className="absolute top-2 left-2">
                  {getStatusBadge(shop.approvalStatus)}
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <img 
                    src={shop.image} 
                    alt={shop.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-700"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 dark:text-white">{shop.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin size={12} />
                      <span>{shop.location}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
                  {shop.contactNumber && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} />
                      <span dir="ltr">{shop.contactNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span>انضم: {new Date(shop.createdAt).toLocaleDateString('ar')}</span>
                  </div>
                </div>

                {shop.approvalStatus === 'pending' ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(shop)}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md shadow-green-500/30 hover:shadow-lg hover:shadow-green-500/50 text-xs py-2 transition-all"
                    >
                      <CheckCircle size={14} />
                      موافقة
                    </Button>
                    <Button
                      onClick={() => handleReject(shop)}
                      className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-md shadow-red-500/30 hover:shadow-lg hover:shadow-red-500/50 text-xs py-2 transition-all"
                    >
                      <XCircle size={14} />
                      رفض
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      setSelectedShop(shop);
                      setShowDetailsModal(true);
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/50 text-xs py-2 transition-all"
                  >
                    <Eye size={14} />
                    عرض التفاصيل
                  </Button>
                )}

                <Button
                  onClick={() => handleRequestInfo(shop)}
                  className="w-full mt-2 bg-slate-600 hover:bg-slate-700 text-xs py-2"
                >
                  <MessageCircle size={14} />
                  طلب معلومات
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedShop && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{selectedShop.name}</h3>
              {getStatusBadge(selectedShop.approvalStatus)}
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <img 
                  src={selectedShop.image} 
                  alt={selectedShop.name}
                  className="w-24 h-24 rounded-xl object-cover"
                />
                <div className="flex-1 space-y-2 text-sm">
                  <p className="text-slate-600 dark:text-slate-400">
                    <span className="font-bold text-slate-800 dark:text-white">الموقع: </span>
                    {selectedShop.location} ({selectedShop.region})
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    <span className="font-bold text-slate-800 dark:text-white">التقييم: </span>
                    ⭐ {selectedShop.rating}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    <span className="font-bold text-slate-800 dark:text-white">المتابعون: </span>
                    {selectedShop.followers}
                  </p>
                </div>
              </div>

              {selectedShop.bio && (
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white mb-2">نبذة:</h4>
                  <p className="text-slate-600 dark:text-slate-400">{selectedShop.bio}</p>
                </div>
              )}

              {selectedShop.portfolio && selectedShop.portfolio.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white mb-2">معرض الأعمال:</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedShop.portfolio.map((img, idx) => (
                      <img key={idx} src={img} alt={`عمل ${idx + 1}`} className="rounded-lg h-24 w-full object-cover" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-2">
              <Button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 bg-slate-600 hover:bg-slate-700"
              >
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
