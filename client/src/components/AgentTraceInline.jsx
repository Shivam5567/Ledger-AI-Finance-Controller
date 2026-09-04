import React from 'react';

export default function AgentTraceInline({ currentStage, isRunning, agentResult, txCount = 55 }) {
  if (!currentStage && !agentResult && !isRunning) return null;

  const stageOrder = ['ingest', 'categorizing', 'reconciling', 'anomaly', 'actions', 'complete'];
  const currentIndex = currentStage ? stageOrder.indexOf(currentStage) : (agentResult ? 5 : -1);

  const steps = [
    {
      id: 'ingest',
      label: `Ingesting ${txCount} transactions...`,
      doneLabel: `Ingested ${txCount} transactions`,
    },
    {
      id: 'categorizing',
      label: 'Categorizing with AI (1 API call)...',
      doneLabel: 'AI Categorization complete (Groq gpt-oss-20b)',
    },
    {
      id: 'reconciling',
      label: 'Running reconciliation...',
      doneLabel: 'Reconciliation complete (0 API calls — pure logic)',
    },
    {
      id: 'anomaly',
      label: 'Detecting anomalies...',
      doneLabel: `${agentResult?.anomalies ?? 2} statistical anomalies detected`,
    },
    {
      id: 'actions',
      label: 'Generating action drafts...',
      doneLabel: `${agentResult?.issueCount ?? 9} action drafts generated (Groq gpt-oss-120b)`,
    },
    {
      id: 'complete',
      label: 'Finalizing report...',
      doneLabel: `Done — ${agentResult?.issueCount !== undefined ? `${((txCount - agentResult.issueCount) / txCount * 100).toFixed(1)}% match rate` : 'Run complete'}`,
    },
  ];

  return (
    <div className="quixotic-card p-5 animate-slide-down font-mono text-xs sm:text-sm">
      <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2.5 font-sans">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#007A4D] animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Autonomous Pipeline Thinking Trace
          </span>
        </div>
        {agentResult?.callsUsed !== undefined && (
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#007A4D] border border-emerald-200">
            {agentResult.callsUsed} Groq API calls used
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
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
                <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#007A4D] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#007A4D]"></span>
                </span>
                <span>{step.label}</span>
              </div>
            );
          }

          return (
            <div
              key={step.id}
              className={`flex items-center gap-2.5 ${
                step.id === 'complete' ? 'font-bold text-[#007A4D]' : 'text-emerald-700'
              }`}
            >
              <span className="text-emerald-600 font-bold">✓</span>
              <span>{isDone ? step.doneLabel : step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
