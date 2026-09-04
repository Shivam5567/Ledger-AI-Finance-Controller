import React, { useState, useEffect } from 'react';

const EXCEPTION_LABELS = {
  missing_invoice:   { label: 'Missing invoice ref',     icon: '📋', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  duplicate_payment: { label: 'Duplicate payment',       icon: '🔄', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  duplicate_ref:     { label: 'Duplicate invoice ref',   icon: '📄', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  spend_anomaly:     { label: 'Spend anomaly',           icon: '⚠️', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export default function ReportPanel({ hasRunAgent }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    if (!hasRunAgent) return;
    setLoading(true);
    fetch('/api/report')
      .then(r => r.json())
      .then(data => { setReport(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [hasRunAgent]);

  if (!hasRunAgent) {
    return (
      <div className="glass-card p-6 border border-white/5 text-center">
        <span className="text-2xl">📊</span>
        <p className="text-slate-400 text-sm mt-2">Run agent to see the reconciliation report</p>
      </div>
    );
  }

  if (loading || !report) {
    return (
      <div className="glass-card p-6 border border-white/5 text-center">
        <p className="text-slate-400 text-sm animate-pulse">Loading report…</p>
      </div>
    );
  }

  const { summary, exceptionBreakdown, exceptionList } = report;
  const matchedPct = parseFloat(summary.matchRate);
  const exPct      = 100 - matchedPct;

  return (
    <div className="glass-card border border-white/5 overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📊</span>
            <h3 className="text-base font-semibold text-slate-200">Reconciliation Report</h3>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400">
            {summary.total} transactions processed
          </span>
        </div>
      </div>

      {/* Match rate bar */}
      <div className="p-5">
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-sm">✅</span>
            <span className="text-sm font-semibold text-emerald-300">
              Matched: {summary.matched}
            </span>
            <span className="text-xs text-emerald-400/70">({matchedPct.toFixed(1)}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-sm">⚠️</span>
            <span className="text-sm font-semibold text-amber-300">
              Exceptions: {summary.exceptions}
            </span>
            <span className="text-xs text-amber-400/70">({exPct.toFixed(1)}%)</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000 ease-out rounded-l-full"
            style={{ width: `${matchedPct}%` }}
          />
          {exPct > 0 && (
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-1000 ease-out rounded-r-full"
              style={{ width: `${exPct}%` }}
            />
          )}
        </div>

        {/* Exception breakdown */}
        {exceptionBreakdown.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-medium text-slate-400 mb-2.5 uppercase tracking-wider">Exception breakdown</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {exceptionBreakdown.map(item => {
                const cfg = EXCEPTION_LABELS[item.exception_type] || { label: item.exception_type, icon: '❓', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
                return (
                  <div key={item.exception_type} className="bg-white/5 rounded-lg p-3 border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">{cfg.icon}</span>
                      <span className="text-[11px] text-slate-400 font-medium">{cfg.label}</span>
                    </div>
                    <p className="text-lg font-bold text-slate-200">
                      {item.count}
                      <span className="text-xs font-normal text-slate-500 ml-1">
                        {item.count === 1 ? 'transaction' : 'transactions'}
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Toggle exception list */}
        {exceptionList.length > 0 && (
          <button
            onClick={() => setShowList(!showList)}
            className="mt-4 flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            {showList ? '▲ Hide' : '▼ View'} exception list ({exceptionList.length})
          </button>
        )}
      </div>

      {/* Exception list table */}
      {showList && exceptionList.length > 0 && (
        <div className="border-t border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-slate-400 text-xs border-b border-white/5">
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Description</th>
                  <th className="p-3 font-medium">Amount</th>
                  <th className="p-3 font-medium">Exception Type</th>
                  <th className="p-3 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {exceptionList.map(tx => {
                  const cfg = EXCEPTION_LABELS[tx.exception_type] || { label: tx.exception_type, color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
                  return (
                    <tr key={tx.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="p-3 text-xs text-slate-300 whitespace-nowrap">{tx.date}</td>
                      <td className="p-3 text-xs text-slate-200">{tx.description}</td>
                      <td className="p-3 text-xs font-medium text-slate-200">
                        ${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-slate-400 max-w-xs">{tx.exception_reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
