import { QueryClient } from '@tanstack/react-query'

// ✅ PERFORMANCE OPTIMIZATION: Zero-Lag SPA patterns
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60 * 24, // ✅ Keep data fresh for 24 hours (use manual invalidation if needed)
      gcTime: 1000 * 60 * 60 * 48, // retain cache for 48 hours
      retry: 1,
      refetchOnWindowFocus: false, // Don't refetch on tab switch (annoying in SPA)
      refetchOnMount: false, // Don't refetch on mount if data is present
    },
  },
})
