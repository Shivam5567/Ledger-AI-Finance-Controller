import React, { useState, useEffect } from 'react';
import { VendorBadge, LightningBoltIcon, CheckIcon, ChatBubbleIcon, AlertTriangleIcon, SparklesIcon } from './Icons';

const EXCEPTION_CONFIG = {
  missing_invoice: {
    title: 'MISSING INVOICE',
    actionLabel: 'Add invoice ref',
    actionSecondary: 'Dismiss',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  duplicate_payment: {
    title: 'DUPLICATE PAYMENT',
    actionLabel: 'Request refund',
    actionSecondary: 'Dismiss',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
  },
  duplicate_ref: {
    title: 'DUPLICATE INVOICE REF',
    actionLabel: 'Verify invoice',
    actionSecondary: 'Dismiss',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  spend_anomaly: {
    title: 'SPEND ANOMALY',
    actionLabel: 'Review & approve',
    actionSecondary: 'Dismiss',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
  },
};

export default function ExceptionsPage({
  transactions = [],
  onApprove,
  onDismiss,
  onReset,
  onAnalyzeWithCopilot,
  initialFilter = 'all',
  onRunAgent,
  isRunning = false,
  aiStatus = 'NOT_RUN',
}) {
  const [activeDraftId, setActiveDraftId] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState(initialFilter);

  useEffect(() => {
    if (initialFilter) setSelectedFilter(initialFilter);
  }, [initialFilter]);

  const unresolvedExceptions = transactions.filter(
    (tx) =>
      ((tx.flags && tx.flags.length > 0) || tx.match_status === 'exception') &&
      tx.action_status !== 'approved' &&
      tx.action_status !== 'dismissed'
  );

  const resolvedExceptions = transactions.filter(
    (tx) => tx.action_status === 'approved' || tx.action_status === 'dismissed'
  );

  const grouped = unresolvedExceptions.reduce((acc, tx) => {
    let type = tx.exception_type;
    if (!type && tx.flags && tx.flags.length > 0) {
      if (tx.flags.includes('unmatched_invoice')) type = 'missing_invoice';
      else if (tx.flags.includes('duplicate')) type = 'duplicate_payment';
      else if (tx.flags.includes('duplicate_invoice')) type = 'duplicate_ref';
      else if (tx.flags.includes('anomaly')) type = 'spend_anomaly';
    }
    type = type || 'spend_anomaly';

    if (!acc[type]) acc[type] = [];
    acc[type].push(tx);
    return acc;
  }, {});

  const allTypeKeys = Object.keys(grouped);
  const filteredTypeKeys = selectedFilter === 'all'
    ? allTypeKeys
    : allTypeKeys.filter(k => k === selectedFilter);

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <span>Exceptions Queue</span>
            {unresolvedExceptions.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-mono font-bold">
                {unresolvedExceptions.length} open
              </span>
            )}
            {resolvedExceptions.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#007A4D] text-xs font-mono font-bold">
                {resolvedExceptions.length} resolved
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {unresolvedExceptions.length} items requiring review · {resolvedExceptions.length} authorized/resolved
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onRunAgent && (
            <button
              onClick={onRunAgent}
              disabled={isRunning}
              className="flex items-center gap-2 bg-[#007A4D] hover:bg-[#00603C] text-white rounded-full px-4 py-2 text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
              title="Run AI Reconciliation across all transactions"
            >
              {isRunning ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Running Reconciliation…</span>
                </>
              ) : (
                <>
                  <LightningBoltIcon className="w-3.5 h-3.5 text-white" />
                  <span>Run AI Reconciliation</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 p-1.5 rounded-full text-xs self-start">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-3.5 py-1 rounded-full font-medium transition-all cursor-pointer ${
            selectedFilter === 'all'
              ? 'bg-white text-gray-900 font-semibold shadow-2xs'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          All Open ({unresolvedExceptions.length})
        </button>
        {allTypeKeys.map((k) => (
          <button
            key={k}
            onClick={() => setSelectedFilter(k)}
            className={`px-3.5 py-1 rounded-full font-medium transition-all cursor-pointer capitalize ${
              selectedFilter === k
                ? 'bg-white text-gray-900 font-semibold shadow-2xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {k.replace(/_/g, ' ')} ({grouped[k]?.length || 0})
          </button>
        ))}
        <button
          onClick={() => setSelectedFilter('resolved')}
          className={`px-3.5 py-1 rounded-full font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 ${
            selectedFilter === 'resolved'
              ? 'bg-[#007A4D] text-white font-semibold shadow-2xs'
              : 'text-emerald-700 hover:text-emerald-900'
          }`}
        >
          <CheckIcon className="w-3 h-3" />
          <span>Resolved ({resolvedExceptions.length})</span>
        </button>
      </div>

      {/* ── VIEW: Resolved Exceptions Tab ── */}
      {selectedFilter === 'resolved' ? (
        resolvedExceptions.length === 0 ? (
          <div className="quixotic-card p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-50 flex items-center justify-center text-[#007A4D]">
              <CheckIcon className="w-6 h-6 text-[#007A4D]" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              No Resolved Exceptions Yet
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Exceptions you approve or dismiss will be catalogued here with their resolution records.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
              <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>RESOLVED & AUTHORIZED EXCEPTIONS</span>
              <span className="text-gray-300">·</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#007A4D] font-mono text-[11px]">
                {resolvedExceptions.length} {resolvedExceptions.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {resolvedExceptions.map((tx) => {
                const isIncome = tx.type === 'income';
                const formattedAmt = `${isIncome ? '+' : '-'}₹${Math.abs(tx.amount).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                })}`;
                const isApproved = tx.action_status === 'approved';

                return (
                  <div
                    key={tx.id}
                    className="quixotic-card p-5 border-emerald-200 bg-emerald-50/20 transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <VendorBadge name={tx.description} category={tx.category} />
                        <div>
                          <span className="text-sm font-bold text-gray-900 block">
                            {tx.description}
                          </span>
                          <span className="text-[11px] text-gray-400 font-mono">
                            {tx.date} {tx.invoice_ref && `· Ref: ${tx.invoice_ref}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`font-mono font-bold text-sm tabular-nums ${
                            isIncome ? 'text-[#007A4D]' : 'text-gray-900'
                          }`}
                        >
                          {formattedAmt}
                        </span>
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          isApproved
                            ? 'bg-emerald-100 text-[#007A4D] border-emerald-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                          <span className="inline-flex items-center gap-1">
                            {isApproved && <CheckIcon className="w-3 h-3 text-[#007A4D]" />}
                            <span>{isApproved ? 'APPROVED' : 'DISMISSED'}</span>
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-700 mb-3 bg-white/90 p-3 rounded-xl border border-emerald-100 flex items-center justify-between">
                      <span className="font-medium">
                        {tx.exception_reason || tx.anomaly_explanation || 'Human authorization applied.'}
                      </span>
                      {tx.resolved_at && (
                        <span className="text-[10px] text-gray-400 font-mono">
                          Resolved {new Date(tx.resolved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {onReset && (
                        <button
                          onClick={() => onReset(tx.id)}
                          className="px-3.5 py-1.5 rounded-full text-xs font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer"
                        >
                          ↩ Undo (Reopen to Queue)
                        </button>
                      )}
                      {onAnalyzeWithCopilot && (
                        <button
                          onClick={() => onAnalyzeWithCopilot(tx)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium bg-white hover:bg-gray-50 text-[#007A4D] border border-emerald-200 transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
                        >
                          <ChatBubbleIcon className="w-3.5 h-3.5 text-[#007A4D]" />
                          <span>Analyze with Copilot</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : (
        /* ── VIEW: Open Exceptions ── */
        unresolvedExceptions.length === 0 ? (
          <div className="quixotic-card p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center text-[#007A4D]">
              <CheckIcon className="w-6 h-6 text-[#007A4D]" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              All Exceptions Resolved
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
              Zero unresolved exceptions. Every transaction has been authorized or matched.
            </p>
            {resolvedExceptions.length > 0 && (
              <button
                onClick={() => setSelectedFilter('resolved')}
                className="px-4 py-2 rounded-full bg-emerald-50 text-[#007A4D] border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                View {resolvedExceptions.length} Resolved Items →
              </button>
            )}
          </div>
        ) : filteredTypeKeys.length === 0 ? (
          <div className="quixotic-card p-8 text-center text-gray-500 text-xs">
            No exceptions match the selected filter.
          </div>
        ) : (
          filteredTypeKeys.map((typeKey) => {
            const items = grouped[typeKey];
            const config = EXCEPTION_CONFIG[typeKey] || {
              title: typeKey.toUpperCase(),
              actionLabel: 'Take Action',
              actionSecondary: 'Dismiss',
              badgeClass: 'bg-gray-100 text-gray-700',
            };

            return (
              <div key={typeKey} className="flex flex-col gap-3">
                {/* Group Title */}
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                  <AlertTriangleIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{config.title}</span>
                  <span className="text-gray-300">·</span>
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-mono text-[11px]">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {/* Cards List */}
                <div className="flex flex-col gap-3">
                  {items.map((tx) => {
                    const isDraftOpen = activeDraftId === tx.id;
                    const isIncome = tx.type === 'income';
                    const formattedAmt = `${isIncome ? '+' : '-'}₹${Math.abs(tx.amount).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}`;

                    return (
                      <div
                        key={tx.id}
                        className="quixotic-card p-5 hover:border-emerald-300 transition-all"
                      >
                        {/* Card Top */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-3">
                            <VendorBadge name={tx.description} category={tx.category} />
                            <div>
                              <span className="text-sm font-bold text-gray-900 block">
                                {tx.description}
                              </span>
                              <span className="text-[11px] text-gray-400 font-mono">
                                {tx.date} {tx.invoice_ref && `· Ref: ${tx.invoice_ref}`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`font-mono font-bold text-sm tabular-nums ${
                                isIncome ? 'text-[#007A4D]' : 'text-gray-900'
                              }`}
                            >
                              {formattedAmt}
                            </span>
                            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${config.badgeClass}`}>
                              {config.title}
                            </span>
                          </div>
                        </div>

                        {/* Plain-English Reason */}
                        <p className="text-xs text-gray-700 mb-3.5 bg-gray-50/90 p-3 rounded-xl border border-gray-100 leading-relaxed font-medium">
                          {tx.exception_reason || tx.anomaly_explanation || 'Flagged for human confirmation.'}
                        </p>

                        {/* AI Draft preview */}
                        {isDraftOpen && tx.action_draft && (
                          <div className="mb-4 p-4 rounded-xl bg-gray-900 text-white font-mono text-xs whitespace-pre-wrap leading-relaxed animate-fade-in shadow-inner select-text">
                            <div className="text-[10px] text-emerald-400 uppercase tracking-wider mb-2 font-sans font-bold inline-flex items-center gap-1.5">
                              <SparklesIcon className="w-3 h-3 text-emerald-400" />
                              <span>AI Action Draft:</span>
                            </div>
                            {tx.action_draft}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onApprove(tx.id)}
                              className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#007A4D] hover:bg-[#006644] text-white transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <CheckIcon className="w-3 h-3" />
                              <span>{config.actionLabel}</span>
                            </button>
                            <button
                              onClick={() => onDismiss(tx.id)}
                              className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 transition-all cursor-pointer"
                            >
                              ✕ {config.actionSecondary}
                            </button>
                            {onAnalyzeWithCopilot && (
                              <button
                                onClick={() => onAnalyzeWithCopilot(tx)}
                                className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-[#007A4D] border border-emerald-200 transition-all cursor-pointer flex items-center gap-1.5"
                                title="Ask Ledger Copilot to analyze this exception"
                              >
                                <ChatBubbleIcon className="w-3.5 h-3.5 text-[#007A4D]" />
                                <span>Analyze</span>
                              </button>
                            )}
                          </div>

                          {tx.action_draft && (
                            <button
                              onClick={() => setActiveDraftId(prev => (prev === tx.id ? null : tx.id))}
                              className="text-xs text-[#007A4D] hover:underline font-semibold cursor-pointer"
                            >
                              {isDraftOpen ? 'Hide AI draft ▲' : 'Inspect AI draft ▼'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )
      )}
    </div>
  );
}
