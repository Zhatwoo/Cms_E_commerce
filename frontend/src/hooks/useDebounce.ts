import { useState, useEffect } from 'react';

/**
 * useDebounce - Delays updating a value until a specified time has passed
 * Use this to prevent expensive operations (like filtering large lists or API calls)
 * from running on every keystroke.
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
