import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { FabricPatternSettings, PopularRegion, Product, Tailor, Shop, Story } from '../../types'
import type { Advertisement } from '../../services/advertisementService'

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

type HomeDataCache = {
  tailors: Tailor[]
  filteredTailors: Tailor[]
  fabricStores: Shop[]
  stories: Story[]
  products: Product[]
  popularRegions: PopularRegion[]
  advertisements: Advertisement[]
  regions: string[]
  selectedRegion: string | null
  lastFetched: number | null
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
  // Home data cache for instant loading
  homeCache: HomeDataCache
  setHomeCache: (update: Partial<HomeDataCache>) => void
  setSelectedRegion: (region: string | null) => void
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

const defaultHomeCache: HomeDataCache = {
  tailors: [],
  filteredTailors: [],
  fabricStores: [],
  stories: [],
  products: [],
  popularRegions: [],
  advertisements: [],
  regions: [],
  selectedRegion: null,
  lastFetched: null,
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      hasHydrated: false,
      designerSession: defaultDesignerSession,
      tailorProducts: [],
      tailorViewMode: 'list',
      homeCache: defaultHomeCache,
      setHasHydrated: (value) => set({ hasHydrated: value }),
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
      setHomeCache: (update) =>
        set((state) => ({
          homeCache: {
            ...state.homeCache,
            ...update,
            lastFetched: Date.now(),
          },
        })),
      setSelectedRegion: (region) =>
        set((state) => ({
          homeCache: {
            ...state.homeCache,
            selectedRegion: region,
          },
        })),
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
          homeCache: {
            ...currentState.homeCache,
            ...(persisted.homeCache ?? {}),
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
export const useHomeCache = () => useAppStore((state) => state.homeCache)
export const useSelectedRegion = () => useAppStore((state) => state.homeCache.selectedRegion)
