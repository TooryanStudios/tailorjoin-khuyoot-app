import React from 'react';

type PerformanceMetric = {
  component: string;
  renderCount: number;
  mountTime: string;
  lastRenderTime: number;
};

const performanceMetrics = new Map<string, PerformanceMetric>();

export function trackComponentRender(componentName: string, mountTime?: string) {
  const existing = performanceMetrics.get(componentName);
  const now = performance.now();
  
  if (existing) {
    existing.renderCount++;
    existing.lastRenderTime = now;
  } else {
    performanceMetrics.set(componentName, {
      component: componentName,
      renderCount: 1,
      mountTime: mountTime || new Date().toISOString(),
      lastRenderTime: now,
    });
  }
}

export function PerformanceDebugPanel() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [metrics, setMetrics] = React.useState<PerformanceMetric[]>([]);

  React.useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      setMetrics(Array.from(performanceMetrics.values()));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold shadow-lg hover:bg-slate-800"
        title="Open Performance Debugger"
      >
        📊 Perf
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl">
      <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Performance Debug</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="p-3 space-y-2">
        {metrics.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">No metrics yet</p>
        ) : (
          metrics.map((metric) => (
            <div
              key={metric.component}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  {metric.component}
                </span>
                <span className="text-xs font-mono text-purple-600 dark:text-purple-400">
                  {metric.renderCount} renders
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Mounted: {new Date(metric.mountTime).toLocaleTimeString()}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-500">
                Last: {metric.lastRenderTime.toFixed(0)}ms
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-2 bg-slate-50 dark:bg-slate-800">
        <button
          onClick={() => {
            performanceMetrics.clear();
            setMetrics([]);
          }}
          className="text-xs text-red-600 dark:text-red-400 hover:underline"
        >
          Clear Metrics
        </button>
      </div>
    </div>
  );
}
