import React from 'react';

interface Slice {
  label: string;
  value: number;
  color: string;
}

export const PieChart = ({ data, size = 140 }: { data: Slice[]; size?: number }) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cumulative = 0;

  const radius = size / 2;
  const center = size / 2;

  const slices = data.map((d) => {
    const startAngle = (cumulative / total) * Math.PI * 2;
    cumulative += d.value;
    const endAngle = (cumulative / total) * Math.PI * 2;

    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const x1 = center + radius * Math.cos(startAngle - Math.PI / 2);
    const y1 = center + radius * Math.sin(startAngle - Math.PI / 2);
    const x2 = center + radius * Math.cos(endAngle - Math.PI / 2);
    const y2 = center + radius * Math.sin(endAngle - Math.PI / 2);

    const dAttr = [`M ${center} ${center}`, `L ${x1} ${y1}`, `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`, 'Z'].join(' ');

    return { dAttr, color: d.color, label: d.label, value: d.value };
  });

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s, i) => (
          <path key={i} d={s.dAttr} fill={s.color} stroke="transparent" />
        ))}
      </svg>

      <div className="flex flex-col text-sm">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span style={{ background: d.color }} className="w-3 h-3 rounded-full inline-block" />
            <span className="font-medium">{d.label}</span>
            <span className="text-xs text-muted ml-2">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
