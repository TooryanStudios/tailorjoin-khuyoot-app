import React, { useState, useEffect } from 'react';
import { Save, Plus, Edit2, Trash2, Eye, EyeOff, Calendar, TrendingUp, MousePointer, DollarSign, MapPin, Users, X, Upload, BarChart3 } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { getAllShops } from '../../../services/mockService';
import { Shop } from '../../../types';
import { uploadSettingsImage } from '../../../services/storageService';

interface Advertisement {
  id: string;
  shopId: string;
  shopName: string;
  shopType: 'tailor' | 'boutique' | 'fabric_store' | 'other';
  adLocation: 'homepage_main' | 'homepage_sidebar' | 'search_results';
  image: string;
  title: string;
  description: string;
  buttonText: string;
  displayDuration: number; // بالثواني
  activePeriodDays: number; // عدد الأيام
  startDate: string;
  endDate: string;
  status: 'active' | 'paused' | 'scheduled' | 'expired';
  priority: 'high' | 'medium' | 'low';
  isPinned: boolean; // إعلان مثبت
  targetAudience: string[];
  targetRegion: string;
  views: number;
  clicks: number;
  budget: number;
  spent: number;
  createdAt: string;
}

// أبعاد الصور حسب موقع الإعلان
const AD_DIMENSIONS = {
  homepage_main: { width: 800, height: 400, ratio: '2:1', description: 'الإعلان الرئيسي في الصفحة الرئيسية' },
  homepage_sidebar: { width: 400, height: 600, ratio: '2:3', description: 'إعلان جانبي في الصفحة الرئيسية' },
  search_results: { width: 600, height: 300, ratio: '2:1', description: 'إعلان في نتائج البحث' },
};

