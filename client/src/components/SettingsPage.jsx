import React, { useState, useEffect } from 'react';

export default function SettingsPage({ onIngest, isIngesting, onExport, txCount = 0 }) {
  const [rules, setRules] = useState([]);
  const [loadingRules, setLoadingRules] = useState(true);

  const fetchRules = () => {
    setLoadingRules(true);
    fetch('/api/rules')
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
    await fetch(`/api/rules/${id}`, { method: 'DELETE' });
    setRules(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in max-w-4xl">
      <div className="border-b border-[#2A2A2E] pb-4">
        <h2 className="text-[20px] font-semibold text-[#F5F5F5] tracking-tight">
          System & Settings
        </h2>
        <p className="text-[13px] text-[#8A8A8E] mt-0.5">
          LLM pipeline configuration, agent memory rules, and ledger database management.
        </p>
      </div>

      {/* Model & Engine Configuration Card */}
      <div className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-6">
        <h3 className="text-[15px] font-semibold text-[#F5F5F5] mb-4">
          LLM Engine Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
          <div className="p-4 rounded-lg bg-[#0D0D0F] border border-[#2A2A2E]">
            <span className="text-[#8A8A8E] block text-[12px] uppercase tracking-wider mb-1 font-mono">
              Categorization Model (Fast)
            </span>
            <span className="font-mono text-[#F5F5F5] font-medium text-[14px]">
              openai/gpt-oss-20b
            </span>
            <span className="block text-[11px] text-[#22C55E] mt-1 font-mono">
              ● High Throughput · 1 API call per run
            </span>
          </div>

          <div className="p-4 rounded-lg bg-[#0D0D0F] border border-[#2A2A2E]">
            <span className="text-[#8A8A8E] block text-[12px] uppercase tracking-wider mb-1 font-mono">
              Reasoning & Chat Model (Smart)
            </span>
            <span className="font-mono text-[#F5F5F5] font-medium text-[14px]">
              openai/gpt-oss-120b
            </span>
            <span className="block text-[11px] text-[#4F6EF7] mt-1 font-mono">
              ● Deep Reasoning · Function Tool Calling
            </span>
          </div>
        </div>
      </div>

      {/* Agent Memory Rules Card */}
      <div className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[15px] font-semibold text-[#F5F5F5]">
              Agent Memory (Dismissed Rules)
            </h3>
            <p className="text-[12px] text-[#8A8A8E] mt-0.5">
              When you dismiss a flagged item, the agent stores a memory rule to prevent re-flagging identical patterns.
            </p>
          </div>
          <span className="text-[12px] font-mono text-[#505055]">
            {rules.length} {rules.length === 1 ? 'rule' : 'rules'} active
          </span>
        </div>

        {loadingRules ? (
          <p className="text-[13px] text-[#8A8A8E] py-4">Loading rules…</p>
        ) : rules.length === 0 ? (
          <p className="text-[13px] text-[#505055] py-4 border-t border-[#2A2A2E]">
            No active memory rules. Dismissing transactions will populate this list.
          </p>
        ) : (
          <div className="flex flex-col gap-2 border-t border-[#2A2A2E] pt-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-3 rounded-lg bg-[#0D0D0F] border border-[#2A2A2E] text-[13px]"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-[#2A2A2E] text-[#F5F5F5]">
                    {rule.flag_type}
                  </span>
                  <span className="text-[#8A8A8E]">
                    Ignore: <span className="text-[#F5F5F5] font-medium">"{rule.description_pattern}"</span>
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="text-[12px] text-[#EF4444] hover:underline cursor-pointer"
                >
                  Delete rule
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Database & Data Management */}
      <div className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-6">
        <h3 className="text-[15px] font-semibold text-[#F5F5F5] mb-4">
          Data Management
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onIngest}
            disabled={isIngesting}
            className="px-4 py-2 rounded-lg text-[13px] font-medium bg-[#1C1C1F] hover:bg-[#2A2A2E] text-[#F5F5F5] border border-[#2A2A2E] transition-colors cursor-pointer"
          >
            {isIngesting ? 'Reloading…' : 'Reload sample_transactions.csv'}
          </button>
          {onExport && (
            <button
              onClick={onExport}
              className="px-4 py-2 rounded-lg text-[13px] font-medium bg-[#1C1C1F] hover:bg-[#2A2A2E] text-[#F5F5F5] border border-[#2A2A2E] transition-colors cursor-pointer"
            >
              Export CSV
            </button>
          )}
        </div>
        <p className="text-[12px] text-[#505055] mt-3 font-mono">
          Database: SQLite (WAL Mode) · {txCount} transactions currently indexed
        </p>
      </div>
    </div>
  );
}
