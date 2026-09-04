import React, { useState } from 'react';

const EXCEPTION_CONFIG = {
  missing_invoice: {
    title: 'MISSING INVOICE',
    actionLabel: 'Add invoice ref',
    actionSecondary: 'Dismiss',
    icon: '📋',
  },
  duplicate_payment: {
    title: 'DUPLICATE PAYMENT',
    actionLabel: 'Request refund',
    actionSecondary: 'Dismiss',
    icon: '🔄',
  },
  duplicate_ref: {
    title: 'DUPLICATE INVOICE REF',
    actionLabel: 'Verify invoice',
    actionSecondary: 'Dismiss',
    icon: '📄',
  },
  spend_anomaly: {
    title: 'SPEND ANOMALY',
    actionLabel: 'Review & approve',
    actionSecondary: 'Dismiss',
    icon: '⚠️',
  },
};

export default function ExceptionsPage({ transactions = [], onApprove, onDismiss }) {
  const [activeDraftId, setActiveDraftId] = useState(null);

  // Unresolved exceptions
  const unresolvedExceptions = transactions.filter(
    (tx) =>
      ((tx.flags && tx.flags.length > 0) || tx.match_status === 'exception') &&
      tx.action_status !== 'approved' &&
      tx.action_status !== 'dismissed'
  );

  // Group by exception type
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

  const typeKeys = Object.keys(grouped);

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-baseline justify-between border-b border-[#2A2A2E] pb-4">
        <div>
          <h2 className="text-[20px] font-semibold text-[#F5F5F5] tracking-tight">
            Exceptions
          </h2>
          <p className="text-[13px] text-[#8A8A8E] mt-0.5">
            {unresolvedExceptions.length} unresolved {unresolvedExceptions.length === 1 ? 'item' : 'items'} requiring human review
          </p>
        </div>
        {unresolvedExceptions.length === 0 && (
          <span className="text-[13px] text-[#22C55E] font-medium">
            ✓ All exceptions resolved
          </span>
        )}
      </div>

      {unresolvedExceptions.length === 0 ? (
        <div className="w-full bg-[#141416] border border-[#2A2A2E] rounded-xl p-12 text-center">
          <div className="text-3xl mb-3 text-[#22C55E]">✓</div>
          <h3 className="text-[16px] font-semibold text-[#F5F5F5] mb-1">
            Zero Unresolved Exceptions
          </h3>
          <p className="text-[14px] text-[#8A8A8E]">
            All transactions are either matched or have been approved/dismissed.
          </p>
        </div>
      ) : (
        typeKeys.map((typeKey) => {
          const items = grouped[typeKey];
          const config = EXCEPTION_CONFIG[typeKey] || {
            title: typeKey.toUpperCase(),
            actionLabel: 'Take Action',
            actionSecondary: 'Dismiss',
            icon: '⚠️',
          };

          return (
            <div key={typeKey} className="flex flex-col gap-3">
              {/* Group Title */}
              <div className="flex items-center gap-2 text-[12px] font-mono uppercase tracking-wider text-[#8A8A8E] font-semibold">
                <span>{config.icon}</span>
                <span>{config.title}</span>
                <span className="text-[#505055]">·</span>
                <span className="text-[#F5F5F5]">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
              </div>

              {/* Cards list */}
              <div className="flex flex-col gap-2.5">
                {items.map((tx) => {
                  const isDraftOpen = activeDraftId === tx.id;
                  const isIncome = tx.type === 'income';
                  const formattedAmount = `${isIncome ? '+' : '-'}$${Math.abs(tx.amount).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}`;

                  return (
                    <div
                      key={tx.id}
                      className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-5 hover:border-[#3A3A40] transition-all"
                    >
                      {/* Card Top: Title, Amount, Date */}
                      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[15px] font-medium text-[#F5F5F5]">
                            {tx.description}
                          </span>
                          {tx.invoice_ref && (
                            <span className="text-[12px] font-mono text-[#505055]">
                              [{tx.invoice_ref}]
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`font-mono font-bold text-[14px] tabular-nums ${
                              isIncome ? 'text-[#22C55E]' : 'text-[#F5F5F5]'
                            }`}
                          >
                            {formattedAmount}
                          </span>
                          <span className="text-[12px] font-mono text-[#8A8A8E]">
                            {tx.date}
                          </span>
                        </div>
                      </div>

                      {/* Plain-English Reason */}
                      <p className="text-[13px] text-[#8A8A8E] mb-4 leading-relaxed">
                        {tx.exception_reason || tx.anomaly_explanation || 'Discrepancy identified by reconciliation engine.'}
                      </p>

                      {/* Draft expandable box */}
                      {isDraftOpen && tx.action_draft && (
                        <div className="mb-4 p-4 rounded-lg bg-[#0D0D0F] border border-[#2A2A2E] text-[13px] font-mono text-[#F5F5F5] whitespace-pre-wrap leading-relaxed animate-slide-down">
                          {tx.action_draft}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onApprove(tx.id)}
                            className="px-4 py-1.5 rounded-lg text-[13px] font-semibold bg-[#4F6EF7] hover:bg-[#3D5DE8] text-white transition-all cursor-pointer"
                          >
                            {config.actionLabel}
                          </button>
                          <button
                            onClick={() => onDismiss(tx.id)}
                            className="px-3 py-1.5 rounded-lg text-[13px] font-medium bg-transparent hover:bg-white/5 text-[#8A8A8E] hover:text-[#F5F5F5] border border-[#2A2A2E] transition-all cursor-pointer"
                          >
                            {config.actionSecondary}
                          </button>
                        </div>

                        {tx.action_draft && (
                          <button
                            onClick={() => setActiveDraftId(prev => (prev === tx.id ? null : tx.id))}
                            className="text-[12px] text-[#8A8A8E] hover:text-[#F5F5F5] font-medium transition-colors cursor-pointer"
                          >
                            {isDraftOpen ? 'Hide draft ▲' : 'View AI draft ▼'}
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
