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
  const [showForm, setShowForm] = useState(false);
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const specialization = tailorGender ? tailorGenderToSpecialization(tailorGender) : undefined;
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
    const handleOpenAuthModal = () => {
      console.log('🎯 openAuthModal event received, current state:', isAuthModalOpen);
      if (!isAuthModalOpen) {
        console.log('📖 Opening auth modal...');
        toggleAuthModal(true); // Pass true to open the modal
      } else {
        console.log('⚠️ Modal already open, skipping');
      }
    };

    window.addEventListener('openAuthModal', handleOpenAuthModal);
    console.log('✅ Event listener attached for openAuthModal');
    
    return () => {
      window.removeEventListener('openAuthModal', handleOpenAuthModal);
      console.log('🗑️ Event listener removed for openAuthModal');
    };
  }, [isAuthModalOpen, toggleAuthModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        // Validate passwords match
        if (password !== confirmPassword) {
          alert('كلمات المرور غير متطابقة');
          setSubmitting(false);
          return;
        }
        
        // التحقق من اختيار جنس الخياط (إلزامي)
        if (role === 'tailor' && !tailorGender) {
          alert('يرجى اختيار تخصص الخياط (رجالي أو نسائي)');
          setSubmitting(false);
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
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthModalOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-6" data-overlay="khuyoot-modal">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity" onClick={() => { toggleAuthModal(false); setShowForm(false); }} />

      <div
        className="relative w-full max-w-md bg-zinc-900/90 text-white rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => { toggleAuthModal(false); setShowForm(false); }}
          className="absolute top-3 right-3 z-30 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
          aria-label="إغلاق"
        >
          <X size={14} />
        </button>

        {/* Hero image */}
        <div className="relative w-full h-48 md:h-56 overflow-visible">
          <img src="/auth-panel.jpg" alt="Khuyoot Tailoring" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent" />
        </div>

        {/* Title above logo */}
        <div className="absolute left-0 right-0 flex justify-center z-20 pointer-events-none select-none" style={{ top: 'calc(14rem - 6rem)' }}>
          <h2 className="text-sm md:text-base font-semibold text-zinc-100">مرحباً بك في </h2>
        </div>

        {/* Floating logo */}
        <div className="absolute left-0 right-0 flex justify-center z-20 pointer-events-none select-none" style={{ top: 'calc(12rem - 4.5rem)' }}>
          <img
            src="/logo_big.png"
            alt="Khuyoot"
            className="w-36 h-36 md:w-44 md:h-44 drop-shadow-2xl pointer-events-none select-none"
            style={{ imageRendering: 'high-quality', objectFit: 'contain' }}
          />
        </div>

        <div className="p-6 md:p-8 text-center pt-12 md:pt-14">
          {!showForm ? (
            <div className="transition-opacity duration-300">
              <p className="text-zinc-400 mb-5 md:mb-6 leading-relaxed text-xs md:text-sm">
                سجل دخولك الآن للوصول إلى طلباتك، مقاساتك، والتواصل مع أمهر الخياطين في المنطقة.
              </p>

              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setIsLogin(true); setShowForm(true); }}
                    className="py-2.5 bg-indigo-600/90 hover:bg-indigo-500/90 backdrop-blur-xl text-white rounded-lg font-normal text-sm shadow-xl shadow-indigo-900/30 hover:shadow-2xl hover:shadow-indigo-900/40 transition-all duration-300 transform active:scale-[0.98] border border-white/10"
                  >
                    تسجيل الدخول
                  </button>
                  <button
                    onClick={() => { if (allowRegistrations) { setIsLogin(false); setShowForm(true); }}}
                    disabled={!allowRegistrations}
                    className="py-2.5 bg-zinc-800/90 hover:bg-zinc-700/90 backdrop-blur-xl text-zinc-100 rounded-lg font-normal text-sm shadow-xl hover:shadow-2xl transition-all duration-300 transform active:scale-[0.98] border border-white/10 disabled:opacity-50"
                  >
                    حساب جديد
                  </button>
                </div>

                <button
                  onClick={() => { toggleAuthModal(false); setShowForm(false); navigate('/'); }}
                  className="w-full py-2.5 bg-transparent text-zinc-400 hover:text-zinc-300 rounded-lg font-normal border border-zinc-700 hover:border-zinc-600 transition-colors text-sm"
                >
                  تصفح كزائر
                </button>
              </div>
            </div>
          ) : (
            <div className="transition-opacity duration-300">
              <button
                onClick={() => setShowForm(false)}
                className="mb-4 text-zinc-400 hover:text-white transition-colors flex items-center gap-2 text-sm relative z-30"
              >
                <ArrowRight size={16} />
                رجوع
              </button>

              <div className="flex gap-1.5 mb-5 bg-zinc-800/50 p-1 rounded-lg">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${isLogin ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                >
                  تسجيل الدخول
                </button>
                <button
                  onClick={() => { if (allowRegistrations) setIsLogin(false); }}
                  disabled={!allowRegistrations}
                  className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${!isLogin ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'} ${!allowRegistrations ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  حساب جديد
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-2.5">
                {!isLogin && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <UserIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="الاسم"
                        required
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 pr-9 pl-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 transition-all"
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="الهاتف (اختياري)"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 pr-9 pl-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="البريد الإلكتروني"
                    required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 pr-9 pl-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 transition-all"
                  />
                </div>

                <div className={`grid ${!isLogin ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                  <div className="relative">
                    <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="كلمة المرور"
                      required
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 pr-9 pl-9 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {!isLogin && (
                    <div className="relative">
                      <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="تأكيد"
                        required
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 pr-9 pl-9 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${gender === 'male' ? 'border-indigo-600 bg-indigo-600/10 text-indigo-400' : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'}`}
                      >
                        ذكر
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender('female')}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${gender === 'female' ? 'border-indigo-600 bg-indigo-600/10 text-indigo-400' : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'}`}
                      >
                        أنثى
                      </button>
                    </div>
                    <div className="relative">
                      <MapPin className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                      <input
                        type="text"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        placeholder="المنطقة (اختياري)"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 pr-9 pl-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 transition-all"
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
                          className={`p-2.5 rounded-lg border transition-all ${active ? 'border-indigo-600 bg-indigo-600/10 text-white' : 'border-zinc-700 hover:border-zinc-600 text-zinc-400'}`}
                        >
                          <ActiveIcon className={`mx-auto mb-1 ${active ? 'text-indigo-400' : 'text-zinc-500'}`} size={18} />
                          <div className="text-xs font-medium">{item.label}</div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {statusText && (
                  <div className="flex items-center gap-2 text-sm text-indigo-300 bg-indigo-500/10 border border-indigo-400/30 px-3 py-2 rounded-xl">
                    <CheckCircle size={16} />
                    <span>{statusText}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {isLogin ? 'تسجيل الدخول' : 'إنشاء الحساب'}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};