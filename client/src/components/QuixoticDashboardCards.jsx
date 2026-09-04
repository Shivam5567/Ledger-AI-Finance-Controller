import React, { useState } from 'react';
import { ArrowUpRightIcon, VendorBadge } from './Icons';

// ── CARD 1: Ledger Position & Controller Card Widget (Light Theme) ─────
export function QuixoticCardWidget({ summary, transactions = [] }) {
  const net = summary?.net !== undefined ? summary.net : -62570;
  const isPositive = net >= 0;
  const formattedNet = `${isPositive ? '+' : '-'}₹${Math.abs(net).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const periodInflow = summary?.totalIncome
    ? summary.totalIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })
    : '71,000';

  return (
    <div className="quixotic-card p-6 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Ledger Position</h3>
          <p className="text-xs text-gray-400">Total net balance this period</p>
        </div>
        <ArrowUpRightIcon />
      </div>

      {/* Light Theme Controller Card Widget */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/60 border border-emerald-200/80 p-5 shadow-xs relative overflow-hidden mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold tracking-wider text-xs uppercase text-[#007A4D] font-mono">
            LEDGER AI
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#007A4D] text-white">
            Active Controller
          </span>
        </div>

        <div className="my-3">
          <div className={`text-2xl font-bold tracking-tight font-mono tabular-nums ${isPositive ? 'text-[#007A4D]' : 'text-gray-900'}`}>
            {formattedNet}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 font-mono pt-1 border-t border-emerald-100/60">
          <span className="tracking-wider">{transactions.length || 55} Transactions</span>
          <span>SQLite Engine</span>
        </div>
      </div>

      {/* Period Inflow & Growth Badge */}
      <div className="pt-1">
        <span className="text-xs text-gray-400 block mb-1">Period Inflow</span>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900 font-mono tabular-nums">
            +₹{periodInflow}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#007A4D] border border-emerald-200/60">
            +12.8%
          </span>
        </div>
      </div>
    </div>
  );
}

// ── CARD 2: Reconciliation Rate (Historical Weekly Data) ───────────────
export function QuixoticBarChartCard({ report }) {
  const [range, setRange] = useState('weekly');
  const matchedRate = report?.summary?.matchRate || '83.6%';

  // Seeded historical weekly trend data leading up to current batch (WK 4)
  const bars = [
    { label: 'WK 1', height: '42%', value: '1.2k', rate: '82.0%' },
    { label: 'WK 2', height: '65%', value: '2.4k', rate: '79.5%' },
    { label: 'WK 3', height: '54%', value: '1.8k', rate: '81.2%' },
    { label: 'WK 4', height: '94%', value: '4.2k', rate: matchedRate, active: true }, // Current reconciled batch
    { label: 'WK 5', height: '60%', value: '2.1k', rate: '80.5%' },
    { label: 'AUG',  height: '68%', value: '2.8k', rate: '83.0%' },
  ];

  return (
    <div className="quixotic-card p-6 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold">
            📊
          </div>
          <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Reconciliation Rate</h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle pills */}
          <div className="flex items-center bg-gray-100 rounded-full p-0.5 text-[11px] font-medium text-gray-500">
            <button
              onClick={() => setRange('weekly')}
              className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                range === 'weekly' ? 'bg-[#007A4D] text-white font-semibold' : 'hover:text-gray-900'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setRange('monthly')}
              className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                range === 'monthly' ? 'bg-[#007A4D] text-white font-semibold' : 'hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
          </div>
          <ArrowUpRightIcon />
        </div>
      </div>

      {/* Hatched Bar Chart Graphic */}
      <div className="relative pt-6 pb-2">
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] font-mono text-gray-400 opacity-60">
          <div className="border-b border-gray-100 pb-0.5">5k</div>
          <div className="border-b border-gray-100 pb-0.5">4k</div>
          <div className="border-b border-gray-100 pb-0.5">3k</div>
          <div className="border-b border-gray-100 pb-0.5">2k</div>
          <div className="border-b border-gray-100 pb-0.5">1k</div>
          <div className="pb-0.5">0</div>
        </div>

        <div className="h-44 flex items-end justify-between pl-8 pr-2 relative z-10">
          {bars.map((b) => (
            <div key={b.label} className="flex flex-col items-center gap-2 w-8 group">
              {b.active && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#007A4D] text-white shadow-xs animate-bounce -mb-1 whitespace-nowrap">
                  +{matchedRate}
                </span>
              )}

              <div className="w-7 rounded-t-2xl overflow-hidden relative flex items-end" style={{ height: b.height }}>
                {b.active ? (
                  <div className="w-full h-full bg-[#007A4D] rounded-t-2xl relative">
                    <div className="w-2 h-2 rounded-full bg-white/80 mx-auto mt-1" />
                  </div>
                ) : (
                  <div className="w-full h-full striped-bar-pattern rounded-t-2xl opacity-90 group-hover:opacity-100 transition-opacity" />
                )}
              </div>

              <span className={`text-[10px] font-bold font-mono tracking-wider ${b.active ? 'text-gray-900' : 'text-gray-400'}`}>
                {b.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Accuracy & Throughput Metrics Footer */}
      <div className="pt-3 mt-1 border-t border-gray-100 flex items-center justify-between text-[11px] font-mono">
        <span className="text-[#007A4D] font-bold">✓ {report?.summary?.matched || 46} Matched</span>
        <span className="text-red-600 font-bold">⚠ {report?.summary?.exceptions || 9} Exceptions</span>
        <span className="text-gray-400">{report?.summary?.durationSeconds || '8.2'}s run</span>
      </div>
    </div>
  );
}

// ── CARD 3: Settlement Funds & Wave Area Chart ──────────────────────────
export function QuixoticBalanceCard({ summary, onRunAgent, isRunning, onToggleChat, onExport }) {
  const totalBalance = summary?.totalIncome
    ? summary.totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })
    : '71,000.00';

  return (
    <div className="quixotic-card p-6 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Settlement Funds</h3>
          <p className="text-xs text-gray-400">Total verified inflow</p>
        </div>
        <ArrowUpRightIcon />
      </div>

      {/* Balance Amount in INR */}
      <div className="text-center my-2">
        <span className="text-xs text-gray-400 block mb-1">Total Verified Inflow</span>
        <span className="text-2xl sm:text-3xl font-bold text-gray-900 font-mono tracking-tight tabular-nums">
          ₹{totalBalance}
        </span>
      </div>

      {/* Smooth Wave Area Chart SVG */}
      <div className="h-24 w-full relative overflow-hidden my-2">
        <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="waveFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#A3D9C9" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path
            d="M 0 60 Q 50 20 100 70 T 200 40 T 300 80 T 400 40 L 400 120 L 0 120 Z"
            fill="url(#waveFill)"
          />
          <path
            d="M 0 60 Q 50 20 100 70 T 200 40 T 300 80 T 400 40"
            fill="none"
            stroke="#007A4D"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Action Pill Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={onExport || onRunAgent}
          className="flex-1 bg-[#007A4D] hover:bg-[#006644] text-white py-2.5 rounded-full text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>Export Reconciled CSV</span>
          <span>↓</span>
        </button>
        <button
          onClick={onToggleChat}
          className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-[#007A4D] border border-emerald-200/90 py-2.5 rounded-full text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>Settlement Assistant</span>
          <span>💬</span>
        </button>
      </div>
    </div>
  );
}

// ── CARD 4: Payment History (Clean Reference Column & INR) ─────────────
export function QuixoticPaymentHistoryCard({
  transactions = [],
  onApprove,
  onDismiss,
  onViewAll,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const displayTx = transactions.slice(0, 6);

  return (
    <div className="quixotic-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Payment History</h3>
          <p className="text-xs text-gray-400">Recent ledger activity & reconciliation status</p>
        </div>
        <button onClick={onViewAll} className="cursor-pointer" title="View all transactions">
          <ArrowUpRightIcon />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-gray-400 font-medium border-b border-gray-100 pb-2">
              <th className="pb-3 font-medium">Name</th>
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium">Reference</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {displayTx.map((tx) => {
              const isException = (tx.flags && tx.flags.length > 0) || tx.match_status === 'exception';
              const isResolved = tx.action_status === 'approved' || tx.action_status === 'dismissed';
              const isExpanded = expandedId === tx.id;
              const amtNumber = Math.abs(tx.amount || 0);
              const formattedAmt = `${tx.type === 'income' ? '+' : '-'}₹${amtNumber.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

              return (
                <React.Fragment key={tx.id}>
                  <tr
                    onClick={() => tx.action_draft && setExpandedId(isExpanded ? null : tx.id)}
                    className={`hover:bg-gray-50/70 transition-colors ${
                      tx.action_draft ? 'cursor-pointer' : ''
                    }`}
                  >
                    {/* Name + Vendor Badge */}
                    <td className="py-3.5 flex items-center gap-3">
                      <VendorBadge name={tx.description} category={tx.category} />
                      <div>
                        <div className="font-semibold text-gray-900 text-[13px]">{tx.description}</div>
                        <div className="text-[11px] text-gray-400 font-medium capitalize">
                          {tx.category || (tx.type === 'income' ? 'Client Income' : 'Operating Expense')}
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 text-gray-600 font-mono text-xs whitespace-nowrap">
                      {tx.date}
                    </td>

                    {/* Reference Column Cleaned Up */}
                    <td className="py-3.5 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                      {tx.invoice_ref ? (
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold">
                          {tx.invoice_ref}
                        </span>
                      ) : (
                        <span className="text-gray-300 font-mono">—</span>
                      )}
                    </td>

                    {/* Status Dot */}
                    <td className="py-3.5 whitespace-nowrap">
                      {isResolved ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Resolved
                        </span>
                      ) : isException ? (
                        <span className="inline-flex items-center gap-1.5 text-red-600 font-medium text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Exception
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[#007A4D] font-medium text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#007A4D]" />
                          Successful
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 text-right font-mono font-semibold text-gray-900 text-[13px] tabular-nums whitespace-nowrap">
                      {formattedAmt}
                    </td>
                  </tr>

                  {/* Expandable Action Draft Drawer for Exceptions */}
                  {isExpanded && tx.action_draft && (
                    <tr className="bg-gray-50/90">
                      <td colSpan={5} className="p-4 rounded-xl border border-gray-200">
                        <div className="flex flex-col gap-2">
                          <div className="text-xs font-semibold text-red-600 flex items-center gap-1.5">
                            <span>⚠</span>
                            <span>{tx.exception_reason || tx.anomaly_explanation || 'Flagged for reconciliation'}</span>
                          </div>
                          <div className="p-3 bg-white rounded-lg border border-gray-200 text-xs font-mono text-gray-800 whitespace-pre-wrap">
                            {tx.action_draft}
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            {!isResolved && (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); onApprove(tx.id); }}
                                  className="px-3.5 py-1 rounded-full text-xs font-semibold bg-[#007A4D] text-white hover:bg-[#006644] cursor-pointer"
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); onDismiss(tx.id); }}
                                  className="px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 cursor-pointer"
                                >
                                  × Dismiss
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── CARD 5: Discrepancy Exposure & Exceptions Queue ────────────────────
export function QuixoticCreditAndExceptionsCard({
  transactions = [],
  onViewExceptions,
}) {
  const exceptions = transactions.filter(
    (t) => ((t.flags && t.flags.length > 0) || t.match_status === 'exception') && t.action_status !== 'approved' && t.action_status !== 'dismissed'
  );

  const totalExceptionValue = exceptions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
  const formattedVal = totalExceptionValue > 0
    ? totalExceptionValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })
    : '8,945.89';

  return (
    <div className="quixotic-card p-6 flex flex-col justify-between">
      {/* Top Half: Discrepancy Exposure */}
      <div className="border-b border-gray-100 pb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-xs">
            💳
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Discrepancy Exposure</h3>
            <p className="text-[11px] text-gray-400">Amount requiring authorization</p>
          </div>
        </div>

        <div className="flex items-baseline gap-3 mt-2">
          <span className="text-2xl font-bold text-gray-900 font-mono tracking-tight tabular-nums">
            ₹{formattedVal}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#007A4D] border border-emerald-200/60">
            {exceptions.length || 9} Flags
          </span>
        </div>
      </div>

      {/* Bottom Half: Exceptions Queue */}
      <div className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="text-xs font-semibold text-gray-900 tracking-tight">Exceptions Queue</h4>
            <p className="text-[11px] text-gray-400">Pending human review</p>
          </div>
          <button onClick={onViewExceptions} className="cursor-pointer" title="Review exceptions">
            <ArrowUpRightIcon />
          </button>
        </div>

        {/* Flagged Vendor Badges Stack */}
        <div className="flex items-center gap-1.5 pt-1">
          <div className="w-8 h-8 rounded-full bg-[#FF9900]/20 border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#E68A00] shadow-xs" title="AWS Infrastructure Spike">
            AWS
          </div>
          <div className="w-8 h-8 rounded-full bg-[#1877F2]/20 border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#1877F2] shadow-xs" title="Facebook Ads Duplicate">
            FB
          </div>
          <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-purple-700 shadow-xs" title="Gamma Inc Missing Ref">
            GM
          </div>
          <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-amber-700 shadow-xs" title="Office Rent Duplicate">
            OF
          </div>
          <div
            onClick={onViewExceptions}
            className="w-8 h-8 rounded-full bg-[#007A4D] text-white text-xs font-bold flex items-center justify-center shadow-xs cursor-pointer hover:bg-[#006644] transition-colors"
            title="Click to review all exceptions"
          >
            +{exceptions.length || 9}
          </div>
        </div>
      </div>
    </div>
  );
}
