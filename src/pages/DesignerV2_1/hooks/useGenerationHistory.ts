import { useState, useEffect, useCallback } from 'react';
import { fetchGenerationHistory, type GenerationRecord } from '../../../services/fabricSwapService';
import { firebaseService } from '../../../services/firebase';

export type PendingGeneration = {
  clientId: string;
  jobId?: string;
  isPending: true;
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

export const useGenerationHistory = (userId: string | undefined, limit: number = 20) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const cacheKey = userId ? `khuyoot:designerV2_1:history:v1:${userId}` : null;

  // Hydrate history immediately from cache (so refresh doesn't blank the strip)
  useEffect(() => {
    if (!cacheKey) return;
    const cached = safeLocalStorageGet<HistoryCacheV1>(cacheKey);
    if (!cached || cached.v !== 1) return;
    if (cached.items?.length) {
      setHistory(cached.items);
    }
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

  const refreshHistory = useCallback(async () => {
    if (!userId) {
      return;
    }
    try {
      setIsLoading(true);
      const data = await fetchGenerationHistory(limit);
      setHistory((prev) => {
        const realJobIds = new Set(data.map((d) => d.jobId));

        const pending = prev.filter((item): item is PendingGeneration => 'isPending' in item && item.isPending);
        const stillPending = pending.filter((p) => !p.jobId || !realJobIds.has(p.jobId));

        const existingClientIdByJobId = new Map<string, string>();
        for (const item of prev) {
          if (!('isPending' in item) && item.jobId) {
            existingClientIdByJobId.set(item.jobId, item.clientId);
          }
          if ('isPending' in item && item.jobId) {
            existingClientIdByJobId.set(item.jobId, item.clientId);
          }
        }

        const mapped: CompleteHistoryItem[] = data.map((g) => ({
          ...g,
          clientId: existingClientIdByJobId.get(g.jobId) ?? g.jobId,
        }));

        return [...stillPending, ...mapped];
      });
    } catch (error) {
      console.error('[History Hook] Failed to fetch:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, limit]);

  const deleteHistoryItem = useCallback(async (jobId: string) => {
    if (!window.confirm('Are you sure you want to clear this design slot?')) return;

    try {
      const token = await firebaseService.auth.currentUser?.getIdToken();

      const response = await fetch(`/api/designer-v2-1/history/${jobId}`, {
        method: 'DELETE',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to delete');

      setHistory((prev) => prev.filter((item) => item.jobId !== jobId));
      if (activeId === jobId) {
        setActiveId(null);
      }
    } catch (error) {
      console.error('[History] Delete failed:', error);
      alert('Could not delete the design. Please try again.');
    }
  }, [activeId]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

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
  };
};
