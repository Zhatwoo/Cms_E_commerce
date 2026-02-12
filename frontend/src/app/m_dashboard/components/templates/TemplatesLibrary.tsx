// Eto naman yung nasa baba nung carousel (yung umiikot na cards)


'use client';
import React from 'react';
import { useTheme } from '../context/theme-context';

type Template = { id: string; name: string; description: string };

const SAMPLE: Template[] = [
  { id: 't1', name: 'Mercato Modern', description: 'Feature-rich eCommerce layout with hero and product grid.' },
  { id: 't2', name: 'Marketplace Classic', description: 'Multi-vendor marketplace focused on listings.' },
  { id: 't3', name: 'Minimal Store', description: 'Fast, minimal storefront for single-product shops.' },
];

export default function TemplatesLibrary({ onUse }: { onUse?: (t: Template) => void }) {
  const { colors, theme } = useTheme();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {SAMPLE.map(t => (
        <div
          key={t.id}
          className="rounded-xl p-4 border transition-colors"
          style={{
            backgroundColor: colors.bg.card,
            borderColor: colors.border.faint
          }}
        >
          <div className="text-sm font-semibold" style={{ color: colors.text.primary }}>{t.name}</div>
          <div className="text-xs mt-1" style={{ color: colors.text.secondary }}>{t.description}</div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs" style={{ color: colors.text.subtle }}>Free</div>
            <button
              onClick={() => onUse?.(t)}
              className="px-3 py-1 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
              style={{
                backgroundColor: colors.status.info,
                color: theme === 'dark' ? colors.bg.primary : '#ffffff'
              }}
            >
              Use
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
