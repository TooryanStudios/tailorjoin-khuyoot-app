
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
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  addToCart: (product: Product) => void;
  clearCart: () => void;
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

  const CART_STORAGE_KEY = 'khuyoot.cart.v1';

  const validateCart = (value: unknown): value is Product[] => {
    if (!Array.isArray(value)) return false;
    return value.every((item) => {
      if (!item || typeof item !== 'object') return false;
      const anyItem = item as any;
      return (
        typeof anyItem.id === 'string' &&
        typeof anyItem.name === 'string' &&
        typeof anyItem.price === 'number' &&
        typeof anyItem.image === 'string' &&
        typeof anyItem.category === 'string'
      );
    });
  };

  // Normalize user payloads (Firebase profile + legacy fields)
  const normalizeUser = (u: any): any => {
    if (!u) return u;
    let role = typeof u.role === 'string' ? u.role.toLowerCase() : u.role;
    const shopType = (u as any).shopType ? String((u as any).shopType).toLowerCase() : null;

    // Map shopType-based roles if they exist as primary role
    if (shopType === 'boutique' || shopType === 'بوتيك') role = 'boutique';
    else if (shopType === 'tailor' || shopType === 'خياط') role = 'tailor';

    // Default guest when missing
    if (!role) role = 'guest';
    const { shopType: _, ...rest } = u;
    return { ...rest, role };
  };

  // Hydrate cart once
  useEffect(() => {
    try {
      const hydrated = loadFromStorage<Product[]>(CART_STORAGE_KEY, validateCart);
      if (hydrated) setCart(hydrated);
    } catch (e) {
      console.warn('Failed to hydrate cart', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist cart to localStorage directly (simplified)
  React.useEffect(() => {
    if (cart && cart.length > 0) {
      const timer = setTimeout(() => {
        try {
          const cartData = cart.map((p: any) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.image,
            category: p.category,
            categoryId: p.categoryId ?? undefined,
            images: p.images ?? undefined,
            coverImageIndex: p.coverImageIndex ?? undefined,
            tailorId: p.tailorId ?? undefined,
            tailorName: p.tailorName ?? undefined,
            location: p.location ?? undefined,
            rating: p.rating ?? undefined,
            duration: p.duration ?? undefined,
          }));
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
        } catch (e) {
          console.error('[AppContext] Cart persist error:', e);
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [cart]);
  
  // App Control Settings
  const [appSettings, setAppSettings] = useState<AppSettings>({
    storiesEnabled: true,
    maintenanceMode: false,
    allowNewRegistrations: true,
    designerEnabled: true,
    cartEnabled: true,
    defaultTheme: 'dark', // Default theme is dark
    storeEnabled: false, // متجر خيوط تجريبي مبدئياً
    aiTryOn: {
      limits: {
        free: {
          maxPremiumTemplatesBrowse: 4,
          maxRecents: 3,
          maxGenerationsStored: 4,
        },
        subscribed: {
          maxPremiumTemplatesBrowse: 999999,
          maxRecents: 9,
          maxGenerationsStored: 50,
        },
      },
      premiumFeatures: {
        watermarkRemoval: true,
        hdExport: true,
        priorityQueue: true,
        batchGeneration: true,
        presets: true,
      },
    },
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
        // Cache settings to localStorage for immediate theme application on next load
        localStorage.setItem('app_settings', JSON.stringify(settings));
        // Apply theme from settings if it exists
        if (settings.defaultTheme) {
          setTheme(settings.defaultTheme);
        }
        setSettingsLoaded(true);
      } else {
        setSettingsLoaded(true);
      }
    };
    // Add watchdog to avoid indefinite wait if Firestore is slow
    const watchdog = setTimeout(() => {
      if (!settingsLoaded) {
        try { console.warn('⚠️ Settings load watchdog triggered; using defaults'); } catch {}
        setSettingsLoaded(true);
      }
    }, 3000);

    loadSettings().finally(() => {
      try { clearTimeout(watchdog); } catch {}
    });
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
    //
    setLoading(true);
    try {
      if (firebaseService.isInitialized()) {
        const t0 = performance.now?.() || Date.now();
        await firebaseService.login(email, password);
        const t1 = performance.now?.() || Date.now();
        //
      } else {
        const t0 = performance.now?.() || Date.now();
        const userData = await mockLogin(email);
        setUser(userData);
        const t1 = performance.now?.() || Date.now();
        //
      }
      setIsAuthModalOpen(false);
      //
    } catch (error: any) {
      // Dev-only fallback: if Firebase Auth is blocked (extensions/CSP/proxy), allow mock login on localhost
      const isLocalDev = (() => {
        try {
          if (import.meta?.env?.DEV) return true;
          const host = typeof window !== 'undefined' ? window.location?.hostname : '';
          return host === 'localhost' || host === '127.0.0.1';
        } catch {
          return false;
        }
      })();

      if (isLocalDev && error?.code === 'auth/network-request-failed') {
        console.warn('⚠️ Firebase Auth network failed on localhost; falling back to mock login for development.');
        try {
          const userData = await mockLogin(email);
          setUser(userData);
          setIsAuthModalOpen(false);
          return;
        } catch (fallbackError) {
          console.error('Mock login fallback also failed', fallbackError);
        }
      }

      console.error("Login failed", error);
      alert(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
      //
    }
  };

  const register = async (email: string, password: string, name: string, role: UserRole, merchantInfo?: MerchantInfo) => {
    //
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
        //
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
        //
      }
      setIsAuthModalOpen(false);
    } catch (error: any) {
      console.error("Registration failed", error);
      alert(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
      //
    }
  };

  const refreshUser = async () => {
    try {
      if (!firebaseService.isInitialized()) return;
      const current = firebaseService.auth?.currentUser;
      if (!current?.uid) return;
      if (!isOnline) {
        // When offline, best we can do is keep current context user.
        return;
      }
      const profile = await firebaseService.getUserProfile(current.uid);
      if (profile) {
        setUser(normalizeUser(profile));
      } else {
        setUser(normalizeUser(mapFirebaseUser(current)));
      }
    } catch (e) {
      console.warn('refreshUser failed', e);
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
    } catch (error) {
      console.error("Logout failed", error);
      // حتى لو حدث خطأ، نقوم بمسح البيانات المحلية
      setUser(null);
      setCart([]);
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart((prev) => [...prev, product]);
  };

  const clearCart = () => {
    setCart([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {}
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
      refreshUser,
      addToCart,
      clearCart,
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
