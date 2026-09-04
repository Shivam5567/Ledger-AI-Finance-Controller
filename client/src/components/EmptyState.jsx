import React, { useState } from 'react';
import { LogoIcon } from './Icons';

export default function EmptyState({ onIngest, isIngesting }) {
  const [isDragOver, setIsDragOver] = useState(false);

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
    onIngest();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-220px)] animate-fade-in p-4">
      <div className="w-full max-w-[520px] quixotic-card p-10 text-center flex flex-col items-center">
        {/* Brand Icon */}
        <div className="mb-4">
          <LogoIcon className="w-12 h-12" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">
          No transactions indexed yet
        </h2>

        <p className="text-sm text-gray-500 mb-8 max-w-sm leading-relaxed">
          Drop your ledger CSV file here to start autonomous categorization, reconciliation, and exception detection.
        </p>

        {/* Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={onIngest}
          className={`w-full p-8 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center bg-gray-50/60 mb-6 cursor-pointer ${
            isDragOver ? 'border-[#007A4D] bg-emerald-50/40' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-3xl mb-3">📂</div>
          <button
            type="button"
            disabled={isIngesting}
            className="px-6 py-2.5 rounded-full text-xs font-semibold bg-[#007A4D] hover:bg-[#006644] text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isIngesting ? 'Loading sample_transactions.csv…' : '+ Load 55 Transactions'}
          </button>
        </div>

        <p className="text-xs text-gray-400">
          Supports: <span className="font-mono text-gray-600">date</span>, <span className="font-mono text-gray-600">description</span>, <span className="font-mono text-gray-600">amount</span>, <span className="font-mono text-gray-600">type</span>, <span className="font-mono text-gray-600">invoice_ref</span>
        </p>
      </div>
    </div>
  );
}
