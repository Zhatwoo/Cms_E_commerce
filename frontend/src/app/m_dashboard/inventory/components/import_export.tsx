'use client';
import React, { useRef, useCallback } from 'react';
import { Upload, Download } from 'lucide-react';
import { listInventory, importInventoryCsv, type ApiProduct, type ImportInventoryRow } from '@/lib/api';

// ─── CSV helpers ──────────────────────────────────────────────────────────────
const EXPORT_COLUMNS = ['name', 'sku', 'category', 'onHandStock', 'reservedStock', 'lowStockThreshold', 'status'] as const;

function escapeCsvValue(val: string | number | undefined | null): string {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function productsToCsv(items: ApiProduct[]): string {
  const header = EXPORT_COLUMNS.join(',');
  const rows = items.map((p) => {
    const onHand = p.onHandStock ?? p.stock ?? 0;
    const reserved = p.reservedStock ?? 0;
    const low = p.lowStockThreshold ?? 5;
    return [escapeCsvValue(p.name), escapeCsvValue(p.sku), escapeCsvValue(p.category), escapeCsvValue(onHand), escapeCsvValue(reserved), escapeCsvValue(low), escapeCsvValue(p.status)].join(',');
  });
  return [header, ...rows].join('\n');
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let cell = ''; i++;
      while (i < line.length) {
        if (line[i] === '"') { if (line[i + 1] === '"') { cell += '"'; i += 2; } else { i++; break; } } else { cell += line[i]; i++; }
      }
      result.push(cell);
    } else {
      let cell = '';
      while (i < line.length && line[i] !== ',') { cell += line[i]; i++; }
      result.push(cell.trim());
      if (line[i] === ',') i++;
    }
  }
  return result;
}

export function parseCsvToRows(text: string): ImportInventoryRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headerCols = parseCsvLine(lines[0]).map((c) => c.trim().toLowerCase().replace(/_/g, ''));
  const skuIdx = headerCols.findIndex((c) => c === 'sku');
  const onHandIdx = headerCols.findIndex((c) => ['onhandstock', 'stock'].includes(c));
  const reservedIdx = headerCols.findIndex((c) => ['reservedstock', 'reserved'].includes(c));
  const lowIdx = headerCols.findIndex((c) => ['lowstockthreshold', 'lowthreshold'].includes(c));
  const rows: ImportInventoryRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const sku = skuIdx >= 0 ? (cols[skuIdx] ?? '').trim() : '';
    if (!sku) continue;
    const row: ImportInventoryRow = { sku };
    if (onHandIdx >= 0) { const v = parseInt(String(cols[onHandIdx] ?? '0'), 10); if (Number.isFinite(v)) row.onHandStock = Math.max(0, v); }
    if (reservedIdx >= 0) { const v = parseInt(String(cols[reservedIdx] ?? '0'), 10); if (Number.isFinite(v)) row.reservedStock = Math.max(0, v); }
    if (lowIdx >= 0) { const v = parseInt(String(cols[lowIdx] ?? '5'), 10); if (Number.isFinite(v)) row.lowStockThreshold = Math.max(0, v); }
    rows.push(row);
  }
  return rows;
}

interface ImportExportProps {
  theme: string;
  search: string;
  selectedSubdomain: string;
  importing: boolean;
  exporting: boolean;
  onImportComplete: (result: { updated?: number; message?: string; errors?: Array<{ row: number; sku: string; message: string }> }, success: boolean) => void;
  onExportClick: () => void;
  T: Record<string, any>;
}

