import React, { useEffect, useState } from 'react';

const STEPS = [
  { stage: 'ingest',       icon: '📂', label: 'Ingesting transactions'   },
  { stage: 'categorizing', icon: '🏷️',  label: 'Categorizing with AI'    },
  { stage: 'reconciling',  icon: '🔍', label: 'Running reconciliation'   },
  { stage: 'anomaly',      icon: '⚠️', label: 'Detecting anomalies'      },
  { stage: 'actions',      icon: '✍️',  label: 'Generating action drafts' },
];

function StepRow({ icon, label, status, detail, delay }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (status !== 'idle') {
      const t = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(t);
    }
  }, [status, delay]);

  if (!visible && status === 'idle') return null;

  return (
    <div
      className="flex items-center gap-3 py-1.5"
      style={{ animation: visible ? 'stepFadeIn 0.4s ease-out forwards' : 'none', opacity: 0 }}
    >
      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
        {status === 'done'    && <span className="text-emerald-400 text-sm font-bold">✓</span>}
        {status === 'running' && <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
        {status === 'idle'    && <span className="text-slate-600 text-xs">○</span>}
      </div>
      <span className="text-sm">
        <span className="mr-1.5">{icon}</span>
        <span className={
          status === 'done'    ? 'text-emerald-300' :
          status === 'running' ? 'text-blue-300' :
                                  'text-slate-500'
        }>
          {label}
          {detail && <span className="text-slate-400 ml-1.5 text-xs">{detail}</span>}
        </span>
      </span>
      {status === 'running' && (
        <span className="text-xs text-blue-400/60 animate-pulse ml-auto">in progress…</span>
      )}
    </div>
  );
}

export default function AgentTrace({ currentStage, isRunning, isComplete, agentResult, onClose }) {
  const getStatus = (stage) => {
    if (isComplete) return 'done';
    if (!currentStage) return 'idle';
    const currentIdx = STEPS.findIndex(s => s.stage === currentStage);
    const thisIdx    = STEPS.findIndex(s => s.stage === stage);
    if (thisIdx < currentIdx)  return 'done';
    if (thisIdx === currentIdx) return 'running';
    return 'idle';
  };

  const completionLine = agentResult
    ? `✓ Done — ${agentResult.issueCount} issue${agentResult.issueCount !== 1 ? 's' : ''} found`
    : null;

  return (
    <div className="glass-card p-5 border border-blue-500/20 bg-black/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-blue-400 text-sm font-mono">🧠</span>
          <span className="text-sm font-semibold text-slate-200">Agent Thinking Trace</span>
          {isRunning && (
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-medium animate-pulse">
              LIVE
            </span>
          )}
          {isComplete && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              COMPLETE
            </span>
          )}
        </div>
        {isComplete && onClose && (
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">✕</button>
        )}
      </div>

      {/* Steps */}
      <div className="font-mono flex flex-col divide-y divide-white/[0.03]">
        {STEPS.map((step, i) => (
          <StepRow
            key={step.stage}
            icon={step.icon}
            label={step.label}
            status={getStatus(step.stage)}
            detail={step.stage === 'ingest' && agentResult ? `(${agentResult.count || ''} records)` : ''}
            delay={i * 80}
          />
        ))}

        {/* Completion line */}
        {isComplete && completionLine && (
          <div
            className="flex items-center gap-3 pt-3 mt-1"
            style={{ animation: 'stepFadeIn 0.5s 0.2s ease-out forwards', opacity: 0 }}
          >
            <span className="text-emerald-400 text-sm font-bold w-5 text-center">✓</span>
            <span className="text-sm font-semibold text-emerald-300">{completionLine}</span>
          </div>
        )}
      </div>
    </div>
  );
}
