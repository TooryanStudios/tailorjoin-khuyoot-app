import { QueryClient } from '@tanstack/react-query'

// ✅ Optimized for Stale-While-Revalidate (SWR) pattern
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // ✅ keep data fresh for 10 minutes (was 5)
      gcTime: 1000 * 60 * 30, // retain cache for 30 minutes
      retry: 1,
      refetchOnWindowFocus: false, // ✅ Stop constant re-loading on tab switch
    },
  },
})
