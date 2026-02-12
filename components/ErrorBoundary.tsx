import React from 'react';
import { RefreshCw, RotateCcw, Trash2, AlertTriangle } from 'lucide-react';

type ErrorBoundaryState = { hasError: boolean; error: Error | null };
type ErrorBoundaryProps = React.PropsWithChildren<{
  fallback?: React.ReactNode;
  resetOnHashChange?: boolean;
}>;

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    (this as any).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.warn('ErrorBoundary caught error', error, info);
  }

  componentDidMount(): void {
    if ((this as any).props.resetOnHashChange !== false) {
      window.addEventListener('hashchange', this.resetBoundary);
    }
  }

  componentWillUnmount(): void {
    if ((this as any).props.resetOnHashChange !== false) {
      window.removeEventListener('hashchange', this.resetBoundary);
    }
  }

  resetBoundary = (): void => {
    (this as any).setState({ hasError: false, error: null });
  };

  clearLocalAppCaches = (): void => {
    try {
      const keys = [
        'tryon_generation_logs_v1',
        'tryon_recent_templates_v1',
      ];
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {}
  };

  render() {
    const { hasError } = (this as any).state;

    if (hasError) {
      return (
        (this as any).props.fallback || (
          <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 mb-6 relative">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-full h-full object-contain drop-shadow-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden absolute inset-0 flex items-center justify-center bg-purple-50 rounded-full">
                <AlertTriangle className="w-10 h-10 text-purple-600/50" />
              </div>
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                We have a technical issue
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Please refresh the page to continue.
                <br />
                <span className="font-arabic opacity-80 mt-1 block">نواجه مشكلة فنية، يرجى تحديث الصفحة</span>
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                <RefreshCw size={16} />
                <span>Refresh Page</span>
              </button>

              <button
                type="button"
                onClick={this.resetBoundary}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                title="Try removing the error view without reloading"
              >
                <RotateCcw size={16} />
                <span>Retry</span>
              </button>
            </div>
            
            <button
               type="button"
               onClick={() => { this.clearLocalAppCaches(); window.location.reload(); }}
               className="mt-4 text-[11px] text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 opacity-60 hover:opacity-100"
            >
               <Trash2 size={12} />
               Clear Cache & Reload
            </button>
          </div>
        )
      );
    }

    return (this as any).props.children as React.ReactNode;
  }
}
