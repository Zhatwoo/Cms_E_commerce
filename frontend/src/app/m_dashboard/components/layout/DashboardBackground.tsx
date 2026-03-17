'use client';

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
