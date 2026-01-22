import { useQuery } from '@tanstack/react-query'
import type { PopularRegion, Product, Shop, Story, Tailor } from '../../types'
import { firebaseService } from '../../services/firebase'
import type { Advertisement } from '../../services/advertisementService'

export function useHomeTailors() {
  return useQuery<Tailor[]>({
    queryKey: ['home-tailors'],
    queryFn: async () => {
      console.log('[useHomeTailors] Fetching tailors from Firebase...');
      try {
        const tailors = await firebaseService.getApprovedTailors();
        console.log('[useHomeTailors] Success:', tailors?.length || 0, 'tailors fetched');
        return tailors;
      } catch (error) {
        console.error('[useHomeTailors] Error:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 48,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
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
    retry: 2,
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
      console.log('[useHomeProducts] Fetching products from Firebase for category:', category);
      try {
        const products = await firebaseService.getProducts(category);
        console.log('[useHomeProducts] Success:', products?.length || 0, 'products fetched');
        return products;
      } catch (error) {
        console.error('[useHomeProducts] Error:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - Products are basically static
    gcTime: 1000 * 60 * 60 * 48,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
  })
}

export function usePopularRegions(maxRegions: number) {
  return useQuery<PopularRegion[]>({
    queryKey: ['home-popular-regions', maxRegions],
    queryFn: async () => {
      console.log('[usePopularRegions] 🚀 Starting fetch from Firebase...');
      console.log('[usePopularRegions] 🔑 ENV Check:', {
        apiKeyExists: !!import.meta.env.VITE_FIREBASE_API_KEY,
        apiKeyPrefix: import.meta.env.VITE_FIREBASE_API_KEY?.slice(0, 10),
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
      });
      
      // Primary fetch via Firebase SDK (with timeout to prevent hanging)
      let list: PopularRegion[] = []
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('getPopularRegions SDK timeout after 5000ms')), 5000)
        })
        const data = await Promise.race([
          firebaseService.getPopularRegions?.(),
          timeoutPromise,
        ])
        console.log('[usePopularRegions] 📦 SDK returned:', { type: typeof data, isArray: Array.isArray(data), length: Array.isArray(data) ? data.length : 'N/A', data });
        list = Array.isArray(data) ? (data as PopularRegion[]) : []
      } catch (sdkError) {
        console.error('[usePopularRegions] ❌ SDK fetch failed:', sdkError)
      }

      // Fallback: REST call using same Firestore project + API key (no hardcoding, still DB data)
      if (!list.length) {
        console.log('[usePopularRegions] ⚠️ SDK returned 0 items, activating REST fallback...');
        try {
          const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
          const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
          console.log('[usePopularRegions] 🌐 REST fallback config:', { apiKeyPrefix: apiKey ? apiKey.slice(0, 10) : undefined, projectId })
          if (apiKey && projectId) {
            const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/popularRegions?key=${apiKey}`
            console.log('[usePopularRegions] 📡 Fetching from:', url.replace(apiKey, 'API_KEY_HIDDEN'));
            const res = await fetch(url)
            console.log('[usePopularRegions] 📨 REST response status:', res.status, res.statusText);
            const json = await res.json()
            console.log('[usePopularRegions] 📄 REST response body:', json);
            const docs = Array.isArray(json.documents) ? json.documents : []
            console.log('[usePopularRegions] 📚 Documents found:', docs.length);
            list = docs.map((doc: any) => {
              const fields = doc.fields || {}
              const toVal = (f: any) => f?.stringValue ?? f?.integerValue ?? f?.booleanValue ?? ''
              return {
                id: doc.name?.split('/').pop() || '',
                name: toVal(fields.name),
                nameEn: toVal(fields.nameEn),
                icon: toVal(fields.icon),
                enabled: Boolean(fields.enabled?.booleanValue ?? fields.enabled),
                order: Number(fields.order?.integerValue ?? fields.order ?? 0),
                createdAt: toVal(fields.createdAt),
              } as PopularRegion
            })
            console.log('[usePopularRegions] ✅ REST fallback mapped regions:', list);
          } else {
            console.error('[usePopularRegions] ❌ Missing API key or projectId for REST fallback');
          }
        } catch (fallbackError) {
          console.error('[usePopularRegions] ❌ REST fallback failed:', fallbackError)
        }
      }

      console.log('[usePopularRegions] 📋 Before filtering - Total regions:', list.length, list);
      const enabledRegions = list
        .filter((r) => Boolean(r) && (r as any).enabled === true)
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
        .slice(0, maxRegions)
      console.log('[usePopularRegions] ✅ Final result:', enabledRegions.length, 'enabled regions:', enabledRegions);
      return enabledRegions
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
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
