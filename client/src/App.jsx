import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { QuixoticTopNav, QuixoticDock, QuixoticHeaderRow } from './components/QuixoticNavigation';
import {
  QuixoticCardWidget,
  QuixoticBarChartCard,
  QuixoticBalanceCard,
  QuixoticPaymentHistoryCard,
  QuixoticCreditAndExceptionsCard,
} from './components/QuixoticDashboardCards';
import EmptyState from './components/EmptyState';
import AgentTraceInline from './components/AgentTraceInline';
import ReportPanel from './components/ReportPanel';
import ForecastCard from './components/ForecastCard';
import TransactionTable from './components/TransactionTable';
import ExceptionsPage from './components/ExceptionsPage';
import SettingsPage from './components/SettingsPage';
import SettlementPanel from './components/SettlementPanel';
import { useTransactions, useSummary, useIngest, useRunAgent, useAction, useExport } from './hooks/useApi';

export default function App() {
  const [activeTab, setActiveTab]         = useState('dashboard');
  const [hasIngested, setHasIngested]     = useState(false);
  const [hasRunAgent, setHasRunAgent]     = useState(false);
  const [agentStage, setAgentStage]       = useState(null);
  const [agentProgress, setAgentProgress] = useState(0);
  const [agentResult, setAgentResult]     = useState(null);
  const [chatOpen, setChatOpen]           = useState(false);
  const [reportData, setReportData]       = useState(null);

  const { transactions, refetch: refetchTx }     = useTransactions();
  const { summary,      refetch: refetchSummary } = useSummary();
  const { ingest, loading: isIngesting }          = useIngest();
  const { approve, dismiss, reset }               = useAction();
  const { exportCsv }                             = useExport();

  // Fetch report data for reconciliation stats
  const fetchReport = async () => {
    try {
      const res = await fetch('/api/report');
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (e) {
      console.warn('Report fetch error:', e);
    }
  };

  useEffect(() => {
    refetchTx();
    refetchSummary();
    fetchReport();
  }, [refetchTx, refetchSummary]);

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
      refetchTx();
      refetchSummary();
      fetchReport();
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
      await refetchTx();
      await refetchSummary();
      await fetchReport();
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
    await refetchTx();
    await refetchSummary();
    await fetchReport();
  };

  const handleDismiss = async (id) => {
    await dismiss(id);
    await refetchTx();
    await refetchSummary();
    await fetchReport();
  };

  const handleReset = async (id) => {
    await reset(id);
    await refetchTx();
    await refetchSummary();
    await fetchReport();
  };

  // Calculate exception count for sidebar badge
  const unresolvedExceptionCount = transactions.filter(
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
            txCount={transactions.length}
            onToggleChat={() => setChatOpen(true)}
          />
        )
      }
    >
      {/* ── 1. Empty State (when no transactions loaded) ── */}
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

          {/* ── VIEW: Dashboard (Exact 5-Card Layout from Reference Image) ── */}
          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-6">
              {/* Row 1: 3 Top Cards (VISA Card, Bar Chart, Wave Balance Card) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Card 1: Payment Goal with VISA Credit Card */}
                <QuixoticCardWidget summary={summary} transactions={transactions} />

                {/* Card 2: Engagement / Reconciliation Rate Bar Chart with hatched bars */}
                <QuixoticBarChartCard report={reportData} />

                {/* Card 3: Total Balance & Wave Area Chart */}
                <QuixoticBalanceCard
                  summary={summary}
                  onRunAgent={handleRunAgent}
                  isRunning={isRunning}
                  onToggleChat={() => setChatOpen(true)}
                  onExport={exportCsv}
                />
              </div>

              {/* Row 2: Payment History Table (2 cols) + Credit & Exceptions Card (1 col) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Card 4: Payment History (Spans 2 columns on large screens) */}
                <div className="lg:col-span-2">
                  <QuixoticPaymentHistoryCard
                    transactions={transactions}
                    onApprove={handleApprove}
                    onDismiss={handleDismiss}
                    onViewAll={() => setActiveTab('transactions')}
                  />
                </div>

                {/* Card 5: Amount of Credit & Mandatory Payments / Exceptions Stack */}
                <div className="lg:col-span-1">
                  <QuixoticCreditAndExceptionsCard
                    transactions={transactions}
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

          {/* ── VIEW: Documents / Transactions ── */}
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

      {/* ── Slide-in Settlement Q&A Drawer ── */}
      <SettlementPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </Layout>
  );
}
