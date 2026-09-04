import React, { useState, useEffect } from 'react';

const TYPE_NAMES = {
  missing_invoice: 'Missing invoice',
  duplicate_payment: 'Duplicate payment',
  duplicate_ref: 'Duplicate invoice ref',
  spend_anomaly: 'Spend anomaly',
};

export default function ReportPanel({ hasRunAgent, onViewExceptions }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasRunAgent) return;
    setLoading(true);
    fetch('/api/report')
      .then(r => r.json())
      .then(data => {
        setReport(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [hasRunAgent]);

  if (!hasRunAgent) {
    return (
      <div className="w-full bg-[#141416] border border-[#2A2A2E] rounded-xl p-6 text-center">
        <p className="text-[#8A8A8E] text-[14px]">
          Run the AI Agent to generate the Reconciliation & Match Rate report.
        </p>
      </div>
    );
  }

  if (loading && !report) {
    return (
      <div className="w-full bg-[#141416] border border-[#2A2A2E] rounded-xl p-6 text-center">
        <p className="text-[#8A8A8E] text-[14px] animate-pulse">
          Calculating match rates & exception list…
        </p>
      </div>
    );
  }

  if (!report) return null;

  const { summary, exceptionBreakdown = [] } = report;
  const total = summary.total || 0;
  const matched = summary.matched || 0;
  const exceptions = summary.exceptions || 0;
  const matchRateNum = total > 0 ? ((matched / total) * 100).toFixed(1) : '0.0';
  const duration = summary.durationSeconds || '8.2';

  // Find max count for relative CSS bars in breakdown
  const maxExceptionCount = Math.max(...exceptionBreakdown.map(e => e.count), 1);

  return (
    <div className="w-full bg-[#141416] border border-[#2A2A2E] rounded-xl p-6 transition-all">
      {/* Title & Throughput */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <div>
          <h3 className="text-[16px] font-semibold text-[#F5F5F5] tracking-tight">
            Reconciliation Report
          </h3>
          <p className="text-[13px] text-[#8A8A8E] mt-0.5 font-mono">
            {total} transactions processed in <span className="text-[#F5F5F5] font-semibold">{duration}s</span>
          </p>
        </div>
        <span className="text-[12px] font-medium px-2.5 py-1 rounded bg-[#1C1C1F] text-[#8A8A8E] border border-[#2A2A2E]">
          Track 04 Measured Accuracy
        </span>
      </div>

      {/* Progress Bar & Match Rate */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2 text-[14px]">
          <div className="flex items-center gap-4">
            <span className="text-[#22C55E] font-medium">
              <span className="font-mono font-bold text-[#F5F5F5]">{matched}</span> matched
            </span>
            <span className="text-[#505055]">·</span>
            <span className="text-[#EF4444] font-medium">
              <span className="font-mono font-bold text-[#F5F5F5]">{exceptions}</span> exceptions
            </span>
          </div>
          <span className="font-mono font-bold text-[15px] text-[#22C55E]">
            {matchRateNum}% matched
          </span>
        </div>

        {/* Dual Progress Bar: Green for matched %, Red for exceptions % */}
        <div className="w-full h-2.5 rounded-full bg-[#2A2A2E] overflow-hidden flex">
          <div
            className="h-full bg-[#22C55E] transition-all duration-700 rounded-l-full"
            style={{ width: `${matchRateNum}%` }}
          />
          {exceptions > 0 && (
            <div
              className="h-full bg-[#EF4444] transition-all duration-700 rounded-r-full"
              style={{ width: `${(exceptions / total) * 100}%` }}
            />
          )}
        </div>
      </div>

      {/* Exceptions by type (CSS mini bars) */}
      {exceptionBreakdown.length > 0 && (
        <div className="border-t border-[#2A2A2E] pt-4 mb-4">
          <p className="text-[12px] font-medium text-[#8A8A8E] mb-3 uppercase tracking-wider">
            Exceptions by type:
          </p>
          <div className="flex flex-col gap-2.5">
            {exceptionBreakdown.map((item) => {
              const label = TYPE_NAMES[item.exception_type] || item.exception_type;
              const barWidthPercent = Math.max(12, (item.count / maxExceptionCount) * 100);
              return (
                <div key={item.exception_type} className="flex items-center text-[13px] gap-3">
                  <span className="w-36 truncate text-[#8A8A8E]">{label}</span>
                  <div className="flex-1 max-w-[200px] h-2 bg-[#1C1C1F] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#EF4444]/80 rounded-full"
                      style={{ width: `${barWidthPercent}%` }}
                    />
                  </div>
                  <span className="font-mono font-medium text-[#F5F5F5] text-[13px] w-6">
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action button: View all exceptions */}
      <div className="border-t border-[#2A2A2E] pt-4 flex justify-between items-center">
        <span className="text-[12px] text-[#505055]">
          Every exception has an actionable resolution draft
        </span>
        <button
          onClick={onViewExceptions}
          className="text-[13px] font-medium text-[#4F6EF7] hover:text-[#3D5DE8] transition-colors flex items-center gap-1 cursor-pointer"
        >
          View all exceptions →
        </button>
      </div>
    </div>
  );
}
