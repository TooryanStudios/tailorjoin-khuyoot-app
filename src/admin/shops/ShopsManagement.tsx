import React, { useState, useEffect } from 'react';
import { Shop } from '../../../types';
import { CheckCircle, XCircle, MessageCircle, Eye, Phone, Mail, MapPin, Calendar, Store, AlertCircle, Users, Edit2, Save, X as XIcon, Package } from 'lucide-react';
import { Button } from '../../../components/Button';
import { createNotification } from '../../../utils/notificationHelpers';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../services/firebase';

interface ShopsManagementProps {
  shops: Shop[];
  shopType: string; // Changed from ShopType to string
  title: string;
}

export const ShopsManagement: React.FC<ShopsManagementProps> = ({ shops: initialShops, shopType, title }) => {
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingShopId, setEditingShopId] = useState<string | null>(null);
  const [editSpecialization, setEditSpecialization] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null); // Track which shop was just saved
  const [tailorProducts, setTailorProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editProductName, setEditProductName] = useState('');
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([]);
  const [productSaveStatus, setProductSaveStatus] = useState<Record<string, 'success' | 'error' | null>>({});

  // Sync with parent when initialShops changes
  useEffect(() => {
    setShops(initialShops);
  }, [initialShops]);

  // Fetch product counts for all tailors
  useEffect(() => {
    const fetchProductCounts = async () => {
      try {
        const counts: Record<string, number> = {};
        
        // Products are in subcollections: users/{tailorId}/products
        // We need to query each tailor's products subcollection
        for (const shop of shops) {
          if (shop.id) {
            try {
              const productsRef = collection(db, `users/${shop.id}/products`);
              const productsSnapshot = await getDocs(productsRef);
              counts[shop.id] = productsSnapshot.size;
            } catch (error) {
              console.warn(`Could not fetch products for tailor ${shop.id}:`, error);
              counts[shop.id] = 0;
            }
          }
        }
        
        setProductCounts(counts);
      } catch (error) {
        console.error('Error fetching product counts:', error);
      }
    };

    if (shopType === 'tailor' && shops.length > 0) {
      fetchProductCounts();
    }
  }, [shopType, shops]);

  const filteredShops = shops.filter(shop => {
    // Filter by shop type (using both shopType and type fields for compatibility)
    const matchesType = shop.shopType === shopType || shop.type === shopType;
    if (!matchesType) return false;
    
    // Filter by approval status
    if (filter !== 'all' && shop.approvalStatus !== filter) return false;
    
    // Filter by gender (for tailors only)
    if (shopType === 'tailor' && genderFilter !== 'all') {
      // Check both tailorGender and specialization fields
      const tailorGender = shop.tailorGender;
      const specialization = shop.specialization;
      
      if (genderFilter === 'male') {
        return tailorGender === 'male' || specialization === 'male' || specialization?.includes('رجال');
      } else if (genderFilter === 'female') {
        return tailorGender === 'female' || specialization === 'female' || specialization?.includes('نسائ');
      }
    }
    
    return true;
  });

  const pendingCount = shops.filter(s => (s.shopType === shopType || s.type === shopType) && s.approvalStatus === 'pending').length;
  const approvedCount = shops.filter(s => (s.shopType === shopType || s.type === shopType) && s.approvalStatus === 'approved').length;
  const maleCount = shops.filter(s => {
    const matchesType = s.shopType === shopType || s.type === shopType;
    const tailorGender = s.tailorGender;
    const specialization = s.specialization;
    return matchesType && (tailorGender === 'male' || specialization === 'male' || specialization?.includes('رجال'));
  }).length;
  const femaleCount = shops.filter(s => {
    const matchesType = s.shopType === shopType || s.type === shopType;
    const tailorGender = s.tailorGender;
    const specialization = s.specialization;
    return matchesType && (tailorGender === 'female' || specialization === 'female' || specialization?.includes('نسائ'));
  }).length;

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

  const fetchTailorProducts = async (tailorId: string) => {
    setLoadingProducts(true);
    try {
      const productsRef = collection(db, `users/${tailorId}/products`);
      const snapshot = await getDocs(productsRef);
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTailorProducts(products);

      // Fetch available categories
      const categoriesRef = collection(db, 'productCategories');
      const categoriesSnapshot = await getDocs(categoriesRef);
      const cats = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().nameAr || doc.data().nameEn || doc.id
      }));
      setCategories(cats);
    } catch (error) {
      console.error('Error fetching products:', error);
      setTailorProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSaveProductCategory = async (productId: string, tailorId: string) => {
    try {
      // Optimistic UI update
      setTailorProducts(prev => prev.map(p => 
        p.id === productId 
          ? { ...p, name: editProductName, category: editCategory, categoryId: editCategoryId }
          : p
      ));
      
      setEditingProductId(null);
      setProductSaveStatus(prev => ({ ...prev, [productId]: 'success' }));
      
      // Clear success indicator after 3 seconds
      setTimeout(() => {
        setProductSaveStatus(prev => ({ ...prev, [productId]: null }));
      }, 3000);
      
      // Save to database in background
      const productRef = doc(db, `users/${tailorId}/products`, productId);
      await updateDoc(productRef, {
        name: editProductName,
        category: editCategory,
        categoryId: editCategoryId
      });
    } catch (error) {
      console.error('Error updating product:', error);
      // Revert optimistic update
      const originalProduct = tailorProducts.find(p => p.id === productId);
      if (originalProduct) {
        setTailorProducts(prev => prev.map(p => 
          p.id === productId ? originalProduct : p
        ));
      }
      setProductSaveStatus(prev => ({ ...prev, [productId]: 'error' }));
      
      // Clear error indicator after 5 seconds
      setTimeout(() => {
        setProductSaveStatus(prev => ({ ...prev, [productId]: null }));
      }, 5000);
    }
  };

  const handleViewDetails = (shop: Shop) => {
    setSelectedShop(shop);
    setShowDetailsModal(true);
    
    if (shop.id) {
      fetchTailorProducts(shop.id);
    }
  };

  const handleEditSpecialization = (shop: Shop) => {
    setEditingShopId(shop.id);
    // Determine current value - prioritize specialization
    const currentValue = shop.specialization || shop.tailorGender || '';
    setEditSpecialization(currentValue);
  };

  const handleCancelEdit = () => {
    setEditingShopId(null);
    setEditSpecialization('');
  };

  const handleSaveSpecialization = async (shopId: string) => {
    try {
      setSaving(true);
      
      // Map specialization to both fields (using singular 'male'/'female')
      let tailorGender: 'male' | 'female' | null = null;
      let specialization: string = editSpecialization;
      
      if (editSpecialization === 'male') {
        tailorGender = 'male';
        specialization = 'male';
      } else if (editSpecialization === 'female') {
        tailorGender = 'female';
        specialization = 'female';
      } else if (editSpecialization === 'kids') {
        tailorGender = null;
        specialization = 'kids';
      } else if (editSpecialization === 'general') {
        tailorGender = null;
        specialization = 'general';
      }
      
      // Optimistic UI update
      setShops(prevShops => 
        prevShops.map(s => 
          s.id === shopId 
            ? { ...s, tailorGender, specialization }
            : s
        )
      );
      
      // Close edit mode immediately
      setEditingShopId(null);
      setEditSpecialization('');
      
      // Save to database in background
      const shopRef = doc(db, 'users', shopId);
      await updateDoc(shopRef, {
        tailorGender: tailorGender,
        specialization: specialization
      });
      
      // Show success indicator
      setSaveSuccess(shopId);
      setTimeout(() => setSaveSuccess(null), 3000); // Clear after 3 seconds
      
    } catch (error) {
      console.error('❌ Error updating specialization:', error);
      
      // Revert optimistic update on error
      setShops(initialShops);
      
      // Show error toast
      setSaveSuccess(`error-${shopId}`);
      setTimeout(() => setSaveSuccess(null), 3000);
    } finally {
      setSaving(false);
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
          {shopType === 'tailor' && (
            <>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-bold">
                👔 رجالي: {maleCount}
              </span>
              <span className="px-3 py-1 bg-pink-500/20 text-pink-400 rounded-lg text-sm font-bold">
                👗 نسائي: {femaleCount}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap items-center">
        {/* Status Filters */}
        <div className="flex gap-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400 self-center">الحالة:</span>
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

        {/* Gender Filters (for tailors only) */}
        {shopType === 'tailor' && (
          <div className="flex gap-2 border-r border-slate-300 dark:border-slate-700 pr-4">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400 self-center">النوع:</span>
            {(['all', 'male', 'female'] as const).map(gender => (
              <button
                key={gender}
                onClick={() => setGenderFilter(gender)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  genderFilter === gender
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {gender === 'all' ? 'الكل' : gender === 'male' ? '👔 رجالي' : '👗 نسائي'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Shops List - Table View */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {filteredShops.length === 0 ? (
          <div className="text-center py-12">
            <Store className="mx-auto mb-4 text-slate-400" size={48} />
            <p className="text-slate-500">لا توجد محلات في هذه الفئة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" dir="rtl">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-3 py-2 text-right text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                    المحل
                  </th>
                  {shopType === 'tailor' && (
                    <>
                      <th className="px-3 py-2 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                        النوع
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                        التخصص (DB)
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                        <Package size={14} className="inline mr-1" />
                        المنتجات
                      </th>
                    </>
                  )}
                  <th className="px-3 py-2 text-right text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                    الموقع
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                    الهاتف
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                    ⭐
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                    الحالة
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredShops.map(shop => {
                  const tailorGender = shop.tailorGender;
                  const specialization = shop.specialization;
                  const isMale = tailorGender === 'male' || specialization === 'male' || specialization?.includes('رجال');
                  const isFemale = tailorGender === 'female' || specialization === 'female' || specialization?.includes('نسائ');
                  
                  return (
                    <tr key={shop.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <img 
                            src={shop.image} 
                            alt={shop.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                          <div className="min-w-0">
                            <div className="font-medium text-slate-800 dark:text-white text-sm truncate">{shop.name}</div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
                              DB: {shop.name || shop.shopName || '(no name)'}
                            </div>
                            <div className="text-[9px] text-blue-500 dark:text-blue-400 font-mono truncate">
                              ID: {shop.id}
                            </div>
                            {shop.username && (
                              <div className="text-xs text-slate-500 truncate">@{shop.username}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      {shopType === 'tailor' && (
                        <>
                          <td className="px-3 py-2 text-center">
                            {isMale ? (
                              <span className="inline-flex items-center px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold">
                                👔
                              </span>
                            ) : isFemale ? (
                              <span className="inline-flex items-center px-2 py-0.5 bg-pink-500/20 text-pink-400 rounded-full text-xs font-bold">
                                👗
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {editingShopId === shop.id ? (
                              <select
                                value={editSpecialization}
                                onChange={(e) => setEditSpecialization(e.target.value)}
                                className="w-full text-xs px-2 py-1 border-2 border-blue-500 dark:border-blue-400 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-medium"
                                aria-label="Specialization"
                              >
                                <option value="">-</option>
                                <option value="male">👔 male (رجالي)</option>
                                <option value="female">👗 female (نسائي)</option>
                                <option value="kids">👶 kids (أطفال)</option>
                                <option value="general">⚙️ general (عام)</option>
                              </select>
                            ) : (
                              <div className="text-xs flex items-center gap-2 justify-center">
                                <div>
                                  <div className="font-mono text-slate-600 dark:text-slate-400">
                                    tG: {tailorGender || '-'}
                                  </div>
                                  <div className="font-mono text-slate-500 dark:text-slate-500 text-[10px]">
                                    sp: {specialization || '-'}
                                  </div>
                                </div>
                                {saveSuccess === shop.id ? (
                                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-md animate-pulse">
                                    <CheckCircle size={14} />
                                    <span className="text-[10px] font-bold">تم الحفظ</span>
                                  </div>
                                ) : saveSuccess === `error-${shop.id}` ? (
                                  <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md">
                                    <XCircle size={14} />
                                    <span className="text-[10px] font-bold">فشل</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleEditSpecialization(shop)}
                                    className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                                    title="تعديل التخصص"
                                  >
                                    <Edit2 size={14} className="text-blue-500" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Package size={14} className="text-slate-400" />
                              <span className={`text-sm font-bold ${
                                (productCounts[shop.id] || 0) === 0 
                                  ? 'text-red-500 dark:text-red-400' 
                                  : 'text-green-600 dark:text-green-400'
                              }`}>
                                {productCounts[shop.id] || 0}
                              </span>
                            </div>
                          </td>
                        </>
                      )}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                          <MapPin size={12} />
                          <span className="truncate max-w-[120px]">{shop.location}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-xs text-slate-600 dark:text-slate-400 truncate" dir="ltr">
                          {shop.contactNumber || '-'}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="text-xs text-slate-600 dark:text-slate-400">{shop.rating || 0}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {getStatusBadge(shop.approvalStatus)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          {editingShopId === shop.id ? (
                            <>
                              <button
                                onClick={() => handleSaveSpecialization(shop.id)}
                                disabled={saving}
                                className="p-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
                                title="حفظ"
                              >
                                <Save size={14} />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                disabled={saving}
                                className="p-1 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors disabled:opacity-50"
                                title="إلغاء"
                              >
                                <XIcon size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              {shop.approvalStatus === 'pending' ? (
                                <>
                                  <button
                                    onClick={() => handleApprove(shop)}
                                    className="p-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                                    title="موافقة"
                                  >
                                    <CheckCircle size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleReject(shop)}
                                    className="p-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                                    title="رفض"
                                  >
                                    <XCircle size={14} />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleViewDetails(shop)}
                                  className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                  title="عرض"
                                >
                                  <Eye size={14} />
                                </button>
                              )}
                              <button
                                onClick={() => handleRequestInfo(shop)}
                                className="p-1 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors"
                                title="طلب"
                              >
                                <MessageCircle size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Database Diagnostic Modal */}
      {showDetailsModal && selectedShop && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="ltr">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white font-mono">
                  🔍 Database Diagnostic: {selectedShop.id}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Full database record for debugging purposes
                </p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Close"
                aria-label="Close dialog"
              >
                <XIcon size={24} className="text-slate-600 dark:text-slate-400" />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Quick Info Card */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                  <Users size={16} />
                  Quick Info
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-600 dark:text-slate-400 min-w-[80px]">Name:</span>
                    <span className="text-slate-800 dark:text-white">{selectedShop.name || selectedShop.shopName || '(no name)'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-600 dark:text-slate-400 min-w-[80px]">Email:</span>
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-800 dark:text-white font-mono text-xs">
                        {selectedShop.email || selectedShop.loginId || '(not in Firestore)'}
                      </span>
                      {!selectedShop.email && !selectedShop.loginId && (
                        <span className="text-orange-600 dark:text-orange-400 text-[10px]">
                          ⚠️ Email may be in Firebase Auth only - check Raw JSON below
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-600 dark:text-slate-400 min-w-[80px]">Phone:</span>
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-800 dark:text-white font-mono text-xs">
                        {selectedShop.contactNumber || selectedShop.phone || '(not in Firestore)'}
                      </span>
                      {!selectedShop.contactNumber && !selectedShop.phone && (
                        <span className="text-orange-600 dark:text-orange-400 text-[10px]">
                          ⚠️ Phone may be in Firebase Auth only - check Raw JSON below
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-600 dark:text-slate-400 min-w-[80px]">ID:</span>
                    <span className="text-blue-600 dark:text-blue-400 font-mono text-xs">{selectedShop.id}</span>
                  </div>
                </div>
              </div>

              {/* Raw JSON Display */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                  <Store size={16} />
                  Raw Database Object
                </h4>
                <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                  {JSON.stringify(selectedShop, null, 2)}
                </pre>
              </div>

              {/* Key Fields Table */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                  <AlertCircle size={16} />
                  Key Fields Analysis
                </h4>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-200 dark:bg-slate-800">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold">Field</th>
                        <th className="px-3 py-2 text-left font-bold">Value</th>
                        <th className="px-3 py-2 text-left font-bold">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {Object.entries(selectedShop).map(([key, value]) => {
                        // Skip image fields for diagnostic view
                        const isImage = key.toLowerCase().includes('image') || 
                                       key.toLowerCase().includes('photo') || 
                                       key.toLowerCase().includes('avatar') ||
                                       key === 'portfolio';
                        
                        return (
                          <tr key={key} className={isImage ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}>
                            <td className="px-3 py-2 font-mono font-bold text-blue-600 dark:text-blue-400">
                              {key}
                            </td>
                            <td className="px-3 py-2 font-mono break-all max-w-md">
                              {isImage ? (
                                <span className="text-orange-600 dark:text-orange-400 italic">
                                  [Image URL hidden] {Array.isArray(value) ? `(${value.length} items)` : ''}
                                </span>
                              ) : typeof value === 'object' && value !== null ? (
                                <span className="text-purple-600 dark:text-purple-400">
                                  {JSON.stringify(value)}
                                </span>
                              ) : (
                                <span className={
                                  value === null || value === undefined || value === '' 
                                    ? 'text-red-500 dark:text-red-400 italic' 
                                    : 'text-slate-800 dark:text-slate-200'
                                }>
                                  {String(value) || '(empty)'}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 font-mono text-slate-500 dark:text-slate-400">
                              {Array.isArray(value) ? 'array' : typeof value}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Products Section */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                  <Package size={16} />
                  Products ({tailorProducts.length})
                </h4>
                {loadingProducts ? (
                  <div className="text-sm text-slate-500">Loading products...</div>
                ) : tailorProducts.length === 0 ? (
                  <div className="text-sm text-slate-500">No products found</div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-200 dark:bg-slate-800">
                        <tr>
                          <th className="px-3 py-2 text-left font-bold">Name</th>
                          <th className="px-3 py-2 text-left font-bold">Category</th>
                          <th className="px-3 py-2 text-left font-bold">CategoryID</th>
                          <th className="px-3 py-2 text-center font-bold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {tailorProducts.map((product) => (
                          <tr key={product.id}>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                {editingProductId === product.id ? (
                                  <input
                                    type="text"
                                    value={editProductName}
                                    onChange={(e) => setEditProductName(e.target.value)}
                                    className="w-full px-2 py-1 text-xs border rounded dark:bg-slate-700 dark:border-slate-600"
                                    placeholder="Product name"
                                  />
                                ) : (
                                  <>
                                    <span className="font-medium text-slate-800 dark:text-white truncate max-w-xs">
                                      {product.name}
                                    </span>
                                    {productSaveStatus[product.id] === 'success' && (
                                      <CheckCircle size={14} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                                    )}
                                    {productSaveStatus[product.id] === 'error' && (
                                      <XCircle size={14} className="text-red-600 dark:text-red-400 flex-shrink-0" />
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              {editingProductId === product.id ? (
                                <div className="w-full px-2 py-1 text-xs border rounded bg-slate-100 dark:bg-slate-800 dark:border-slate-600 text-slate-600 dark:text-slate-400 italic">
                                  {editCategory || '(auto-filled from CategoryID)'}
                                </div>
                              ) : (
                                <span className={`font-mono ${!product.category ? 'text-red-500 italic' : 'text-orange-600 dark:text-orange-400'}`}>
                                  {product.category || '(empty)'}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {editingProductId === product.id ? (
                                <select
                                  value={editCategoryId}
                                  onChange={(e) => {
                                    const selectedCategoryId = e.target.value;
                                    setEditCategoryId(selectedCategoryId);
                                    
                                    // Auto-populate Category field based on CategoryID
                                    const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
                                    if (selectedCategory) {
                                      setEditCategory(selectedCategory.name);
                                    } else {
                                      setEditCategory('');
                                    }
                                  }}
                                  className="w-full px-2 py-1 text-xs border rounded dark:bg-slate-700 dark:border-slate-600"
                                >
                                  <option value="">-- Select --</option>
                                  {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className={`font-mono ${!product.categoryId ? 'text-red-500 italic' : 'text-purple-600 dark:text-purple-400'}`}>
                                  {product.categoryId || '(empty)'}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {editingProductId === product.id ? (
                                <div className="flex gap-1 justify-center">
                                  <button
                                    onClick={() => handleSaveProductCategory(product.id, selectedShop!.id)}
                                    className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingProductId(null);
                                      setEditProductName('');
                                      setEditCategory('');
                                      setEditCategoryId('');
                                    }}
                                    className="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingProductId(product.id);
                                    setEditProductName(product.name || '');
                                    setEditCategory(product.category || '');
                                    setEditCategoryId(product.categoryId || '');
                                  }}
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                                >
                                  Edit
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Database Path Info */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-2">
                  📍 Firestore Location
                </h4>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <code className="text-xs font-mono text-blue-800 dark:text-blue-300">
                    /users/{selectedShop.id || selectedShop.uid || '(no id)'}
                  </code>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-2 bg-slate-50 dark:bg-slate-900">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(selectedShop, null, 2));
                  alert('✅ Copied to clipboard!');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                📋 Copy JSON
              </button>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
