import { useSearchParams } from 'react-router-dom'
import { useCallback } from 'react'

interface TabStateOptions {
  defaultTab: string
  paramName?: string
  replace?: boolean
}

/**
 * Hook to manage tab state via URL search params
 * This enables:
 * - URL-driven tab state (shareable URLs)
 * - Back/forward button support
 * - No component re-mounting when switching tabs
 */
export function useTabState({
  defaultTab,
  paramName = 'tab',
  replace = false,
}: TabStateOptions) {
  const [searchParams, setSearchParams] = useSearchParams()

  const activeTab = searchParams.get(paramName) || defaultTab

  const setActiveTab = useCallback(
    (tabId: string) => {
      const currentParams = Object.fromEntries([...searchParams])
      setSearchParams(
        { ...currentParams, [paramName]: tabId },
        { replace }
      )
    },
    [searchParams, setSearchParams, paramName, replace]
  )

  return { activeTab, setActiveTab }
}
