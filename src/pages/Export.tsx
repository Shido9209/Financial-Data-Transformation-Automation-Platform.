import { motion } from 'motion/react';
import { Download, FileSpreadsheet, FileJson, FileText, CheckCircle2, FileCheck2, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useState } from 'react';

const exportFormats = [
  { id: 'csv', name: 'CSV', icon: FileText, description: 'Standard comma-separated values. Best for general use.', pro: false },
  { id: 'json', name: 'JSON (API/E-Invoice)', icon: FileJson, description: 'Structured data format. Ideal for APIs and E-Invoicing integrations.', pro: false },
  { id: 'excel', name: 'Excel (.xlsx)', icon: FileSpreadsheet, description: 'Microsoft Excel format with multiple sheets support.', pro: true },
  { id: 'xml', name: 'XML (E-Invoice Compliance)', icon: FileCheck2, description: 'Compliance-ready XML for tax authorities (e.g., Malaysia IRBM).', pro: true },
];

export function Export() {
  const store = useAppStore();
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);

  // Use processed data if available, otherwise raw data
  const dataToExport = store.processedResult?.processed_results || store.data;
  const hasData = dataToExport && dataToExport.length > 0;
  
  const baseFileName = store.fileName ? store.fileName.split('.')[0] : 'Exported_Data';
  const displayFileName = `${baseFileName}_Cleaned`;

  const handleExport = () => {
    if (!hasData) return;
    setIsExporting(true);

    try {
      if (selectedFormat === 'csv') {
        exportCSV();
      } else if (selectedFormat === 'json') {
        exportJSON();
      } else {
        alert(`Exporting to ${selectedFormat.toUpperCase()} is a Pro feature.`);
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data.");
    } finally {
      setIsExporting(false);
    }
  };

  const exportCSV = () => {
    if (!dataToExport || dataToExport.length === 0) return;

    // Get all unique keys from the data array
    const headers = Array.from(new Set(dataToExport.flatMap(Object.keys)));
    
    const csvRows = [];
    // Add headers
    csvRows.push(headers.map(header => `"${String(header).replace(/"/g, '""')}"`).join(','));
    
    // Add data rows
    for (const row of dataToExport) {
      const values = headers.map(header => {
        const val = row[header as keyof typeof row];
        const strVal = val === null || val === undefined ? '' : String(val);
        return `"${strVal.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${displayFileName}.csv`);
  };

  const exportJSON = () => {
    if (!dataToExport || dataToExport.length === 0) return;
    
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    downloadBlob(blob, `${displayFileName}.json`);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Export Data</h1>
        <p className="text-slate-500 mt-1">Choose your preferred format to download the transformed data.</p>
      </div>

      {!hasData ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-amber-900">No Data Available</h2>
          <p className="text-amber-700 mt-2">Please upload and process a file in the Data Editor before exporting.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{displayFileName}</h2>
              <p className="text-sm text-slate-500 mt-1">{dataToExport.length.toLocaleString()} rows • Ready</p>
            </div>
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Ready to export
            </div>
          </div>

          <div className="p-8">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-6">Select Format</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exportFormats.map((format) => {
                const Icon = format.icon;
                const isSelected = selectedFormat === format.id;
                return (
                  <label 
                    key={format.id} 
                    className={`relative flex cursor-pointer rounded-2xl border p-6 shadow-sm transition-colors group ${
                      isSelected ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-200 bg-white hover:border-indigo-500'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="export-format" 
                      value={format.id} 
                      className="sr-only" 
                      checked={isSelected}
                      onChange={(e) => setSelectedFormat(e.target.value)}
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
                    <CheckCircle2 className={`h-5 w-5 absolute top-6 right-6 transition-opacity ${isSelected ? 'text-indigo-600 opacity-100' : 'opacity-0'}`} />
                    <span className={`pointer-events-none absolute -inset-px rounded-2xl border-2 transition-colors ${isSelected ? 'border-indigo-600' : 'border-transparent'}`} aria-hidden="true" />
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
                {isExporting ? 'Exporting...' : 'Download File'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
