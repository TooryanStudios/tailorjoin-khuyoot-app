import React, { useState, useEffect } from 'react';
import { 
  X, Mail, Lock, User as UserIcon, Scissors, Store, MapPin, 
  Phone, Zap, ArrowRight, CheckCircle, Sparkles, Box, ChevronRight,
  ShieldCheck, BadgeCheck, Calendar
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole, ShopType, Gender, AgeGroup, PopularRegion } from '../types';
import { tailorGenderToSpecialization } from '../utils/specializationHelper';
import { firebaseService } from '../services/firebase';

// --- Types ---
interface ModernInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ElementType;
  label?: string;
  className?: string;
}

// --- Components ---
const ModernInput = React.memo(({ icon: Icon, label, className, ...props }: ModernInputProps) => (
  <div className="group space-y-1.5 w-full">
    {label && (
      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
        {label}
      </label>
    )}
    <div className="relative">
      <div className="absolute inset-y-0 right-0 pl-3 flex items-center pr-4 pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
        <Icon size={18} />
      </div>
      <input
        {...props}
        className={`w-full bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-indigo-100 rounded-xl py-3.5 pr-11 pl-4 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-900 shadow-sm transition-all ${className}`}
      />
    </div>
  </div>
));

// Simple Section Header Component
const SectionLabel = ({ title }: { title: string }) => (
    <div className="flex items-center gap-2 mb-3 mt-1 pb-1 border-b border-slate-100 dark:border-slate-800">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
    </div>
);

// Dev Accounts Configuration
const DEV_ACCOUNTS = [
  { email: 'user@test.com', password: '123456', name: 'أحمد المستخدم', role: 'مستخدم عادي', icon: '👤', color: 'bg-blue-100 text-blue-600' },
  { email: 'tailor@test.com', password: '123456', name: 'خياط الأصالة', role: 'خياط', icon: '✂️', color: 'bg-purple-100 text-purple-600' },
  { email: 'boutique@test.com', password: '123456', name: 'بوتيك الأناقة', role: 'بوتيك', icon: '👗', color: 'bg-pink-100 text-pink-600' },
  { email: 'admin@test.com', password: '123456', name: 'المدير العام', role: 'مدير', icon: '👑', color: 'bg-red-100 text-red-600' },
];

