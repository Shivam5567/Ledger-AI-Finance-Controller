import React from 'react';

export default function AgentTraceInline({ currentStage, isRunning, agentResult, txCount = 55 }) {
  if (!currentStage && !agentResult && !isRunning) return null;

  // Stages mapping
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
      doneLabel: 'Categorization complete',
    },
    {
      id: 'reconciling',
      label: 'Running reconciliation...',
      doneLabel: 'Reconciliation complete',
    },
    {
      id: 'anomaly',
      label: 'Detecting anomalies...',
      doneLabel: `${agentResult?.anomalies ?? 2} anomalies detected`,
    },
    {
      id: 'actions',
      label: 'Generating action drafts...',
      doneLabel: `${agentResult?.issueCount ?? 5} action drafts generated`,
    },
    {
      id: 'complete',
      label: 'Finalizing report...',
      doneLabel: `Done — ${agentResult?.issueCount !== undefined ? `${((txCount - agentResult.issueCount) / txCount * 100).toFixed(1)}% match rate` : 'Run complete'}`,
    },
  ];

  return (
    <div className="w-full bg-[#141416] border border-[#2A2A2E] rounded-xl p-5 animate-slide-down font-mono text-[13px] sm:text-[14px]">
      <div className="flex items-center justify-between mb-3 border-b border-[#2A2A2E] pb-2">
        <span className="text-[12px] font-sans font-semibold uppercase tracking-wider text-[#8A8A8E]">
          Agent Thinking Trace
        </span>
        {agentResult?.callsUsed !== undefined && (
          <span className="text-[12px] text-[#505055]">
            {agentResult.callsUsed} Groq API {agentResult.callsUsed === 1 ? 'call' : 'calls'}
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
              <div key={step.id} className="flex items-center gap-2.5 text-[#505055]">
                <span className="text-[14px]">○</span>
                <span>{step.label}</span>
              </div>
            );
          }

          if (isActive) {
            return (
              <div key={step.id} className="flex items-center gap-2.5 text-[#4F6EF7] font-medium">
                <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4F6EF7] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4F6EF7]"></span>
                </span>
                <span>{step.label}</span>
              </div>
            );
          }

          return (
            <div
              key={step.id}
              className={`flex items-center gap-2.5 text-[#22C55E] ${
                step.id === 'complete' ? 'font-bold text-[#F5F5F5]' : ''
              }`}
            >
              <span className="text-[#22C55E] text-[14px]">✓</span>
              <span>{isDone ? step.doneLabel : step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
