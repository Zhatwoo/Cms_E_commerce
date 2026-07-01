'use client';

import React from 'react';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export class StorefrontRenderBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Storefront render failed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4 text-center">
          <div className="max-w-md">
            <p className="text-lg font-medium text-zinc-800">This published page could not be rendered.</p>
            <p className="mt-2 text-sm text-zinc-500">The page data is invalid or contains a block that needs to be republished.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
