import * as React from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import type { AuthState, AuthUser, AuthContextType } from './authTypes';
import { AuthContext } from './useAuth';
import { setAuthStateSnapshot, getAuthStateSnapshot } from './authTokenStore';
import { AuthRequiredError } from '../api/httpErrors';
import { apiJson, apiFetch } from '../api/apiFetch';
import { LoadingShell } from '../components/LoadingShell';
import { firebaseService } from '../../services/firebase';

const UI_CACHE_KEY = 'khuyoot:ui:auth_cache';
const API_KEY = 'AIzaSyB_SsoGd22clhuuqKHPQ_eyEEB8-YHOJvI';

const initialState: AuthState = {
  status: 'loading',
  user: null,
  idToken: null,
};

function getInitialAuthState(): AuthState {
  const start = performance.now();
  try {
    const cached = localStorage.getItem(UI_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.user) {
        // Migration/Safety: If user is nested inside the user field (old bug)
        let user = parsed.user;
        if (user.user && user.user.uid) {
           user = user.user;
        }
        
        if (user && user.uid) {
          // console.log(`[AuthProvider] Snapshot restored in ${performance.now() - start}ms`, user.email);
          // Always start as 'loading' to ensure we wait for fresh profile data
          return { status: 'loading', user: user, idToken: parsed.idToken || null };
        }
      }
    }

    const authKey = 'firebase:authUser:' + API_KEY + ':[DEFAULT]';
    const stored = localStorage.getItem(authKey);
    if (stored) {
      const userData = JSON.parse(stored);
      const user: any = {
        uid: userData.uid,
        email: userData.email || '',
        displayName: userData.displayName || 'User',
        photoURL: userData.photoURL || '',
        role: userData.role || 'customer',
        billing: { credits: 0, tier: 'free', subscriptionStatus: 'none' },
        metadata: { completedOrders: 0 }
      };

      // console.log(`[AuthProvider] Firebase fallback restored in ${performance.now() - start}ms`, user.email);
      // Always start as 'loading' to ensure we wait for fresh profile data
      return {
        status: 'loading',
        user: user as AuthUser,
        idToken: userData.stsTokenManager?.accessToken || null,
      };
    }
  } catch (e) {
    console.warn('[AuthProvider] Initial state error:', e);
  }
  return initialState;
}

