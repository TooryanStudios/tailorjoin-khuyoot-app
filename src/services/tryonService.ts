import type { TryOnRequest, TryOnResponse } from '../types/tryon';
import { firebaseService } from '../../services/firebase';

export async function generateTryOn(payload: TryOnRequest): Promise<TryOnResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  try {
    const auth = firebaseService.auth;
    const currentUser = auth?.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Auth is optional; server will apply stricter rate limits for anonymous.
  }

  const res = await fetch('/api/tryon/fabric', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Try-on request failed (${res.status})`);
  }

  return (await res.json()) as TryOnResponse;
}
