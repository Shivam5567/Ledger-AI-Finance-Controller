import React, { useState, useRef } from 'react';
import { LogoIcon } from './Icons';

export default function EmptyState({ onIngest, onUpload, isIngesting, isUploading }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      readFile(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) readFile(file);
  };

  const readFile = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const csvContent = event.target.result;
      if (onUpload) onUpload(csvContent);
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-220px)] animate-fade-in p-4">
      <div className="w-full max-w-[520px] quixotic-card p-10 text-center flex flex-col items-center">
        <div className="mb-4">
          <LogoIcon className="w-12 h-12" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">
          No transactions indexed yet
        </h2>

        <p className="text-sm text-gray-500 mb-8 max-w-sm leading-relaxed">
          Load sample data or upload your own ledger CSV to start autonomous categorization, reconciliation, and exception detection.
        </p>

        {/* Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full p-8 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center bg-gray-50/60 mb-4 ${
            isDragOver ? 'border-[#007A4D] bg-emerald-50/40' : 'border-gray-200'
          }`}
        >
          <div className="text-3xl mb-3">📂</div>
          <p className="text-xs text-gray-500 mb-4">Drag & drop a CSV file here</p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-5 py-2.5 rounded-full text-xs font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isUploading ? 'Uploading…' : '↑ Upload CSV'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <button
          type="button"
          disabled={isIngesting}
          onClick={onIngest}
          className="px-6 py-2.5 rounded-full text-xs font-semibold bg-[#007A4D] hover:bg-[#006644] text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          {isIngesting ? 'Loading sample_transactions.csv…' : '+ Load Sample Transactions'}
        </button>

        <p className="text-xs text-gray-400 mt-6">
          Required columns: <span className="font-mono text-gray-600">date</span>, <span className="font-mono text-gray-600">description</span>, <span className="font-mono text-gray-600">amount</span>, <span className="font-mono text-gray-600">type</span>. Optional: <span className="font-mono text-gray-600">invoice_ref</span>
        </p>
      </div>
    </div>
  );
}
