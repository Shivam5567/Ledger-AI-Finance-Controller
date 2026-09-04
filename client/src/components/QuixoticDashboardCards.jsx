import React, { useState } from 'react';
import { ArrowUpRightIcon, VendorBadge } from './Icons';

// ── SKELETON LOADER ────────────────────────────────────────────────────
function CardSkeleton({ height = 'h-64' }) {
  return (
    <div className={`quixotic-card p-6 flex flex-col justify-between animate-pulse ${height}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="h-4 bg-gray-200 rounded w-28" />
        <div className="w-5 h-5 bg-gray-200 rounded-full" />
      </div>
      <div className="h-24 bg-gray-100 rounded-2xl my-2" />
      <div className="h-4 bg-gray-200 rounded w-36 mt-2" />
    </div>
  );
}

// ── CARD 1: Ledger Position & Controller Card Widget (Light Theme) ─────
export function QuixoticCardWidget({
  data,
  summary,
  transactions = [],
  loading,
  onNavigateLedger,
}) {
  if (loading && !data) return <CardSkeleton />;

  const net = data?.ledger?.position !== undefined
    ? data.ledger.position
    : (summary?.net !== undefined ? summary.net : -8678);
  const isPositive = net >= 0;
  const formattedNet = `${isPositive ? '+' : '-'}₹${Math.abs(net).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const periodInflow = data?.ledger?.inflow !== undefined
    ? data.ledger.inflow.toLocaleString('en-IN', { maximumFractionDigits: 0 })
    : (summary?.totalIncome ? summary.totalIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '2,26,500');

  const periodOutflow = data?.ledger?.outflow !== undefined
    ? data.ledger.outflow.toLocaleString('en-IN', { maximumFractionDigits: 0 })
    : (summary?.totalExpenses ? summary.totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '2,35,178');

  const trendBadge = data?.ledger?.previousPeriodComparison?.positionChange || '+12.8%';
  const txCount = data?.ledger?.transactionCount ?? (transactions.length || 55);

  return (
    <div
      onClick={onNavigateLedger}
      className="quixotic-card p-6 flex flex-col justify-between cursor-pointer group hover:border-emerald-300 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 tracking-tight group-hover:text-[#007A4D] transition-colors">
            Ledger Position
          </h3>
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
          <span className="tracking-wider">{txCount} Transactions</span>
          <span className="text-emerald-700 font-medium">Reconciled · Live DB</span>
        </div>
      </div>

      {/* Period Inflow & Growth Badge */}
      <div className="pt-1">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>Period Inflow / Outflow</span>
          <span className="text-[10px] font-mono text-gray-500">Out: ₹{periodOutflow}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900 font-mono tabular-nums">
            +₹{periodInflow}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#007A4D] border border-emerald-200/60">
            {trendBadge}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── CARD 2: Reconciliation Rate (Historical Weekly Data) ───────────────
export function QuixoticBarChartCard({
  data,
  report,
  interval = 'weekly',
  onIntervalChange,
  onNavigateReports,
  loading,
}) {
  if (loading && !data) return <CardSkeleton />;

  const matchedRate = data?.reconciliation?.rate || report?.summary?.matchRate || '83.6%';
  const matchedCount = data?.reconciliation?.matched ?? (report?.summary?.matched || 46);
  const exceptionsCount = data?.reconciliation?.exceptions ?? (report?.summary?.exceptions || 9);
  const duration = data?.reconciliation?.durationSeconds || report?.summary?.durationSeconds || '0.2';

  // Real chart data from API, or fallback to historical bars
  const rawBars = data?.reconciliation?.chart || [
    { label: 'WK 1', height: '83%', value: '1.2k', rate: 83.3, matched: 10, total: 12, period: 'Jul 1 - Jul 7' },
    { label: 'WK 2', height: '70%', value: '1.0k', rate: 70.0, matched: 7, total: 10, period: 'Jul 8 - Jul 14' },
    { label: 'WK 3', height: '89%', value: '0.9k', rate: 88.9, matched: 8, total: 9, period: 'Jul 15 - Jul 21' },
    { label: 'WK 4', height: '91%', value: '1.1k', rate: 90.9, matched: 10, total: 11, period: 'Jul 22 - Jul 28' },
    { label: 'WK 5', height: '85%', value: '1.3k', rate: 84.6, matched: 11, total: 13, period: 'Jul 29 - Aug 4', active: true },
  ];

  const [hoveredBar, setHoveredBar] = useState(null);

  return (
    <div className="quixotic-card p-6 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div
          onClick={onNavigateReports}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold">
            📊
          </div>
          <h3 className="text-sm font-semibold text-gray-900 tracking-tight group-hover:text-[#007A4D] transition-colors">
            Reconciliation Rate
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle pills */}
          <div className="flex items-center bg-gray-100 rounded-full p-0.5 text-[11px] font-medium text-gray-500">
            <button
              onClick={() => onIntervalChange && onIntervalChange('weekly')}
              className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                interval === 'weekly' ? 'bg-[#007A4D] text-white font-semibold' : 'hover:text-gray-900'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => onIntervalChange && onIntervalChange('monthly')}
              className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                interval === 'monthly' ? 'bg-[#007A4D] text-white font-semibold' : 'hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
          </div>
          <button onClick={onNavigateReports} className="cursor-pointer" title="View reconciliation reports">
            <ArrowUpRightIcon />
          </button>
        </div>
      </div>

      {/* Hatched Bar Chart Graphic with Real Hover Tooltips */}
      <div className="relative pt-6 pb-2">
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] font-mono text-gray-400 opacity-60">
          <div className="border-b border-gray-100 pb-0.5">100%</div>
          <div className="border-b border-gray-100 pb-0.5">75%</div>
          <div className="border-b border-gray-100 pb-0.5">50%</div>
          <div className="border-b border-gray-100 pb-0.5">25%</div>
          <div className="pb-0.5">0%</div>
        </div>

        {/* Hovered Bar Tooltip */}
        {hoveredBar && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-mono py-1 px-2.5 rounded-lg shadow-lg z-20 whitespace-nowrap pointer-events-none">
            <span className="font-bold text-emerald-400">{hoveredBar.period || hoveredBar.label}</span>
            <span className="mx-1">·</span>
            <span>{hoveredBar.rate}% matched ({hoveredBar.matched}/{hoveredBar.total} txs)</span>
          </div>
        )}

        <div className="h-44 flex items-end justify-between pl-8 pr-2 relative z-10">
          {rawBars.map((b, idx) => (
            <div
              key={b.label || idx}
              onMouseEnter={() => setHoveredBar(b)}
              onMouseLeave={() => setHoveredBar(null)}
              className="flex flex-col items-center gap-2 w-8 group cursor-pointer"
            >
              {b.active && !hoveredBar && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#007A4D] text-white shadow-xs animate-bounce -mb-1 whitespace-nowrap">
                  {matchedRate}
                </span>
              )}

              <div
                className="w-7 rounded-t-2xl overflow-hidden relative flex items-end transition-all group-hover:scale-105"
                style={{ height: b.height || `${b.rate || 50}%` }}
              >
                {b.active ? (
                  <div className="w-full h-full bg-[#007A4D] rounded-t-2xl relative shadow-xs">
                    <div className="w-2 h-2 rounded-full bg-white/80 mx-auto mt-1" />
                  </div>
                ) : (
                  <div className="w-full h-full striped-bar-pattern rounded-t-2xl opacity-90 group-hover:opacity-100 transition-opacity" />
                )}
              </div>

              <span className={`text-[10px] font-bold font-mono tracking-wider ${b.active ? 'text-gray-900 font-extrabold' : 'text-gray-400'}`}>
                {b.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Accuracy & Throughput Metrics Footer */}
      <div className="pt-3 mt-1 border-t border-gray-100 flex items-center justify-between text-[11px] font-mono">
        <span className="text-[#007A4D] font-bold">✓ {matchedCount} Matched</span>
        <span className="text-red-600 font-bold">⚠ {exceptionsCount} Exceptions</span>
        <span className="text-gray-400">{duration}s run</span>
      </div>
    </div>
  );
}

// ── CARD 3: Settlement Funds & Wave Area Chart ──────────────────────────
export function QuixoticBalanceCard({
  data,
  summary,
  onRunAgent,
  isRunning,
  onToggleChat,
  onExport,
  loading,
}) {
  if (loading && !data) return <CardSkeleton />;

  const verified = data?.settlement?.verifiedInflow !== undefined
    ? data.settlement.verifiedInflow
    : (summary?.totalIncome || 226500);

  const pending = data?.settlement?.pendingSettlement !== undefined
    ? data.settlement.pendingSettlement
    : 0;

  const totalBalance = verified.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const pendingFormatted = pending > 0 ? pending.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : null;

  // Generate dynamic wave SVG path if chart points exist
  const chartPoints = data?.settlement?.chart || [];
  let pathD = "M 0 60 Q 50 20 100 70 T 200 40 T 300 80 T 400 40";
  let fillD = "M 0 60 Q 50 20 100 70 T 200 40 T 300 80 T 400 40 L 400 120 L 0 120 Z";

  if (chartPoints.length >= 2) {
    const maxVal = Math.max(...chartPoints.map(p => p.cumulative || 1), 1);
    const pts = chartPoints.map((p, i) => {
      const x = (i / (chartPoints.length - 1)) * 380 + 10;
      const y = 110 - ((p.cumulative / maxVal) * 80 + 10);
      return { x: Math.round(x), y: Math.round(y) };
    });

    pathD = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cx = Math.round((prev.x + curr.x) / 2);
      pathD += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    fillD = `${pathD} L ${pts[pts.length - 1].x} 120 L ${pts[0].x} 120 Z`;
  }

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
        {pendingFormatted && (
          <span className="text-[11px] text-amber-600 font-mono block mt-0.5">
            ₹{pendingFormatted} pending authorization
          </span>
        )}
      </div>

      {/* Smooth Wave Area Chart SVG */}
      <div className="h-24 w-full relative overflow-hidden my-2 group">
        <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="waveFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#A3D9C9" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d={fillD} fill="url(#waveFill)" />
          <path
            d={pathD}
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
          onClick={onExport}
          className="flex-1 bg-[#007A4D] hover:bg-[#006644] text-white py-2.5 rounded-full text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          title="Export matched CSV for this date range"
        >
          <span>Export CSV</span>
          <span>↓</span>
        </button>
        <button
          onClick={onToggleChat}
          className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-[#007A4D] border border-emerald-200/90 py-2.5 rounded-full text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>Ledger Copilot</span>
          <span>💬</span>
        </button>
      </div>
    </div>
  );
}

// ── CARD 4: Payment History (Rich Row Click & INR) ─────────────────────
export function QuixoticPaymentHistoryCard({
  transactions = [],
  data,
  onRowClick,
  onViewAll,
  loading,
}) {
  if (loading && transactions.length === 0) return <CardSkeleton height="h-80" />;

  const displayTx = (data?.recentTransactions || transactions).slice(0, 6);

  return (
    <div className="quixotic-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Payment History</h3>
          <p className="text-xs text-gray-400">Recent ledger activity & reconciliation status (Click row to inspect)</p>
        </div>
        <button onClick={onViewAll} className="cursor-pointer" title="View all transactions in Ledger">
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
            {displayTx.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  No transactions recorded in this date range.
                </td>
              </tr>
            ) : (
              displayTx.map((tx) => {
                const isException = (tx.flags && tx.flags.length > 0) || tx.match_status === 'exception';
                const isResolved = tx.action_status === 'approved' || tx.action_status === 'dismissed';
                const amtNumber = Math.abs(tx.amount || 0);
                const formattedAmt = `${tx.type === 'income' ? '+' : '-'}₹${amtNumber.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

                return (
                  <tr
                    key={tx.id}
                    onClick={() => onRowClick && onRowClick(tx)}
                    className="hover:bg-emerald-50/40 transition-colors cursor-pointer group"
                  >
                    {/* Name + Vendor Badge */}
                    <td className="py-3.5 flex items-center gap-3">
                      <VendorBadge name={tx.description} category={tx.category} />
                      <div>
                        <div className="font-semibold text-gray-900 text-[13px] group-hover:text-[#007A4D] transition-colors">
                          {tx.description}
                        </div>
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
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── CARD 5: Discrepancy Exposure & Exceptions Queue ────────────────────
export function QuixoticCreditAndExceptionsCard({
  data,
  transactions = [],
  onViewExceptions,
  loading,
}) {
  if (loading && !data) return <CardSkeleton />;

  const exposure = data?.discrepancies?.exposure !== undefined
    ? data.discrepancies.exposure
    : 72200;

  const count = data?.discrepancies?.count !== undefined
    ? data.discrepancies.count
    : 9;

  const formattedVal = exposure.toLocaleString('en-IN', { minimumFractionDigits: 2 });

  const vendors = data?.discrepancies?.flaggedVendors || [
    { badge: 'AWS', color: '#FF9900', name: 'AWS Infrastructure' },
    { badge: 'FB',  color: '#1877F2', name: 'Facebook Ads' },
    { badge: 'GM',  color: '#9333EA', name: 'Gamma Inc' },
    { badge: 'AC',  color: '#007A4D', name: 'Acme Corp' },
  ];

  return (
    <div
      onClick={onViewExceptions}
      className="quixotic-card p-6 flex flex-col justify-between cursor-pointer group hover:border-emerald-300 transition-all"
    >
      {/* Top Half: Discrepancy Exposure */}
      <div className="border-b border-gray-100 pb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-xs">
            💳
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-tight group-hover:text-[#007A4D] transition-colors">
              Discrepancy Exposure
            </h3>
            <p className="text-[11px] text-gray-400">Amount requiring authorization</p>
          </div>
        </div>

        <div className="flex items-baseline gap-3 mt-2">
          <span className="text-2xl font-bold text-gray-900 font-mono tracking-tight tabular-nums">
            ₹{formattedVal}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200/60">
            {count} Flags
          </span>
        </div>

        {/* Severity counts pill row */}
        {data?.discrepancies?.severity && (
          <div className="flex items-center gap-2 mt-2 text-[10px] font-mono">
            <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-semibold">
              H: {data.discrepancies.severity.high?.count || 0}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold">
              M: {data.discrepancies.severity.medium?.count || 0}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">
              L: {data.discrepancies.severity.low?.count || 0}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Half: Exceptions Queue */}
      <div className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="text-xs font-semibold text-gray-900 tracking-tight">Exceptions Queue</h4>
            <p className="text-[11px] text-gray-400">Pending human review</p>
          </div>
          <ArrowUpRightIcon />
        </div>

        {/* Flagged Vendor Badges Stack */}
        <div className="flex items-center gap-1.5 pt-1">
          {vendors.slice(0, 4).map((v, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold shadow-xs transition-transform hover:scale-110"
              style={{ backgroundColor: `${v.color}20`, color: v.color }}
              title={`${v.name} (${v.count || 1} exceptions)`}
            >
              {v.badge}
            </div>
          ))}

          {count > 0 && (
            <div
              className="w-8 h-8 rounded-full bg-[#007A4D] text-white text-xs font-bold flex items-center justify-center shadow-xs transition-transform hover:scale-110"
              title="Click to review all exceptions"
            >
              +{count}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