export function ImportExportButtons({ theme, search, selectedSubdomain, importing, exporting, onImportComplete, onExportClick, T }: ImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === 'dark';
  const [hovered, setHovered] = React.useState<'import' | 'export' | null>(null);
  const [focused, setFocused] = React.useState<'import' | 'export' | null>(null);

  const railBg = isDark ? 'rgba(20, 20, 70, 0.4)' : '#FFFFFF';
  const railBorder = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const railShadow = isDark ? 'none' : '0 10px 30px rgba(0,0,0,0.04)';

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const rows = parseCsvToRows(text);
      if (rows.length === 0) {
        onImportComplete({ errors: [] }, false);
        return;
      }
      const result = await importInventoryCsv({ rows, subdomain: selectedSubdomain || undefined });
      onImportComplete(result, !result.errors || result.errors.length === 0);
    } catch (err) {
      onImportComplete({ errors: [{ row: 0, sku: '', message: err instanceof Error ? err.message : 'Import failed' }] }, false);
    }
  }, [selectedSubdomain, onImportComplete]);

  return (
    <>
      <input ref={fileInputRef} type="file" accept=".csv" title="Upload CSV file" style={{ display: 'none' }} onChange={handleFileChange} />
      <div className="flex items-center gap-2">
        <div
          className="rounded-[1.2rem] border p-1.5 transition-all duration-500"
          style={{ backgroundColor: railBg, borderColor: railBorder, boxShadow: railShadow }}
        >
          <div className="relative group">
            <button
              type="button"
              onClick={handleImport}
              disabled={importing}
              aria-label={importing ? 'Importing CSV' : 'Import CSV'}
              onMouseEnter={() => setHovered('import')}
              onMouseLeave={() => setHovered((prev) => (prev === 'import' ? null : prev))}
              onFocus={() => setFocused('import')}
              onBlur={() => setFocused((prev) => (prev === 'import' ? null : prev))}
              className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-[0.9rem] inline-flex items-center justify-center transition-colors duration-300 outline-none"
              style={{
                color: importing
                  ? (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)')
                  : (hovered === 'import' || focused === 'import')
                    ? (isDark ? '#FFCE00' : '#FFFFFF')
                    : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
                cursor: importing ? 'not-allowed' : 'pointer',
                opacity: importing ? 0.75 : 1,
              }}
            >
              <span
                className="absolute inset-0 rounded-[0.8rem] transition-opacity duration-300"
                style={{
                  opacity: hovered === 'import' || focused === 'import' ? 1 : 0,
                  background: isDark ? 'rgba(255, 206, 0, 0.05)' : 'linear-gradient(135deg, #BD34FE 0%, #F13797 100%)',
                  boxShadow: isDark
                    ? '0 0 15px rgba(255, 206, 0, 0.1)'
                    : '0 4px 12px rgba(189, 52, 254, 0.2)',
                  border: isDark ? '1px solid rgba(255, 206, 0, 0.15)' : 'none',
                }}
              />
              <Upload size={15} className="relative z-10" />
            </button>
            <div
              role="tooltip"
              className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
              style={{
                backgroundColor: isDark ? 'rgba(20, 20, 70, 0.95)' : '#FFFFFF',
                color: isDark ? '#EDEBFF' : '#14034A',
                borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(20, 3, 74, 0.08)',
                boxShadow: isDark ? '0 10px 24px rgba(0,0,0,0.4)' : '0 10px 24px rgba(20,3,74,0.12)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {importing ? 'Importing CSV data...' : 'Import CSV: upload stock updates by SKU'}
            </div>
          </div>
        </div>

        <div
          className="rounded-[1.2rem] border p-1.5 transition-all duration-500"
          style={{ backgroundColor: railBg, borderColor: railBorder, boxShadow: railShadow }}
        >
          <div className="relative group">
            <button
              type="button"
              onClick={onExportClick}
              disabled={exporting}
              aria-label={exporting ? 'Exporting CSV' : 'Export CSV'}
              onMouseEnter={() => setHovered('export')}
              onMouseLeave={() => setHovered((prev) => (prev === 'export' ? null : prev))}
              onFocus={() => setFocused('export')}
              onBlur={() => setFocused((prev) => (prev === 'export' ? null : prev))}
              className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-[0.9rem] inline-flex items-center justify-center transition-colors duration-300 outline-none"
              style={{
                color: exporting
                  ? (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)')
                  : (hovered === 'export' || focused === 'export')
                    ? (isDark ? '#FFCE00' : '#FFFFFF')
                    : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
                cursor: exporting ? 'not-allowed' : 'pointer',
                opacity: exporting ? 0.75 : 1,
              }}
            >
              <span
                className="absolute inset-0 rounded-[0.8rem] transition-opacity duration-300"
                style={{
                  opacity: hovered === 'export' || focused === 'export' ? 1 : 0,
                  background: isDark ? 'rgba(255, 206, 0, 0.05)' : 'linear-gradient(135deg, #BD34FE 0%, #F13797 100%)',
                  boxShadow: isDark
                    ? '0 0 15px rgba(255, 206, 0, 0.1)'
                    : '0 4px 12px rgba(189, 52, 254, 0.2)',
                  border: isDark ? '1px solid rgba(255, 206, 0, 0.15)' : 'none',
                }}
              />
              <Download size={15} className="relative z-10" />
            </button>
            <div
              role="tooltip"
              className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
              style={{
                backgroundColor: isDark ? 'rgba(20, 20, 70, 0.95)' : '#FFFFFF',
                color: isDark ? '#EDEBFF' : '#14034A',
                borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(20, 3, 74, 0.08)',
                boxShadow: isDark ? '0 10px 24px rgba(0,0,0,0.4)' : '0 10px 24px rgba(20,3,74,0.12)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {exporting ? 'Exporting CSV file...' : 'Export CSV: download current inventory'}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function handleExportData(search: string, selectedSubdomain: string, setExporting: (v: boolean) => void) {
  return async () => {
    setExporting(true);
    try {
      const res = await listInventory({ subdomain: selectedSubdomain || undefined, limit: 5000, search: search || undefined });
      const data = Array.isArray(res.items) ? res.items : [];
      if (data.length === 0) {
        window.alert('No inventory to export.');
        return;
      }
      const csv = productsToCsv(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };
}
