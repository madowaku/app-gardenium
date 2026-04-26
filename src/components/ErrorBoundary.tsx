import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Leaf } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg-main p-4">
          <div className="bg-bg-card max-w-md w-full rounded-[32px] p-8 text-center shadow-sm border border-border-color">
            <div className="w-16 h-16 bg-red-50 rounded-[24px] mx-auto flex items-center justify-center mb-6">
              <Leaf className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-serif text-text-dark mb-4">Oops! Something went wrong.</h1>
            <p className="text-text-muted mb-8">
              We're sorry, but an unexpected error occurred. Please try refreshing the page or going back home.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 px-6 bg-primary text-white rounded-full font-bold hover:bg-primary-hover transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full py-3 px-6 bg-white border border-border-color text-text-dark rounded-full font-bold hover:bg-gray-50 transition-colors"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
