import React, { useState, useEffect, useRef } from 'react';
import { SettingsGearIcon, SparklesIcon, TableListIcon } from './Icons';

export default function SettingsPage({ onIngest, isIngesting, onUpload, isUploading, onExport, txCount = 0 }) {
  const [rules, setRules] = useState([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [uploadStatus, setUploadStatus] = useState('');
  const fileInputRef = useRef(null);

  const fetchRules = () => {
    setLoadingRules(true);
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/rules`)
      .then(r => r.json())
      .then(data => {
        setRules(Array.isArray(data) ? data : []);
        setLoadingRules(false);
      })
      .catch(() => setLoadingRules(false));
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleDeleteRule = async (id) => {
    await fetch(`${import.meta.env.VITE_API_URL || ''}/api/rules/${id}`, { method: 'DELETE' });
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setUploadStatus('Uploading...');
        await onUpload(event.target.result);
        setUploadStatus('Upload successful!');
        setTimeout(() => setUploadStatus(''), 3000);
      } catch (err) {
        setUploadStatus('Upload failed: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in max-w-4xl">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          System & Settings
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          LLM pipeline configuration, agent memory rules, and ledger database management.
        </p>
      </div>

      {/* Model & Engine Configuration Card */}
      <div className="quixotic-card p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <SettingsGearIcon className="w-4 h-4 text-gray-700" />
          <span>Groq Cloud Model Architecture</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <span className="text-gray-400 block text-[11px] uppercase tracking-wider mb-1 font-mono font-semibold">
              Categorization (Fast Engine)
            </span>
            <span className="font-mono text-gray-900 font-bold text-sm block">
              openai/gpt-oss-20b
            </span>
            <span className="text-[11px] text-[#007A4D] mt-1.5 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#007A4D]" />
              Batched · 1 API call per complete dataset
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <span className="text-gray-400 block text-[11px] uppercase tracking-wider mb-1 font-mono font-semibold">
              Reasoning & Actions (Smart Engine)
            </span>
            <span className="font-mono text-gray-900 font-bold text-sm block">
              openai/gpt-oss-120b
            </span>
            <span className="text-[11px] text-[#007A4D] mt-1.5 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#007A4D]" />
              Function Tool Calling + Contextual Drafts
            </span>
          </div>
        </div>
      </div>

      {/* Agent Memory Rules Card */}
      <div className="quixotic-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-[#007A4D]" />
              <span>Agent Memory (Dismissed Rules)</span>
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              When you dismiss a flagged item, the agent stores a persistent rule to avoid re-flagging identical transactions.
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">
            {rules.length} active
          </span>
        </div>

        {loadingRules ? (
          <p className="text-xs text-gray-400 py-4">Loading rules…</p>
        ) : rules.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 border-t border-gray-100">
            No active memory rules. Dismissing transactions will populate this list.
          </p>
        ) : (
          <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-white border border-gray-200 text-gray-800">
                    {rule.flag_type}
                  </span>
                  <span className="text-gray-600">
                    Rule: Ignore <span className="font-semibold text-gray-900">"{rule.description_pattern}"</span>
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="text-xs text-red-600 hover:underline font-medium cursor-pointer"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Database Management Card */}
      <div className="quixotic-card p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TableListIcon className="w-4 h-4 text-gray-700" />
          <span>Ledger Data Management</span>
        </h3>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-5 py-2.5 rounded-full text-xs font-semibold bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isUploading ? 'Uploading…' : '↑ Upload CSV File'}
          </button>
          <button
            onClick={onIngest}
            disabled={isIngesting}
            className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#007A4D] hover:bg-[#006644] text-white transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isIngesting ? 'Reloading…' : 'Reload Sample Transactions'}
          </button>
          {onExport && (
            <button
              onClick={onExport}
              className="px-5 py-2.5 rounded-full text-xs font-semibold bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition-all cursor-pointer shadow-xs"
            >
              Export Reconciled CSV
            </button>
          )}
        </div>

        {uploadStatus && (
          <p className={`text-xs mt-3 font-mono ${uploadStatus.includes('failed') ? 'text-red-600' : 'text-[#007A4D]'}`}>
            {uploadStatus}
          </p>
        )}

        <p className="text-[11px] text-gray-400 mt-3 font-mono">
          Database: SQLite (WAL Mode) · {txCount} transactions currently indexed
        </p>
      </div>
    </div>
  );
}