// Eagerly initialize snapshot from cache so apiFetch can use it immediately
setAuthStateSnapshot(getInitialAuthState());

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, setState] = React.useState<AuthState>(getInitialAuthState());
  const lastUnauthorizedAtRef = React.useRef<number>(0);

  const refreshProfile = React.useCallback(async (forceWait = false) => {
    try {
      const snapshot = getAuthStateSnapshot();

      // Prevent tight 401 retry loops caused by multiple refresh triggers.
      const now = Date.now();
      if (
        !forceWait &&
        snapshot.status === 'unauthenticated' &&
        lastUnauthorizedAtRef.current &&
        now - lastUnauthorizedAtRef.current < 5000
      ) {
        return;
      }
      
      // Cookie-first approach: Try to fetch profile immediately.
      // If we have a cookie, this will succeed even before Firebase SDK is ready.
      let userData;
      try {
        // If we are on a fresh load and have no cached reason to believe a session exists,
        // we can optionally wait for Firebase to avoid a noisy 401 in the console.
        const currentSnap = getAuthStateSnapshot();
        const hasSessionEvidence = !!currentSnap.user || !!localStorage.getItem('khuyoot:has_session');
        
        if (!forceWait && currentSnap.status === 'loading' && !hasSessionEvidence) {
          // No evidence of session, wait for Firebase SDK to resolve first
          const fbUser = await firebaseService.waitForAuth(1000);
          if (!fbUser && !localStorage.getItem('khuyoot:has_session')) {
            // Still no session evidence after waiting, skip the noisy API call
            return;
          }
        }

        // Disable internal retry to avoid fighting with AuthProvider state updates
        userData = await apiJson<any>('/api/auth/me', { retryOnUnauthorized: false });
        if (userData) {
          localStorage.setItem('khuyoot:has_session', 'true');
        }
      } catch (err: any) {
        // If it failed and we are still loading, wait for Firebase to be sure
        if ((forceWait || snapshot.status === 'loading') && err.status !== 401) {
          await firebaseService.waitForAuth(1500);
          userData = await apiJson<any>('/api/auth/me', { retryOnUnauthorized: false });
          if (userData) {
            localStorage.setItem('khuyoot:has_session', 'true');
          }
        } else {
          throw err;
        }
      }

      if (userData) {
        // Ensure we handle both { user: {...} } and direct user object responses
        const metaUser = userData.user && userData.user.uid ? userData.user : userData;
        const user = { ...metaUser };
        
        // Merge top-level metadata into the user object
        if (userData.user && userData.user.uid) {
          Object.keys(userData).forEach(key => {
            if (key !== 'user' && key !== 'status' && key !== 'success') {
              (user as any)[key] = userData[key];
            }
          });
        }

        // Ensure billing object is properly structured for the UI
        if (!user.billing && (user.credits !== undefined || user.credit_balance !== undefined)) {
          user.billing = {
            credits: user.credit_balance ?? user.credits ?? 0,
            tier: (user.tier || 'free').toLowerCase(),
            subscriptionStatus: user.subscriptionStatus || 'none'
          };
        }

        setState(prev => {
          const prevCredits = prev.user?.billing?.credits ?? (prev.user as any)?.credit_balance;
          const nextCredits = user.billing?.credits ?? user.credit_balance;
          
          const prevImg = prev.user?.photoURL || (prev.user as any)?.profileImage;
          const nextImg = user.photoURL || user.profileImage;

          const prevName = prev.user?.displayName || (prev.user as any)?.name;
          const nextName = user.displayName || user.name;
          
          if (
            prev.status === 'authenticated' && 
            prev.user?.uid === user.uid && 
            prevCredits === nextCredits &&
            prevImg === nextImg &&
            prevName === nextName
          ) {
            // Still update token if changed
            if (prev.idToken !== snapshot.idToken) return { ...prev, idToken: snapshot.idToken };
            return prev;
          }

          const next = { ...prev, status: 'authenticated' as const, user };
          setAuthStateSnapshot(next);
          return next;
        });
      }
    } catch (err: any) {
      if (err.status === 401) {
        lastUnauthorizedAtRef.current = Date.now();

        // If Firebase already has a signed-in user, this is often a cookie-sync race.
        // Keep current auth state and let token/cookie sync settle instead of hard-logging out.
        const currentSnapshot = getAuthStateSnapshot();
        if (firebaseService.auth?.currentUser || currentSnapshot.idToken) {
          setState(prev => {
            if (!prev.user) return prev;
            return { ...prev, status: 'authenticated' };
          });
          return;
        }

        const unauthenticated: AuthState = { status: 'unauthenticated', user: null, idToken: null };
        setAuthStateSnapshot(unauthenticated);
        localStorage.removeItem(UI_CACHE_KEY);
        localStorage.removeItem('khuyoot:has_session');
        setState(prev => {
          if (prev.status === 'unauthenticated' && !prev.user && !prev.idToken) return prev;
          return unauthenticated;
        });
        return;
      }

      // Background refreshes should be silent-ish for non-auth failures
      console.warn("[AuthProvider] Profile refresh failed:", err.message || err);
      {
        setState(prev => {
          if (prev.user) return { ...prev, status: 'authenticated' };
          if (prev.status === 'loading') return { ...prev, status: 'unauthenticated' };
          return prev;
        });
      }
    }
  }, []);

  React.useEffect(() => {
    const handleBypassLogin = () => {
      const authState = getInitialAuthState();
      setState(authState);
      setAuthStateSnapshot(authState);
      refreshProfile();
    };

    const handleBypassLogout = () => {
      const unauthenticated: AuthState = { status: 'unauthenticated', user: null, idToken: null };
      localStorage.removeItem(UI_CACHE_KEY);
      localStorage.removeItem('khuyoot:has_session');
      setState(unauthenticated);
      setAuthStateSnapshot(unauthenticated);
    };

    window.addEventListener('auth-bypass-login', handleBypassLogin);
    window.addEventListener('auth-bypass-logout', handleBypassLogout);

    const handleUpdateState = (event: Event) => {
      const data = (event as CustomEvent).detail;
      if (data) {
        setState(prev => {
          if (!prev.user) return prev;
          const newUser = { ...prev.user, ...data };
          const next = { ...prev, user: newUser };
          setAuthStateSnapshot(next);
          return next;
        });
      }
    };
    window.addEventListener('khuyoot:update-user-state', handleUpdateState);

    return () => {
      window.removeEventListener('auth-bypass-login', handleBypassLogin);
      window.removeEventListener('auth-bypass-logout', handleBypassLogout);
      window.removeEventListener('khuyoot:update-user-state', handleUpdateState);
    };
  }, [refreshProfile]);

  React.useEffect(() => {
    refreshProfile(false);
  }, [refreshProfile]);

  React.useEffect(() => {
    const syncCookie = async () => {
      if (state.status === 'authenticated' && state.idToken) {
        try {
          await apiFetch('/api/auth/login-cookie', {
            method: 'POST',
            body: JSON.stringify({ token: state.idToken }),
            headers: { 'Content-Type': 'application/json' }
          });
          
          // Trigger a profile refresh once cookie is established to get full user data.
          // This avoids the 401 race condition where components call /api/auth/me before the cookie is set.
          refreshProfile(true);
        } catch (err) {
          console.warn('[AuthProvider] Cookie sync failed:', err);
        }
      }
    };
    syncCookie();
  }, [state.idToken, state.status, refreshProfile]);

  React.useEffect(() => {
    const unauthenticated: AuthState = { status: 'unauthenticated', user: null, idToken: null };
    let unsubscribe: (() => void) | null = null;
    let started = false;

    const startListener = () => {
      if (started || !firebaseService?.isInitialized?.()) return;
      started = true;
      try {
        const auth = firebaseService.auth;
        if (!auth) {
          setState(unauthenticated);
          return;
        }

        unsubscribe = onIdTokenChanged(auth, async (fbUser) => {
          if (fbUser) {
            try {
              // Use cached token when possible to prevent "network-request-failed" errors
              const idToken = await fbUser.getIdToken(false);
              
              setState(prev => {
                // If we already have a user with the same UID, preserve their data (especially rich profile data)
                if (prev.user?.uid === fbUser.uid) {
                  if (prev.status === 'authenticated' && prev.idToken === idToken) return prev;
                  return { ...prev, status: 'authenticated', idToken };
                }

                const user: any = {
                  uid: fbUser.uid,
                  email: fbUser.email,
                  displayName: fbUser.displayName || 'User',
                  photoURL: fbUser.photoURL || '',
                  role: 'customer',
                  billing: { credits: 0, tier: 'free', subscriptionStatus: 'none' },
                  metadata: { completedOrders: 0 }
                };

                const next: AuthState = { status: 'authenticated', user, idToken };
                setAuthStateSnapshot(next);
                try { localStorage.setItem(UI_CACHE_KEY, JSON.stringify({ user: next.user, idToken: next.idToken })); } catch {}
                return next;
              });
            } catch (err: any) {
              console.warn('[AuthProvider] Failed to refresh ID token:', err.message);
              // Fallback: stay authenticated with existing token if possible
              setState(prev => prev.status === 'authenticated' ? prev : { ...prev, status: 'unauthenticated' });
            }
            return;
          }

          // If SDK says no user, and we don't have a reliable cache, or the SDK explicitly logged out.
          // CRITICAL: If we are still in the initial 'loading' state, don't jump to 'unauthenticated' 
          // based solely on the Firebase SDK, as the cookie-based session might still be loading.
          setState(prev => {
            if (prev.status === 'loading') {
              return prev;
            }            
            // NEW: Check if we have a bypass token. If so, don't drop the session just because the SDK is slow.
            const authKey = 'firebase:authUser:' + API_KEY + ':[DEFAULT]';
            if (localStorage.getItem(authKey)) {
              return prev;
            }
            return unauthenticated;
          });
          setAuthStateSnapshot(unauthenticated);
          localStorage.removeItem(UI_CACHE_KEY);
        });
      } catch (e) {
        console.warn('[AuthProvider] SDK Listener error:', e);
      }
    };

    startListener();
    const interval = setInterval(startListener, 250);
    return () => {
      clearInterval(interval);
      unsubscribe?.();
    };
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    const u = await firebaseService.login(email, password);
    const user: any = {
      uid: (u as any).uid || (u as any).id,
      email: (u as any).email || '',
      displayName: (u as any).displayName || 'User',
      photoURL: (u as any).photoURL || '',
      role: 'customer',
      billing: { credits: 0, tier: 'free', subscriptionStatus: 'none' },
      metadata: { completedOrders: 0 }
    };

    const token = (u as any).accessToken || (u as any).stsTokenManager?.accessToken;
    setState({ status: 'authenticated', user, idToken: token });
    setAuthStateSnapshot({ status: 'authenticated', user, idToken: token });
    try { localStorage.setItem(UI_CACHE_KEY, JSON.stringify({ user, idToken: token })); } catch {}
    refreshProfile();
    return user as AuthUser;
  }, [refreshProfile]);

  const logout = React.useCallback(async () => {
    localStorage.removeItem(UI_CACHE_KEY);
    try { await apiFetch('/api/auth/logout', { method: 'POST' }); } catch {}
    await firebaseService.logout();
    setState({ status: 'unauthenticated', user: null, idToken: null });
    setAuthStateSnapshot({ status: 'unauthenticated', user: null, idToken: null });
  }, []);

  const requireAuth = React.useCallback((): AuthUser => {
    if (state.status === 'authenticated' && state.user) return state.user;
    throw new AuthRequiredError(state.status === 'loading' ? 'Auth loading' : 'Auth required');
  }, [state.status, state.user]);

  const value = React.useMemo<AuthContextType>(() => ({
    ...state,
    login,
    logout,
    requireAuth,
    refreshProfile
  }), [state, login, logout, requireAuth, refreshProfile]);

  if (state.status === 'loading' && !state.user) {
    return <LoadingShell />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};