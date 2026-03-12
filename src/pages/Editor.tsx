/**
 * Editor.tsx — Data Transformation Editor
 *
 * Key behaviours:
 *
 * FORMAT STANDARDIZATION
 * ─────────────────────
 * normalizeDate(val, format)
 *   • Parses any common date string (or Excel serial) into y/m/d parts.
 *   • Re-formats the output according to `format`:
 *       'auto'        → YYYY-MM-DD  (ISO 8601)
 *       'DD/MM/YYYY'  → DD/MM/YYYY
 *       'MM/DD/YYYY'  → MM/DD/YYYY
 *
 * normalizeCurrency(val, format)
 *   • Parses any US/EU numeric string into a JavaScript number.
 *   • Re-formats according to `format`:
 *       'auto'          → 1240.50    (plain normalised decimal)
 *       'US (1,000.00)' → 1,240.50  (comma thousands, dot decimal)
 *       'EU (1.000,00)' → 1.240,50  (dot thousands, comma decimal)
 *
 * PREVIEW BEHAVIOUR
 * ─────────────────
 * Before Process  → preview shows the ORIGINAL raw values from the file.
 *                   No transformation is applied to the display at all.
 *
 * After Process   → the same preview table shows the TRANSFORMED values
 *                   from processedResult (highlighted in indigo).
 *                   A collapsible stats summary banner appears above the
 *                   table so the user can see the full dataset, not just
 *                   a 5-row sample.
 *
 * EXPORT SAFETY
 * ─────────────
 * processedResult.summary carries applied_date_format and
 * applied_currency_format so Export.tsx always uses the exact format
 * that was active when the user clicked Process — even if they change
 * the dropdowns afterwards.
 */

import { motion, AnimatePresence } from 'motion/react';
import {
  Wand2,
  Download,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Sparkles,
  FileCheck2,
  ArrowRightLeft,
  Eraser,
  Play,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import type { ProcessedResult, CellResult } from '../store/useAppStore';

// ─── Constants ────────────────────────────────────────────────────────────────

const MOCK_DATA = [
  { date: '10/24/2023', description: 'STRIPE PAYOUT', amount: '1,240.50', currency: 'USD', status: 'completed' },
  { date: '10/25/2023', description: 'AWS WEB SERVICES', amount: '-45.00', currency: 'USD', status: 'completed' },
  { date: '10/26/2023', description: 'SHOPIFY TRANSFER', amount: '890.00', currency: 'USD', status: 'pending' },
  { date: '10/27/2023', description: 'GSUITE SUBSCRIPTION', amount: '-12.00', currency: 'USD', status: 'completed' },
];

const STANDARD_FIELDS = [
  'Date', 'Description', 'Reference', 'Debit', 'Credit',
  'Amount', 'Currency', 'Status',
  'Buyer_TIN', 'Seller_TIN', 'Invoice_Number', 'Tax_Amount',
] as const;

type StandardField = (typeof STANDARD_FIELDS)[number];

const AMOUNT_FIELDS: StandardField[] = ['Amount', 'Debit', 'Credit', 'Tax_Amount'];

// ─── Date normalizer ──────────────────────────────────────────────────────────

interface ParsedDate { year: string; month: string; day: string; }

/**
 * Parse a raw date string into { year, month, day }.
 * The `format` hint is used to resolve ambiguous DD vs MM when both are ≤ 12.
 * Returns null if the value cannot be parsed as a valid calendar date.
 */
function parseDateValue(val: string, format: string): ParsedDate | null {
  const trimmed = val.trim();
  if (!trimmed || /^(n\/a|tbd)$/i.test(trimmed)) return null;

  // Excel serial date  e.g. 45417
  const numVal = Number(trimmed);
  if (!isNaN(numVal) && numVal > 30_000 && numVal < 60_000) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    epoch.setUTCDate(epoch.getUTCDate() + numVal);
    const [y, m, d] = epoch.toISOString().split('T')[0].split('-');
    return { year: y, month: m, day: d };
  }

  // Normalise separators to dash, then split
  const parts = trimmed.replace(/[./\s]/g, '-').split('-');

  if (parts.length === 3) {
    let year: string, month: string, day: string;

    if (parts[0].length === 4) {
      // Already ISO: YYYY-MM-DD
      [year, month, day] = parts;
    } else if (parts[2].length === 4) {
      year = parts[2];
      if (format === 'DD/MM/YYYY') {
        day = parts[0]; month = parts[1];
      } else if (format === 'MM/DD/YYYY') {
        month = parts[0]; day = parts[1];
      } else {
        // Auto-detect by plausibility
        const p0 = parseInt(parts[0], 10);
        const p1 = parseInt(parts[1], 10);
        if (p0 > 12) { day = parts[0]; month = parts[1]; }
        else if (p1 > 12) { month = parts[0]; day = parts[1]; }
        else { month = parts[0]; day = parts[1]; } // fallback MM/DD
      }
    } else {
      // Two-digit year or unrecognised pattern — try native Date as last resort
      const fallback = new Date(val);
      if (isNaN(fallback.getTime())) return null;
      const [y, m, d] = fallback.toISOString().split('T')[0].split('-');
      return { year: y, month: m, day: d };
    }

    const pMonth = month!.padStart(2, '0');
    const pDay = day!.padStart(2, '0');
    const check = new Date(`${year}-${pMonth}-${pDay}`);
    if (isNaN(check.getTime())) return null;
    return { year, month: pMonth, day: pDay };
  }

  // Last resort: native Date parser
  const fallback = new Date(val);
  if (isNaN(fallback.getTime())) return null;
  const [y, m, d] = fallback.toISOString().split('T')[0].split('-');
  return { year: y, month: m, day: d };
}

