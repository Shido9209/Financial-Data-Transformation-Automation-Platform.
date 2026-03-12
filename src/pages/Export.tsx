import { motion } from 'motion/react';
import {
  Download,
  FileSpreadsheet,
  FileJson,
  FileText,
  CheckCircle2,
  FileCheck2,
  AlertCircle,
  ArrowRight,
  UploadCloud,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Format catalogue ──────────────────────────────────────────────────────────

const EXPORT_FORMATS = [
  {
    id: 'csv',
    name: 'CSV',
    icon: FileText,
    description: 'Standard comma-separated values. Best for general use.',
    pro: false,
  },
  {
    id: 'json',
    name: 'JSON (API / E-Invoice)',
    icon: FileJson,
    description: 'Structured data format. Ideal for APIs and E-Invoicing integrations.',
    pro: false,
  },
  {
    id: 'excel',
    name: 'Excel (.xlsx)',
    icon: FileSpreadsheet,
    description: 'Microsoft Excel format with multiple-sheet support.',
    pro: true,
  },
  {
    id: 'xml',
    name: 'XML (E-Invoice Compliance)',
    icon: FileCheck2,
    description: 'Compliance-ready XML for tax authorities (e.g. Malaysia IRBM).',
    pro: true,
  },
] as const;

type FormatId = (typeof EXPORT_FORMATS)[number]['id'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Trigger a browser download of a Blob */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Flatten a row from the processed format
 * `{ col: { original, transformed, status } }` → `{ col: transformedValue }`
 * If the row is already plain (raw data), it is returned as-is.
 */
function flattenRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(row)) {
    if (val !== null && typeof val === 'object' && 'transformed' in (val as object)) {
      out[key] = (val as { transformed: unknown }).transformed;
    } else {
      out[key] = val;
    }
  }
  return out;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Export() {
  const store = useAppStore();
  const navigate = useNavigate();

  const [selectedFormat, setSelectedFormat] = useState<FormatId>('csv');
  const [isExporting, setIsExporting] = useState(false);

  // ── Resolve export data ─────────────────────────────────────────────────
  // Prefer processed results; fall back to raw data.
  const dataToExport: Record<string, unknown>[] =
    store.processedResult?.processed_results ?? store.data ?? [];

  const hasData = dataToExport.length > 0;

  // ── File naming ─────────────────────────────────────────────────────────
  const baseName = store.fileName ? store.fileName.replace(/\.[^/.]+$/, '') : 'Exported_Data';
  const displayFileName = `${baseName}_Cleaned`;

  // ── Column headers (apply renames for export) ────────────────────────────
  const getExportHeaders = (): string[] => {
    const rawHeaders = Array.from(
      new Set(dataToExport.flatMap(Object.keys))
    );
    return rawHeaders;
  };

  /** Return the display name for a header key */
  const getHeaderLabel = (col: string): string =>
    store.columnRenames[col] ?? col.replace(/_/g, ' ');

  // ── CSV export ───────────────────────────────────────────────────────────
  const exportCSV = (): void => {
    const headers = getExportHeaders();
    const rows: string[] = [];

    // Header row — use renamed labels
    rows.push(
      headers
        .map((h) => `"${getHeaderLabel(h).replace(/"/g, '""')}"`)
        .join(',')
    );

    // Data rows
    for (const row of dataToExport) {
      const flat = flattenRow(row);
      const values = headers.map((h) => {
        const v = flat[h];
        const s = v == null ? '' : String(v);
        return `"${s.replace(/"/g, '""')}"`;
      });
      rows.push(values.join(','));
    }

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${displayFileName}.csv`);
  };

  // ── JSON export ──────────────────────────────────────────────────────────
  const exportJSON = (): void => {
    const headers = getExportHeaders();
    const cleanData = dataToExport.map((row) => {
      const flat = flattenRow(row);
      const out: Record<string, unknown> = {};
      for (const h of headers) {
        out[getHeaderLabel(h)] = flat[h];
      }
      return out;
    });

    const blob = new Blob(
      [JSON.stringify(cleanData, null, 2)],
      { type: 'application/json' },
    );
    downloadBlob(blob, `${displayFileName}.json`);
  };

  // ── Main export handler ──────────────────────────────────────────────────
  const handleExport = (): void => {
    if (!hasData) return;
    setIsExporting(true);

    try {
      if (selectedFormat === 'csv') {
        exportCSV();
      } else if (selectedFormat === 'json') {
        exportJSON();
      } else {
        alert(`Exporting to ${selectedFormat.toUpperCase()} is a Pro feature. Upgrade to unlock it.`);
      }
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Export Data</h1>
        <p className="text-slate-500 mt-1">
          Choose your preferred format to download the transformed data.
        </p>
      </div>

      {/* ── No Data State ────────────────────────────────────────────────── */}
      {!hasData ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-amber-900">No Data Available</h2>
          <p className="text-amber-700 mt-2 mb-6">
            Please upload and process a file in the Data Editor before exporting.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/upload')}
              className="px-6 py-2.5 bg-white text-slate-700 rounded-lg font-medium border border-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              Upload New File
            </button>
            <button
              onClick={() => navigate('/editor')}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              Go to Data Editor
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      ) : (

        /* ── Export Card ─────────────────────────────────────────────────── */
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">

          {/* File info bar */}
          <div className="p-8 border-b border-slate-100 bg-slate-50 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{displayFileName}</h2>
              <p className="text-sm text-slate-500 mt-1">
                {dataToExport.length.toLocaleString()} rows
                {store.processedResult ? ' • Processed' : ' • Raw'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Ready to export
            </div>
          </div>

          <div className="p-8">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-6">
              Select Format
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EXPORT_FORMATS.map((format) => {
                const Icon = format.icon;
                const isSelected = selectedFormat === format.id;

                return (
                  <label
                    key={format.id}
                    className={`relative flex cursor-pointer rounded-2xl border p-6 shadow-sm transition-colors group ${isSelected
                        ? 'border-indigo-600 bg-indigo-50/30'
                        : 'border-slate-200 bg-white hover:border-indigo-500'
                      }`}
                  >
                    <input
                      type="radio"
                      name="export-format"
                      value={format.id}
                      className="sr-only"
                      checked={isSelected}
                      onChange={() => setSelectedFormat(format.id)}
                    />
                    <span className="flex flex-1">
                      <span className="flex flex-col">
                        <span className="flex items-center gap-2 text-slate-900 font-semibold mb-1">
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`} />
                          {format.name}
                          {format.pro && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                              Pro
                            </span>
                          )}
                        </span>
                        <span className="text-sm text-slate-500">{format.description}</span>
                      </span>
                    </span>
                    <CheckCircle2
                      className={`h-5 w-5 absolute top-6 right-6 transition-opacity ${isSelected ? 'text-indigo-600 opacity-100' : 'opacity-0'
                        }`}
                    />
                    <span
                      className={`pointer-events-none absolute -inset-px rounded-2xl border-2 transition-colors ${isSelected ? 'border-indigo-600' : 'border-transparent'
                        }`}
                      aria-hidden="true"
                    />
                  </label>
                );
              })}
            </div>

            <div className="mt-10 flex justify-end">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 text-lg shadow-sm shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                {isExporting ? 'Exporting…' : 'Download File'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
