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
      <button
        type="button"
        onClick={handleImport}
        disabled={importing}
        title={importing ? 'Importing…' : 'Import CSV'}
        className={theme === 'dark' ? '' : 'admin-dashboard-panel-soft border-0'}
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          border: theme === 'dark' ? `1px solid ${T.cardBorder}` : undefined,
          color: theme === 'dark' ? '#ddd1ff' : '#64748b',
          backgroundColor: theme === 'dark' ? T.card : undefined,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: importing ? 'not-allowed' : 'pointer',
          opacity: importing ? 0.55 : 1,
        }}
      >
        <Upload size={15} />
      </button>
      <button
        type="button"
        onClick={onExportClick}
        disabled={exporting}
        title={exporting ? 'Exporting…' : 'Export CSV'}
        className={theme === 'dark' ? '' : 'admin-dashboard-panel-soft border-0'}
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          border: theme === 'dark' ? `1px solid ${T.cardBorder}` : undefined,
          color: theme === 'dark' ? '#ddd1ff' : '#64748b',
          backgroundColor: theme === 'dark' ? T.card : undefined,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: exporting ? 'not-allowed' : 'pointer',
          opacity: exporting ? 0.55 : 1,
        }}
      >
        <Download size={15} />
      </button>
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
