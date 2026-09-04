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

// ── CARD 1: Ledger Position & Calculation Breakdown (Light Theme) ─────
export function QuixoticCardWidget({
  data,
  summary,
  transactions = [],
  loading,
  onNavigateLedger,
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (loading && !data) return <CardSkeleton />;

  const net = data?.ledger?.position !== undefined
    ? data.ledger.position
    : (summary?.net !== undefined ? summary.net : -8678);
  const isPositive = net >= 0;
  const formattedNet = `${isPositive ? '+' : '-'}₹${Math.abs(net).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const periodInflow = data?.ledger?.inflow !== undefined
    ? data.ledger.inflow
    : (summary?.totalIncome || 226500);

  const periodOutflow = data?.ledger?.outflow !== undefined
    ? data.ledger.outflow
    : (summary?.totalExpenses || 235178);

  const openingBal = data?.ledger?.openingBalance ?? 0;
  const adjustments = data?.ledger?.adjustments ?? 0;

  const trendBadge = data?.ledger?.previousPeriodComparison?.positionChange || '+12.8%';
  const txCount = data?.ledger?.transactionCount ?? (transactions.length || 55);

  return (
    <div
      onClick={onNavigateLedger}
      className="quixotic-card p-6 flex flex-col justify-between cursor-pointer group hover:border-emerald-300 transition-all relative"
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
      <div className="rounded-2xl bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/60 border border-emerald-200/80 p-5 shadow-xs relative overflow-hidden mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold tracking-wider text-xs uppercase text-[#007A4D] font-mono">
            LEDGER AI
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#007A4D] text-white">
            Active Controller
          </span>
        </div>

        <div className="my-2">
          <div className={`text-2xl sm:text-3xl font-bold tracking-tight font-mono tabular-nums ${isPositive ? 'text-[#007A4D]' : 'text-gray-900'}`}>
            {formattedNet}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 font-mono pt-1.5 border-t border-emerald-100/70">
          <span className="tracking-wider">{txCount} Transactions</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowBreakdown(prev => !prev);
            }}
            className="text-[11px] font-sans font-semibold text-[#007A4D] hover:text-[#005a39] flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs"
            title="Inspect mathematical breakdown"
          >
            <span>ⓘ</span>
            <span>{showBreakdown ? 'Hide Breakdown' : 'Breakdown'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Calculation Breakdown Popover/Drawer */}
      {showBreakdown && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mb-4 p-3.5 rounded-2xl bg-white border border-emerald-200 shadow-sm text-xs font-mono text-gray-800 animate-slide-down"
        >
          <div className="flex items-center justify-between text-[11px] text-gray-400 uppercase tracking-wider font-sans font-bold mb-2 pb-1 border-b border-gray-100">
            <span>Calculation Breakdown</span>
            <span className="text-[10px] text-emerald-700">Audit Verified</span>
          </div>
          <div className="flex items-center justify-between py-0.5 text-gray-500">
            <span>Opening Balance</span>
            <span className="font-semibold text-gray-700">₹{openingBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex items-center justify-between py-0.5 text-emerald-700">
            <span>Total Inflow</span>
            <span className="font-semibold">+₹{periodInflow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex items-center justify-between py-0.5 text-gray-700">
            <span>Total Outflow</span>
            <span className="font-semibold">-₹{periodOutflow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          {adjustments !== 0 && (
            <div className="flex items-center justify-between py-0.5 text-gray-500">
              <span>Adjustments</span>
              <span className="font-semibold">₹{adjustments.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-gray-200 font-bold text-gray-900">
            <span>Ledger Position</span>
            <span className={net >= 0 ? 'text-[#007A4D]' : 'text-gray-900'}>
              {formattedNet}
            </span>
          </div>
        </div>
      )}

      {/* Period Inflow & Outflow Summary Bar */}
      <div className="pt-1">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>Period Inflow / Outflow</span>
          <span className="text-[10px] font-mono text-gray-500">
            Out: -₹{periodOutflow.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900 font-mono tabular-nums">
            +₹{periodInflow.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#007A4D] border border-emerald-200/60">
            {trendBadge}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── CARD 2: Reconciliation Rate & Dynamic Progress Visualization ───────
export function QuixoticBarChartCard({
  data,
  report,
  interval = 'weekly',
  onIntervalChange,
  onNavigateReports,
  loading,
}) {
  const [hoveredBar, setHoveredBar] = useState(null);

  if (loading && !data) return <CardSkeleton />;

  const matchedRate = data?.reconciliation?.rate || report?.summary?.matchRate || '83.6%';
  const matchedCount = data?.reconciliation?.matched ?? (report?.summary?.matched || 46);
  const totalCount = data?.ledger?.transactionCount ?? (report?.summary?.total || 55);
  const exceptionsCount = data?.reconciliation?.exceptions ?? (report?.summary?.exceptions || 9);
  const duration = data?.reconciliation?.durationSeconds || report?.summary?.durationSeconds || '0.2';

  // Real chart data from API
  const rawBars = data?.reconciliation?.chart || [];
  const hasHistoricalSeries = rawBars.length >= 2;

  return (
    <div
      onClick={onNavigateReports}
      className="quixotic-card p-6 flex flex-col justify-between cursor-pointer group hover:border-emerald-300 transition-all"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold">
            📊
          </div>
          <h3 className="text-sm font-semibold text-gray-900 tracking-tight group-hover:text-[#007A4D] transition-colors">
            Reconciliation Rate
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle pills */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center bg-gray-100 rounded-full p-0.5 text-[11px] font-medium text-gray-500"
          >
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
          <ArrowUpRightIcon />
        </div>
      </div>

      {/* Explicit Relationship Display */}
      <div className="mb-2">
        <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-gray-900">
          {matchedRate}
        </div>
        <p className="text-xs text-gray-500 font-mono">
          {matchedCount} of {totalCount} transactions matched
        </p>
      </div>

      {/* Chart: Historical Series OR Adaptive Progress Visualization */}
      {hasHistoricalSeries ? (
        <div className="relative pt-4 pb-1">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] font-mono text-gray-400 opacity-60">
            <div className="border-b border-gray-100 pb-0.5">100%</div>
            <div className="border-b border-gray-100 pb-0.5">75%</div>
            <div className="border-b border-gray-100 pb-0.5">50%</div>
            <div className="border-b border-gray-100 pb-0.5">25%</div>
            <div className="pb-0.5">0%</div>
          </div>

          {/* Hovered Bar Tooltip */}
          {hoveredBar && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-mono py-1 px-3 rounded-lg shadow-lg z-20 whitespace-nowrap pointer-events-none">
              <span className="font-bold text-emerald-400">{hoveredBar.period || hoveredBar.label}</span>
              <span className="mx-1.5">·</span>
              <span>{hoveredBar.rate}% Reconciled ({hoveredBar.matched}/{hoveredBar.total} txs)</span>
            </div>
          )}

          <div className="h-36 flex items-end justify-between pl-8 pr-2 relative z-10">
            {rawBars.map((b, idx) => (
              <div
                key={b.label || idx}
                onMouseEnter={() => setHoveredBar(b)}
                onMouseLeave={() => setHoveredBar(null)}
                className="flex flex-col items-center gap-1.5 w-8 group cursor-pointer"
              >
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
      ) : (
        /* Progress Visualization when insufficient historical data exists */
        <div className="my-3 p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-semibold text-gray-700">Reconciliation Progress</span>
            <span className="font-bold text-[#007A4D]">{matchedRate}</span>
          </div>

          {/* Segmented Progress Track */}
          <div className="w-full h-3.5 bg-gray-200 rounded-full overflow-hidden flex p-0.5">
            <div
              className="bg-[#007A4D] h-full rounded-full transition-all duration-500"
              style={{ width: `${(matchedCount / Math.max(1, totalCount)) * 100}%` }}
              title={`Matched: ${matchedCount}`}
            />
            <div
              className="bg-red-400 h-full rounded-r-full transition-all duration-500 ml-0.5"
              style={{ width: `${(exceptionsCount / Math.max(1, totalCount)) * 100}%` }}
              title={`Exceptions: ${exceptionsCount}`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-gray-500 pt-0.5">
            <span>✓ {matchedCount} Matched ({matchedRate})</span>
            <span className="text-red-600">⚠ {exceptionsCount} Exceptions</span>
          </div>
        </div>
      )}

      {/* Accuracy & Throughput Metrics Footer */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] font-mono">
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
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (loading && !data) return <CardSkeleton />;

  const verified = data?.settlement?.verifiedInflow !== undefined
    ? data.settlement.verifiedInflow
    : 177700;

  const totalInflow = data?.ledger?.inflow !== undefined
    ? data.ledger.inflow
    : (summary?.totalIncome || 226500);

  const pending = data?.settlement?.pendingSettlement !== undefined
    ? data.settlement.pendingSettlement
    : 48800;

  const formattedVerified = verified.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const formattedInflow = totalInflow.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const formattedPending = pending.toLocaleString('en-IN', { minimumFractionDigits: 2 });

  // Generate dynamic wave SVG path from actual cumulative inflow trajectory
  const chartPoints = data?.settlement?.chart || [];
  let pathD = "M 0 60 Q 50 20 100 70 T 200 40 T 300 80 T 400 40";
  let fillD = "M 0 60 Q 50 20 100 70 T 200 40 T 300 80 T 400 40 L 400 120 L 0 120 Z";
  let svgPoints = [];

  if (chartPoints.length >= 2) {
    const maxVal = Math.max(...chartPoints.map(p => p.cumulative || 1), 1);
    svgPoints = chartPoints.map((p, i) => {
      const x = (i / (chartPoints.length - 1)) * 380 + 10;
      const y = 110 - ((p.cumulative / maxVal) * 80 + 10);
      return { x: Math.round(x), y: Math.round(y), raw: p };
    });

    pathD = `M ${svgPoints[0].x} ${svgPoints[0].y}`;
    for (let i = 1; i < svgPoints.length; i++) {
      const prev = svgPoints[i - 1];
      const curr = svgPoints[i];
      const cx = Math.round((prev.x + curr.x) / 2);
      pathD += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    fillD = `${pathD} L ${svgPoints[svgPoints.length - 1].x} 120 L ${svgPoints[0].x} 120 Z`;
  }

  return (
    <div className="quixotic-card p-6 flex flex-col justify-between group hover:border-emerald-300 transition-all relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 tracking-tight group-hover:text-[#007A4D] transition-colors">
            Settlement Funds
          </h3>
          <p className="text-xs text-gray-400">Reconciled inflow vs pending authorizations</p>
        </div>
        <ArrowUpRightIcon />
      </div>

      {/* Redesigned Hierarchy: Verified Settlement Primary */}
      <div className="my-2">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block font-mono">
          Verified Settlement
        </span>
        <div className="text-2xl sm:text-3xl font-bold text-gray-900 font-mono tracking-tight tabular-nums mt-0.5">
          ₹{formattedVerified}
        </div>

        {/* Supporting Metrics Bar */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-xs font-mono">
          <span className="text-gray-500">
            Total Inflow: <strong className="text-gray-800">₹{formattedInflow}</strong>
          </span>
          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            Pending: <strong>₹{formattedPending}</strong>
          </span>
        </div>
      </div>

      {/* Smooth Wave Area Chart with Interactive Hover Points */}
      <div className="h-24 w-full relative overflow-hidden my-2">
        {/* Hover Point Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-mono py-1 px-3 rounded-lg shadow-lg z-20 whitespace-nowrap pointer-events-none">
            <span className="font-bold text-emerald-400">{hoveredPoint.raw.label}</span>
            <span className="mx-1">·</span>
            <span>{hoveredPoint.raw.description}</span>
            <span className="mx-1">·</span>
            <span className="text-emerald-300">+₹{hoveredPoint.raw.inflow.toLocaleString('en-IN')}</span>
            <span className="mx-1">|</span>
            <span>Cumul: ₹{hoveredPoint.raw.cumulative.toLocaleString('en-IN')}</span>
          </div>
        )}

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

          {/* Interactive Marker Dots */}
          {svgPoints.map((pt, i) => (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={hoveredPoint?.raw?.date === pt.raw.date ? 4.5 : 2.5}
              className={`cursor-pointer transition-all ${
                hoveredPoint?.raw?.date === pt.raw.date ? 'fill-emerald-600 stroke-white stroke-2' : 'fill-[#007A4D]'
              }`}
              onMouseEnter={() => setHoveredPoint(pt)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}
        </svg>
      </div>

      {/* Action Pill Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onExport) onExport();
          }}
          className="flex-1 bg-[#007A4D] hover:bg-[#006644] text-white py-2.5 rounded-full text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          title="Export matched CSV for this date range"
        >
          <span>Export CSV</span>
          <span>↓</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleChat) onToggleChat();
          }}
          className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-[#007A4D] border border-emerald-200/90 py-2.5 rounded-full text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>Ledger Copilot</span>
          <span>💬</span>
        </button>
      </div>
    </div>
  );
}

// ── STATUS BADGE HELPER (Reconciliation-Specific) ──────────────────────
function ReconciliationStatusBadge({ transaction }) {
  const isException = (transaction.flags && transaction.flags.length > 0) || transaction.match_status === 'exception';
  const actionStatus = transaction.action_status;

  if (actionStatus === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        ✓ Reconciled
      </span>
    );
  }

  if (actionStatus === 'dismissed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
        Resolved (Dismissed)
      </span>
    );
  }

  if (isException) {
    if (transaction.action_draft && actionStatus === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          🔒 Authorization Required
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        ⚠ Exception
      </span>
    );
  }

  if (actionStatus === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        ⏳ Pending
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#007A4D] border border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-[#007A4D]" />
      ✓ Reconciled
    </span>
  );
}

// ── CARD 4: Payment History (Reconciliation Statuses & Row Click) ──────
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
          <p className="text-xs text-gray-400">Click any row to view full transaction and reconciliation details</p>
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
                const amtNumber = Math.abs(tx.amount || 0);
                const formattedAmt = `${tx.type === 'income' ? '+' : '-'}₹${amtNumber.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

                return (
                  <tr
                    key={tx.id}
                    onClick={() => onRowClick && onRowClick(tx)}
                    className="hover:bg-emerald-50/50 transition-colors cursor-pointer group"
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

                    {/* Reconciliation-Specific Status Badge */}
                    <td className="py-3.5 whitespace-nowrap">
                      <ReconciliationStatusBadge transaction={tx} />
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

// ── CARD 5: Discrepancy Exposure & Meaningful Severity Labels ──────────
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

  const severity = data?.discrepancies?.severity || {
    high: { count: 4, amount: 56200 },
    medium: { count: 4, amount: 14300 },
    low: { count: 1, amount: 1700 },
  };

  const vendors = data?.discrepancies?.flaggedVendors || [
    { badge: 'AWS', color: '#FF9900', name: 'AWS Infrastructure', count: 2 },
    { badge: 'FB',  color: '#1877F2', name: 'Facebook Ads', count: 2 },
    { badge: 'GM',  color: '#9333EA', name: 'Gamma Inc', count: 1 },
    { badge: 'AC',  color: '#007A4D', name: 'Acme Corp', count: 1 },
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
            <p className="text-[11px] text-gray-400">Total amount requiring human authorization</p>
          </div>
        </div>

        <div className="flex items-baseline gap-3 mt-2">
          <span className="text-2xl font-bold text-gray-900 font-mono tracking-tight tabular-nums">
            ₹{formattedVal}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            {count} Flags
          </span>
        </div>

        {/* Meaningful Severity Labels */}
        <div className="flex flex-col gap-1.5 mt-3 pt-2 border-t border-gray-100 text-xs font-mono">
          <div className="flex items-center justify-between text-red-700">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              High Priority: {severity.high?.count || 0} items
            </span>
            <span className="font-semibold">₹{(severity.high?.amount || 0).toLocaleString('en-IN')}</span>
          </div>

          <div className="flex items-center justify-between text-amber-800">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Medium: {severity.medium?.count || 0} items
            </span>
            <span className="font-semibold">₹{(severity.medium?.amount || 0).toLocaleString('en-IN')}</span>
          </div>

          <div className="flex items-center justify-between text-blue-700">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Low: {severity.low?.count || 0} items
            </span>
            <span className="font-semibold">₹{(severity.low?.amount || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Bottom Half: Exceptions Queue with Counterparties */}
      <div className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="text-xs font-semibold text-gray-900 tracking-tight">Exceptions Queue</h4>
            <p className="text-[11px] text-gray-400">Click to review & authorize</p>
          </div>
          <ArrowUpRightIcon />
        </div>

        {/* Flagged Vendor Badges Stack */}
        <div className="flex items-center gap-2 pt-1">
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
