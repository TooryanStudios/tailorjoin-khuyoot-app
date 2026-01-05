import React, { ComponentType, ReactNode, useCallback, useState } from 'react'
import { Link, LinkProps } from 'react-router-dom'

interface SmartLinkProps extends Omit<LinkProps, 'to'> {
  to: string
  children: ReactNode
  /** Component to preload on hover */
  preloadComponent?: () => Promise<{ default: ComponentType<any> }>
  className?: string
}

/**
 * Enhanced Link component that preloads lazy-loaded components on hover
 * This creates an "instant" click experience by loading chunks during hover (~200ms)
 * 
 * Usage:
 * const Designer = React.lazy(() => import('./pages/DesignerV2'))
 * <SmartLink to="/designer" preloadComponent={() => import('./pages/DesignerV2')}>
 *   Open Designer
 * </SmartLink>
 */
export const SmartLink = React.memo<SmartLinkProps>(
  function SmartLink({
    to,
    children,
    preloadComponent,
    className,
    onMouseEnter,
    onFocus,
    ...props
  }) {
    const [isLoaded, setIsLoaded] = useState(false)

    const handlePreload = useCallback(async () => {
      if (!isLoaded && preloadComponent) {
        try {
          await preloadComponent()
          setIsLoaded(true)
        } catch (error) {
          console.warn('Failed to preload component:', error)
        }
      }
    }, [isLoaded, preloadComponent])

    return (
      <Link
        to={to}
        className={className}
        onMouseEnter={(e) => {
          handlePreload()
          onMouseEnter?.(e)
        }}
        onFocus={(e) => {
          handlePreload()
          onFocus?.(e)
        }}
        {...props}
      >
        {children}
      </Link>
    )
  }
)
