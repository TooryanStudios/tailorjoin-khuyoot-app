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
const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyB_SsoGd22clhuuqKHPQ_eyEEB8-YHOJvI';

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
  } catch {
    console.warn('[AuthProvider] Initial state error');
  }
  return initialState;
}

// Eagerly initialize snapshot from cache so apiFetch can use it immediately
// CRITICAL: Wrap in try-catch for private browsing mode compatibility
try {
  setAuthStateSnapshot(getInitialAuthState());
} catch {
  // Private browsing mode or localStorage disabled - use default state
  console.warn('[AuthProvider] Failed to initialize auth snapshot');
  setAuthStateSnapshot(initialState);
}

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
        // If we represent we are authenticated (have a user in memory), act like we have a session.
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
        
        // ZOMBIE SESSION CHECK: 
        // If we have no local evidence of a session (no localStorage, no Firebase User),
        // but the API returned a user (via stale cookie), we should NOT automatically log them in.
        const currentSDKUser = firebaseService.auth?.currentUser;
        if (userData && !hasSessionEvidence && !currentSDKUser && !localStorage.getItem('khuyoot:has_session')) {
           console.warn('[AuthProvider] Stale cookie detected after restart/logout. Issuing cleanup logout.');
           // Do not accept this user data
           await apiFetch('/api/auth/logout', { method: 'POST' });
           return;
        }

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

        // Normalize photo field - API might return it as photoURL, profileImage, or avatar
        if (!user.photoURL && (user.profileImage || user.avatar || (user as any).profile_image)) {
          user.photoURL = user.profileImage || user.avatar || (user as any).profile_image;
        }
        
        // Also set profileImage for compatibility
        if (!user.profileImage && user.photoURL) {
          user.profileImage = user.photoURL;
        }

        // Ensure billing object is properly structured for the UI
        if (!user.billing && (user.credits !== undefined || user.credit_balance !== undefined)) {
          user.billing = {
            credits: user.credit_balance ?? user.credits ?? 0,
            tier: (user.tier || 'free').toLowerCase(),
            subscriptionStatus: user.subscriptionStatus || 'none'
          };
        }

        // Remove the default role marker since we now have real data
        delete (user as any)._isDefaultRole;

        // CRITICAL FIX: Ensure backend identity matches client identity to prevent stale-account loops.
        const currentClientUser = firebaseService.auth?.currentUser;
        if (currentClientUser && user.uid !== currentClientUser.uid) {
          console.warn('[AuthProvider] API identity mismatch blocked. Server:', user.uid, 'Client:', currentClientUser.uid);

          try {
            const currentToken = await currentClientUser.getIdToken(false);
            const recoveryUser: AuthUser = {
              uid: currentClientUser.uid,
              email: currentClientUser.email || '',
              displayName: currentClientUser.displayName || 'User',
              photoURL: currentClientUser.photoURL || '',
              role: 'customer',
              billing: { credits: 0, tier: 'free', subscriptionStatus: 'none' },
              metadata: { completedOrders: 0 }
            };

            const recoveryState: AuthState = {
              status: 'authenticated',
              user: recoveryUser,
              idToken: currentToken
            };

            setState(recoveryState);
            setAuthStateSnapshot(recoveryState);
            try {
              localStorage.setItem(UI_CACHE_KEY, JSON.stringify({ user: recoveryUser, idToken: currentToken }));
            } catch {}

            await apiFetch('/api/auth/login-cookie', {
              method: 'POST',
              body: JSON.stringify({ token: currentToken }),
              headers: { 'Content-Type': 'application/json' }
            });
          } catch {
            localStorage.removeItem(UI_CACHE_KEY);
            localStorage.removeItem('khuyoot:has_session');
            const unauthenticated: AuthState = { status: 'unauthenticated', user: null, idToken: null };
            setState(unauthenticated);
            setAuthStateSnapshot(unauthenticated);
          }

          return;
        }

        // ALWAYS update state when we get fresh profile data to ensure UI reflects backend reality
        const next: AuthState = { 
          status: 'authenticated' as const, 
          user,
          idToken: snapshot.idToken 
        };
        
        setAuthStateSnapshot(next);
        try { 
          localStorage.setItem(UI_CACHE_KEY, JSON.stringify({ user: next.user, idToken: next.idToken })); 
        } catch {
          console.error('[AuthProvider] Failed to cache');
        }
        
        setState(next);
      }
    } catch (err: any) {
      if (err.status === 401) {
        lastUnauthorizedAtRef.current = Date.now();

        // If Firebase already has a signed-in user, this is often a cookie-sync race.
        // Keep current auth state and let token/cookie sync settle instead of hard-logging out.
        const currentSnapshot = getAuthStateSnapshot();
        if (firebaseService.auth?.currentUser || currentSnapshot.idToken) {
          console.log('[AuthProvider] 401 received but user is signed in locally. Assuming cookie sync delay.');
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
      console.warn('[AuthProvider] Profile refresh failed');
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
    const handleBypassLogin = async () => {
      const sdkUser = await firebaseService.waitForAuth(4000);
      if (!sdkUser) {
        const unauthenticated: AuthState = { status: 'unauthenticated', user: null, idToken: null };
        localStorage.removeItem(UI_CACHE_KEY);
        localStorage.removeItem('khuyoot:has_session');
        setState(unauthenticated);
        setAuthStateSnapshot(unauthenticated);
        return;
      }
      const authState = getInitialAuthState();
      setState(authState);
      setAuthStateSnapshot(authState);
      refreshProfile(true);
    };

    const handleBypassLogout = () => {
      const unauthenticated: AuthState = { status: 'unauthenticated', user: null, idToken: null };
      localStorage.removeItem(UI_CACHE_KEY);
      localStorage.removeItem('khuyoot:has_session');
      setState(unauthenticated);
      setAuthStateSnapshot(unauthenticated);
    };

    window.addEventListener('auth-bypass-login', handleBypassLogin as EventListener);
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
      window.removeEventListener('auth-bypass-login', handleBypassLogin as EventListener);
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
          } catch {
           console.warn('[AuthProvider] Cookie sync failed in syncCookie effect (will retry)');
          // Simple retry backup for flaky networks during login
          setTimeout(async () => {
             try {
                await apiFetch('/api/auth/login-cookie', {
                  method: 'POST',
                  body: JSON.stringify({ token: state.idToken }),
                  headers: { 'Content-Type': 'application/json' }
                });
                refreshProfile(true);
             } catch {
               console.warn('[AuthProvider] Cookie sync retry failed');
             }
          }, 2000);
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
          // Do not force unauthenticated if we have cached user state, let it persist until explicit logout
          const cached = getAuthStateSnapshot();
          if (!cached.user) setState(unauthenticated);
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

                // Try to recover any persisted role from localStorage cache to prevent role-flicker
                let initialRole = 'customer';
                try {
                  const cached = localStorage.getItem(UI_CACHE_KEY);
                  if (cached) {
                    const parsed = JSON.parse(cached);
                    // Handle both root user and nested user structure in cache
                    const cachedUser = parsed.user?.user || parsed.user;
                    if (cachedUser?.uid === fbUser.uid && cachedUser?.role) {
                      initialRole = cachedUser.role;
                    }
                  }
                } catch {}

                const user: any = {
                  uid: fbUser.uid,
                  email: fbUser.email,
                  displayName: fbUser.displayName || 'User',
                  photoURL: fbUser.photoURL || '',
                  role: initialRole,
                  billing: { credits: 0, tier: 'free', subscriptionStatus: 'none' },
                  metadata: { completedOrders: 0 }
                };

                const next: AuthState = { status: 'authenticated', user, idToken };
                setAuthStateSnapshot(next);
                try { localStorage.setItem(UI_CACHE_KEY, JSON.stringify({ user: next.user, idToken: next.idToken })); } catch {}
                return next;
              });
            } catch {
              console.warn('[AuthProvider] Failed to refresh ID token');
              // Fallback: stay authenticated with existing token if possible
              setState(prev => prev.status === 'authenticated' ? prev : { ...prev, status: 'unauthenticated' });
            }
            return;
          }

          // If SDK says no user, and we don't have a reliable cache, or the SDK explicitly logged out.
          // CRITICAL: avoid getting stuck forever in loading on browsers where Firebase persistence is limited.
          setState(prev => {
            if (prev.status === 'loading') {
              const hasSessionEvidence = !!prev.idToken || !!localStorage.getItem('khuyoot:has_session');
              if (!hasSessionEvidence) {
                return unauthenticated;
              }
              return { ...prev, user: null };
            }
            return unauthenticated;
          });
          setAuthStateSnapshot(unauthenticated);
          localStorage.removeItem(UI_CACHE_KEY);
          localStorage.removeItem('khuyoot:has_session');
        });
      } catch {
        console.warn('[AuthProvider] SDK Listener error');
      }
    };

    startListener();
    const interval = setInterval(startListener, 250);
    return () => {
      clearInterval(interval);
      unsubscribe?.();
    };
  }, []);

  React.useEffect(() => {
    if (state.status !== 'loading' || state.user || state.idToken) return;

    const timeoutId = window.setTimeout(() => {
      setState(prev => {
        if (prev.status !== 'loading' || prev.user || prev.idToken) return prev;
        const unauthenticated: AuthState = { status: 'unauthenticated', user: null, idToken: null };
        setAuthStateSnapshot(unauthenticated);
        return unauthenticated;
      });
    }, 2200);

    return () => window.clearTimeout(timeoutId);
  }, [state.status, state.user, state.idToken]);

  const login = React.useCallback(async (email: string, password: string) => {
    await firebaseService.login(email, password);
    const sdkUser = await firebaseService.waitForAuth(5000);
    if (!sdkUser) {
      throw new Error('SESSION_SYNC_FAILED');
    }
    const user: any = {
      uid: sdkUser.uid,
      email: sdkUser.email || '',
      displayName: sdkUser.displayName || 'User',
      photoURL: sdkUser.photoURL || '',
      role: 'customer',
      _isDefaultRole: true, // Marker to indicate this is a client-side placeholder
      billing: { credits: 0, tier: 'free', subscriptionStatus: 'none' },
      metadata: { completedOrders: 0 }
    };

    const token = await sdkUser.getIdToken(false);
    setState({ status: 'authenticated', user, idToken: token });
    setAuthStateSnapshot({ status: 'authenticated', user, idToken: token });
    try { localStorage.setItem(UI_CACHE_KEY, JSON.stringify({ user, idToken: token })); } catch {}
    
    // Immediately fetch the real profile data (including role, credits, photoURL)
    refreshProfile(true);
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