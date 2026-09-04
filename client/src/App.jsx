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

  // Date range and interval filter state for unified dashboard
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
    label: 'All Transactions (01 Jul - 04 Aug, 2026)',
  });
  const [interval, setIntervalState] = useState('weekly');

  // Transaction Detail Modal state
  const [selectedTx, setSelectedTx] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { transactions, refetch: refetchTx }     = useTransactions();
  const { summary,      refetch: refetchSummary } = useSummary();
  const {
    data: dashboardData,
    loading: isDashboardLoading,
    lastSyncedAt,
    refetch: refetchDashboard,
  } = useDashboard({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    interval,
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

  return (
    <Layout
      topnav={
        <QuixoticTopNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          exceptionCount={unresolvedExceptionCount}
          onToggleChat={() => setChatOpen(prev => !prev)}
          onReload={handleIngest}
        />
      }
      dock={
        <QuixoticDock
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onToggleChat={() => setChatOpen(prev => !prev)}
          onReload={handleIngest}
          isReloading={isIngesting}
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
            lastSyncedAt={lastSyncedAt}
            onRefresh={refetchDashboard}
          />
        )
      }
    >
      {/* ── 1. Empty State (when no transactions loaded at all) ── */}
      {!hasIngested ? (
        <EmptyState onIngest={handleIngest} isIngesting={isIngesting} />
      ) : (
        <div className="flex flex-col gap-6 animate-fade-in pb-12">
          {/* ── Autonomous Thinking Trace Banner (during/after agent run) ── */}
          {(isRunning || agentResult || agentStage) && (
            <AgentTraceInline
              currentStage={agentStage}
              isRunning={isRunning}
              agentResult={agentResult}
              txCount={transactions.length || 55}
            />
          )}

          {/* ── Empty State for Selected Date Range with 0 Transactions ── */}
          {dashboardData && dashboardData.ledger?.transactionCount === 0 && (
            <div className="p-6 rounded-2xl bg-amber-50/80 border border-amber-200 text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-lg mb-2">
                📅
              </div>
              <h4 className="text-sm font-bold text-amber-900 mb-1">
                No transactions found for this date range
              </h4>
              <p className="text-xs text-amber-700 mb-3 max-w-md">
                There are no ledger entries between {dateRange.startDate || 'start'} and {dateRange.endDate || 'end'}.
              </p>
              <button
                onClick={() => setDateRange({ startDate: '', endDate: '', label: 'All Transactions (01 Jul - 04 Aug, 2026)' })}
                className="px-4 py-2 rounded-full bg-white border border-amber-300 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition-colors cursor-pointer shadow-xs"
              >
                Reset to All Transactions
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
                    transactions={transactions}
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
                    transactions={transactions}
                    loading={isDashboardLoading}
                    onViewExceptions={() => setActiveTab('exceptions')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── VIEW: Reports ── */}
          {activeTab === 'reports' && (
            <div className="flex flex-col gap-6 max-w-5xl">
              <ReportPanel
                hasRunAgent={hasRunAgent}
                onViewExceptions={() => setActiveTab('exceptions')}
              />
              <ForecastCard summary={summary} />
            </div>
          )}

          {/* ── VIEW: Documents / Transactions Ledger ── */}
          {activeTab === 'transactions' && (
            <div className="animate-fade-in">
              <TransactionTable
                transactions={transactions}
                onApprove={handleApprove}
                onDismiss={handleDismiss}
                onReset={handleReset}
              />
            </div>
          )}

          {/* ── VIEW: Exceptions Queue ── */}
          {activeTab === 'exceptions' && (
            <ExceptionsPage
              transactions={transactions}
              onApprove={handleApprove}
              onDismiss={handleDismiss}
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
