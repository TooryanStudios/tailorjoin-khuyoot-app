import React from 'react';

type ErrorBoundaryState = { hasError: boolean; error: Error | null };
type ErrorBoundaryProps = React.PropsWithChildren<{ fallback?: React.ReactNode }>;

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

  render() {
    const { hasError } = this.state;

    if (hasError) {
      return (
        this.props.fallback || (
          <div className="max-w-xl mx-auto my-8 p-4 rounded-xl border border-red-200 bg-red-50 text-right">
            <h2 className="font-bold text-red-700 mb-2">حدث خطأ في هذه الصفحة</h2>
            <p className="text-[12px] text-red-600">جرّب تحديث الصفحة أو العودة لاحقًا.</p>
          </div>
        )
      );
    }

    return this.props.children as React.ReactNode;
  }
}
