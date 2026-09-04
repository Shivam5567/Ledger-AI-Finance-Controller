import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import { QuixoticTopNav, QuixoticDock, QuixoticHeaderRow } from './components/QuixoticNavigation';
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
  useRunAgent,
  useAction,
  useExport,
} from './hooks/useApi';

export default function App() {
  const [activeTab, setActiveTab]         = useState('dashboard');
  const [hasIngested, setHasIngested]     = useState(false);
  const [hasRunAgent, setHasRunAgent]     = useState(false);
  const [agentStage, setAgentStage]       = useState(null);
  const [agentProgress, setAgentProgress] = useState(0);
  const [agentResult, setAgentResult]     = useState(null);
  const [chatOpen, setChatOpen]           = useState(false);
  const [reportData, setReportData]       = useState(null);
  const [isRefreshing, setIsRefreshing]   = useState(false);

  // Separate Date Range & Transaction Status filter state
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
    label: '01 Jul – 04 Aug 2026',
  });
  const [statusFilter, setStatusFilter]         = useState('all');
  const [interval, setIntervalState]             = useState('weekly');
  const [exceptionsFilter, setExceptionsFilter] = useState('all');

  // Transaction Detail Modal state
  const [selectedTx, setSelectedTx]               = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { transactions, refetch: refetchTx }     = useTransactions();
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
  const { approve, dismiss, reset }               = useAction();
  const { exportCsv }                             = useExport();

  // Fetch report data for reconciliation stats
  const fetchReport = useCallback(async () => {
    try {
      const res = await fetch('/api/report');
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (e) {
      console.warn('Report fetch error:', e);
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

  useEffect(() => {
    if (transactions.length > 0) {
      setHasIngested(true);
      const hasCategories = transactions.some(t => t.category);
      if (hasCategories) {
        setHasRunAgent(true);
      }
    }
  }, [transactions]);

  const handleProgress = (data) => {
    setAgentStage(data.stage);
    setAgentProgress(data.progress);

    if (data.stage === 'complete') {
      setAgentResult(data);
      setHasRunAgent(true);
      refetchAll();
    }
  };

  const { runAgent, isRunning } = useRunAgent(handleProgress);

  const handleIngest = async () => {
    try {
      await ingest();
      setHasIngested(true);
      setHasRunAgent(false);
      setAgentResult(null);
      setAgentStage(null);
      await refetchAll();
    } catch (e) {
      console.error('Ingest error:', e);
    }
  };

  const handleRunAgent = () => {
    setAgentStage('ingest');
    setAgentResult(null);
    runAgent();
  };

  const handleApprove = async (id) => {
    await approve(id);
    await refetchAll();
  };

  const handleDismiss = async (id) => {
    await dismiss(id);
    await refetchAll();
  };

  const handleReset = async (id) => {
    await reset(id);
    await refetchAll();
  };

  // Calculate exception count for header/dock badge
  const unresolvedExceptionCount = dashboardData?.discrepancies?.count !== undefined
    ? dashboardData.discrepancies.count
    : transactions.filter(
        (t) =>
          ((t.flags && t.flags.length > 0) || t.match_status === 'exception') &&
          t.action_status !== 'approved' &&
          t.action_status !== 'dismissed'
      ).length;

  // Transactions list honoring active date and status filters
  const currentFilteredTransactions = dashboardData?.allTransactions || transactions;

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
          onToggleChat={() => setChatOpen(prev => !prev)}
        />
      }
      dock={
        <QuixoticDock
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'exceptions') setExceptionsFilter('all');
            setActiveTab(tab);
          }}
          onToggleChat={() => setChatOpen(prev => !prev)}
          exceptionCount={unresolvedExceptionCount}
        />
      }
      headerRow={
        hasIngested && (
          <QuixoticHeaderRow
            onRunAgent={handleRunAgent}
            isRunning={isRunning}
            txCount={dashboardData?.ledger?.transactionCount ?? transactions.length}
            onToggleChat={() => setChatOpen(true)}
            dateRange={dateRange}
            onDateRangeChange={(newRange) => setDateRange(newRange)}
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
      {!hasIngested ? (
        <EmptyState onIngest={handleIngest} isIngesting={isIngesting} />
      ) : (
        <div className="flex flex-col gap-6 animate-fade-in pb-12">
          {/* ── Error Banner (if API fetch fails) ── */}
          {dashboardError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
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
          {(isRunning || agentResult || agentStage) && (
            <AgentTraceInline
              currentStage={agentStage}
              isRunning={isRunning}
              agentResult={agentResult}
              txCount={dashboardData?.ledger?.transactionCount ?? (transactions.length || 55)}
              onViewAnomalies={() => {
                setExceptionsFilter('spend_anomaly');
                setActiveTab('exceptions');
              }}
              onViewActions={() => {
                setExceptionsFilter('all');
                setActiveTab('exceptions');
              }}
            />
          )}

          {/* ── Empty State for Selected Filter Range with 0 Transactions ── */}
          {dashboardData && dashboardData.recentTransactions?.length === 0 && (
            <div className="p-6 rounded-2xl bg-amber-50/80 border border-amber-200 text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-lg mb-2">
                📅
              </div>
              <h4 className="text-sm font-bold text-amber-900 mb-1">
                No transactions found for the selected filters
              </h4>
              <p className="text-xs text-amber-700 mb-3 max-w-md">
                There are no ledger entries matching status "{statusFilter}" between {dateRange.startDate || 'start'} and {dateRange.endDate || 'end'}.
              </p>
              <button
                onClick={() => {
                  setDateRange({ startDate: '', endDate: '', label: '01 Jul – 04 Aug 2026' });
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
                  transactions={transactions}
                  loading={isDashboardLoading}
                  onNavigateLedger={() => setActiveTab('transactions')}
                />

                {/* Card 2: Reconciliation Rate Bar Chart with hatched bars */}
                <QuixoticBarChartCard
                  data={dashboardData}
                  report={reportData}
                  interval={interval}
                  onIntervalChange={setIntervalState}
                  onNavigateReports={() => setActiveTab('reports')}
                  loading={isDashboardLoading}
                />

                {/* Card 3: Settlement Funds & Wave Area Chart */}
                <QuixoticBalanceCard
                  data={dashboardData}
                  summary={summary}
                  onRunAgent={handleRunAgent}
                  isRunning={isRunning}
                  onToggleChat={() => setChatOpen(true)}
                  onExport={() => exportCsv({ startDate: dateRange.startDate, endDate: dateRange.endDate, status: 'matched' })}
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
            <div className="flex flex-col gap-6 max-w-5xl">
              <ReportPanel
                hasRunAgent={hasRunAgent}
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
                    onClick={() => exportCsv({ startDate: dateRange.startDate, endDate: dateRange.endDate, status: 'matched' })}
                    className="px-4 py-2 rounded-full bg-[#007A4D] hover:bg-[#00603C] text-white text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Export Settlement Ledger CSV
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                    <span className="text-xs text-emerald-800 font-mono block">Verified Settlement</span>
                    <span className="text-2xl font-bold text-[#007A4D] font-mono mt-1 block">
                      ₹{(dashboardData?.settlement?.verifiedInflow ?? 177700).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                    <span className="text-xs text-gray-500 font-mono block">Total Inflow</span>
                    <span className="text-2xl font-bold text-gray-900 font-mono mt-1 block">
                      ₹{(dashboardData?.ledger?.inflow ?? 226500).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                    <span className="text-xs text-amber-800 font-mono block">Pending Authorization</span>
                    <span className="text-2xl font-bold text-amber-800 font-mono mt-1 block">
                      ₹{(dashboardData?.settlement?.pendingSettlement ?? 48800).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
              initialFilter={exceptionsFilter}
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
              onExport={exportCsv}
              txCount={transactions.length}
            />
          )}
        </div>
      )}

      {/* ── Slide-in Ledger Copilot Drawer ── */}
      <SettlementPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />

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
      />
    </Layout>
  );
}
