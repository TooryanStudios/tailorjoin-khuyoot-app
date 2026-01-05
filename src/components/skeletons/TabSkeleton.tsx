/**
 * Skeleton loader for tab content
 * Shows pulse animation while lazy-loaded content loads
 */
export function TabSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      {/* Simulate multiple content blocks */}
      {[1, 2, 3, 4].map((id) => (
        <div key={`skeleton-${id}`} className="space-y-3">
          {/* Heading skeleton */}
          <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
          
          {/* Text skeleton */}
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-4/6 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  )
}
