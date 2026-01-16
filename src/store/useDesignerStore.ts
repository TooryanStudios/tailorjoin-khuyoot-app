import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type DesignerModel = 'NanoBana' | 'Pro';

export type PersistedImage = {
  base64: string;
  mimeType: string;
};

export interface DesignerState {
  selectedModel: DesignerModel;

  selectedTemplateId: string | null;
  selectedTemplateImage: PersistedImage | null;

  selectedFabricId: string | null;
  selectedFabricImage: PersistedImage | null;

  activeResult: string | null;

  setSelectedModel: (model: DesignerModel) => void;
  setTemplateId: (templateId: string | null) => void;
  setTemplateSelection: (args: { templateId: string | null; image: PersistedImage | null }) => void;
  setFabricId: (fabricId: string | null) => void;
  setFabricSelection: (args: { fabricId: string | null; image: PersistedImage | null }) => void;
  setActiveResult: (url: string | null) => void;
  clearSelection: () => void;

  hydrateFromStorage: () => void;
}

const STORAGE_KEY = 'khuyoot:designer:v2_1';
const MAX_PERSIST_IMAGE_BYTES = 200_000; // guard localStorage quota (≈200 KB per image)

function isQuotaError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const name = (error as { name?: string }).name;
  return name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED';
}

function isPersistableImage(image: PersistedImage | null) {
  if (!image) return null;
  // base64 strings are ~4/3 of the original size; bail out if too large
  return image.base64.length <= MAX_PERSIST_IMAGE_BYTES ? image : null;
}

const safeStorage = {
  getItem: (name: string) => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      window.localStorage.setItem(name, value);
    } catch (err) {
      if (isQuotaError(err)) {
        console.warn('[DesignerStore] Skipping persist: quota exceeded');
        try {
          window.localStorage.removeItem(name);
        } catch {
          /* ignore */
        }
      }
    }
  },
  removeItem: (name: string) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

function safeReadStorage(): Partial<DesignerState> | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<DesignerState>;
  } catch {
    return null;
  }
}

export const useDesignerStore = create<DesignerState>()(
  persist(
    (set) => ({
      selectedModel: 'NanoBana',

      selectedTemplateId: null,
      selectedTemplateImage: null,

      selectedFabricId: null,
      selectedFabricImage: null,

      activeResult: null,

      setSelectedModel: (model) => set({ selectedModel: model }),

      setTemplateId: (templateId) => set({ selectedTemplateId: templateId }),

      setTemplateSelection: ({ templateId, image }) =>
        set({ selectedTemplateId: templateId, selectedTemplateImage: image }),

      setFabricId: (fabricId) => set({ selectedFabricId: fabricId }),

      setFabricSelection: ({ fabricId, image }) => set({ selectedFabricId: fabricId, selectedFabricImage: image }),

      setActiveResult: (url) => set({ activeResult: url }),

      clearSelection: () => set({
        selectedTemplateId: null,
        selectedTemplateImage: null,
        selectedFabricId: null,
        selectedFabricImage: null,
      }),

      hydrateFromStorage: () => {
        // Explicit hydrate hook requested by directive.
        // Persist middleware already hydrates, but this provides a manual fallback.
        const stored = safeReadStorage();
        if (!stored) return;
        set((prev) => ({
          ...prev,
          ...stored,
        }));
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        selectedModel: state.selectedModel,
        selectedTemplateId: state.selectedTemplateId,
        selectedFabricId: state.selectedFabricId,
        activeResult: state.activeResult,
      }),
      version: 2,
      migrate: (persistedState, version) => {
        // Privacy: scrub any previously persisted base64 images.
        if (!persistedState || typeof persistedState !== 'object') return persistedState as any;
        const s = persistedState as any;
        if ('selectedTemplateImage' in s) delete s.selectedTemplateImage;
        if ('selectedFabricImage' in s) delete s.selectedFabricImage;
        return s;
      },
    }
  )
);
