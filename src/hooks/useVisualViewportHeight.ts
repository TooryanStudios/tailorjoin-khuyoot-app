import { useEffect } from 'react'

export const useVisualViewportHeight = () => {
  useEffect(() => {
    const setHeight = () => {
      const vv = window.visualViewport
      const vvHeight = typeof vv?.height === 'number' ? vv.height : 0
      const inner = typeof window.innerHeight === 'number' ? window.innerHeight : 0

      // Some browsers briefly report visualViewport.height=0 during UI transitions
      // (closing modals/keyboard). Since html/body height is tied to --app-height,
      // that would collapse the entire app to a blank screen.
      const next = Math.max(inner, vvHeight)
      const clamped = next >= 200 ? next : inner || 800

      document.documentElement.style.setProperty('--app-height', `${clamped}px`)
    }

    window.visualViewport?.addEventListener('resize', setHeight)
    window.addEventListener('resize', setHeight)
    setHeight()

    return () => {
      window.visualViewport?.removeEventListener('resize', setHeight)
      window.removeEventListener('resize', setHeight)
    }
  }, [])
}
