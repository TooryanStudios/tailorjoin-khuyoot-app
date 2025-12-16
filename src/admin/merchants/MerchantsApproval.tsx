import React, { useState, useEffect } from 'react';
import { Store, CheckCircle2, XCircle, Clock, MapPin, Phone, Mail, Briefcase, Calendar } from 'lucide-react';
import { firebaseService } from '../../../services/firebase';
import { User } from '../../../types';
import { getSpecializationLabel } from '../../../utils/specializationHelper';

export const MerchantsApproval = () => {
  const [merchants, setMerchants] = useState<User[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMerchants();
  }, []);

  const loadMerchants = async () => {
    setLoading(true);
    try {
      // Load all users and filter merchants
      const allUsers = await firebaseService.getAllUsers();
      const merchantUsers = allUsers.filter(u => 
        (u.role === 'tailor' || u.role === 'shop') && u.approvalStatus
      );
      
      setMerchants(merchantUsers);
    } catch (error) {
      console.error('Error loading merchants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (merchantId: string) => {
    if (!confirm('هل تريد الموافقة على هذا التاجر؟')) return;
    
    try {
      // Update in Firebase
      await firebaseService.updateMerchantStatus(merchantId, 'approved');
      
      setMerchants(prev => 
        prev.map(m => m.id === merchantId ? { ...m, approvalStatus: 'approved' as const } : m)
      );
      
      alert('تم الموافقة على التاجر بنجاح ✅');
    } catch (error) {
      console.error('Error approving merchant:', error);
      alert('حدث خطأ أثناء الموافقة');
    }
  };

  const handleReject = async (merchantId: string) => {
    const reason = prompt('سبب الرفض (اختياري):');
    if (reason === null) return; // User cancelled
    
    try {
      // Update in Firebase
      await firebaseService.updateMerchantStatus(merchantId, 'rejected', reason || undefined);
      
      setMerchants(prev => 
        prev.map(m => m.id === merchantId ? { ...m, approvalStatus: 'rejected' as const } : m)
      );
      
      alert('تم رفض التاجر');
    } catch (error) {
      console.error('Error rejecting merchant:', error);
      alert('حدث خطأ أثناء الرفض');
    }
  };

  const getShopTypeLabel = (type: string | undefined) => {
    if (!type) return 'غير محدد';
    
    const types: Record<string, string> = {
      tailor: 'خياط',
      boutique: 'بوتيك',
      fabric_store: 'محل أقمشة',
      sewing_supplies: 'مستلزمات خياطة'
    };
    return types[type] || type;
  };

  const filteredMerchants = merchants.filter(m => 
    filter === 'all' ? true : m.approvalStatus === filter
  );

  const stats = {
    pending: merchants.filter(m => m.approvalStatus === 'pending').length,
    approved: merchants.filter(m => m.approvalStatus === 'approved').length,
    rejected: merchants.filter(m => m.approvalStatus === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          موافقات التجار والخياطين
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          مراجعة والموافقة على طلبات انضمام التجار الجدد
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">قيد الانتظار</p>
              <p className="text-3xl font-bold text-amber-700 dark:text-amber-300 mt-1">{stats.pending}</p>
            </div>
            <Clock size={32} className="text-amber-500" />
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">موافق عليهم</p>
              <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-1">{stats.approved}</p>
            </div>
            <CheckCircle2 size={32} className="text-green-500" />
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">مرفوضين</p>
              <p className="text-3xl font-bold text-red-700 dark:text-red-300 mt-1">{stats.rejected}</p>
            </div>
            <XCircle size={32} className="text-red-500" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {[
          { value: 'all', label: 'الكل', count: merchants.length },
          { value: 'pending', label: 'قيد الانتظار', count: stats.pending },
          { value: 'approved', label: 'موافق عليهم', count: stats.approved },
          { value: 'rejected', label: 'مرفوضين', count: stats.rejected },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as any)}
            className={`px-4 py-2 font-medium text-sm transition-colors relative ${
              filter === tab.value
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.label} ({tab.count})
            {filter === tab.value && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
            )}
          </button>
        ))}
      </div>

      {/* Merchants List */}
      <div className="space-y-4">
        {filteredMerchants.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Store size={48} className="mx-auto mb-3 opacity-30" />
            <p>لا توجد طلبات في هذه الفئة</p>
          </div>
        ) : (
          filteredMerchants.map(merchant => (
            <div
              key={merchant.id}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                {/* Merchant Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0">
                      <Store size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{merchant.name || 'بدون اسم'}</h3>
                      <span className="inline-block px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded mt-1">
                        {getShopTypeLabel(merchant.shopType)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-slate-400" />
                      <span>{merchant.email}</span>
                    </div>
                    {merchant.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-slate-400" />
                        <span>{merchant.phone}</span>
                      </div>
                    )}
                    {merchant.location && (
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-slate-400" />
                        <span>{merchant.location}</span>
                      </div>
                    )}
                    {merchant.specialization && (
                      <div className="flex items-center gap-2">
                        <Briefcase size={16} className="text-slate-400" />
                        <span>{getSpecializationLabel(merchant.specialization)}</span>
                      </div>
                    )}
                    {merchant.experience && (
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-slate-400" />
                        <span>الخبرة: {merchant.experience}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-slate-400">
                    تاريخ التسجيل: {merchant.joinDate ? new Date(merchant.joinDate).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'غير متوفر'}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col gap-2">
                  {merchant.approvalStatus === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(merchant.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        <CheckCircle2 size={18} />
                        موافقة
                      </button>
                      <button
                        onClick={() => handleReject(merchant.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        <XCircle size={18} />
                        رفض
                      </button>
                    </>
                  )}
                  {merchant.approvalStatus === 'approved' && (
                    <span className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium">
                      <CheckCircle2 size={18} />
                      موافق عليه
                    </span>
                  )}
                  {merchant.approvalStatus === 'rejected' && (
                    <span className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium">
                      <XCircle size={18} />
                      مرفوض
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
