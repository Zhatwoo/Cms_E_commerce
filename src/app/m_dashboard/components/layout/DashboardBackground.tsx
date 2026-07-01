'use client';

/**
 * ============================================================================
 * Dashboard Background Component
 * ============================================================================
 *
 * Purpose of this File:
 * ----------------------------------------------------------------------------
 * This file contains a decorative background component that displays animated
 * gradient blobs and accent lines behind the main dashboard content.
 *
 * The component provides:
 * - Animated gradient blob decorations
 * - Responsive blur effects
 * - Theme-aware accent lines
 * - Non-interactive background (pointer-events-none)
 * - Smooth visual depth through layering
 * - Optimized positioning with absolute layout
 *
 * ----------------------------------------------------------------------------
 * What this Component Does:
 * ----------------------------------------------------------------------------
 * - Renders three animated gradient blobs positioned around viewport
 * - Applies blur filters for soft visual effect
 * - Adds semi-transparent accent line at top
 * - Uses aria-hidden to hide from screen readers
 * - Positioned absolutely behind main content
 * - Adapts opacity for visual balance
 * - Provides CSS classes for theme-specific colors
 *
 * Props / Parameters:
 * - None (purely presentational)\n *
 * ============================================================================
 */

export function DashboardBackground() {
    return (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden z-0">
            <div className="admin-dashboard-bg-spot-1 absolute left-[-12%] top-[-10%] h-[26rem] w-[26rem] rounded-full blur-3xl opacity-60" />
            <div className="admin-dashboard-bg-spot-2 absolute right-[-10%] top-[12%] h-[24rem] w-[24rem] rounded-full blur-3xl opacity-60" />
            <div className="admin-dashboard-bg-spot-3 absolute bottom-[-18%] left-[20%] h-[28rem] w-[28rem] rounded-full blur-3xl opacity-60" />
            <div className="admin-dashboard-bg-line absolute inset-x-0 top-0 h-px bg-purple-500/10" />
        </div>
    );
}