export const AuthModal = () => {
  const { isAuthModalOpen, toggleAuthModal, login, register, loading, authModalMode } = useApp();
  const [isLogin, setIsLogin] = useState(authModalMode === 'login');
  const [showDevAccounts, setShowDevAccounts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Fail-safe: if submitting gets stuck, clear after 12s
  useEffect(() => {
    if (!submitting) return;
    const t = setTimeout(() => setSubmitting(false), 12000);
    return () => clearTimeout(t);
  }, [submitting]);
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
  // Sync local mode with context mode when it changes
  React.useEffect(() => {
    setIsLogin(authModalMode === 'login');
  }, [authModalMode]);

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

  const loadRegions = async () => {
    try {
      const data = await firebaseService.getPopularRegions();
      setRegions(data.filter(r => r.enabled).sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('Error loading regions:', error);
    }
  };

  if (!isAuthModalOpen) return null;

  const handleDevLogin = async (acc: typeof DEV_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setSubmitting(true);
    try {
        await login(acc.email, acc.password);
        toggleAuthModal(false);
    } catch (error) {
        console.error("Dev login failed", error);
        alert("فشل تسجيل الدخول التجريبي");
    } finally {
        setSubmitting(false);
    }
  };

  const normalizePhone = (raw: string) => {
    let digits = (raw || '').replace(/[^0-9]/g, '');
    if (digits.startsWith('968')) digits = digits.slice(3);
    return digits;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      console.log('[AuthModal] submit start', { isLogin });
      if (isLogin) {
        const input = email.trim();
        if (input.includes('@')) {
          setStatusText('يتم تسجيل الدخول...');
          await login(input, password);
        } else {
          const phoneDigits = normalizePhone(input);
          console.log('[AuthModal] Phone login attempt:', { input, phoneDigits });
          if (!phoneDigits) { alert('يرجى إدخال رقم هاتف صحيح'); setSubmitting(false); return; }
          setStatusText('يتم التحقق من الرقم...');
          // Try loginId first
          const candidates = [phoneDigits, `968${phoneDigits}`];
          console.log('[AuthModal] Searching for candidates:', candidates);
          let found = null as Awaited<ReturnType<typeof firebaseService.findUserByLoginId>>;
          for (const cand of candidates) {
            found = await firebaseService.findUserByLoginId(cand);
            console.log('[AuthModal] findUserByLoginId result for', cand, ':', found);
            if (found) break;
          }
          // Fallback to phone field for older accounts
          if (!found) {
            console.log('[AuthModal] No loginId match, trying phone field');
            for (const cand of candidates) {
              found = await firebaseService.findUserByPhone(cand);
              console.log('[AuthModal] findUserByPhone result for', cand, ':', found);
              if (found) break;
            }
          }
          if (!found) { 
            console.log('[AuthModal] No user found for phone:', phoneDigits);
            alert('لا يوجد حساب مرتبط بهذا الرقم'); 
            setSubmitting(false); 
            return; 
          }
          console.log('[AuthModal] Found user:', { uid: found.uid, email: found.email });
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
          await login(found.email, password);
        }
      } else {
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
      }
      toggleAuthModal(false);
    } catch (error) { 
      console.error("Auth error:", error);
      // Ensure local UI unlocks even if an unexpected error occurs
      setSubmitting(false);
      setStatusText('');
    } 
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start md:items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity" onClick={() => toggleAuthModal(false)} />

      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-y-auto flex max-h-[90vh] animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
        
        {/* --- Right Section (Form) --- */}
        <div className="w-full lg:w-1/2 flex flex-col relative z-10">
          
          <div className="p-6 pb-2 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-20 z-index-100">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-indigo-200 shadow-lg">K</div>
                <span className="font-bold text-lg tracking-tight text-slate-800 dark:text-white">Khiyoot</span>
             </div>
             <button onClick={() => toggleAuthModal(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                <X size={20}/>
             </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-2">
            
            <div className="mb-6 mt-2">
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
                {isLogin ? 'مرحباً بعودتك! 👋' : 'ابدأ رحلتك معنا 🚀'}
              </h1>
              <p className="text-slate-500 text-sm">
                {isLogin ? 'أدخل بياناتك للمتابعة حيث توقفت' : 'سجل الآن واستمتع بتجربة تفصيل عصرية'}
              </p>
            </div>

            {/* Toggle Switch */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-8 relative isolate">
              <div className={`absolute inset-y-1 w-[calc(50%-4px)] bg-white dark:bg-slate-700 rounded-xl shadow-sm transition-all duration-300 ease-out transform -z-10 ${isLogin ? 'right-1' : 'right-[calc(50%+4px)]'}`} />
              <button onClick={() => setIsLogin(true)} className={`flex-1 py-2.5 text-sm font-bold transition-colors ${isLogin ? 'text-indigo-600 dark:text-white' : 'text-slate-500'}`}>تسجيل دخول</button>
              <button onClick={() => setIsLogin(false)} className={`flex-1 py-2.5 text-sm font-bold transition-colors ${!isLogin ? 'text-indigo-600 dark:text-white' : 'text-slate-500'}`}>حساب جديد</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* --- Group 1: Identity & Credentials --- */}
              <div className="space-y-4">
                 {!isLogin && <SectionLabel title="البيانات الأساسية" />}
                 
                 {!isLogin && (
                    <ModernInput icon={UserIcon} label="الاسم الكامل" placeholder="مثال: محمد سعيد" value={name} onChange={(e) => setName(e.target.value)} required />
                 )}
                 
                 <ModernInput icon={Mail} label={isLogin ? "البريد الإلكتروني أو رقم الهاتف" : undefined} placeholder={isLogin ? "name@example.com أو 9xxxxxxx" : "name@example.com"} type="text" value={email} onChange={(e) => setEmail(e.target.value)} required />
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={isLogin ? 'md:col-span-2' : ''}>
                        <ModernInput icon={Lock} label={isLogin ? "كلمة المرور" : undefined} placeholder="••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    {!isLogin && (
                        <ModernInput icon={ShieldCheck} placeholder="تأكيد كلمة المرور" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    )}
                 </div>
              </div>

              {/* --- Group 2: Registration Details (Hidden on Login) --- */}
              {!isLogin && (
                <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                  
                  {/* Personal Info Group */}
                  <div>
                      <SectionLabel title="معلومات التواصل" />
                      <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <ModernInput icon={Phone} label="رقم الهاتف" placeholder="9xxxxxxx" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">الجنس</label>
                            <div className="grid grid-cols-2 gap-3">
                              <button type="button" onClick={() => setGender('male')} className={`py-3 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-2 ${gender === 'male' ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-700 text-slate-500'}`}>ذكر</button>
                              <button type="button" onClick={() => setGender('female')} className={`py-3 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-2 ${gender === 'female' ? 'border-pink-500 text-pink-600 bg-pink-50 dark:bg-pink-900/20' : 'border-slate-100 dark:border-slate-700 text-slate-500'}`}>أنثى</button>
                            </div>
                          </div>
                          <div className="col-span-2">
                            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
                              <MapPin size={12} />
                              المنطقة/الولاية (اختياري)
                            </label>
                            <select
                              value={region}
                              onChange={(e) => {
                                const newRegion = e.target.value;
                                const oldRegion = region;
                                setRegion(newRegion);
                                // تعيين الموقع افتراضياً فقط إذا كان فارغاً أو يساوي المنطقة القديمة
                                if (!location || location === oldRegion) {
                                  setLocation(newRegion);
                                }
                              }}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-indigo-100 rounded-xl py-3.5 px-4 text-sm font-medium text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-900 shadow-sm transition-all"
                            >
                              <option value="">اختر المنطقة/الولاية</option>
                              {regions.map(r => (
                                <option key={r.id} value={r.name}>{r.name}</option>
                              ))}
                            </select>
                          </div>
                      </div>
                  </div>

                  {/* Age Group - Only for regular users */}
                  {role === 'user' && (
                    <div>
                      <SectionLabel title="الفئة العمرية (اختياري)" />
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
                          <Calendar size={12} />
                          <span>اختر فئتك العمرية (يساعدنا في تحسين تجربتك)</span>
                        </label>
                        <select
                          value={ageGroup}
                          onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-indigo-100 rounded-xl py-3.5 px-4 text-sm font-medium text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-900 shadow-sm transition-all"
                        >
                          <option value="not_specified">أفضل عدم التحديد</option>
                          <option value="18-23">18-23 سنة</option>
                          <option value="24-30">24-30 سنة</option>
                          <option value="31-40">31-40 سنة</option>
                          <option value="41-50">41-50 سنة</option>
                          <option value="50+">50+ سنة</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Account Type Group */}
                  <div>
                    <SectionLabel title="نوع الحساب" />
                    <div className="grid grid-cols-2 gap-4">
                      <div onClick={() => setRole('user')} className={`cursor-pointer group relative p-4 rounded-2xl border-2 transition-all duration-200 ${role === 'user' ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-slate-700 hover:border-indigo-200'}`}>
                        <div className="flex justify-between items-start mb-2">
                           <div className={`p-2 rounded-xl ${role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white shadow-sm text-slate-400'}`}><UserIcon size={20}/></div>
                           {role === 'user' && <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"/>}
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">مستخدم</h3>
                        <p className="text-[10px] text-slate-500 mt-1">أبحث عن خياطين</p>
                      </div>

                      <div onClick={() => setRole('tailor')} className={`cursor-pointer group relative p-4 rounded-2xl border-2 transition-all duration-200 ${role === 'tailor' ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/20' : 'border-slate-100 dark:border-slate-700 hover:border-amber-200'}`}>
                        <div className="flex justify-between items-start mb-2">
                           <div className={`p-2 rounded-xl ${role === 'tailor' ? 'bg-amber-500 text-white' : 'bg-white shadow-sm text-slate-400'}`}><Store size={20}/></div>
                           {role === 'tailor' && <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"/>}
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
                               className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${shopType === item.val ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}
                             >
                               <item.ic size={16} className={shopType === item.val ? 'text-white' : 'text-amber-500'}/> {item.lbl}
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
                              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white text-sm"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">يمكنك تحديد موقع أكثر دقة</p>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">التخصص</label>
                            <div className="flex bg-white dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                               <button type="button" onClick={() => setTailorGender('male')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${tailorGender === 'male' ? 'bg-amber-100 text-amber-900' : 'text-slate-400'}`}>رجالي</button>
                               <button type="button" onClick={() => setTailorGender('female')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${tailorGender === 'female' ? 'bg-amber-100 text-amber-900' : 'text-slate-400'}`}>نسائي</button>
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
                  <div className="mt-4 p-3 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200">
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
            
            {/* Developer Mode */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
               <button onClick={() => setShowDevAccounts(!showDevAccounts)} className="flex items-center justify-between w-full text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg hover:bg-amber-100 transition-colors">
                 <span className="flex items-center gap-2"><Zap size={14} fill="currentColor" /> وضع المطور (حسابات جاهزة)</span>
                 <ChevronRight size={14} className={`transition-transform ${showDevAccounts ? 'rotate-90' : ''}`} />
               </button>

               {showDevAccounts && (
                 <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 animate-in slide-in-from-top-1">
                    {DEV_ACCOUNTS.map((acc, idx) => (
                      <button key={idx} onClick={() => handleDevLogin(acc)} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-right">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${acc.color}`}>{acc.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold truncate text-slate-800 dark:text-white">{acc.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{acc.role}</div>
                          </div>
                      </button>
                    ))}
                 </div>
               )}
            </div>

          </div>
        </div>

        {/* --- Left Section (Image) --- */}
        <div className="hidden lg:block w-1/2 relative bg-slate-100">
           <img src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=2070&auto=format&fit=crop" alt="Tailoring Art" className="absolute inset-0 w-full h-full object-cover"/>
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
           <div className="absolute bottom-0 left-0 right-0 p-12 text-white rtl:text-right">
              <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium">
                 <Sparkles size={14} className="text-amber-400" />
                 <span>تصميم عصري 2025</span>
              </div>
              <h2 className="text-4xl font-extrabold leading-tight mb-4">
                 فصّل أناقتك <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">بلمسة زر واحدة.</span>
              </h2>
           </div>
        </div>
      </div>
    </div>
  );
};