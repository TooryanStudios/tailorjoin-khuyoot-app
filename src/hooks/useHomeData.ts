import { useQuery } from '@tanstack/react-query'
import type { PopularRegion, Product, Shop, Story, Tailor } from '../../types'
import { firebaseService } from '../../services/firebase'
import { useAppStore } from '../store/useAppStore'
import type { Advertisement } from '../../services/advertisementService'

export function useHomeTailors() {
  const setHomeCache = useAppStore((state) => state.setHomeCache)
  const cachedTailors = useAppStore((state) => state.homeCache.tailors)

  return useQuery<Tailor[]>({
    queryKey: ['home-tailors'],
    queryFn: async () => {
      const tailors = await firebaseService.getApprovedTailors()
      setHomeCache({ tailors })
      return tailors
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    placeholderData: cachedTailors.length > 0 ? cachedTailors : undefined,
  })
}

export function useFabricStores(enabled: boolean = true) {
  const setHomeCache = useAppStore((state) => state.setHomeCache)
  const cachedStores = useAppStore((state) => state.homeCache.fabricStores)

  return useQuery<Shop[]>({
    queryKey: ['home-fabric-stores'],
    queryFn: async () => {
      const stores = await firebaseService.getApprovedFabricStores()
      setHomeCache({ fabricStores: stores })
      return stores
    },
    enabled,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    placeholderData: cachedStores.length > 0 ? cachedStores : undefined,
  })
}

export function useStories(enabled: boolean) {
  const setHomeCache = useAppStore((state) => state.setHomeCache)
  const cachedStories = useAppStore((state) => state.homeCache.stories)

  return useQuery<Story[]>({
    queryKey: ['home-stories'],
    queryFn: async () => {
      const { getStories } = await import('../../services/mockService')
      const stories = await getStories()
      setHomeCache({ stories })
      return stories
    },
    enabled,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    placeholderData: cachedStories.length > 0 ? cachedStories : undefined,
  })
}

export function useHomeProducts(category: string) {
  const setHomeCache = useAppStore((state) => state.setHomeCache)
  const cachedProducts = useAppStore((state) => state.homeCache.products)

  return useQuery<Product[]>({
    queryKey: ['home-products', category],
    queryFn: async () => {
      const products = await firebaseService.getProducts(category)
      if (category === 'all') {
        setHomeCache({ products })
      }
      return products
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    placeholderData: category === 'all' && cachedProducts.length > 0 ? cachedProducts : undefined,
  })
}

export function usePopularRegions(maxRegions: number) {
  const setHomeCache = useAppStore((state) => state.setHomeCache)
  const cachedRegions = useAppStore((state) => state.homeCache?.popularRegions) ?? []

  return useQuery<PopularRegion[]>({
    queryKey: ['home-popular-regions', maxRegions],
    queryFn: async () => {
      const data = await firebaseService.getPopularRegions?.()
      const list: PopularRegion[] = Array.isArray(data) ? (data as PopularRegion[]) : []
      const enabledRegions = list
        .filter((r) => Boolean(r) && (r as any).enabled === true)
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
        .slice(0, maxRegions)

      setHomeCache({ popularRegions: enabledRegions })
      return enabledRegions
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    placeholderData: Array.isArray(cachedRegions) && cachedRegions.length > 0 ? cachedRegions : undefined,
  })
}

export function useHomeAdvertisements(location: string = 'homepage_main') {
  const setHomeCache = useAppStore((state) => state.setHomeCache)
  const cachedAds = useAppStore((state) => state.homeCache?.advertisements) ?? []

  return useQuery<Advertisement[]>({
    queryKey: ['home-advertisements', location],
    queryFn: async () => {
      const { getActiveAdvertisements } = await import('../../services/advertisementService')
      const activeAds = await getActiveAdvertisements()
      const filteredAds = activeAds.filter((ad) => ad.adLocation === location)
      setHomeCache({ advertisements: filteredAds })
      return filteredAds
    },
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    placeholderData: Array.isArray(cachedAds) && cachedAds.length > 0 ? cachedAds.filter((ad) => ad.adLocation === location) : undefined,
  })
}

export function useFilteredTailors(region: string | null, maxTailors: number = 8) {
  const setHomeCache = useAppStore((state) => state.setHomeCache)
  const cachedTailors = useAppStore((state) => state.homeCache?.filteredTailors) ?? []

  return useQuery<Tailor[]>({
    queryKey: ['filtered-tailors', region, maxTailors],
    queryFn: async () => {
      let data: Tailor[] = []
      if (region) {
        data = await firebaseService.getTailorsByRegion(region, maxTailors)
      } else {
        data = await firebaseService.getFeaturedTailors()
        if (data.length === 0) {
          data = await firebaseService.getApprovedTailors()
        }
      }
      setHomeCache({ filteredTailors: data })
      return data
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    placeholderData: Array.isArray(cachedTailors) && cachedTailors.length > 0 ? cachedTailors : undefined,
  })
}
