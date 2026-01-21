import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  X, Mail, Lock, User as UserIcon, Scissors, Store, MapPin, 
  Phone, Zap, ArrowRight, CheckCircle, Sparkles, Box, ChevronRight,
  ShieldCheck, BadgeCheck, Calendar, Eye, EyeOff
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole, ShopType, Gender, AgeGroup, PopularRegion } from '../types';
import { tailorGenderToSpecialization } from '../utils/specializationHelper';
import { firebaseService } from '../services/firebase';

const ageGroupOptions: { value: AgeGroup; label: string }[] = [
  { value: 'not_specified', label: 'أفضل عدم التحديد' },
  { value: '18-23', label: '18-23 سنة' },
  { value: '24-30', label: '24-30 سنة' },
  { value: '31-40', label: '31-40 سنة' },
];

// --- Types ---
interface ModernInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ElementType;
  label?: string;
  className?: string;
  enablePasswordToggle?: boolean;
}

// --- Components ---
const ModernInput = React.memo(({ icon: Icon, label, className, enablePasswordToggle, ...props }: ModernInputProps) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const isPasswordField = props.type === 'password' && enablePasswordToggle;
  const effectiveType = isPasswordField && showPassword ? 'text' : props.type;

  return (
    <div className="group space-y-1.5 w-full">
      {label && (
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 right-0 pl-3 flex items-center pr-4 pointer-events-none text-slate-400 group-focus-within:transition-colors" style={{color: 'var(--brand-color, #469788)'}}>
          <Icon size={18} />
        </div>
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 left-2 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
            aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
        <input
          {...props}
          type={effectiveType}
          style={{
            backgroundColor: '#1e293b',
            color: '#ffffff',
            borderColor: '#475569',
          }}
          className={`w-full border rounded-lg py-2.5 pr-11 ${isPasswordField ? 'pl-12' : 'pl-4'} text-sm font-medium placeholder:text-slate-500/70 focus:ring-2 shadow-sm transition-all ${className}`}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#469788';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#475569';
          }}
        />
      </div>
    </div>
  );
});

// Simple Section Header Component
const SectionLabel = ({ title }: { title: string }) => (
    <div className="flex items-center gap-2 mb-3 mt-1 pb-1 border-b border-slate-100 dark:border-slate-800">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
    </div>
);

// Dev accounts removed per request

