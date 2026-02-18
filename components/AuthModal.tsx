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
import { getAuthPromptEventName } from '../src/auth/authEvents';

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
          className={`w-full border rounded-md md:rounded-lg py-2.5 pr-11 ${isPasswordField ? 'pl-12' : 'pl-4'} text-sm font-medium placeholder:text-slate-500/70 focus:ring-2 shadow-sm transition-all ${className}`}
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
  const [showForm, setShowForm] = useState(true);
  // Quick access developer accounts menu removed
  const [submitting, setSubmitting] = useState(false);
  const openedFromAuthRecoveryRef = React.useRef(false);
  const isAuthModalOpenRef = React.useRef(false);

  // Keep a ref in sync to avoid re-attaching event listeners on every render.
  useEffect(() => {
    isAuthModalOpenRef.current = isAuthModalOpen;
  }, [isAuthModalOpen]);
  
  // IMPORTANT: do NOT auto-navigate on close.
  // The modal is also opened programmatically (e.g., session-expired prompts).
  // Auto-navigation was causing DesignerV2_1 to lose state in a loop.
  
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const specialization = tailorGender ? tailorGenderToSpecialization(tailorGender) : undefined;
  // Guided fallback state when phone matches a user without email
  const [fallbackUid, setFallbackUid] = useState<string>('');
  const [fallbackUserData, setFallbackUserData] = useState<any>(null);
  const [fallbackEmail, setFallbackEmail] = useState<string>('');
  const [showFallback, setShowFallback] = useState(false);
  const allowRegistrations = appSettings?.allowNewRegistrations !== false;
  const [specializationError, setSpecializationError] = useState('');

  const resetTransientAuthState = React.useCallback(() => {
    setSubmitting(false);
    setStatusText('');
    setSpecializationError('');
    setFallbackUid('');
    setFallbackUserData(null);
    setFallbackEmail('');
    setShowFallback(false);
  }, []);

  const resetRegisterFormState = React.useCallback(() => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setRole('user');
    setShopType('tailor');
    setGender('not_specified');
    setAgeGroup('not_specified');
    setRegion('');
    setPhone('');
    setLocation('');
    setExperience('');
    setTailorGender('');
    resetTransientAuthState();
  }, [resetTransientAuthState]);

  const handleCloseAuthModal = React.useCallback(() => {
    if (!isLogin) {
      resetRegisterFormState();
    } else {
      resetTransientAuthState();
    }
    toggleAuthModal(false);
    setShowForm(false);
  }, [isLogin, resetRegisterFormState, resetTransientAuthState, toggleAuthModal]);

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
    if (!isLogin) {
      resetRegisterFormState();
      return;
    }
    setPassword('');
    setConfirmPassword('');
    resetTransientAuthState();
  }, [isLogin, resetRegisterFormState, resetTransientAuthState]);

  // Clear tailorGender when role changes to user
  useEffect(() => {
    if (role !== 'tailor') {
      setTailorGender('');
      setSpecializationError('');
    }
  }, [role]);

  const loadRegions = async () => {
    try {
      const data = await firebaseService.getPopularRegions();
      setRegions(data.filter(r => r.enabled).sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('Error loading regions:', error);
    }
  };

  useEffect(() => {
    loadRegions();
  }, []);

  // Listen for 'openAuthModal' event from Footer
  useEffect(() => {
    const handleOpenAuthModal = (e: Event) => {
      const detail = (e as CustomEvent)?.detail as any;
      const reason = String(detail?.reason || '').toLowerCase();
      openedFromAuthRecoveryRef.current =
        reason === 'sessionexpired' ||
        reason === 'session_expired' ||
        reason === 'session-expired' ||
        reason === 'signedout' ||
        reason === 'signed_out' ||
        reason === 'signed-out';

      console.log('🎯 openAuthModal event received, current state:', isAuthModalOpenRef.current, { reason });
      const isUserAction = reason === 'user_action' || reason === 'user-action';
      if (!isUserAction) {
        return;
      }
      if (!isAuthModalOpenRef.current) {
        console.log('📖 Opening auth modal for user action...');
        toggleAuthModal(true);
      } else {
        console.log('⚠️ Modal already open, skipping');
      }
    };

    window.addEventListener('openAuthModal', handleOpenAuthModal);
    window.addEventListener(getAuthPromptEventName(), handleOpenAuthModal);
    
    return () => {
      window.removeEventListener('openAuthModal', handleOpenAuthModal);
      window.removeEventListener(getAuthPromptEventName(), handleOpenAuthModal);
    };
  }, [toggleAuthModal]);

  // If this modal was opened because the session looked expired, auto-close it once Firebase Auth is restored.
  useEffect(() => {
    if (!isAuthModalOpen) return;
    if (!openedFromAuthRecoveryRef.current) return;
    if (submitting) return;

    const fbUid = (firebaseService as any)?.auth?.currentUser?.uid;
    if (!fbUid) return;

    console.log('✅ Firebase Auth restored while modal open; closing auth modal', { fbUid });
    openedFromAuthRecoveryRef.current = false;
    toggleAuthModal(false);
  }, [isAuthModalOpen, submitting, toggleAuthModal, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusText('جاري التحقق من بيانات الاعتماد...');
    
    try {
      if (isLogin) {
        setStatusText('جاري تسجيل الدخول...');

        await login(email, password);
      } else {
        // Validate passwords match
        if (password !== confirmPassword) {
          alert('كلمات المرور غير متطابقة');
          setStatusText('');
          setSubmitting(false);
          return;
        }
        
        // التحقق من اختيار جنس الخياط (إلزامي)
        if (role === 'tailor' && !tailorGender) {
          setSpecializationError('يرجى اختيار تخصص الخياط (رجالي أو نسائي)');
          setStatusText('');
          setSubmitting(false);
          // Scroll to the specialization field
          setTimeout(() => {
            document.querySelector('[data-field="specialization"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
          return;
        }
        
        // رقم الهاتف مطلوب للجميع، معلومات إضافية للتجار فقط
        const merchantInfo = {
          phone, // رقم الهاتف لجميع المستخدمين
          gender, // الجنس لجميع المستخدمين
          ageGroup,
          region,
          ...(role === 'tailor' && {
            shopType,
            location,
            specialization,
            experience,
            tailorGender: tailorGender as 'male' | 'female' // جنس الخياط إلزامي
          })
        };
        
        // تحديد الدور الصحيح بناءً على نوع المتجر
        let actualRole: UserRole = 'user';
        if (role === 'tailor') {
          // تحويل shopType إلى role المناسب
          if (shopType === 'boutique') actualRole = 'boutique';
          else if (shopType === 'tailor') actualRole = 'tailor';
          else actualRole = 'user'; // fabric_store و sewing_supplies يصبحون مستخدمين عاديين حالياً
        }
        
        await register(email, password, name, actualRole, merchantInfo);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      const rawMessage = String(error?.originalMessage || error?.message || '');
      const isTimeout = rawMessage.toLowerCase().includes('timeout');
      const isNetwork = error?.code === 'auth/network-request-failed';

      if (isTimeout || isNetwork) {
        setStatusText('تعذر الاتصال. جاري فحص الشبكة...');
        const diag = await firebaseService.diagnoseAuthConnectivity();
        console.log('[AuthModal] Auth diagnostics after failure:', diag);

        const identityV1 = (diag as any).identityToolkitV1 ?? (diag as any).identityToolkit;
        const identityV3 = (diag as any).identityToolkitV3;

        const identityBlocked =
          (identityV1?.ok && identityV1?.status === 403) ||
          (identityV3?.ok && identityV3?.status === 403);

        if (!diag.online) {
          setStatusText('لا يوجد اتصال بالإنترنت. تأكد من الشبكة ثم أعد المحاولة.');
        } else if (!identityV1?.ok) {
          setStatusText('تعذر الاتصال بخدمة تسجيل الدخول. تحقق من الشبكة أو مانع الإعلانات.');
        } else if (identityBlocked) {
          setStatusText(
            'تم حظر تسجيل الدخول من Google (403). هذا يشير غالباً إلى أن API key عليه قيود API تمنع Identity Toolkit / Firebase Auth.\n' +
              'اذهب إلى Google Cloud Console → Credentials → API key ثم اسمح بـ Identity Toolkit API (أو Firebase Authentication API) أو أزل قيود API مؤقتاً، ثم أعد المحاولة.'
          );
        } else if (identityV3 && !identityV3.ok) {
          // Common case: www.googleapis.com blocked or returning non-CORS error pages, which the SDK can surface as network-request-failed.
          setStatusText('يبدو أن الشبكة تمنع www.googleapis.com (خدمة تسجيل الدخول). جرّب تعطيل مانع الإعلانات/الجدار الناري أو أضف http://localhost/* إلى قيود API key ثم أعد المحاولة.');
        } else {
          setStatusText('نظام تسجيل الدخول متاح لكن الاتصال عبر SDK معلّق. جرّب إعادة التحميل أو تعطيل مانع الإعلانات.');
        }
      } else {
        setStatusText('فشل تسجيل الدخول. تحقق من البريد/كلمة المرور.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthModalOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" data-overlay="khuyoot-modal">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={handleCloseAuthModal} />

      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleCloseAuthModal}
          className="absolute top-4 left-4 z-30 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-slate-300 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors shadow-sm"
          aria-label="إغلاق"
        >
          <X size={14} />
        </button>

        {/* Compact Header with Logo */}
        <div className="relative p-3 bg-slate-50/50 border-b border-slate-200 flex-shrink-0 flex items-center gap-4">
          <img
            src="/logo_big.png"
            alt="Khuyoot"
            className="w-14 h-14 flex-shrink-0"
            style={{ imageRendering: 'high-quality', objectFit: 'contain' }}
          />
          <div className="flex-1 text-right">
            <h2 className="text-sm font-black text-slate-800 mb-0.5 uppercase tracking-tight">مرحباً بك في خيوط</h2>
            <p className="text-[10px] text-slate-500 font-medium leading-tight">
              سجل دخولك للوصول إلى طلباتك ومقاساتك
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-5 text-center">
            <div className="transition-opacity duration-300">

              <div className="flex gap-1 mb-4 bg-slate-100/50 p-1 rounded-xl border border-dashed border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${isLogin ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'bg-transparent text-slate-500 hover:text-slate-800'}`}
                >
                  تسجيل الدخول
                </button>
                <button
                  type="button"
                  onClick={() => { if (allowRegistrations) setIsLogin(false); }}
                  disabled={!allowRegistrations}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${!isLogin ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'bg-transparent text-slate-500 hover:text-slate-800'} ${!allowRegistrations ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  حساب جديد
                </button>
              </div>

              <form id="auth-form" onSubmit={handleSubmit} className="space-y-2.5">
                {!isLogin && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <UserIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="الاسم"
                        required
                        className="w-full bg-white border border-dashed border-slate-300 rounded-lg py-2 pr-9 pl-4 text-[11px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-[var(--theme-primary)] focus:ring-0 focus:border-solid transition-all"
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="الهاتف (اختياري)"
                        className="w-full bg-white border border-dashed border-slate-300 rounded-lg py-2 pr-9 pl-4 text-[11px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-[var(--theme-primary)] focus:ring-0 focus:border-solid transition-all"
                      />
                    </div>
                  </div>
                )}

                  <div className="relative">
                    <Mail className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="البريد الإلكتروني"
                      required
                      className="w-full bg-white border border-dashed border-slate-300 rounded-lg py-2 pr-9 pl-4 text-[11px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-[var(--theme-primary)] focus:ring-0 focus:border-solid transition-all"
                    />
                  </div>

                <div className={`grid ${!isLogin ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                  <div className="relative">
                    <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="كلمة المرور"
                      required
                      className="w-full bg-white border border-dashed border-slate-300 rounded-lg py-2 pr-9 pl-9 text-[11px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-[var(--theme-primary)] focus:ring-0 focus:border-solid transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>

                  {!isLogin && (
                    <div className="relative">
                      <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="تأكيد"
                        required
                        className="w-full bg-white border border-dashed border-slate-300 rounded-lg py-2 pr-9 pl-9 text-[11px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-[var(--theme-primary)] focus:ring-0 focus:border-solid transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  )}
                </div>

                {!isLogin && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setGender('male')}
                        className={`relative flex-1 py-2 rounded-lg text-[11px] font-black border-2 transition-all ${gender === 'male' ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white shadow-md shadow-[var(--theme-primary)]/25 scale-[1.02]' : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'}`}
                      >
                        {gender === 'male' && <BadgeCheck size={12} className="absolute top-1.5 left-1.5 text-white" />}
                        ذكر
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender('female')}
                        className={`relative flex-1 py-2 rounded-lg text-[11px] font-black border-2 transition-all ${gender === 'female' ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white shadow-md shadow-[var(--theme-primary)]/25 scale-[1.02]' : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'}`}
                      >
                        {gender === 'female' && <BadgeCheck size={12} className="absolute top-1.5 left-1.5 text-white" />}
                        أنثى
                      </button>
                    </div>
                    <div className="relative">
                      <MapPin className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input
                        type="text"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        placeholder="المنطقة (اختياري)"
                        className="w-full bg-white border border-dashed border-slate-300 rounded-lg py-2 pr-9 pl-4 text-[11px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-[var(--theme-primary)] focus:ring-0 focus:border-solid transition-all"
                      />
                    </div>
                  </div>
                )}

                {!isLogin && (
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { key: 'user', label: 'مستخدم', icon: UserIcon },
                      { key: 'tailor', label: 'خياط', icon: Sparkles },
                    ] as const).map((item) => {
                      const ActiveIcon = item.icon;
                      const active = role === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setRole(item.key)}
                          className={`relative p-2.5 rounded-lg border-2 transition-all ${active ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/10 text-slate-900 shadow-sm shadow-[var(--theme-primary)]/20 ring-1 ring-[var(--theme-primary)]/30' : 'border-slate-300 bg-white hover:border-slate-400 text-slate-600'}`}
                        >
                          {active && <BadgeCheck size={13} className="absolute top-1.5 left-1.5 text-[var(--theme-primary)]" />}
                          <ActiveIcon className={`mx-auto mb-1 ${active ? 'text-[var(--theme-primary)]' : 'text-slate-400'}`} size={17} />
                          <div className={`text-[11px] font-black uppercase tracking-tight ${active ? 'text-[var(--theme-primary)]' : ''}`}>{item.label}</div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {!isLogin && role === 'tailor' && (
                  <div className="space-y-1.5" data-field="specialization">
                    <label className="block text-[10px] font-bold text-slate-600 mr-1 uppercase tracking-wider">
                      التخصص <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => { setTailorGender('male'); setSpecializationError(''); }}
                        className={`relative py-2 rounded-lg text-[11px] font-black border-2 transition-all ${tailorGender === 'male' ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white shadow-md shadow-[var(--theme-primary)]/25 scale-[1.01]' : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'} ${specializationError ? 'border-red-300' : ''}`}
                      >
                        {tailorGender === 'male' && <BadgeCheck size={12} className="absolute top-1.5 left-1.5 text-white" />}
                        رجالي
                      </button>
                      <button
                        type="button"
                        onClick={() => { setTailorGender('female'); setSpecializationError(''); }}
                        className={`relative py-2 rounded-lg text-[11px] font-black border-2 transition-all ${tailorGender === 'female' ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white shadow-md shadow-[var(--theme-primary)]/25 scale-[1.01]' : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'} ${specializationError ? 'border-red-300' : ''}`}
                      >
                        {tailorGender === 'female' && <BadgeCheck size={12} className="absolute top-1.5 left-1.5 text-white" />}
                        نسائي
                      </button>
                    </div>
                    {specializationError && (
                      <div className="flex items-center gap-1.5 text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-2.5 py-1.5 rounded-lg">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-[10px] font-semibold">{specializationError}</span>
                      </div>
                    )}
                  </div>
                )}

                {statusText && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-xl">
                    <CheckCircle size={16} />
                    <span>{statusText}</span>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Fixed Footer with Submit Button */}
        <div className="flex-shrink-0 p-4 bg-slate-50/50 border-t border-slate-200">
          <button
            type="submit"
            form="auth-form"
            disabled={submitting}
            className="w-full bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-dark)] text-white py-2 rounded-lg text-xs font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[var(--theme-primary)]/20"
          >
            {submitting ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? 'تسجيل الدخول' : 'إنشاء الحساب'}
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
