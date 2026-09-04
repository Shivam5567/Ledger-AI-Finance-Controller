import React, { useState, useEffect } from 'react';
import { VendorBadge } from './Icons';

const EXCEPTION_CONFIG = {
  missing_invoice: {
    title: 'MISSING INVOICE',
    actionLabel: 'Add invoice ref',
    actionSecondary: 'Dismiss',
    icon: '📋',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  duplicate_payment: {
    title: 'DUPLICATE PAYMENT',
    actionLabel: 'Request refund',
    actionSecondary: 'Dismiss',
    icon: '🔄',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
  },
  duplicate_ref: {
    title: 'DUPLICATE INVOICE REF',
    actionLabel: 'Verify invoice',
    actionSecondary: 'Dismiss',
    icon: '📄',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  spend_anomaly: {
    title: 'SPEND ANOMALY',
    actionLabel: 'Review & approve',
    actionSecondary: 'Dismiss',
    icon: '⚠️',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
  },
};

export default function ExceptionsPage({
  transactions = [],
  onApprove,
  onDismiss,
  initialFilter = 'all',
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
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Exceptions Queue
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {unresolvedExceptions.length} items flagged for human review & authorization
          </p>
        </div>

        {unresolvedExceptions.length === 0 ? (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-[#007A4D] border border-emerald-200">
            ✓ All exceptions resolved
          </span>
        ) : (
          /* Filter Pills */
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 p-1 rounded-full text-xs">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-white text-gray-900 font-semibold shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              All ({unresolvedExceptions.length})
            </button>
            {allTypeKeys.map((k) => (
              <button
                key={k}
                onClick={() => setSelectedFilter(k)}
                className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer capitalize ${
                  selectedFilter === k
                    ? 'bg-white text-gray-900 font-semibold shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {k.replace(/_/g, ' ')} ({grouped[k]?.length || 0})
              </button>
            ))}
          </div>
        )}
      </div>

      {unresolvedExceptions.length === 0 ? (
        <div className="quixotic-card p-12 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-base font-bold text-gray-900 mb-1">
            Reconciliation Complete
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Zero unresolved exceptions. Every transaction has been verified or settled.
          </p>
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
            icon: '⚠️',
            badgeClass: 'bg-gray-100 text-gray-700',
          };

          return (
            <div key={typeKey} className="flex flex-col gap-3">
              {/* Group Title */}
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                <span>{config.icon}</span>
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
                          <div className="text-[10px] text-emerald-400 uppercase tracking-wider mb-2 font-sans font-bold">
                            🤖 AI Action Draft:
                          </div>
                          {tx.action_draft}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onApprove(tx.id)}
                            className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#007A4D] hover:bg-[#006644] text-white transition-all shadow-xs cursor-pointer"
                          >
                            ✓ {config.actionLabel}
                          </button>
                          <button
                            onClick={() => onDismiss(tx.id)}
                            className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 transition-all cursor-pointer"
                          >
                            ✕ {config.actionSecondary}
                          </button>
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
      )}
    </div>
  );
}
