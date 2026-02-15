import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { FabricPatternSettings, Product } from '../../types'

declare global {
  interface Window {
    __diagnosticLog?: (msg: string) => void;
  }
}

type FabricSource = 'khuyoot' | 'shops' | 'upload' | null

export type GenerationItem = {
  jobId: string
  url: string
  thumbnailUrl?: string | null
  createdAt: number
  width?: number | null
  height?: number | null
  fabricId?: string | null
}

type DesignerSession = {
  selectedTemplate: string | null
  fabricSource: FabricSource
  selectedFabricId: string | null
  fabricImage: string | null
  generatedImage: string | null
  fabricSettings: FabricPatternSettings
  generations: GenerationItem[]
  currentStep: number
  lastUpdated: number
}

type AppStore = {
  hasHydrated: boolean
  designerSession: DesignerSession
  setDesignerSession: (update: Partial<DesignerSession>) => void
  clearDesignerSession: () => void
  setHasHydrated: (value: boolean) => void
  tailorProducts: Product[]
  setTailorProducts: (products: Product[]) => void
  tailorViewMode: 'list' | 'grid' | 'compact'
  setTailorViewMode: (mode: 'list' | 'grid' | 'compact') => void
  // Selected region for filtering
  selectedRegion: string | null
  setSelectedRegion: (region: string | null) => void
  // SPA Persistence Test
  spaTestNote: string
  setSpaTestNote: (note: string) => void
}

const defaultFabricSettings: FabricPatternSettings = {
  patternScale: 1,
  patternOffsetX: 0,
  patternOffsetY: 0,
  patternRotation: 0,
  patternRepeatMode: 'repeat',
}

const defaultDesignerSession: DesignerSession = {
  selectedTemplate: 'dishdasha',
  fabricSource: 'khuyoot',
  selectedFabricId: null,
  fabricImage: null,
  generatedImage: null,
  fabricSettings: defaultFabricSettings,
  generations: [],
  currentStep: 1,
  lastUpdated: Date.now(),
}

// Safe storage that falls back to in-memory if localStorage is blocked (private browsing)
const createSafeStorage = () => {
  let memoryStorage: Record<string, string> = {};
  
  try {
    // Test if localStorage is available
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    
    console.log('[useAppStore] localStorage available');
    if (window.__diagnosticLog) window.__diagnosticLog('✓ localStorage available');
    
    return localStorage;
  } catch (e) {
    console.warn('[useAppStore] localStorage blocked, using in-memory storage');
    if (window.__diagnosticLog) window.__diagnosticLog('⚠️ localStorage blocked - using memory');
    
    // Return in-memory fallback
    return {
      getItem: (key: string) => memoryStorage[key] || null,
      setItem: (key: string, value: string) => { memoryStorage[key] = value; },
      removeItem: (key: string) => { delete memoryStorage[key]; },
    };
  }
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      hasHydrated: false,
      designerSession: defaultDesignerSession,
      tailorProducts: [],
      tailorViewMode: 'list',
      selectedRegion: null,
      spaTestNote: '', // SPA test persistence
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setSpaTestNote: (note) => set({ spaTestNote: note }),
      setDesignerSession: (update) =>
        set((state) => ({
          designerSession: {
            ...state.designerSession,
            ...update,
            lastUpdated: Date.now(),
          },
        })),
      clearDesignerSession: () =>
        set({
          designerSession: {
            ...defaultDesignerSession,
            lastUpdated: Date.now(),
          },
        }),
      setTailorProducts: (products) => set({ tailorProducts: products }),
      setTailorViewMode: (mode) => set({ tailorViewMode: mode }),
      setSelectedRegion: (region) => set({ selectedRegion: region }),
    }),
    {
      name: 'khuyoot-designer-storage',
      storage: createJSONStorage(() => createSafeStorage()),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<AppStore>

        return {
          ...currentState,
          ...persisted,
          designerSession: {
            ...currentState.designerSession,
            ...(persisted.designerSession ?? {}),
          },
        }
      },
      onRehydrateStorage: () => {
        console.log('[useAppStore] onRehydrateStorage setup');
        if (window.__diagnosticLog) window.__diagnosticLog('⏳ Store setup rehydration');
        
        return (state, error) => {
          console.log('[useAppStore] Rehydration callback fired, error:', error, 'state:', !!state);
          
          if (error) {
            console.error('[useAppStore] Hydration error:', error);
            if (window.__diagnosticLog) window.__diagnosticLog('❌ Hydration error: ' + error.message);
          } else {
            console.log('[useAppStore] Hydration complete');
            if (window.__diagnosticLog) window.__diagnosticLog('✓ Hydration complete');
          }
          
          // Always set hydrated, even if there was an error
          if (state) {
            console.log('[useAppStore] Setting hasHydrated = true');
            state.setHasHydrated(true);
            if (window.__diagnosticLog) window.__diagnosticLog('✅ hasHydrated = TRUE');
          } else {
            console.error('[useAppStore] State is null!');
            if (window.__diagnosticLog) window.__diagnosticLog('🚨 State NULL in callback');
          }
        };
      },
    }
  )
);

// Failsafe: Force hydration after timeout if it hasn't happened
// Run in next tick to ensure store is fully created
if (typeof window !== 'undefined') {
  setTimeout(() => {
    console.log('[useAppStore] Checking hydration status...');
    const state = useAppStore.getState();
    console.log('[useAppStore] Current hasHydrated:', state.hasHydrated);
    
    if (!state.hasHydrated) {
      console.warn('[useAppStore] FORCING hydration after 300ms timeout');
      if (window.__diagnosticLog) window.__diagnosticLog('⚠️ FORCING store hydration (timeout)');
      state.setHasHydrated(true);
    }
  }, 300);
  
  // Second failsafe at 1 second
  setTimeout(() => {
    const state = useAppStore.getState();
    if (!state.hasHydrated) {
      console.error('[useAppStore] EMERGENCY: Forcing hydration at 1s');
      if (window.__diagnosticLog) window.__diagnosticLog('🚨 EMERGENCY hydration at 1s');
      state.setHasHydrated(true);
    }
  }, 1000);
}

export const useDesignerSession = () => useAppStore((state) => state.designerSession)
export const useSelectedRegion = () => useAppStore((state) => state.selectedRegion)
