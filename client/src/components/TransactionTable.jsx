import React, { useState } from 'react';
import { VendorBadge } from './Icons';

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

  return (
    <div className="quixotic-card p-6">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-3 border-b border-gray-100">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-full text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1 rounded-full font-medium transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-gray-900 font-bold shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            All Ledger ({transactions.length})
          </button>
          <button
            onClick={() => setFilter('flagged')}
            className={`px-3.5 py-1 rounded-full font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'flagged'
                ? 'bg-white text-gray-900 font-bold shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <span>Exceptions</span>
            {flaggedCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                {flaggedCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-3.5 py-1 rounded-full font-medium transition-all cursor-pointer ${
              filter === 'resolved'
                ? 'bg-white text-gray-900 font-bold shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Resolved ({resolvedCount})
          </button>
        </div>

        {/* Search */}
        <div className="w-64">
          <input
            type="text"
            placeholder="Search transactions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-1.5 rounded-full text-xs bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#007A4D] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-gray-400 font-medium border-b border-gray-100 pb-2">
              <th className="pb-3 font-medium">Name & Reference</th>
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium">Time</th>
              <th className="pb-3 font-medium">Category</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400">
                  No transactions found matching your criteria.
                </td>
              </tr>
            ) : (
              filtered.map((tx) => {
                const isResolved = tx.action_status === 'approved' || tx.action_status === 'dismissed';
                const isFlagged = (tx.flags && tx.flags.length > 0) || tx.match_status === 'exception';
                const isExpanded = expandedId === tx.id;
                const isIncome = tx.type === 'income';
                const formattedAmt = `${isIncome ? '+' : '-'}₹${Math.abs(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

                return (
                  <React.Fragment key={tx.id}>
                    <tr
                      onClick={() => (isFlagged || tx.action_draft) && toggleExpand(tx.id)}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        (isFlagged || tx.action_draft) ? 'cursor-pointer' : ''
                      } ${isExpanded ? 'bg-emerald-50/30' : ''}`}
                    >
                      {/* Name */}
                      <td className="py-3.5 flex items-center gap-3">
                        <VendorBadge name={tx.description} category={tx.category} />
                        <div>
                          <div className="font-semibold text-gray-900 text-[13px]">{tx.description}</div>
                          {tx.invoice_ref && (
                            <div className="text-[11px] font-mono text-gray-400">
                              Ref: {tx.invoice_ref}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 text-gray-600 font-medium whitespace-nowrap">
                        {tx.date}
                      </td>

                      {/* Time */}
                      <td className="py-3.5 text-gray-400 font-mono text-[11px] whitespace-nowrap">
                        10:30 PM
                      </td>

                      {/* Category */}
                      <td className="py-3.5 whitespace-nowrap">
                        {tx.category ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700">
                            {tx.category}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 whitespace-nowrap">
                        {isResolved ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Resolved
                          </span>
                        ) : isFlagged ? (
                          <span className="inline-flex items-center gap-1.5 text-red-600 font-semibold text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {tx.exception_type ? tx.exception_type.replace('_', ' ') : 'Exception'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[#007A4D] font-semibold text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#007A4D]" />
                            Successful
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className={`py-3.5 text-right font-mono font-bold text-[13px] tabular-nums whitespace-nowrap ${isIncome ? 'text-[#007A4D]' : 'text-gray-900'}`}>
                        {formattedAmt}
                      </td>
                    </tr>

                    {/* Expanded Action Draft */}
                    {isExpanded && (
                      <tr className="bg-gray-50/90">
                        <td colSpan={6} className="p-4 rounded-xl border border-gray-200">
                          <div className="flex flex-col gap-2.5 pl-3 border-l-2 border-[#007A4D]">
                            <div className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                              <span>⚠</span>
                              <span>{tx.exception_reason || tx.anomaly_explanation || 'Flagged for reconciliation review'}</span>
                            </div>

                            {tx.action_draft && (
                              <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                                  Autonomous Action Draft:
                                </span>
                                <div className="p-3 bg-white rounded-lg border border-gray-200 text-xs font-mono text-gray-800 whitespace-pre-wrap leading-relaxed shadow-2xs">
                                  {tx.action_draft}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-2 pt-1">
                              {!isResolved ? (
                                <>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onApprove(tx.id); }}
                                    className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#007A4D] hover:bg-[#006644] text-white transition-all shadow-xs cursor-pointer"
                                  >
                                    ✓ Approve Action
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onDismiss(tx.id); }}
                                    className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition-all cursor-pointer"
                                  >
                                    × Dismiss
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); onReset(tx.id); }}
                                  className="px-3 py-1 rounded-full text-xs text-gray-600 hover:text-gray-900 border border-gray-200 transition-all cursor-pointer"
                                >
                                  Undo (Reopen)
                                </button>
                              )}
                              <button
                                onClick={() => setExpandedId(null)}
                                className="text-xs text-gray-400 hover:text-gray-600 ml-auto cursor-pointer"
                              >
                                Close
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
