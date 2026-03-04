'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

type NavigationLoadingContextValue = {
  isNavigating: boolean;
  startNavigation: () => void;
};

const NavigationLoadingContext = createContext<NavigationLoadingContextValue | undefined>(undefined);

export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  useEffect(() => {
    if (!isNavigating) return;
    const timeout = window.setTimeout(() => setIsNavigating(false), 10000);
    return () => window.clearTimeout(timeout);
  }, [isNavigating]);

  const value = useMemo<NavigationLoadingContextValue>(() => ({
    isNavigating,
    startNavigation: () => setIsNavigating(true),
  }), [isNavigating]);

  return (
    <NavigationLoadingContext.Provider value={value}>
      {children}
      {isNavigating && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0A0730]/55 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#2B3488] bg-[#10145A]/95 px-6 py-5 text-sm font-semibold text-white min-w-[180px]">
            <img src="/images/logo.svg" alt="Logo" className="h-9 w-auto" />
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#FFCE00] border-t-transparent" />
              Loading...
            </div>
          </div>
        </div>
      )}
    </NavigationLoadingContext.Provider>
  );
}

export function useNavigationLoading() {
  const context = useContext(NavigationLoadingContext);
  if (!context) {
    throw new Error('useNavigationLoading must be used within NavigationLoadingProvider');
  }
  return context;
}