export const AuthModal = () => {
  const { isAuthModalOpen, toggleAuthModal, login, register, loading, authModalMode, user, appSettings } = useApp();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  // Quick access developer accounts menu removed
  const [submitting, setSubmitting] = useState(false);
  const [wasOpen, setWasOpen] = useState(false);
  
  // Navigate after successful login/registration
  useEffect(() => {
    // Track if modal was open
    if (isAuthModalOpen) {
      setWasOpen(true);
    }
    
    // If modal just closed and we have a user (login success)
    if (!isAuthModalOpen && wasOpen && user) {
      console.log('✅ Login successful, navigating to account...', { userId: user.id, role: user.role });
      setWasOpen(false);
      
      // Small delay to ensure state propagates
      setTimeout(() => {
        navigate('/account', { replace: true });
      }, 150);
    }
  }, [isAuthModalOpen, user, wasOpen, navigate]);
  
  // Debug logging to track modal state
  useEffect(() => {
    console.log('🔍 AuthModal state:', { isAuthModalOpen, isLogin, submitting });
  }, [isAuthModalOpen, isLogin, submitting]);
  
  // Fail-safe: if submitting gets stuck, clear after 12s
  useEffect(() => {
    if (!submitting) return;
    const t = setTimeout(() => setSubmitting(false), 12000);
    return () => clearTimeout(t);
  }, [submitting]);

  // Manage modal-open class on body to prevent cleanup from removing modal
  useEffect(() => {
    if (isAuthModalOpen) {
      document.body.classList.add('modal-open');
      return () => {
        document.body.classList.remove('modal-open');
      };
    }
  }, [isAuthModalOpen]);

  const [regions, setRegions] = useState<PopularRegion[]>([]);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [shopType, setShopType] = useState<ShopType>('tailor');
  const [gender, setGender] = useState<Gender>('not_specified');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('not_specified');
  const [region, setRegion] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');
  const [tailorGender, setTailorGender] = useState<'male' | 'female' | ''>('');
  const [statusText, setStatusText] = useState('');
  // Guided fallback state when phone matches a user without email
  const [fallbackUid, setFallbackUid] = useState<string>('');
  const [fallbackUserData, setFallbackUserData] = useState<any>(null);
  const [fallbackEmail, setFallbackEmail] = useState<string>('');
  const [showFallback, setShowFallback] = useState(false);
  const allowRegistrations = appSettings?.allowNewRegistrations !== false;

  // Sync local mode with context mode when it changes
  React.useEffect(() => {
    if (authModalMode === 'register' && allowRegistrations) {
      setIsLogin(false);
    } else {
      setIsLogin(true);
    }
  }, [authModalMode, allowRegistrations]);

  // Prefill email/phone from localStorage when modal opens
  useEffect(() => {
    if (!isAuthModalOpen) return;
    try {
      const prefill = localStorage.getItem('prefillLoginPhone');
      if (prefill) {
        setEmail(prefill);
        localStorage.removeItem('prefillLoginPhone');
        // Ensure we're in login mode
        setIsLogin(true);
      }
    } catch {}
  }, [isAuthModalOpen]);

  useEffect(() => {
    setPassword('');
    setConfirmPassword('');
  }, [isLogin]);

  useEffect(() => {
    loadRegions();
  }, []);

  // Manage body scroll lock - critical for preventing overlay persistence
  useEffect(() => {
    if (isAuthModalOpen) {
      // Lock body scroll when modal opens using class
      document.body.classList.add('modal-open');
      console.log('🔒 Body scroll locked (class added)');
      
      return () => {
        // Always remove lock class on cleanup
        document.body.classList.remove('modal-open');
        console.log('🔓 Body scroll unlocked (class removed)');
      };
    } else {
      // Ensure lock is removed when modal closes
      document.body.classList.remove('modal-open');
    }
  }, [isAuthModalOpen]);

  // Global escape key handler
  useEffect(() => {
    if (!isAuthModalOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        toggleAuthModal(false);
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isAuthModalOpen, toggleAuthModal]);

  // Force close modal on route change (navigation)
  useEffect(() => {
    if (!isAuthModalOpen) return;
    
    const handleLocationChange = () => {
      console.log('🚀 Route changed, closing auth modal');
      toggleAuthModal(false);
    };
    
    // Listen for popstate (back/forward button)
    window.addEventListener('popstate', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [isAuthModalOpen, toggleAuthModal]);

  const loadRegions = async () => {
    try {
      const data = await firebaseService.getPopularRegions();
      setRegions(data.filter(r => r.enabled).sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('Error loading regions:', error);
    }
  };

  if (!isAuthModalOpen) return null;

  // Developer quick login removed

  const normalizePhone = (raw: string) => {
    let digits = (raw || '').replace(/[^0-9]/g, '');
    if (digits.startsWith('968')) digits = digits.slice(3);
    return digits;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔐 Login form submitted', { isLogin, email: email?.substring(0, 5) + '***' });
    
    if (!isLogin && password !== confirmPassword) { 
      alert('كلمة المرور غير متطابقة! يرجى التأكد من تطابق الحقلين.'); 
      return; 
    }
    if (!isLogin && role === 'tailor' && !tailorGender) { 
      alert('يرجى اختيار التخصص (رجالي/نسائي)'); 
      return; 
    }
    setSubmitting(true);
    try {
      //
      if (isLogin) {
        const input = email.trim();
        console.log('🔐 Login type detected:', input.includes('@') ? 'email' : 'phone');
        if (input.includes('@')) {
          setStatusText('يتم تسجيل الدخول...');
          console.log('🔐 Attempting email login...');
          await login(input, password);
          console.log('✅ Email login successful');
        } else {
          const phoneDigits = normalizePhone(input);
          //
          if (!phoneDigits) { alert('يرجى إدخال رقم هاتف صحيح'); setSubmitting(false); return; }
          setStatusText('يتم التحقق من الرقم...');
          // Try loginId first
          const candidates = [phoneDigits, `968${phoneDigits}`];
          //
          let found = null as Awaited<ReturnType<typeof firebaseService.findUserByLoginId>>;
          for (const cand of candidates) {
            found = await firebaseService.findUserByLoginId(cand);
            //
            if (found) break;
          }
          // Fallback to phone field for older accounts
          if (!found) {
            //
            for (const cand of candidates) {
              found = await firebaseService.findUserByPhone(cand);
              //
              if (found) break;
            }
          }
          if (!found) { 
            alert('لا يوجد حساب مرتبط بهذا الرقم'); 
            setSubmitting(false); 
            return; 
          }
          //
          if (!found.email) {
            // Auto-assign temp email from phone and register credentials, or prompt if preferred
            setStatusText('إنشاء بريد مؤقت وربط الحساب...');
            try {
              const data = await firebaseService.getUserById(found.uid);
              setFallbackUid(found.uid);
              setFallbackUserData(data || {});
              const tempEmail = firebaseService.generateTempEmailFromPhone(phoneDigits);
              const nameToUse = (data && data.name) ? data.name : 'مستخدم';
              let roleToUse: UserRole = (data && data.role) ? (data.role as UserRole) : 'user';
              const merchantInfo: any = {
                phone: (data && data.phone) ? data.phone : phoneDigits,
                loginId: (data && data.loginId) ? data.loginId : phoneDigits,
                gender: data?.gender,
                region: data?.region,
                shopType: data?.shopType,
                location: data?.location,
                specialization: data?.specialization,
                experience: data?.experience,
                tailorGender: data?.tailorGender,
              };
              await register(tempEmail, password, nameToUse, roleToUse, merchantInfo);
              toggleAuthModal(false);
              return;
            } catch (e) {
              console.warn('Auto temp email register failed, falling back to manual entry', e);
              setShowFallback(true);
              setStatusText('أدخل بريد لربط الحساب ثم أكمل');
              setSubmitting(false);
              return;
            }
          }
          setStatusText('يتم تسجيل الدخول...');
          console.log('🔐 Phone login - found email:', found.email);
          await login(found.email, password);
          console.log('✅ Phone login successful');
        }
      } else {
        console.log('📝 Registration attempt...');
        // Build merchant info for all shop types
        const merchantInfo = { 
          phone, gender, region,
          loginId: phone ? normalizePhone(phone) : '',
          ...(role === 'user' && { ageGroup }), // Add age group for regular users
          ...(role === 'tailor' && { 
            shopType, // Always include shopType for merchants
            location, 
            experience, 
            specialization: tailorGender ? tailorGenderToSpecialization(tailorGender as 'male' | 'female') : [], 
            tailorGender: tailorGender as 'male' | 'female' 
          }) 
        };
        
        // Determine actual role based on shop type
        let actualRole: UserRole = 'user';
        if (role === 'tailor') {
            // Map shopType to appropriate role
            if (shopType === 'tailor') {
                actualRole = 'tailor';
            } else {
                actualRole = 'shop'; // All other types (boutique, fabric_store, etc.) are 'shop'
            }
        }
        
        await register(email, password, name, actualRole, merchantInfo);
        console.log('✅ Registration successful');
      }
      // Note: modal closure now handled by AppContext.login() on success
    } catch (error: any) { 
      console.error("❌ Auth error:", error);
      console.error("❌ Error code:", error?.code);
      console.error("❌ Error message:", error?.message);
      // AppContext.login/register already shows an alert, so we just unlock the UI
      setSubmitting(false);
      setStatusText('');
    } 
    finally { 
      console.log('🏁 Auth flow complete, submitting:', submitting);
      setSubmitting(false); 
    }
  };

  if (!isAuthModalOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 md:p-4 overflow-y-auto" data-overlay="khuyoot-modal">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity" onClick={() => toggleAuthModal(false)} />

      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-y-auto flex max-h-[80vh] animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
        
        {/* --- Right Section (Form) --- */}
        <div className="w-full md:w-3/5 flex flex-col relative z-10">
          
          <div className="px-3 py-2 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800">
             <div className="flex items-center">
                <img src="/logo_big.png" alt="Khuyoot" className="w-16 h-16 object-contain" />
             </div>
             <button onClick={() => toggleAuthModal(false)} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                <X size={18}/>
             </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 pt-2.5">
            
            <div className="mb-4 mt-1">
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
                {isLogin ? 'مرحباً بعودتك! 👋' : 'ابدأ رحلتك معنا 🚀'}
              </h1>
              <p className="text-slate-500 text-sm">
                {isLogin ? 'أدخل بياناتك للمتابعة حيث توقفت' : 'سجل الآن واستمتع بتجربة تفصيل عصرية'}
              </p>
            </div>

            {/* Toggle Switch */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-5 relative isolate">
              <div
                className={`absolute inset-y-1 w-[calc(50%-4px)] bg-white dark:bg-slate-700 rounded-xl shadow-sm transition-all duration-300 ease-out transform -z-10 ${
                  isLogin ? 'right-1' : 'left-1'
                }`}
              />
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
                  isLogin ? 'text-indigo-600 dark:text-white' : 'text-slate-500 dark:text-slate-300'
                }`}
              >
                تسجيل دخول
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!allowRegistrations) return;
                  setIsLogin(false);
                }}
                disabled={!allowRegistrations}
                className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
                  !allowRegistrations
                    ? 'text-slate-400 cursor-not-allowed'
                    : !isLogin
                      ? 'text-indigo-600 dark:text-white'
                      : 'text-slate-500 dark:text-slate-300'
                }`}
              >
                {allowRegistrations ? 'حساب جديد' : 'حساب جديد (مغلق)'}
              </button>
            </div>

            {!allowRegistrations && (
              <div className="mb-4 rounded-xl border px-4 py-3 text-xs" style={{borderColor: '#469788', backgroundColor: 'rgba(70, 151, 136, 0.1)', color: '#469788'}}>
                التسجيل للمستخدمين الجدد مغلق حالياً. يمكن للإدارة تفعيله من إعدادات النظام.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* --- Group 1: Identity & Credentials --- */}
              <div className="space-y-3">
                 {!isLogin && (
                    <ModernInput icon={UserIcon} label="الاسم الكامل" placeholder="مثال: محمد سعيد" value={name} onChange={(e) => setName(e.target.value)} required />
                 )}
                 
                 <ModernInput icon={Mail} label={isLogin ? "البريد الإلكتروني أو رقم الهاتف" : undefined} placeholder={isLogin ? "name@example.com أو 9xxxxxxx" : "name@example.com"} type="text" value={email} onChange={(e) => setEmail(e.target.value)} required />
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className={isLogin ? 'md:col-span-2' : ''}>
                      <ModernInput icon={Lock} label={isLogin ? "كلمة المرور" : undefined} placeholder="••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} enablePasswordToggle required />
                    </div>
                    {!isLogin && (
                      <ModernInput icon={ShieldCheck} placeholder="تأكيد كلمة المرور" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} enablePasswordToggle required />
                    )}
                 </div>
              </div>

              {/* --- Group 2: Registration Details (Hidden on Login) --- */}
              {!isLogin && (
                <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                  
                  {/* Personal Info Group */}
                  <div>
                      <SectionLabel title="معلومات التواصل" />
                      <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">رقم الهاتف</span>
                              <div className="flex-1">
                                <ModernInput icon={Phone} label={undefined} placeholder="9xxxxxxx" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                              </div>
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">الجنس</span>
                              <div className="flex flex-1 gap-2">
                                <button type="button" onClick={() => setGender('male')} className={`flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-2`} style={gender === 'male' ? {borderColor: '#469788', color: '#469788', backgroundColor: 'rgba(70, 151, 136, 0.1)'} : {borderColor: '#e2e8f0', color: '#64748b'}}>ذكر</button>
                                <button type="button" onClick={() => setGender('female')} className={`flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-2`} style={gender === 'female' ? {borderColor: '#469788', color: '#469788', backgroundColor: 'rgba(70, 151, 136, 0.1)'} : {borderColor: '#e2e8f0', color: '#64748b'}}>أنثى</button>
                              </div>
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <MapPin size={12} /> المنطقة/الولاية (اختياري)
                              </span>
                              <div className="flex-1">
                                <input
                                  list="regions-list"
                                  value={region}
                                  onChange={(e) => {
                                    const newRegion = e.target.value;
                                    const oldRegion = region;
                                    setRegion(newRegion);
                                    if (!location || location === oldRegion) {
                                      setLocation(newRegion);
                                    }
                                  }}
                                  placeholder="اختر أو اكتب منطقتك/ولايتك"
                                  className="w-full bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-indigo-100 rounded-xl py-3.5 px-4 text-sm font-medium text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-900 shadow-sm transition-all placeholder:text-slate-500/70"
                                />
                                <datalist id="regions-list">
                                  {regions.map((r) => (
                                    <option key={r.id} value={r.name} />
                                  ))}
                                </datalist>
                              </div>
                            </div>
                          </div>
                      </div>
                  </div>

                  {/* Age Group - Only for regular users */}
                  {role === 'user' && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        <Calendar size={12} />
                        <span>الفئة العمرية</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {ageGroupOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setAgeGroup(option.value)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all`}
                            style={ageGroup === option.value ? {borderColor: '#469788', backgroundColor: 'rgba(70, 151, 136, 0.1)', color: '#469788'} : {borderColor: '#cbd5e1', color: '#64748b'}}
                            aria-pressed={ageGroup === option.value}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Account Type Group */}
                  <div>
                    <SectionLabel title="نوع الحساب" />
                    <div className="grid grid-cols-2 gap-4">
                      <div onClick={() => setRole('user')} className={`cursor-pointer group relative p-4 rounded-2xl border-2 transition-all duration-200`} style={role === 'user' ? {borderColor: '#469788', backgroundColor: 'rgba(70, 151, 136, 0.1)'} : {borderColor: '#e2e8f0'}}>
                        <div className="flex justify-between items-start mb-2">
                           <div className={`p-2 rounded-xl`} style={role === 'user' ? {backgroundColor: '#469788', color: '#fff'} : {backgroundColor: '#fff', color: '#94a3b8', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}><UserIcon size={20}/></div>
                           {role === 'user' && <div className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor: '#469788'}}/>}
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">مستخدم</h3>
                        <p className="text-[10px] text-slate-500 mt-1">أبحث عن خياطين</p>
                      </div>

                      <div onClick={() => setRole('tailor')} className={`cursor-pointer group relative p-4 rounded-2xl border-2 transition-all duration-200`} style={role === 'tailor' ? {borderColor: '#469788', backgroundColor: 'rgba(70, 151, 136, 0.1)'} : {borderColor: '#e2e8f0'}}>
                        <div className="flex justify-between items-start mb-2">
                           <div className={`p-2 rounded-xl`} style={role === 'tailor' ? {backgroundColor: '#469788', color: '#fff'} : {backgroundColor: '#fff', color: '#94a3b8', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}><Store size={20}/></div>
                           {role === 'tailor' && <div className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor: '#469788'}}/>}
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">تاجر / خياط</h3>
                        <p className="text-[10px] text-slate-500 mt-1">أقدم خدماتي</p>
                      </div>
                    </div>
                  </div>

                  {/* Business Details (Tailor Only) */}
                  {role === 'tailor' && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-5 animate-in slide-in-from-top-2">
                       <div>
                         <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block flex items-center gap-1"><BadgeCheck size={12}/> نشاط المتجر</label>
                         <div className="grid grid-cols-2 gap-2">
                           {[
                             { val: 'tailor', lbl: 'خياط', ic: Scissors },
                             { val: 'boutique', lbl: 'بوتيك', ic: Sparkles },
                             { val: 'fabric_store', lbl: 'أقمشة', ic: Store },
                             { val: 'sewing_supplies', lbl: 'مستلزمات', ic: Box }
                           ].map((item) => (
                             <button 
                               key={item.val} type="button" onClick={() => setShopType(item.val as ShopType)} 
                               className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all`}
                               style={shopType === item.val ? {backgroundColor: '#469788', color: '#fff', borderColor: '#469788'} : {backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#64748b'}}
                             >
                               <item.ic size={16} style={{color: shopType === item.val ? '#fff' : '#469788'}}/> {item.lbl}
                             </button>
                           ))}
                         </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
                              <MapPin size={12} /> المدينة/الموقع
                            </label>
                            <input
                              type="text"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              placeholder="مثال: الخوير، مسقط"
                              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 text-slate-900 dark:text-white text-sm placeholder:text-slate-500/70"
                              onFocus={(e) => e.currentTarget.style.borderColor = '#469788'}
                              onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                            />
                            <p className="text-[10px] text-slate-400 mt-1">يمكنك تحديد موقع أكثر دقة</p>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">التخصص</label>
                             <div className="flex bg-white dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-700 items-center">
                               <button 
                                 type="button" 
                                 onClick={() => setTailorGender('male')} 
                                 className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all`}
                                 style={{backgroundColor: tailorGender === 'male' ? 'rgba(70, 151, 136, 0.2)' : 'transparent', color: tailorGender === 'male' ? '#469788' : '#94a3b8'}}
                               >
                                 رجالي
                               </button>
                               <div className="h-6 w-px mx-1" style={{backgroundColor: '#cbd5e1'}} aria-hidden="true"/>
                               <button 
                                 type="button" 
                                 onClick={() => setTailorGender('female')} 
                                 className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all`}
                                 style={{backgroundColor: tailorGender === 'female' ? 'rgba(70, 151, 136, 0.2)' : 'transparent', color: tailorGender === 'female' ? '#469788' : '#94a3b8'}}
                               >
                                 نسائي
                               </button>
                             </div>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button disabled={submitting} type="submit" className="group w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 dark:shadow-none hover:shadow-2xl hover:shadow-slate-300 dark:hover:shadow-slate-800/50 transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed">
                    {submitting ? <span className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full"/> : (
                    <>{isLogin ? 'تسجيل الدخول' : 'إنشاء الحساب'} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1" /></>
                    )}
                </button>
                {statusText && (<div className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">{statusText}</div>)}
                {showFallback && isLogin && (
                  <div className="mt-4 p-3 rounded-xl border" style={{borderColor: '#469788', backgroundColor: 'rgba(70, 151, 136, 0.1)', color: '#469788'}}>
                    <div className="text-sm font-bold mb-2">لا يوجد بريد مرتبط بهذا الحساب</div>
                    <div className="text-xs mb-2">أدخل بريدك الإلكتروني لإكمال ربط الحساب بهذا الرقم.</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={fallbackEmail}
                        onChange={(e) => setFallbackEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                      />
                      <button
                        type="button"
                        className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-bold disabled:opacity-60"
                        disabled={!fallbackEmail || submitting}
                        onClick={async () => {
                          if (!fallbackEmail || !password) { alert('يرجى إدخال البريد وكلمة المرور'); return; }
                          setSubmitting(true);
                          try {
                            const nameToUse = fallbackUserData?.name || 'مستخدم';
                            // Determine role: default to 'user' if missing
                            let roleToUse: UserRole = (fallbackUserData?.role as UserRole) || 'user';
                            // If merchant info exists, preserve it
                            const merchantInfo: any = {
                              phone: fallbackUserData?.phone || '',
                              loginId: fallbackUserData?.loginId || (fallbackUserData?.phone || ''),
                              gender: fallbackUserData?.gender,
                              region: fallbackUserData?.region,
                              shopType: fallbackUserData?.shopType,
                              location: fallbackUserData?.location,
                              specialization: fallbackUserData?.specialization,
                              experience: fallbackUserData?.experience,
                              tailorGender: fallbackUserData?.tailorGender,
                            };
                            await register(fallbackEmail, password, nameToUse, roleToUse, merchantInfo);
                            toggleAuthModal(false);
                          } catch (err) {
                            console.error('Fallback register error', err);
                            alert('فشل ربط البريد. يرجى المحاولة لاحقاً.');
                          } finally {
                            setSubmitting(false);
                          }
                        }}
                      >
                        ربط البريد وإكمال التسجيل
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>
            
            {/* Developer Mode removed */}

          </div>
        </div>

        {/* --- Left Section (Image) --- */}
          <div className="hidden md:block w-2/5 relative bg-slate-100">
           <img src="/auth-panel.jpg" alt="Tailoring Art" className="absolute inset-0 w-full h-full object-cover"/>
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
           <div className="absolute bottom-0 left-0 right-0 p-12 text-white rtl:text-right">
              <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium">
                 <Sparkles size={14} className="text-amber-400" />
                 <span>تصميم عصري 2025</span>
              </div>
              <h2 className="text-4xl font-extrabold leading-tight mb-4">
                 فصَل أناقتك <br/> <span className="text-transparent bg-clip-text" style={{backgroundImage: 'linear-gradient(to right, rgba(70, 151, 136, 0.6), #469788)'}}>بلمسة زر واحدة.</span>
              </h2>
           </div>
        </div>
      </div>
    </div>,
    document.body
  );
};