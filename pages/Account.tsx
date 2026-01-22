import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
   LogOut, Ruler, Settings, ShoppingBag, Camera, ChevronLeft,
   CreditCard, Phone, Edit2, Crown, ClipboardList, Heart, Users,
   Package, Wallet, Sparkles, User as UserIcon, ArrowRight, MapPin, X, Mail, Lock, Eye, EyeOff
} from 'lucide-react';
import { Button } from '../components/Button';
import { Order, FamilyMember, PopularRegion } from '../types';
import { getUserOrders } from '../services/orderService';
import { firebaseService } from '../services/firebase';

export const Account = () => {
   const { user, logout, loading, login, register } = useApp();
  const navigate = useNavigate();
   const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isEditing, setIsEditing] = useState(false);
   const [inlineAuthOpen, setInlineAuthOpen] = useState(false);
   const [inlineAuthMode, setInlineAuthMode] = useState<'login' | 'register'>('login');
  
  // Auth form state
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authGender, setAuthGender] = useState<'male' | 'female' | 'not_specified'>('not_specified');
  const [authRegion, setAuthRegion] = useState('');
  const [authRole, setAuthRole] = useState<'user' | 'tailor'>('user');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [region, setRegion] = useState(user?.region || '');
  const [regions, setRegions] = useState<PopularRegion[]>([]);
  const [familyMembers] = useState<FamilyMember[]>([
      { id: '1', name: 'أحمد', relation: 'ابن' },
      { id: '2', name: 'نورة', relation: 'ابنة' }
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug: Track user state changes
  useEffect(() => {
    console.log('📊 Account page - user state:', { 
      hasUser: !!user, 
      userId: user?.id, 
      role: user?.role, 
      loading 
    });
  }, [user, loading]);

  // --- Logic & Effects (Kept Intact) ---
  useEffect(() => {
     if (!user) return;
     if (isEditing) return;
     setName(user?.name || '');
     setPhone(user?.phone || '');
     setRegion(user?.region || '');
  }, [user, isEditing]);

  useEffect(() => {
     if (!user) return;
     if (user.role === 'tailor') { navigate('/tailor-account', { replace: true }); return; }
     if (user.role === 'boutique') { navigate('/boutique-account', { replace: true }); return; }
     if (user.role === 'shop') { navigate('/shop-account', { replace: true }); return; }
     if (user.role === 'admin') { navigate('/admin', { replace: true }); return; }
  }, [user, navigate]);

  useEffect(() => {
     if (user && (user.role === 'user' || user.role === 'guest')) {
        loadOrders();
     }
     loadRegions();
  }, [user]);

  const loadRegions = async () => {
     try {
        const data = await firebaseService.getPopularRegions();
        setRegions(data.filter(r => r.enabled).sort((a, b) => a.order - b.order));
     } catch (error) {
        console.error('Error loading regions:', error);
     }
  };

  const loadOrders = async () => {
     if (!user?.id) return;
     try {
        const userOrders = await getUserOrders(user.id);
        setOrders(userOrders);
     } catch (error) {
        console.error('❌ Error loading orders:', error);
     }
  };

  const handleSaveProfile = async () => {
     if (!user) return;
     try {
        await firebaseService.updateUserProfile(user.id, { name, phone, region: region || undefined });
        setIsEditing(false);
        window.location.reload(); 
     } catch (error) {
        console.error(error);
        alert("حدث خطأ أثناء تحديث البيانات");
     }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file && user) {
        const reader = new FileReader();
        reader.onloadend = async () => {
           const base64String = reader.result as string;
           await firebaseService.updateUserProfile(user.id, { avatar: base64String });
           window.location.reload();
        };
        reader.readAsDataURL(file);
     }
  };

  useEffect(() => {
     if (user) return;
     try {
        const params = new URLSearchParams(location.search || '');
        const openAuth = params.get('openAuth');
        const mode = params.get('mode') === 'register' ? 'register' : 'login';
        const loginPhone = params.get('loginPhone');
        if (loginPhone) {
           localStorage.setItem('prefillLoginPhone', loginPhone);
        }
        if (openAuth === '1') {
           setInlineAuthMode(mode as 'login' | 'register');
           setInlineAuthOpen(true);
        }
     } catch {}
   }, [user, location.search]);

  // --- Loading State ---
  if (loading) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // --- Guest View (Modern Card) ---
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute top-0 left-0 w-full h-full">
           <div className="absolute top-10 right-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl"/>
           <div className="absolute bottom-10 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"/>
        </div>

            <div className="relative w-full max-w-md bg-zinc-900/90 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
                <button
                   onClick={() => navigate('/')}
                   className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
                   aria-label="إغلاق"
                >
                   <X size={14} />
                </button>
           {/* Beautiful Image at Top */}
           <div className="relative w-full h-48 md:h-56 overflow-visible border-0 outline-none">
             <img 
               src="/auth-panel.jpg" 
               alt="Khuyoot Tailoring" 
               className="absolute inset-0 w-full h-full object-cover border-0 outline-none"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent"></div>
           </div>
           
           {/* Title right above logo */}
           <div className="absolute left-0 right-0 flex justify-center z-20 pointer-events-none select-none" style={{ top: 'calc(14rem - 6rem)' }}>
             <h2 className="text-sm md:text-base font-semibold text-zinc-100">مرحباً بك في </h2>
           </div>
           
           {/* Logo floating between image and content */}
           <div className="absolute left-0 right-0 flex justify-center z-20 pointer-events-none select-none" style={{ top: 'calc(12rem - 4.5rem)' }}>
             <img 
               src="/logo_big.png" 
               alt="Khuyoot" 
               className="w-36 h-36 md:w-44 md:h-44 drop-shadow-2xl pointer-events-none select-none"
               style={{ imageRendering: 'high-quality', objectFit: 'contain' }}
             />
           </div>
           
                {/* Content Section */}
                <div className="p-6 md:p-8 text-center pt-12 md:pt-14">
                   {!inlineAuthOpen ? (
                      // Welcome View
                      <div className="transition-opacity duration-300">
                         <p className="text-zinc-400 mb-5 md:mb-6 leading-relaxed text-xs md:text-sm">
                            سجل دخولك الآن للوصول إلى طلباتك، مقاساتك، والتواصل مع أمهر الخياطين في المنطقة.
                         </p>
                 
                         <div className="space-y-2.5">
                            <div className="grid grid-cols-2 gap-2">
                               <button
                                  onClick={() => {
                                     setInlineAuthMode('login');
                                     setInlineAuthOpen(true);
                                  }}
                                  className="py-2.5 bg-indigo-600/90 hover:bg-indigo-500/90 backdrop-blur-xl text-white rounded-lg font-normal text-sm shadow-xl shadow-indigo-900/30 hover:shadow-2xl hover:shadow-indigo-900/40 transition-all duration-300 transform active:scale-[0.98] border border-white/10"
                               >
                                  تسجيل الدخول
                               </button>
                               <button
                                  onClick={() => {
                                     setInlineAuthMode('register');
                                     setInlineAuthOpen(true);
                                  }}
                                  className="py-2.5 bg-zinc-800/90 hover:bg-zinc-700/90 backdrop-blur-xl text-zinc-100 rounded-lg font-normal text-sm shadow-xl hover:shadow-2xl transition-all duration-300 transform active:scale-[0.98] border border-white/10"
                               >
                                  حساب جديد
                               </button>
                            </div>
                   
                            <button
                               onClick={() => navigate('/')}
                               className="w-full py-2.5 bg-transparent text-zinc-400 hover:text-zinc-300 rounded-lg font-normal border border-zinc-700 hover:border-zinc-600 transition-colors text-sm"
                            >
                               تصفح كزائر
                            </button>
                         </div>
                      </div>
                   ) : (
                      // Auth Form View (inline)
                      <div className="transition-opacity duration-300">
                         {/* Close button */}
                         <button
                            onClick={() => setInlineAuthOpen(false)}
                            className="mb-4 text-zinc-400 hover:text-white transition-colors flex items-center gap-2 text-sm relative z-30"
                         >
                            <ArrowRight size={16} />
                            رجوع
                         </button>

                         {/* Toggle between login and register */}
                         <div className="flex gap-1.5 mb-5 bg-zinc-800/50 p-1 rounded-lg">
                            <button
                               onClick={() => setInlineAuthMode('login')}
                               className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
                                  inlineAuthMode === 'login'
                                     ? 'bg-indigo-600 text-white shadow-lg'
                                     : 'text-zinc-400 hover:text-white'
                               }`}
                            >
                               تسجيل الدخول
                            </button>
                            <button
                               onClick={() => setInlineAuthMode('register')}
                               className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
                                  inlineAuthMode === 'register'
                                     ? 'bg-indigo-600 text-white shadow-lg'
                                     : 'text-zinc-400 hover:text-white'
                               }`}
                            >
                               حساب جديد
                            </button>
                         </div>

                         {/* Login/Register form */}
                         <form
                            onSubmit={async (e) => {
                               e.preventDefault();
                               
                               if (inlineAuthMode === 'register') {
                                  // Validation for registration
                                  if (authPassword !== authConfirmPassword) {
                                     alert('كلمة المرور غير متطابقة!');
                                     return;
                                  }
                                  if (!authName) {
                                     alert('يرجى إدخال الاسم');
                                     return;
                                  }
                               }
                               
                               setAuthSubmitting(true);
                               try {
                                  if (inlineAuthMode === 'login') {
                                     await login(authEmail, authPassword);
                                  } else {
                                     const merchantInfo = {
                                        phone: authPhone,
                                        loginId: authPhone.replace(/[^0-9]/g, ''),
                                        gender: authGender,
                                        region: authRegion,
                                     };
                                     await register(authEmail, authPassword, authName, authRole, merchantInfo);
                                  }
                                  setInlineAuthOpen(false);
                                  // Reset form
                                  setAuthEmail('');
                                  setAuthPassword('');
                                  setAuthConfirmPassword('');
                                  setAuthName('');
                                  setAuthPhone('');
                                  setAuthGender('not_specified');
                                  setAuthRegion('');
                               } catch (err: any) {
                                  alert(err?.message || 'حدث خطأ');
                               } finally {
                                  setAuthSubmitting(false);
                               }
                            }}
                            className="space-y-2.5"
                         >
                            {/* Name & Phone - only for registration */}
                            {inlineAuthMode === 'register' && (
                               <div className="grid grid-cols-2 gap-2">
                                  <div className="relative">
                                     <UserIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                     <input
                                        type="text"
                                        value={authName}
                                        onChange={(e) => setAuthName(e.target.value)}
                                        placeholder="الاسم"
                                        required
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 pr-9 pl-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 transition-all"
                                     />
                                  </div>
                                  <div className="relative">
                                     <Phone className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                     <input
                                        type="tel"
                                        value={authPhone}
                                        onChange={(e) => setAuthPhone(e.target.value)}
                                        placeholder="الهاتف (اختياري)"
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 pr-9 pl-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 transition-all"
                                     />
                                  </div>
                               </div>
                            )}

                            {/* Email field */}
                            <div className="relative">
                               <Mail className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                               <input
                                  type="email"
                                  value={authEmail}
                                  onChange={(e) => setAuthEmail(e.target.value)}
                                  placeholder="البريد الإلكتروني"
                                  required
                                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 pr-9 pl-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 transition-all"
                               />
                            </div>

                            {/* Password & Confirm Password */}
                            <div className={`grid ${inlineAuthMode === 'register' ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                               <div className="relative">
                                  <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                  <input
                                     type={showPassword ? "text" : "password"}
                                     value={authPassword}
                                     onChange={(e) => setAuthPassword(e.target.value)}
                                     placeholder="كلمة المرور"
                                     required
                                     className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 pr-9 pl-9 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 transition-all"
                                  />
                                  <button
                                     type="button"
                                     onClick={() => setShowPassword(!showPassword)}
                                     className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                  >
                                     {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                  </button>
                               </div>
                               {inlineAuthMode === 'register' && (
                                  <div className="relative">
                                     <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                     <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={authConfirmPassword}
                                        onChange={(e) => setAuthConfirmPassword(e.target.value)}
                                        placeholder="تأكيد"
                                        required
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 pr-9 pl-9 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 transition-all"
                                     />
                                     <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                     >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                     </button>
                                  </div>
                               )}
                            </div>

                            {/* Gender & Region - only for registration */}
                            {inlineAuthMode === 'register' && (
                               <div className="grid grid-cols-2 gap-2">
                                  <div className="flex gap-1.5">
                                     <button
                                        type="button"
                                        onClick={() => setAuthGender('male')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                                           authGender === 'male'
                                              ? 'border-indigo-600 bg-indigo-600/10 text-indigo-400'
                                              : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                                        }`}
                                     >
                                        ذكر
                                     </button>
                                     <button
                                        type="button"
                                        onClick={() => setAuthGender('female')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                                           authGender === 'female'
                                              ? 'border-indigo-600 bg-indigo-600/10 text-indigo-400'
                                              : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                                        }`}
                                     >
                                        أنثى
                                     </button>
                                  </div>
                                  <div className="relative">
                                     <MapPin className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                     <input
                                        type="text"
                                        value={authRegion}
                                        onChange={(e) => setAuthRegion(e.target.value)}
                                        placeholder="المنطقة (اختياري)"
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 pr-9 pl-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 transition-all"
                                     />
                                  </div>
                               </div>
                            )}

                            {/* Role selection - only for registration */}
                            {inlineAuthMode === 'register' && (
                               <div className="grid grid-cols-2 gap-2">
                                  <button
                                     type="button"
                                     onClick={() => setAuthRole('user')}
                                     className={`p-2.5 rounded-lg border transition-all ${
                                        authRole === 'user'
                                           ? 'border-indigo-600 bg-indigo-600/10'
                                           : 'border-zinc-700 hover:border-zinc-600'
                                     }`}
                                  >
                                     <UserIcon className={`mx-auto mb-1 ${authRole === 'user' ? 'text-indigo-400' : 'text-zinc-500'}`} size={18} />
                                     <div className={`text-xs font-medium ${authRole === 'user' ? 'text-white' : 'text-zinc-400'}`}>مستخدم</div>
                                  </button>
                                  <button
                                     type="button"
                                     onClick={() => setAuthRole('tailor')}
                                     className={`p-2.5 rounded-lg border transition-all ${
                                        authRole === 'tailor'
                                           ? 'border-indigo-600 bg-indigo-600/10'
                                           : 'border-zinc-700 hover:border-zinc-600'
                                     }`}
                                  >
                                     <Sparkles className={`mx-auto mb-1 ${authRole === 'tailor' ? 'text-indigo-400' : 'text-zinc-500'}`} size={18} />
                                     <div className={`text-xs font-medium ${authRole === 'tailor' ? 'text-white' : 'text-zinc-400'}`}>خياط</div>
                                  </button>
                               </div>
                            )}

                            {/* Submit button */}
                            <button
                               type="submit"
                               disabled={authSubmitting}
                               className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
                            >
                               {authSubmitting ? (
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                               ) : (
                                  <>
                                     {inlineAuthMode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}
                                     <ArrowRight size={16} />
                                  </>
                               )}
                            </button>
                         </form>
                      </div>
                   )}
                </div>
        </div>
      </div>
    );
  }

  // --- Authenticated User View ---
  return (
    <div className="pb-32 pt-6 px-4 md:px-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* 1. The "Membership Card" Header */}
      <div className="relative w-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-6 md:p-10 text-white shadow-2xl shadow-slate-900/20 overflow-hidden">
         {/* Decorative Circles */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"/>
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"/>

         <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar Section */}
            <div className="relative group shrink-0">
               <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl p-1 bg-gradient-to-br from-indigo-500 to-purple-500 shadow-2xl">
                  <img 
                    src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.name}&background=random`} 
                    alt="Profile" 
                    className="w-full h-full rounded-[1.3rem] object-cover bg-slate-800" 
                  />
               </div>
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="absolute -bottom-3 -right-3 bg-white text-slate-900 p-3 rounded-xl shadow-lg hover:scale-110 transition-transform"
               >
                  <Camera size={18} />
               </button>
               <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
            </div>

            {/* User Info & Edit */}
            <div className="flex-1 text-center md:text-right w-full">
               {isEditing ? (
                   <div className="space-y-4 max-w-sm mx-auto md:mx-0 bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                       <input 
                          type="text" 
                          value={name} 
                          onChange={(e) => setName(e.target.value)} 
                          className="w-full bg-white/20 border-0 rounded-xl py-3 px-4 text-white placeholder:text-white/50 text-center md:text-right font-bold focus:ring-2 focus:ring-indigo-400"
                          placeholder="الاسم"
                       />
                       <input 
                          type="tel" 
                          value={phone} 
                          onChange={(e) => setPhone(e.target.value)} 
                          className="w-full bg-white/20 border-0 rounded-xl py-3 px-4 text-white placeholder:text-white/50 text-center md:text-right focus:ring-2 focus:ring-indigo-400"
                          placeholder="رقم الهاتف"
                       />
                       <select
                          value={region}
                          onChange={(e) => setRegion(e.target.value)}
                          className="w-full bg-white/20 border-0 rounded-xl py-3 px-4 text-white text-center md:text-right focus:ring-2 focus:ring-indigo-400"
                       >
                          <option value="" className="text-slate-900">اختر المنطقة/الولاية</option>
                          {regions.map(r => (
                            <option key={r.id} value={r.name} className="text-slate-900">{r.name}</option>
                          ))}
                       </select>
                       <div className="flex gap-3 justify-center md:justify-start">
                           <Button onClick={handleSaveProfile} className="bg-indigo-500 hover:bg-indigo-400 text-white border-0">حفظ</Button>
                           <Button variant="outline" onClick={() => setIsEditing(false)} className="border-white/30 text-white hover:bg-white/10 bg-transparent">إلغاء</Button>
                       </div>
                   </div>
               ) : (
                   <div className="space-y-3">
                       <div className="flex flex-col md:flex-row items-center gap-3">
                          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">{user?.name}</h2>
                          {user?.isGoldMember && (
                             <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 backdrop-blur-md">
                                <Crown size={14} fill="currentColor" /> عضو ذهبي
                             </span>
                          )}
                       </div>
                       
                       <div className="flex flex-col md:flex-row items-center gap-4 text-slate-300 text-sm">
                          <p>{user?.email}</p>
                          {user?.phone && <span className="hidden md:inline">•</span>}
                          {user?.phone && <p className="flex items-center gap-1"><Phone size={14} /> {user.phone}</p>}
                          {user?.region && <span className="hidden md:inline">•</span>}
                          {user?.region && <p className="flex items-center gap-1"><MapPin size={14} /> {user.region}</p>}
                       </div>

                       <div className="pt-2">
                         <button onClick={() => setIsEditing(true)} className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm font-bold flex items-center gap-2 backdrop-blur-md">
                            <Edit2 size={16} /> تعديل البيانات
                         </button>
                       </div>
                   </div>
               )}
            </div>

            {/* Stats Cards (Floating) */}
            <div className="hidden md:flex gap-4">
               <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 text-center min-w-[100px]">
                  <span className="block text-2xl font-bold">{orders.length}</span>
                  <span className="text-[10px] text-slate-300 uppercase tracking-widest">طلبات</span>
               </div>
               <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 text-center min-w-[100px]">
                  <span className="block text-2xl font-bold text-emerald-400">0</span>
                  <span className="text-[10px] text-slate-300 uppercase tracking-widest">محفظة</span>
               </div>
            </div>
         </div>
      </div>

      {/* 2. Bento Grid for Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Measurements Card (Large) */}
         <button 
           onClick={() => navigate('/measurements')}
           className="md:col-span-2 group relative overflow-hidden bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm hover:shadow-xl border border-slate-100 dark:border-slate-800 transition-all duration-300 text-right"
         >
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
            <div className="relative flex items-center justify-between">
               <div>
                  <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:rotate-12 transition-transform">
                     <Ruler size={28} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">مقاساتي</h3>
                  <p className="text-slate-500 dark:text-slate-400">إدارة مقاسات الدشداشة والعباية بدقة.</p>
               </div>
               <div className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all">
                  <ChevronLeft size={24} />
               </div>
            </div>
         </button>

         {/* Family Card (Small) */}
         <button className="group relative overflow-hidden bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm hover:shadow-xl border border-slate-100 dark:border-slate-800 transition-all duration-300 text-right">
            <div className="absolute top-0 left-0 w-32 h-32 bg-purple-50 dark:bg-purple-900/20 rounded-full blur-3xl -ml-10 -mt-10 group-hover:scale-110 transition-transform"></div>
            <div className="relative h-full flex flex-col justify-between">
               <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/50 text-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:rotate-12 transition-transform">
                   <Users size={28} />
               </div>
               <div>
                   <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">العائلة</h3>
                   <div className="flex -space-x-2 rtl:space-x-reverse mt-3">
                      {familyMembers.map(m => (
                         <div key={m.id} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm">{m.name[0]}</div>
                      ))}
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[12px] text-slate-400 shadow-sm">+</div>
                   </div>
               </div>
            </div>
         </button>
      </div>

      {/* 3. Modern Orders List */}
      <div className="space-y-6">
         <div className="flex items-center justify-between px-2">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
               <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
               آخر الطلبات
            </h3>
            <button className="text-sm text-slate-500 font-bold hover:text-indigo-600 transition-colors flex items-center gap-1">
               عرض السجل <ChevronLeft size={16}/>
            </button>
         </div>

         {orders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {orders.slice(0, 4).map(order => (
                  <div 
                     key={order.id} 
                     onClick={() => navigate(`/order/${order.id}`)}
                     className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
                  >
                     <div className="absolute top-0 left-0 w-1 h-full bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-500 transition-colors"></div>
                     <div className="flex gap-5">
                        <div className="w-24 h-24 bg-slate-100 rounded-2xl overflow-hidden shrink-0 shadow-inner">
                           <img src={order.productImage} alt="Product" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                           <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-lg text-slate-900 dark:text-white truncate">{order.productName}</h4>
                              <span className={`text-[10px] px-3 py-1 rounded-full font-bold ${
                                 order.status === 'delivered' || order.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                 order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                 order.status === 'rejected' || order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                 'bg-blue-100 text-blue-700'
                              }`}>
                                 {order.status === 'delivered' ? 'مكتمل' : 'قيد التنفيذ'}
                              </span>
                           </div>
                           <p className="text-sm text-slate-500 mb-4 flex items-center gap-1"><UserIcon size={14}/> {order.tailorName}</p>
                           
                           {/* Modern Progress Bar */}
                           <div className="relative w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                 className={`absolute top-0 right-0 h-full rounded-full transition-all duration-1000 ${order.status === 'rejected' ? 'bg-red-500' : 'bg-gradient-to-l from-indigo-500 to-purple-500'}`}
                                 style={{ width: order.status === 'delivered' ? '100%' : '45%' }}
                              ></div>
                           </div>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         ) : (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
               <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <ShoppingBag size={40} />
               </div>
               <p className="text-lg text-slate-500 font-medium">لا توجد طلبات نشطة</p>
               <p className="text-sm text-slate-400 mb-6">ابدأ رحلة التفصيل الخاصة بك الآن</p>
               <Button variant="default" className="rounded-xl px-8 shadow-lg shadow-indigo-200" onClick={() => navigate('/')}>تصفح المتجر</Button>
            </div>
         )}
      </div>

      {/* 4. Menu Grid (Icons) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {[
            { icon: ClipboardList, label: 'السجل', color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: Heart, label: 'المفضلة', color: 'text-pink-600', bg: 'bg-pink-50' },
            { icon: Wallet, label: 'المحفظة', color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { icon: Settings, label: 'الإعدادات', color: 'text-slate-600', bg: 'bg-slate-50' },
         ].map((item, idx) => (
            <button key={idx} className="group bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all flex flex-col items-center gap-3">
               <div className={`w-14 h-14 rounded-2xl ${item.bg} dark:bg-slate-800 flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                  <item.icon size={24} />
               </div>
               <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{item.label}</span>
            </button>
         ))}
      </div>

      {/* Footer Actions */}
      <div className="pt-4 flex flex-col gap-3 max-w-sm mx-auto">
         <button onClick={async () => { await logout(); navigate('/', { replace: true }); }} className="w-full bg-red-50 dark:bg-red-900/10 text-red-600 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
            <LogOut size={20} /> تسجيل الخروج
         </button>
         
         <div className="text-center">
            <button onClick={() => navigate('/admin')} className="text-xs text-slate-400 hover:text-indigo-500 transition-colors inline-flex items-center gap-1 px-4 py-2 rounded-full hover:bg-slate-50">
               <Sparkles size={12} /> لوحة المطورين
            </button>
         </div>
      </div>
      
    </div>
  );
};