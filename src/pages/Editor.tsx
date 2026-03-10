import { motion } from 'motion/react';
import { Wand2, Settings2, Download, CheckCircle2, AlertCircle, FileSpreadsheet, Sparkles, FileCheck2, ArrowRightLeft, Eraser, ChevronDown, Play } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

const mockData = [
  { date: '10/24/2023', description: 'STRIPE PAYOUT', amount: '1,240.50', currency: 'USD', status: 'completed' },
  { date: '10/25/2023', description: 'AWS WEB SERVICES', amount: '-45.00', currency: 'USD', status: 'completed' },
  { date: '10/26/2023', description: 'SHOPIFY TRANSFER', amount: '890.00', currency: 'USD', status: 'pending' },
  { date: '10/27/2023', description: 'GSUITE SUBSCRIPTION', amount: '-12.00', currency: 'USD', status: 'completed' },
];

const STANDARD_FIELDS = ['Date', 'Description', 'Reference', 'Debit', 'Credit', 'Amount', 'Currency', 'Status', 'Buyer_TIN', 'Seller_TIN', 'Invoice_Number', 'Tax_Amount'];

export function Editor() {
  const location = useLocation();
  const navigate = useNavigate();
  const store = useAppStore();
  
  const [isCleaning, setIsCleaning] = useState(false);
  const [isMapping, setIsMapping] = useState(false);
  
  // Use store data if available, otherwise fallback to location state, otherwise mock
  const fileName = store.fileName || location.state?.fileName || 'Maybank_Statement_Q3.csv';
  const fileSize = store.fileSize ? `${(store.fileSize / 1024 / 1024).toFixed(2)} MB` : location.state?.fileSize ? `${(location.state.fileSize / 1024 / 1024).toFixed(2)} MB` : '1.2 MB';
  
  const sheets = store.sheets || location.state?.sheets || null;
  const currentSheet = store.currentSheet || location.state?.currentSheet || '';
  
  const rawData = store.data.length > 0 ? store.data : location.state?.data || mockData;
  const columns = store.columns.length > 0 ? store.columns : location.state?.columns || Object.keys(mockData[0]);
  
  const mappings = Object.keys(store.mappings).length > 0 ? store.mappings : {};
  const [localMappings, setLocalMappings] = useState<Record<string, string>>(mappings);
  
  // Feature states from store
  const activeTab = store.activeTab;
  const eInvoiceMode = store.eInvoiceMode;
  const fixDates = store.fixDates;
  const dateFormat = store.dateFormat;
  const removeDuplicates = store.removeDuplicates;
  const fixFormatting = store.fixFormatting;
  const processedResult = store.processedResult;

  const setActiveTab = (tab: string) => store.setUIState({ activeTab: tab });
  const setEInvoiceMode = (val: boolean) => store.setUIState({ eInvoiceMode: val });
  const setFixDates = (val: boolean) => store.setUIState({ fixDates: val });
  const setDateFormat = (val: string) => store.setUIState({ dateFormat: val });
  const setRemoveDuplicates = (val: boolean) => store.setUIState({ removeDuplicates: val });
  const setFixFormatting = (val: boolean) => store.setUIState({ fixFormatting: val });
  const setProcessedResult = (val: any) => store.setUIState({ processedResult: val });

  // The "Passive" Load & "Wait" State
  useEffect(() => {
    setLocalMappings(store.mappings);
    // Ensure we start in a pending state, not processed
    setProcessedResult(null);
  }, [store.mappings]);

  // Limit to first 100 rows for preview
  const displayData = rawData.slice(0, 100);
  const totalRows = rawData.length;

  const hasSelectedFeatures = removeDuplicates || fixDates || fixFormatting || eInvoiceMode;

  const handleClean = () => {
    setIsCleaning(true);
    setTimeout(() => setIsCleaning(false), 2000);
  };

  const handleAutoMap = () => {
    setIsMapping(true);
    setTimeout(() => {
      const newMappings: Record<string, string> = {};
      columns.forEach(col => {
        const lowerCol = col.toLowerCase();
        if (lowerCol.includes('date') || lowerCol === 'dt') newMappings[col] = 'Date';
        else if (lowerCol.includes('desc') || lowerCol.includes('particular') || lowerCol.includes('detail')) newMappings[col] = 'Description';
        else if (lowerCol.includes('ref') || lowerCol.includes('txn')) newMappings[col] = 'Reference';
        else if (lowerCol.includes('money out') || lowerCol.includes('payment') || lowerCol === 'dr' || lowerCol.includes('withdraw') || lowerCol.includes('debit')) newMappings[col] = 'Debit';
        else if (lowerCol.includes('money in') || lowerCol.includes('receipt') || lowerCol === 'cr' || lowerCol.includes('deposit') || lowerCol.includes('credit')) newMappings[col] = 'Credit';
        else if (lowerCol.includes('amount') || lowerCol.includes('price') || lowerCol.includes('total')) newMappings[col] = 'Amount';
        else if (lowerCol.includes('curr') || lowerCol === 'ccy') newMappings[col] = 'Currency';
        else if (lowerCol.includes('status') || lowerCol.includes('state')) newMappings[col] = 'Status';
        else if (lowerCol.includes('buyer tin') || lowerCol.includes('customer tin')) newMappings[col] = 'Buyer_TIN';
        else if (lowerCol.includes('seller tin') || lowerCol.includes('merchant tin')) newMappings[col] = 'Seller_TIN';
        else if (lowerCol.includes('invoice') || lowerCol.includes('inv no')) newMappings[col] = 'Invoice_Number';
        else if (lowerCol.includes('tax') || lowerCol.includes('gst') || lowerCol.includes('vat')) newMappings[col] = 'Tax_Amount';
      });
      setLocalMappings(newMappings);
      store.setMappings(newMappings);
      setIsMapping(false);
    }, 1500);
  };

  const handleMappingChange = (col: string, value: string) => {
    const newMappings = { ...localMappings, [col]: value };
    setLocalMappings(newMappings);
    store.setMappings(newMappings);
  };

  const normalizeDate = (val: string, format: string) => {
    if (!val || val.trim() === '' || val.toUpperCase() === 'N/A' || val.toUpperCase() === 'TBD') return 'Invalid Date';
    
    // Check for Excel serial date (e.g., 45417)
    const numVal = Number(val);
    if (!isNaN(numVal) && numVal > 30000 && numVal < 60000) {
      // Excel epoch is 1899-12-30
      const date = new Date(Date.UTC(1899, 11, 30));
      date.setUTCDate(date.getUTCDate() + numVal);
      return date.toISOString().split('T')[0];
    }

    // Replace common separators with dash
    let d = val.replace(/[\.\s\/]/g, '-');
    const parts = d.split('-');
    
    if (parts.length === 3) {
      let year, month, day;
      
      if (parts[0].length === 4) {
        year = parts[0];
        month = parts[1];
        day = parts[2];
      } else if (parts[2].length === 4) {
        year = parts[2];
        if (format === 'DD/MM/YYYY') {
          day = parts[0];
          month = parts[1];
        } else if (format === 'MM/DD/YYYY') {
          month = parts[0];
          day = parts[1];
        } else {
          // Auto-detect
          if (parseInt(parts[0]) > 12) {
            day = parts[0];
            month = parts[1];
          } else if (parseInt(parts[1]) > 12) {
            month = parts[0];
            day = parts[1];
          } else {
            // Default to MM/DD/YYYY if ambiguous
            month = parts[0];
            day = parts[1];
          }
        }
      } else {
        return 'Invalid Date';
      }
      
      const paddedMonth = month.padStart(2, '0');
      const paddedDay = day.padStart(2, '0');
      
      const dateObj = new Date(`${year}-${paddedMonth}-${paddedDay}`);
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
      
      return `${year}-${paddedMonth}-${paddedDay}`;
    }
    
    const dateObj = new Date(val);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().split('T')[0];
    }
    
    return 'Invalid Date';
  };

  const normalizeCurrency = (val: string) => {
    if (!val) return val;
    let s = String(val).replace(/[^\d.,-]/g, '');
    const commas = (s.match(/,/g) || []).length;
    const dots = (s.match(/\./g) || []).length;
    
    if (commas === 1 && dots >= 0) {
      const commaPos = s.indexOf(',');
      const dotPos = s.lastIndexOf('.');
      if (commaPos > dotPos) s = s.replace(/\./g, '').replace(',', '.'); // EU: 1.000,00 -> 1000.00
      else s = s.replace(/,/g, ''); // US: 1,000.00 -> 1000.00
    } else if (commas > 1 && dots <= 1) {
      s = s.replace(/,/g, ''); // US: 1,000,000.00 -> 1000000.00
    } else if (dots > 1 && commas <= 1) {
      s = s.replace(/\./g, '').replace(',', '.'); // EU: 1.000.000,00 -> 1000000.00
    }
    return s;
  };

  const handleProcess = () => {
    const comparisonResults: any[] = [];
    let duplicatesRemoved = 0;
    let datesConverted = 0;
    
    // Track seen rows for duplicate removal
    const seen = new Set();

    displayData.forEach((row) => {
      const rowResult: any = {};
      
      // Duplicate check
      const rowString = JSON.stringify(row);
      if (removeDuplicates && seen.has(rowString)) {
        columns.forEach(col => {
          rowResult[col] = {
            original: row[col],
            transformed: null,
            status: "Removed"
          };
        });
        duplicatesRemoved++;
        comparisonResults.push(rowResult);
        return;
      }
      seen.add(rowString);

      columns.forEach(col => {
        const origVal = row[col];
        let newVal = origVal;
        let status = "Unchanged";

        const lowerCol = col.toLowerCase();
        const isDateCol = lowerCol.includes('date') || lowerCol === 'dt' || localMappings[col] === 'Date';
        const isAmountCol = lowerCol.includes('amount') || lowerCol.includes('total') || localMappings[col] === 'Amount';

        if (fixDates && isDateCol && origVal) {
          newVal = normalizeDate(String(origVal), dateFormat);
          if (String(origVal) !== String(newVal)) {
            status = "Fixed";
            datesConverted++;
          }
          if (newVal === 'Invalid Date') {
            status = "Error";
          }
        } else if (fixFormatting && isAmountCol && origVal) {
          newVal = normalizeCurrency(String(origVal));
          if (String(origVal) !== String(newVal)) {
            status = "Fixed";
          }
        }

        rowResult[col] = {
          original: origVal,
          transformed: newVal,
          status: status
        };
      });
      
      comparisonResults.push(rowResult);
    });

    setProcessedResult({
      status: "success",
      summary: {
        message: `Detected format: ${dateFormat === 'auto' ? 'Auto-Detect' : dateFormat}. Successfully converted ${datesConverted} rows to ISO standard.`,
        duplicates_removed: duplicatesRemoved,
        dates_converted: datesConverted
      },
      processed_results: comparisonResults
    });
  };

  const mappedFields = Object.values(localMappings);
  const hasBuyerTIN = mappedFields.includes('Buyer_TIN');
  const hasSellerTIN = mappedFields.includes('Seller_TIN');
  const hasInvoiceNo = mappedFields.includes('Invoice_Number');
  const hasTaxAmount = mappedFields.includes('Tax_Amount');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 h-full flex flex-col"
    >
      <datalist id="standard-fields">
        {STANDARD_FIELDS.map(f => (
          <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>
        ))}
      </datalist>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Data Transformation Editor</h1>
          <div className="flex items-center gap-2 mt-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-medium text-slate-700">{fileName}</span>
            <span className="text-xs text-slate-400">({fileSize})</span>
            
            {sheets && Object.keys(sheets).length > 1 && (
              <div className="ml-4 flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Sheet:</span>
                <select 
                  value={currentSheet}
                  onChange={(e) => {
                    store.setCurrentSheet(e.target.value);
                    setProcessedResult(null);
                  }}
                  className="text-sm bg-white border border-slate-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.keys(sheets).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleProcess}
            disabled={!hasSelectedFeatures}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 border ${
              hasSelectedFeatures 
                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200' 
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            }`}
          >
            <Play className="w-4 h-4" />
            Process
          </button>
          <button 
            onClick={handleClean}
            className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-100 transition-colors flex items-center gap-2 border border-indigo-200"
          >
            <Sparkles className="w-4 h-4" />
            {isCleaning ? 'Processing...' : 'Auto Clean (AI)'}
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

      {/* User Confirmation Banner */}
      {!processedResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-emerald-900">File Loaded Successfully</h3>
            <p className="text-sm text-emerald-700 mt-1">
              Please select the transformations you need below, then click Process.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button 
              onClick={() => setActiveTab('transform')}
              className={`flex-1 py-3 text-xs font-medium text-center border-b-2 transition-colors ${activeTab === 'transform' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <ArrowRightLeft className="w-4 h-4 mx-auto mb-1" />
              Transform
            </button>
            <button 
              onClick={() => setActiveTab('clean')}
              className={`flex-1 py-3 text-xs font-medium text-center border-b-2 transition-colors ${activeTab === 'clean' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <Eraser className="w-4 h-4 mx-auto mb-1" />
              Clean
            </button>
            <button 
              onClick={() => setActiveTab('einvoice')}
              className={`flex-1 py-3 text-xs font-medium text-center border-b-2 transition-colors ${activeTab === 'einvoice' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <FileCheck2 className="w-4 h-4 mx-auto mb-1" />
              E-Invoice
            </button>
          </div>

          <div className="p-5 overflow-y-auto flex-1">
            {activeTab === 'transform' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Format Standardization</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Date Format</label>
                      <select 
                        value={dateFormat}
                        onChange={(e) => setDateFormat(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      >
                        <option value="auto">Auto-Detect to ISO (YYYY-MM-DD)</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Currency Format</label>
                      <select className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
                        <option>Auto-Detect Separators</option>
                        <option>US (1,000.00)</option>
                        <option>EU (1.000,00)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">AI Automation</h3>
                  <button 
                    onClick={handleAutoMap}
                    className="w-full bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 border border-indigo-200 mb-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    {isMapping ? 'Mapping...' : 'Auto-Map Columns'}
                  </button>
                  <button className="w-full bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 border border-slate-200">
                    <Sparkles className="w-4 h-4" />
                    Detect Financial Fields
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'clean' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Data Cleaning Engine</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                      <input 
                        type="checkbox" 
                        checked={removeDuplicates}
                        onChange={(e) => setRemoveDuplicates(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" 
                      />
                      <span className="text-sm font-medium text-slate-700">Remove duplicate records</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                      <input 
                        type="checkbox" 
                        checked={fixDates}
                        onChange={(e) => setFixDates(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" 
                      />
                      <span className="text-sm font-medium text-slate-700">Fix Excel Dates (45417 &rarr; ISO)</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                      <input 
                        type="checkbox" 
                        checked={fixFormatting}
                        onChange={(e) => setFixFormatting(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" 
                      />
                      <span className="text-sm font-medium text-slate-700">Fix formatting issues</span>
                    </label>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="block text-xs font-medium text-slate-500 mb-2">AI Suggestions</label>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-slate-700">Detected {isCleaning ? '2' : '0'} duplicate rows. Removed.</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-slate-700">3 empty descriptions found. Filled with "UNKNOWN".</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                    <p className="text-xs text-indigo-700 mt-2 ml-7">Validates data against Malaysia IRBM requirements and enables XML/JSON export.</p>
                  </div>

                  {eInvoiceMode && (
                    <>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Required Fields Check</h4>
                      <div className="space-y-2">
                        <div className={`flex items-center justify-between p-2 bg-white border rounded-lg ${hasBuyerTIN ? 'border-emerald-200' : 'border-amber-200'}`}>
                          <span className="text-sm text-slate-700">Buyer TIN</span>
                          {hasBuyerTIN ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
                        </div>
                        <div className={`flex items-center justify-between p-2 bg-white border rounded-lg ${hasSellerTIN ? 'border-emerald-200' : 'border-amber-200'}`}>
                          <span className="text-sm text-slate-700">Seller TIN</span>
                          {hasSellerTIN ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
                        </div>
                        <div className={`flex items-center justify-between p-2 bg-white border rounded-lg ${hasInvoiceNo ? 'border-emerald-200' : 'border-amber-200'}`}>
                          <span className="text-sm text-slate-700">Invoice Number</span>
                          {hasInvoiceNo ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
                        </div>
                        <div className={`flex items-center justify-between p-2 bg-white border rounded-lg ${hasTaxAmount ? 'border-emerald-200' : 'border-amber-200'}`}>
                          <span className="text-sm text-slate-700">Tax Amount</span>
                          {hasTaxAmount ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
                        </div>
                      </div>
                      
                      {(!hasBuyerTIN || !hasSellerTIN || !hasInvoiceNo || !hasTaxAmount) && (
                        <p className="text-xs text-amber-600 mt-3">
                          Some required fields are missing. Please map them in the Transform tab.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          {processedResult ? (
            <div className="flex flex-col h-full">
              <div className="px-6 py-4 border-b border-slate-200 bg-emerald-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-sm font-semibold text-emerald-900">Processed Results (JSON Output)</h2>
                </div>
                <button 
                  onClick={() => setProcessedResult(null)}
                  className="text-xs font-medium text-emerald-700 hover:text-emerald-900 bg-emerald-100 px-3 py-1.5 rounded-md"
                >
                  Back to Preview
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 bg-slate-900">
                <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap">
                  {JSON.stringify(processedResult, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">Data Preview (First {displayData.length} rows)</h2>
                <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                  Previewing {totalRows.toLocaleString()} Rows
                </span>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-100 text-slate-600 font-medium border-b border-slate-200 sticky top-0">
                    <tr>
                      {columns.map((col: string, index: number) => (
                        <th key={index} className="px-4 py-3 min-w-[200px] border-r border-slate-200 last:border-r-0">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <input 
                                type="text" 
                                defaultValue={col.replace(/_/g, ' ')} 
                                className="bg-transparent font-semibold text-slate-900 focus:outline-none focus:border-b focus:border-indigo-500 w-full capitalize"
                                placeholder="Column Name"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Map to:</span>
                              <input 
                                type="text"
                                list="standard-fields"
                                value={localMappings[col] || ''}
                                onChange={(e) => handleMappingChange(col, e.target.value)}
                                placeholder="Type or select..."
                                className={`text-xs bg-white border rounded px-2 py-1 w-full focus:outline-none focus:border-indigo-500 ${localMappings[col] ? 'border-indigo-300 bg-indigo-50 text-indigo-700 font-medium' : 'border-slate-300'}`}
                              />
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {displayData.map((row: any, rowIndex: number) => (
                      <tr key={rowIndex} className="hover:bg-slate-50 transition-colors">
                        {columns.map((col: string, colIndex: number) => {
                          const cellValue = row[col] !== undefined && row[col] !== null ? String(row[col]) : '';
                          const mappedField = localMappings[col];
                          
                          const isAmount = mappedField === 'Amount' || mappedField === 'Debit' || mappedField === 'Credit' || mappedField === 'Tax_Amount';
                          const isDate = mappedField === 'Date';
                          const isStatus = mappedField === 'Status';
                          
                          let displayValue = cellValue;
                          if (isCleaning) {
                            if (isDate) displayValue = normalizeDate(cellValue, dateFormat);
                            if (isAmount) displayValue = normalizeCurrency(cellValue);
                          }

                          return (
                            <td key={colIndex} className="px-4 py-4 border-r border-slate-100 last:border-r-0">
                              {isStatus ? (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  cellValue.toLowerCase() === 'completed' || cellValue.toLowerCase() === 'success' 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {displayValue || 'unknown'}
                                </span>
                              ) : isAmount ? (
                                <span className={`font-mono font-medium ${displayValue.startsWith('-') ? 'text-rose-600' : 'text-emerald-600'}`}>
                                  {displayValue}
                                </span>
                              ) : isDate ? (
                                <span className={`font-mono ${displayValue === 'Invalid Date' ? 'text-rose-600 font-medium' : 'text-slate-700'}`}>
                                  {displayValue}
                                </span>
                              ) : (
                                <span className="text-slate-900">{displayValue}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
