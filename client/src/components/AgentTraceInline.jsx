import React, { useState } from 'react';

export default function AgentTraceInline({
  currentStage,
  isRunning,
  agentResult,
  txCount = 55,
  onViewAnomalies,
  onViewActions,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);

  if (!currentStage && !agentResult && !isRunning) return null;

  const stageOrder = ['ingest', 'categorizing', 'reconciling', 'anomaly', 'actions', 'complete'];
  const currentIndex = currentStage ? stageOrder.indexOf(currentStage) : (agentResult ? 5 : -1);

  const matchedCount = agentResult?.matchedCount ?? (txCount - (agentResult?.issueCount ?? 9));
  const exceptionCount = agentResult?.issueCount ?? 9;
  const anomalyCount = agentResult?.anomalies ?? 2;

  const steps = [
    {
      id: 'ingest',
      label: `Ingesting ${txCount} transactions...`,
      doneLabel: `Ingested ${txCount} transactions`,
    },
    {
      id: 'categorizing',
      label: 'Categorizing transactions with AI...',
      doneLabel: 'Categorization complete across operational categories',
    },
    {
      id: 'reconciling',
      label: 'Running deterministic ledger reconciliation...',
      doneLabel: `Reconciliation complete (${matchedCount} matched, ${exceptionCount} exceptions)`,
    },
    {
      id: 'anomaly',
      label: 'Detecting statistical anomalies and spend spikes...',
      doneLabel: `${anomalyCount} statistical anomalies detected`,
      actionable: true,
      actionType: 'anomaly',
      actionLabel: 'Inspect Anomalies →',
      onAction: onViewAnomalies,
    },
    {
      id: 'actions',
      label: 'Generating action recommendations...',
      doneLabel: `${exceptionCount} action drafts generated`,
      actionable: true,
      actionType: 'actions',
      actionLabel: 'Review Action Drafts →',
      onAction: onViewActions,
    },
    {
      id: 'complete',
      label: 'Finalizing reconciliation report...',
      doneLabel: `Reconciliation verified (${((matchedCount / txCount) * 100).toFixed(1)}% match rate)`,
    },
  ];

  return (
    <div className="quixotic-card p-4 sm:p-5 animate-fade-in border border-emerald-200/80 bg-gradient-to-r from-emerald-50/40 via-white to-teal-50/30 shadow-xs">
      {/* ── Collapsed Header / Summary Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {isRunning ? (
            <span className="relative flex h-3 w-3 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#007A4D] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#007A4D]" />
            </span>
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-[#007A4D]" />
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-900 font-sans">
                ✦ AI Reconciliation
              </span>
              {isRunning && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-[#007A4D] font-semibold animate-pulse">
                  Step {Math.max(1, currentIndex + 1)} of 5
                </span>
              )}
            </div>

            <p className="text-xs text-gray-600 font-mono mt-0.5">
              {isRunning
                ? (steps[currentIndex]?.label || 'Processing pipeline...')
                : `Completed · ${txCount} transactions · ${matchedCount} matched · ${exceptionCount} require review`}
            </p>
          </div>
        </div>

        {/* Actionable Chips & Expand Toggle */}
        <div className="flex items-center gap-2">
          {!isRunning && anomalyCount > 0 && onViewAnomalies && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewAnomalies();
              }}
              className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
              title="Filter exceptions to spend anomalies"
            >
              <span>⚠️</span>
              <span>{anomalyCount} Anomalies</span>
            </button>
          )}

          {!isRunning && exceptionCount > 0 && onViewActions && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewActions();
              }}
              className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-[#007A4D] border border-emerald-200/80 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
              title="Review AI action recommendations"
            >
              <span>⚡</span>
              <span>{exceptionCount} Action Drafts</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(prev => !prev)}
            className="px-3 py-1 rounded-full text-xs font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <span>{isExpanded ? 'Collapse' : 'Inspect Steps'}</span>
            <span className="text-[10px]">{isExpanded ? '▲' : '▼'}</span>
          </button>
        </div>
      </div>

      {/* ── Expanded Steps View ── */}
      {isExpanded && (
        <div className="mt-4 pt-3.5 border-t border-emerald-100 flex flex-col gap-2.5 font-mono text-xs animate-slide-down">
          {steps.map((step, idx) => {
            const isDone = currentIndex > idx || agentResult !== null;
            const isActive = currentIndex === idx && isRunning;
            const isPending = currentIndex < idx && !agentResult;

            if (isPending) {
              return (
                <div key={step.id} className="flex items-center gap-2.5 text-gray-400">
                  <span className="text-sm">○</span>
                  <span>{step.label}</span>
                </div>
              );
            }

            if (isActive) {
              return (
                <div key={step.id} className="flex items-center gap-2.5 text-[#007A4D] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#007A4D] animate-ping" />
                  <span>{step.label}</span>
                </div>
              );
            }

            return (
              <div
                key={step.id}
                className="flex items-center justify-between py-0.5 text-emerald-800"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>{isDone ? step.doneLabel : step.label}</span>
                </div>

                {isDone && step.actionable && step.onAction && (
                  <button
                    onClick={step.onAction}
                    className="text-[11px] font-sans font-semibold text-[#007A4D] hover:text-[#005a39] underline decoration-emerald-300 underline-offset-2 cursor-pointer ml-2"
                  >
                    {step.actionLabel}
                  </button>
                )}
              </div>
            );
          })}

          {/* Optional Technical Details Accordion */}
          <div className="pt-2 mt-1 border-t border-gray-100 text-[11px] text-gray-500 font-sans">
            <button
              onClick={() => setShowTechDetails(prev => !prev)}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 cursor-pointer transition-colors"
            >
              <span>⚙ Technical Pipeline Details</span>
              <span className="text-[10px]">{showTechDetails ? '▲' : '▼'}</span>
            </button>

            {showTechDetails && (
              <div className="mt-2 p-3 bg-white rounded-xl border border-gray-100 flex flex-col gap-1 text-gray-600 font-mono text-[10px] leading-relaxed">
                <div>• Ingestion: SQLite Indexed WAL Engine (`transactions`)</div>
                <div>• Categorization: LLM Inference + Category Normalization</div>
                <div>• Deterministic Reconciler: Exact Invoice Reference & Counterparty Matching</div>
                <div>• Anomaly Engine: Category Median Spend Threshold (≥ 2.8x baseline)</div>
                <div>• Action Generator: Contextual Email & Verification Proposal Templates</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
