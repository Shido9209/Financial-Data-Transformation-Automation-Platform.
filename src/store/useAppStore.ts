import { create } from 'zustand';

// ─── Domain Types ─────────────────────────────────────────────────────────────

interface SheetData {
  data: any[];
  columns: string[];
}

export interface TransformationJob {
  id: string;
  name: string;
  status: 'Completed' | 'Failed';
  /** Total rows in the source file */
  rows: number;
  timestamp: Date;
  /** Number of cell-level errors fixed (dates + currency + duplicates) */
  errorsFixed: number;
  datesFixed: number;
  duplicatesRemoved: number;
  currencyFixed: number;
}

// ─── Processed Result Sub-types ───────────────────────────────────────────────

export interface CellResult {
  original: unknown;
  transformed: unknown;
  status: 'Fixed' | 'Removed' | 'Error' | 'Unchanged';
}

export interface ProcessedResult {
  status: 'success' | 'error';
  summary: {
    total_rows: number;
    message: string;
    duplicates_removed: number;
    dates_converted: number;
    currency_fixed: number;
    /**
     * The date format that was active when this result was produced.
     * Export reads this to re-apply the correct separator/order to output values.
     * Possible values: 'auto' | 'DD/MM/YYYY' | 'MM/DD/YYYY'
     *   'auto'        → ISO 8601  YYYY-MM-DD
     *   'DD/MM/YYYY'  → e.g.  24/10/2023
     *   'MM/DD/YYYY'  → e.g.  10/24/2023
     */
    applied_date_format: string;
    /**
     * The currency format that was active when this result was produced.
     * Export reads this to output values in the correct locale style.
     * Possible values: 'auto' | 'US (1,000.00)' | 'EU (1.000,00)'
     *   'auto'          → normalized decimal  e.g. 1240.50
     *   'US (1,000.00)' → US style            e.g. 1,240.50
     *   'EU (1.000,00)' → EU style            e.g. 1.240,50
     */
    applied_currency_format: string;
  };
  /** Array of rows; each row maps column key → CellResult */
  processed_results: Record<string, CellResult>[];
}

// ─── State Shape ──────────────────────────────────────────────────────────────

interface AppState {
  // ── File metadata ────────────────────────────────────────────────────────
  fileName: string;
  fileSize: number;

  // ── Raw data ─────────────────────────────────────────────────────────────
  data: any[];
  columns: string[];

  // ── Multi-sheet support ──────────────────────────────────────────────────
  sheets: Record<string, SheetData> | null;
  currentSheet: string;

  // ── Column configuration ─────────────────────────────────────────────────
  /** Maps original column key → user-defined display name */
  columnRenames: Record<string, string>;
  /** Maps original column key → standard field identifier */
  mappings: Record<string, string>;

  // ── Transformation options ───────────────────────────────────────────────
  activeTab: string;
  eInvoiceMode: boolean;
  fixDates: boolean;
  /**
   * Target date output format.
   * 'auto'       → parse any input, output ISO YYYY-MM-DD
   * 'DD/MM/YYYY' → parse any input, output DD/MM/YYYY
   * 'MM/DD/YYYY' → parse any input, output MM/DD/YYYY
   */
  dateFormat: string;
  /**
   * Target currency output format.
   * 'auto'          → auto-detect separators, output normalised decimal
   * 'US (1,000.00)' → output US locale style
   * 'EU (1.000,00)' → output EU locale style
   */
  currencyFormat: string;
  removeDuplicates: boolean;
  fixFormatting: boolean;

  // ── Processing output ────────────────────────────────────────────────────
  processedResult: ProcessedResult | null;

  // ── Dashboard history & aggregate metrics ────────────────────────────────
  transformationHistory: TransformationJob[];

  // ─── Actions ─────────────────────────────────────────────────────────────
  setFileData: (payload: {
    fileName: string;
    fileSize: number;
    data: any[];
    columns: string[];
    sheets?: Record<string, SheetData> | null;
    currentSheet?: string;
  }) => void;
  setMappings: (mappings: Record<string, string>) => void;
  setColumnRenames: (renames: Record<string, string>) => void;
  setCurrentSheet: (sheet: string) => void;
  /** Shallow-merge arbitrary UI flags/values into state */
  setUIState: (payload: Partial<AppState>) => void;
  /** Record a completed (or failed) transformation for the Dashboard */
  addTransformation: (job: Omit<TransformationJob, 'id' | 'timestamp'>) => void;
  clearData: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let jobCounter = 1000;
const generateJobId = (): string => `JOB-${++jobCounter}`;

const DEFAULT_STATE = {
  fileName: '',
  fileSize: 0,
  data: [] as any[],
  columns: [] as string[],
  sheets: null,
  currentSheet: '',
  columnRenames: {} as Record<string, string>,
  mappings: {} as Record<string, string>,
  activeTab: 'transform',
  eInvoiceMode: false,
  fixDates: true,
  dateFormat: 'auto',
  currencyFormat: 'auto',
  removeDuplicates: true,
  fixFormatting: true,
  processedResult: null as ProcessedResult | null,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set) => ({
  ...DEFAULT_STATE,
  transformationHistory: [],

  // ── setFileData ───────────────────────────────────────────────────────────
  setFileData: (payload) =>
    set({
      fileName: payload.fileName,
      fileSize: payload.fileSize,
      data: payload.data,
      columns: payload.columns,
      sheets: payload.sheets ?? null,
      currentSheet: payload.currentSheet ?? '',
      // Reset derived state on new file
      mappings: {},
      columnRenames: {},
      processedResult: null,
    }),

  // ── setMappings ───────────────────────────────────────────────────────────
  setMappings: (mappings) => set({ mappings }),

  // ── setColumnRenames ──────────────────────────────────────────────────────
  setColumnRenames: (renames) => set({ columnRenames: renames }),

  // ── setCurrentSheet ───────────────────────────────────────────────────────
  setCurrentSheet: (sheet) =>
    set((state) => {
      if (state.sheets?.[sheet]) {
        return {
          currentSheet: sheet,
          data: state.sheets[sheet].data,
          columns: state.sheets[sheet].columns,
          // Reset column config on sheet switch
          mappings: {},
          columnRenames: {},
          processedResult: null,
        };
      }
      return { currentSheet: sheet };
    }),

  // ── setUIState ────────────────────────────────────────────────────────────
  setUIState: (payload) => set((state) => ({ ...state, ...payload })),

  // ── addTransformation ─────────────────────────────────────────────────────
  addTransformation: (job) =>
    set((state) => ({
      transformationHistory: [
        {
          ...job,
          id: generateJobId(),
          timestamp: new Date(),
        },
        ...state.transformationHistory,
      ].slice(0, 100), // Retain last 100 jobs
    })),

  // ── clearData ─────────────────────────────────────────────────────────────
  clearData: () => set({ ...DEFAULT_STATE }),
}));

// ─── Derived / selector helpers ───────────────────────────────────────────────

/** Aggregate metrics computed from transformation history */
export const selectDashboardMetrics = (history: TransformationJob[]) => {
  const filesProcessed = history.length;
  const rowsCleaned = history.reduce((s, j) => s + j.rows, 0);
  const errorsFixed = history.reduce((s, j) => s + j.errorsFixed, 0);
  // Heuristic: 1 hour saved per 5,000 rows cleaned
  const hoursSaved = Math.max(0, Math.round(rowsCleaned / 5_000));
  return { filesProcessed, rowsCleaned, errorsFixed, hoursSaved };
};
