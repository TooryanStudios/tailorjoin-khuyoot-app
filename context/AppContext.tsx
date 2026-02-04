import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { useAuth } from '../src/auth/useAuth';
import { firebaseService } from '../src/services/firebase';
import { useOnlineStatus } from '../utils/useOnlineStatus';
import { useFirestoreSyncReady } from '../src/hooks/useFirestoreSyncReady';
import { apiJson } from '../src/api/apiFetch';

export type UserRole = 'admin' | 'tailor' | 'fabric_shop' | 'customer' | 'boutique' | 'guest';

// Product, MerchantInfo, AppSettings, etc. types (simplified for context)
export interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    [key: string]: any;
}

export interface MerchantInfo {
    shopName: string;
    location: string;
    [key: string]: any;
}

export interface AppSettings {
    storiesEnabled: boolean;
    maintenanceMode: boolean;
    allowNewRegistrations: boolean;
    designerEnabled: boolean;
    cartEnabled: boolean;
    showHeader: boolean;
    showFooter: boolean;
    defaultTheme: 'dark' | 'light';
    storeEnabled: boolean;
    themeColors?: {
        primary: string;
        secondary: string;
    };
    aiTryOn?: any;
    [key: string]: any;
}

export interface User {
    id: string;
    uid: string;
    name: string;
    email?: string;
    profileImage?: string;
    role: UserRole;
    isGuest: boolean;
    joinDate: string;
    credits?: number;
    tier?: string;
    metadata?: any;
    avatar?: string;
    displayName?: string;
    photoURL?: string;
    credit_balance?: number;
    billing?: { credits?: number; tier?: string; subscriptionStatus?: string };
    history?: any[];
    closet?: any[];
    savedItems?: any[];
}

export type Theme = 'light' | 'dark' | 'system';

