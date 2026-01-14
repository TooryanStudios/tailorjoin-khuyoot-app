import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { FabricPatternSettings, Product } from '../../types'

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
      storage: createJSONStorage(() => localStorage),
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
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

export const useDesignerSession = () => useAppStore((state) => state.designerSession)
export const useSelectedRegion = () => useAppStore((state) => state.selectedRegion)