/**
 * Format a parsed date into the target string representation.
 *   'auto'        → YYYY-MM-DD
 *   'DD/MM/YYYY'  → DD/MM/YYYY
 *   'MM/DD/YYYY'  → MM/DD/YYYY
 */
function formatDateOutput(parsed: ParsedDate, targetFormat: string): string {
  const { year, month, day } = parsed;
  if (targetFormat === 'DD/MM/YYYY') return `${day}/${month}/${year}`;
  if (targetFormat === 'MM/DD/YYYY') return `${month}/${day}/${year}`;
  return `${year}-${month}-${day}`; // ISO / auto
}

/**
 * Full pipeline: parse any date string and re-emit in the target format.
 * Returns 'Invalid Date' when the input cannot be parsed.
 */
function normalizeDate(val: string, format: string): string {
  const parsed = parseDateValue(val, format);
  if (!parsed) return 'Invalid Date';
  const out = formatDateOutput(parsed, format);
  return out;
}

// ─── Currency normalizer ──────────────────────────────────────────────────────

/**
 * Parse any US/EU numeric string to a JavaScript float.
 * Handles:  1,240.50  |  1.240,50  |  1,240,000.50  |  -45.00
 * Returns null if unparseable.
 */
function parseNumericValue(raw: string): number | null {
  const s = String(raw).trim();
  if (!s) return null;

  const isNeg = s.startsWith('-');
  let cleaned = s.replace(/[^\d.,]/g, ''); // keep digits, dots, commas

  const commas = (cleaned.match(/,/g) ?? []).length;
  const dots = (cleaned.match(/\./g) ?? []).length;

  if (commas === 0 && dots <= 1) {
    // Plain integer or plain decimal: 1240  | 1240.50
    // nothing to do
  } else if (commas === 1 && dots === 0) {
    // Could be EU decimal: 1240,50 → 1240.50
    // Could be US thousands only: 1,240 (no decimals) → 1240
    const commaIdx = cleaned.indexOf(',');
    const afterComma = cleaned.slice(commaIdx + 1);
    if (afterComma.length <= 2) {
      // Treat as EU decimal separator
      cleaned = cleaned.replace(',', '.');
    } else {
      // Treat as US thousands separator
      cleaned = cleaned.replace(',', '');
    }
  } else if (commas === 1 && dots === 1) {
    const commaPos = cleaned.indexOf(',');
    const dotPos = cleaned.indexOf('.');
    if (commaPos < dotPos) {
      // US: 1,240.50 → 1240.50
      cleaned = cleaned.replace(',', '');
    } else {
      // EU: 1.240,50 → 1240.50
      cleaned = cleaned.replace('.', '').replace(',', '.');
    }
  } else if (commas > 1 && dots <= 1) {
    // US multi-thousands: 1,240,000.50
    cleaned = cleaned.replace(/,/g, '');
  } else if (dots > 1 && commas <= 1) {
    // EU multi-thousands: 1.240.000,50
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  }

  const n = parseFloat(cleaned);
  if (isNaN(n)) return null;
  return isNeg && n > 0 ? -n : n;
}

