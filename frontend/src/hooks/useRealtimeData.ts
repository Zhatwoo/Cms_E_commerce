import { useState, useEffect, useRef, useCallback } from 'react';

interface RealtimeOptions {
    intervalMs?: number;
    enabled?: boolean;
}

/**
 * useRealtimeData - Optimized hook for real-time data fetching
 * Features:
 * - Smart intervals (prevents overlapping calls)
 * - Page Visibility awareness (pauses when tab is inactive)
 * - Cleanup on unmount
 * - Loading and error states
 */
export function useRealtimeData<T>(
    fetcher: () => Promise<T>,
    dependencies: any[] = [],
    options: RealtimeOptions = {}
) {
    const { intervalMs = 30000, enabled = true } = options;
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isFetching = useRef(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const loadData = useCallback(async (silent = false) => {
        if (isFetching.current) return; // Prevent overlapping calls
        
        if (!silent) setLoading(true);
        isFetching.current = true;
        
        try {
            const result = await fetcher();
            setData(result);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown fetching error');
            if (!silent) setData(null);
        } finally {
            if (!silent) setLoading(false);
            isFetching.current = false;
        }
    }, [fetcher]);

    // Initial load and dependency changes
    useEffect(() => {
        loadData();
    }, [loadData, ...dependencies]);

    // Visibility-aware interval
    useEffect(() => {
        if (!enabled) return;

        const scheduleNext = () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            
            timeoutRef.current = setTimeout(async () => {
                // Only fetch if document is visible
                if (document.visibilityState === 'visible') {
                    await loadData(true);
                }
                scheduleNext(); // Schedule next regardless of visibility (so it resumes immediately when tab returns)
            }, intervalMs);
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Fetch immediately when tab becomes visible if it's been a while (or just resume interval)
                loadData(true);
            }
        };

        scheduleNext();
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [loadData, intervalMs, enabled]);

    return { data, loading, error, refresh: () => loadData() };
}
