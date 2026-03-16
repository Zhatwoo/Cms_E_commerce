import { motion } from 'framer-motion';
import { DashboardLineChart } from './DashboardLineChart';
import { DashboardPanel } from './DashboardPanel';
type DashboardStatCardProps = {
    title: string;
    value: string;
    liveLabel: string;
    series: readonly {
        label: string;
        color: string;
        points: readonly number[];
    }[];
    index: number;
};

export function DashboardStatCard({ title, value, liveLabel, series, index }: DashboardStatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: 0.08 * index, ease: [0.22, 0.84, 0.25, 1] }}
        >
            <DashboardPanel className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="admin-dashboard-yellow text-[2.5rem] font-bold leading-none">
                            {value}
                        </p>
                        <p className="admin-dashboard-purple mt-2 text-xs font-bold tracking-[0.04em]">
                            {title}
                        </p>
                    </div>
                    <span className="admin-dashboard-muted-text text-[10px]">
                        {liveLabel}
                    </span>
                </div>
                <DashboardLineChart series={series} />
            </DashboardPanel>
        </motion.div>
    );
}
