'use client';
import React from 'react';

type Template = { id: string; name: string; description: string };

const SAMPLE: Template[] = [
  { id: 't1', name: 'Mercato Modern', description: 'Feature-rich eCommerce layout with hero and product grid.' },
  { id: 't2', name: 'Marketplace Classic', description: 'Multi-vendor marketplace focused on listings.' },
  { id: 't3', name: 'Minimal Store', description: 'Fast, minimal storefront for single-product shops.' },
];

export default function TemplatesLibrary({ onUse }: { onUse?: (t: Template) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {SAMPLE.map(t => (
        <div key={t.id} className="rounded-xl p-4 border bg-white dark:bg-[#0f0f10]" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          <div className="text-sm font-semibold">{t.name}</div>
          <div className="text-xs mt-1 text-muted" style={{ color: '#6B7280' }}>{t.description}</div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-muted" style={{ color: '#9CA3AF' }}>Free</div>
            <button onClick={() => onUse?.(t)} className="px-3 py-1 rounded-md bg-blue-600 text-white text-sm">Use</button>
          </div>
        </div>
      ))}
    </div>
  );
}
