import React from 'react';

type ErrorBoundaryState = { hasError: boolean; error: Error | null };
type ErrorBoundaryProps = React.PropsWithChildren<{
  fallback?: React.ReactNode;
  resetOnHashChange?: boolean;
}>;

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: ErrorBoundaryProps;
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.warn('ErrorBoundary caught error', error, info);
  }

  componentDidMount(): void {
    if (this.props.resetOnHashChange !== false) {
      window.addEventListener('hashchange', this.resetBoundary);
    }
  }

  componentWillUnmount(): void {
    if (this.props.resetOnHashChange !== false) {
      window.removeEventListener('hashchange', this.resetBoundary);
    }
  }

  resetBoundary = (): void => {
    this.setState({ hasError: false, error: null });
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
    const { hasError } = this.state;

    if (hasError) {
      return (
        this.props.fallback || (
          <div className="max-w-xl mx-auto my-8 p-4 rounded-xl border border-red-200 bg-red-50 text-right">
            <h2 className="font-bold text-red-700 mb-2">حدث خطأ في هذه الصفحة</h2>
            <p className="text-[12px] text-red-600 mb-3">جرّب تحديث الصفحة أو العودة لاحقًا.</p>
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={this.resetBoundary}
                className="px-3 py-2 rounded-lg text-sm bg-white border border-red-200 text-red-700 hover:bg-red-100"
              >
                إعادة المحاولة
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-3 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700"
              >
                تحديث الصفحة
              </button>
              <button
                type="button"
                onClick={() => { this.clearLocalAppCaches(); this.resetBoundary(); }}
                className="px-3 py-2 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
              >
                مسح البيانات المؤقتة
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children as React.ReactNode;
  }
}
