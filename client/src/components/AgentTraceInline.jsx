import React, { useState } from 'react';
import { LightningBoltIcon, AlertTriangleIcon, CheckIcon, SettingsGearIcon, SparklesIcon } from './Icons';

export default function AgentTraceInline({
  currentStage,
  isRunning,
  agentResult,
  aiStatus = 'NOT_RUN',
  latestRun = null,
  onRunAgent,
  txCount = 0,
  onViewAnomalies,
  onViewActions,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);

  // Unrun state
  if (aiStatus === 'NOT_RUN' && !isRunning && !agentResult && !latestRun) {
    return (
      <div className="quixotic-card p-4 sm:p-5 animate-fade-in border border-gray-200 bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 font-sans inline-flex items-center gap-1.5">
                <SparklesIcon className="w-3.5 h-3.5 text-gray-400" />
                <span>AI Reconciliation</span>
              </span>
              <p className="text-xs text-gray-600 font-mono mt-0.5">
                AI Reconciliation has not been run for this period.
              </p>
            </div>
          </div>
          {onRunAgent && (
            <button
              onClick={onRunAgent}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#007A4D] hover:bg-[#00603C] text-white text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <LightningBoltIcon className="w-3.5 h-3.5" />
              <span>Run AI Reconciliation</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Failed state
  if (aiStatus === 'FAILED' && !isRunning) {
    return (
      <div className="quixotic-card p-4 sm:p-5 animate-fade-in border border-red-200 bg-red-50/50 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-800 font-sans inline-flex items-center gap-1.5">
                <AlertTriangleIcon className="w-3.5 h-3.5 text-red-600" />
                <span>AI Reconciliation Failed</span>
              </span>
              <p className="text-xs text-red-600 font-mono mt-0.5">
                Reconciliation failed during execution. Please retry.
              </p>
            </div>
          </div>
          {onRunAgent && (
            <button
              onClick={onRunAgent}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <AlertTriangleIcon className="w-3.5 h-3.5" />
              <span>Retry Reconciliation</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const stageOrder = ['ingest', 'categorizing', 'reconciling', 'anomaly', 'actions', 'complete'];
  const currentIndex = currentStage ? stageOrder.indexOf(currentStage) : (agentResult || latestRun ? 5 : -1);

  const effectiveTotal = latestRun?.totalCount ?? agentResult?.totalCount ?? txCount;
  const matchedCount = latestRun?.matchedCount ?? agentResult?.matchedCount ?? (effectiveTotal - (latestRun?.exceptionCount ?? agentResult?.issueCount ?? 0));
  const exceptionCount = latestRun?.exceptionCount ?? agentResult?.issueCount ?? (effectiveTotal - matchedCount);
  const anomalyCount = latestRun?.anomalyCount ?? agentResult?.anomalies ?? 0;
  const completedTime = latestRun?.completedAt ? new Date(latestRun.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

  const steps = [
    {
      id: 'ingest',
      label: `Ingesting ${effectiveTotal} transactions...`,
      doneLabel: `Ingested ${effectiveTotal} transactions`,
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
      doneLabel: `Reconciliation verified (${((matchedCount / (effectiveTotal || 1)) * 100).toFixed(1)}% match rate)`,
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
              <span className="text-xs font-bold uppercase tracking-wider text-gray-900 font-sans inline-flex items-center gap-1.5">
                <SparklesIcon className="w-3.5 h-3.5 text-[#007A4D]" />
                <span>AI Reconciliation</span>
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
                : `Completed${completedTime ? ` at ${completedTime}` : ''} · ${effectiveTotal} transactions · ${matchedCount} matched · ${exceptionCount} require review`}
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
              className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Filter exceptions to spend anomalies"
            >
              <AlertTriangleIcon className="w-3.5 h-3.5 text-amber-700" />
              <span>{anomalyCount} Anomalies</span>
            </button>
          )}

          {!isRunning && exceptionCount > 0 && onViewActions && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewActions();
              }}
              className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-[#007A4D] border border-emerald-200/80 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Review AI action recommendations"
            >
              <LightningBoltIcon className="w-3.5 h-3.5 text-[#007A4D]" />
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
                  <CheckIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
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
              <SettingsGearIcon className="w-3.5 h-3.5 text-gray-500" />
              <span>Technical Pipeline Details</span>
              <span className="text-[10px]">{showTechDetails ? '▲' : '▼'}</span>
            </button>

            {showTechDetails && (
              <div className="mt-2 p-3 bg-white rounded-xl border border-gray-100 flex flex-col gap-1 text-gray-600 font-mono text-[10px] leading-relaxed">
                <div>• LLM Provider: Groq Cloud API (`openai/gpt-oss-20b` & `openai/gpt-oss-120b`)</div>
                <div>• API Calls Executed: {agentResult?.callsUsed ?? latestRun?.calls_used ?? 'Active'} calls</div>
                <div>• Ingestion: SQLite Indexed WAL Engine (`transactions`)</div>
                <div>• Categorization: LLM Inference + Category Normalization</div>
                <div>• Deterministic Reconciler: Exact Invoice Reference & Counterparty Matching</div>
                <div>• Anomaly Engine: Category Median Spend Threshold (≥ 2.8x baseline) + LLM Insights</div>
                <div>• Action Generator: Contextual Email & Verification Proposal LLM Drafts</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
