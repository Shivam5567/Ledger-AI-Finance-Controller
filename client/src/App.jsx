import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Layout from './components/Layout';
import { SparklesIcon, AlertTriangleIcon, CalendarIcon } from './components/Icons';
import { QuixoticTopNav, QuixoticHeaderRow } from './components/QuixoticNavigation';
import {
  QuixoticCardWidget,
  QuixoticBarChartCard,
  QuixoticBalanceCard,
  QuixoticPaymentHistoryCard,
  QuixoticCreditAndExceptionsCard,
} from './components/QuixoticDashboardCards';
import TransactionDetailModal from './components/TransactionDetailModal';
import EmptyState from './components/EmptyState';
import AgentTraceInline from './components/AgentTraceInline';
import ReportPanel from './components/ReportPanel';
import ForecastCard from './components/ForecastCard';
import TransactionTable from './components/TransactionTable';
import ExceptionsPage from './components/ExceptionsPage';
import SettingsPage from './components/SettingsPage';
import SettlementPanel from './components/SettlementPanel';
import {
  useTransactions,
  useSummary,
  useDashboard,
  useIngest,
  useUpload,
  useRunAgent,
  useAction,
  useExport,
} from './hooks/useApi';

export default function App() {
  const [activeTab, setActiveTab]         = useState('dashboard');
  const [hasIngested, setHasIngested]     = useState(false);
  const [agentStage, setAgentStage]       = useState(null);
  const [agentProgress, setAgentProgress] = useState(0);
  const [agentResult, setAgentResult]     = useState(null);
  const [chatOpen, setChatOpen]           = useState(false);
  const [copilotContextPrompt, setCopilotContextPrompt] = useState(null);
  const [reportData, setReportData]       = useState(null);
  const [isRefreshing, setIsRefreshing]   = useState(false);
  const [showRunConfirm, setShowRunConfirm] = useState(false);
  const isPipelineRunningRef              = useRef(false);

  // Separate Date Range & Transaction Status filter state
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
    label: '',
  });
  const [statusFilter, setStatusFilter]         = useState('all');
  const [interval, setIntervalState]             = useState('weekly');
  const [exceptionsFilter, setExceptionsFilter] = useState('all');

  // Transaction Detail Modal state
  const [selectedTx, setSelectedTx]               = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { transactions, setTransactions, loading: isTxLoading, refetch: refetchTx } = useTransactions();
  const { summary,      refetch: refetchSummary } = useSummary();
  const {
    data: dashboardData,
    loading: isDashboardLoading,
    error: dashboardError,
    lastSyncedAt,
    refetch: refetchDashboard,
  } = useDashboard({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    interval,
    status: statusFilter,
  });

  const { ingest, loading: isIngesting }          = useIngest();
  const { upload, loading: isUploading }          = useUpload();
  const { approve, dismiss, reset }               = useAction();
  const { exportCsv }                             = useExport();

  // Fetch report data for reconciliation stats
  const fetchReport = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/report`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (e) {
      console.warn('[Report] Fetch warning:', e?.message || e);
    }
  }, []);

  const refetchAll = useCallback(async () => {
    await Promise.all([
      refetchDashboard(),
      refetchTx(),
      refetchSummary(),
      fetchReport(),
    ]);
  }, [refetchDashboard, refetchTx, refetchSummary, fetchReport]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchAll();
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refetchTx();
    refetchSummary();
    fetchReport();
    refetchDashboard();
  }, [refetchTx, refetchSummary, fetchReport, refetchDashboard]);

  // Real-time automatic background syncing and window focus refresher
  useEffect(() => {
    const handleFocus = () => {
      refetchAll();
    };
    window.addEventListener('focus', handleFocus);

    const syncInterval = setInterval(() => {
      if (!document.hidden && !isPipelineRunningRef.current) {
        refetchAll();
      }
    }, 12000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(syncInterval);
    };
  }, [refetchAll]);

  // Mark ingested if database has transactions (NO automatic AI run triggers!)
  useEffect(() => {
    if (transactions.length > 0) {
      setHasIngested(true);
    }
  }, [transactions]);

  // Derive whether the database has any data at all
  const hasData = transactions.length > 0;

  const handleProgress = (data) => {
    setAgentStage(data.stage);
    setAgentProgress(data.progress);

    if (data.stage === 'complete') {
      setAgentResult(data);
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        setTransactions(data.data);
      }
      refetchAll();
    } else if (data.stage === 'error') {
      setAgentStage('error');
    }
  };

  const { runAgent, isRunning } = useRunAgent(handleProgress);

  // Derive explicit AI status machine: 'NOT_RUN' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  const aiStatus = isRunning
    ? 'RUNNING'
    : agentStage === 'error'
    ? 'FAILED'
    : agentResult
    ? 'COMPLETED'
    : (dashboardData?.aiReconciliation?.status || 'NOT_RUN');

  const latestRun = dashboardData?.aiReconciliation?.latestRun || null;

  const handleIngest = async () => {
    try {
      await ingest();
      setHasIngested(true);
      setAgentResult(null);
      setAgentStage(null);
      await refetchAll();
    } catch (e) {
      console.error('[Ingest] Ingestion error:', e?.message || e);
    }
  };

  const handleUpload = async (csvContent) => {
    try {
      await upload(csvContent);
      setHasIngested(true);
      setAgentResult(null);
      setAgentStage(null);
      await refetchAll();
    } catch (e) {
      console.error('[Upload] Upload error:', e?.message || e);
    }
  };

  const handleRunAgent = async () => {
    if (isRunning || isPipelineRunningRef.current) return;
    // Show confirmation if AI has already been completed for this period
    if (aiStatus === 'COMPLETED' && !showRunConfirm) {
      setShowRunConfirm(true);
      return;
    }
    setShowRunConfirm(false);
    isPipelineRunningRef.current = true;
    setAgentStage('ingest');
    setAgentResult(null);
    try {
      await runAgent({
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
      });
      await refetchAll();
    } catch (err) {
      console.error('[Pipeline] Execution error:', err?.message || err);
      setAgentStage('error');
    } finally {
      isPipelineRunningRef.current = false;
    }
  };

  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
    // Clear transient in-memory run result so the new date range's backend status is queried
    setAgentResult(null);
    setAgentStage(null);
  };

  const handleExplainWithCopilot = (tx) => {
    if (!tx) return;
    const explanation = tx.anomaly_explanation || (tx.flags?.length ? `Flagged with ${tx.flags.join(', ')}` : 'Standard transaction');
    const prompt = `Can you analyze transaction #${tx.id} (${tx.description} for ₹${Math.abs(tx.amount).toLocaleString('en-IN')})? Status: ${tx.match_status || 'unmatched'}. Reason: ${explanation}. What action should be taken?`;
    setCopilotContextPrompt(prompt);
    setChatOpen(true);
  };

  const handleApprove = async (id) => {
    // Optimistic instant real-time update
    setTransactions(prev => prev.map(t => (t.id === id || t.id === Number(id)) ? {
      ...t,
      action_status: 'approved',
      match_status: 'matched',
      resolved_at: new Date().toISOString()
    } : t));
    await approve(id);
    await refetchAll();
  };

  const handleDismiss = async (id) => {
    // Optimistic instant real-time update
    setTransactions(prev => prev.map(t => (t.id === id || t.id === Number(id)) ? {
      ...t,
      action_status: 'dismissed',
      match_status: 'matched',
      resolved_at: new Date().toISOString()
    } : t));
    await dismiss(id);
    await refetchAll();
  };

  const handleReset = async (id) => {
    // Optimistic instant real-time update
    setTransactions(prev => prev.map(t => (t.id === id || t.id === Number(id)) ? {
      ...t,
      action_status: 'pending',
      match_status: 'exception',
      resolved_at: null
    } : t));
    await reset(id);
    await refetchAll();
  };

  // Calculate exception count for header/dock badge in real time
  const unresolvedExceptionCount = transactions.filter(
    (t) =>
      ((t.flags && t.flags.length > 0) || t.match_status === 'exception') &&
      t.action_status !== 'approved' &&
      t.action_status !== 'dismissed'
  ).length;

  // Transactions list honoring active date and status filters in real time
  const currentFilteredTransactions = useMemo(() => {
    let list = (transactions && transactions.length > 0) ? transactions : (dashboardData?.allTransactions || []);
    if (!list || list.length === 0) return [];

    if (dateRange?.startDate) {
      list = list.filter(t => t.date >= dateRange.startDate);
    }
    if (dateRange?.endDate) {
      list = list.filter(t => t.date <= dateRange.endDate);
    }

    if (statusFilter === 'reconciled' || statusFilter === 'matched') {
      list = list.filter(t => {
        const isException = (t.match_status === 'exception' || (t.flags && t.flags.length > 0)) &&
                            t.action_status !== 'approved' &&
                            t.action_status !== 'dismissed';
        return !isException;
      });
    } else if (statusFilter === 'exceptions' || statusFilter === 'exception') {
      list = list.filter(t => {
        const isException = (t.match_status === 'exception' || (t.flags && t.flags.length > 0)) &&
                            t.action_status !== 'approved' &&
                            t.action_status !== 'dismissed';
        return isException;
      });
    } else if (statusFilter === 'pending') {
      list = list.filter(t => t.action_status === 'pending');
    }

    return list;
  }, [transactions, dashboardData?.allTransactions, dateRange?.startDate, dateRange?.endDate, statusFilter]);

  // Live Settlement Metrics for realtime view in Settlements tab
  const liveSettlementMetrics = useMemo(() => {
    let verified = 0;
    let totalIn = 0;
    let pending = 0;
    for (const t of currentFilteredTransactions) {
      if (t.type === 'income') {
        totalIn += t.amount;
        const isExc = (t.match_status === 'exception' || (t.flags && t.flags.length > 0)) &&
                      t.action_status !== 'approved' &&
                      t.action_status !== 'dismissed';
        if (isExc) pending += t.amount;
        else verified += t.amount;
      }
    }
    return {
      verified: currentFilteredTransactions.length > 0 ? verified : (dashboardData?.settlement?.verifiedInflow ?? 0),
      totalInflow: currentFilteredTransactions.length > 0 ? totalIn : (dashboardData?.ledger?.inflow ?? 0),
      pending: currentFilteredTransactions.length > 0 ? pending : (dashboardData?.settlement?.pendingSettlement ?? 0),
    };
  }, [currentFilteredTransactions, dashboardData]);

  return (
    <Layout
      topnav={
        <QuixoticTopNav
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'exceptions') setExceptionsFilter('all');
            setActiveTab(tab);
          }}
          exceptionCount={unresolvedExceptionCount}
          onToggleChat={() => {
            setCopilotContextPrompt(null);
            setChatOpen(prev => !prev);
          }}
        />
      }
      headerRow={
        hasIngested && (
          <QuixoticHeaderRow
            onRunAgent={handleRunAgent}
            isRunning={isRunning}
            aiStatus={aiStatus}
            txCount={dashboardData?.ledger?.transactionCount ?? transactions.length}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            statusFilter={statusFilter}
            onStatusFilterChange={(newStatus) => setStatusFilter(newStatus)}
            lastSyncedAt={lastSyncedAt}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
        )
      }
    >
      {/* ── 1. Empty State (when no transactions loaded at all) ── */}
      {!hasIngested && !isTxLoading ? (
        <EmptyState onIngest={handleIngest} onUpload={handleUpload} isIngesting={isIngesting} isUploading={isUploading} />
      ) : hasData && aiStatus === 'NOT_RUN' ? (
        /* ── 2. Pending AI Reconciliation (data exists, AI not yet run) ── */
        <div className="flex flex-col items-center justify-center py-20 px-6 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-5">
            <SparklesIcon className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            AI Reconciliation Required
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md text-center leading-relaxed">
            {transactions.length} transactions found in the ledger. Run AI reconciliation to
            categorize, detect anomalies, and generate recommended actions.
          </p>
          <button
            onClick={handleRunAgent}
            disabled={isRunning}
            className="px-6 py-3 rounded-full bg-[#007A4D] hover:bg-[#00603C] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold shadow-md transition-colors cursor-pointer"
          >
            {isRunning ? 'Running...' : 'Run AI Reconciliation'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6 animate-fade-in pb-12">
          {/* ── Error Banner (if API fetch fails) ── */}
          {dashboardError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangleIcon className="w-4 h-4 text-red-600 shrink-0" />
                <span>Failed to load live dashboard data: {dashboardError}</span>
              </div>
              <button
                onClick={refetchAll}
                className="px-3 py-1 bg-white border border-red-300 rounded-full font-semibold hover:bg-red-100 transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* ── Compact Collapsible AI Activity Panel ── */}
          <AgentTraceInline
            currentStage={agentStage}
            isRunning={isRunning}
            agentResult={agentResult}
            aiStatus={aiStatus}
            latestRun={latestRun}
            onRunAgent={handleRunAgent}
            txCount={dashboardData?.ledger?.transactionCount ?? transactions.length}
            onViewAnomalies={() => {
              setExceptionsFilter('spend_anomaly');
              setActiveTab('exceptions');
            }}
            onViewActions={() => {
              setExceptionsFilter('all');
              setActiveTab('exceptions');
            }}
          />

          {/* ── Empty State for Selected Filter Range with 0 Transactions ── */}
          {dashboardData && dashboardData.recentTransactions?.length === 0 && (
            <div className="p-6 rounded-2xl bg-amber-50/80 border border-amber-200 text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 mb-2">
                <CalendarIcon className="w-5 h-5 text-amber-700" />
              </div>
              <h4 className="text-sm font-bold text-amber-900 mb-1">
                No transactions found for the selected filters
              </h4>
              <p className="text-xs text-amber-700 mb-3 max-w-md">
                There are no ledger entries matching status "{statusFilter}" between {dateRange.startDate || 'start'} and {dateRange.endDate || 'end'}.
              </p>
              <button
                onClick={() => {
                  setDateRange({ startDate: '', endDate: '', label: '' });
                  setStatusFilter('all');
                }}
                className="px-4 py-2 rounded-full bg-white border border-amber-300 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition-colors cursor-pointer shadow-xs"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* ── VIEW: Dashboard (Exact 5-Card Layout from Reference Image) ── */}
          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-6">
              {/* Row 1: 3 Top Cards (Ledger Position, Bar Chart, Wave Balance Card) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Card 1: Ledger Position */}
                <QuixoticCardWidget
                  data={dashboardData}
                  summary={summary}
                  transactions={currentFilteredTransactions}
                  loading={isDashboardLoading}
                  onNavigateLedger={() => setActiveTab('transactions')}
                />

                {/* Card 2: Reconciliation Rate Bar Chart with hatched bars */}
                <QuixoticBarChartCard
                  data={dashboardData}
                  report={reportData}
                  transactions={currentFilteredTransactions}
                  interval={interval}
                  onIntervalChange={setIntervalState}
                  onNavigateReports={() => setActiveTab('reports')}
                  onRunAgent={handleRunAgent}
                  aiStatus={aiStatus}
                  isRunning={isRunning}
                  loading={isDashboardLoading}
                />

                {/* Card 3: Settlement Funds & Wave Area Chart */}
                <QuixoticBalanceCard
                  data={dashboardData}
                  summary={summary}
                  transactions={currentFilteredTransactions}
                  onRunAgent={handleRunAgent}
                  isRunning={isRunning}
                  onViewSettlements={() => setActiveTab('settlements')}
                  onExport={() => exportCsv({ startDate: dateRange.startDate, endDate: dateRange.endDate, status: 'reconciled' })}
                  loading={isDashboardLoading}
                />
              </div>

              {/* Row 2: Payment History Table (2 cols) + Credit & Exceptions Card (1 col) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Card 4: Payment History (Spans 2 columns on large screens) */}
                <div className="lg:col-span-2">
                  <QuixoticPaymentHistoryCard
                    data={dashboardData}
                    transactions={currentFilteredTransactions}
                    loading={isDashboardLoading}
                    onRowClick={(tx) => {
                      setSelectedTx(tx);
                      setIsDetailModalOpen(true);
                    }}
                    onViewAll={() => setActiveTab('transactions')}
                  />
                </div>

                {/* Card 5: Discrepancy Exposure & Exceptions Stack */}
                <div className="lg:col-span-1">
                  <QuixoticCreditAndExceptionsCard
                    data={dashboardData}
                    transactions={currentFilteredTransactions}
                    loading={isDashboardLoading}
                    onViewExceptions={() => {
                      setExceptionsFilter('all');
                      setActiveTab('exceptions');
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── VIEW: Reconciliation / Reports ── */}
          {(activeTab === 'reports' || activeTab === 'reconciliation') && (
            <div className="flex flex-col gap-6 max-w-5xl animate-fade-in">
              <ReportPanel
                initialReport={reportData}
                hasRunAgent={aiStatus === 'COMPLETED'}
                isRunning={isRunning}
                onRunAgent={handleRunAgent}
                onExport={() => exportCsv({ startDate: dateRange.startDate, endDate: dateRange.endDate, status: 'reconciled' })}
                onViewExceptions={() => {
                  setExceptionsFilter('all');
                  setActiveTab('exceptions');
                }}
              />
              <ForecastCard summary={summary} />
            </div>
          )}

          {/* ── VIEW: Settlements ── */}
          {activeTab === 'settlements' && (
            <div className="flex flex-col gap-6 max-w-5xl animate-fade-in">
              <div className="quixotic-card p-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Settlement Trajectory</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Verified inflow settlements vs authorizations in review
                    </p>
                  </div>
                  <button
                    onClick={() => exportCsv({ startDate: dateRange.startDate, endDate: dateRange.endDate, status: 'reconciled' })}
                    className="px-4 py-2 rounded-full bg-[#007A4D] hover:bg-[#00603C] text-white text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Export Settlement Ledger CSV
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                    <span className="text-xs text-emerald-800 font-mono block">Verified Settlement</span>
                    <span className="text-2xl font-bold text-[#007A4D] font-mono mt-1 block">
                      ₹{liveSettlementMetrics.verified.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                    <span className="text-xs text-gray-500 font-mono block">Total Inflow</span>
                    <span className="text-2xl font-bold text-gray-900 font-mono mt-1 block">
                      ₹{liveSettlementMetrics.totalInflow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                    <span className="text-xs text-amber-800 font-mono block">Pending Authorization</span>
                    <span className="text-2xl font-bold text-amber-800 font-mono mt-1 block">
                      ₹{liveSettlementMetrics.pending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono mb-3">
                  Settlement Inflow Activity
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-100 pb-2">
                        <th className="pb-2.5">Date</th>
                        <th className="pb-2.5">Description</th>
                        <th className="pb-2.5">Status</th>
                        <th className="pb-2.5 text-right">Inflow Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {currentFilteredTransactions.filter(t => t.type === 'income').map(t => {
                        const isExc = t.match_status === 'exception' || (t.flags && t.flags.length > 0);
                        return (
                          <tr key={t.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedTx(t); setIsDetailModalOpen(true); }}>
                            <td className="py-2.5 text-gray-600">{t.date}</td>
                            <td className="py-2.5 font-sans font-semibold text-gray-900">{t.description}</td>
                            <td className="py-2.5">
                              {isExc ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                                  Pending Authorization
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                                  Verified Settlement
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 text-right font-bold text-gray-900">+₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── VIEW: Documents / Transactions Ledger ── */}
          {activeTab === 'transactions' && (
            <div className="animate-fade-in">
              <TransactionTable
                transactions={currentFilteredTransactions}
                onApprove={handleApprove}
                onDismiss={handleDismiss}
                onReset={handleReset}
              />
            </div>
          )}

          {/* ── VIEW: Exceptions Queue ── */}
          {activeTab === 'exceptions' && (
            <ExceptionsPage
              transactions={currentFilteredTransactions}
              onApprove={handleApprove}
              onDismiss={handleDismiss}
              onReset={handleReset}
              onAnalyzeWithCopilot={handleExplainWithCopilot}
              initialFilter={exceptionsFilter}
              onRunAgent={handleRunAgent}
              isRunning={isRunning}
              aiStatus={aiStatus}
            />
          )}

          {/* ── VIEW: Forecast ── */}
          {activeTab === 'forecast' && (
            <div className="flex flex-col gap-6 max-w-4xl animate-fade-in">
              <ForecastCard summary={summary} />
            </div>
          )}

          {/* ── VIEW: Settings ── */}
          {activeTab === 'settings' && (
            <SettingsPage
              onIngest={handleIngest}
              isIngesting={isIngesting}
              onUpload={handleUpload}
              isUploading={isUploading}
              onExport={exportCsv}
              onRefresh={handleRefresh}
              txCount={transactions.length}
            />
          )}
        </div>
      )}

      {/* ── Run Again Confirmation Dialog ── */}
      {showRunConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-gray-200">
            <h3 className="text-base font-bold text-gray-900 mb-2">Re-run AI Reconciliation?</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              This will re-analyze the transactions for the selected period.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowRunConfirm(false)}
                className="px-4 py-2 rounded-full text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRunAgent}
                className="px-4 py-2 rounded-full text-sm font-semibold text-white bg-[#007A4D] hover:bg-[#00603C] transition-colors cursor-pointer"
              >
                Run Reconciliation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Slide-in Ledger Copilot Drawer ── */}
      <SettlementPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        contextPrompt={copilotContextPrompt}
        onClearContext={() => setCopilotContextPrompt(null)}
      />

      {/* ── Rich Transaction Detail & Action Authorization Modal ── */}
      <TransactionDetailModal
        transaction={selectedTx}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTx(null);
        }}
        onApprove={async (id) => {
          await handleApprove(id);
          setIsDetailModalOpen(false);
          setSelectedTx(null);
        }}
        onDismiss={async (id) => {
          await handleDismiss(id);
          setIsDetailModalOpen(false);
          setSelectedTx(null);
        }}
        onExplainWithCopilot={handleExplainWithCopilot}
      />

      {/* ── Persistent Floating Copilot Trigger ── */}
      {!chatOpen && (
        <button
          onClick={() => {
            setCopilotContextPrompt(null);
            setChatOpen(true);
          }}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-emerald-950 hover:bg-black text-white text-xs font-semibold shadow-xl hover:shadow-2xl transition-all cursor-pointer border border-emerald-500/40 group hover:scale-105 active:scale-95 animate-fade-in"
          title="Open Ledger AI Copilot (Natural Language Assistant)"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <SparklesIcon className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
          </div>
          <span className="font-semibold tracking-tight">Ask Copilot</span>
          {unresolvedExceptionCount > 0 && (
            <span
              className="px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300"
              title={`${unresolvedExceptionCount} unresolved exceptions`}
            >
              {unresolvedExceptionCount}
            </span>
          )}
        </button>
      )}
    </Layout>
  );
}
