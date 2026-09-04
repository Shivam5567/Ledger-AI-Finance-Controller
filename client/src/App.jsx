import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import EmptyState from './components/EmptyState';
import HeroSummary from './components/HeroSummary';
import AgentTraceInline from './components/AgentTraceInline';
import ReportPanel from './components/ReportPanel';
import ForecastCard from './components/ForecastCard';
import TransactionTable from './components/TransactionTable';
import ExceptionsPage from './components/ExceptionsPage';
import SettingsPage from './components/SettingsPage';
import SettlementPanel from './components/SettlementPanel';
import { useTransactions, useSummary, useIngest, useRunAgent, useAction, useExport } from './hooks/useApi';

export default function App() {
  const [activeTab, setActiveTab]       = useState('dashboard');
  const [hasIngested, setHasIngested]   = useState(false);
  const [hasRunAgent, setHasRunAgent]   = useState(false);
  const [agentStage, setAgentStage]     = useState(null);
  const [agentProgress, setAgentProgress] = useState(0);
  const [agentResult, setAgentResult]   = useState(null);
  const [chatOpen, setChatOpen]         = useState(false);

  const { transactions, refetch: refetchTx }     = useTransactions();
  const { summary,      refetch: refetchSummary } = useSummary();
  const { ingest, loading: isIngesting }          = useIngest();
  const { approve, dismiss, reset }               = useAction();
  const { exportCsv }                             = useExport();

  // Check on initial load if data already exists in DB
  useEffect(() => {
    refetchTx();
    refetchSummary();
  }, [refetchTx, refetchSummary]);

  useEffect(() => {
    if (transactions.length > 0) {
      setHasIngested(true);
      // If transactions already have categories or flags, agent has been run
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
  };

  const handleDismiss = async (id) => {
    await dismiss(id);
    await refetchTx();
    await refetchSummary();
  };

  const handleReset = async (id) => {
    await reset(id);
    await refetchTx();
    await refetchSummary();
  };

  // Calculate exception count for sidebar badge
  const unresolvedExceptionCount = transactions.filter(
    (t) =>
      ((t.flags && t.flags.length > 0) || t.match_status === 'exception') &&
      t.action_status !== 'approved' &&
      t.action_status !== 'dismissed'
  ).length;

  // Title mappings
  const pageTitles = {
    dashboard: {
      title: 'Dashboard',
      subtitle: `${transactions.length} transactions indexed · automated reconciliation controller`,
    },
    transactions: {
      title: 'Transactions',
      subtitle: `Viewing all ${transactions.length} indexed transactions`,
    },
    exceptions: {
      title: 'Exceptions',
      subtitle: `${unresolvedExceptionCount} items flagged for human review`,
    },
    forecast: {
      title: 'Spend Forecast',
      subtitle: 'Next-month forward projections based on 2mo history',
    },
    settings: {
      title: 'Settings',
      subtitle: 'Engine status, model mapping, and agent memory rules',
    },
  };

  const currentHeader = pageTitles[activeTab] || pageTitles.dashboard;

  return (
    <Layout
      sidebar={
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          exceptionCount={unresolvedExceptionCount}
          transactionCount={transactions.length}
        />
      }
      topbar={
        <TopBar
          title={currentHeader.title}
          subtitle={hasIngested ? currentHeader.subtitle : null}
          onRunAgent={handleRunAgent}
          isRunning={isRunning}
          onToggleChat={() => setChatOpen(prev => !prev)}
          chatOpen={chatOpen}
          hasIngested={hasIngested}
          onIngest={handleIngest}
          isIngesting={isIngesting}
          onExport={exportCsv}
          hasRunAgent={hasRunAgent}
        />
      }
    >
      <div className="flex flex-col gap-8 pb-16">
        {/* ── 1. Empty State (when no transactions loaded) ── */}
        {!hasIngested && (
          <EmptyState onIngest={handleIngest} isIngesting={isIngesting} />
        )}

        {/* ── Loaded State ── */}
        {hasIngested && (
          <>
            {/* ── View: Dashboard ── */}
            {activeTab === 'dashboard' && (
              <div className="flex flex-col gap-8 animate-fade-in">
                {/* Agent Thinking Trace (Inline step list) */}
                {(isRunning || agentResult || agentStage) && (
                  <AgentTraceInline
                    currentStage={agentStage}
                    isRunning={isRunning}
                    agentResult={agentResult}
                    txCount={transactions.length || 55}
                  />
                )}

                {/* Hero Summary: Net Position + 3 supporting stats */}
                <HeroSummary summary={summary} transactions={transactions} />

                {/* Report Panel: prominent match rate bar + exception breakdown */}
                <ReportPanel
                  hasRunAgent={hasRunAgent}
                  onViewExceptions={() => setActiveTab('exceptions')}
                />

                {/* Forecast Card: next month projected spend */}
                <ForecastCard summary={summary} />

                {/* Transaction Table: spreadsheet clean look */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[15px] font-semibold text-[#F5F5F5] tracking-tight">
                      Recent Activity
                    </h3>
                    <button
                      onClick={() => setActiveTab('transactions')}
                      className="text-[13px] text-[#4F6EF7] hover:text-[#3D5DE8] font-medium transition-colors cursor-pointer"
                    >
                      View full ledger →
                    </button>
                  </div>
                  <TransactionTable
                    transactions={transactions}
                    onApprove={handleApprove}
                    onDismiss={handleDismiss}
                    onReset={handleReset}
                  />
                </div>
              </div>
            )}

            {/* ── View: Transactions ── */}
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

            {/* ── View: Exceptions ── */}
            {activeTab === 'exceptions' && (
              <ExceptionsPage
                transactions={transactions}
                onApprove={handleApprove}
                onDismiss={handleDismiss}
              />
            )}

            {/* ── View: Forecast ── */}
            {activeTab === 'forecast' && (
              <div className="animate-fade-in flex flex-col gap-6 max-w-4xl">
                <ForecastCard summary={summary} />
              </div>
            )}

            {/* ── View: Settings ── */}
            {activeTab === 'settings' && (
              <SettingsPage
                onIngest={handleIngest}
                isIngesting={isIngesting}
                onExport={exportCsv}
                txCount={transactions.length}
              />
            )}
          </>
        )}
      </div>

      {/* ── Slide-in Settlement Q&A Panel ── */}
      <SettlementPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </Layout>
  );
}
