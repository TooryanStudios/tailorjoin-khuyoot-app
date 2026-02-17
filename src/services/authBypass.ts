/**
 * Firebase Auth REST API Bypass
 *
 * REASON: The Firebase Auth SDK's signInWithEmailAndPassword() hangs indefinitely
 * in this environment, even though direct REST API calls work perfectly.
 *
 * This module uses the Firebase Auth REST API directly to sign in, then manually
 * updates the SDK's auth state with the returned tokens.
 */

import { getAuth, signInWithCustomToken } from 'firebase/auth';

const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyB_SsoGd22clhuuqKHPQ_eyEEB8-YHOJvI';

interface RestSignInResponse {
  kind: string;
  localId: string;
  email: string;
  displayName: string;
  idToken: string;
  registered: boolean;
  refreshToken: string;
  expiresIn: string;
}

interface RestSignInError {
  error: {
    code: number;
    message: string;
    errors: Array<{
      message: string;
      domain: string;
      reason: string;
    }>;
  };
}

/**
 * Sign in using Firebase Auth REST API directly (bypasses SDK).
 * Includes retry logic with exponential backoff for network failures.
 * Returns idToken and refreshToken that can be used to set auth state.
 */
export async function signInWithEmailPasswordREST(
  email: string,
  password: string,
  retries = 3
): Promise<{ success: true; data: RestSignInResponse } | { success: false; error: string; code?: string }> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            returnSecureToken: true,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData: RestSignInError = await response.json();
        const errorMessage = errorData.error?.message || 'Unknown error';

        console.error(`[REST Auth] Sign-in failed (status ${response.status}, code ${errorMessage})`);

        // Map Firebase error codes to user-friendly messages
        let userMessage = errorMessage;
        let errorCode = errorMessage;

        if (
          errorMessage.includes('INVALID_LOGIN_CREDENTIALS') ||
          errorMessage.includes('INVALID_PASSWORD')
        ) {
          userMessage = '?????? ?????????? ?? ???? ?????? ??? ?????';
          errorCode = 'auth/invalid-credential';
        } else if (errorMessage.includes('EMAIL_NOT_FOUND')) {
          userMessage = '?? ???? ???? ???? ?????? ??????????';
          errorCode = 'auth/user-not-found';
        } else if (errorMessage.includes('TOO_MANY_ATTEMPTS')) {
          userMessage = '?? ????? ??? ????????? ???????. ?????? ???????? ??????';
          errorCode = 'auth/too-many-requests';
        } else if (errorMessage.includes('USER_DISABLED')) {
          userMessage = '??? ?????? ????. ????? ?? ???????';
          errorCode = 'auth/user-disabled';
        }

        return { success: false, error: userMessage, code: errorCode };
      }

      const data: RestSignInResponse = await response.json();
      return { success: true, data };
    } catch (error) {
      const isNetworkError =
        error instanceof Error &&
        (error.name === 'AbortError' ||
          error.message.includes('network') ||
          error.message.includes('fetch'));

      if (isNetworkError && attempt < retries) {
        console.warn(`[REST Auth] Attempt ${attempt}/${retries} failed, retrying...`);
        // Exponential backoff: 500ms, 1s, 2s
        const delayMs = Math.pow(2, attempt - 1) * 500;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue; // Retry
      }

      console.error(`[REST Auth] Sign-in error on attempt ${attempt}`);
    }
  }

  // After all retries failed
  return {
    success: false,
    error: '??? ??????? ????? ????????. ???? ?? ?????? ????????? ????? ?????',
  };
}

async function exchangeCustomToken(idToken: string): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/custom-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      credentials: 'include',
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.customToken === 'string' ? data.customToken : null;
  } catch {
    return null;
  }
}

/**
 *
 * NOTE: This is a workaround. Ideally we'd use signInWithCredential() but that
 * requires an AuthCredential which we can't easily create from just idToken/refreshToken.
 *
 * ALTERNATIVE APPROACH: We could directly update the SDK's internal state, but that's
 * extremely fragile and not officially supported.
 */
export async function signInWithRestTokens(idToken: string, refreshToken: string) {
  const auth = getAuth();

  // Unfortunately, Firebase doesn't provide a clean way to "import" REST tokens into the SDK.
  // We have a few hacky options:
  //
  // Option 1: Store tokens manually and use them directly (bypass SDK state management)
  // Option 2: Use signInWithCustomToken (requires backend to generate custom token)
  // Option 3: Hack the SDK's internal persistence layer (very fragile)
  //
  // For now, we'll store the tokens and manually trigger the auth state listener
  // This is a temporary hack until we can implement proper custom token generation

  // Store tokens in the same format Firebase SDK expects
  const authKey = `firebase:authUser:${API_KEY}:[DEFAULT]`;
  const userData = {
    uid: 'temp', // Will be updated by onAuthStateChanged
    email: 'temp@temp.com',
    emailVerified: false,
    isAnonymous: false,
    providerData: [],
    stsTokenManager: {
      refreshToken,
      accessToken: idToken,
      expirationTime: Date.now() + 3600 * 1000, // 1 hour
    },
    createdAt: Date.now().toString(),
    lastLoginAt: Date.now().toString(),
  };

  localStorage.setItem(authKey, JSON.stringify(userData));

  // Force SDK to reload auth state
  await auth.updateCurrentUser(auth.currentUser);

  return auth.currentUser;
}

/**
 * Main sign-in function that uses REST API bypass.
 * Call this instead of signInWithEmailAndPassword().
 */
export async function signInWithEmailPasswordBypass(email: string, password: string) {
  const result = await signInWithEmailPasswordREST(email, password);
  if (!result.success) {
    throw new Error((result as any).error);
  }

  // Store the tokens in SDK-compatible format
  const auth = getAuth();
  const authKey = `firebase:authUser:${API_KEY}:[DEFAULT]`;

  const userData = {
    uid: result.data.localId,
    email: result.data.email,
    emailVerified: true,
    displayName: result.data.displayName || '',
    isAnonymous: false,
    providerData: [
      {
        providerId: 'password',
        uid: result.data.email,
        displayName: result.data.displayName || '',
        email: result.data.email,
        phoneNumber: null,
        photoURL: null,
      },
    ],
    stsTokenManager: {
      refreshToken: result.data.refreshToken,
      accessToken: result.data.idToken,
      expirationTime: Date.now() + parseInt(result.data.expiresIn) * 1000,
    },
    createdAt: Date.now().toString(),
    lastLoginAt: Date.now().toString(),
    apiKey: API_KEY,
  };

  // Store in localStorage (AuthProvider will pick it up immediately)
  localStorage.setItem(authKey, JSON.stringify(userData));

    const customToken = await exchangeCustomToken(result.data.idToken);
    if (customToken) {
      try {
        await signInWithCustomToken(auth, customToken);
      } catch {
        console.warn('?? Firebase SDK sign-in with custom token failed');
      }
    }

  // Trigger a custom event to notify AuthProvider of the change
  window.dispatchEvent(
    new CustomEvent('auth-bypass-login', {
      detail: {
        uid: result.data.localId,
        email: result.data.email,
        displayName: result.data.displayName || '',
      },
    })
  );

  // Return user data immediately
  return {
    user: {
      uid: result.data.localId,
      email: result.data.email,
      displayName: result.data.displayName || null,
    } as any,
    idToken: result.data.idToken,
    refreshToken: result.data.refreshToken,
  };
}