/** Format a number to US style: 1,240.50 */
function formatUS(n: number): string {
  const neg = n < 0;
  const [int, dec = '00'] = Math.abs(n).toFixed(2).split('.');
  const formatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${neg ? '-' : ''}${formatted}.${dec}`;
}

/** Format a number to EU style: 1.240,50 */
function formatEU(n: number): string {
  const neg = n < 0;
  const [int, dec = '00'] = Math.abs(n).toFixed(2).split('.');
  const formatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${neg ? '-' : ''}${formatted},${dec}`;
}

/** Format a number to auto/plain normalised decimal: 1240.50 */
function formatAuto(n: number): string {
  return n.toFixed(2);
}

/**
 * Full pipeline: parse any currency string and re-emit in the target format.
 * Returns the original string unchanged if parsing fails.
 */
function normalizeCurrency(val: string, targetFormat: string): string {
  if (!val) return val;
  const n = parseNumericValue(val);
  if (n === null) return val; // unparseable — preserve original

  if (targetFormat === 'US (1,000.00)') return formatUS(n);
  if (targetFormat === 'EU (1.000,00)') return formatEU(n);
  return formatAuto(n); // 'auto'
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Editor() {
  const location = useLocation();
  const navigate = useNavigate();
  const store = useAppStore();

  // ── Local UI state ──────────────────────────────────────────────────────
  const [isMapping, setIsMapping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statsOpen, setStatsOpen] = useState(true);

  // ── Resolve data (store → location state → mock) ────────────────────────
  const fileName = store.fileName || location.state?.fileName || 'Maybank_Statement_Q3.csv';
  const fileSize =
    store.fileSize
      ? `${(store.fileSize / 1_048_576).toFixed(2)} MB`
      : location.state?.fileSize
        ? `${(location.state.fileSize / 1_048_576).toFixed(2)} MB`
        : '1.2 MB';

  const sheets = store.sheets || location.state?.sheets || null;
  const currentSheet = store.currentSheet || location.state?.currentSheet || '';

  const rawData: Record<string, unknown>[] =
    store.data.length > 0 ? store.data : (location.state?.data ?? MOCK_DATA);
  const columns: string[] =
    store.columns.length > 0 ? store.columns : (location.state?.columns ?? Object.keys(MOCK_DATA[0]));

  // ── Column config from store ─────────────────────────────────────────────
  const localMappings = store.mappings;
  const columnRenames = store.columnRenames;

  // ── Transform options from store ─────────────────────────────────────────
  const {
    activeTab, eInvoiceMode,
    fixDates, dateFormat, currencyFormat,
    removeDuplicates, fixFormatting,
    processedResult,
  } = store;

  // ── Convenience setters ──────────────────────────────────────────────────
  const setActiveTab = (v: string) => store.setUIState({ activeTab: v });
  const setEInvoiceMode = (v: boolean) => store.setUIState({ eInvoiceMode: v });
  const setFixDates = (v: boolean) => store.setUIState({ fixDates: v });
  const setDateFormat = (v: string) => store.setUIState({ dateFormat: v });
  const setCurrencyFormat = (v: string) => store.setUIState({ currencyFormat: v });
  const setRemoveDuplicates = (v: boolean) => store.setUIState({ removeDuplicates: v });
  const setFixFormatting = (v: boolean) => store.setUIState({ fixFormatting: v });
  const setProcessedResult = (v: ProcessedResult | null) => store.setUIState({ processedResult: v });

  // ── Derived display data ─────────────────────────────────────────────────
  // First 100 rows used for the preview table (raw)
  const displayData = rawData.slice(0, 100);
  const totalRows = rawData.length;
  const hasFeatures = removeDuplicates || fixDates || fixFormatting || eInvoiceMode;

  // E-Invoice field checks
  const mappedFields = Object.values(localMappings);
  const hasBuyerTIN = mappedFields.includes('Buyer_TIN');
  const hasSellerTIN = mappedFields.includes('Seller_TIN');
  const hasInvoiceNo = mappedFields.includes('Invoice_Number');
  const hasTaxAmount = mappedFields.includes('Tax_Amount');

  // ── Mapping validation warnings ──────────────────────────────────────────
  // Uses displayData — must be declared after displayData.
  const mappingWarnings: string[] = (() => {
    const warnings: string[] = [];
    Object.entries(localMappings).forEach(([col, mappedTo]) => {
      if (!AMOUNT_FIELDS.includes(mappedTo as StandardField)) return;
      let nonNumeric = 0;
      displayData.forEach((row) => {
        const v = row[col];
        if (v != null) {
          const clean = String(v).replace(/[$,.\s]/g, '').trim();
          if (clean !== '' && isNaN(Number(clean))) nonNumeric++;
        }
      });
      if (nonNumeric > 0) {
        warnings.push(
          `'${col.replace(/_/g, ' ')}' → ${mappedTo}: ${nonNumeric} non-numeric value${nonNumeric > 1 ? 's' : ''}.`,
        );
      }
    });
    return warnings;
  })();

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleMappingChange = useCallback(
    (col: string, value: string) => {
      store.setMappings({ ...localMappings, [col]: value });
      if (processedResult) setProcessedResult(null);
    },
    [localMappings, processedResult, store],
  );

  const handleRenameChange = useCallback(
    (col: string, value: string) => {
      store.setColumnRenames({ ...columnRenames, [col]: value });
      if (processedResult) setProcessedResult(null);
    },
    [columnRenames, processedResult, store],
  );

  const handleAutoMap = useCallback(() => {
    setIsMapping(true);
    setTimeout(() => {
      const next: Record<string, string> = {};
      columns.forEach((col) => {
        const lc = col.toLowerCase();
        if (lc.includes('date') || lc === 'dt') next[col] = 'Date';
        else if (lc.includes('desc') || lc.includes('particular') || lc.includes('detail')) next[col] = 'Description';
        else if (lc.includes('ref') || lc.includes('txn')) next[col] = 'Reference';
        else if (lc.includes('money out') || lc.includes('payment') || lc === 'dr' || lc.includes('withdraw') || lc.includes('debit')) next[col] = 'Debit';
        else if (lc.includes('money in') || lc.includes('receipt') || lc === 'cr' || lc.includes('deposit') || lc.includes('credit')) next[col] = 'Credit';
        else if (lc.includes('amount') || lc.includes('price') || lc.includes('total')) next[col] = 'Amount';
        else if (lc.includes('curr') || lc === 'ccy') next[col] = 'Currency';
        else if (lc.includes('status') || lc.includes('state')) next[col] = 'Status';
        else if (lc.includes('buyer tin') || lc.includes('customer tin')) next[col] = 'Buyer_TIN';
        else if (lc.includes('seller tin') || lc.includes('merchant tin')) next[col] = 'Seller_TIN';
        else if (lc.includes('invoice') || lc.includes('inv no')) next[col] = 'Invoice_Number';
        else if (lc.includes('tax') || lc.includes('gst') || lc.includes('vat')) next[col] = 'Tax_Amount';
      });
      store.setMappings(next);
      setIsMapping(false);
    }, 1_200);
  }, [columns, store]);

  /**
   * Core transformation engine.
   *
   * Runs over ALL rows (not just the preview slice) and stores a
   * CellResult per cell so the preview table and export can both use
   * the transformed values without re-processing.
   */
  const handleProcess = useCallback(() => {
    setIsProcessing(true);
    setStatsOpen(true);

    // Defer heavy work one microtask so React can flush the button state
    setTimeout(() => {
      try {
        const comparisonResults: Record<string, CellResult>[] = [];
        let duplicatesRemoved = 0;
        let datesConverted = 0;
        let currencyFixed = 0;
        const seen = new Set<string>();

        rawData.forEach((row: Record<string, unknown>) => {
          const rowResult: Record<string, CellResult> = {};

          // ── Duplicate detection ────────────────────────────────────────
          const rowKey = JSON.stringify(row);
          if (removeDuplicates && seen.has(rowKey)) {
            columns.forEach((col) => {
              rowResult[col] = { original: row[col], transformed: null, status: 'Removed' };
            });
            duplicatesRemoved++;
            comparisonResults.push(rowResult);
            return;
          }
          seen.add(rowKey);

          // ── Per-column transformations ─────────────────────────────────
          columns.forEach((col) => {
            const origVal = row[col];
            let newVal: unknown = origVal;
            let status: CellResult['status'] = 'Unchanged';

            const mapped = localMappings[col] ?? '';
            const isDateCol = mapped === 'Date' || col.toLowerCase().includes('date') || col.toLowerCase() === 'dt';
            const isAmtCol = AMOUNT_FIELDS.includes(mapped as StandardField) ||
              col.toLowerCase().includes('amount') ||
              col.toLowerCase().includes('total');

            if (fixDates && isDateCol && origVal != null) {
              const transformed = normalizeDate(String(origVal), dateFormat);
              if (transformed === 'Invalid Date') {
                status = 'Error';
              } else if (String(origVal) !== transformed) {
                newVal = transformed;
                status = 'Fixed';
                datesConverted++;
              }
            } else if (fixFormatting && isAmtCol && origVal != null) {
              const transformed = normalizeCurrency(String(origVal), currencyFormat);
              if (String(origVal) !== transformed) {
                newVal = transformed;
                status = 'Fixed';
                currencyFixed++;
              }
            }

            rowResult[col] = { original: origVal, transformed: newVal, status };
          });

          comparisonResults.push(rowResult);
        });

        const result: ProcessedResult = {
          status: 'success',
          summary: {
            total_rows: rawData.length,
            message: `Output date format: ${dateFormat === 'auto' ? 'ISO (YYYY-MM-DD)' : dateFormat}. Currency: ${currencyFormat}.`,
            duplicates_removed: duplicatesRemoved,
            dates_converted: datesConverted,
            currency_fixed: currencyFixed,
            // Snapshot the formats used so Export can reproduce them
            applied_date_format: dateFormat,
            applied_currency_format: currencyFormat,
          },
          processed_results: comparisonResults,
        };

        setProcessedResult(result);

        // ── Update Dashboard in real time ──────────────────────────────
        store.addTransformation({
          name: fileName,
          status: 'Completed',
          rows: rawData.length,
          errorsFixed: datesConverted + currencyFixed + duplicatesRemoved,
          datesFixed: datesConverted,
          duplicatesRemoved,
          currencyFixed,
        });
      } catch (err) {
        console.error('Processing failed:', err);
        store.addTransformation({
          name: fileName, status: 'Failed',
          rows: rawData.length, errorsFixed: 0,
          datesFixed: 0, duplicatesRemoved: 0, currencyFixed: 0,
        });
      } finally {
        setIsProcessing(false);
      }
    }, 0);
  }, [
    rawData, columns, localMappings,
    fixDates, dateFormat,
    fixFormatting, currencyFormat,   // ← currencyFormat NOW in deps array
    removeDuplicates,
    fileName, store,
  ]);

  // ── Column label helper ──────────────────────────────────────────────────
  const getColumnLabel = (col: string): string =>
    columnRenames[col] ?? col.replace(/_/g, ' ');

  // ── Per-cell display value resolver ─────────────────────────────────────
  /**
   * Returns { value, isTransformed } for a preview table cell.
   *
   * Before Process (processedResult === null):
   *   → returns the raw original value from rawData. No transform applied.
   *
   * After Process (processedResult !== null):
   *   → returns the transformed value from processedResult (or original if
   *     the cell was Unchanged / Removed).
   */
  const getCellDisplay = (
    rowIdx: number,
    col: string,
    rawRow: Record<string, unknown>,
  ): { value: string; isTransformed: boolean; isError: boolean; isRemoved: boolean } => {
    const rawStr = rawRow[col] != null ? String(rawRow[col]) : '';

    if (!processedResult) {
      return { value: rawStr, isTransformed: false, isError: false, isRemoved: false };
    }

    const processedRow = processedResult.processed_results[rowIdx];
    if (!processedRow) {
      return { value: rawStr, isTransformed: false, isError: false, isRemoved: false };
    }

    const cell = processedRow[col];
    if (!cell) {
      return { value: rawStr, isTransformed: false, isError: false, isRemoved: false };
    }

    if (cell.status === 'Removed') {
      return { value: '— removed —', isTransformed: false, isError: false, isRemoved: true };
    }
    if (cell.status === 'Error') {
      return { value: String(cell.original ?? ''), isTransformed: false, isError: true, isRemoved: false };
    }
    const displayVal = cell.transformed != null ? String(cell.transformed) : String(cell.original ?? '');
    return {
      value: displayVal,
      isTransformed: cell.status === 'Fixed',
      isError: false,
      isRemoved: false,
    };
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 h-full flex flex-col"
    >
      {/* Datalist for Map-To suggestions */}
      <datalist id="standard-fields">
        {STANDARD_FIELDS.map((f) => (
          <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>
        ))}
      </datalist>

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Data Transformation Editor
          </h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-medium text-slate-700">{fileName}</span>
            <span className="text-xs text-slate-400">({fileSize})</span>

            {sheets && Object.keys(sheets).length > 1 && (
              <div className="ml-4 flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Sheet:</span>
                <select
                  value={currentSheet}
                  onChange={(e) => { store.setCurrentSheet(e.target.value); setProcessedResult(null); }}
                  className="text-sm bg-white border border-slate-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.keys(sheets).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleProcess}
            disabled={!hasFeatures || isProcessing}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 border ${hasFeatures && !isProcessing
                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200'
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              }`}
          >
            <Play className="w-4 h-4" />
            {isProcessing ? 'Processing…' : 'Process'}
          </button>
          <button
            onClick={() => navigate('/export')}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* ── Status Banner ────────────────────────────────────────────────── */}
      {!processedResult ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-emerald-900">File Loaded Successfully</h3>
            <p className="text-sm text-emerald-700 mt-1">
              Select your formats and transformations, then click <strong>Process</strong>.
              The preview below shows original data.
            </p>
          </div>
        </div>
      ) : (
        /* ── Post-processing Stats Banner ─────────────────────────────── */
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-emerald-200 rounded-xl overflow-hidden shadow-sm"
        >
          <div className="px-5 py-3 flex items-center justify-between bg-emerald-50 border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-sm font-bold text-emerald-900">Transformation Complete</span>
                <span className="ml-3 text-xs text-emerald-600">
                  {processedResult.summary.message}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/export')}
                className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-1.5"
              >
                Go to Export <Download className="w-3 h-3" />
              </button>
              <button
                onClick={() => setProcessedResult(null)}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => setStatsOpen((v) => !v)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
                aria-label="Toggle stats"
              >
                {statsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {statsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
                  {[
                    { label: 'Total Rows', value: processedResult.summary.total_rows, color: 'text-slate-900' },
                    { label: 'Dates Fixed', value: processedResult.summary.dates_converted, color: 'text-emerald-600' },
                    { label: 'Currency Cleaned', value: processedResult.summary.currency_fixed, color: 'text-indigo-600' },
                    { label: 'Duplicates Removed', value: processedResult.summary.duplicates_removed, color: 'text-rose-600' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="px-5 py-3 flex flex-col">
                      <span className={`text-2xl font-black tabular-nums ${color}`}>
                        {value.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Main Layout ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">

        {/* ── Left Sidebar ─────────────────────────────────────────────── */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            {([
              { id: 'transform', label: 'Transform', Icon: ArrowRightLeft },
              { id: 'clean', label: 'Clean', Icon: Eraser },
              { id: 'einvoice', label: 'E-Invoice', Icon: FileCheck2 },
            ] as const).map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 py-3 text-xs font-medium text-center border-b-2 transition-colors ${activeTab === id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
              >
                <Icon className="w-4 h-4 mx-auto mb-1" />
                {label}
              </button>
            ))}
          </div>

          <div className="p-5 overflow-y-auto flex-1">

            {/* ── Transform Tab ─────────────────────────────────────────── */}
            {activeTab === 'transform' && (
              <div className="space-y-5">

                {/* Format Standardization */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">
                    Format Standardization
                  </h3>
                  <div className="space-y-3">

                    {/* Date Format */}
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Output Date Format
                      </label>
                      <select
                        value={dateFormat}
                        onChange={(e) => {
                          setDateFormat(e.target.value);
                          // Clear stale results so user re-runs with new format
                          if (processedResult) setProcessedResult(null);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      >
                        <option value="auto">Auto-Detect → ISO (YYYY-MM-DD)</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      </select>
                      <p className="mt-1 text-[10px] text-slate-400 leading-snug">
                        {dateFormat === 'auto'
                          ? 'Detects any input format and outputs YYYY-MM-DD.'
                          : `Input is interpreted as ${dateFormat} when ambiguous.`}
                      </p>
                    </div>

                    {/* Currency Format */}
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Output Currency Format
                      </label>
                      <select
                        value={currencyFormat}
                        onChange={(e) => {
                          setCurrencyFormat(e.target.value);
                          if (processedResult) setProcessedResult(null);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      >
                        <option value="auto">Auto-Detect (normalised decimal)</option>
                        <option value="US (1,000.00)">US  —  1,000.00</option>
                        <option value="EU (1.000,00)">EU  —  1.000,00</option>
                      </select>
                      <p className="mt-1 text-[10px] text-slate-400 leading-snug">
                        {currencyFormat === 'auto'
                          ? 'Auto-detects US/EU separators, outputs plain decimal.'
                          : currencyFormat === 'US (1,000.00)'
                            ? 'Outputs 1,240.50 — comma thousands, dot decimal.'
                            : 'Outputs 1.240,50 — dot thousands, comma decimal.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI Automation */}
                <div className="pt-4 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">AI Automation</h3>
                  <button
                    onClick={handleAutoMap}
                    disabled={isMapping}
                    className="w-full bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 border border-indigo-200 mb-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Wand2 className="w-4 h-4" />
                    {isMapping ? 'Mapping…' : 'Auto-Map Columns'}
                  </button>
                  <button
                    onClick={() => store.setMappings({})}
                    className="w-full bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 border border-slate-200 mb-4"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset Mapping
                  </button>

                  {mappingWarnings.length > 0 && (
                    <div className="bg-amber-50/80 p-3 rounded-lg border border-amber-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span className="text-[11px] uppercase tracking-wider font-bold text-amber-900">
                          Validation Warnings
                        </span>
                      </div>
                      <ul className="space-y-1.5 pl-1.5 border-l-2 border-amber-300 ml-1">
                        {mappingWarnings.map((w, i) => (
                          <li key={i} className="text-xs text-amber-800 leading-tight font-medium">{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ── Clean Tab ─────────────────────────────────────────────── */}
            {activeTab === 'clean' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">
                    Data Cleaning Engine
                  </h3>
                  <div className="space-y-3">
                    {([
                      { id: 'removeDuplicates', checked: removeDuplicates, onChange: setRemoveDuplicates, label: 'Remove duplicate records' },
                      { id: 'fixDates', checked: fixDates, onChange: setFixDates, label: 'Fix Excel Dates (45417 → ISO)' },
                      { id: 'fixFormatting', checked: fixFormatting, onChange: setFixFormatting, label: 'Fix formatting issues' },
                    ] as const).map(({ id, checked, onChange, label }) => (
                      <label
                        key={id}
                        className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => onChange(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-slate-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {processedResult && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="block text-xs font-medium text-slate-500 mb-2">Last Run</label>
                    <div className="space-y-2">
                      {[
                        { n: processedResult.summary.duplicates_removed, label: 'duplicate', unit: 'removed' },
                        { n: processedResult.summary.dates_converted, label: 'date', unit: 'standardised' },
                        { n: processedResult.summary.currency_fixed, label: 'value', unit: 'normalised' },
                      ].map(({ n, label, unit }) => (
                        <div key={label} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                          <span className="text-slate-700">
                            {n} {label}{n !== 1 ? 's' : ''} {unit}.
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── E-Invoice Tab ──────────────────────────────────────────── */}
            {activeTab === 'einvoice' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">E-Invoice Compliance</h3>
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl mb-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={eInvoiceMode}
                        onChange={(e) => setEInvoiceMode(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-semibold text-indigo-900">Enable IRBM E-Invoice Mode</span>
                    </label>
                    <p className="text-xs text-indigo-700 mt-2 ml-7">
                      Validates data against Malaysia IRBM requirements and enables XML/JSON export.
                    </p>
                  </div>

                  {eInvoiceMode && (
                    <>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Required Fields Check
                      </h4>
                      <div className="space-y-2">
                        {([
                          { label: 'Buyer TIN', ok: hasBuyerTIN },
                          { label: 'Seller TIN', ok: hasSellerTIN },
                          { label: 'Invoice Number', ok: hasInvoiceNo },
                          { label: 'Tax Amount', ok: hasTaxAmount },
                        ] as const).map(({ label, ok }) => (
                          <div key={label} className={`flex items-center justify-between p-2 bg-white border rounded-lg ${ok ? 'border-emerald-200' : 'border-amber-200'}`}>
                            <span className="text-sm text-slate-700">{label}</span>
                            {ok
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              : <AlertCircle className="w-4 h-4 text-amber-500" />}
                          </div>
                        ))}
                      </div>
                      {(!hasBuyerTIN || !hasSellerTIN || !hasInvoiceNo || !hasTaxAmount) && (
                        <p className="text-xs text-amber-600 mt-3">
                          Some required fields are missing. Map them in the Transform tab.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── Data Panel ───────────────────────────────────────────────── */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">

          {/* Panel header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              {processedResult
                ? `Transformed Preview (${Math.min(displayData.length, processedResult.processed_results.length)} rows shown)`
                : `Original Data Preview (${displayData.length} rows shown)`}
            </h2>
            <div className="flex items-center gap-3">
              {processedResult && (
                <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                  Indigo cells = transformed
                </div>
              )}
              <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                {totalRows.toLocaleString()} Rows Total
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-100 text-slate-600 font-medium border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  {columns.map((col) => {
                    const isMapped = !!localMappings[col];
                    return (
                      <th key={col} className="px-4 py-3 min-w-[200px] border-r border-slate-200 last:border-r-0">
                        <div className="flex flex-col gap-2">
                          {/* ── Rename input (controlled) ─────────────── */}
                          <input
                            type="text"
                            value={getColumnLabel(col)}
                            onChange={(e) => handleRenameChange(col, e.target.value)}
                            className="bg-transparent font-semibold text-slate-900 focus:outline-none focus:border-b focus:border-indigo-500 w-full capitalize"
                            placeholder="Column Name"
                            title={`Rename column "${col}"`}
                          />
                          {/* ── Map To input ──────────────────────────── */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold shrink-0">
                              Map to:
                            </span>
                            <input
                              type="text"
                              list="standard-fields"
                              value={localMappings[col] ?? ''}
                              onChange={(e) => handleMappingChange(col, e.target.value)}
                              placeholder="Type or select…"
                              className={`text-xs border rounded px-2 py-1 w-full focus:outline-none focus:border-indigo-500 ${isMapped
                                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700 font-medium'
                                  : 'border-slate-300 bg-white'
                                }`}
                            />
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {displayData.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-50 transition-colors">
                    {columns.map((col) => {
                      const mappedField = localMappings[col];
                      const isAmount = mappedField ? AMOUNT_FIELDS.includes(mappedField as StandardField) : false;
                      const isDate = mappedField === 'Date';
                      const isStatus = mappedField === 'Status';

                      const { value, isTransformed, isError, isRemoved } = getCellDisplay(rowIdx, col, row);

                      return (
                        <td key={col} className="px-4 py-4 border-r border-slate-100 last:border-r-0">
                          {isRemoved ? (
                            <span className="text-xs text-slate-300 italic">removed</span>
                          ) : isStatus ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${/^(completed|success)$/i.test(value)
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                              }`}>
                              {value || 'unknown'}
                            </span>
                          ) : isError ? (
                            <span className="font-mono text-xs text-rose-500 bg-rose-50 px-1 rounded">
                              {value}
                            </span>
                          ) : isDate ? (
                            <span className={`font-mono text-sm ${isTransformed
                                ? 'text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-semibold'
                                : 'text-slate-700'
                              }`}>
                              {value}
                            </span>
                          ) : isAmount ? (
                            <span className={`font-mono font-medium ${isTransformed
                                ? 'text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-semibold'
                                : value.startsWith('-')
                                  ? 'text-rose-600'
                                  : 'text-emerald-600'
                              }`}>
                              {value}
                            </span>
                          ) : (
                            <span className={isTransformed ? 'text-indigo-700 font-medium' : 'text-slate-900'}>
                              {value}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Proof of Transformation (shown after Process) ────────────── */}
          {processedResult && (
            <div className="border-t border-slate-200 bg-slate-50/70">
              <div className="px-5 py-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <h3 className="text-xs font-bold text-slate-900">
                  Proof of Transformation — Top Changed Cells
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-white text-slate-500 border-y border-slate-100 font-bold uppercase tracking-tighter">
                    <tr>
                      <th className="px-5 py-2.5 border-r border-slate-100">Field</th>
                      <th className="px-5 py-2.5 border-r border-slate-100">Original</th>
                      <th className="px-5 py-2.5 border-r border-slate-100">Transformed</th>
                      <th className="px-5 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(() => {
                      // Collect up to 6 Fixed cells across all preview rows
                      const evidence: Array<{ col: string; cell: CellResult }> = [];
                      outer: for (const row of processedResult.processed_results.slice(0, 20)) {
                        for (const [col, cell] of Object.entries(row)) {
                          if (cell.status === 'Fixed') {
                            evidence.push({ col, cell });
                            if (evidence.length >= 6) break outer;
                          }
                        }
                      }
                      if (evidence.length === 0) {
                        return (
                          <tr>
                            <td colSpan={4} className="px-5 py-3 text-slate-400 italic">
                              No transformations applied — all values were already in the target format.
                            </td>
                          </tr>
                        );
                      }
                      return evidence.map(({ col, cell }, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="px-5 py-2.5 font-semibold text-slate-900">{getColumnLabel(col)}</td>
                          <td className="px-5 py-2.5 text-slate-400 italic line-through">{String(cell.original ?? '—')}</td>
                          <td className="px-5 py-2.5 font-mono font-bold text-indigo-600">{String(cell.transformed ?? '—')}</td>
                          <td className="px-5 py-2.5">
                            <span className="px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider bg-emerald-100 text-emerald-700">
                              Fixed
                            </span>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  Encrypted Memory Pipeline Active · PDPA Compliant
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
}
