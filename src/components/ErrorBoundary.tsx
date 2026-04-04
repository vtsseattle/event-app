'use client';

import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center bg-bg px-6 text-center">
          <div className="mb-6 text-5xl">✨</div>
          <h2 className="font-heading mb-3 text-2xl font-bold text-accent">
            Something went wrong
          </h2>
          <p className="mb-6 max-w-md text-muted">
            An unexpected error occurred. Please try again — the show must go on!
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="rounded-lg bg-accent px-6 py-3 font-semibold text-bg transition-colors hover:bg-accent-light"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
