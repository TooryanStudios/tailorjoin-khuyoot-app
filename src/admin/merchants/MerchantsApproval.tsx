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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6 md:p-8 space-y-8">
      {/* Header with gradient */}
      <div className="space-y-3">
        <div className="flex items-end gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Store size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              موافقات التجار
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              مراجعة والموافقة على طلبات انضمام التجار والخياطين الجدد
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards with modern design */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="group relative bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-amber-200/30 dark:border-amber-800/30 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:border-amber-300/60 dark:hover:border-amber-700/60">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/5 rounded-full -mr-12 -mt-12"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <Clock size={24} className="text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-900/30 px-2 py-1 rounded-full">معلق</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1">قيد الانتظار</p>
            <p className="text-4xl font-black text-amber-700 dark:text-amber-300">{stats.pending}</p>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-green-200/30 dark:border-green-800/30 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:border-green-300/60 dark:hover:border-green-700/60">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-400/5 rounded-full -mr-12 -mt-12"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle2 size={24} className="text-green-600 dark:text-green-400" />
              <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-100/50 dark:bg-green-900/30 px-2 py-1 rounded-full">موافق</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1">موافق عليهم</p>
            <p className="text-4xl font-black text-green-700 dark:text-green-300">{stats.approved}</p>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-red-200/30 dark:border-red-800/30 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:border-red-300/60 dark:hover:border-red-700/60">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-400/5 rounded-full -mr-12 -mt-12"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <XCircle size={24} className="text-red-600 dark:text-red-400" />
              <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-100/50 dark:bg-red-900/30 px-2 py-1 rounded-full">مرفوض</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1">مرفوضين</p>
            <p className="text-4xl font-black text-red-700 dark:text-red-300">{stats.rejected}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs with modern styling */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-1.5 flex gap-1 w-fit">
        {[
          { value: 'all', label: 'الكل', count: merchants.length },
          { value: 'pending', label: 'قيد الانتظار', count: stats.pending },
          { value: 'approved', label: 'موافق عليهم', count: stats.approved },
          { value: 'rejected', label: 'مرفوضين', count: stats.rejected },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as any)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              filter === tab.value
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {tab.label}
            <span className={`ml-2 text-xs font-bold ${filter === tab.value ? 'opacity-100' : 'opacity-70'}`}>
              ({tab.count})
            </span>
          </button>
        ))}
      </div>

      {/* Merchants List with modern card design */}
      <div className="space-y-4">
        {filteredMerchants.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store size={32} className="text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">لا توجد طلبات في هذه الفئة</p>
          </div>
        ) : (
          filteredMerchants.map(merchant => (
            <div
              key={merchant.id}
              className="group bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 hover:shadow-2xl hover:border-slate-200 dark:hover:border-slate-600 transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                {/* Merchant Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20 group-hover:shadow-xl group-hover:shadow-blue-500/30 transition-all">
                      <Store size={28} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{merchant.name || 'بدون اسم'}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-full">
                          {getShopTypeLabel(merchant.shopType)}
                        </span>
                        {merchant.specialization && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold rounded-full">
                            {getSpecializationLabel(merchant.specialization)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {merchant.email && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Mail size={16} className="text-slate-400 dark:text-slate-500" />
                        <span className="truncate">{merchant.email}</span>
                      </div>
                    )}
                    {merchant.phone && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Phone size={16} className="text-slate-400 dark:text-slate-500" />
                        <span>{merchant.phone}</span>
                      </div>
                    )}
                    {merchant.location && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <MapPin size={16} className="text-slate-400 dark:text-slate-500" />
                        <span>{merchant.location}</span>
                      </div>
                    )}
                    {merchant.experience && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Briefcase size={16} className="text-slate-400 dark:text-slate-500" />
                        <span>الخبرة: {merchant.experience}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-700">
                    تاريخ التسجيل: {merchant.joinDate ? new Date(merchant.joinDate).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : 'غير متوفر'}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0">
                  {merchant.approvalStatus === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(merchant.id)}
                        className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm"
                      >
                        <CheckCircle2 size={18} />
                        <span>موافقة</span>
                      </button>
                      <button
                        onClick={() => handleReject(merchant.id)}
                        className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl font-semibold shadow-lg shadow-red-500/30 hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm"
                      >
                        <XCircle size={18} />
                        <span>رفض</span>
                      </button>
                    </div>
                  )}
                  {merchant.approvalStatus === 'approved' && (
                    <div className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-700 dark:text-green-400 rounded-xl text-sm font-semibold border border-green-200 dark:border-green-800">
                      <CheckCircle2 size={18} />
                      <span>موافق عليه</span>
                    </div>
                  )}
                  {merchant.approvalStatus === 'rejected' && (
                    <div className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 text-red-700 dark:text-red-400 rounded-xl text-sm font-semibold border border-red-200 dark:border-red-800">
                      <XCircle size={18} />
                      <span>مرفوض</span>
                    </div>
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
