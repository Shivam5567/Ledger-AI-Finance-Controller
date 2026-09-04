import React, { useState } from 'react';

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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] animate-fade-in">
      <div className="w-full max-w-[480px] text-center flex flex-col items-center">
        {/* Minimal logo mark */}
        <div className="w-12 h-12 rounded-xl bg-[#141416] border border-[#2A2A2E] flex items-center justify-center text-xl mb-4 text-[#4F6EF7]">
          ⚡
        </div>

        <h2 className="text-[20px] font-semibold text-[#F5F5F5] mb-2">
          No transactions loaded yet.
        </h2>

        <p className="text-[14px] text-[#8A8A8E] mb-8 leading-relaxed">
          Drop a CSV file here to get started or click to browse
        </p>

        {/* Drag & drop dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full p-8 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center bg-[#141416] mb-6 cursor-pointer ${
            isDragOver
              ? 'border-[#4F6EF7] bg-[#1C1C1F]'
              : 'border-[#2A2A2E] hover:border-[#3A3A40]'
          }`}
          onClick={onIngest}
        >
          <div className="text-3xl mb-3 text-[#8A8A8E]">📂</div>
          <button
            type="button"
            disabled={isIngesting}
            className="px-6 py-2.5 rounded-lg text-[14px] font-semibold bg-[#4F6EF7] hover:bg-[#3D5DE8] text-white transition-all cursor-pointer disabled:opacity-50"
          >
            {isIngesting ? 'Loading sample_transactions.csv…' : 'Load transactions'}
          </button>
        </div>

        {/* Footnote */}
        <p className="text-[12px] text-[#505055] leading-relaxed">
          Supports: <span className="font-mono text-[#8A8A8E]">date</span>, <span className="font-mono text-[#8A8A8E]">description</span>, <span className="font-mono text-[#8A8A8E]">amount</span>, <span className="font-mono text-[#8A8A8E]">type</span>, <span className="font-mono text-[#8A8A8E]">invoice_ref</span> columns
        </p>
      </div>
    </div>
  );
}
