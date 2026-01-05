import React, { Suspense } from 'react'
import { Outlet, ScrollRestoration } from 'react-router-dom'
import { AppShellSkeleton } from './skeletons/AppShellSkeleton'

/**
 * Main app layout that persists across route changes
 * - Header and footer never unmount during navigation
 * - Content switches via <Outlet /> without full page reload
 * - Scroll position is automatically restored on back/forward
 * 
 * CSS Grid Structure:
 * - Header: Fixed top bar with navigation
 * - Main: Scrollable content area with route outlet
 * - Footer: Fixed bottom nav or information
 */
export const MainLayout = React.memo(
  React.forwardRef<HTMLDivElement, {}>(
    function MainLayout(_props, ref) {
      return (
        <div
          ref={ref}
          className="flex flex-col h-screen bg-white dark:bg-slate-950 overflow-hidden"
        >
          {/* Scroll restoration handler */}
          <ScrollRestoration />

          {/* Header - persists across routes - DISABLED */}
          {/* <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center px-4">
            {/* Header content will be injected by parent */}
          {/* </header> */}

          {/* Main content area - routes render here */}
          <main
            className="flex-1 overflow-auto bg-white dark:bg-slate-950"
            role="main"
          >
            <Suspense fallback={<AppShellSkeleton />}>
              <Outlet />
            </Suspense>
          </main>

          {/* Footer - persists across routes */}
          <footer className="h-16 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
            {/* Footer content will be injected by parent */}
          </footer>
        </div>
      )
    }
  )
)
