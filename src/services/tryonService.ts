import type { TryOnRequest, TryOnResponse } from '../types/tryon';
import { apiFetch } from '../api/apiFetch';
import { ApiError } from '../api/httpErrors';

export async function generateTryOn(payload: TryOnRequest): Promise<TryOnResponse> {
  try {
    const res = await apiFetch('/api/tryon/fabric', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // Auth optional; apiFetch will attach token if available.
      requireAuth: false,
    });
    return (await res.json()) as TryOnResponse;
  } catch (e) {
    if (e instanceof ApiError) {
      throw new Error(e.message || 'Try-on request failed');
    }
    throw e;
  }
}
