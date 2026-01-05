import { useEffect, useRef, type Ref } from 'react'
import { useLocation } from 'react-router-dom'

interface ScrollPosition {
  x: number
  y: number
}

/**
 * Hook to save and restore scroll position for specific routes/tabs
 * This ensures users return to their exact scroll position when navigating back
 */
export function useScrollMemory(containerRef?: Ref<HTMLElement>) {
  const location = useLocation()
  const scrollPositions = useRef<Map<string, ScrollPosition>>(new Map())

  useEffect(() => {
    const container = containerRef?.current || window
    const key = `${location.pathname}${location.search}`

    // Restore scroll position on route change
    const savedPosition = scrollPositions.current.get(key)
    if (savedPosition) {
      if (containerRef?.current) {
        containerRef.current.scrollLeft = savedPosition.x
        containerRef.current.scrollTop = savedPosition.y
      } else {
        window.scrollTo(savedPosition.x, savedPosition.y)
      }
    } else {
      // Scroll to top for new routes
      if (containerRef?.current) {
        containerRef.current.scrollLeft = 0
        containerRef.current.scrollTop = 0
      } else {
        window.scrollTo(0, 0)
      }
    }
  }, [location, containerRef])

  // Save scroll position before navigation
  useEffect(() => {
    const container = containerRef?.current || window

    const handleScroll = () => {
      const key = `${location.pathname}${location.search}`
      const position: ScrollPosition = {
        x: containerRef?.current?.scrollLeft ?? window.scrollX,
        y: containerRef?.current?.scrollTop ?? window.scrollY,
      }
      scrollPositions.current.set(key, position)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [location, containerRef])
}
