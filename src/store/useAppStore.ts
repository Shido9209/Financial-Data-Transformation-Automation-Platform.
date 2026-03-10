import { create } from 'zustand';

interface SheetData {
  data: any[];
  columns: string[];
}

interface AppState {
  fileName: string;
  fileSize: number;
  data: any[];
  columns: string[];
  sheets: Record<string, SheetData> | null;
  currentSheet: string;
  mappings: Record<string, string>;
  activeTab: string;
  eInvoiceMode: boolean;
  fixDates: boolean;
  dateFormat: string;
  removeDuplicates: boolean;
  fixFormatting: boolean;
  processedResult: any | null;
  setFileData: (payload: {
    fileName: string;
    fileSize: number;
    data: any[];
    columns: string[];
    sheets?: Record<string, SheetData> | null;
    currentSheet?: string;
  }) => void;
  setMappings: (mappings: Record<string, string>) => void;
  setCurrentSheet: (sheet: string) => void;
  setUIState: (payload: Partial<AppState>) => void;
  clearData: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  fileName: '',
  fileSize: 0,
  data: [],
  columns: [],
  sheets: null,
  currentSheet: '',
  mappings: {},
  activeTab: 'transform',
  eInvoiceMode: false,
  fixDates: true,
  dateFormat: 'auto',
  removeDuplicates: true,
  fixFormatting: true,
  processedResult: null,
  setFileData: (payload) => set({
    fileName: payload.fileName,
    fileSize: payload.fileSize,
    data: payload.data,
    columns: payload.columns,
    sheets: payload.sheets || null,
    currentSheet: payload.currentSheet || '',
    mappings: {}, // Reset mappings on new file upload
    processedResult: null, // Reset processed result on new file upload
  }),
  setMappings: (mappings) => set({ mappings }),
  setCurrentSheet: (sheet) => set((state) => {
    if (state.sheets && state.sheets[sheet]) {
      return {
        currentSheet: sheet,
        data: state.sheets[sheet].data,
        columns: state.sheets[sheet].columns,
        mappings: {}, // Reset mappings on sheet change
        processedResult: null, // Reset processed result on sheet change
      };
    }
    return { currentSheet: sheet };
  }),
  setUIState: (payload) => set((state) => ({ ...state, ...payload })),
  clearData: () => set({
    fileName: '',
    fileSize: 0,
    data: [],
    columns: [],
    sheets: null,
    currentSheet: '',
    mappings: {},
    activeTab: 'transform',
    eInvoiceMode: false,
    fixDates: true,
    dateFormat: 'auto',
    removeDuplicates: true,
    fixFormatting: true,
    processedResult: null,
  }),
}));