export const AdsManagement: React.FC = () => {
  const { appSettings } = useApp();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState<Partial<Advertisement>>({
    shopId: '',
    shopName: '',
    shopType: 'tailor',
    adLocation: 'homepage_main',
    image: '',
    title: '',
    description: '',
    buttonText: 'تسوق الآن',
    displayDuration: 5,
    activePeriodDays: 7,
    status: 'active',
    priority: 'medium',
    isPinned: false,
    targetAudience: [],
    targetRegion: 'مسقط',
    views: 0,
    clicks: 0,
    budget: 0,
    spent: 0,
  });

  useEffect(() => {
    loadAds();
    loadShops();
  }, []);

  // فلترة المحلات حسب النوع
  useEffect(() => {
    if (!allShops.length) return;
    
    let filtered = allShops;
    
    console.log('🔍 Filter - shopType:', formData.shopType);
    console.log('🔍 Filter - Total shops before filter:', allShops.length);
    
    // فلترة حسب النوع
    if (formData.shopType) {
      filtered = filtered.filter(shop => {
        if (formData.shopType === 'tailor') return shop.type === 'tailor';
        if (formData.shopType === 'boutique') return shop.type === 'boutique';
        if (formData.shopType === 'fabric_store') return shop.type === 'fabric_store';
        return shop.type === 'other';
      });
    }
    
    console.log('🔍 Filter - Filtered shops:', filtered.length);
    console.log('🔍 Filter - Filtered shops details:', filtered.map(s => ({ name: s.name, type: s.type })));
    
    setFilteredShops(filtered);
  }, [formData.shopType, allShops]);

  const loadShops = async () => {
    try {
      const shops = await getAllShops();
      console.log('🔍 Total shops loaded:', shops.length);
      console.log('🔍 Shops data:', shops);
      console.log('🔍 Shop types:', shops.map(s => ({ name: s.name, type: s.type })));
      setAllShops(shops);
      setFilteredShops(shops);
    } catch (error) {
      console.error('Error loading shops:', error);
    }
  };

  const loadAds = async () => {
    try {
      const adsCollection = collection(db, 'advertisements');
      const adsSnapshot = await getDocs(adsCollection);
      const adsList = adsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Advertisement[];
      setAds(adsList);
    } catch (error) {
      console.error('Error loading ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAd = async () => {
    try {
      // التحقق من البيانات المطلوبة
      if (!formData.shopId || !formData.shopName || !formData.image || !formData.title) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
      }

      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + formData.activePeriodDays! * 24 * 60 * 60 * 1000).toISOString();
      
      const adData = {
        ...formData,
        startDate,
        endDate,
        createdAt: editingAd?.createdAt || new Date().toISOString(),
      };

      if (editingAd) {
        const adRef = doc(db, 'advertisements', editingAd.id);
        await updateDoc(adRef, adData);
      } else {
        await addDoc(collection(db, 'advertisements'), adData);
      }

      await loadAds();
      setShowForm(false);
      setEditingAd(null);
      resetForm();
    } catch (error) {
      console.error('Error saving ad:', error);
      alert('حدث خطأ أثناء حفظ الإعلان');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const location = formData.adLocation || 'homepage_main';
      const result = await uploadSettingsImage(file, `ads/${location}`);
      setFormData({ ...formData, image: result.full });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleShopSelect = (shop: Shop) => {
    setFormData({
      ...formData,
      shopId: shop.id,
      shopName: shop.name,
    });
  };

  const handleDeleteAd = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الإعلان؟')) {
      try {
        await deleteDoc(doc(db, 'advertisements', id));
        await loadAds();
      } catch (error) {
        console.error('Error deleting ad:', error);
      }
    }
  };

  const toggleAdStatus = async (ad: Advertisement) => {
    try {
      const newStatus = ad.status === 'active' ? 'paused' : 'active';
      const adRef = doc(db, 'advertisements', ad.id);
      await updateDoc(adRef, { status: newStatus });
      await loadAds();
    } catch (error) {
      console.error('Error toggling ad status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      shopId: '',
      shopName: '',
      shopType: 'tailor',
      adLocation: 'homepage_main',
      image: '',
      title: '',
      description: '',
      buttonText: 'تسوق الآن',
      displayDuration: 5,
      activePeriodDays: 7,
      status: 'active',
      priority: 'medium',
      isPinned: false,
      targetAudience: [],
      targetRegion: 'مسقط',
      views: 0,
      clicks: 0,
      budget: 0,
      spent: 0,
    });
  };

  const getCTR = (views: number, clicks: number) => {
    if (views === 0) return 0;
    return ((clicks / views) * 100).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">إدارة الإعلانات</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            إدارة وتتبع الإعلانات في التطبيق
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowReports(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-md"
          >
            <BarChart3 size={20} />
            تقارير الإعلانات
          </button>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingAd(null);
              resetForm();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md"
          >
            <Plus size={20} />
            إضافة إعلان جديد
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">إجمالي الإعلانات</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{ads.length}</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">الإعلانات النشطة</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {ads.filter(ad => ad.status === 'active').length}
              </p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Eye className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">إجمالي المشاهدات</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {ads.reduce((sum, ad) => sum + ad.views, 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Users className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">إجمالي النقرات</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {ads.reduce((sum, ad) => sum + ad.clicks, 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <MousePointer className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Ads List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400">الإعلان</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400">المحل</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400">الحالة</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400">الأولوية</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400">المشاهدات</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400">النقرات</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400">CTR</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400">الفترة</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {ads.map((ad) => (
                <tr key={ad.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={ad.image || 'https://via.placeholder.com/60'}
                        alt={ad.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white text-sm">{ad.title}</p>
                        <p className="text-xs text-slate-500">{ad.description.substring(0, 40)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-slate-800 dark:text-white">{ad.shopName}</p>
                    <p className="text-xs text-slate-500">{ad.shopType}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      ad.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      ad.status === 'paused' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      ad.status === 'expired' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {ad.status === 'active' ? 'نشط' : 
                       ad.status === 'paused' ? 'متوقف' :
                       ad.status === 'expired' ? 'منتهي' : 'مجدول'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      ad.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      ad.priority === 'medium' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>
                      {ad.priority === 'high' ? 'عالي' : ad.priority === 'medium' ? 'متوسط' : 'منخفض'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-800 dark:text-white">{ad.views.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-slate-800 dark:text-white">{ad.clicks.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-slate-800 dark:text-white">{getCTR(ad.views, ad.clicks)}%</td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                    {ad.activePeriodDays} أيام
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleAdStatus(ad)}
                        className={`p-2 rounded-lg transition-colors ${
                          ad.status === 'active'
                            ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                        }`}
                        title={ad.status === 'active' ? 'إيقاف' : 'تفعيل'}
                      >
                        {ad.status === 'active' ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingAd(ad);
                          setFormData(ad);
                          setShowForm(true);
                        }}
                        className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors dark:bg-blue-900/30 dark:text-blue-400"
                        title="تعديل"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteAd(ad.id)}
                        className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors dark:bg-red-900/30 dark:text-red-400"
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[95vh]">
            {/* Fixed Header with Action Buttons */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800 z-10">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {editingAd ? 'تعديل الإعلان' : 'إضافة إعلان جديد'}
              </h3>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingAd(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300 font-medium"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveAd}
                  disabled={!formData.shopId || !formData.image || !formData.title}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <Save size={18} />
                  {editingAd ? 'حفظ التعديلات' : 'إضافة الإعلان'}
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* تنبيه مهم */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  ⚠️ <strong>ملاحظة:</strong> في حال وجود أكثر من إعلان نشط، سيتم عرضها بشكل عشوائي حالياً. 
                  سيتم تخصيص آلية العرض الذكي (حسب المنطقة، التقييم، النشاط) في التحديثات المستقبلية.
                  <br />
                  💡 استخدم خاصية "إعلان مثبت" لضمان ظهور إعلان معين دائماً.
                </p>
              </div>

              {/* Shop Type Selection - First */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  نوع المحل <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.shopType}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      shopType: e.target.value as any,
                      shopId: '', // إعادة تعيين المحل المختار
                      shopName: ''
                    });
                  }}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-base"
                >
                  <option value="tailor">محل خياطة</option>
                  <option value="boutique">بوتيك</option>
                  <option value="fabric_store">محل أقمشة</option>
                  <option value="other">محل آخر</option>
                </select>
              </div>

              {/* Shop Selection with Search */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  اختيار المحل <span className="text-red-500">*</span>
                </label>
                
                {/* Dropdown Select */}
                <select
                  value={formData.shopId}
                  onChange={(e) => {
                    const selectedShop = filteredShops.find(shop => shop.id === e.target.value);
                    if (selectedShop) {
                      handleShopSelect(selectedShop);
                    }
                  }}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                  disabled={!formData.shopType}
                >
                  <option value="">
                    {filteredShops.length === 0 
                      ? `لا توجد محلات من نوع ${formData.shopType === 'tailor' ? 'خياطة' : formData.shopType === 'boutique' ? 'بوتيك' : formData.shopType === 'fabric_store' ? 'أقمشة' : 'أخرى'}`
                      : 'اختر محل...'}
                  </option>
                  {filteredShops.map(shop => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name} (@{shop.username || shop.id})
                    </option>
                  ))}
                </select>

                {/* Selected Shop Display */}
                {formData.shopId && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-slate-600 dark:text-slate-400">المحل المختار:</p>
                    <p className="font-medium text-slate-800 dark:text-white">{formData.shopName}</p>
                    <p className="text-xs text-slate-500 font-mono mt-1">ID: {formData.shopId}</p>
                  </div>
                )}
              </div>

              {/* Ad Location */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  موقع الإعلان <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.adLocation}
                  onChange={(e) => setFormData({ ...formData, adLocation: e.target.value as any })}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                >
                  {Object.entries(AD_DIMENSIONS).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.description} ({value.width}x{value.height} - {value.ratio})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  الأبعاد المثالية: {AD_DIMENSIONS[formData.adLocation || 'homepage_main'].width}x{AD_DIMENSIONS[formData.adLocation || 'homepage_main'].height} بكسل
                </p>
              </div>

              {/* Image Upload */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  صورة الإعلان <span className="text-red-500">*</span>
                </label>
                
                {/* Upload Button */}
                <div className="flex gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer">
                    <Upload size={20} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      {uploadingImage ? 'جاري الرفع...' : 'رفع صورة'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* URL Input (Alternative) */}
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="أو أدخل رابط الصورة مباشرة"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                />

                {/* Image Preview */}
                {formData.image && (
                  <div className="relative">
                    <img 
                      src={formData.image} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg border border-slate-200 dark:border-slate-700" 
                    />
                    <button
                      onClick={() => setFormData({ ...formData, image: '' })}
                      className="absolute top-2 left-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      title="حذف الصورة"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Title & Description */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    عنوان الإعلان <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                    placeholder="مثال: تفصيل دشاديش كويتية فاخرة"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    وصف الإعلان
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                    rows={3}
                    placeholder="وصف مختصر للإعلان"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    نص الزر
                  </label>
                  <input
                    type="text"
                    value={formData.buttonText}
                    onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                    placeholder="تسوق الآن"
                  />
                </div>
              </div>

              {/* Duration & Period & Budget */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    مدة العرض (ثواني)
                  </label>
                  <input
                    type="number"
                    value={formData.displayDuration}
                    onChange={(e) => setFormData({ ...formData, displayDuration: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                    min="3"
                    max="60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    فترة النشر (أيام)
                  </label>
                  <input
                    type="number"
                    value={formData.activePeriodDays}
                    onChange={(e) => setFormData({ ...formData, activePeriodDays: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                    min="1"
                    max="90"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    الميزانية (ر.ع)
                  </label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                    min="0"
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    الأولوية
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                  >
                    <option value="high">عالي</option>
                    <option value="medium">متوسط</option>
                    <option value="low">منخفض</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    المنطقة المستهدفة
                  </label>
                  <input
                    type="text"
                    value={formData.targetRegion}
                    onChange={(e) => setFormData({ ...formData, targetRegion: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                    placeholder="مسقط"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    الحالة
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                  >
                    <option value="active">نشط</option>
                    <option value="paused">متوقف</option>
                    <option value="scheduled">مجدول</option>
                  </select>
                </div>
              </div>

              {/* Pinned Ad */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isPinned" className="flex-1 cursor-pointer">
                  <p className="font-medium text-slate-800 dark:text-white">إعلان مثبت</p>
                  <p className="text-xs text-slate-500">سيظهر هذا الإعلان بشكل دائم ولن يتم استبداله</p>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Modal */}
      {showReports && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-7xl flex flex-col max-h-[95vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <BarChart3 size={24} />
                  تقارير الإعلانات
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  إحصائيات مفصلة لجميع الإعلانات
                </p>
              </div>
              <button
                onClick={() => setShowReports(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Overall Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp size={24} />
                    <span className="text-2xl font-bold">{ads.length}</span>
                  </div>
                  <p className="text-sm opacity-90">إجمالي الإعلانات</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <Eye size={24} />
                    <span className="text-2xl font-bold">
                      {ads.reduce((sum, ad) => sum + ad.views, 0).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm opacity-90">إجمالي المشاهدات</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <MousePointer size={24} />
                    <span className="text-2xl font-bold">
                      {ads.reduce((sum, ad) => sum + ad.clicks, 0).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm opacity-90">إجمالي النقرات</p>
                </div>
                
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp size={24} />
                    <span className="text-2xl font-bold">
                      {ads.length > 0 
                        ? ((ads.reduce((sum, ad) => sum + ad.clicks, 0) / ads.reduce((sum, ad) => sum + ad.views, 0)) * 100).toFixed(1)
                        : '0'}%
                    </span>
                  </div>
                  <p className="text-sm opacity-90">معدل النقر (CTR)</p>
                </div>
              </div>

              {/* Performance by Location */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4">الأداء حسب الموقع</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['homepage_main', 'homepage_sidebar', 'search_results'] as const).map(location => {
                    const locationAds = ads.filter(ad => ad.adLocation === location);
                    const totalViews = locationAds.reduce((sum, ad) => sum + ad.views, 0);
                    const totalClicks = locationAds.reduce((sum, ad) => sum + ad.clicks, 0);
                    const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : '0';
                    
                    const locationNames = {
                      homepage_main: 'الصفحة الرئيسية',
                      homepage_sidebar: 'الشريط الجانبي',
                      search_results: 'نتائج البحث'
                    };
                    
                    return (
                      <div key={location} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <h5 className="font-semibold text-slate-800 dark:text-white mb-3">{locationNames[location]}</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">عدد الإعلانات:</span>
                            <span className="font-semibold text-slate-800 dark:text-white">{locationAds.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">المشاهدات:</span>
                            <span className="font-semibold text-green-600">{totalViews.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">النقرات:</span>
                            <span className="font-semibold text-purple-600">{totalClicks.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                            <span className="text-slate-600 dark:text-slate-400">CTR:</span>
                            <span className="font-bold text-orange-600">{ctr}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Reports Table */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <h4 className="text-lg font-bold text-slate-800 dark:text-white">تفاصيل الإعلانات</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                      <tr>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">الإعلان</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">المحل</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">الموقع</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">الحالة</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">المشاهدات</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">النقرات</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">CTR</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">الفترة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {ads
                        .sort((a, b) => b.views - a.views)
                        .map((ad) => {
                          const ctr = getCTR(ad.views, ad.clicks);
                          const startDate = new Date(ad.startDate).toLocaleDateString('ar-SA');
                          const endDate = new Date(ad.endDate).toLocaleDateString('ar-SA');
                          
                          return (
                            <tr key={ad.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {ad.image && (
                                    <img
                                      src={ad.image}
                                      alt={ad.title}
                                      className="w-12 h-12 rounded-lg object-cover"
                                    />
                                  )}
                                  <div>
                                    <p className="font-medium text-slate-800 dark:text-white">{ad.title}</p>
                                    {ad.isPinned && (
                                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded dark:bg-amber-900/30 dark:text-amber-400">
                                        مثبت
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                {ad.shopName}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded dark:bg-blue-900/30 dark:text-blue-400">
                                  {ad.adLocation === 'homepage_main' && 'الصفحة الرئيسية'}
                                  {ad.adLocation === 'homepage_sidebar' && 'الشريط الجانبي'}
                                  {ad.adLocation === 'search_results' && 'نتائج البحث'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-xs px-2 py-1 rounded ${
                                  ad.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                  ad.status === 'paused' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                                }`}>
                                  {ad.status === 'active' ? 'نشط' : ad.status === 'paused' ? 'موقوف' : 'منتهي'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Eye size={14} className="text-green-600" />
                                  <span className="font-semibold text-green-600">{ad.views.toLocaleString()}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <MousePointer size={14} className="text-purple-600" />
                                  <span className="font-semibold text-purple-600">{ad.clicks.toLocaleString()}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`font-bold ${
                                  parseFloat(ctr.toString()) > 5 ? 'text-green-600' :
                                  parseFloat(ctr.toString()) > 2 ? 'text-orange-600' :
                                  'text-red-600'
                                }`}>
                                  {ctr}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                                {startDate}<br />إلى {endDate}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Performance Insights */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-blue-200 dark:border-slate-700 p-6">
                <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4">رؤى الأداء</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-900/50 rounded-lg p-4">
                    <h5 className="font-semibold text-slate-800 dark:text-white mb-2">أفضل إعلان (مشاهدات)</h5>
                    {ads.length > 0 && (() => {
                      const topViews = ads.reduce((max, ad) => ad.views > max.views ? ad : max, ads[0]);
                      return (
                        <div className="flex items-center gap-3">
                          {topViews.image && (
                            <img src={topViews.image} alt="" className="w-16 h-16 rounded-lg object-cover" />
                          )}
                          <div>
                            <p className="font-medium text-slate-800 dark:text-white">{topViews.title}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{topViews.shopName}</p>
                            <p className="text-lg font-bold text-green-600">{topViews.views.toLocaleString()} مشاهدة</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div className="bg-white dark:bg-slate-900/50 rounded-lg p-4">
                    <h5 className="font-semibold text-slate-800 dark:text-white mb-2">أفضل إعلان (نقرات)</h5>
                    {ads.length > 0 && (() => {
                      const topClicks = ads.reduce((max, ad) => ad.clicks > max.clicks ? ad : max, ads[0]);
                      return (
                        <div className="flex items-center gap-3">
                          {topClicks.image && (
                            <img src={topClicks.image} alt="" className="w-16 h-16 rounded-lg object-cover" />
                          )}
                          <div>
                            <p className="font-medium text-slate-800 dark:text-white">{topClicks.title}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{topClicks.shopName}</p>
                            <p className="text-lg font-bold text-purple-600">{topClicks.clicks.toLocaleString()} نقرة</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
