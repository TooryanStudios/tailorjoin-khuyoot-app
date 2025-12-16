
import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, Scissors, Store, MapPin, Phone, Zap, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from './Button';
import { UserRole, ShopType, Gender } from '../types';

// 🚀 حسابات تجريبية للتطوير فقط (سيتم إزالتها لاحقاً)
const DEV_ACCOUNTS = [
  { 
    email: 'user@test.com', 
    password: '123456', 
    name: 'أحمد المستخدم', 
    role: 'مستخدم عادي',
    icon: '👤',
    color: 'bg-blue-500'
  },
  { 
    email: 'tailor@test.com', 
    password: '123456', 
    name: 'خياط الأصالة', 
    role: 'خياط',
    icon: '✂️',
    color: 'bg-purple-500'
  },
  { 
    email: 'boutique@test.com', 
    password: '123456', 
    name: 'بوتيك الأناقة', 
    role: 'بوتيك',
    icon: '👗',
    color: 'bg-pink-500'
  },
  { 
    email: 'fabric@test.com', 
    password: '123456', 
    name: 'محل الأقمشة الفاخرة', 
    role: 'محل أقمشة',
    icon: '🧵',
    color: 'bg-emerald-500'
  },
  { 
    email: 'admin@test.com', 
    password: '123456', 
    name: 'المدير العام', 
    role: 'مدير',
    icon: '👑',
    color: 'bg-red-500'
  },
];

