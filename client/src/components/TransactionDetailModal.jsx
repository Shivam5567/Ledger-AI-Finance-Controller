import React, { useEffect } from 'react';
import { VendorBadge } from './Icons';

export default function TransactionDetailModal({
  transaction,
  isOpen,
  onClose,
  onApprove,
  onDismiss,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !transaction) return null;

  const isIncome = transaction.type === 'income';
  const isException = (transaction.flags && transaction.flags.length > 0) || transaction.match_status === 'exception';
  const isResolved = transaction.action_status === 'approved' || transaction.action_status === 'dismissed';
  const amtNumber = Math.abs(transaction.amount || 0);
  const formattedAmt = `${isIncome ? '+' : '-'}₹${amtNumber.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl border border-gray-200/80 shadow-2xl max-w-xl w-full p-6 sm:p-7 z-10 animate-scale-up overflow-hidden">
        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <VendorBadge name={transaction.description} category={transaction.category} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                  {transaction.description}
                </h2>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                  #{transaction.id}
                </span>
              </div>
              <p className="text-xs text-gray-400 capitalize mt-0.5">
                {transaction.category || (isIncome ? 'Client Income' : 'Operating Expense')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors cursor-pointer text-xs"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Primary Amount Display */}
        <div className="my-5 p-4 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase block font-mono">
              Transaction Amount
            </span>
            <div className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums ${isIncome ? 'text-[#007A4D]' : 'text-gray-900'}`}>
              {formattedAmt}
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase block font-mono">
              Match Status
            </span>
            {isResolved ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {transaction.action_status === 'approved' ? 'Resolved (Approved)' : 'Resolved (Dismissed)'}
              </span>
            ) : isException ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200/70 mt-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Exception Flagged
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#007A4D] border border-emerald-200/70 mt-1">
                <span className="w-2 h-2 rounded-full bg-[#007A4D]" />
                Auto-Matched
              </span>
            )}
          </div>
        </div>

        {/* Key Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5 text-xs">
          <div className="p-3 rounded-xl bg-white border border-gray-100">
            <span className="text-gray-400 block text-[10px] uppercase font-mono mb-0.5">Date</span>
            <span className="font-semibold text-gray-800 font-mono">{transaction.date}</span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-gray-100">
            <span className="text-gray-400 block text-[10px] uppercase font-mono mb-0.5">Invoice Ref</span>
            {transaction.invoice_ref ? (
              <span className="font-semibold text-gray-800 font-mono">{transaction.invoice_ref}</span>
            ) : (
              <span className="text-amber-600 font-medium italic">Missing Ref</span>
            )}
          </div>

          <div className="p-3 rounded-xl bg-white border border-gray-100">
            <span className="text-gray-400 block text-[10px] uppercase font-mono mb-0.5">Confidence</span>
            <span className="font-semibold text-gray-800 capitalize">
              {transaction.confidence || 'High (98.4%)'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-gray-100">
            <span className="text-gray-400 block text-[10px] uppercase font-mono mb-0.5">Flow Type</span>
            <span className="font-semibold text-gray-800 capitalize">{transaction.type}</span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-gray-100 col-span-2">
            <span className="text-gray-400 block text-[10px] uppercase font-mono mb-0.5">Flags</span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {transaction.flags && transaction.flags.length > 0 ? (
                transaction.flags.map((f, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-red-50 text-red-600 font-mono text-[10px] font-semibold border border-red-100"
                  >
                    {f}
                  </span>
                ))
              ) : (
                <span className="text-gray-400 italic">None</span>
              )}
            </div>
          </div>
        </div>

        {/* Exception Reason Box */}
        {(transaction.exception_reason || transaction.anomaly_explanation) && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-50/80 border border-red-200/80 text-xs">
            <div className="font-semibold text-red-700 flex items-center gap-1.5 mb-1">
              <span>⚠</span>
              <span>Reconciliation Exception Reason</span>
            </div>
            <p className="text-red-800 leading-relaxed font-medium">
              {transaction.exception_reason || transaction.anomaly_explanation}
            </p>
          </div>
        )}

        {/* AI Action Draft */}
        {transaction.action_draft && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                <span>⚡</span>
                <span>AI Action Proposal ({transaction.action_type || 'Draft'})</span>
              </span>
              <span className="text-[10px] text-gray-400 font-mono">Autonomous Draft</span>
            </div>
            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 text-xs font-mono text-gray-800 whitespace-pre-wrap max-h-44 overflow-y-auto leading-relaxed select-text">
              {transaction.action_draft}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Close
          </button>

          {!isResolved && isException && (
            <>
              <button
                onClick={async () => {
                  if (onDismiss) await onDismiss(transaction.id);
                  onClose();
                }}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Dismiss Flag
              </button>
              <button
                onClick={async () => {
                  if (onApprove) await onApprove(transaction.id);
                  onClose();
                }}
                className="px-5 py-2 rounded-full text-xs font-semibold bg-[#007A4D] hover:bg-[#00603C] text-white shadow-xs hover:shadow transition-all cursor-pointer"
              >
                ✓ Approve & Execute
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
