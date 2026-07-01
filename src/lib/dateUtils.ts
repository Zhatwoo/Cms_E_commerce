/** Formats an ISO date string to Philippines time (UTC+8) with a standard format. */
export function formatToPHTime(isoString: string | Date | undefined): string {
    if (!isoString) return '—';
    try {
        const date = typeof isoString === 'string' ? new Date(isoString) : isoString;
        if (isNaN(date.getTime())) return '—';
        
        return new Intl.DateTimeFormat('en-PH', {
            timeZone: 'Asia/Manila',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        }).format(date);
    } catch {
        return '—';
    }
}

/** Formats an ISO date string to a shorter Philippines time format. */
export function formatToPHTimeShort(isoString: string | Date | undefined): string {
    if (!isoString) return '—';
    try {
        const date = typeof isoString === 'string' ? new Date(isoString) : isoString;
        if (isNaN(date.getTime())) return '—';
        
        return new Intl.DateTimeFormat('en-PH', {
            timeZone: 'Asia/Manila',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        }).format(date);
    } catch {
        return '—';
    }
}
