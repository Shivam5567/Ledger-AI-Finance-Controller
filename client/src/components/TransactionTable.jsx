import React, { useState } from 'react';

export default function TransactionTable({
  transactions = [],
  onApprove,
  onDismiss,
  onReset,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'flagged' | 'resolved'
  const [search, setSearch] = useState('');

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  // Filter logic
  const filtered = transactions.filter((tx) => {
    const isResolved = tx.action_status === 'approved' || tx.action_status === 'dismissed';
    const isFlagged = (tx.flags && tx.flags.length > 0) || tx.match_status === 'exception';

    if (filter === 'flagged' && (!isFlagged || isResolved)) return false;
    if (filter === 'resolved' && !isResolved) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchDesc = (tx.description || '').toLowerCase().includes(q);
      const matchCat = (tx.category || '').toLowerCase().includes(q);
      const matchDate = (tx.date || '').includes(q);
      return matchDesc || matchCat || matchDate;
    }
    return true;
  });

  const flaggedCount = transactions.filter(t => (t.flags && t.flags.length > 0) && t.action_status !== 'approved' && t.action_status !== 'dismissed').length;
  const resolvedCount = transactions.filter(t => t.action_status === 'approved' || t.action_status === 'dismissed').length;

  const formatAmount = (tx) => {
    const val = Math.abs(tx.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
    if (tx.type === 'income') {
      return { text: `+$${val}`, color: 'text-[#22C55E]' };
    }
    // Expense: primary white as per spec (not red, red is reserved for exceptions)
    return { text: `-$${val}`, color: 'text-[#F5F5F5]' };
  };

  return (
    <div className="w-full bg-[#141416] border border-[#2A2A2E] rounded-xl overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-[#2A2A2E] flex flex-wrap items-center justify-between gap-3">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-[#0D0D0F] p-1 rounded-lg border border-[#2A2A2E]">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-[#1C1C1F] text-[#F5F5F5]'
                : 'text-[#8A8A8E] hover:text-[#F5F5F5]'
            }`}
          >
            All ({transactions.length})
          </button>
          <button
            onClick={() => setFilter('flagged')}
            className={`px-3 py-1 rounded-md text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              filter === 'flagged'
                ? 'bg-[#1C1C1F] text-[#F5F5F5]'
                : 'text-[#8A8A8E] hover:text-[#F5F5F5]'
            }`}
          >
            <span>Flagged</span>
            {flaggedCount > 0 && (
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[#2D1515] text-[#EF4444] border border-[#3D2020] font-mono">
                {flaggedCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-3 py-1 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${
              filter === 'resolved'
                ? 'bg-[#1C1C1F] text-[#F5F5F5]'
                : 'text-[#8A8A8E] hover:text-[#F5F5F5]'
            }`}
          >
            Resolved ({resolvedCount})
          </button>
        </div>

        {/* Search input */}
        <div className="w-64">
          <input
            type="text"
            placeholder="Search transactions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg text-[13px] bg-[#0D0D0F] border border-[#2A2A2E] text-[#F5F5F5] placeholder-[#505055] focus:outline-none focus:border-[#4F6EF7]"
          />
        </div>
      </div>

      {/* Spreadsheet-clean Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#2A2A2E] bg-[#0D0D0F] text-[#8A8A8E] text-[12px] font-medium uppercase tracking-wider">
              <th className="py-3 px-4 w-28">Date</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4 text-right w-36">Amount</th>
              <th className="py-3 px-4 w-32">Category</th>
              <th className="py-3 px-4 w-36 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2A2E] text-[14px]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-[#505055] text-[14px]">
                  No transactions found matching your filter.
                </td>
              </tr>
            ) : (
              filtered.map((tx) => {
                const isResolved = tx.action_status === 'approved' || tx.action_status === 'dismissed';
                const isFlagged = (tx.flags && tx.flags.length > 0) || tx.match_status === 'exception';
                const isExpanded = expandedId === tx.id;
                const { text: amountText, color: amountColor } = formatAmount(tx);

                // Row border styling
                const hasLeftBorder = isFlagged && !isResolved;

                return (
                  <React.Fragment key={tx.id}>
                    <tr
                      onClick={() => (isFlagged || tx.action_draft) && toggleExpand(tx.id)}
                      className={`h-[52px] transition-colors ${
                        (isFlagged || tx.action_draft) ? 'cursor-pointer hover:bg-[#1C1C1F]/60' : 'hover:bg-[#141416]/50'
                      } ${isExpanded ? 'bg-[#1C1C1F]' : ''}`}
                    >
                      {/* Date */}
                      <td
                        className={`py-3 px-4 font-mono text-[13px] text-[#8A8A8E] tabular-nums whitespace-nowrap ${
                          hasLeftBorder ? 'border-l-[3px] border-l-[#EF4444]' : 'border-l-[3px] border-l-transparent'
                        }`}
                      >
                        {tx.date}
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 font-normal text-[#F5F5F5]">
                        <div className="flex items-center gap-2">
                          <span className={isResolved ? 'text-[#8A8A8E]' : 'text-[#F5F5F5]'}>
                            {tx.description}
                          </span>
                          {tx.invoice_ref && (
                            <span className="text-[11px] font-mono text-[#505055]">
                              [{tx.invoice_ref}]
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td
                        className={`py-3 px-4 text-right font-mono font-medium text-[13px] tabular-nums whitespace-nowrap ${
                          isResolved ? 'text-[#505055]' : amountColor
                        }`}
                      >
                        {amountText}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        {tx.category ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider text-[#8A8A8E] bg-[#1C1C1F] border border-[#2A2A2E]">
                            {tx.category}
                          </span>
                        ) : (
                          <span className="text-[12px] text-[#505055] font-mono">—</span>
                        )}
                      </td>

                      {/* Status badge */}
                      <td className="py-3 px-4 text-right">
                        {isResolved ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-[#0F2D1A] text-[#22C55E] border border-[#153D22]">
                            ✓ Resolved
                          </span>
                        ) : isFlagged ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-[#2D1515] text-[#EF4444] border border-[#3D2020]">
                            {tx.exception_type ? tx.exception_type.replace('_', ' ') : 'Flagged'}
                          </span>
                        ) : (
                          <span className="inline-block text-[12px] text-[#505055]">
                            Matched
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Row State */}
                    {isExpanded && (
                      <tr className="bg-[#1C1C1F]">
                        <td colSpan={5} className="p-5 border-t border-[#2A2A2E]">
                          <div className="flex flex-col gap-3 pl-4 border-l-2 border-[#EF4444]">
                            {/* Header / reason */}
                            <div className="flex items-center justify-between">
                              <span className="text-[13px] font-semibold text-[#EF4444] flex items-center gap-1.5">
                                <span>⚠</span>
                                <span>
                                  {tx.exception_reason || tx.anomaly_explanation || 'Discrepancy flagged by agent'}
                                </span>
                              </span>
                              <span className="text-[11px] text-[#8A8A8E] font-mono">
                                Confidence: {tx.confidence || 'High'}
                              </span>
                            </div>

                            {/* Proposed action draft box */}
                            {tx.action_draft && (
                              <div>
                                <div className="text-[11px] uppercase tracking-wider text-[#8A8A8E] font-semibold mb-1.5">
                                  Proposed Action Draft:
                                </div>
                                <div className="p-4 rounded-lg bg-[#141416] border border-[#2A2A2E] text-[13px] font-mono text-[#F5F5F5] whitespace-pre-wrap leading-relaxed select-text">
                                  {tx.action_draft}
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3 pt-2">
                              {!isResolved ? (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onApprove(tx.id);
                                    }}
                                    className="px-4 py-1.5 rounded-lg text-[13px] font-semibold bg-[#4F6EF7] hover:bg-[#3D5DE8] text-white transition-all cursor-pointer"
                                  >
                                    ✓ Approve
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDismiss(tx.id);
                                    }}
                                    className="px-4 py-1.5 rounded-lg text-[13px] font-medium bg-transparent hover:bg-white/5 text-[#8A8A8E] hover:text-[#F5F5F5] border border-[#2A2A2E] transition-all cursor-pointer"
                                  >
                                    × Dismiss
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onReset(tx.id);
                                  }}
                                  className="px-3 py-1 rounded-md text-[12px] text-[#8A8A8E] hover:text-[#F5F5F5] border border-[#2A2A2E] transition-all cursor-pointer"
                                >
                                  Undo (Reopen)
                                </button>
                              )}
                              <button
                                onClick={() => setExpandedId(null)}
                                className="text-[12px] text-[#505055] hover:text-[#8A8A8E] ml-auto cursor-pointer"
                              >
                                Collapse
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
