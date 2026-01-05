/**
 * Skeleton loader for app shell initial load
 * Shows pulse animation for header, main content, and bottom nav
 */
export function AppShellSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950 animate-pulse">
      {/* Header skeleton */}
      <div className="h-16 bg-slate-200 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700" />

      {/* Main content skeleton */}
      <div className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-900">
        <div className="p-4 space-y-4">
          {/* Multiple content blocks */}
          {[1, 2, 3].map((id) => (
            <div key={`shell-skeleton-${id}`} className="space-y-3">
              <div className="h-4 w-48 rounded bg-slate-300 dark:bg-slate-700" />
              <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom navigation skeleton */}
      <div className="h-20 bg-slate-200 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700" />
    </div>
  )
}
