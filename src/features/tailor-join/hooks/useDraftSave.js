// src/features/tailor-join/hooks/useDraftSave.js

import { useState, useEffect } from 'react';

const DRAFT_KEY = 'tailor_join_draft';
const AUTOSAVE_INTERVAL = 3000; // 3 seconds

/**
 * Hook for saving and loading form drafts from localStorage
 */
export function useDraftSave(formData, setFormData) {
  const [lastSaved, setLastSaved] = useState(null);
  const [hasDraft, setHasDraft] = useState(false);

  // Check for existing draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setHasDraft(true);
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (!formData || Object.keys(formData).length === 0) return;

    const timer = setTimeout(() => {
      saveDraft(formData);
      setLastSaved(new Date());
    }, AUTOSAVE_INTERVAL);

    return () => clearTimeout(timer);
  }, [formData]);

  /**
   * Save draft to localStorage
   */
  const saveDraft = (data) => {
    try {
      const draft = {
        data,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      return true;
    } catch (error) {
      console.error('Failed to save draft:', error);
      return false;
    }
  };

  /**
   * Load draft from localStorage
   */
  const loadDraft = () => {
    try {
      const draftStr = localStorage.getItem(DRAFT_KEY);
      if (!draftStr) return null;

      const draft = JSON.parse(draftStr);
      return draft.data;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  };

  /**
   * Clear draft from localStorage
   */
  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      setHasDraft(false);
      setLastSaved(null);
      return true;
    } catch (error) {
      console.error('Failed to clear draft:', error);
      return false;
    }
  };

  /**
   * Restore draft to form
   */
  const restoreDraft = () => {
    const draft = loadDraft();
    if (draft && setFormData) {
      setFormData(draft);
      setHasDraft(false);
      return true;
    }
    return false;
  };

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    restoreDraft,
    lastSaved,
    hasDraft
  };
}
