import { motion } from 'framer-motion';
import { DashboardPanel } from './DashboardPanel';

type DashboardNotificationsPanelProps = {
    items: readonly {
        title: string;
        date: string;
    }[];
};

export function DashboardNotificationsPanel({ items }: DashboardNotificationsPanelProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.44, delay: 0.34, ease: [0.22, 0.84, 0.25, 1] }}
        >
            <DashboardPanel className="min-h-[15.6rem] p-5 sm:p-6">
                <h2 className="admin-dashboard-purple text-[1.45rem] font-semibold">
                    Notifications
                </h2>
                <div className="mt-6 space-y-4">
                    {items.map((item) => (
                        <div key={item.title} className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <span className="admin-dashboard-yellow-fill mt-1.5 h-3 w-3 rounded-full" />
                                <p className="admin-dashboard-purple text-sm font-medium">
                                    {item.title}
                                </p>
                            </div>
                            <p className="admin-dashboard-muted-text text-xs text-right">
                                {item.date}
                            </p>
                        </div>
                    ))}
                </div>
            </DashboardPanel>
        </motion.div>
    );
}