export const AuthModal = () => {
  const { isAuthModalOpen, toggleAuthModal, login, register, loading } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [shopType, setShopType] = useState<ShopType>('tailor');
  const [gender, setGender] = useState<Gender>('not_specified');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('');
  const [tailorGender, setTailorGender] = useState<'male' | 'female' | ''>(''); // جنس الخياط (إلزامي)
  const [showDevAccounts, setShowDevAccounts] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleQuickLogin = async (account: typeof DEV_ACCOUNTS[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    await login(account.email, account.password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      await login(email, password);
    } else {
      // التحقق من اختيار جنس الخياط (إلزامي)
      if (role === 'tailor' && !tailorGender) {
        alert('يرجى اختيار تخصص الخياط (رجالي أو نسائي)');
        return;
      }
      
      // رقم الهاتف مطلوب للجميع، معلومات إضافية للتجار فقط
      const merchantInfo = {
        phone, // رقم الهاتف لجميع المستخدمين
        gender, // الجنس لجميع المستخدمين
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
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
        onClick={() => toggleAuthModal(false)}
      />

      {/* Modal Content */}
      <div className="relative bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200 my-auto max-h-[95vh] overflow-y-auto">
        <button 
          onClick={() => toggleAuthModal(false)}
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {isLogin ? 'مرحباً بعودتك' : 'انضم إلى عائلة خيوط'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {isLogin 
              ? 'سجل دخولك لمتابعة تفصيل ملابسك' 
              : 'أنشئ حساباً لحفظ مقاساتك وطلباتك'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
             {/* اختيار نوع الحساب */}
             <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                    role === 'user' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <UserIcon size={24} className="mb-1" />
                  <span className="text-xs font-bold">مستخدم عادي</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('tailor')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                    role === 'tailor' 
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' 
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <Store size={24} className="mb-1" />
                  <span className="text-xs font-bold">تاجر/شريك</span>
                </button>
             </div>

             {/* نوع المتجر (يظهر فقط للتجار) */}
             {role === 'tailor' && (
               <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3 space-y-2">
                 <label className="block text-xs font-bold text-amber-800 dark:text-amber-300 mb-2">
                   نوع المتجر/الخدمة
                 </label>
                 <div className="grid grid-cols-2 gap-2">
                   {[
                     { value: 'tailor', label: 'خياط', icon: Scissors },
                     { value: 'boutique', label: 'بوتيك', icon: Store },
                     { value: 'fabric_store', label: 'محل أقمشة', icon: Store },
                     { value: 'sewing_supplies', label: 'مستلزمات خياطة', icon: Store }
                   ].map(({ value, label, icon: Icon }) => (
                     <button
                       key={value}
                       type="button"
                       onClick={() => setShopType(value as ShopType)}
                       className={`flex items-center gap-2 p-2 rounded-lg border text-xs transition-all ${
                         shopType === value
                         ? 'border-amber-500 bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 font-bold'
                         : 'border-amber-200 dark:border-amber-800 text-slate-600 dark:text-slate-400 hover:border-amber-400'
                       }`}
                     >
                       <Icon size={16} />
                       {label}
                     </button>
                   ))}
                 </div>
               </div>
             )}

             {/* اسم المستخدم/المحل */}
             <div className="relative">
               <UserIcon className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400" size={20} />
               <input
                 type="text"
                 value={name}
                 onChange={(e) => setName(e.target.value)}
                 placeholder={role === 'tailor' ? "اسم المحل" : "الاسم الكامل"}
                 required
                 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
               />
             </div>

             {/* اختيار الجنس (لجميع المستخدمين) */}
             <div>
               <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 mr-1">
                 <Users size={14} className="inline ml-1" />
                 الجنس (لتحسين تجربة التصفح)
               </label>
               <div className="grid grid-cols-2 gap-3">
                 <button
                   type="button"
                   onClick={() => setGender('male')}
                   className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all text-sm ${
                     gender === 'male' 
                     ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold' 
                     : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                   }`}
                 >
                   👨
                   <span>ذكر</span>
                 </button>
                 <button
                   type="button"
                   onClick={() => setGender('female')}
                   className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all text-sm ${
                     gender === 'female' 
                     ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 font-bold' 
                     : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                   }`}
                 >
                   👩
                   <span>أنثى</span>
                 </button>
               </div>
             </div>

             {/* رقم الهاتف (لجميع المستخدمين) */}
             <div>
               <div className="relative">
                 <Phone className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400" size={20} />
                 <input
                   type="tel"
                   value={phone}
                   onChange={(e) => setPhone(e.target.value)}
                   placeholder={role === 'tailor' ? "رقم هاتف المحل (مثال: 99123456)" : "رقم الهاتف (مثال: 99123456)"}
                   required
                   className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                 />
               </div>
               <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mr-1">
                 📱 سنرسل رمز تحقق لتفعيل حسابك (قريباً)
               </p>
             </div>

             {/* حقول إضافية للتجار فقط */}
             {role === 'tailor' && (
               <>
                 {/* تخصص المتجر: رجالي أو نسائي (إلزامي) */}
                 <div className="space-y-2">
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 text-right">
                     التخصص: <span className="text-red-500">*</span>
                   </label>
                   <div className="grid grid-cols-2 gap-3">
                     <button
                       type="button"
                       onClick={() => setTailorGender('male')}
                       className={`py-3 px-4 rounded-lg border-2 transition-all ${
                         tailorGender === 'male'
                           ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold'
                           : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-blue-300'
                       }`}
                     >
                       👔 {shopType === 'tailor' ? 'خياطة رجالية' : 
                            shopType === 'boutique' ? 'بوتيك رجالي' :
                            shopType === 'fabric_store' ? 'أقمشة رجالية' :
                            shopType === 'sewing_supplies' ? 'مستلزمات رجالية' : 'رجالي'}
                     </button>
                     <button
                       type="button"
                       onClick={() => setTailorGender('female')}
                       className={`py-3 px-4 rounded-lg border-2 transition-all ${
                         tailorGender === 'female'
                           ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 font-semibold'
                           : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-pink-300'
                       }`}
                     >
                       👗 {shopType === 'tailor' ? 'خياطة نسائية' : 
                            shopType === 'boutique' ? 'بوتيك نسائي' :
                            shopType === 'fabric_store' ? 'أقمشة نسائية' :
                            shopType === 'sewing_supplies' ? 'مستلزمات نسائية' : 'نسائي'}
                     </button>
                   </div>
                 </div>

                 <div className="relative">
                   <MapPin className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400" size={20} />
                   <input
                     type="text"
                     value={location}
                     onChange={(e) => setLocation(e.target.value)}
                     placeholder="المدينة (مثال: مسقط، صلالة)"
                     required
                     className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                   />
                 </div>

                 <input
                   type="text"
                   value={experience}
                   onChange={(e) => setExperience(e.target.value)}
                   placeholder="سنوات الخبرة"
                   className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                 />
               </>
             )}
           </>
          )}

          <div className="relative">
            <Mail className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400" size={20} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="البريد الإلكتروني"
              required
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="relative">
            <Lock className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400" size={20} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              required
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <Button type="submit" className="w-full py-3 text-lg" disabled={loading}>
            {loading ? 'جاري المعالجة...' : (isLogin ? 'تسجيل الدخول' : 'إنشاء حساب')}
          </Button>
        </form>

        {/* 🚀 حسابات تجريبية سريعة (للتطوير فقط) */}
        {isLogin && (
          <div className="mt-6">
            <button
              onClick={() => setShowDevAccounts(!showDevAccounts)}
              className="w-full flex items-center justify-center gap-2 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium"
            >
              <Zap size={14} />
              {showDevAccounts ? 'إخفاء' : 'عرض'} الحسابات التجريبية (للتطوير)
            </button>

            {showDevAccounts && (
              <div className="mt-3 space-y-2 animate-in slide-in-from-top duration-200">
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-2">
                  اضغط على أي حساب للدخول مباشرة ⚡
                </p>
                {DEV_ACCOUNTS.map((account, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickLogin(account)}
                    disabled={loading}
                    className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors text-right disabled:opacity-50"
                  >
                    <div className={`w-10 h-10 ${account.color} rounded-lg flex items-center justify-center text-xl shrink-0`}>
                      {account.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{account.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{account.role} • {account.email}</p>
                    </div>
                  </button>
                ))}
                <p className="text-[10px] text-amber-600 dark:text-amber-400 text-center mt-2 bg-amber-50 dark:bg-amber-900/20 py-2 rounded">
                  ⚠️ هذه الحسابات للتطوير فقط وسيتم إزالتها لاحقاً
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {isLogin ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium mr-1"
            >
              {isLogin ? 'سجل الآن' : 'سجل الدخول'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
