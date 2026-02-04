import { firebaseService } from '../../services/firebase';
import { getAuthStateSnapshot, setAuthTokenSnapshot } from '../auth/authTokenStore';
import { ApiError, ApiUnauthorizedError, AuthRequiredError } from './httpErrors';

export type ApiFetchOptions = RequestInit & {
  requireAuth?: boolean;
  retryOnUnauthorized?: boolean;
};

function getApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = (import.meta as any).env?.VITE_API_BASE_URL || '';
  if (base) {
    const normalizedBase = String(base).replace(/\/$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
  }
  return path;
}

async function readErrorBody(res: Response): Promise<string> {
  try {
    const text = await res.text();
    return text || res.statusText;
  } catch {
    return res.statusText;
  }
}

export async function apiFetch(path: string, options: ApiFetchOptions = {}): Promise<Response> {
  const url = getApiUrl(path);
  const retryOnUnauthorized = options.retryOnUnauthorized !== false;
  const snapshot = getAuthStateSnapshot();
  const requireAuth = options.requireAuth === true;

  const hasToken = !!snapshot.idToken;
  const isAuthOrLoadingWithToken = snapshot.status === 'authenticated' || (snapshot.status === 'loading' && hasToken);

  if (requireAuth && !isAuthOrLoadingWithToken) {
    throw new AuthRequiredError('Authentication required');
  }

  const headers = new Headers(options.headers || undefined);
  if (hasToken) {
    headers.set('Authorization', `Bearer ${snapshot.idToken}`);
  }

  const exec = async (): Promise<Response> => {
    return await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
  };

  let res = await exec();

  if (res.status === 401) {
    if (!retryOnUnauthorized) throw new ApiUnauthorizedError();
    if (snapshot.status === 'authenticated') {
      try {
        const fresh = await firebaseService.auth?.currentUser?.getIdToken(true);
        if (fresh) {
          headers.set('Authorization', `Bearer ${fresh}`);
          setAuthTokenSnapshot({ ...snapshot, idToken: fresh });
          res = await exec();
        }
      } catch {
        // ignore
      }
    }
    if (res.status === 401) throw new ApiUnauthorizedError();
  }

  if (!res.ok) {
    const body = await readErrorBody(res);
    throw new ApiError(body || 'API error', res.status);
  }

  return res;
}

export async function apiJson<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const res = await apiFetch(path, options);
  const data = (await res.json()) as T;

  // If this was a mutation (POST, PUT, DELETE), signal a data refresh to components
  // like UserDataPanel so they update credits/history instantly.
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'DELETE'].includes(method)) {
    window.dispatchEvent(new CustomEvent('khuyoot:refresh-user-data'));
  }

  return data;
}
