'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingContextType {
    startLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children, forceLoading = false }: { children: React.ReactNode; forceLoading?: boolean }) {
    const [isLoading, setIsLoading] = useState(false);
    const [startPath, setStartPath] = useState<string | null>(null);
    const pathname = usePathname();

    const startLoading = () => {
        setStartPath(pathname);
        setIsLoading(true);
    };

    useEffect(() => {
        if (pathname !== startPath) {
            setIsLoading(false);
            setStartPath(null);
        }
    }, [pathname, startPath]);

    const routeLoading = forceLoading || (isLoading && startPath === pathname);

    return (
        <LoadingContext.Provider value={{ startLoading }}>
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
    if (!context) return { startLoading: () => {} }; // Fallback to no-op
    return context;
}
