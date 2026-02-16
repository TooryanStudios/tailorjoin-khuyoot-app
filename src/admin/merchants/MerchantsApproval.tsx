import React, { useState, useEffect } from 'react';
import { Store, CheckCircle2, XCircle, Clock, MapPin, Phone, Mail, Briefcase, Calendar, X, Eye } from 'lucide-react';
import { firebaseService } from '../../../services/firebase';
import { User, Product } from '../../../types';
import { getSpecializationLabel } from '../../../utils/specializationHelper';

export const MerchantsApproval = () => {
  const [merchants, setMerchants] = useState<User[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [selectedMerchant, setSelectedMerchant] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  
  // Dialog states
  const [approvalDialog, setApprovalDialog] = useState<{ isOpen: boolean; merchantId?: string; merchantName?: string }>({ isOpen: false });
  const [rejectionDialog, setRejectionDialog] = useState<{ isOpen: boolean; merchantId?: string; merchantName?: string; merchantEmail?: string; merchantPhone?: string }>({ isOpen: false });
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const REJECTION_REASONS = [
    { key: 'additional_info', label: 'نحتاج إلى معلومات إضافية' },
    { key: 'portfolio_development', label: 'نقترح تطوير محفظة الأعمال أولاً' },
    { key: 'experience_needed', label: 'نطلب خبرة أكثر في المجال' },
    { key: 'documentation_update', label: 'يرجى تحديث الوثائق المرفقة' },
    { key: 'verification_needed', label: 'نحتاج للتحقق من بعض التفاصيل' },
    { key: 'policy_compliance', label: 'الرجاء مراجعة شروط الخدمة والالتزام بها' },
  ];

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
    const merchant = merchants.find(m => m.id === merchantId);
    setApprovalDialog({ 
      isOpen: true, 
      merchantId, 
      merchantName: merchant?.name 
    });
  };

  const confirmApproval = async () => {
    if (!approvalDialog.merchantId) return;
    
    setProcessingId(approvalDialog.merchantId);
    try {
      // Update in Firebase
      await firebaseService.updateMerchantStatus(approvalDialog.merchantId, 'approved');
      
      setMerchants(prev => 
        prev.map(m => m.id === approvalDialog.merchantId ? { ...m, approvalStatus: 'approved' as const } : m)
      );
      
      setApprovalDialog({ isOpen: false });
    } catch (error) {
      console.error('Error approving merchant:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewProducts = async (merchant: User) => {
    setSelectedMerchant(merchant);
    setProductsLoading(true);
    try {
      const fetchedProducts = await firebaseService.getProductsByTailorId(merchant.id || merchant.uid || '');
      setProducts(fetchedProducts || []);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedMerchant(null);
    setProducts([]);
  };

  const handleReject = async (merchantId: string) => {
    const merchant = merchants.find(m => m.id === merchantId);
    setRejectionDialog({ 
      isOpen: true, 
      merchantId, 
      merchantName: merchant?.name,
      merchantEmail: merchant?.email || merchant?.loginId,
      merchantPhone: merchant?.phone || merchant?.contactNumber
    });
    setSelectedReasons([]);
    setCustomReason('');
  };

  const confirmRejection = async () => {
    if (!rejectionDialog.merchantId) return;
    if (selectedReasons.length === 0 && !customReason.trim()) {
      alert('يرجى اختيار سبب واحد على الأقل للرفض');
      return;
    }

    setProcessingId(rejectionDialog.merchantId);
    try {
      // Build rejection reason message
      const reasonLabels = selectedReasons
        .map(key => REJECTION_REASONS.find(r => r.key === key)?.label)
        .filter(Boolean);
      
      const fullReason = [
        ...reasonLabels,
        customReason.trim()
      ].filter(Boolean).join(' | ');

      // Update in Firebase
      await firebaseService.updateMerchantStatus(rejectionDialog.merchantId, 'rejected', fullReason);
      
      setMerchants(prev => 
        prev.map(m => m.id === rejectionDialog.merchantId ? { ...m, approvalStatus: 'rejected' as const } : m)
      );
      
      setRejectionDialog({ isOpen: false });
      setSelectedReasons([]);
      setCustomReason('');
    } catch (error) {
      console.error('Error rejecting merchant:', error);
    } finally {
      setProcessingId(null);
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
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-4 md:p-6 min-h-[85vh] font-['Tajawal'] bg-[#ededed] dark:bg-zinc-950">
      {/* Header with icon */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border-[1.5px] border-black/10 dark:border-white/10 shadow-sm p-6 space-y-2">
        <div className="flex items-end gap-3">
          <div className="w-12 h-12 rounded-2xl bg-theme-primary/10 flex items-center justify-center">
            <Store size={24} className="text-theme-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-normal text-zinc-900 dark:text-white tracking-tight">موافقات التجار</h2>
            <p className="text-xs text-zinc-500 font-normal uppercase tracking-widest mt-0.5">مراجعة والموافقة على طلبات الانضمام</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border-[1.5px] border-black/10 dark:border-white/10 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-normal uppercase tracking-widest">قيد الانتظار</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">{stats.pending}</p>
            </div>
            <Clock size={28} className="text-amber-600 dark:text-amber-400 opacity-50" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-3xl border-[1.5px] border-black/10 dark:border-white/10 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-normal uppercase tracking-widest">موافق عليهم</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.approved}</p>
            </div>
            <CheckCircle2 size={28} className="text-green-600 dark:text-green-400 opacity-50" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-3xl border-[1.5px] border-black/10 dark:border-white/10 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-normal uppercase tracking-widest">مرفوضين</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{stats.rejected}</p>
            </div>
            <XCircle size={28} className="text-red-600 dark:text-red-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border-[1.5px] border-black/10 dark:border-white/10 shadow-sm p-2 flex gap-1 w-fit">
        {[
          { value: 'all', label: 'الكل', count: merchants.length },
          { value: 'pending', label: 'قيد الانتظار', count: stats.pending },
          { value: 'approved', label: 'موافق عليهم', count: stats.approved },
          { value: 'rejected', label: 'مرفوضين', count: stats.rejected },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as any)}
            className={`px-4 py-2 rounded-2xl text-xs font-normal transition-all ${
              filter === tab.value
                ? 'bg-theme-primary text-white shadow-sm font-bold'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Merchants List */}
      <div className="space-y-3 pb-16">
        {filteredMerchants.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border-[1.5px] border-dashed border-black/10 dark:border-white/10 shadow-sm text-center py-16">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store size={32} className="text-zinc-400 dark:text-zinc-600" />
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 font-normal">لا توجد طلبات في هذه الفئة</p>
          </div>
        ) : (
          filteredMerchants.map(merchant => (
            <div
              key={merchant.id}
              className="bg-white dark:bg-zinc-900 border-[1.5px] border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Merchant Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-theme-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                      <Store size={24} className="text-theme-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{merchant.name || 'بدون اسم'}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="inline-flex px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold rounded-lg">
                          {getShopTypeLabel(merchant.shopType)}
                        </span>
                        {merchant.specialization && (
                          <span className="inline-flex px-2 py-1 bg-theme-primary/10 text-theme-primary text-xs font-bold rounded-lg">
                            {getSpecializationLabel(merchant.specialization)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {merchant.email && (
                      <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                        <Mail size={14} className="text-zinc-400 dark:text-zinc-500" />
                        <span className="truncate">{merchant.email}</span>
                      </div>
                    )}
                    {merchant.phone && (
                      <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                        <Phone size={14} className="text-zinc-400 dark:text-zinc-500" />
                        <span>{merchant.phone}</span>
                      </div>
                    )}
                    {merchant.location && (
                      <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                        <MapPin size={14} className="text-zinc-400 dark:text-zinc-500" />
                        <span>{merchant.location}</span>
                      </div>
                    )}
                    {merchant.experience && (
                      <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                        <Briefcase size={14} className="text-zinc-400 dark:text-zinc-500" />
                        <span>{merchant.experience}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-zinc-500 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    تاريخ التسجيل: {merchant.joinDate ? new Date(merchant.joinDate).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : 'غير متوفر'}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 space-y-2 lg:min-w-[180px]">
                  {/* View Products Button - Available for All */}
                  <button
                    onClick={() => handleViewProducts(merchant)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-theme-primary/20 hover:bg-theme-primary/30 text-theme-primary rounded-2xl font-semibold transition-all text-xs mb-2"
                  >
                    <Eye size={14} />
                    <span>عرض التفاصيل</span>
                  </button>

                  {/* Approval Actions - Only for Pending */}
                  {merchant.approvalStatus === 'pending' && (
                    <>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleApprove(merchant.id)}
                          className="flex-1 min-w-[110px] inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-semibold shadow-sm hover:shadow-md active:scale-95 transition-all text-xs"
                        >
                          <CheckCircle2 size={14} />
                          <span>موافقة</span>
                        </button>
                        <button
                          onClick={() => handleReject(merchant.id)}
                          className="flex-1 min-w-[110px] inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-semibold shadow-sm hover:shadow-md active:scale-95 transition-all text-xs"
                        >
                          <XCircle size={14} />
                          <span>رفض</span>
                        </button>
                      </div>
                    </>
                  )}

                  {/* Status Badges - For Approved/Rejected */}
                  {merchant.approvalStatus === 'approved' && (
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl text-xs font-bold border border-green-200 dark:border-green-800 w-full justify-center">
                      <CheckCircle2 size={14} />
                      <span>موافق عليه</span>
                    </div>
                  )}
                  {merchant.approvalStatus === 'rejected' && (
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-xs font-bold border border-red-200 dark:border-red-800 w-full justify-center">
                      <XCircle size={14} />
                      <span>مرفوض</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Products Modal */}
      {selectedMerchant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl w-full md:max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-[1.5px] border-black/10 dark:border-white/10 p-4 md:p-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                  {selectedMerchant.name || 'بدون اسم'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 tracking-widest uppercase">المنتجات والتفاصيل</p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-colors"
                aria-label="إغلاق"
              >
                <X size={20} className="text-zinc-600 dark:text-zinc-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 md:p-6 space-y-6">
              {/* Merchant Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest">التفاصيل الأساسية</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {selectedMerchant.email && (
                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                      <Mail size={14} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
                      <span className="truncate">{selectedMerchant.email}</span>
                    </div>
                  )}
                  {selectedMerchant.phone && (
                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                      <Phone size={14} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
                      <span>{selectedMerchant.phone}</span>
                    </div>
                  )}
                  {selectedMerchant.location && (
                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                      <MapPin size={14} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
                      <span>{selectedMerchant.location}</span>
                    </div>
                  )}
                  {selectedMerchant.experience && (
                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                      <Briefcase size={14} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
                      <span>{selectedMerchant.experience}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Products Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest">المنتجات ({products.length})</h4>
                  {productsLoading && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-theme-primary"></div>
                  )}
                </div>

                {products.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border-[1.5px] border-black/10 dark:border-white/10">
                    {productsLoading ? 'جاري التحميل...' : 'لم يتم العثور على منتجات'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {products.map(product => (
                      <div
                        key={product.id}
                        className="bg-white dark:bg-zinc-800 rounded-2xl p-4 border-[1.5px] border-black/10 dark:border-white/10 hover:border-theme-primary/30 dark:hover:border-theme-primary/30 transition-all"
                      >
                        <div className="flex gap-4">
                          {product.image && (
                            <div className="relative w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-2xl shrink-0 overflow-hidden">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-zinc-900 dark:text-white text-sm line-clamp-2">{product.name}</h5>
                            {product.category && (
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                {product.category}
                              </p>
                            )}
                            {product.price && (
                              <p className="text-sm font-bold text-theme-primary mt-2">
                                {product.price} ريال
                              </p>
                            )}
                            {product.description && (
                              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
                                {product.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-[1.5px] border-black/10 dark:border-white/10 p-4 md:p-6 flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-2xl font-semibold transition-colors text-xs"
              >
                إغلاق
              </button>
              {selectedMerchant.approvalStatus === 'pending' && (
                <button
                  onClick={() => {
                    handleApprove(selectedMerchant.id);
                    closeModal();
                  }}
                  className="flex-1 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-semibold transition-all text-xs"
                >
                  موافقة
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approval Confirmation Dialog */}
      {approvalDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">تأكيد الموافقة</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  هل تريد الموافقة على <span className="font-bold text-theme-primary">{approvalDialog.merchantName}</span>؟
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setApprovalDialog({ isOpen: false })}
                  disabled={processingId === approvalDialog.merchantId}
                  className="flex-1 min-w-[120px] px-4 py-3 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white rounded-2xl font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-all disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmApproval}
                  disabled={processingId === approvalDialog.merchantId}
                  className="flex-1 min-w-[120px] px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingId === approvalDialog.merchantId ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      جاري...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      موافقة
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reasons Dialog */}
      {rejectionDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white dark:bg-slate-800 p-6 border-b border-zinc-200 dark:border-zinc-700">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">أسباب الرفض</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                اختر سبب أو أكثر لرفض طلب {rejectionDialog.merchantName}
              </p>
            </div>

            <div className="p-4 space-y-3 max-h-[calc(90vh-180px)] overflow-y-auto">
              {/* Rejection Reasons List */}
              <div className="grid grid-cols-1 gap-2">
                {REJECTION_REASONS.map(reason => (
                  <label key={reason.key} className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-700/50 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedReasons.includes(reason.key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedReasons([...selectedReasons, reason.key]);
                        } else {
                          setSelectedReasons(selectedReasons.filter(r => r !== reason.key));
                        }
                      }}
                      className="w-4 h-4 rounded border-zinc-300 text-theme-primary focus:ring-theme-primary cursor-pointer shrink-0"
                    />
                    <span className="text-zinc-900 dark:text-white text-sm">{reason.label}</span>
                  </label>
                ))}
              </div>

              {/* Custom Reason Input */}
              <div>
                <label className="block text-xs font-bold text-zinc-900 dark:text-white mb-1">
                  سبب إضافي (اختياري)
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="أضف سبب إضافي..."
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-theme-primary/40 resize-none"
                  rows={2}
                />
              </div>

              {/* Contact Details */}
              {(rejectionDialog.merchantEmail || rejectionDialog.merchantPhone) && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2 space-y-1">
                  <p className="text-[10px] font-bold text-blue-900 dark:text-blue-300 uppercase">التواصل</p>
                  {rejectionDialog.merchantEmail && (
                    <div className="flex items-center gap-2 text-xs text-blue-800 dark:text-blue-200">
                      <Mail size={12} className="text-blue-600 dark:text-blue-400 shrink-0" />
                      <a href={`mailto:${rejectionDialog.merchantEmail}`} className="hover:underline truncate">
                        {rejectionDialog.merchantEmail}
                      </a>
                    </div>
                  )}
                  {rejectionDialog.merchantPhone && (
                    <div className="flex items-center gap-2 text-xs text-blue-800 dark:text-blue-200">
                      <Phone size={12} className="text-blue-600 dark:text-blue-400 shrink-0" />
                      <a href={`tel:${rejectionDialog.merchantPhone}`} className="hover:underline">
                        {rejectionDialog.merchantPhone}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                <button
                  onClick={() => setRejectionDialog({ isOpen: false })}
                  disabled={processingId === rejectionDialog.merchantId}
                  className="flex-1 min-w-[120px] px-4 py-3 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white rounded-2xl font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-all disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmRejection}
                  disabled={processingId === rejectionDialog.merchantId || (selectedReasons.length === 0 && !customReason.trim())}
                  className="flex-1 min-w-[120px] px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingId === rejectionDialog.merchantId ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      جاري...
                    </>
                  ) : (
                    <>
                      <XCircle size={16} />
                      تأكيد الرفض
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
