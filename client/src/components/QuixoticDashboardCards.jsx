import React, { useState } from 'react';
import { ArrowUpRightIcon, VendorBadge } from './Icons';

// ── CARD 1: Ledger Position & Controller Card Widget ───────────────────
export function QuixoticCardWidget({ summary, transactions = [] }) {
  const net = summary?.net !== undefined ? summary.net : -62570;
  const isPositive = net >= 0;
  const formattedNet = `${isPositive ? '+' : '-'}$${Math.abs(net).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const periodInflow = summary?.totalIncome ? summary.totalIncome.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '71,000';

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

      {/* Deep Emerald Controller Card Widget matching image */}
      <div className="rounded-2xl bg-gradient-to-br from-[#00875A] to-[#006644] text-white p-5 shadow-sm relative overflow-hidden mb-5">
        {/* Subtle decorative card shine */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <span className="font-bold tracking-wider text-xs uppercase text-emerald-100 font-mono">LEDGER AI</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">Active Controller</span>
        </div>

        <div className="my-3">
          <div className="text-2xl font-bold tracking-tight font-mono tabular-nums">
            {formattedNet}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-emerald-100/80 font-mono pt-1">
          <span className="tracking-wider">{transactions.length || 55} Transactions</span>
          <span>SQLite Engine</span>
        </div>
      </div>

      {/* Period Inflow & Growth Badge */}
      <div className="pt-1">
        <span className="text-xs text-gray-400 block mb-1">Period Inflow</span>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900 font-mono tabular-nums">
            +${periodInflow} USD
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#007A4D] border border-emerald-200/60">
            +12.8%
          </span>
        </div>
      </div>
    </div>
  );
}

// ── CARD 2: Engagement Rate / Reconciliation Rate (Hatched Bar Chart) ──
export function QuixoticBarChartCard({ report }) {
  const [range, setRange] = useState('annually');
  const matchedRate = report?.summary?.matchRate || '83.6%';

  const bars = [
    { label: 'JAN', height: '40%', value: '2.1k' },
    { label: 'FEB', height: '62%', value: '3.4k' },
    { label: 'MAR', height: '50%', value: '2.8k' },
    { label: 'APR', height: '94%', value: '4.9k', active: true }, // Peak bar in green
    { label: 'MAY', height: '58%', value: '3.2k' },
    { label: 'JUN', height: '64%', value: '3.6k' },
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
          {/* Toggle pills matching image */}
          <div className="flex items-center bg-gray-100 rounded-full p-0.5 text-[11px] font-medium text-gray-500">
            <button
              onClick={() => setRange('monthly')}
              className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                range === 'monthly' ? 'bg-[#007A4D] text-white font-semibold' : 'hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setRange('annually')}
              className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                range === 'annually' ? 'bg-[#007A4D] text-white font-semibold' : 'hover:text-gray-900'
              }`}
            >
              Annually
            </button>
          </div>
          <ArrowUpRightIcon />
        </div>
      </div>

      {/* Hatched Bar Chart Graphic matching image */}
      <div className="relative pt-6 pb-2">
        {/* Y Axis grid background */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] font-mono text-gray-400 opacity-60">
          <div className="border-b border-gray-100 pb-0.5">5k</div>
          <div className="border-b border-gray-100 pb-0.5">4k</div>
          <div className="border-b border-gray-100 pb-0.5">3k</div>
          <div className="border-b border-gray-100 pb-0.5">2k</div>
          <div className="border-b border-gray-100 pb-0.5">1k</div>
          <div className="pb-0.5">0</div>
        </div>

        {/* Bars Container */}
        <div className="h-44 flex items-end justify-between pl-8 pr-2 relative z-10">
          {bars.map((b) => (
            <div key={b.label} className="flex flex-col items-center gap-2 w-8 group">
              {/* Floating Pill for peak bar */}
              {b.active && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#007A4D] text-white shadow-xs animate-bounce -mb-1">
                  +{matchedRate}
                </span>
              )}

              {/* Bar */}
              <div className="w-7 rounded-t-2xl overflow-hidden relative flex items-end" style={{ height: b.height }}>
                {b.active ? (
                  // Solid deep green peak bar with subtle dot on top
                  <div className="w-full h-full bg-[#007A4D] rounded-t-2xl relative">
                    <div className="w-2 h-2 rounded-full bg-white/80 mx-auto mt-1" />
                  </div>
                ) : (
                  // Soft mint hatched pattern bars
                  <div className="w-full h-full striped-bar-pattern rounded-t-2xl opacity-90 group-hover:opacity-100 transition-opacity" />
                )}
              </div>

              {/* X Axis Label */}
              <span className={`text-[10px] font-bold font-mono tracking-wider ${b.active ? 'text-gray-900' : 'text-gray-400'}`}>
                {b.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── CARD 3: Total Balance & Wave Area Chart ─────────────────────────────
export function QuixoticBalanceCard({ summary, onRunAgent, isRunning, onToggleChat }) {
  const totalBalance = summary?.totalIncome ? summary.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '32,678.90';

  return (
    <div className="quixotic-card p-6 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Payment Goal</h3>
          <p className="text-xs text-gray-400">Total amount goal</p>
        </div>
        <ArrowUpRightIcon />
      </div>

      {/* Balance Amount */}
      <div className="text-center my-2">
        <span className="text-xs text-gray-400 block mb-1">Total Balance</span>
        <span className="text-2xl sm:text-3xl font-bold text-gray-900 font-mono tracking-tight tabular-nums">
          ${totalBalance}
        </span>
      </div>

      {/* Smooth Wave Area Chart SVG matching image */}
      <div className="h-24 w-full relative overflow-hidden my-2">
        <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="waveFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#A3D9C9" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          {/* Filled area */}
          <path
            d="M 0 60 Q 50 20 100 70 T 200 40 T 300 80 T 400 40 L 400 120 L 0 120 Z"
            fill="url(#waveFill)"
          />
          {/* Top curve line */}
          <path
            d="M 0 60 Q 50 20 100 70 T 200 40 T 300 80 T 400 40"
            fill="none"
            stroke="#007A4D"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Send / Receive Pill Buttons matching image */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={onRunAgent}
          disabled={isRunning}
          className="flex-1 bg-[#007A4D] hover:bg-[#006644] text-white py-2.5 rounded-full text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <span>Run Pipeline</span>
          <span>↑</span>
        </button>
        <button
          onClick={onToggleChat}
          className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 py-2.5 rounded-full text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>Settlement</span>
          <span>↓</span>
        </button>
      </div>
    </div>
  );
}

// ── CARD 4: Payment History (Spreadsheet Table with vendor badges) ──────
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
          <p className="text-xs text-gray-400">Recent payments history</p>
        </div>
        <button onClick={onViewAll} className="cursor-pointer" title="View all transactions">
          <ArrowUpRightIcon />
        </button>
      </div>

      {/* Table matching reference image */}
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
              const formattedAmt = `${tx.type === 'income' ? '+' : '-'}$${amtNumber.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

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
                        <div className="text-[11px] text-gray-400 font-medium">
                          {tx.category || (tx.type === 'income' ? 'Client Payment' : 'Operating Expense')}
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 text-gray-600 font-mono text-xs whitespace-nowrap">
                      {tx.date}
                    </td>

                    {/* Reference (replaces fake 10:30 PM) */}
                    <td className="py-3.5 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                      {tx.invoice_ref ? (
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold">
                          {tx.invoice_ref}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
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
                                  className="px-3 py-1 rounded-full text-xs font-semibold bg-[#007A4D] text-white hover:bg-[#006644] cursor-pointer"
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

// ── CARD 5: Amount of Credit & Mandatory Payments ──────────────────────
export function QuixoticCreditAndExceptionsCard({
  transactions = [],
  onViewExceptions,
}) {
  const exceptions = transactions.filter(
    (t) => ((t.flags && t.flags.length > 0) || t.match_status === 'exception') && t.action_status !== 'approved' && t.action_status !== 'dismissed'
  );

  const totalExceptionValue = exceptions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
  const formattedVal = totalExceptionValue > 0 ? totalExceptionValue.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '8,945.89';

  return (
    <div className="quixotic-card p-6 flex flex-col justify-between">
      {/* Top Half: Amount of Credit */}
      <div className="border-b border-gray-100 pb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-xs">
            💳
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Amount of credit</h3>
            <p className="text-[11px] text-gray-400">Total refund amount with fee</p>
          </div>
        </div>

        <div className="flex items-baseline gap-3 mt-2">
          <span className="text-2xl font-bold text-gray-900 font-mono tracking-tight tabular-nums">
            ${formattedVal}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#007A4D] border border-emerald-200/60">
            +12.8%
          </span>
        </div>
      </div>

      {/* Bottom Half: Mandatory Payments / Flagged Exceptions */}
      <div className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="text-xs font-semibold text-gray-900 tracking-tight">Mandatory Payments</h4>
            <p className="text-[11px] text-gray-400">Flagged pending reviews</p>
          </div>
          <button onClick={onViewExceptions} className="cursor-pointer" title="Review exceptions">
            <ArrowUpRightIcon />
          </button>
        </div>

        {/* Avatars Stack matching image */}
        <div className="flex items-center gap-1.5 pt-1">
          <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center text-xs font-bold text-amber-700 shadow-xs">
            👨‍💼
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-700 shadow-xs">
            👩‍💻
          </div>
          <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-xs font-bold text-purple-700 shadow-xs">
            👨‍🔧
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-xs font-bold text-emerald-700 shadow-xs">
            👩‍💼
          </div>
          {/* +2 or exception count badge matching reference image */}
          <div
            onClick={onViewExceptions}
            className="w-8 h-8 rounded-full bg-[#007A4D] text-white text-xs font-bold flex items-center justify-center shadow-xs cursor-pointer hover:bg-[#006644] transition-colors"
          >
            +{Math.max(2, exceptions.length)}
          </div>
        </div>
      </div>
    </div>
  );
}
