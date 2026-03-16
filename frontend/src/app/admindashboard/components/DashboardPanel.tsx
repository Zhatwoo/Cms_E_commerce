import type { ReactNode } from 'react';

type DashboardPanelProps = {
    children: ReactNode;
    className?: string;
};

export function DashboardPanel({ children, className = '' }: DashboardPanelProps) {
    return (
        <section className={`admin-dashboard-panel rounded-[28px] ${className}`.trim()}>
            {children}
        </section>
    );
}
