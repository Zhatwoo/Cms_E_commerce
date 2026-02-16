import React from 'react';

export const BarChart = ({ data, colors, compact = false, showYAxis = true }: { data: Array<{ label: string; value: number }>; colors?: { bar?: string; bg?: string }; compact?: boolean; showYAxis?: boolean }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const chartHeight = compact ? 64 : 96; // px

  const nf = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const mid = Math.round(max / 2);

  return (
    <div className="w-full flex flex-col">
      <div className="flex items-end gap-3">
        {showYAxis && (
          <div className="w-20 pr-2 flex flex-col justify-between" style={{ height: chartHeight }}>
            <div className="text-xs text-right" style={{ color: 'var(--text-muted)' }}>{nf.format(max)}</div>
            <div className="text-xs text-right" style={{ color: 'var(--text-muted)' }}>{nf.format(mid)}</div>
            <div className="text-xs text-right" style={{ color: 'var(--text-muted)' }}>{nf.format(0)}</div>
          </div>
        )}

        <div className="flex-1 flex items-end gap-3" style={{ height: chartHeight }}>
          {data.map((d, i) => {
            // compute pixel height so percent-based layout quirks won't hide bars
            const raw = (d.value / max) * chartHeight;
            const barHeight = d.value > 0 ? Math.max(6, Math.round(raw)) : 0;

            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full flex items-end" style={{ height: chartHeight }}>
                  <div
                    style={{ height: `${barHeight}px`, background: colors?.bar || '#3b82f6', boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.12)' }}
                    className="w-full rounded-t-md transition-all"
                  />
                </div>
                <div className={`mt-2 text-xs text-center truncate w-full`} title={d.label} style={{ color: 'var(--text-muted)' }}>{d.label}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-2 text-xs text-muted">(Revenue over time)</div>
    </div>
  );
};
