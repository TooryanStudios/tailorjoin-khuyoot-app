import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { useAuth } from '../src/auth/useAuth';
import { firebaseService } from '../src/services/firebase';
import { useOnlineStatus } from '../utils/useOnlineStatus';
import { useFirestoreSyncReady } from '../src/hooks/useFirestoreSyncReady';
import { apiJson } from '../src/api/apiFetch';

export type UserRole = 'admin' | 'tailor' | 'fabric_shop' | 'user' | 'boutique' | 'guest' | 'shop' | 'fabric_store' | 'customer';

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
    phone?: string;
    phoneNumber?: string;
    contactNumber?: string;
    role: UserRole;
    _isDefaultRole?: boolean; // Marker for temporary placeholder state from AuthProvider
    isGuest: boolean;
    joinDate: string;
    credits?: number;
    tier?: string;
    metadata?: any;
    avatar?: string;
    displayName?: string;
    photoURL?: string;
    authProvider?: string;
    profileCompleted?: boolean;
    credit_balance?: number;
    billing?: { credits?: number; tier?: string; subscriptionStatus?: string };
    adminAccess?: {
        mode?: 'full' | 'limited';
        sections?: string[];
        deniedSections?: string[];
        configSections?: string[];
        deniedConfigSections?: string[];
    };
    adminPermissions?: {
        mode?: 'full' | 'limited';
        sections?: string[];
        deniedSections?: string[];
        configSections?: string[];
        deniedConfigSections?: string[];
    };
    disabled?: boolean;
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
    loginWithGoogle: () => Promise<User>;
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
    if (message.includes('SESSION_SYNC_FAILED')) {
        return 'تم تسجيل الدخول ولكن لم تكتمل مزامنة الجلسة. يرجى المحاولة مرة أخرى.';
    }
    if (message.includes('timeout') || message.includes('Timeout')) {
        return 'انتهت مهلة الاتصال. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.';
    }
    switch (code) {
        case 'auth/popup-blocked': return 'تم حظر نافذة تسجيل الدخول. يرجى السماح بالنوافذ المنبثقة ثم إعادة المحاولة.';
        case 'auth/popup-closed-by-user': return 'تم إغلاق نافذة تسجيل الدخول قبل الإكمال.';
        case 'auth/cancelled-popup-request': return 'تم إلغاء محاولة تسجيل الدخول لأن نافذة أخرى كانت قيد الفتح.';
        case 'auth/operation-not-allowed': return 'تسجيل الدخول بواسطة Google غير مفعّل في Firebase. فعّل Google Provider من لوحة Firebase Authentication.';
        case 'auth/unauthorized-domain': return 'هذا النطاق غير مصرح به في Firebase Authentication. أضف localhost إلى Authorized domains.';
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
    const isAuthUserPlaceholder = authStatus === 'authenticated' && !!(authUser as any)?._isDefaultRole;
    
    const normalizeUser = (u: any): User | null => {
        if (!u) return null;

        // Migration/Safety: If data is nested inside a 'user' property (old bug)
        if (u.user && (u.user.uid || u.user.id)) {
            u = u.user;
        }

        // Shared role mapping logic
        let role = typeof u.role === 'string' ? u.role.toLowerCase() : u.role;
        const accessMode = String((u as any)?.adminAccess?.mode || '').toLowerCase();
        const permissionsMode = String((u as any)?.adminPermissions?.mode || '').toLowerCase();
        const hasAdminMode =
            accessMode === 'full' ||
            accessMode === 'limited' ||
            permissionsMode === 'full' ||
            permissionsMode === 'limited';
        if (role !== 'admin' && hasAdminMode) {
            role = 'admin';
        }
        const shopType = (u as any).shopType ? String((u as any).shopType).toLowerCase() : null;

        // CRITICAL: never downgrade explicit admin role based on merchant/shopType metadata.
        if (role !== 'admin') {
            if (shopType === 'boutique' || shopType === 'بوتيك' || role === 'بوتيك' || role === 'boutique') {
                role = 'boutique';
            } else if (shopType === 'tailor' || shopType === 'خياط' || role === 'خياط' || role === 'tailor') {
                role = 'tailor';
            } else if (shopType === 'fabric_shop' || shopType === 'fabric_store' || shopType === 'shop' || role === 'shop' || role === 'fabric_shop') {
                role = 'shop';
            }
        }
        
        if (!role) role = 'customer';
        
        // Ensure we always have name/profileImage regardless of whether source uses Firebase names (displayName/photoURL) or our names
        const name = u.name || u.displayName || u.email?.split('@')[0] || 'User';
        const profileImage = u.profileImage || u.photoURL || u.avatar || u.avatar_url || (u as any).profile_image;
        const phone = u.phone || u.phoneNumber || (u as any).phone_number || (u as any).contactNumber || (u as any).mobile || (u as any).tel;


        const base = {
            id: u.uid || u.id,
            uid: u.uid || u.id,
            name,
            displayName: name,
            email: u.email,
            profileImage,
            photoURL: profileImage, // Sync for compatibility
            avatar: profileImage, // Sync for compatibility
            role: role as UserRole,
            _isDefaultRole: (u as any)._isDefaultRole, // Propagate the flag
            isGuest: u.isGuest || false,
            joinDate: u.joinDate || u.metadata?.joinDate || u.createdAt || new Date().toISOString(),
        };

        const credits = u.credit_balance ?? u.credits ?? u.billing?.credits ?? 0;
        const tier = u.tier || u.billing?.tier || 'free';

        const result = {
            ...base,
            credits,
            tier,
            phone: phone || '', // Ensure it's at least an empty string
            phoneNumber: phone || '', // Sync field name
            metadata: u.metadata || {},
            adminAccess: (u as any).adminAccess,
            adminPermissions: (u as any).adminPermissions,
        };
        
        return result;
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
                        return normalized;
                    }
                }
            } catch {}
            
            // FALLBACK: If no cache, DO NOT trust the role from the auth snapshot if it's just 'customer'
            // This prevents the "Flash of Customer Role" before the profile syncs.
            const initial = normalizeUser(authUser);
            if (initial && initial.role === 'customer') {
                return null; 
            }
            return initial;
        }
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
        return 'light'; // Fallback
    });

    const [appSettings, setAppSettings] = useState<AppSettings>(() => ({
        storiesEnabled: true,
        maintenanceMode: false,
        allowNewRegistrations: true,
        designerEnabled: true,
        cartEnabled: true,
        showHeader: true,
        showFooter: true,
        defaultTheme: 'light',
        storeEnabled: false,
        themeColors: { primary: '#CFFF04', secondary: '#D4AF37' },
        ...initialAppSettings
    }));

    // loading is true if auth is loading, OR if a profile sync is in progress,
    // OR if we are authenticated but the "rich" user state hasn't been populated yet.
    const loading =
        authStatus === 'loading' ||
        authActionLoading ||
        profileLoading ||
        isAuthUserPlaceholder ||
        (authStatus === 'authenticated' && !user);

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

        // If authUser is resolved (not placeholder), trust it immediately.
        // This avoids waiting for uid change and prevents stale-role flicker.
        if (!(authUser as any)._isDefaultRole) {
            const normalized = normalizeUser(authUser);
            
            setUser(normalized);
            try {
                const cacheKey = `khuyoot:user-profile:${authUser.uid}`;
                localStorage.setItem(cacheKey, JSON.stringify(normalized));
            } catch {}
            
            // Trust AuthProvider's data since it came from the backend
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
                    // Disable internal retry to prevent infinite loops (since retry triggers auth state change which triggers re-sync)
                    const serverData = await apiJson<any>('/api/auth/me', { retryOnUnauthorized: false });
                    if (cancelled) return;
                    
                    if (serverData) {
                        // Handle nested user structure from server
                        const metaUser = serverData.user && serverData.user.uid 
                            ? serverData.user 
                            : serverData;

                        // Critical guard: ignore stale cookie payload that belongs to a different user
                        if (metaUser?.uid && metaUser.uid !== authUser.uid) {
                            console.warn('[AppContext] Ignoring /api/auth/me mismatch. Server:', metaUser.uid, 'Auth:', authUser.uid);
                            if (!(authUser as any)._isDefaultRole) {
                                setUser(normalizeUser(authUser));
                            }
                            return;
                        }
                        
                        // Merge all server data into user object, prioritizing server data
                        const mergedUser = { ...authUser, ...metaUser };
                        
                        // If server returned data in the outer envelope, merge those too (but don't override already-merged user data)
                        if (serverData.user && serverData.user.uid) {
                            Object.keys(serverData).forEach(key => {
                                if (key !== 'user' && key !== 'status' && key !== 'success') {
                                    if (serverData[key] !== undefined && serverData[key] !== null && !mergedUser[key]) {
                                      (mergedUser as any)[key] = serverData[key];
                                    }
                                }
                            });
                        }
                        
                        const normalized = normalizeUser(mergedUser);
                        
                        setUser(normalized);
                        localStorage.setItem(cacheKey, JSON.stringify(normalized));
                        return;
                    }
                } catch (apiError) {
                    const isUnauthorized = (apiError as any)?.status === 401;
                    if (isUnauthorized) {
                        console.warn('[AppContext] /api/auth/me returned 401, using auth snapshot fallback for this cycle');
                        if (!cancelled && !(authUser as any)._isDefaultRole) {
                            setUser(normalizeUser(authUser));
                        }
                        return;
                    }
                    console.warn('[AppContext] /api/auth/me failed, falling back to Firebase');
                }

                // FALLBACK: If /api/auth/me fails and Firebase is available, use it
                if (!firebaseService?.isInitialized?.()) {
                    if (!(authUser as any)._isDefaultRole) {
                        setUser(normalizeUser(authUser));
                    }
                    return;
                }

                const extendedUser = await firebaseService.getUserProfile(authUser.uid);
                
                if (cancelled) return;

                if (extendedUser) {
                    const normalized = normalizeUser({
                        ...authUser,
                        ...extendedUser,
                        name: authUser.displayName || (authUser as any).name || extendedUser.name,
                        profileImage: authUser.photoURL || (authUser as any).profileImage || extendedUser.profileImage
                    });
                    
                    setUser(normalized);
                    localStorage.setItem(cacheKey, JSON.stringify(normalized));
                } else if (!user && !(authUser as any)._isDefaultRole) {
                    setUser(normalizeUser(authUser));
                }
            } catch {
                console.warn('[AppContext] Profile sync failed');
                if (!user && !(authUser as any)._isDefaultRole) setUser(normalizeUser(authUser));
            } finally {
                if (!cancelled) setProfileLoading(false);
            }
        };
        syncProfile();
        return () => { cancelled = true; };
    }, [
        authStatus,
        authUser?.uid,
        (authUser as any)?._isDefaultRole,
        authUser?.role,
        authUser?.displayName,
        authUser?.photoURL,
        authUser?.email,
        (authUser as any)?.adminAccess?.mode,
        (authUser as any)?.adminPermissions?.mode,
    ]);

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

    const loginWithGoogle = async (): Promise<User> => {
        setAuthActionLoading(true);
        try {
            const signedInUser = await firebaseService.loginWithGoogle();
            // NOTE: Do NOT close the modal here — AuthModal checks profileCompleted
            // and decides whether to close or show the completion step.
            return signedInUser as User;
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
            // Clear cached profile FIRST (before user state)
            if (user?.uid) {
                const cacheKey = `khuyoot:user-profile:${user.uid}`;
                localStorage.removeItem(cacheKey);
                console.log('[AppContext] Cleared profile cache');
            }
            
            // Clear user state
            setUser(null);
            setCart([]);
            
            // Logout from Firebase
            await firebaseService.logout();
            
            // Wait for Firebase auth state to propagate
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Final cleanup of all storage
            localStorage.clear();
            sessionStorage.clear();
            
            console.log('[AppContext] Complete logout - all state cleared');
            window.location.href = '/';
            
        } catch {
            console.error('Logout failed');
        } finally {
            setAuthActionLoading(false);
        }
    };

    const toggleTheme = () => setThemeState(prev => prev === 'light' ? 'dark' : 'light');
    const setTheme = (t: Theme) => setThemeState(t);
    const addToCart = (product: Product) => setCart(prev => [...prev, product]);
    const clearCart = () => { setCart([]); localStorage.removeItem('khuyoot.cart.v1'); };
    
    const contextValue = React.useMemo(() => ({
        user,
        loading,
        settingsLoaded: true,
        cart,
        cartCount: cart.length,
        ordersCount,
        isAuthModalOpen,
        authModalMode,
        isPrivacyModalOpen,
        isTermsModalOpen,
        isReturnPolicyModalOpen,
        theme,
        appSettings,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshUser: refreshProfile,
        addToCart,
        clearCart,
        toggleAuthModal: (isOpen: boolean, mode?: 'login' | 'register') => {
            if (mode) setAuthModalMode(mode);
            setIsAuthModalOpen(isOpen);
        },
        togglePrivacyModal: setIsPrivacyModalOpen,
        toggleTermsModal: setIsTermsModalOpen,
        toggleReturnPolicyModal: setIsReturnPolicyModalOpen,
        toggleTheme,
        setTheme,
        updateAppSettings: (s: Partial<AppSettings>) => setAppSettings(prev => ({ ...prev, ...s })),
        saveAppSettings: async (s: AppSettings) => { setAppSettings(s); },
        debugSetRole: (role: UserRole) => { if (user) setUser({ ...user, role }); },
        updateLocalUser: (data: Partial<User>) => {
            if (user) {
                const next = { ...user, ...data };
                setUser(next);
                const cacheKey = `khuyoot:user-profile:${user.uid}`;
                try { localStorage.setItem(cacheKey, JSON.stringify(next)); } catch {}

                // Sync with AuthProvider
                window.dispatchEvent(new CustomEvent('khuyoot:update-user-state', { detail: data }));
            }
        }
    }), [
        user, loading, cart, ordersCount, isAuthModalOpen, authModalMode,
        isPrivacyModalOpen, isTermsModalOpen, isReturnPolicyModalOpen,
        theme, appSettings, login, loginWithGoogle, register, logout, refreshProfile,
        addToCart, clearCart, toggleTheme, setTheme
    ]);

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within an AppProvider');
    return context;
};