
import React, { createContext, useContext, useState, ReactNode, PropsWithChildren, useEffect } from 'react';
import { User, Product, UserRole, AppSettings } from '../types';
import { mockLogin } from '../services/mockService';
import { firebaseService, mapFirebaseUser } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useOnlineStatus } from '../utils/useOnlineStatus';

type Theme = 'light' | 'dark';

export interface MerchantInfo {
  phone?: string;
  gender?: string; // الجنس
  tailorGender?: 'male' | 'female'; // تخصص الخياط: رجالي أو نسائي
  location?: string;
  specialization?: string;
  experience?: string;
}

interface AppContextType {
  user: User | null;
  loading: boolean;
  settingsLoaded: boolean;
  cart: Product[];
  cartCount?: number;
  ordersCount?: number;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  theme: Theme;
  appSettings: AppSettings;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole, merchantInfo?: MerchantInfo) => Promise<void>;
  logout: () => void;
  addToCart: (product: Product) => void;
  toggleAuthModal: (isOpen: boolean, mode?: 'login' | 'register') => void;
  toggleTheme: () => void;
  updateAppSettings: (newSettings: Partial<AppSettings>) => void; // Local update
  saveAppSettings: (newSettings: AppSettings) => Promise<void>; // Persist to DB
  debugSetRole: (role: UserRole) => void; // For dev tool
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to translate Firebase errors to Arabic
const getFirebaseErrorMessage = (error: any) => {
  const code = error.code;
  switch (code) {
    case 'auth/email-already-in-use':
      return 'البريد الإلكتروني مستخدم بالفعل بحساب آخر.';
    case 'auth/invalid-email':
      return 'صيغة البريد الإلكتروني غير صحيحة.';
    case 'auth/operation-not-allowed':
      return 'تسجيل الدخول غير مفعل في إعدادات النظام (Firebase). يرجى تفعيل Email/Password.';
    case 'auth/weak-password':
      return 'كلمة المرور ضعيفة جداً. يجب أن تكون 6 أحرف على الأقل.';
    case 'auth/user-disabled':
      return 'تم تعطيل هذا الحساب من قبل الإدارة.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
    case 'auth/network-request-failed':
      return 'فشل الاتصال بالشبكة. تحقق من اتصال الإنترنت.';
    default:
      return 'حدث خطأ غير متوقع: ' + (error.message || 'Unknown error');
  }
};

