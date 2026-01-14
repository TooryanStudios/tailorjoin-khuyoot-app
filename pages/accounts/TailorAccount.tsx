import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  LogOut, Store, ShoppingBag, MapPin, Plus, ChevronLeft,
  Phone, Package, BarChart3, Eye, CheckCircle, XCircle, Clock, 
  Bell, Save, Settings, Star, MessageCircle, Shirt, ArrowRight,
  TrendingUp, Wallet, Users, Scissors, Edit2, Upload, Camera, X
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Order, Tailor } from '../../types';
import { getTailorById } from '../../services/mockService';
import { getTailorOrders } from '../../services/orderService';
import { firebaseService } from '../../services/firebase';
import { storage } from '../../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';

export const TailorAccount = () => {
  const { user, logout, loading: appLoading, toggleAuthModal, refreshUser } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'materials' | 'dashboard' | 'branches' | 'settings'>('orders');
  const [tailorOrders, setTailorOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [tailor, setTailor] = useState<Tailor | null>(null);
   const [ordersLoading, setOrdersLoading] = useState(true);
  const [showTailorDetails, setShowTailorDetails] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editProfileImageFile, setEditProfileImageFile] = useState<File | null>(null);
  const [editProfileImagePreview, setEditProfileImagePreview] = useState<string>('');
  const [savingProfile, setSavingProfile] = useState(false);
  useEffect(() => {
    if (user && user.role === 'tailor') {
      loadOrders();
      getTailorById(user.id).then(setTailor);
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user?.id) return;
    try {
         setOrdersLoading(true);
      const orders = await getTailorOrders(user.id);
      setTailorOrders(orders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
         setOrdersLoading(false);
    }
  };

  const handleEditProfile = () => {
    setEditDisplayName(user?.name || '');
    setEditProfileImagePreview(user?.profileImage || user?.photoURL || '');
    setEditProfileImageFile(null);
    setShowEditProfileModal(true);
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار صورة فقط');
      return;
    }
    
    setEditProfileImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setEditProfileImagePreview(previewUrl);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    
    if (!editDisplayName.trim()) {
      alert('يرجى إدخال اسم العرض');
      return;
    }
    
    setSavingProfile(true);
    
    try {
      const updates: any = {};
      
      // Update display name if changed
      if (editDisplayName.trim() !== user.name) {
        updates.name = editDisplayName.trim();
      }
      
      // Upload new profile image if selected
      if (editProfileImageFile) {
        try {
          // Compress image
          const options = {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 512,
            useWebWorker: true
          };
          const compressedFile = await imageCompression(editProfileImageFile, options);
          
          // Upload to Firebase Storage
          const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
          const storageRef = ref(storage, `profile-images/${user.id}/${uniqueId}_${editProfileImageFile.name}`);
          await uploadBytes(storageRef, compressedFile);
          const downloadURL = await getDownloadURL(storageRef);
          
          updates.profileImage = downloadURL;
          updates.photoURL = downloadURL; // Also update photoURL for compatibility
        } catch (error) {
          console.error('Error uploading profile image:', error);
          alert('فشل رفع الصورة. يرجى المحاولة مرة أخرى.');
          setSavingProfile(false);
          return;
        }
      }
      
      // Update profile in Firebase
      if (Object.keys(updates).length > 0) {
        await firebaseService.updateUserProfile(user.id, updates);
        await refreshUser();
        alert('✅ تم تحديث الملف الشخصي بنجاح');
        setShowEditProfileModal(false);
        
        // Clean up preview URL
        if (editProfileImagePreview.startsWith('blob:')) {
          URL.revokeObjectURL(editProfileImagePreview);
        }
      } else {
        alert('لا توجد تغييرات لحفظها');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('حدث خطأ أثناء تحديث الملف الشخصي');
    } finally {
      setSavingProfile(false);
    }
  };

  // --- Loader ---
   if (appLoading || (ordersLoading && !!user && !tailor)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
             <div className="w-16 h-16 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                <Scissors size={20} className="text-indigo-600" />
             </div>
          </div>
          <p className="text-slate-500 font-medium animate-pulse">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

   // --- Not authenticated ---
   if (!user) {
      return (
         <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-950">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2rem] p-8 text-center border border-slate-200 dark:border-slate-800 shadow-2xl">
               <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Store className="text-indigo-600" size={32} />
               </div>
               <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">يرجى تسجيل الدخول</h3>
               <p className="text-slate-500 mb-6">سجّل الدخول للوصول إلى لوحة تحكم الخياط.</p>
               <button
                  onClick={() => toggleAuthModal(true, 'login')}
                  className="w-full py-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:shadow-lg transition-all"
               >
                  تسجيل الدخول
               </button>
            </div>
         </div>
      );
   }

  // --- Redirect Message ---
  if (user.role !== 'tailor') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2rem] p-8 text-center border border-slate-200 dark:border-slate-800 shadow-2xl">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
             <Store className="text-indigo-600" size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">حساب غير مصرح</h3>
          <p className="text-slate-500 mb-6">هذه لوحة تحكم خاصة بالخياطين فقط.</p>
          <button onClick={() => navigate('/account', { replace: true })} className="w-full py-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:shadow-lg transition-all">
             العودة لحسابي
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32 pt-6 px-4 md:px-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* 1. Dashboard Header (Glassmorphism) */}
      <div className="relative w-full bg-slate-900 rounded-[2.5rem] p-6 md:p-8 text-white shadow-2xl overflow-hidden">
         {/* Background Patterns */}
         <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none -mr-20 -mt-20"/>
         <div className="absolute bottom-0 left-0 w-80 h-80 bg-fuchsia-600/20 rounded-full blur-[100px] pointer-events-none -ml-20 -mb-20"/>
         
         <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Shop Logo */}
            <div className="relative group">
               <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl p-1 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md shadow-lg">
                  <img 
                    src={user?.profileImage || user?.photoURL || "https://picsum.photos/200/200?random=tailor"} 
                    alt="Shop Logo" 
                    className="w-full h-full rounded-xl object-cover"
                  />
               </div>
               <button
                 onClick={handleEditProfile}
                 className="absolute -bottom-2 -right-2 bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-lg shadow-lg border border-slate-900 transition-colors"
                 title="تعديل الصورة والاسم"
               >
                  <Edit2 size={16} />
               </button>
            </div>

            {/* Shop Info */}
            <div className="flex-1 text-center md:text-right space-y-2">
               <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1">{user?.name}</h2>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-slate-300">
                     <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-sm">
                        <MapPin size={12}/> {tailor?.location || 'مسقط'}
                     </span>
                     <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-sm">
                        <Star size={12} className="text-yellow-400 fill-yellow-400"/> {tailor?.rating || '4.9'}
                     </span>
                     <span>{user?.email}</span>
                  </div>
               </div>
               
               {/* Quick Stats Row */}
               <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                  <div className="text-center px-4 py-2 bg-white/5 rounded-xl border border-white/5 backdrop-blur-sm">
                     <span className="block text-xl font-bold">{tailorOrders.length}</span>
                     <span className="text-[10px] text-slate-400 uppercase tracking-widest">إجمالي الطلبات</span>
                  </div>
                  <div className="text-center px-4 py-2 bg-white/5 rounded-xl border border-white/5 backdrop-blur-sm">
                     <span className="block text-xl font-bold text-emerald-400">0 ر.ع</span>
                     <span className="text-[10px] text-slate-400 uppercase tracking-widest">الأرباح (الشهر)</span>
                  </div>
               </div>
            </div>

            {/* Header Actions */}
            <div className="flex gap-3">
               <button onClick={() => navigate('/shop-profile-edit')} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md transition-colors border border-white/10">
                  <Settings size={20} />
               </button>
               <button onClick={async () => { await logout(); navigate('/', { replace: true }); }} className="p-3 bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-white rounded-xl backdrop-blur-md transition-colors border border-red-500/20">
                  <LogOut size={20} />
               </button>
            </div>
         </div>

         {/* Tailor Profile Details - Collapsible */}
         <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mt-6">
            <button 
               onClick={() => setShowTailorDetails(!showTailorDetails)}
               className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
            >
               <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  تفاصيل حساب الخياط
               </h4>
               <ChevronLeft 
                  size={20} 
                  className={`text-slate-500 transition-transform ${showTailorDetails ? 'rotate-90' : '-rotate-90'}`}
               />
            </button>
            
            {/* Grid Layout for Details */}
            {showTailorDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
               {/* User ID */}
               <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">معرف المستخدم (id)</span>
                  <span className="text-xs font-mono text-slate-900 dark:text-white truncate block">{user?.id || 'غير متوفر'}</span>
               </div>
               
               {/* Name */}
               <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">الاسم (name)</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{user?.name || 'غير متوفر'}</span>
               </div>
               
               {/* Email */}
               <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">البريد الإلكتروني (email)</span>
                  <span className="text-xs text-slate-900 dark:text-white truncate block">{user?.email || 'غير متوفر'}</span>
               </div>
               
               {/* Phone */}
               <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">رقم الهاتف (phone)</span>
                  <span className="text-xs text-slate-900 dark:text-white">{user?.phone || 'غير متوفر'}</span>
               </div>
               
               {/* Location */}
               <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">الموقع (location)</span>
                  <span className="text-xs text-slate-900 dark:text-white">{user?.location || tailor?.location || 'غير متوفر'}</span>
               </div>
               
               {/* Region */}
               <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">المنطقة (region)</span>
                  <span className="text-xs text-slate-900 dark:text-white">{user?.region || 'غير متوفر'}</span>
               </div>
               
               {/* Experience */}
               <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">سنوات الخبرة (experience)</span>
                  <span className="text-xs text-slate-900 dark:text-white">{user?.experience || tailor?.experience || 'غير متوفر'}</span>
               </div>
               
               {/* Specialization */}
               <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">التخصص (specialization)</span>
                  <span className="text-xs text-slate-900 dark:text-white">{user?.specialization || 'غير متوفر'}</span>
               </div>
               
               {/* Rating */}
               <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">التقييم (rating)</span>
                  <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                     <Star size={12} className="fill-yellow-500" />
                     {user?.rating || tailor?.rating || '0.0'}
                  </span>
               </div>
               
               {/* Approval Status */}
               <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">حالة الموافقة (approvalStatus)</span>
                  <span className={`text-xs font-bold ${
                     user?.approvalStatus === 'approved' ? 'text-green-600' :
                     user?.approvalStatus === 'pending' ? 'text-amber-600' :
                     'text-red-600'
                  }`}>
                     {user?.approvalStatus === 'approved' ? '✅ موافق' :
                      user?.approvalStatus === 'pending' ? '⏳ مراجعة' :
                      user?.approvalStatus === 'rejected' ? '❌ مرفوض' : 'غير متوفر'}
                  </span>
               </div>
               
               {/* Role */}
               <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">الدور (role)</span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{user?.role || 'غير متوفر'}</span>
               </div>
               
               {/* Join Date */}
               <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">تاريخ الانضمام (joinDate)</span>
                  <span className="text-xs text-slate-900 dark:text-white">{user?.joinDate || 'غير متوفر'}</span>
               </div>
               
               {/* Bio */}
               {(user?.bio || tailor?.bio) && (
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 col-span-full">
                     <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">نبذة عن الخياط (bio)</span>
                     <p className="text-xs text-slate-700 dark:text-slate-300">{user?.bio || tailor?.bio}</p>
                  </div>
               )}
               
               {/* Gender Toggle */}
               <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-1 col-span-full">
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 mb-2">
                     التخصص (tailorGender): <strong className="text-xs">{user?.tailorGender === 'male' ? '👔 رجالي' : '👗 نسائي'}</strong>
                  </p>
               
               <div className="flex gap-2">
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      console.log('🔵 Male button clicked, user:', user?.id);
                      if (!user?.id) {
                        console.error('❌ No user ID found');
                        alert('❌ لا يوجد مستخدم مسجل');
                        return;
                      }
                      try {
                        console.log('🔄 Updating to male...');
                        await firebaseService.updateUserProfile(user.id, { tailorGender: 'male' });
                        console.log('✅ Update successful');
                        alert('✅ تم التحويل إلى خياط رجالي');
                        await refreshUser();
                        window.location.reload();
                      } catch (error) {
                        console.error('❌ Error updating profile:', error);
                        alert('❌ حدث خطأ: ' + (error as any)?.message);
                      }
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      user?.tailorGender === 'male'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    👔 رجالي
                  </button>
                  
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      console.log('🟣 Female button clicked, user:', user?.id);
                      if (!user?.id) {
                        console.error('❌ No user ID found');
                        alert('❌ لا يوجد مستخدم مسجل');
                        return;
                      }
                      try {
                        console.log('🔄 Updating to female...');
                        await firebaseService.updateUserProfile(user.id, { tailorGender: 'female' });
                        console.log('✅ Update successful');
                        alert('✅ تم التحويل إلى خياطة نسائية');
                        await refreshUser();
                        window.location.reload();
                      } catch (error) {
                        console.error('❌ Error updating profile:', error);
                        alert('❌ حدث خطأ: ' + (error as any)?.message);
                      }
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      user?.tailorGender === 'female'
                        ? 'bg-pink-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    👗 نسائي
                  </button>
               </div>
               {/* End gender toggle container */}
            </div>
            {/* End profile details grid */}
            </div>
            )}
         </div>

         {/* Navigation Tabs (Floating) */}
         <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
               {[
                 { id: 'orders', label: 'الطلبات', icon: Package },
                 { id: 'materials', label: 'المخزون', icon: ShoppingBag },
                 { id: 'dashboard', label: 'التقارير', icon: BarChart3 },
                 { id: 'branches', label: 'الفروع', icon: Store },
                 { id: 'settings', label: 'الإعدادات', icon: Settings },
               ].map((tab) => (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as any)}
                   className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                     activeTab === tab.id
                       ? 'bg-white text-slate-900 shadow-lg scale-105'
                       : 'bg-white/5 text-slate-300 hover:bg-white/10'
                   }`}
                 >
                   <tab.icon size={18} />
                   {tab.label}
                 </button>
               ))}
            </div>
         </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="grid grid-cols-1 gap-6 animate-in slide-in-from-bottom-4 duration-500">
         
         {/* === ORDERS TAB === */}
         {activeTab === 'orders' && (
           <div className="space-y-6">
             <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                   <span className="w-2 h-8 bg-indigo-600 rounded-full"></span>
                   إدارة الطلبات
                </h3>
                <div className="flex gap-2">
                   {['pending', 'active', 'completed'].map((status) => (
                      <button key={status} className="px-4 py-2 rounded-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-colors">
                         {status === 'pending' ? 'طلبات جديدة' : status === 'active' ? 'قيد التنفيذ' : 'مكتملة'}
                      </button>
                   ))}
                </div>
             </div>

             {tailorOrders.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center">
                   <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package size={40} className="text-slate-300"/>
                   </div>
                   <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">لا توجد طلبات نشطة</h3>
                   <p className="text-slate-500 text-sm">أنت جاهز لاستقبال طلبات جديدة!</p>
                </div>
             ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                   {tailorOrders.map((order) => (
                      <div 
                        key={order.id}
                        onClick={() => { setSelectedOrder(order); setShowOrderDetails(true); }}
                        className="group relative bg-white dark:bg-slate-900 rounded-[2rem] p-5 border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all cursor-pointer overflow-hidden"
                      >
                         <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-200 group-hover:bg-indigo-600 transition-colors"></div>
                         
                         <div className="flex gap-5">
                            <div className="w-24 h-24 bg-slate-100 rounded-2xl overflow-hidden shrink-0 shadow-inner">
                               <img src={order.productImage} alt="Product" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                               <div className="flex justify-between items-start mb-2">
                                  <div>
                                     <h4 className="font-bold text-lg text-slate-900 dark:text-white truncate">{order.productName}</h4>
                                     <p className="text-xs text-slate-500">طلب #{order.id.slice(-6)}</p>
                                  </div>
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                                     order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                     order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                     'bg-indigo-100 text-indigo-700'
                                  }`}>
                                     {order.status === 'pending' ? 'طلب جديد' : order.status === 'completed' ? 'مكتمل' : 'قيد العمل'}
                                  </span>
                               </div>
                               
                               <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                                     <span className="text-indigo-600">{order.price} ر.ع</span>
                                  </div>
                                  <span className="text-xs text-slate-400">{new Date(order.orderDate).toLocaleDateString('ar')}</span>
                               </div>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             )}
           </div>
         )}

         {/* === DASHBOARD TAB === */}
         {activeTab === 'dashboard' && (
            <div className="space-y-6">
               <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">نظرة عامة على الأداء</h3>
               
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'إجمالي الطلبات', val: tailorOrders.length, icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'الأرباح', val: '0 ر.ع', icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'العملاء', val: '120', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    { label: 'التقييم', val: tailor?.rating || '4.9', icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                  ].map((stat, idx) => (
                     <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${stat.bg} ${stat.color}`}>
                           <stat.icon size={24} fill={stat.icon === Star ? "currentColor" : "none"} />
                        </div>
                        <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">{stat.val}</h4>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                     </div>
                  ))}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Recent Activity Card */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                     <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-indigo-600"/> النشاط الأخير
                     </h4>
                     <div className="space-y-4">
                        <div className="flex gap-4 items-center">
                           <div className="w-2 h-2 rounded-full bg-green-500"></div>
                           <p className="text-sm text-slate-600 dark:text-slate-300">تم اكتمال الطلب #2938</p>
                           <span className="mr-auto text-xs text-slate-400">منذ ساعتين</span>
                        </div>
                        <div className="flex gap-4 items-center">
                           <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                           <p className="text-sm text-slate-600 dark:text-slate-300">طلب جديد وارد #2939</p>
                           <span className="mr-auto text-xs text-slate-400">منذ 5 ساعات</span>
                        </div>
                     </div>
                  </div>

                  {/* Profile Details Card */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                     <h4 className="font-bold text-lg mb-4">تفاصيل الحساب</h4>
                     <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-2 border-b border-slate-50 dark:border-slate-800">
                           <span className="text-slate-500">نوع الاشتراك</span>
                           <span className="font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-lg">PRO</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-50 dark:border-slate-800">
                           <span className="text-slate-500">تاريخ الانضمام</span>
                           <span className="font-bold text-slate-800 dark:text-white">يناير 2024</span>
                        </div>
                        <div className="flex justify-between py-2">
                           <span className="text-slate-500">التخصص</span>
                           <span className="font-bold text-slate-800 dark:text-white">{user?.tailorGender === 'male' ? 'خياطة رجالية' : 'خياطة نسائية'}</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* === MATERIALS TAB === */}
         {activeTab === 'materials' && (
            <div className="space-y-6">
               <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2rem] p-8 text-white text-center shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                  <div className="relative z-10">
                     <ShoppingBag size={48} className="mx-auto mb-4 opacity-90"/>
                     <h3 className="text-2xl font-bold mb-2">إدارة المخزون</h3>
                     <p className="text-indigo-100 mb-6 max-w-lg mx-auto">قم بإضافة وتحديث الأقمشة والمواد المتوفرة في مشغلك ليتمكن العملاء من اختيارها مباشرة.</p>
                     <button 
                        onClick={() => navigate('/tailor-materials')}
                        className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                     >
                        إدارة المواد
                     </button>
                  </div>
                  {/* Decor */}
                  <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-20 -mt-20"></div>
                  <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl -mr-20 -mb-20"></div>
               </div>
            </div>
         )}

         {/* === BRANCHES TAB === */}
         {activeTab === 'branches' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">الفروع المسجلة</h3>
                  <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:shadow-lg transition-all">
                     <Plus size={16} /> إضافة فرع
                  </button>
               </div>
               
               <div className="grid gap-4">
                  {[1, 2].map((branch) => (
                     <div key={branch} className="bg-white dark:bg-slate-900 p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400">
                              <Store size={24} />
                           </div>
                           <div>
                              <h4 className="font-bold text-slate-900 dark:text-white">الفرع الرئيسي - السيب</h4>
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin size={12}/> شارع السلطان قابوس</p>
                           </div>
                        </div>
                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-md">مفعل</span>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {/* === SETTINGS TAB === */}
         {activeTab === 'settings' && (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 space-y-6">
               <h3 className="text-xl font-bold mb-4">إعدادات المحل</h3>
               
               {['استقبال طلبات جديدة', 'إظهار رقم الهاتف', 'إشعارات التطبيق'].map((setting, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-800 last:border-0">
                     <span className="font-medium text-slate-700 dark:text-slate-300">{setting}</span>
                     <div className="w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full relative cursor-pointer transition-colors hover:bg-indigo-200">
                        <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform"></div>
                     </div>
                  </div>
               ))}
               
               <Button className="w-full mt-4 rounded-xl py-3 shadow-lg shadow-indigo-200">حفظ التغييرات</Button>
            </div>
         )}

      </div>

      {/* 3. Order Detail Modal (Overhauled) */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowOrderDetails(false)}></div>
           <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
              
              <div className="relative h-48">
                 <img src={selectedOrder.productImage} className="w-full h-full object-cover" alt="Product"/>
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                 <button onClick={() => setShowOrderDetails(false)} className="absolute top-4 left-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition-colors">
                    <XCircle size={24} />
                 </button>
                 <div className="absolute bottom-4 right-4 text-white">
                    <h3 className="text-2xl font-bold">{selectedOrder.productName}</h3>
                    <p className="text-sm opacity-80">طلب #{selectedOrder.id}</p>
                 </div>
              </div>

              <div className="p-6 space-y-6">
                 {/* Status & Price */}
                 <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <div>
                       <span className="text-xs text-slate-500 block mb-1">السعر الإجمالي</span>
                       <span className="text-xl font-bold text-indigo-600">{selectedOrder.price} ر.ع</span>
                    </div>
                    <div className="text-left">
                       <span className="text-xs text-slate-500 block mb-1">حالة الطلب</span>
                       <span className="inline-block px-3 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-700">
                          {selectedOrder.status === 'pending' ? 'بانتظار الموافقة' : 'قيد التنفيذ'}
                       </span>
                    </div>
                 </div>

                 {/* Actions */}
                 {selectedOrder.status === 'pending' && (
                    <div className="grid grid-cols-2 gap-3">
                       <button 
                         onClick={() => { alert('تم القبول'); setShowOrderDetails(false); }}
                         className="py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-200 transition-all"
                       >
                          قبول الطلب
                       </button>
                       <button 
                         onClick={() => { alert('تم الرفض'); setShowOrderDetails(false); }}
                         className="py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold transition-all"
                       >
                          رفض
                       </button>
                    </div>
                 )}

                 {/* Customer Info */}
                 <div>
                    <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-3">بيانات العميل</h4>
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">A</div>
                       <div>
                          <p className="font-bold text-slate-900 dark:text-white">أحمد محمد</p>
                          <p className="text-xs text-slate-500">+968 99xxxxxx</p>
                       </div>
                       <button className="mr-auto p-2 bg-slate-100 rounded-lg text-slate-600 hover:text-indigo-600">
                          <MessageCircle size={20} />
                       </button>
                    </div>
                 </div>

                 {/* Measurements Grid */}
                 {selectedOrder.measurements && (
                    <div>
                       <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-3">المقاسات</h4>
                       <div className="grid grid-cols-3 gap-2">
                          {Object.entries(selectedOrder.measurements).map(([key, val]) => (
                             <div key={key} className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-center border border-slate-100 dark:border-slate-700">
                                <span className="block text-xs text-slate-400 mb-1">{key}</span>
                                <span className="block font-bold text-slate-800 dark:text-white">{val}</span>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 size={20} className="text-indigo-600" />
                تعديل الملف الشخصي
              </h3>
              <button
                onClick={() => {
                  setShowEditProfileModal(false);
                  if (editProfileImagePreview.startsWith('blob:')) {
                    URL.revokeObjectURL(editProfileImagePreview);
                  }
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Profile Image */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  صورة الملف الشخصي
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                      <img
                        src={editProfileImagePreview || user?.profileImage || user?.photoURL || 'https://picsum.photos/200/200?random=tailor'}
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <input
                      type="file"
                      id="profile-image-input"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className="hidden"
                    />
                  </div>
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => document.getElementById('profile-image-input')?.click()}
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      <Camera size={18} />
                      {editProfileImageFile ? 'تغيير الصورة' : 'اختيار صورة'}
                    </button>
                    {editProfileImageFile && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                        <CheckCircle size={12} />
                        {editProfileImageFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  اسم العرض
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  placeholder="أدخل اسم العرض"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => {
                    setShowEditProfileModal(false);
                    if (editProfileImagePreview.startsWith('blob:')) {
                      URL.revokeObjectURL(editProfileImagePreview);
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-300 transition-colors"
                  disabled={savingProfile}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2"
                >
                  {savingProfile ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      حفظ التغييرات
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