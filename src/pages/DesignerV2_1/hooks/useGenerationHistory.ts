import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchGenerationHistory, type GenerationRecord } from '../../../services/fabricSwapService';
import { apiFetch } from '../../../api/apiFetch';
import { ApiUnauthorizedError, AuthRequiredError } from '../../../api/httpErrors';
import { requestLoginPrompt } from '../../../auth/authEvents';

export type PendingGeneration = {
  clientId: string;
  jobId?: string;
  isPending: true;
  isError?: boolean;
  error?: string;
  createdAt: string;
};

export type CompleteHistoryItem = GenerationRecord & {
  clientId: string;
};

export type HistoryItem = CompleteHistoryItem | PendingGeneration;

type HistoryCacheV1 = {
  v: 1;
  activeId: string | null;
  items: CompleteHistoryItem[];
};

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeLocalStorageGet<T>(key: string): T | null {
  try {
    return safeJsonParse<T>(window.localStorage.getItem(key));
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota/security errors
  }
}

import { type AuthStatus } from '../../../auth/authTypes';

export const useGenerationHistory = (userId: string | undefined, status: AuthStatus = 'loading', limit: number = 20) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const hasHydratedRef = useRef(false);
  const sessionExpiredNotifiedRef = useRef(false);

  const cacheKey = userId ? `khuyoot:designerV2_1:history:v1:${userId}` : null;

  // Hydrate history immediately from cache (so refresh doesn't blank the strip)
  useEffect(() => {
    if (!cacheKey) {
      return;
    }
    const cached = safeLocalStorageGet<HistoryCacheV1>(cacheKey);
    if (!cached || cached.v !== 1) return;

    
    setHistory(cached.items);
    hasHydratedRef.current = true;
    setActiveId((prev) => prev ?? cached.activeId ?? null);
  }, [cacheKey]);

  // Persist completed history items (exclude pending)
  useEffect(() => {
    if (!cacheKey) return;
    const completed = history.filter((item): item is CompleteHistoryItem => !('isPending' in item));
    const payload: HistoryCacheV1 = {
      v: 1,
      activeId,
      items: completed.slice(0, limit),
    };
    safeLocalStorageSet(cacheKey, payload);
  }, [cacheKey, history, activeId, limit]);

  const addPendingGeneration = useCallback((): string => {
    const clientId = `pending-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const pending: PendingGeneration = {
      clientId,
      jobId: undefined,
      isPending: true,
      createdAt: new Date().toISOString(),
    };

    setHistory((prev) => [pending, ...prev]);
    setActiveId(clientId);
    return clientId;
  }, []);

  const finalizePendingGeneration = useCallback((clientId: string, generation: GenerationRecord) => {
    setHistory((prev) =>
      prev.map((item) => {
        if ('isPending' in item && item.isPending && item.clientId === clientId) {
          const completed: CompleteHistoryItem = {
            ...generation,
            clientId,
          };
          return completed;
        }
        return item;
      })
    );
    setActiveId(generation.jobId);
  }, []);

  const removePendingGeneration = useCallback((clientId: string) => {
    setHistory((prev) => prev.filter((item) => item.clientId !== clientId));
    setActiveId((prev) => (prev === clientId ? null : prev));
  }, []);

  const markGenerationAsError = useCallback((clientId: string, error?: string) => {
    setHistory((prev) =>
      prev.map((item) => {
        if ('isPending' in item && item.isPending && item.clientId === clientId) {
          return {
            ...item,
            isError: true,
            error: error || 'Generation failed',
          };
        }
        return item;
      })
    );
  }, []);

  const refreshHistory = useCallback(async () => {
    // If no userId, we can still try if status is authenticated, but for now we follow the hook's userId
    if (!userId) return;

    try {
      setIsLoading(true);
      const data = await fetchGenerationHistory(limit);
      
      setHistory((prev) => {
        // Collect all jobIds from incoming data
        const incomingJobIds = new Set(data.map((g) => g.jobId).filter(Boolean));
        
        // 1. Keep pending generations that haven't been finalized yet (no jobId, or jobId not in incoming)
        const pending = prev.filter((item): item is PendingGeneration => 'isPending' in item && item.isPending);
        const stillPending = pending.filter(p => !p.jobId || !incomingJobIds.has(p.jobId));

        // 2. Map incoming data to CompleteHistoryItem, preserving existing clientIds if possible
        const existingClientIdByJobId = new Map<string, string>();
        for (const item of prev) {
          const jobId = (item as any).jobId;
          if (jobId) {
            existingClientIdByJobId.set(jobId, item.clientId);
          }
        }

        const mapped: CompleteHistoryItem[] = data.map((g) => ({
          ...g,
          clientId: existingClientIdByJobId.get(g.jobId) ?? g.jobId ?? `hist-${g.createdAt}-${Math.random().toString(16).slice(2)}`,
        }));

        // 3. Keep recently finalized items that might not have appeared in the API yet
        // Only keep if NOT in incomingJobIds AND younger than 2 minutes
        const mappedJobIds = new Set(mapped.map(m => m.jobId));
        const recentlyFinalized = prev.filter((item): item is CompleteHistoryItem => {
          if ('isPending' in item) return false;
          const jobId = (item as any).jobId;
          if (!jobId || mappedJobIds.has(jobId)) return false;
          
          const createdAt = new Date(item.createdAt).getTime();
          const now = Date.now();
          return (now - createdAt) < 120000; 
        });

        // Combine: Pending first, then Recently Finalized, then fresh API data
        // API data usually comes ordered by date, so we trust its order
        return [...stillPending, ...recentlyFinalized, ...mapped];
      });
    } catch (error) {
      console.error('[useGenerationHistory] Refresh failed:', error);
      if (error instanceof AuthRequiredError || error instanceof ApiUnauthorizedError) {
        if (!sessionExpiredNotifiedRef.current) {
          sessionExpiredNotifiedRef.current = true;
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, limit]);

  const deleteHistoryItem = useCallback(async (jobId: string) => {
    if (!window.confirm('Are you sure you want to clear this design slot?')) return;

    try {
      await apiFetch(`/api/designer-v2-1/history/${jobId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        requireAuth: true,
      });

      setHistory((prev) => prev.filter((item) => item.jobId !== jobId));
      if (activeId === jobId) {
        setActiveId(null);
      }
    } catch (error) {
      if (error instanceof AuthRequiredError || error instanceof ApiUnauthorizedError) {
        requestLoginPrompt('unauthorized');
        return;
      }
      alert('Could not delete the design. Please try again.');
    }
  }, [activeId]);

  useEffect(() => {
    if (!userId || status !== 'authenticated') {
      return;
    }

    // Just call refreshHistory immediately.
    refreshHistory();
  }, [userId, status, refreshHistory]);

  return {
    history,
    isLoading,
    activeId,
    setActiveId,
    refreshHistory,
    deleteHistoryItem,
    addPendingGeneration,
    finalizePendingGeneration,
    removePendingGeneration,
    markGenerationAsError,
  };
};
