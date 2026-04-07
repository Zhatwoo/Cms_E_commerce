'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingContextType {
    startLoading: () => void;
    stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children, forceLoading = false }: { children: React.ReactNode; forceLoading?: boolean }) {
    const MIN_VISIBLE_MS = 350;
    const MAX_LOADING_MS = 20000;

    const [isLoading, setIsLoading] = useState(false);
    const [startRouteKey, setStartRouteKey] = useState<string | null>(null);
    const startedAtRef = useRef<number>(0);
    const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const pathname = usePathname();
    const searchParams = useSearchParams();

    const routeKey = `${pathname}?${searchParams.toString()}`;

    const startLoading = () => {
        if (stopTimerRef.current) {
            clearTimeout(stopTimerRef.current);
            stopTimerRef.current = null;
        }
        startedAtRef.current = Date.now();
        setStartRouteKey(routeKey);
        setIsLoading(true);
    };

    const stopLoading = () => {
        if (stopTimerRef.current) {
            clearTimeout(stopTimerRef.current);
            stopTimerRef.current = null;
        }
        setIsLoading(false);
        setStartRouteKey(null);
    };

    useEffect(() => {
        if (!isLoading || !startRouteKey) return;
        if (startRouteKey && routeKey !== startRouteKey) {
            const elapsed = Date.now() - startedAtRef.current;
            const delay = Math.max(0, MIN_VISIBLE_MS - elapsed);
            stopTimerRef.current = window.setTimeout(() => {
                stopLoading();
            }, delay);
        }
    }, [routeKey, startRouteKey, isLoading]);

    useEffect(() => {
        if (!isLoading) return;
        const timer = window.setTimeout(() => {
            stopLoading();
        }, MAX_LOADING_MS);
        return () => window.clearTimeout(timer);
    }, [isLoading]);

    useEffect(() => {
        return () => {
            if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
        };
    }, []);

    const routeLoading = forceLoading || isLoading;

    return (
        <LoadingContext.Provider value={{ startLoading, stopLoading }}>
            <AnimatePresence>
                {routeLoading && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="pointer-events-none fixed left-0 right-0 top-0 z-[999]"
                    >
                        <div className="h-[2px] w-full" style={{ backgroundColor: 'rgba(103,2,191,0.08)' }}>
                            <motion.div
                                className="h-full"
                                initial={{ x: '-45%', width: '38%' }}
                                animate={{ x: '180%', width: '22%' }}
                                transition={{ duration: 0.75, repeat: Infinity, ease: 'linear' }}
                                style={{ background: 'linear-gradient(90deg, #B13BFF 0%, #B36760 50%, #FFCC00 100%)' }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {children}
        </LoadingContext.Provider>
    );
}

export const useAdminLoading = () => contextValue(useContext(LoadingContext));

function contextValue(context: LoadingContextType | undefined) {
    if (!context) return { startLoading: () => {}, stopLoading: () => {} }; // Fallback to no-op
    return context;
}
