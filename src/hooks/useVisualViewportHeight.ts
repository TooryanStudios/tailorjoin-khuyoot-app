import { useEffect } from 'react'

export const useVisualViewportHeight = () => {
  useEffect(() => {
    const setHeight = () => {
      const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight
      document.documentElement.style.setProperty('--app-height', `${vh}px`)
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