interface AppContextType {
    user: User | null;
    loading: boolean;
    settingsLoaded: boolean;
    cart: Product[];
    cartCount: number;
    ordersCount: number;
    isAuthModalOpen: boolean;
    authModalMode: 'login' | 'register';
    isPrivacyModalOpen: boolean;
    isTermsModalOpen: boolean;
    isReturnPolicyModalOpen: boolean;
    theme: Theme;
    appSettings: AppSettings;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string, role: UserRole, merchantInfo?: MerchantInfo) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    addToCart: (product: Product) => void;
    clearCart: () => void;
    toggleAuthModal: (isOpen: boolean, mode?: 'login' | 'register') => void;
    togglePrivacyModal: (isOpen: boolean) => void;
    toggleTermsModal: (isOpen: boolean) => void;
    toggleReturnPolicyModal: (isOpen: boolean) => void;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
    updateAppSettings: (newSettings: Partial<AppSettings>) => void;
    saveAppSettings: (newSettings: AppSettings, options?: { silent?: boolean; optimistic?: boolean }) => Promise<void>;
    debugSetRole: (role: UserRole) => void;
    updateLocalUser: (data: Partial<User>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getFirebaseErrorMessage = (error: any) => {
    const code = error.code;
    const message = error.message || '';
    if (message.includes('timeout') || message.includes('Timeout')) {
        return 'انتهت مهلة الاتصال. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.';
    }
    switch (code) {
        case 'auth/email-already-in-use': return 'البريد الإلكتروني مستخدم بالفعل بحساب آخر.';
        case 'auth/invalid-email': return 'صيغة البريد الإلكتروني غير صحيحة.';
        case 'auth/weak-password': return 'كلمة المرور ضعيفة جداً. يجب أن تكون 6 أحرف على الأقل.';
        case 'auth/user-disabled': return 'تم تعطيل هذا الحساب من قبل الإدارة.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential': return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
        case 'auth/network-request-failed': return 'فشل الاتصال بالشبكة. تحقق من اتصال الإنترنت.';
        default: return 'حدث خطأ غير متوقع: ' + (error.message || 'Unknown error');
    }
};

export const AppProvider: React.FC<PropsWithChildren<{ initialAppSettings?: AppSettings }>> = ({ children, initialAppSettings }) => {
    const { status: authStatus, user: authUser, refreshProfile } = useAuth();
    const isOnline = useOnlineStatus();
    
    const normalizeUser = (u: any): User | null => {
        if (!u) return null;

        // Migration/Safety: If data is nested inside a 'user' property (old bug)
        if (u.user && (u.user.uid || u.user.id)) {
            u = u.user;
        }

        // Shared role mapping logic
        let role = typeof u.role === 'string' ? u.role.toLowerCase() : u.role;
        const shopType = (u as any).shopType ? String((u as any).shopType).toLowerCase() : null;
        
        if (shopType === 'boutique' || shopType === 'بوتيك' || role === 'بوتيك' || role === 'boutique') {
            role = 'boutique';
        } else if (shopType === 'tailor' || shopType === 'خياط' || role === 'خياط' || role === 'tailor') {
            role = 'tailor';
        } else if (shopType === 'fabric_shop' || shopType === 'fabric_store' || shopType === 'shop' || role === 'shop' || role === 'fabric_shop') {
            role = 'shop';
        }
        
        if (!role) role = 'customer';

        // Ensure we always have name/profileImage regardless of whether source uses Firebase names (displayName/photoURL) or our names
        const base = {
            id: u.uid || u.id,
            uid: u.uid || u.id,
            name: u.name || u.displayName || u.email?.split('@')[0] || 'User',
            email: u.email,
            profileImage: u.profileImage || u.photoURL || u.avatar,
            role: role as UserRole,
            isGuest: u.isGuest || false,
            joinDate: u.joinDate || u.metadata?.joinDate || u.createdAt || new Date().toISOString(),
        };

        const credits = u.credit_balance ?? u.credits ?? u.billing?.credits ?? 0;
        const tier = u.tier || u.billing?.tier || 'free';

        return {
            ...base,
            credits,
            tier,
            metadata: u.metadata || {}
        };
    };

    const [user, setUser] = useState<User | null>(() => {
        const start = performance.now();
        // Initial try from authUser (if available synchronously from AuthProvider)
        if (authUser?.uid) {
            const cacheKey = `khuyoot:user-profile:${authUser.uid}`;
            try {
                const cachedRaw = localStorage.getItem(cacheKey);
                if (cachedRaw) {
                    const parsed = JSON.parse(cachedRaw);
                    if (parsed && (parsed.uid === authUser.uid || parsed.id === authUser.uid)) {
                        const normalized = normalizeUser(parsed);
                        console.log(`[AppContext] Hydrated from profile cache in ${performance.now() - start}ms`, normalized?.name);
                        return normalized;
                    }
                }
            } catch {}
            const normalized = normalizeUser(authUser);
            console.log(`[AppContext] Hydrated from AuthProvider snapshot in ${performance.now() - start}ms`, normalized?.name);
            return normalized;
        }
        console.log(`[AppContext] No initial user found in ${performance.now() - start}ms`);
        return null;
    });

    const [authActionLoading, setAuthActionLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    // ... rest
    const [cart, setCart] = useState<Product[]>([]);
    const [ordersCount, setOrdersCount] = useState<number>(0);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [isReturnPolicyModalOpen, setIsReturnPolicyModalOpen] = useState(false);
    const [theme, setThemeState] = useState<Theme>(() => {
        try {
            const stored = localStorage.getItem('theme') as Theme | null;
            if (stored === 'dark' || stored === 'light' || stored === 'system') return stored;
        } catch {}
        return 'dark'; // Fallback
    });

    const [appSettings, setAppSettings] = useState<AppSettings>(() => ({
        storiesEnabled: true,
        maintenanceMode: false,
        allowNewRegistrations: true,
        designerEnabled: true,
        cartEnabled: true,
        showHeader: true,
        showFooter: true,
        defaultTheme: 'dark',
        storeEnabled: false,
        themeColors: { primary: '#CFFF04', secondary: '#D4AF37' },
        ...initialAppSettings
    }));

    // loading is true if auth is loading, OR if a profile sync is in progress,
    // OR if we are authenticated but the "rich" user state hasn't been populated yet.
    const loading = authStatus === 'loading' || authActionLoading || profileLoading || (authStatus === 'authenticated' && !user);

    useEffect(() => {
        const root = window.document.documentElement;
        const applyTheme = (t: Theme) => {
            if (t === 'system') {
                const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (isDark) root.classList.add('dark');
                else root.classList.remove('dark');
            } else if (t === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        };

        applyTheme(theme);
        localStorage.setItem('theme', theme);

        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => applyTheme('system');
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    useEffect(() => {
        if (authStatus === 'unauthenticated') {
            setUser(null);
            return;
        }

        if (!authUser?.uid) return;

        // If authUser already has rich data (from backend refresh), use it immediately
        if ((authUser as any).billing) {
            const normalized = normalizeUser(authUser);
            setUser(normalized);
            try {
                const cacheKey = `khuyoot:user-profile:${authUser.uid}`;
                localStorage.setItem(cacheKey, JSON.stringify(normalized));
            } catch {}
            
            // If we have billing, we don't necessarily need to fetch from Firebase
            // unless we want to merge more data.
            return;
        }

        let cancelled = false;
        const syncProfile = async () => {
            const cacheKey = `khuyoot:user-profile:${authUser.uid}`;
            try {
                setProfileLoading(true);
                
                // UNIVERSAL APPROACH: Fetch enriched user profile from /api/auth/me
                // This includes: displayName, photoURL, credits, billing, history, closet
                try {
                    const serverData = await apiJson<any>('/api/auth/me');
                    if (cancelled) return;
                    
                    if (serverData) {
                        // Handle nested user structure from server
                        const metaUser = serverData.user && serverData.user.uid 
                            ? serverData.user 
                            : serverData;
                        
                        // Merge all server data into user object
                        const mergedUser = { ...metaUser };
                        if (serverData.user && serverData.user.uid) {
                            Object.keys(serverData).forEach(key => {
                                if (key !== 'user' && key !== 'status' && key !== 'success') {
                                    (mergedUser as any)[key] = serverData[key];
                                }
                            });
                        }
                        
                        const normalized = normalizeUser({
                            ...authUser,
                            ...mergedUser,
                            name: mergedUser.displayName || mergedUser.name || authUser.displayName || authUser.name,
                            profileImage: mergedUser.photoURL || mergedUser.profileImage || authUser.photoURL || authUser.profileImage
                        });
                        
                        setUser(normalized);
                        localStorage.setItem(cacheKey, JSON.stringify(normalized));
                        console.log('[AppContext] Profile hydrated from /api/auth/me', normalized?.email, 'Credits:', normalized?.credits);
                        return;
                    }
                } catch (apiError) {
                    console.warn('[AppContext] /api/auth/me failed, falling back to Firebase:', apiError);
                }

                // FALLBACK: If /api/auth/me fails and Firebase is available, use it
                if (!firebaseService?.isInitialized?.()) {
                    setUser(normalizeUser(authUser));
                    return;
                }

                const extendedUser = await firebaseService.getUserProfile(authUser.uid);
                
                if (cancelled) return;

                if (extendedUser) {
                    const normalized = normalizeUser({
                        ...authUser,
                        ...extendedUser,
                        name: authUser.displayName || authUser.name || extendedUser.name,
                        profileImage: authUser.photoURL || authUser.profileImage || extendedUser.profileImage
                    });
                    
                    setUser(normalized);
                    localStorage.setItem(cacheKey, JSON.stringify(normalized));
                } else if (!user) {
                    setUser(normalizeUser(authUser));
                }
            } catch (e) {
                console.warn('[AppContext] Profile sync failed', e);
                if (!user) setUser(normalizeUser(authUser));
            } finally {
                if (!cancelled) setProfileLoading(false);
            }
        };
        syncProfile();
        return () => { cancelled = true; };
    }, [authStatus, authUser, authUser?.uid]);

    // Listen for data refresh events (from mutations in Designer or other components)
    useEffect(() => {
        const handleRefresh = () => {
            if (authUser?.uid) {
                // Trigger a profile refresh by calling refreshProfile from AuthProvider
                refreshProfile?.();
            }
        };

        window.addEventListener('khuyoot:refresh-user-data', handleRefresh as EventListener);
        return () => {
            window.removeEventListener('khuyoot:refresh-user-data', handleRefresh as EventListener);
        };
    }, [authUser?.uid, refreshProfile]);

    const login = async (email: string, password: string) => {
        setAuthActionLoading(true);
        try {
            await firebaseService.login(email, password);
            setIsAuthModalOpen(false);
        } catch (error: any) {
            error.message = getFirebaseErrorMessage(error);
            throw error;
        } finally {
            setAuthActionLoading(false);
        }
    };

    const register = async (email: string, password: string, name: string, role: UserRole, merchantInfo?: MerchantInfo) => {
        setAuthActionLoading(true);
        try {
            await firebaseService.register(email, password, name, role, merchantInfo);
            setIsAuthModalOpen(false);
        } catch (error: any) {
            error.message = getFirebaseErrorMessage(error);
            throw error;
        } finally {
            setAuthActionLoading(false);
        }
    };

    const logout = async () => {
        setAuthActionLoading(true);
        try {
            await firebaseService.logout();
            setUser(null);
            setCart([]);
            localStorage.clear();
        } catch (error) {
            console.error('Logout failed', error);
        } finally {
            setAuthActionLoading(false);
        }
    };

    const toggleTheme = () => setThemeState(prev => prev === 'light' ? 'dark' : 'light');
    const setTheme = (t: Theme) => setThemeState(t);
    const addToCart = (product: Product) => setCart(prev => [...prev, product]);
    const clearCart = () => { setCart([]); localStorage.removeItem('khuyoot.cart.v1'); };
    
    return (
        <AppContext.Provider value={{
            user, loading, settingsLoaded: true, cart, cartCount: cart.length, ordersCount,
            isAuthModalOpen, authModalMode, isPrivacyModalOpen, isTermsModalOpen, isReturnPolicyModalOpen,
            theme, appSettings, login, register, logout, refreshUser: refreshProfile,
            addToCart, clearCart, toggleAuthModal: (isOpen, mode) => { 
                if (mode) setAuthModalMode(mode); 
                setIsAuthModalOpen(isOpen); 
            },
            togglePrivacyModal: setIsPrivacyModalOpen,
            toggleTermsModal: setIsTermsModalOpen,
            toggleReturnPolicyModal: setIsReturnPolicyModalOpen,
            toggleTheme,
            setTheme,
            updateAppSettings: (s) => setAppSettings(prev => ({ ...prev, ...s })),
            saveAppSettings: async (s) => { setAppSettings(s); },
            debugSetRole: (role) => { if (user) setUser({ ...user, role }); },
            updateLocalUser: (data) => {
                if (user) {
                    const next = { ...user, ...data };
                    setUser(next);
                    const cacheKey = `khuyoot:user-profile:${user.uid}`;
                    try { localStorage.setItem(cacheKey, JSON.stringify(next)); } catch {}
                    
                    // Sync with AuthProvider
                    window.dispatchEvent(new CustomEvent('khuyoot:update-user-state', { detail: data }));
                }
            }
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within an AppProvider');
    return context;
};