import React from 'react';

const actionLabels = {
  reminder_email: "📧 Payment Reminder",
  refund_request: "💸 Refund Request",
  anomaly_explanation: "🔍 Anomaly Review",
};

export default function ActionPanel({ transaction, onApprove, onDismiss }) {
  const isResolved = transaction.action_status === 'approved';
  const isDismissed = transaction.action_status === 'dismissed';
  const isActionable = !isResolved && !isDismissed;
  
  const actionLabel = actionLabels[transaction.action_type] || transaction.action_type || "AI Recommended Action";

  return (
    <div className="p-6 border-b border-white/5 flex gap-6 text-sm">
      <div className="flex-1 flex flex-col gap-4">
        <div>
          <h4 className="text-slate-400 font-medium mb-1">AI Analysis</h4>
          <p className="text-slate-200">{transaction.anomaly_explanation || 'Flagged by system rules.'}</p>
        </div>
        
        {transaction.action_draft && (
          <div>
            <h4 className="text-slate-400 font-medium mb-2 flex items-center gap-2">
              <span className="text-blue-400">{actionLabel}</span> Draft
            </h4>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 font-mono text-slate-300 whitespace-pre-wrap shadow-inner relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              {transaction.action_draft}
            </div>
          </div>
        )}
      </div>

      <div className="w-48 flex flex-col gap-3 justify-center border-l border-white/5 pl-6">
        {isActionable ? (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); onApprove(); }}
              className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/50 py-2 rounded-lg font-medium transition-colors"
            >
              ✅ Approve
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDismiss(); }}
              className="w-full bg-slate-500/20 hover:bg-slate-500/30 text-slate-400 border border-slate-500/50 py-2 rounded-lg font-medium transition-colors"
            >
              ❌ Dismiss
            </button>
          </>
        ) : (
          <div className="text-center p-3 rounded-lg bg-white/5 border border-white/10">
            {isResolved && <span className="text-emerald-400 font-medium flex flex-col items-center gap-1"><span className="text-xl">✅</span> Resolved</span>}
            {isDismissed && <span className="text-slate-400 font-medium flex flex-col items-center gap-1"><span className="text-xl">🚫</span> Dismissed</span>}
          </div>
        )}
      </div>
    </div>
  );
}
