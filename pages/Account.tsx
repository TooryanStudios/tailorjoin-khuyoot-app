import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { 
   LogOut, Ruler, Settings, ShoppingBag, Camera, ChevronLeft,
   CreditCard, Phone, Edit2, Crown, ClipboardList, Heart, Users,
   Package, Wallet, Sparkles, User as UserIcon, ArrowRight, MapPin, X, Mail, Lock, Eye, EyeOff, Shield, Gift, Share2,
   Moon, Sun, Monitor, Globe, Trash2, AlertTriangle
} from 'lucide-react';
import { Button } from '../components/Button';
import { Order, FamilyMember, PopularRegion } from '../types';
import { getUserOrders } from '../services/orderService';
import { firebaseService } from '../services/firebase';
import { uploadAvatar } from '../services/storageService';
import { getSafeImageUrl, isBase64Image } from '../src/utils/imageUtils';

export const Account = () => {
   const { user, logout, loading, login, register, refreshUser, updateLocalUser, theme: appTheme, setTheme: setAppTheme } = useApp();
  const { t, i18n } = useTranslation(['account', 'common']);
  const navigate = useNavigate();
   const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isEditing, setIsEditing] = useState(false);
   const [optimisticAvatar, setOptimisticAvatar] = useState<string | null>(null);
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
      { id: '1', name: 'Ahmed', relation: 'Son' }, { id: '2', name: 'Nora', relation: 'Daughter' }
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Security & Modal states
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSecuritySettings, setShowSecuritySettings] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // App Settings state (derived from user/context)
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteAIOnly, setDeleteAIOnly] = useState(true);
  const [deleteAccountRequested, setDeleteAccountRequested] = useState(false);

  // Calculate order states
  const finalizedStatuses = ['delivered', 'cancelled', 'rejected'];
  const hasActiveOrders = orders.some(o => !finalizedStatuses.includes(o.status));
  const hasHistory = orders.length > 0;

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
      if (hasActiveOrders) {
         alert("Profile changes are restricted while you have active orders.");
         return;
      }
     try {
        await firebaseService.updateUserProfile(user.id, { name, phone, region: region || undefined });
         setIsEditing(false);
         if (updateLocalUser) updateLocalUser({ name, phone, region });
         if (refreshUser) refreshUser(); 
     } catch (error) {
        console.error(error);
        alert("An error occurred while updating your profile data.");
     }
  };

   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && user) {
         if (hasActiveOrders) {
            alert("Image uploads are disabled while you have active orders.");
            return;
         }
         // Optimistic update
         const previewUrl = URL.createObjectURL(file);
         setOptimisticAvatar(previewUrl);

         try {
            // Upload to Firebase Storage
            const avatarUrl = await uploadAvatar(file, user.id);
            
            // Store URL in Firestore
            await firebaseService.updateUserProfile(user.id, { 
               avatar: avatarUrl,
               profileImage: avatarUrl
            });
            
            // CRITICAL: Update local state immediately to avoid reverting
            if (updateLocalUser) {
               updateLocalUser({
                  avatar: avatarUrl,
                  profileImage: avatarUrl,
                  photoURL: avatarUrl
               });
            }
            
            // Refresh user data in background after a longer delay (7s) to ensure backend is ready.
            setTimeout(async () => {
               if (refreshUser) await refreshUser();
               setTimeout(() => setOptimisticAvatar(null), 1000);
            }, 7000);
            
         } catch (error) {
            console.error('Failed to upload avatar:', error);
            setOptimisticAvatar(null);
            alert('Failed to upload image. Please try again.');
         }
      }
   };

   const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (hasActiveOrders) {
         alert("Password changes are restricted while you have active orders.");
         return;
      }
      if (newPassword !== confirmNewPassword) {
         alert("New passwords do not match!");
         return;
      }
      if (newPassword.length < 6) {
         alert("Password must be at least 6 characters.");
         return;
      }

      setPasswordChanging(true);
      try {
         await firebaseService.changePassword(newPassword);
         alert("Password changed successfully!");
         setShowSecuritySettings(false);
         setNewPassword('');
         setConfirmNewPassword('');
      } catch (error: any) {
         console.error(error);
         alert(error.message || "Failed to change password. This action may require a recent login.");
      } finally {
         setPasswordChanging(false);
      }
   };

   const handleSaveSettings = async (updates: { theme?: any; language?: string }) => {
      if (!user) return;
      
      // 1. Optimistic UI Updates (Instant)
      if (updates.theme) {
         setAppTheme(updates.theme);
      }
      if (updates.language) {
         i18n.changeLanguage(updates.language);
      }

      setSettingsSaving(true);
      try {
         const newSettings = { 
            ...user.settings,
            ...(updates.theme ? { theme: updates.theme } : {}),
            ...(updates.language ? { language: updates.language } : {})
         };
         
         // 2. Persist to Backend (Background)
         await firebaseService.updateUserProfile(user.id, { settings: newSettings });
         if (updateLocalUser) updateLocalUser({ settings: newSettings });
      } catch (error) {
         console.error('Failed to save settings:', error);
         // Fallback/Revert if needed could be added here
      } finally {
         setSettingsSaving(false);
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
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
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
                   className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-slate-900 dark:text-white flex items-center justify-center transition-colors"
                   aria-label="Close"
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
             <h2 className="text-sm md:text-base font-semibold text-slate-900 dark:text-zinc-100">Welcome to </h2>
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
                         <p className="text-slate-500 dark:text-zinc-400 mb-5 md:mb-6 leading-relaxed text-xs md:text-sm">
                            Log in to access your orders, measurements, and connect with top tailors.
                         </p>
                 
                         <div className="space-y-2.5">
                            <div className="grid grid-cols-2 gap-2">
                               <button
                                  onClick={() => {
                                     setInlineAuthMode('login');
                                     setInlineAuthOpen(true);
                                  }}
                                  className="py-2.5 bg-indigo-600/90 hover:bg-indigo-500/90 backdrop-blur-xl text-slate-900 dark:text-white rounded-lg font-normal text-sm shadow-xl shadow-indigo-900/30 hover:shadow-2xl hover:shadow-indigo-900/40 transition-all duration-300 transform active:scale-[0.98] border border-white/10"
                               >
                                  Log In
                               </button>
                               <button
                                  onClick={() => {
                                     setInlineAuthMode('register');
                                     setInlineAuthOpen(true);
                                  }}
                                  className="py-2.5 bg-slate-100 dark:bg-zinc-800/90 hover:bg-zinc-700/90 backdrop-blur-xl text-slate-900 dark:text-zinc-100 rounded-lg font-normal text-sm shadow-xl hover:shadow-2xl transition-all duration-300 transform active:scale-[0.98] border border-white/10"
                               >
                                  New Account
                               </button>
                            </div>
                   
                            <button
                               onClick={() => navigate('/')}
                               className="w-full py-2.5 bg-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:text-zinc-300 rounded-lg font-normal border border-slate-200 dark:border-zinc-700 hover:border-zinc-600 transition-colors text-sm"
                            >
                               Browse as Guest
                            </button>
                         </div>
                      </div>
                   ) : (
                      // Auth Form View (inline)
                      <div className="transition-opacity duration-300">
                         {/* Close button */}
                         <button
                            onClick={() => setInlineAuthOpen(false)}
                            className="mb-4 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:text-white transition-colors flex items-center gap-2 text-sm relative z-30"
                         >
                            <ArrowRight size={16} />
                            Back
                         </button>

                         {/* Toggle between login and register */}
                         <div className="flex gap-1.5 mb-5 bg-slate-100 dark:bg-zinc-800/50 p-1 rounded-lg">
                            <button
                               onClick={() => setInlineAuthMode('login')}
                               className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
                                  inlineAuthMode === 'login'
                                     ? 'bg-indigo-600 text-slate-900 dark:text-white shadow-lg'
                                     : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:text-white'
                               }`}
                            >
                               Log In
                            </button>
                            <button
                               onClick={() => setInlineAuthMode('register')}
                               className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
                                  inlineAuthMode === 'register'
                                     ? 'bg-indigo-600 text-slate-900 dark:text-white shadow-lg'
                                     : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:text-white'
                               }`}
                            >
                               New Account
                            </button>
                         </div>

                         {/* Login/Register form */}
                         <form
                            onSubmit={async (e) => {
                               e.preventDefault();
                               
                               if (inlineAuthMode === 'register') {
                                  // Validation for registration
                                  if (authPassword !== authConfirmPassword) {
                                     alert('Passwords do not match!');
                                     return;
                                  }
                                  if (!authName) {
                                     alert('Please enter your name');
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
                                  alert(err?.message || 'An error occurred');
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
                                     <UserIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={16} />
                                     <input
                                        type="text"
                                        value={authName}
                                        onChange={(e) => setAuthName(e.target.value)}
                                        placeholder="Name"
                                        required
                                        className="w-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg py-2 pr-9 pl-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:text-zinc-500 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 transition-all"
                                     />
                                  </div>
                                  <div className="relative">
                                     <Phone className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={16} />
                                     <input
                                        type="tel"
                                        value={authPhone}
                                        onChange={(e) => setAuthPhone(e.target.value)}
                                        placeholder="Phone (Optional)"
                                        className="w-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg py-2 pr-9 pl-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:text-zinc-500 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 transition-all"
                                     />
                                  </div>
                               </div>
                            )}

                            {/* Email field */}
                            <div className="relative">
                               <Mail className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={16} />
                               <input
                                  type="email"
                                  value={authEmail}
                                  onChange={(e) => setAuthEmail(e.target.value)}
                                  placeholder="Email"
                                  required
                                  className="w-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg py-2 pr-9 pl-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:text-zinc-500 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 transition-all"
                               />
                            </div>

                            {/* Password & Confirm Password */}
                            <div className={`grid ${inlineAuthMode === 'register' ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                               <div className="relative">
                                  <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={16} />
                                  <input
                                     type={showPassword ? "text" : "password"}
                                     value={authPassword}
                                     onChange={(e) => setAuthPassword(e.target.value)}
                                     placeholder="Password"
                                     required
                                     className="w-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg py-2 pr-9 pl-9 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:text-zinc-500 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 transition-all"
                                  />
                                  <button
                                     type="button"
                                     onClick={() => setShowPassword(!showPassword)}
                                     className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:text-zinc-300 transition-colors"
                                  >
                                     {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                  </button>
                               </div>
                               {inlineAuthMode === 'register' && (
                                  <div className="relative">
                                     <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={16} />
                                     <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={authConfirmPassword}
                                        onChange={(e) => setAuthConfirmPassword(e.target.value)}
                                        placeholder="Confirm"
                                        required
                                        className="w-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg py-2 pr-9 pl-9 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:text-zinc-500 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 transition-all"
                                     />
                                     <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:text-zinc-300 transition-colors"
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
                                              : 'border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:border-zinc-600'
                                        }`}
                                     >
                                        Male
                                     </button>
                                     <button
                                        type="button"
                                        onClick={() => setAuthGender('female')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                                           authGender === 'female'
                                              ? 'border-indigo-600 bg-indigo-600/10 text-indigo-400'
                                              : 'border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:border-zinc-600'
                                        }`}
                                     >
                                        Female
                                     </button>
                                  </div>
                                  <div className="relative">
                                     <MapPin className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={16} />
                                     <input
                                        type="text"
                                        value={authRegion}
                                        onChange={(e) => setAuthRegion(e.target.value)}
                                        placeholder="Region (Optional)"
                                        className="w-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg py-2 pr-9 pl-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:text-zinc-500 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 transition-all"
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
                                           : 'border-slate-200 dark:border-zinc-700 hover:border-zinc-600'
                                     }`}
                                  >
                                     <UserIcon className={`mx-auto mb-1 ${authRole === 'user' ? 'text-indigo-400' : 'text-slate-400 dark:text-zinc-500'}`} size={18} />
                                     <div className={`text-xs font-medium ${authRole === 'user' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-zinc-400'}`}>User</div>
                                  </button>
                                  <button
                                     type="button"
                                     onClick={() => setAuthRole('tailor')}
                                     className={`p-2.5 rounded-lg border transition-all ${
                                        authRole === 'tailor'
                                           ? 'border-indigo-600 bg-indigo-600/10'
                                           : 'border-slate-200 dark:border-zinc-700 hover:border-zinc-600'
                                     }`}
                                  >
                                     <Sparkles className={`mx-auto mb-1 ${authRole === 'tailor' ? 'text-indigo-400' : 'text-slate-400 dark:text-zinc-500'}`} size={18} />
                                     <div className={`text-xs font-medium ${authRole === 'tailor' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-zinc-400'}`}>Tailor</div>
                                  </button>
                               </div>
                            )}

                            {/* Submit button */}
                            <button
                               type="submit"
                               disabled={authSubmitting}
                               className="w-full bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
                            >
                               {authSubmitting ? (
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                               ) : (
                                  <>
                                     {inlineAuthMode === 'login' ? 'Log In' : 'Create Account'}
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

  
  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!deleteAIOnly && !deleteAccountRequested) {
        setDeleteError('Please select at least one item to delete.');
        return;
    }

    // Safety check: Cannot delete account if active orders exist
    if (deleteAccountRequested && hasActiveOrders) {
        setDeleteError('Cannot delete account while you have active orders.');
        return;
    }

    // Safety check: Cannot delete account if history exists (as per user privacy rule)
    if (deleteAccountRequested && hasHistory) {
        setDeleteError('Account deletion is restricted due to existing order history. You can still clear AI history.');
        return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    try {
        if (deleteAccountRequested) {
            await firebaseService.permanentlyDeleteAccount(user.id);
            await logout();
            navigate('/');
        } else {
            // Delete AI history only
            await firebaseService.deleteUserAIHistory(user.id);
            setShowDeleteConfirm(false);
            // Optional: Show success message or toast
        }
    } catch (error: any) {
        console.error('Account deletion logic failed:', error);
        if (error.message === 'REAUTHENTICATION_REQUIRED') {
            setDeleteError('For security, please log out and log in again before this action.');
        } else {
            setDeleteError('Action failed. Some items might be pending or locked.');
        }
    } finally {
        setIsDeleting(false);
    }
  };

  // --- Authenticated User View ---
  return (
    <div className="pb-16 pt-4 px-3 md:px-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-700 bg-slate-50 dark:bg-[#050817] text-slate-900 dark:text-slate-100">
      
      {/* 1. Slim Profile Header */}
      <div className="relative group overflow-hidden bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/60 rounded-3xl p-6 md:p-8 transition-all hover:bg-slate-50 dark:hover:bg-zinc-900/60 shadow-sm dark:shadow-none">
         <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
            {/* Avatar Section */}
            <div className="relative shrink-0">
               <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden ring-1 ring-slate-200 dark:ring-zinc-800 shadow-xl">
                  <img 
                    src={optimisticAvatar || user?.profileImage || `https://ui-avatars.com/api/?name=${user?.name}&background=random`} 
                    alt="Profile" 
                    className="w-full h-full object-cover bg-slate-100 dark:bg-slate-100 dark:bg-zinc-800" 
                  />
               </div>
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="absolute -bottom-2 -left-2 bg-zinc-100 text-zinc-900 p-2 rounded-lg shadow-lg hover:scale-105 transition-transform"
               >
                  <Camera size={14} />
               </button>
               <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
            </div>

            {/* Info Section */}
            <div className="flex-1 text-center md:text-left">
               {isEditing ? (
                   <div className="space-y-4 max-w-sm mx-auto md:mx-0">
                       <input 
                          type="text" 
                          value={name} 
                          onChange={(e) => setName(e.target.value)} 
                          className="w-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl py-2 px-4 text-slate-900 dark:text-zinc-100 font-bold focus:ring-1 focus:ring-indigo-500/50 outline-none"
                          placeholder="Your Name"
                       />
                       <div className="flex gap-2">
                           <input 
                              type="tel" 
                              value={phone} 
                              onChange={(e) => setPhone(e.target.value)} 
                              className="w-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl py-2 px-4 text-slate-900 dark:text-zinc-100 text-sm focus:ring-1 focus:ring-indigo-500/50 outline-none"
                              placeholder="Phone Number"
                           />
                           <select
                              value={region}
                              onChange={(e) => setRegion(e.target.value)}
                              className="w-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl py-2 px-4 text-slate-900 dark:text-zinc-100 text-sm focus:ring-1 focus:ring-indigo-500/50 outline-none"
                           >
                              <option value="">Region</option>
                              {regions.map(r => (
                                <option key={r.id} value={r.name}>{r.name}</option>
                              ))}
                           </select>
                       </div>
                       <div className="flex gap-2 pt-2">
                           <button onClick={handleSaveProfile} className="flex-1 bg-white text-black py-2 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors">Save</button>
                           <button onClick={() => setIsEditing(false)} className="px-4 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:text-white transition-colors text-sm font-medium">Cancel</button>
                       </div>
                   </div>
               ) : (
                   <div className="space-y-3">
                       <div className="flex flex-col md:flex-row items-center gap-3">
                          <h2 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-white">{user?.name}</h2>
                          {user?.tier === 'gold' && (
                             <span className="bg-amber-400/10 text-amber-300 border border-amber-400/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <Crown size={12} fill="currentColor" /> Gold Member
                             </span>
                          )}
                       </div>
                       
                       <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-slate-500 dark:text-zinc-400 text-xs">
                          <p>{user?.email}</p>
                          {user?.phone && <span>•</span>}
                          {user?.phone && <p>{user.phone}</p>}
                          {user?.region && <span>•</span>}
                          {user?.region && <p>{user.region}</p>}
                       </div>

                       <div className="pt-3">
                         
                          <button 
                            onClick={() => !hasActiveOrders && setIsEditing(true)} 
                            disabled={hasActiveOrders}
                            className={`px-4 py-1.5 rounded-lg border transition-all text-xs font-bold flex items-center gap-2 shadow-sm dark:shadow-none ${
                                hasActiveOrders 
                                ? 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed' 
                                : 'border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                            }`}
                          >
                             {hasActiveOrders ? <Lock size={13} /> : <Edit2 size={13} />}
                             Edit Profile {hasActiveOrders && '(Locked)'}
                          </button>
                          {hasActiveOrders && (
                             <p className="mt-2 text-[10px] text-zinc-500 font-medium italic">
                                Profile changes are disabled while you have active orders.
                             </p>
                          )}
                       </div>
                   </div>
               )}
            </div>

            {/* Stats & Actions Section */}
            <div className="flex flex-col gap-4">
               {/* Clickable Quick Stats */}
               <div className="flex gap-10 md:gap-14 px-6 py-3 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-slate-100 dark:border-zinc-800/30 w-fit mx-auto md:mx-0 shadow-inner dark:shadow-none">
                  <div className="text-center">
                     <span className="block text-xl font-bold text-slate-900 dark:text-white">{orders.length}</span>
                     <span className="text-[10px] text-slate-500 dark:text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-semibold">Orders</span>
                  </div>
                  <button 
                    onClick={() => navigate('/transaction-history')} 
                    className="text-center group/stat hover:opacity-80 transition-opacity"
                    title="View Transaction History"
                  >
                     <span className="block text-xl font-bold text-indigo-400">{user?.credits || 0}</span>
                     <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-semibold group-hover/stat:text-indigo-300 transition-colors">Credits</span>
                  </button>
               </div>

               {/* Quick Action Icons */}
               <div className="flex gap-3 justify-center md:justify-start">
                  <button 
                    onClick={() => setShowSecuritySettings(!showSecuritySettings)} 
                    className={`p-2.5 rounded-xl border transition-all shadow-sm ${showSecuritySettings ? 'bg-indigo-600 border-indigo-500 text-slate-900 dark:text-white' : 'bg-slate-50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white'}`}
                    title="Account Settings"
                  >
                     <Settings size={18} />
                  </button>
                  <button 
                    onClick={() => setShowLogoutConfirm(true)} 
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 hover:bg-rose-500/20 hover:border-rose-500/30 text-rose-500 dark:text-slate-400 dark:text-zinc-500 hover:text-rose-500 transition-all shadow-sm" 
                    title="Log Out"
                  >
                     <LogOut size={18} />
                  </button>
               </div>
            </div>
         </div>
         
         {/* Account & App Settings Dropdown */}
         {showSecuritySettings && (
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-zinc-800/50 animate-in slide-in-from-top-4 duration-500 space-y-8">
               
               {/* Change Password - One line compact */}
               <div className="max-w-3xl">
                  <h3 className="text-[11px] uppercase tracking-widest font-bold text-slate-400 dark:text-zinc-500 mb-3 flex items-center gap-2">
                     <Lock size={12} className="text-slate-500 dark:text-zinc-400" /> Security
                  </h3>
                  <form onSubmit={handleChangePassword} className="flex flex-col md:flex-row gap-2 items-stretch">
                     <div className="flex-1 relative">
                        <input 
                           type={showNewPass ? "text" : "password"} 
                           value={newPassword}
                           onChange={(e) => setNewPassword(e.target.value)}
                           className="w-full bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 rounded-xl py-2 pl-4 pr-10 text-xs text-slate-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all font-mono"
                           placeholder="New Password"
                           required
                        />
                        <button 
                           type="button"
                           onClick={() => setShowNewPass(!showNewPass)}
                           className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-slate-500 dark:text-zinc-400"
                        >
                           {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                     </div>
                     <div className="flex-1 relative">
                        <input 
                           type={showConfirmPass ? "text" : "password"} 
                           value={confirmNewPassword}
                           onChange={(e) => setConfirmNewPassword(e.target.value)}
                           className="w-full bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 rounded-xl py-2 pl-4 pr-10 text-xs text-slate-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all font-mono"
                           placeholder="Confirm New"
                           required
                        />
                        <button 
                           type="button"
                           onClick={() => setShowConfirmPass(!showConfirmPass)}
                           className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-slate-500 dark:text-zinc-400"
                        >
                           {showConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                     </div>
                     <button 
                        type="submit" 
                        disabled={passwordChanging}
                        className="bg-zinc-100 hover:bg-white text-black px-6 py-2 rounded-xl text-[11px] font-bold transition-all disabled:opacity-50 shrink-0"
                     >
                        {passwordChanging ? 'Updating...' : 'Update Password'}
                     </button>
                  </form>
               </div>

               {/* App Preferences */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Theme Selection */}
                  <div>
                     <h3 className="text-[11px] uppercase tracking-widest font-bold text-slate-400 dark:text-zinc-500 mb-3 flex items-center gap-2">
                        <Monitor size={12} className="text-slate-500 dark:text-zinc-400" /> Appearance
                     </h3>
                     <div className="flex bg-slate-50 dark:bg-zinc-900/50 p-1 rounded-xl border border-slate-200 dark:border-zinc-800/50 w-fit">
                        {[
                           { id: 'system', icon: Monitor, label: 'System' },
                           { id: 'light', icon: Sun, label: 'Light' },
                           { id: 'dark', icon: Moon, label: 'Dark' }
                        ].map((t) => (
                           <button
                              key={t.id}
                              onClick={() => handleSaveSettings({ theme: t.id })}
                              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                 appTheme === t.id ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white shadow-lg' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:text-zinc-300'
                              }`}
                           >
                              <t.icon size={12} />
                              {t.label}
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Language Selection */}
                  <div>
                     <h3 className="text-[11px] uppercase tracking-widest font-bold text-slate-400 dark:text-zinc-500 mb-3 flex items-center gap-2">
                        <Globe size={12} className="text-slate-500 dark:text-zinc-400" /> Language
                     </h3>
                     <div className="flex bg-slate-50 dark:bg-zinc-900/50 p-1 rounded-xl border border-slate-200 dark:border-zinc-800/50 w-fit flex-wrap gap-1">
                        {[
                           { id: 'en', label: 'English' },
                           { id: 'ar', label: 'العربية' },
                           { id: 'fr', label: 'Français' }
                        ].map((l) => (
                           <button
                              key={l.id}
                              onClick={() => handleSaveSettings({ language: l.id })}
                              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                 i18n.language === l.id ? 'bg-indigo-600 text-slate-900 dark:text-white shadow-lg' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:text-zinc-300'
                              }`}
                           >
                              {l.label}
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="pt-4 mt-2 border-t border-rose-500/10 dark:border-rose-500/5">
                     <h3 className="text-[11px] uppercase tracking-widest font-bold text-rose-500 mb-2 flex items-center gap-2">
                        <AlertTriangle size={12} /> Danger Zone
                     </h3>
                     <button 
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold text-rose-500 hover:bg-rose-500/10 transition-all border border-rose-500/20 shadow-sm"
                     >
                        <Trash2 size={12} />
                        Delete Account Permanently
                     </button>
                     <p className="mt-2 text-[9px] text-slate-500 dark:text-zinc-500 leading-relaxed">
                        This will permanently erase your profile, designs, orders, and credit history.
                     </p>
                  </div>
               </div>
            </div>
         )}
      </div>

      {/* 2. Compact Quick Actions Grid - Now in one row */}
      <div className="grid grid-cols-4 gap-2 md:gap-4">
         {[
            { icon: Ruler, label: 'Measurements', sub: 'Your Fit', action: () => navigate('/measurements'), color: 'text-indigo-400', bg: 'bg-indigo-400/5' },
            { icon: Users, label: 'Family', sub: familyMembers.length + ' Profiles', action: () => {}, color: 'text-purple-400', bg: 'bg-purple-400/5' },
            { icon: Heart, label: 'Wishlist', sub: 'Favorites', action: () => {}, color: 'text-rose-400', bg: 'bg-rose-400/5' },
            { icon: Wallet, label: 'Wallet', sub: 'Payments', action: () => {}, color: 'text-emerald-400', bg: 'bg-emerald-400/5' }
         ].map((item, idx) => (
            <button key={idx} onClick={item.action} className="group relative flex flex-col items-center text-center bg-zinc-900/30 border border-slate-200 dark:border-zinc-800/40 p-2.5 md:p-4 rounded-2xl hover:bg-zinc-900/60 transition-all hover:border-slate-200 dark:border-zinc-700/60">
               <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl ${item.bg} flex items-center justify-center ${item.color} mb-2 md:mb-3 group-hover:scale-110 transition-transform`}>
                  <item.icon size={16} className="md:w-5 md:h-5" />
               </div>
               <h3 className="text-[9px] md:text-xs font-bold text-slate-900 dark:text-white mb-0.5 line-clamp-1">{item.label}</h3>
               <p className="hidden md:block text-[10px] text-slate-400 dark:text-zinc-500 line-clamp-1">{item.sub}</p>
            </button>
         ))}
      </div>

      {/* 3. Modern Orders List */}
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
               Active Orders
               <span className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded text-[10px] uppercase">{orders.filter(o => o.status !== 'completed').length}</span>
            </h3>
            <button className="text-[11px] text-slate-400 dark:text-zinc-500 font-bold hover:text-slate-900 dark:text-white transition-colors">
               VIEW ALL HISTORY
            </button>
         </div>

         {orders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {orders.slice(0, 4).map(order => (
                  <div 
                     key={order.id} 
                     onClick={() => navigate(`/order/${order.id}`)}
                     className="group bg-zinc-900/20 border border-slate-200 dark:border-zinc-800/40 rounded-2xl p-4 hover:bg-slate-50 dark:bg-zinc-900/40 transition-all cursor-pointer flex gap-4"
                  >
                     <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-zinc-800/50">
                        <img src={order.productImage} alt="Product" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     </div>
                     <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex justify-between items-start mb-1">
                           <h4 className="font-bold text-sm text-slate-900 dark:text-zinc-100 truncate">{order.productName}</h4>
                           <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-tight ${
                              order.status === 'delivered' || order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 
                              order.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                              order.status === 'rejected' || order.status === 'cancelled' ? 'bg-rose-500/10 text-rose-400' :
                              'bg-indigo-500/10 text-indigo-400'
                           }`}>
                              {order.status}
                           </span>
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500 mb-3">{order.tailorName}</p>
                        
                        <div className="w-full h-1 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                           <div 
                              className={`h-full rounded-full transition-all duration-1000 ${order.status === 'rejected' ? 'bg-rose-500' : 'bg-white'}`}
                              style={{ width: order.status === 'delivered' ? '100%' : '35%' }}
                           ></div>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         ) : (
            <div className="text-center py-16 bg-zinc-900/20 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800/50">
               <div className="w-16 h-16 bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-zinc-700">
                  <ShoppingBag size={24} />
               </div>
               <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">No active orders found</p>
               <button onClick={() => navigate('/')} className="mt-4 text-xs font-bold text-slate-900 dark:text-white hover:text-indigo-400 transition-colors uppercase tracking-widest">
                  Explore Gallery
               </button>
            </div>
         )}
      </div>

      {/* 4. Suggestions Section: Membership & Referral */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {/* Membership Card */}
         <div className="relative group overflow-hidden bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-2xl p-4">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-700" />
            <div className="relative z-10 flex items-start gap-3">
               <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <Crown size={20} />
               </div>
               <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">Membership</h3>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 mb-2 leading-tight">
                     Upgrade to unlock exclusive fabrics and priority tailoring.
                  </p>
                  <button className="flex items-center gap-1 text-[10px] font-bold text-slate-900 dark:text-white hover:text-indigo-400 transition-all uppercase tracking-wider">
                     Upgrade <ArrowRight size={12} />
                  </button>
               </div>
            </div>
         </div>

         {/* Share & Earn Card */}
         <div className="relative group overflow-hidden bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border border-emerald-500/20 rounded-2xl p-4">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-700" />
            <div className="relative z-10 flex items-start gap-3">
               <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Gift size={20} />
               </div>
               <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">Refer & Earn</h3>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 mb-2 leading-tight">
                     Get 50 free credits for every successful referral.
                  </p>
                  <button onClick={() => {
                     if (navigator.share) {
                        navigator.share({
                           title: 'Join Khuyoot',
                           text: 'Experience the future of tailoring with AI visualizers.',
                           url: window.location.origin
                        });
                     } else {
                        alert('Referral link copied!');
                     }
                  }} className="flex items-center gap-1 text-[10px] font-bold text-slate-900 dark:text-white hover:text-emerald-400 transition-all uppercase tracking-wider">
                     Invite <Share2 size={12} />
                  </button>
               </div>
            </div>
         </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
            <div className="relative bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-300">
               <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <LogOut size={32} />
               </div>
               <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Confirm Log Out</h3>
               <p className="text-slate-500 dark:text-zinc-400 text-center text-sm mb-8">Are you sure you want to log out of your Khuyoot account?</p>
               <div className="flex gap-3">
                  <button 
                     onClick={() => setShowLogoutConfirm(false)}
                     className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-bold text-sm hover:bg-zinc-700 transition-colors"
                  >
                     Cancel
                  </button>
                  <button 
                     onClick={async () => {
                        await logout();
                        navigate('/', { replace: true });
                     }}
                     className="flex-1 py-3 rounded-xl bg-rose-500 text-slate-900 dark:text-white font-bold text-sm hover:bg-rose-600 transition-colors shadow-lg shadow-rose-900/20"
                  >
                     Log Out
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
         <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => !isDeleting && setShowDeleteConfirm(false)} />
            <div className="relative bg-zinc-900 border border-rose-500/30 p-8 rounded-3xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-300">
               <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle size={32} />
               </div>
               
                <h3 className="text-xl font-bold text-white text-center mb-2">Delete Data?</h3>
                <p className="text-zinc-400 text-center text-sm mb-6">
                   Select what you would like to permanently remove from your account. 
                </p>

                <div className="space-y-3 mb-8">
                   <label className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${deleteAIOnly ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-zinc-800/50 border-zinc-800'}`}>
                      <div className="pt-0.5">
                         <input 
                            type="checkbox" 
                            checked={deleteAIOnly} 
                            onChange={(e) => setDeleteAIOnly(e.target.checked)}
                            className="w-4 h-4 accent-indigo-500 bg-zinc-700 border-zinc-600 rounded"
                         />
                      </div>
                      <div className="flex-1">
                         <p className="text-xs font-bold text-white mb-0.5 flex items-center gap-2">
                           <Sparkles size={12} className="text-indigo-400" /> Clear AI History
                         </p>
                         <p className="text-[10px] text-zinc-500 leading-relaxed">Permanent removal of AI generations, design history, and presets.</p>
                      </div>
                   </label>

                   <label className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                      hasHistory || hasActiveOrders
                      ? 'bg-zinc-900/50 border-zinc-800 opacity-60 cursor-not-allowed'
                      : deleteAccountRequested ? 'bg-rose-500/10 border-rose-500/30' : 'bg-zinc-800/50 border-zinc-800 cursor-pointer'
                   }`}>
                      <div className="pt-0.5">
                         <input 
                            type="checkbox" 
                            checked={deleteAccountRequested}
                            disabled={hasHistory || hasActiveOrders}
                            onChange={(e) => setDeleteAccountRequested(e.target.checked)}
                            className="w-4 h-4 accent-rose-500 bg-zinc-700 border-zinc-600 rounded disabled:opacity-30"
                         />
                      </div>
                      <div className="flex-1">
                         <p className="text-xs font-bold text-white mb-0.5 flex items-center gap-2">
                            <AlertTriangle size={12} className="text-rose-500" /> Permanently Delete Account
                         </p>
                         <p className="text-[10px] text-zinc-500 leading-relaxed">
                            {hasActiveOrders 
                               ? 'Disabled while orders are active.' 
                               : hasHistory 
                                  ? 'Restricted due to historical orders.' 
                                  : 'Full deletion of profile and all data.'
                            }
                         </p>
                      </div>
                   </label>
                </div>
               
               {deleteError && (
                  <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[11px] text-center font-medium">
                     {deleteError}
                  </div>
               )}

               <div className="flex flex-col gap-3">
                  <button 
                     disabled={isDeleting}
                     onClick={handleDeleteAccount}
                     className="w-full py-4 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                     {isDeleting ? (
                        <>
                           <Sparkles className="animate-spin" size={16} />
                           Erasing Data...
                        </>
                     ) : deleteAccountRequested ? 'Yes, Delete Everything' : 'Clear AI History'}
                  </button>
                  <button 
                     disabled={isDeleting}
                     onClick={() => setShowDeleteConfirm(false)}
                     className="w-full py-3 rounded-xl bg-zinc-800 text-zinc-400 font-bold text-sm hover:text-white transition-colors"
                  >
                     Cancel
                  </button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};
