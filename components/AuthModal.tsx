import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Lock, Phone, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { firebaseService } from '../services/firebase';
import { getAuthPromptEventName } from '../src/auth/authEvents';

//  helpers 

type View = 'sign-in' | 'complete-profile';

const needsProfileCompletion = (u: any): boolean => {
  const phone = String(u?.phone || u?.phoneNumber || '').trim();
  const gender = String(u?.gender || '').toLowerCase();
  return !phone || !gender || gender === 'not_specified';
};

//  component 

export const AuthModal = () => {
  const {
    isAuthModalOpen,
    toggleAuthModal,
    login,
    loginWithGoogle,
    refreshUser,
    user,
  } = useApp();

  const [view, setView] = useState<View>('sign-in');

  // Sign-in form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Complete-profile form
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [role, setRole] = useState<'user' | 'tailor'>('user');
  const [phone, setPhone] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

  // After email login, watch user changes to decide whether to show completion step
  const [pendingCheck, setPendingCheck] = useState(false);

  const isOpenRef = React.useRef(false);
  useEffect(() => { isOpenRef.current = isAuthModalOpen; }, [isAuthModalOpen]);

  // Reset when modal closes
  useEffect(() => {
    if (!isAuthModalOpen) {
      setView('sign-in');
      setEmail('');
      setPassword('');
      setError('');
      setLoading(false);
      setGender('');
      setRole('user');
      setPhone('');
      setProfileError('');
      setPendingCheck(false);
    }
  }, [isAuthModalOpen]);

  // After email login, check profile once user is populated
  useEffect(() => {
    if (!pendingCheck || !user) return;
    setPendingCheck(false);
    if (needsProfileCompletion(user)) {
      const existing = (user as any)?.phone || (user as any)?.phoneNumber || '';
      if (existing) setPhone(String(existing));
      setView('complete-profile');
    } else {
      toggleAuthModal(false);
    }
  }, [user, pendingCheck, toggleAuthModal]);

  // Listen for programmatic open events (from other parts of the app)
  useEffect(() => {
    const handle = (e: Event) => {
      const reason = String((e as CustomEvent)?.detail?.reason || '').toLowerCase();
      if (reason !== 'user_action' && reason !== 'user-action') return;
      if (!isOpenRef.current) toggleAuthModal(true);
    };
    window.addEventListener('openAuthModal', handle);
    window.addEventListener(getAuthPromptEventName(), handle);
    return () => {
      window.removeEventListener('openAuthModal', handle);
      window.removeEventListener(getAuthPromptEventName(), handle);
    };
  }, [toggleAuthModal]);

  //  handlers 

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      setPendingCheck(true);
    } catch (err: any) {
      const code = String(err?.code || '');
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      } else if (code === 'auth/too-many-requests') {
        setError('تم تعليق الحساب مؤقتا بسبب المحاولات المتكررة. حاول لاحقا.');
      } else if (code === 'auth/network-request-failed') {
        setError('تعذر الاتصال. تحقق من إعدادات الشبكة أو مانع الإعلانات.');
      } else {
        setError(err?.message || 'فشل تسجيل الدخول.');
      }
    } finally {
      setLoading(false);
    }
  };

  const [isRedirecting, setIsRedirecting] = React.useState(false);

  const handleGoogleLogin = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const googleUser = await loginWithGoogle();
      if (needsProfileCompletion(googleUser)) {
        const existing = (googleUser as any)?.phone || (googleUser as any)?.phoneNumber || '';
        if (existing) setPhone(String(existing));
        setView('complete-profile');
      } else {
        toggleAuthModal(false);
      }
    } catch (err: any) {
      const code = String(err?.code || '');
      if (code === 'auth/redirect-initiated') {
        // Page is about to navigate away for redirect auth — show loading state
        // Don't reset loading so the spinner stays while page transitions
        setIsRedirecting(true);
        return;
      } else if (code === 'auth/popup-blocked') {
        // Shouldn't reach here (redirect fallback handles it), but just in case
        setError('يتم تحويلك إلى Google لإتمام تسجيل الدخول...');
      } else if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setError(err?.message || 'فشل تسجيل الدخول بواسطة Google.');
      }
    } finally {
      // Don't clear loading if redirect is in progress
      setLoading((prev) => prev && document.visibilityState === 'hidden' ? prev : false);
    }
  };

  const handleSaveProfile = async () => {
    if (!gender) { setProfileError('يرجى اختيار الجنس.'); return; }
    if (!phone.trim()) { setProfileError('يرجى إدخال رقم الهاتف.'); return; }

    setProfileLoading(true);
    setProfileError('');
    try {
      const uid = (user as any)?.uid || (user as any)?.id;
      if (!uid) throw new Error('No user ID');

      const normalizedPhone = phone.replace(/\s+/g, '').trim();
      await firebaseService.updateUserProfile(uid, {
        phone: normalizedPhone,
        phoneNumber: normalizedPhone,
        contactNumber: normalizedPhone,
        gender,
        role: role as any,
        profileCompleted: true,
      } as any);

      await refreshUser();
      toggleAuthModal(false);
    } catch (err: any) {
      setProfileError(err?.message || 'فشل حفظ البيانات. حاول مرة أخرى.');
    } finally {
      setProfileLoading(false);
    }
  };

  //  render 

  if (!isAuthModalOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => toggleAuthModal(false)}
      />

      {/* card */}
      <div
        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* close */}
        <button
          onClick={() => toggleAuthModal(false)}
          className="absolute top-3 left-3 z-10 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center transition-colors"
          aria-label="إغلاق"
        >
          <X size={14} />
        </button>

        {/* header */}
        <div className="px-6 pt-6 pb-4 text-center border-b border-slate-100 dark:border-slate-800">
          <img src="/logo_big.png" alt="خيوط" className="w-12 h-12 mx-auto mb-3 object-contain" />
          {view === 'sign-in' ? (
            <>
              <h2 className="text-lg font-black text-slate-900 dark:text-white" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                مرحبا بك في خيوط
              </h2>
              <p className="text-xs text-slate-500 mt-0.5" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                سجل دخولك للمتابعة
              </p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-black text-slate-900 dark:text-white" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                أكمل ملفك الشخصي
              </h2>
              <p className="text-xs text-slate-500 mt-0.5" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                خطوة أخيرة لإتمام إنشاء حسابك
              </p>
            </>
          )}
        </div>

        {/* body */}
        <div className="p-6" style={{ fontFamily: 'Tajawal, sans-serif' }}>

          {/*  SIGN-IN VIEW  */}
          {view === 'sign-in' && (
            <div className="space-y-4">

              {/* Google button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg viewBox="0 0 48 48" className="w-5 h-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin inline-block" />
                    {isRedirecting ? 'جاري التحويل إلى Google...' : 'جاري...'}
                  </span>
                ) : 'المتابعة بواسطة Google'}
              </button>

              {/* divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                <span className="text-xs text-slate-400 font-medium">أو بالبريد الإلكتروني</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              </div>

              {/* Email / password */}
              <form onSubmit={handleEmailLogin} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="البريد الإلكتروني"
                    required
                    disabled={loading}
                    className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl py-3 pr-10 pl-4 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 focus:border-[var(--theme-primary)] transition-all disabled:opacity-50"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="كلمة المرور"
                    required
                    disabled={loading}
                    className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl py-3 pr-10 pl-10 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 focus:border-[var(--theme-primary)] transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {error && (
                  <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-right">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-dark)] active:opacity-90 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  تسجيل الدخول
                </button>
              </form>
            </div>
          )}

          {/*  COMPLETE PROFILE VIEW  */}
          {view === 'complete-profile' && (
            <div className="space-y-5">

              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  الجنس <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['male', 'female'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                        gender === g
                          ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {g === 'male' ? ' ذكر' : ' أنثى'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">أنت</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'user', label: ' عميل', desc: 'أبحث عن خياط' },
                    { value: 'tailor', label: ' خياط', desc: 'أقدم خدمات الخياطة' },
                  ] as const).map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`py-3 px-2 rounded-xl border-2 transition-all text-center ${
                        role === r.value
                          ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] dark:text-[var(--theme-primary)]'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-sm font-bold">{r.label}</div>
                      <div className="text-[10px] opacity-60 mt-0.5">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  رقم الهاتف <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+968 XXXX XXXX"
                    className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl py-3 pr-10 pl-4 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 focus:border-[var(--theme-primary)] transition-all"
                  />
                </div>
              </div>

              {profileError && (
                <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-right">
                  {profileError}
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={profileLoading}
                className="w-full py-3 bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-dark)] active:opacity-90 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {profileLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><CheckCircle size={16} /> حفظ ومتابعة</>
                )}
              </button>

              <button
                type="button"
                onClick={() => toggleAuthModal(false)}
                className="w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors py-1"
              >
                تخطي الآن
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
