import React, { useState } from 'react';
import { ArrowUpRightIcon, VendorBadge, BarChartIcon, LightningBoltIcon, CheckIcon, AlertTriangleIcon, CreditCardIcon } from './Icons';

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
  const [balanceMode, setBalanceMode] = useState('reconciled'); // 'reconciled' | 'book'
  const [justUpdated, setJustUpdated] = useState(false);
  const prevCountRef = React.useRef(null);

  // Compute live, real-time metrics directly from the active transactions set
  const hasLiveTxs = Array.isArray(transactions) && transactions.length > 0;

  let computedInflow = 0;
  let computedOutflow = 0;
  let computedVerifiedInflow = 0;
  let computedPendingSettlement = 0;
  let computedDisputedExpenses = 0;
  let computedMatchedCount = 0;

  if (hasLiveTxs) {
    for (const t of transactions) {
      const isException = (t.match_status === 'exception' || (t.flags && t.flags.length > 0)) &&
                          t.action_status !== 'approved' &&
                          t.action_status !== 'dismissed';
      if (t.type === 'income') {
        computedInflow += t.amount;
        if (!isException) computedVerifiedInflow += t.amount;
        else computedPendingSettlement += t.amount;
      } else if (t.type === 'refund') {
        computedOutflow -= t.amount;
      } else if (t.type === 'expense') {
        computedOutflow += t.amount;
        if (isException) computedDisputedExpenses += t.amount;
      }
      if (!isException) computedMatchedCount++;
    }
  }

  // Trigger brief visual pulse whenever live matched transactions change
  React.useEffect(() => {
    if (hasLiveTxs) {
      if (prevCountRef.current !== null && prevCountRef.current !== computedMatchedCount) {
        setJustUpdated(true);
        const timer = setTimeout(() => setJustUpdated(false), 1500);
        return () => clearTimeout(timer);
      }
      prevCountRef.current = computedMatchedCount;
    }
  }, [hasLiveTxs, computedMatchedCount]);

  if (loading && !data && (!transactions || transactions.length === 0)) return <CardSkeleton />;

  const periodInflow = hasLiveTxs
    ? computedInflow
    : (data?.ledger?.inflow !== undefined ? data.ledger.inflow : (summary?.totalIncome || 0));

  const periodOutflow = hasLiveTxs
    ? computedOutflow
    : (data?.ledger?.outflow !== undefined ? data.ledger.outflow : (summary?.totalExpenses || 0));

  // Book Net Position (all ledger entries)
  const bookNet = hasLiveTxs
    ? (computedInflow - computedOutflow)
    : (data?.ledger?.position !== undefined ? data.ledger.position : (summary?.net !== undefined ? summary.net : 0));

  // Live Reconciled Net Position (verified inflow minus verified/reconciled outflow)
  const reconciledNet = hasLiveTxs
    ? (computedVerifiedInflow - (computedOutflow - computedDisputedExpenses))
    : (data?.ledger?.reconciledPosition !== undefined ? data.ledger.reconciledPosition : bookNet);

  const activeDisplayNet = balanceMode === 'reconciled' ? reconciledNet : bookNet;
  const isPositive = activeDisplayNet >= 0;
  const formattedActiveNet = `${isPositive ? '+' : '-'}₹${Math.abs(activeDisplayNet).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const formattedBookNet = `${bookNet >= 0 ? '+' : '-'}₹${Math.abs(bookNet).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const openingBal = data?.ledger?.openingBalance ?? 0;
  const adjustments = data?.ledger?.adjustments ?? 0;

  const trendBadge = data?.ledger?.previousPeriodComparison?.positionChange ?? '';
  const txCount = hasLiveTxs
    ? transactions.length
    : (data?.ledger?.transactionCount ?? (transactions.length || 0));

  const matchedCount = hasLiveTxs
    ? computedMatchedCount
    : (data?.ledger?.matchedCount ?? 0);

  const exceptionCount = txCount - matchedCount;
  const matchRate = txCount > 0 ? ((matchedCount / txCount) * 100).toFixed(1) : '0.0';

  const verifiedInflow = hasLiveTxs
    ? computedVerifiedInflow
    : (data?.settlement?.verifiedInflow ?? 0);

  const pendingSettlement = hasLiveTxs
    ? computedPendingSettlement
    : (data?.settlement?.pendingSettlement ?? 0);

  const settlementPercent = periodInflow > 0 ? ((verifiedInflow / periodInflow) * 100).toFixed(1) : '0.0';

  return (
    <div
      onClick={onNavigateLedger}
      className={`quixotic-card p-6 flex flex-col justify-between cursor-pointer group hover:border-emerald-300 transition-all relative ${
        justUpdated ? 'ring-2 ring-emerald-400 ring-offset-2 shadow-lg' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 tracking-tight group-hover:text-[#007A4D] transition-colors">
              Ledger Position
            </h3>
            {justUpdated && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 animate-bounce inline-flex items-center gap-1">
                <LightningBoltIcon className="w-3 h-3 text-[#007A4D]" />
                <span>Realtime Synced</span>
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            {balanceMode === 'reconciled' ? 'Audit verified & reconciled position' : 'Total net balance this period'}
          </p>
        </div>
        <ArrowUpRightIcon />
      </div>

      {/* Light Theme Controller Card Widget */}
      <div className="rounded-2xl bg-[#F0FAF5] border border-emerald-200/80 p-5 shadow-xs relative overflow-hidden mb-4">
        {/* Card Header with View Toggle */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="font-bold tracking-wider text-xs uppercase text-[#007A4D] font-mono">
              LEDGER AI
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Reconciled vs Book Balance Selector */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center bg-emerald-100/70 p-0.5 rounded-full text-[10px] font-sans font-semibold"
          >
            <button
              onClick={() => setBalanceMode('reconciled')}
              className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                balanceMode === 'reconciled'
                  ? 'bg-[#007A4D] text-white shadow-2xs font-bold'
                  : 'text-emerald-800 hover:text-emerald-950'
              }`}
              title="Verified inflow minus verified outflow"
            >
              Reconciled
            </button>
            <button
              onClick={() => setBalanceMode('book')}
              className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                balanceMode === 'book'
                  ? 'bg-[#007A4D] text-white shadow-2xs font-bold'
                  : 'text-emerald-800 hover:text-emerald-950'
              }`}
              title="Total recorded ledger inflow minus outflow"
            >
              Book Net
            </button>
          </div>
        </div>

        {/* Primary Reactive Amount Display */}
        <div className="my-2">
          <div className="text-xs text-gray-500 font-mono font-medium flex items-center justify-between mb-0.5">
            <span>{balanceMode === 'reconciled' ? 'Reconciled Balance' : 'Book Net Balance'}</span>
            <span className="text-[10px] font-semibold text-[#007A4D] bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200/60">
              {balanceMode === 'reconciled' ? `${settlementPercent}% Settled` : 'Unadjusted'}
            </span>
          </div>
          <div className={`text-2xl sm:text-3xl font-bold tracking-tight font-mono tabular-nums transition-colors duration-300 ${isPositive ? 'text-[#007A4D]' : 'text-gray-900'}`}>
            {formattedActiveNet}
          </div>
          {balanceMode === 'reconciled' && pendingSettlement > 0 && (
            <div className="text-[11px] font-mono text-amber-700 mt-1 flex items-center gap-1">
              <span>↳</span>
              <span>Pending Authorizations: ₹{pendingSettlement.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
        </div>

        {/* Real-time Status Strip */}
        <div className="flex items-center justify-between text-xs text-gray-500 font-mono pt-2 border-t border-emerald-100/70">
          <span className="tracking-wider flex items-center gap-1.5">
            <span>{txCount} Txs</span>
            <span className="text-gray-300">·</span>
            <span className="text-emerald-700 font-semibold">{matchedCount} Matched</span>
            <span className="text-emerald-600 bg-emerald-100/60 px-1.5 py-0.2 rounded text-[10px] font-bold">
              {matchRate}%
            </span>
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowBreakdown(prev => !prev);
            }}
            className="text-[11px] font-sans font-semibold text-[#007A4D] hover:text-[#005a39] flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs"
            title="Inspect mathematical breakdown"
          >
            <span>ⓘ</span>
            <span>{showBreakdown ? 'Hide Breakdown' : 'View Calculation'}</span>
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
            <span>{balanceMode === 'reconciled' ? 'Reconciled Position Breakdown' : 'Book Net Position Breakdown'}</span>
            <span className="text-[10px] text-emerald-700 font-semibold">Live Audit</span>
          </div>
          <div className="flex items-center justify-between py-0.5 text-gray-500">
            <span>Opening Balance</span>
            <span className="font-semibold text-gray-700">₹{openingBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          {balanceMode === 'reconciled' ? (
            <>
              <div className="flex items-center justify-between py-0.5 text-emerald-700">
                <span>Verified Settlement</span>
                <span className="font-semibold">+₹{verifiedInflow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between py-0.5 text-gray-700">
                <span>Verified Outflow</span>
                <span className="font-semibold">-₹{(periodOutflow - (data?.ledger?.disputedExpenses || computedDisputedExpenses || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-gray-200 font-bold text-gray-900">
                <span>Reconciled Position</span>
                <span className={reconciledNet >= 0 ? 'text-[#007A4D]' : 'text-gray-900'}>
                  {`${reconciledNet >= 0 ? '+' : '-'}₹${Math.abs(reconciledNet).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                </span>
              </div>
            </>
          ) : (
            <>
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
                <span>Book Net Position</span>
                <span className={bookNet >= 0 ? 'text-[#007A4D]' : 'text-gray-900'}>
                  {`${bookNet >= 0 ? '+' : '-'}₹${Math.abs(bookNet).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Period Inflow & Outflow Summary Bar */}
      <div className="pt-1">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>{balanceMode === 'reconciled' ? 'Verified Inflow / Outflow' : 'Period Inflow / Outflow'}</span>
          <span className="text-[10px] font-mono text-gray-500">
            Out: -₹{(balanceMode === 'reconciled'
              ? (periodOutflow - (data?.ledger?.disputedExpenses || computedDisputedExpenses || 0))
              : periodOutflow
            ).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900 font-mono tabular-nums">
            +₹{(balanceMode === 'reconciled' ? verifiedInflow : periodInflow).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
          {trendBadge && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#007A4D] border border-emerald-200/60">
              {trendBadge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── CARD 2: Reconciliation Rate & Dynamic Progress Visualization ───────
export function QuixoticBarChartCard({
  data,
  report,
  transactions = [],
  interval = 'weekly',
  onIntervalChange,
  onNavigateReports,
  onRunAgent,
  aiStatus = 'NOT_RUN',
  isRunning = false,
  loading,
}) {
  const [hoveredBar, setHoveredBar] = useState(null);

  if (loading && !data && (!transactions || transactions.length === 0)) return <CardSkeleton />;

  const hasLiveTxs = Array.isArray(transactions) && transactions.length > 0;
  let liveMatched = 0;
  if (hasLiveTxs) {
    for (const t of transactions) {
      const isException = (t.match_status === 'exception' || (t.flags && t.flags.length > 0)) &&
                          t.action_status !== 'approved' &&
                          t.action_status !== 'dismissed';
      if (!isException) liveMatched++;
    }
  }

  const isAnalyzed = data?.reconciliation?.isAnalyzed || (aiStatus === 'COMPLETED' && !isRunning);
  const totalCount = hasLiveTxs ? transactions.length : (data?.ledger?.transactionCount ?? (report?.summary?.total || 0));
  const matchedCount = hasLiveTxs ? liveMatched : (data?.reconciliation?.matched ?? (report?.summary?.matched || 0));
  const exceptionsCount = totalCount - matchedCount;
  const matchedRate = hasLiveTxs
    ? (totalCount > 0 ? `${((matchedCount / totalCount) * 100).toFixed(1)}%` : '0.0%')
    : (data?.reconciliation?.rate || report?.summary?.matchRate || '0.0%');
  const duration = data?.reconciliation?.durationSeconds || report?.summary?.durationSeconds || '0';

  // Real chart data from API
  const rawBars = data?.reconciliation?.chart || [];
  const hasHistoricalSeries = rawBars.length >= 2;

  return (
    <div
      onClick={isAnalyzed ? onNavigateReports : undefined}
      className={`quixotic-card p-6 flex flex-col justify-between group transition-all ${
        isAnalyzed ? 'cursor-pointer hover:border-emerald-300' : 'cursor-default'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#007A4D] flex items-center justify-center">
            <BarChartIcon className="w-4 h-4 text-[#007A4D]" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 tracking-tight group-hover:text-[#007A4D] transition-colors">
            Reconciliation Rate
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle pills - only show when historical data exists */}
          {isAnalyzed && hasHistoricalSeries && (
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
          )}
          {isAnalyzed && <ArrowUpRightIcon />}
        </div>
      </div>

      {/* State A: Running AI Pipeline */}
      {isRunning ? (
        <div className="py-6 flex flex-col items-center justify-center text-center my-auto">
          <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3">
            <span className="w-4 h-4 border-2 border-[#007A4D] border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="text-lg font-bold font-mono text-gray-900 mb-1">
            Reconciling Ledger…
          </div>
          <p className="text-xs text-gray-500 font-mono max-w-xs">
            Analyzing {totalCount} transactions across 5 agent stages
          </p>
        </div>
      ) : !isAnalyzed ? (
        /* State B: Not Run for This Period */
        <div className="py-5 flex flex-col justify-center my-auto">
          <div className="text-xl sm:text-2xl font-bold font-sans text-gray-400 tracking-tight">
            Not run for this period
          </div>
          <p className="text-xs text-gray-500 font-sans mt-1 mb-4 leading-relaxed">
            Reconciliation rate and counterparty matches will be calculated once AI execution runs.
          </p>
          {onRunAgent && (
            <div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRunAgent();
                }}
                className="px-4 py-2 rounded-full bg-[#007A4D] hover:bg-[#00603C] text-white text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <LightningBoltIcon className="w-3.5 h-3.5" />
                <span>Run AI Reconciliation</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* State C: Reconciled & Analyzed */
        <>
          {/* Explicit Relationship Display */}
          <div className="mb-2">
            <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-gray-900">
              {matchedRate}
            </div>
            <p className="text-xs text-gray-500 font-mono">
              {matchedCount} of {totalCount} transactions matched
            </p>
          </div>

          {/* Chart: Simple Line Graph */}
          {hasHistoricalSeries ? (
            <div className="my-3">
              <svg viewBox="0 0 300 100" className="w-full h-28">
                {/* Grid lines */}
                <line x1="0" y1="25" x2="300" y2="25" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="0" y1="50" x2="300" y2="50" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="0" y1="75" x2="300" y2="75" stroke="#f3f4f6" strokeWidth="1" />

                {/* Y-axis labels */}
                <text x="2" y="12" className="fill-gray-300" fontSize="7" fontFamily="monospace">100%</text>
                <text x="2" y="37" className="fill-gray-300" fontSize="7" fontFamily="monospace">75%</text>
                <text x="2" y="62" className="fill-gray-300" fontSize="7" fontFamily="monospace">50%</text>
                <text x="2" y="87" className="fill-gray-300" fontSize="7" fontFamily="monospace">25%</text>

                {/* Area fill */}
                <path
                  d={`${rawBars.map((b, i) => {
                    const x = (i / (rawBars.length - 1)) * 280 + 10;
                    const y = 100 - (b.rate * 0.9);
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')} L ${((rawBars.length - 1) / (rawBars.length - 1)) * 280 + 10} 100 L 10 100 Z`}
                  fill="url(#areaGradient)"
                />

                {/* Line */}
                <path
                  d={rawBars.map((b, i) => {
                    const x = (i / (rawBars.length - 1)) * 280 + 10;
                    const y = 100 - (b.rate * 0.9);
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#007A4D"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data points */}
                {rawBars.map((b, i) => {
                  const x = (i / (rawBars.length - 1)) * 280 + 10;
                  const y = 100 - (b.rate * 0.9);
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={b.active ? 4 : 3}
                      className={b.active ? 'fill-[#007A4D] stroke-white stroke-2' : 'fill-[#007A4D]'}
                    />
                  );
                })}

                {/* Gradient definition */}
                <defs>
                  <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#007A4D" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#007A4D" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
              </svg>

              {/* X-axis labels */}
              <div className="flex justify-between px-3 mt-1">
                {rawBars.map((b, i) => (
                  <span key={i} className={`text-[9px] font-bold font-mono ${b.active ? 'text-gray-900' : 'text-gray-400'}`}>
                    {b.label}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            /* Single-period progress bar */
            <div className="my-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="font-semibold text-gray-700">Reconciliation Progress</span>
                <span className="font-bold text-[#007A4D]">{matchedRate}</span>
              </div>

              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden flex">
                <div
                  className="bg-[#007A4D] h-full transition-all duration-500"
                  style={{ width: `${(matchedCount / Math.max(1, totalCount)) * 100}%` }}
                />
                {exceptionsCount > 0 && (
                  <div
                    className="bg-red-400 h-full transition-all duration-500"
                    style={{ width: `${(exceptionsCount / Math.max(1, totalCount)) * 100}%` }}
                  />
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-gray-500 mt-2">
                <span className="inline-flex items-center gap-1">
                  <CheckIcon className="w-3 h-3 text-emerald-600" />
                  <span>{matchedCount} Matched</span>
                </span>
                <span className="text-red-600 inline-flex items-center gap-1">
                  <AlertTriangleIcon className="w-3 h-3 text-red-600" />
                  <span>{exceptionsCount} Exceptions</span>
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Accuracy & Throughput Metrics Footer */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] font-mono">
        {isAnalyzed ? (
          <>
            <span className="text-[#007A4D] font-bold inline-flex items-center gap-1">
              <CheckIcon className="w-3 h-3 text-[#007A4D]" />
              <span>{matchedCount} Matched</span>
            </span>
            <span className="text-red-600 font-bold inline-flex items-center gap-1">
              <AlertTriangleIcon className="w-3 h-3 text-red-600" />
              <span>{exceptionsCount} Exceptions</span>
            </span>
            <span className="text-gray-400">{duration}s run</span>
          </>
        ) : (
          <>
            <span className="text-gray-400">Status: Unanalyzed</span>
            <span className="text-gray-500">{totalCount} Transactions</span>
          </>
        )}
      </div>
    </div>
  );
}

// ── CARD 3: Settlement Funds & Wave Area Chart ──────────────────────────
export function QuixoticBalanceCard({
  data,
  summary,
  transactions = [],
  onRunAgent,
  isRunning,
  onViewSettlements,
  onExport,
  loading,
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (loading && !data && (!transactions || transactions.length === 0)) return <CardSkeleton />;

  const hasLiveTxs = Array.isArray(transactions) && transactions.length > 0;
  let liveVerified = 0;
  let liveInflow = 0;
  let livePending = 0;

  if (hasLiveTxs) {
    for (const t of transactions) {
      const isException = (t.match_status === 'exception' || (t.flags && t.flags.length > 0)) &&
                          t.action_status !== 'approved' &&
                          t.action_status !== 'dismissed';
      if (t.type === 'income') {
        liveInflow += t.amount;
        if (!isException) liveVerified += t.amount;
        else livePending += t.amount;
      }
    }
  }

  const verified = hasLiveTxs
    ? liveVerified
    : (data?.settlement?.verifiedInflow !== undefined ? data.settlement.verifiedInflow : 0);

  const totalInflow = hasLiveTxs
    ? liveInflow
    : (data?.ledger?.inflow !== undefined ? data.ledger.inflow : (summary?.totalIncome || 0));

  const pending = hasLiveTxs
    ? livePending
    : (data?.settlement?.pendingSettlement !== undefined ? data.settlement.pendingSettlement : 0);

  const formattedVerified = verified.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const formattedInflow = totalInflow.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const formattedPending = pending.toLocaleString('en-IN', { minimumFractionDigits: 2 });

  // Generate dynamic wave SVG path from actual cumulative inflow trajectory
  const chartPoints = data?.settlement?.chart || [];
  let pathD = "M 10 80 L 390 80";
  let fillD = "M 10 80 L 390 80 L 390 120 L 10 120 Z";
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
            if (onViewSettlements) onViewSettlements();
          }}
          className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-[#007A4D] border border-emerald-200/90 py-2.5 rounded-full text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>View Settlements</span>
          <span>→</span>
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
        <CheckIcon className="w-3 h-3 text-emerald-600" />
        Reconciled
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
          Authorization Required
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
        <AlertTriangleIcon className="w-3 h-3 text-red-600" />
        Exception
      </span>
    );
  }

  if (actionStatus === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        Pending
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#007A4D] border border-emerald-200">
      <CheckIcon className="w-3 h-3 text-[#007A4D]" />
      Reconciled
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

  const displayTx = (transactions.length > 0 ? transactions : (data?.recentTransactions || [])).slice(0, 6);

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
  if (loading && !data && (!transactions || transactions.length === 0)) return <CardSkeleton />;

  const hasLiveTxs = Array.isArray(transactions) && transactions.length > 0;
  let liveExposure = 0;
  let liveCount = 0;
  const liveSeverity = {
    high: { count: 0, amount: 0 },
    medium: { count: 0, amount: 0 },
    low: { count: 0, amount: 0 },
  };

  const vendorPalette = [
    { prefix: 'aws', badge: 'AWS', color: '#FF9900' },
    { prefix: 'facebook', badge: 'FB', color: '#1877F2' },
    { prefix: 'gamma', badge: 'GM', color: '#9333EA' },
    { prefix: 'acme', badge: 'AC', color: '#007A4D' },
    { prefix: 'theta', badge: 'TH', color: '#0D9488' },
    { prefix: 'xi', badge: 'XI', color: '#4F46E5' },
    { prefix: 'upsilon', badge: 'UP', color: '#D97706' },
  ];
  const liveVendorMap = new Map();

  if (hasLiveTxs) {
    for (const t of transactions) {
      const isException = (t.match_status === 'exception' || (t.flags && t.flags.length > 0)) &&
                          t.action_status !== 'approved' &&
                          t.action_status !== 'dismissed';
      if (isException) {
        liveCount++;
        const amt = Math.abs(t.amount || 0);
        liveExposure += amt;
        if (amt >= 10000 || t.exception_type === 'spend_anomaly') {
          liveSeverity.high.count++;
          liveSeverity.high.amount += amt;
        } else if (amt >= 5000) {
          liveSeverity.medium.count++;
          liveSeverity.medium.amount += amt;
        } else {
          liveSeverity.low.count++;
          liveSeverity.low.amount += amt;
        }

        const key = (t.description || '').trim();
        if (key && !liveVendorMap.has(key)) {
          const lower = key.toLowerCase();
          const matchedMeta = vendorPalette.find(p => lower.includes(p.prefix)) || {
            badge: (t.description.replace(/[^A-Za-z]/g, '').slice(0, 2) || 'TX').toUpperCase(),
            color: '#64748B',
          };
          liveVendorMap.set(key, {
            name: t.description,
            badge: matchedMeta.badge,
            color: matchedMeta.color,
            count: 1,
          });
        } else if (key) {
          liveVendorMap.get(key).count++;
        }
      }
    }
  }

  const exposure = hasLiveTxs
    ? liveExposure
    : (data?.discrepancies?.exposure !== undefined ? data.discrepancies.exposure : 0);

  const count = hasLiveTxs
    ? liveCount
    : (data?.discrepancies?.count !== undefined ? data.discrepancies.count : 0);

  const formattedVal = exposure.toLocaleString('en-IN', { minimumFractionDigits: 2 });

  const severity = hasLiveTxs
    ? liveSeverity
    : (data?.discrepancies?.severity || {
        high: { count: 0, amount: 0 },
        medium: { count: 0, amount: 0 },
        low: { count: 0, amount: 0 },
      });

  const vendors = hasLiveTxs && liveVendorMap.size > 0
    ? Array.from(liveVendorMap.values())
    : (data?.discrepancies?.flaggedVendors || []);

  return (
    <div
      onClick={onViewExceptions}
      className="quixotic-card p-6 flex flex-col justify-between cursor-pointer group hover:border-emerald-300 transition-all"
    >
      {/* Top Half: Discrepancy Exposure */}
      <div className="border-b border-gray-100 pb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-xs">
            <CreditCardIcon className="w-4 h-4 text-gray-600" />
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
