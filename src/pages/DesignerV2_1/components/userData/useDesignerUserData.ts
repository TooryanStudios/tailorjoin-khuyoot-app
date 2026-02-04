import { useState, useEffect } from 'react';
import { useAuth } from '../../../../auth/useAuth';
import { apiJson } from '../../../../api/apiFetch';

export const useDesignerUserData = () => {
  const { status, user, refreshProfile } = useAuth();
  
  // Use user from AuthContext directly for "cookie approach" (instant load)
  const serverUser = user;
  
  // Only show loading if we really have nothing to show and auth is still checking
  const loading = status === 'loading' && !user;
  const error = null;

  // Generation history
  const [generationHistory, setGenerationHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Closet / Saved items
  const [closetItems, setClosetItems] = useState<any[]>([]);
  const [closetLoading, setClosetLoading] = useState(false);
  const [closetError, setClosetError] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!user && status !== 'authenticated') return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const data = await apiJson<any>('/api/designer-v2-1/history?limit=20');
      setGenerationHistory(data.generations || data || []);
    } catch (err: any) {
      setHistoryError(err.message || 'Failed to fetch generation history');
      setGenerationHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Sync closet items from user profile automatically
  useEffect(() => {
    if (user) {
        setClosetLoading(true);
        try {
            const items = (user as any).closet || (user as any).savedItems || [];
            setClosetItems(items);
            setClosetError(null);
        } catch(e) {
            setClosetError("Failed to load closet");
        } finally {
            setClosetLoading(false);
        }
    }
  }, [user]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchHistory();
    }
  }, [status]);

  return {
    serverUser,
    loading,
    error,
    generationHistory,
    historyLoading,
    historyError,
    closetItems,
    closetLoading,
    closetError,
    refreshUserData: refreshProfile,
    refreshHistory: fetchHistory,
  };
};
