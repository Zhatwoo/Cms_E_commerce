export function DashboardBackground() {
    return (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="admin-dashboard-bg-spot-1 absolute left-[-12%] top-[-10%] h-[26rem] w-[26rem] rounded-full blur-3xl opacity-60" />
            <div className="admin-dashboard-bg-spot-2 absolute right-[-10%] top-[12%] h-[24rem] w-[24rem] rounded-full blur-3xl opacity-50" />
            <div className="admin-dashboard-bg-spot-3 absolute bottom-[-18%] left-[20%] h-[28rem] w-[28rem] rounded-full blur-3xl opacity-40" />
        </div>
    );
}
