import { motion } from 'motion/react';
import { UploadCloud, FileType, AlertCircle, File as FileIcon, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useAppStore } from '../store/useAppStore';

export function Upload() {
  const navigate = useNavigate();
  const setFileData = useAppStore((state) => state.setFileData);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        
        // Parse the file with memory-efficient preview (first 10 rows)
        const ext = selectedFile.name.split('.').pop()?.toLowerCase();
        
        if (ext === 'csv') {
          Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: true,
            preview: 10, // Only read first 10 rows for memory efficiency
            complete: (results) => {
              setTimeout(() => {
                setFileData({
                  fileName: selectedFile.name, 
                  fileSize: selectedFile.size,
                  data: results.data,
                  columns: results.meta.fields as string[]
                });
                navigate('/editor');
              }, 500);
            },
            error: (error) => {
              console.error("Error parsing CSV:", error);
              setTimeout(() => {
                setFileData({
                  fileName: selectedFile.name, 
                  fileSize: selectedFile.size,
                  data: [],
                  columns: []
                });
                navigate('/editor');
              }, 500);
            }
          });
        } else if (ext === 'xlsx' || ext === 'xls') {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const data = new Uint8Array(e.target?.result as ArrayBuffer);
              const workbook = XLSX.read(data, { type: 'array' });
              
              const sheetsData: Record<string, { data: any[], columns: string[] }> = {};
              
              workbook.SheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                const previewData = jsonData.slice(0, 10);
                const columns = previewData.length > 0 ? Object.keys(previewData[0] as object) : [];
                sheetsData[sheetName] = { data: previewData, columns };
              });
              
              const firstSheetName = workbook.SheetNames[0];
              
              setTimeout(() => {
                setFileData({
                  fileName: selectedFile.name, 
                  fileSize: selectedFile.size,
                  data: sheetsData[firstSheetName].data,
                  columns: sheetsData[firstSheetName].columns,
                  sheets: sheetsData,
                  currentSheet: firstSheetName
                });
                navigate('/editor');
              }, 500);
            } catch (error) {
              console.error("Error parsing Excel:", error);
              setTimeout(() => {
                setFileData({
                  fileName: selectedFile.name, 
                  fileSize: selectedFile.size,
                  data: [],
                  columns: []
                });
                navigate('/editor');
              }, 500);
            }
          };
          reader.readAsArrayBuffer(selectedFile);
        } else if (ext === 'json') {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const json = JSON.parse(e.target?.result as string);
              const dataArray = Array.isArray(json) ? json : [json];
              
              // Take only first 10 rows for preview
              const previewData = dataArray.slice(0, 10);
              const columns = previewData.length > 0 ? Object.keys(previewData[0]) : [];
              
              setTimeout(() => {
                setFileData({
                  fileName: selectedFile.name, 
                  fileSize: selectedFile.size,
                  data: previewData,
                  columns: columns
                });
                navigate('/editor');
              }, 500);
            } catch (error) {
              console.error("Error parsing JSON:", error);
              setTimeout(() => {
                setFileData({
                  fileName: selectedFile.name, 
                  fileSize: selectedFile.size,
                  data: [],
                  columns: []
                });
                navigate('/editor');
              }, 500);
            }
          };
          reader.readAsText(selectedFile);
        } else {
          // For other files, just navigate without parsed data for now
          setTimeout(() => {
            setFileData({
              fileName: selectedFile.name, 
              fileSize: selectedFile.size,
              data: [],
              columns: []
            });
            navigate('/editor');
          }, 500);
        }
      }
    }, 200);
  };

  const handleClick = () => {
    if (!file) {
      fileInputRef.current?.click();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Upload Financial Data</h1>
        <p className="text-slate-500 mt-1">Upload your bank statements, payment gateway reports, or ERP exports.</p>
      </div>

      <div 
        className={`bg-white border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer group relative overflow-hidden
          ${isDragging ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/50'}
          ${file ? 'border-emerald-500 bg-emerald-50/30 hover:border-emerald-500 hover:bg-emerald-50/30' : ''}
        `}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept=".csv,.xlsx,.xls,.json,.xml"
        />

        {!file ? (
          <>
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-10 h-10 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Drag and drop your files here</h3>
            <p className="text-slate-500 mb-8">or click to browse from your computer</p>
            
            <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <FileType className="w-4 h-4" />
                <span>CSV, Excel, JSON, XML</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>Up to 2GB (Pro Plan)</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              {uploadProgress < 100 ? (
                <FileIcon className="w-8 h-8 text-emerald-600 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">{file.name}</h3>
            <p className="text-sm text-slate-500 mb-6">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            
            <div className="w-full max-w-md bg-slate-200 rounded-full h-2.5 mb-2 overflow-hidden mx-auto">
              <div 
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-200 ease-out" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm font-medium text-emerald-600">
              {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : 'Upload Complete! Redirecting...'}
            </p>
          </div>
        )}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
        <h4 className="font-semibold text-slate-900 mb-4">Supported File Types</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Bank Statements', 'Payment Gateways', 'ERP Exports', 'E-Commerce Sales'].map((type) => (
            <div key={type} className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm">
              <span className="text-sm font-medium text-slate-700">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