export const AppProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // يبدأ بـ true لانتظار Firebase auth check
  const [cart, setCart] = useState<Product[]>([]);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [theme, setTheme] = useState<Theme>('light');
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const isOnline = useOnlineStatus();
  
  // App Control Settings
  const [appSettings, setAppSettings] = useState<AppSettings>({
    storiesEnabled: true,
    maintenanceMode: false,
    allowNewRegistrations: true,
    designerEnabled: true,
    cartEnabled: true,
    storeEnabled: false, // متجر خيوط تجريبي مبدئياً
    measurementTemplateWidth: 460, // عرض صورة قالب المقاسات
    measurementTemplateHeight: 690, // ارتفاع صورة قالب المقاسات
    matchingMeasurementsVideoUrl: '',
    helpVideo: {
      enabled: true,
      url: 'https://www.youtube.com/watch?v=6eZtn5Du8O4',
      buttonText: 'شاهد'
    }
  });

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Initialize Settings from Firebase (skip noisy errors when offline)
  useEffect(() => {
    const loadSettings = async () => {
      if (firebaseService.isInitialized()) {
        const settings = await firebaseService.getGlobalSettings();
        setAppSettings(settings);
        setSettingsLoaded(true);
      } else {
        setSettingsLoaded(true);
      }
    };
    loadSettings();
  }, [isOnline]);

  // Apply Theme to DOM
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Auth Listener (avoid profile fetch when offline)
  useEffect(() => {
    if (firebaseService.isInitialized()) {
      const unsubscribe = onAuthStateChanged(firebaseService.auth, async (currentUser) => {
        if (currentUser) {
           const mappedUser = mapFirebaseUser(currentUser);
           const extendedUser = isOnline ? await firebaseService.getUserProfile(currentUser.uid) : null;

           const normalizeUser = (u: any): any => {
            if (!u) return u;
            console.log('🔍 Normalizing user:', { name: u.name, role: u.role, shopType: (u as any).shopType });
            let role = typeof u.role === 'string' ? u.role.toLowerCase() : u.role;
            const shopType = (u as any).shopType ? String((u as any).shopType).toLowerCase() : null;
            
            // Keep role='shop' as-is (distinct shop account)
            // No conversion needed
            
            // Map shopType-based roles if they exist as primary role
            if (shopType === 'boutique' || shopType === 'بوتيك') role = 'boutique';
            else if (shopType === 'tailor' || shopType === 'خياط') role = 'tailor';
            
            // Default guest when missing
            if (!role) role = 'guest';
            const { shopType: _, ...rest } = u;
            console.log('✅ Normalized to role:', role);
            return { ...rest, role };
           };

           if (extendedUser) {
             setUser(normalizeUser(extendedUser));
           } else {
             setUser(normalizeUser(mappedUser));
           }
        } else {
          setUser(null);
        }
        setLoading(false); // انتهى التحميل بعد التحقق من المستخدم
      });
      return () => unsubscribe();
    } else {
      // إذا لم يكن Firebase مفعل، أوقف التحميل مباشرة
      setLoading(false);
    }
  }, [isOnline]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const login = async (email: string, password: string) => {
    console.log('[AppContext.login] start', { emailMasked: email.includes('@') ? email : 'phone-login-resolved', time: new Date().toISOString() });
    setLoading(true);
    try {
      if (firebaseService.isInitialized()) {
        const t0 = performance.now?.() || Date.now();
        await firebaseService.login(email, password);
        const t1 = performance.now?.() || Date.now();
        console.log('✅ Firebase login successful', { durationMs: Math.round(t1 - t0) });
      } else {
        const t0 = performance.now?.() || Date.now();
        const userData = await mockLogin(email);
        setUser(userData);
        const t1 = performance.now?.() || Date.now();
        console.log('✅ Mock login successful', { durationMs: Math.round(t1 - t0), userId: userData.id });
      }
      setIsAuthModalOpen(false);
      console.log('✅ Auth modal closed after login');
    } catch (error: any) {
      console.error("❌ Login failed", error);
      alert(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
      console.log('[AppContext.login] end', { time: new Date().toISOString() });
    }
  };

  const register = async (email: string, password: string, name: string, role: UserRole, merchantInfo?: MerchantInfo) => {
    console.log('[AppContext.register] start', { role, hasMerchantInfo: !!merchantInfo, time: new Date().toISOString() });
    if (!appSettings.allowNewRegistrations) {
      alert("التسجيل مغلق حالياً للصيانة");
      return;
    }
    setLoading(true);
    try {
      if (firebaseService.isInitialized()) {
        const t0 = performance.now?.() || Date.now();
        await firebaseService.register(email, password, name, role, merchantInfo);
        const t1 = performance.now?.() || Date.now();
        console.log('✅ Firebase register successful', { durationMs: Math.round(t1 - t0) });
      } else {
        const t0 = performance.now?.() || Date.now();
        const userData = await mockLogin(email);
        userData.name = name;
        userData.role = role;
        if (merchantInfo) {
          userData.phone = merchantInfo.phone;
          userData.gender = merchantInfo.gender as any;
        }
        setUser(userData);
        const t1 = performance.now?.() || Date.now();
        console.log('✅ Mock register successful', { durationMs: Math.round(t1 - t0), userId: userData.id });
      }
      setIsAuthModalOpen(false);
    } catch (error: any) {
      console.error("Registration failed", error);
      alert(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
      console.log('[AppContext.register] end', { time: new Date().toISOString() });
    }
  };

  const logout = async () => {
    try {
      if (firebaseService.isInitialized()) {
        await firebaseService.logout();
      }
      
      // مسح جميع بيانات المستخدم من localStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('order_') || 
          key.startsWith('orders_') || 
          key.startsWith('notifications_') ||
          key.startsWith('measurements_') ||
          key === 'currentUser'
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // مسح أي جلسات متبقية
      try {
        sessionStorage.clear();
      } catch {}
      
      // محاولة مسح قواعد بيانات IndexedDB الخاصة بـ Firebase (إن وجدت)
      try {
        const dbs: any = (indexedDB as any).databases ? await (indexedDB as any).databases() : [];
        const names = ['firebaseLocalStorageDb', 'firebase-auth', 'firebaseInstallations'];
        names.forEach(name => {
          try { indexedDB.deleteDatabase(name); } catch {}
        });
        if (Array.isArray(dbs)) {
          dbs.forEach((db: any) => {
            if (db?.name && String(db.name).toLowerCase().includes('firebase')) {
              try { indexedDB.deleteDatabase(db.name); } catch {}
            }
          });
        }
      } catch {}
      
      // إعادة تعيين الحالة
      setUser(null);
      setCart([]);
      setLoading(false);
      
      // الانتقال إلى صفحة الحساب التي ستعرض GuestPrompt تلقائياً
      window.location.href = '/#/account';
    } catch (error) {
      console.error("Logout failed", error);
      // حتى لو حدث خطأ، نقوم بمسح البيانات المحلية
      setUser(null);
      setCart([]);
      setLoading(false);
      window.location.href = '/#/account';
    }
  };

  const addToCart = (product: Product) => {
    setCart([...cart, product]);
  };

  // Derive cart count from cart array
  const cartCount = cart.length;

  // Compute orders count for current user from localStorage or service when available
  useEffect(() => {
    let cancelled = false;
    const loadOrdersCount = async () => {
      try {
        // If you have a firebaseService for orders, replace this with a real fetch
        const key = user ? `orders_${user.id}` : null;
        if (!key) { setOrdersCount(0); return; }
        const raw = localStorage.getItem(key);
        const arr = raw ? JSON.parse(raw) : [];
        if (!cancelled) setOrdersCount(Array.isArray(arr) ? arr.length : 0);
      } catch (e) {
        if (!cancelled) setOrdersCount(0);
      }
    };
    loadOrdersCount();
    return () => { cancelled = true; };
  }, [user]);

  const toggleAuthModal = (isOpen: boolean, mode?: 'login' | 'register') => {
    if (typeof mode !== 'undefined') {
      setAuthModalMode(mode);
    }
    setIsAuthModalOpen(isOpen);
  };

  const updateAppSettings = (newSettings: Partial<AppSettings>) => {
    setAppSettings(prev => ({ ...prev, ...newSettings }));
  };

  const saveAppSettings = async (newSettings: AppSettings) => {
    try {
      if (firebaseService.isInitialized()) {
        await firebaseService.saveGlobalSettings(newSettings);
      }
      setAppSettings(newSettings);
      alert('تم حفظ الإعدادات بنجاح وتطبيقها على التطبيق.');
    } catch (error) {
      console.error("Failed to save settings", error);
      alert('حدث خطأ أثناء حفظ الإعدادات');
    }
  };

  // DEBUG ONLY: Quickly switch roles without auth
  const debugSetRole = (role: UserRole) => {
    if (!user) {
      // Create fake user if not logged in
      setUser({
        id: 'debug_user',
        name: role === 'admin' ? 'مدير النظام' : (role === 'tailor' ? 'خياط تجريبي' : 'مستخدم تجريبي'),
        email: 'debug@khuyoot.com',
        isGuest: false,
        joinDate: new Date().toLocaleDateString('ar-OM'),
        role: role,
        avatar: role === 'tailor' ? 'https://picsum.photos/200/200?random=tailor' : undefined
      });
    } else {
      // Update existing user role
      setUser({ ...user, role: role });
    }
  };

  return (
    <AppContext.Provider value={{
      user,
      loading,
      settingsLoaded,
      cart,
      cartCount,
      ordersCount,
      isAuthModalOpen,
      authModalMode,
      theme,
      appSettings,
      login,
      register,
      logout,
      addToCart,
      toggleAuthModal,
      toggleTheme,
      updateAppSettings,
      saveAppSettings,
      debugSetRole,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
