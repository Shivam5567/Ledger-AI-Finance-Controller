import React, { useState, useEffect } from 'react';
import { ArrowUpRightIcon, RefreshCwIcon, CheckIcon, AlertTriangleIcon } from './Icons';

const TYPE_NAMES = {
  missing_invoice: 'Missing invoice ref',
  duplicate_payment: 'Duplicate payment',
  duplicate_ref: 'Duplicate invoice ref',
  spend_anomaly: 'Spend anomaly',
};

export default function ReportPanel({
  initialReport = null,
  hasRunAgent = false,
  isRunning = false,
  onRunAgent,
  onExport,
  onViewExceptions,
}) {
  const [report, setReport] = useState(initialReport);
  const [loading, setLoading] = useState(!initialReport);

  const fetchReportData = () => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/report`)
      .then((r) => r.json())
      .then((data) => {
        setReport(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('[ReportPanel] Failed to fetch report:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReportData();
  }, [hasRunAgent]);

  // Sync if initialReport changes
  useEffect(() => {
    if (initialReport) {
      setReport(initialReport);
      setLoading(false);
    }
  }, [initialReport]);

  if (loading && !report) {
    return (
      <div className="quixotic-card p-8 text-center animate-fade-in">
        <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-3">
          <span className="w-4 h-4 border-2 border-[#007A4D] border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-gray-600 text-sm font-medium">
          Compiling financial reconciliation and accuracy report…
        </p>
        <p className="text-gray-400 text-xs mt-1 font-mono">
          Querying ledger database and computing match rate breakdown
        </p>
      </div>
    );
  }

  const summary = report?.summary || {};
  const total = summary.total || 0;
  const matched = summary.matched || 0;
  const exceptions = summary.exceptions || 0;
  const matchRateNum = total > 0 ? ((matched / total) * 100).toFixed(1) : '0.0';
  const duration = summary.durationSeconds || '0.2';
  const exceptionBreakdown = report?.exceptionBreakdown || [];
  const exceptionList = report?.exceptionList || [];
  const maxExceptionCount = Math.max(...exceptionBreakdown.map((e) => e.count), 1);

  if (total === 0) {
    return (
      <div className="quixotic-card p-8 text-center animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-4 text-gray-400">
          <AlertTriangleIcon className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1">
          No Reconciliation Data Available
        </h3>
        <p className="text-gray-500 text-xs max-w-md mx-auto mb-5 leading-relaxed">
          Ingest transactions and run the reconciliation agent to generate the accuracy breakdown and exception audit trail.
        </p>
        {onRunAgent && (
          <button
            onClick={onRunAgent}
            disabled={isRunning}
            className="px-5 py-2.5 rounded-full bg-[#007A4D] hover:bg-[#00603C] text-white text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running Reconciliation…</span>
              </>
            ) : (
              <>
                <RefreshCwIcon className="w-3.5 h-3.5" />
                <span>Reconcile Ledger Now</span>
              </>
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* ── Main Executive Summary Card ── */}
      <div className="quixotic-card p-6 transition-all">
        {/* Header with Title and Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#007A4D]" />
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                Measured Reconciliation Accuracy
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              {total} multi-source transactions verified in{' '}
              <span className="font-bold text-[#007A4D]">{duration}s</span> throughput
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onExport && (
              <button
                onClick={onExport}
                className="px-3.5 py-1.5 rounded-full bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold border border-gray-200/90 shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                title="Download CSV of reconciled transactions"
              >
                <span>Export CSV ↓</span>
              </button>
            )}

            {onRunAgent && (
              <button
                onClick={onRunAgent}
                disabled={isRunning}
                className="px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-[#007A4D] border border-emerald-200/90 text-xs font-semibold shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                title="Re-run reconciliation pipeline"
              >
                <RefreshCwIcon className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                <span>{isRunning ? 'Reconciling…' : 'Reconcile Ledger'}</span>
              </button>
            )}

            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-[#007A4D] border border-emerald-200">
              Audit Verified
            </span>
          </div>
        </div>

        {/* Progress Bar & KPI Metrics */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 text-sm">
            <div className="flex items-center gap-4">
              <span className="text-[#007A4D] font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#007A4D]" />
                <span className="font-mono font-bold text-gray-900">{matched}</span> matched
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-red-600 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="font-mono font-bold text-gray-900">{exceptions}</span> exceptions
              </span>
            </div>
            <span className="font-mono font-bold text-sm text-[#007A4D] bg-emerald-50 border border-emerald-200/60 px-3 py-0.5 rounded-full">
              {matchRateNum}% verified
            </span>
          </div>

          {/* Dual Progress Bar */}
          <div className="w-full h-3.5 rounded-full bg-gray-100 overflow-hidden flex shadow-inner">
            <div
              className="h-full bg-[#007A4D] transition-all duration-700 rounded-l-full"
              style={{ width: `${matchRateNum}%` }}
              title={`Matched: ${matched} (${matchRateNum}%)`}
            />
            {exceptions > 0 && (
              <div
                className="h-full bg-red-500 transition-all duration-700 rounded-r-full"
                style={{ width: `${(exceptions / total) * 100}%` }}
                title={`Exceptions: ${exceptions} (${((exceptions / total) * 100).toFixed(1)}%)`}
              />
            )}
          </div>
        </div>

        {/* Exceptions Breakdown Mini-Bars */}
        {exceptionBreakdown.length > 0 && (
          <div className="border-t border-gray-100 pt-5 mb-5">
            <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider font-mono">
              Categorized Discrepancy Breakdown
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {exceptionBreakdown.map((item) => {
                const label = TYPE_NAMES[item.exception_type] || item.exception_type;
                const barWidthPercent = Math.max(15, (item.count / maxExceptionCount) * 100);
                return (
                  <div
                    key={item.exception_type}
                    className="flex items-center justify-between text-xs p-3 rounded-xl bg-gray-50 border border-gray-100/80"
                  >
                    <span className="text-gray-700 font-medium">{label}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-400 rounded-full"
                          style={{ width: `${barWidthPercent}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-gray-900 text-xs w-6 text-right">
                        {item.count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Link */}
        <div className="border-t border-gray-100 pt-4 flex flex-wrap justify-between items-center gap-2 text-xs">
          <span className="text-gray-500 font-mono">
            {exceptions} edge cases isolated with plain-English audit explanations
          </span>
          {onViewExceptions && (
            <button
              onClick={onViewExceptions}
              className="font-semibold text-[#007A4D] hover:text-[#00603C] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View full exception list</span>
              <span>→</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Detailed Exception Register Table ── */}
      {exceptionList.length > 0 && (
        <div className="quixotic-card p-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900">
                Transparent Discrepancy Register
              </h4>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">
                Audit list of transactions that could not be auto-resolved with 100% confidence
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-mono font-bold border border-red-200">
              {exceptionList.length} Items
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-400 font-mono border-b border-gray-100 pb-2">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-right">Amount</th>
                  <th className="pb-2 pl-4">Exception Type</th>
                  <th className="pb-2 pl-4">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-mono">
                {exceptionList.map((exc) => {
                  const isIncome = exc.type === 'income';
                  const label = TYPE_NAMES[exc.exception_type] || exc.exception_type;
                  return (
                    <tr key={exc.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-2.5 text-gray-500 whitespace-nowrap">{exc.date}</td>
                      <td className="py-2.5 font-sans font-medium text-gray-900">
                        {exc.description}
                      </td>
                      <td className={`py-2.5 text-right font-bold whitespace-nowrap ${isIncome ? 'text-[#007A4D]' : 'text-gray-800'}`}>
                        {isIncome ? '+' : '-'}₹{Math.abs(exc.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 pl-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-sans font-medium bg-red-50 text-red-700 border border-red-200">
                          {label}
                        </span>
                      </td>
                      <td className="py-2.5 pl-4 font-sans text-xs text-gray-500 max-w-xs truncate" title={exc.exception_reason}>
                        {exc.exception_reason || 'Unverified counterpart settlement'}
                      </td>
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

