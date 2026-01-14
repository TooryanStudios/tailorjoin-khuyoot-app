import { QueryClient } from '@tanstack/react-query'

// ✅ Optimized for Stale-While-Revalidate (SWR) pattern with FRESH data priority
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 1, // ✅ Data fresh for 1 minute only (SAFETY: prevent stale data)
      gcTime: 1000 * 60 * 10, // retain cache for 10 minutes
      retry: 1,
      refetchOnWindowFocus: true, // ✅ CRITICAL: Always fetch fresh data when user returns to tab
      refetchOnMount: 'always', // ✅ CRITICAL: Always fetch fresh data on component mount
    },
  },
})
