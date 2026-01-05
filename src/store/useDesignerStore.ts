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

  hydrateFromStorage: () => void;
}

const STORAGE_KEY = 'khuyoot:designer:v2_1';

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
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedModel: state.selectedModel,
        selectedTemplateId: state.selectedTemplateId,
        selectedTemplateImage: state.selectedTemplateImage,
        selectedFabricId: state.selectedFabricId,
        selectedFabricImage: state.selectedFabricImage,
        activeResult: state.activeResult,
      }),
      version: 1,
    }
  )
);
