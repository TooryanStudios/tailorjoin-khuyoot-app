import { useQuery } from '@tanstack/react-query'
import type { PopularRegion, Product, Shop, Story, Tailor } from '../../types'
import { firebaseService } from '../../services/firebase'
import type { Advertisement } from '../../services/advertisementService'

export function useHomeTailors() {
  return useQuery<Tailor[]>({
    queryKey: ['home-tailors'],
    queryFn: async () => {
      const tailors = await firebaseService.getApprovedTailors()
      return tailors
    },
    staleTime: 1000 * 60 * 1, // 1 minute only - SAFETY: prevent stale data
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true, // Always fetch fresh data
  })
}

export function useFabricStores(enabled: boolean = true) {
  return useQuery<Shop[]>({
    queryKey: ['home-fabric-stores'],
    queryFn: async () => {
      const stores = await firebaseService.getApprovedFabricStores()
      return stores
    },
    enabled,
    staleTime: 1000 * 60 * 1, // 1 minute only
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
  })
}

export function useStories(enabled: boolean) {
  return useQuery<Story[]>({
    queryKey: ['home-stories'],
    queryFn: async () => {
      const { getStories } = await import('../../services/mockService')
      const stories = await getStories()
      return stories
    },
    enabled,
    staleTime: 1000 * 60 * 1, // 1 minute only
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
  })
}

export function useHomeProducts(category: string) {
  return useQuery<Product[]>({
    queryKey: ['home-products', category],
    queryFn: async () => {
      const products = await firebaseService.getProducts(category)
      return products
    },
    staleTime: 1000 * 60 * 1, // 1 minute only
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
  })
}

export function usePopularRegions(maxRegions: number) {
  return useQuery<PopularRegion[]>({
    queryKey: ['home-popular-regions', maxRegions],
    queryFn: async () => {
      const data = await firebaseService.getPopularRegions?.()
      const list: PopularRegion[] = Array.isArray(data) ? (data as PopularRegion[]) : []
      const enabledRegions = list
        .filter((r) => Boolean(r) && (r as any).enabled === true)
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
        .slice(0, maxRegions)

      return enabledRegions
    },
    staleTime: 1000 * 60 * 2, // 2 minutes (regions change less frequently)
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: true,
  })
}

export function useHomeAdvertisements(location: string = 'homepage_main') {
  return useQuery<Advertisement[]>({
    queryKey: ['home-advertisements', location],
    queryFn: async () => {
      const { getActiveAdvertisements } = await import('../../services/advertisementService')
      const activeAds = await getActiveAdvertisements()
      const filteredAds = activeAds.filter((ad) => ad.adLocation === location)
      return filteredAds
    },
    staleTime: 1000 * 60 * 2, // 2 minutes - ads should be fresh
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
  })
}

export function useFilteredTailors(region: string | null, maxTailors: number = 8) {
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
      return data
    },
    staleTime: 1000 * 60 * 1, // 1 minute only
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
    retry: false, // Don't retry on Firebase index errors
  })
}
