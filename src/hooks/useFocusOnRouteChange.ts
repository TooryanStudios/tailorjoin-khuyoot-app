import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Hook to manage focus on route/tab changes for accessibility
 * Moves focus to main content when navigating, ensuring screen readers announce new page
 */
export function useFocusOnRouteChange(selector: string = 'main') {
  const location = useLocation()

  useEffect(() => {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      element.focus()
      // Ensure focus is visible for keyboard users
      element.setAttribute('tabindex', '-1')
    }
  }, [location, selector])
}
