import { adminTheme } from './adminTheme';

type ChartSeriesItem = {
    label: string;
    color: string;
    points: readonly number[];
};

type DashboardLineChartProps = {
    series: readonly ChartSeriesItem[];
};

const chartWidth = 240;
const chartHeight = 110;
const leftPadding = 28;
const rightPadding = 10;
const topPadding = 12;
const bottomPadding = 26;

function toPolylinePoints(points: readonly number[]) {
    return points
        .map((point, index) => {
            const x = leftPadding + index * ((chartWidth - leftPadding - rightPadding) / Math.max(points.length - 1, 1));
            const y = topPadding + ((100 - point) / 100) * (chartHeight - topPadding - bottomPadding);
            return `${x},${y}`;
        })
        .join(' ');
}

export function DashboardLineChart({ series }: DashboardLineChartProps) {
    return (
        <div className="mt-4">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-[7.2rem] w-full">
                {[0, 20, 40, 60, 80, 100].map((value) => {
                    const y = topPadding + ((100 - value) / 100) * (chartHeight - topPadding - bottomPadding);
                    return (
                        <g key={value}>
                            <line
                                x1={leftPadding}
                                y1={y}
                                x2={chartWidth - rightPadding}
                                y2={y}
                                stroke="rgba(71, 19, 150, 0.10)"
                                strokeWidth="1"
                            />
                            <text
                                x={8}
                                y={y + 3}
                                fontSize="8"
                                fill={adminTheme.colors.textMuted}
                            >
                                {value}
                            </text>
                        </g>
                    );
                })}
                <line
                    x1={leftPadding}
                    y1={chartHeight - bottomPadding}
                    x2={chartWidth - rightPadding}
                    y2={chartHeight - bottomPadding}
                    stroke="rgba(71, 19, 150, 0.10)"
                    strokeWidth="1"
                />
                {series.map((item) => (
                    <g key={item.label}>
                        <polyline
                            fill="none"
                            stroke={item.color}
                            strokeWidth="1.8"
                            points={toPolylinePoints(item.points)}
                        />
                        {item.points.map((point, index) => {
                            const x = leftPadding + index * ((chartWidth - leftPadding - rightPadding) / Math.max(item.points.length - 1, 1));
                            const y = topPadding + ((100 - point) / 100) * (chartHeight - topPadding - bottomPadding);
                            return (
                                <circle key={`${item.label}-${index}`} cx={x} cy={y} r="2.4" fill={adminTheme.colors.white} stroke={item.color} strokeWidth="1" />
                            );
                        })}
                    </g>
                ))}
                <text x={82} y={chartHeight - 9} fontSize="8" fill={adminTheme.colors.textMuted}>Data 1</text>
                <text x={165} y={chartHeight - 9} fontSize="8" fill={adminTheme.colors.textMuted}>Data 2</text>
            </svg>
            <div className="admin-dashboard-muted-text mt-1 flex items-center justify-center gap-4 text-[10px]">
                {series.map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                        <svg width="12" height="6" viewBox="0 0 12 6" aria-hidden>
                            <rect width="12" height="6" rx="3" fill={item.color} />
                        </svg>
                        <span>{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
