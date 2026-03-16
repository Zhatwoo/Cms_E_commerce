import { motion } from 'framer-motion';
import { DashboardPanel } from './DashboardPanel';

type DashboardActivityPanelProps = {
    items: readonly {
        title: string;
        action: string;
        meta: string;
    }[];
};

export function DashboardActivityPanel({ items }: DashboardActivityPanelProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.44, delay: 0.28, ease: [0.22, 0.84, 0.25, 1] }}
        >
            <DashboardPanel className="min-h-[15.6rem] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="admin-dashboard-purple text-[1.45rem] font-semibold">
                        Recent User Actions
                    </h2>
                    <button type="button" suppressHydrationWarning className="admin-dashboard-muted-text text-xs transition-opacity hover:opacity-70">
                        View audit log
                    </button>
                </div>
                <div className="admin-dashboard-inset-panel mt-5 rounded-[18px] p-3 sm:p-4">
                    {items.map((item) => (
                        <div key={item.title} className="flex gap-4 rounded-[14px] bg-white/40 px-4 py-4">
                            <div className="admin-dashboard-yellow-fill w-1 shrink-0 rounded-full" />
                            <div className="min-w-0">
                                <p className="admin-dashboard-purple text-base font-semibold">
                                    {item.title}
                                </p>
                                <p className="admin-dashboard-soft-text mt-1 text-sm">
                                    {item.action}
                                </p>
                                <p className="admin-dashboard-muted-text text-sm">
                                    {item.meta}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </DashboardPanel>
        </motion.div>
    );
}
